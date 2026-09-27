import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  globalFinishedGoods, 
  globalRecipes, 
  addWaste, 
  updateStock, 
  addFinishedGood, 
  updateFinishedGood, 
  deleteFinishedGood, 
  persistData,
  syncFromCloud 
} from '../store/mockDb';
import { formatDisplay, toBase } from '../utils/unitConverter';

export default function FinishedGoodsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [system, setSystem] = useState('metric'); // 'metric' | 'imperial'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'direct' | 'recipe' | 'low' | 'inStock'
  
  // Waste Modal State
  const [isWasteModalVisible, setIsWasteModalVisible] = useState(false);
  const [wasteItem, setWasteItem] = useState(null);
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteUnit, setWasteUnit] = useState('unid.');

  // Edit / Add Item Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Nuevo Directo, object = Editar
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Bebidas');
  const [formStock, setFormStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formCost, setFormCost] = useState('0.00');
  const [formPrice, setFormPrice] = useState('0.00');

  // Refrescar datos
  const refreshData = useCallback(async () => {
    try {
      if (typeof syncFromCloud === 'function') await syncFromCloud();
    } catch (e) {}
    setItems([...globalFinishedGoods]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
      const interval = setInterval(refreshData, 4000);
      return () => clearInterval(interval);
    }, [refreshData])
  );

  // Obtener info de la receta asociada (precio, categoría, si tiene ingredientes)
  const getItemDetails = useCallback((item) => {
    const recipe = globalRecipes.find(r => r.outputId === item.id || r.name.toLowerCase() === item.name.toLowerCase());
    const isDirect = item.isDirectSale || !recipe || !recipe.ingredients || recipe.ingredients.length === 0;
    const price = recipe ? (parseFloat(recipe.price) || 0) : 0;
    const category = recipe ? (recipe.category || 'General') : 'Directo';
    return { recipe, isDirect, price, category };
  }, []);

  // --- FILTRADO Y BÚSQUEDA ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      const { isDirect } = getItemDetails(item);
      const isLow = (item.baseStock || 0) <= (item.minStock || 0);

      if (filterType === 'direct') return isDirect;
      if (filterType === 'recipe') return !isDirect;
      if (filterType === 'low') return isLow;
      if (filterType === 'inStock') return (item.baseStock || 0) > 0;
      return true;
    });
  }, [items, searchQuery, filterType, getItemDetails]);

  // --- KPIs DE RESUMEN ---
  const totalItemsCount = items.length;
  const totalStockUnits = items.reduce((sum, i) => sum + (parseFloat(i.baseStock) || 0), 0);
  const lowStockCount = items.filter(i => (i.baseStock || 0) <= (i.minStock || 0)).length;
  const totalInventoryValue = items.reduce((sum, i) => sum + ((parseFloat(i.baseStock) || 0) * (parseFloat(i.baseCost) || 0)), 0);

  // --- MODAL CREAR NUEVO DIRECTO ---
  const openNewItemModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Bebidas');
    setFormStock('24');
    setFormMinStock('6');
    setFormCost('1.00');
    setFormPrice('2.50');
    setIsEditModalVisible(true);
  };

  // --- MODAL EDITAR PRODUCTO EXISTENTE ---
  const openEditModal = (item) => {
    setEditingItem(item);
    const { recipe, category, price } = getItemDetails(item);

    setFormName(item.name || '');
    setFormCategory(category || 'General');
    setFormStock(String(item.baseStock !== undefined ? item.baseStock : 0));
    setFormMinStock(String(item.minStock !== undefined ? item.minStock : 10));
    setFormCost(String(item.baseCost !== undefined ? item.baseCost : 0));
    setFormPrice(String(price || 0));
    setIsEditModalVisible(true);
  };

  // --- GUARDAR CAMBIOS (CREAR O ACTUALIZAR) ---
  const handleSaveItem = () => {
    if (!formName.trim()) {
      if (Platform.OS === 'web') window.alert("El nombre del producto es obligatorio.");
      else Alert.alert("Error", "El nombre del producto es obligatorio.");
      return;
    }

    const parsedStock = parseFloat(formStock) || 0;
    const parsedMinStock = parseFloat(formMinStock) || 0;
    const parsedCost = parseFloat(formCost) || 0;
    const parsedPrice = parseFloat(formPrice) || 0;

    if (editingItem) {
      // Actualizar producto existente
      updateFinishedGood(
        editingItem.id, 
        {
          name: formName.trim(),
          baseStock: parsedStock,
          minStock: parsedMinStock,
          baseCost: parsedCost
        },
        {
          price: parsedPrice,
          category: formCategory.trim()
        }
      );
      if (Platform.OS === 'web') window.alert("✅ Producto actualizado exitosamente.");
    } else {
      // Crear nuevo producto directo
      addFinishedGood(
        {
          name: formName.trim(),
          baseStock: parsedStock,
          minStock: parsedMinStock,
          baseCost: parsedCost,
          baseType: 'unit',
          baseUnit: 'Unidades',
          isDirectSale: true
        },
        {
          category: formCategory.trim() || 'Bebidas',
          price: parsedPrice
        }
      );
      if (Platform.OS === 'web') window.alert("✅ Producto directo agregado y listo para venta en POS.");
    }

    persistData();
    refreshData();
    setIsEditModalVisible(false);
  };

  // --- ELIMINAR PRODUCTO ---
  const handleDeleteItem = (itemToDelete) => {
    const item = itemToDelete || editingItem;
    if (!item) return;

    const confirmMessage = `¿Estás seguro de que deseas eliminar "${item.name}"? Esta acción removerá el stock y su producto de venta.`;

    const executeDelete = () => {
      deleteFinishedGood(item.id);
      persistData();
      refreshData();
      setIsEditModalVisible(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        "Confirmar Eliminación",
        confirmMessage,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: executeDelete }
        ]
      );
    }
  };

  // --- REGISTRAR MERMA ---
  const openWasteModal = (item) => {
    setWasteItem(item);
    setWasteUnit('unid.');
    setWasteAmount('');
    setIsWasteModalVisible(true);
  };

  const handleProcessWaste = () => {
    if (!wasteAmount) return;
    const amountNum = parseFloat(wasteAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const lostValue = amountNum * (wasteItem.baseCost || 0);

    addWaste({
      id: `WST-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      ingredientId: wasteItem.id,
      ingredientName: wasteItem.name,
      lostValue,
      originalAmount: amountNum,
      originalUnit: wasteUnit
    });

    updateStock(wasteItem.id, -amountNum);
    persistData();
    refreshData();
    setIsWasteModalVisible(false);
    setWasteAmount('');
    if (Platform.OS === 'web') window.alert("✅ Merma registrada con éxito.");
  };

  // Renderizar fila de producto
  const renderItem = ({ item }) => {
    const isLow = (item.baseStock || 0) <= (item.minStock || 0);
    const { isDirect, price, category } = getItemDetails(item);
    const totalRowValue = (item.baseStock || 0) * (item.baseCost || 0);

    return (
      <View style={[styles.row, isLow && styles.rowLow]}>
        {/* Producto y Categoría */}
        <View style={{ flex: 2.2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isLow && <MaterialCommunityIcons name="alert" size={16} color="#ef4444" style={{ marginRight: 6 }} />}
            <Text style={[styles.cellTxt, { fontWeight: 'bold', fontSize: 14 }]}>{item.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <View style={[styles.badge, isDirect ? styles.badgeDirect : styles.badgeRecipe]}>
              <Text style={[styles.badgeTxt, isDirect ? styles.badgeTxtDirect : styles.badgeTxtRecipe]}>
                {isDirect ? '⚡ Sin Receta (Directo)' : '🍲 Con Receta'}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#64748b' }}>• {category}</Text>
          </View>
        </View>

        {/* Stock Actual */}
        <View style={{ flex: 1.3 }}>
          <Text style={[styles.cellTxt, { color: isLow ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: 14 }]}>
            {parseFloat(item.baseStock || 0).toFixed(0)} unid.
          </Text>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>
            {isLow ? (item.baseStock <= 0 ? 'Agotado' : 'Bajo Stock') : 'Disponible'}
          </Text>
        </View>

        {/* Min Stock */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.cellTxt, { color: '#64748b' }]}>
            {parseFloat(item.minStock || 0).toFixed(0)} unid.
          </Text>
        </View>

        {/* Costo Unitario */}
        <View style={{ flex: 1.1 }}>
          <Text style={[styles.cellTxt, { color: '#475569' }]}>
            $ {parseFloat(item.baseCost || 0).toFixed(2)}
          </Text>
        </View>

        {/* Precio Venta (POS) */}
        <View style={{ flex: 1.1 }}>
          <Text style={[styles.cellTxt, { color: '#0284c7', fontWeight: '600' }]}>
            $ {parseFloat(price || 0).toFixed(2)}
          </Text>
        </View>

        {/* Valor Total Inventario */}
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.cellTxt, { fontWeight: 'bold', color: '#1e293b' }]}>
            $ {totalRowValue.toFixed(2)}
          </Text>
        </View>

        {/* Acciones */}
        <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
          {/* Botón Editar */}
          <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
            <MaterialCommunityIcons name="pencil-outline" size={15} color="#0284c7" />
            <Text style={styles.editBtnTxt}>Editar</Text>
          </TouchableOpacity>

          {/* Botón Merma */}
          <TouchableOpacity style={styles.wasteBtn} onPress={() => openWasteModal(item)}>
            <MaterialCommunityIcons name="delete-outline" size={15} color="#d97706" />
            <Text style={styles.wasteBtnTxt}>Merma</Text>
          </TouchableOpacity>

          {/* Botón Borrar */}
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item)}>
            <MaterialCommunityIcons name="trash-can-outline" size={15} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Header Superior */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('InventoryHub')} style={{ alignSelf: 'flex-start' }}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver al Hub</Text>
            </View>
          </TouchableOpacity>
          <View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
            <View>
              <Text style={styles.pageTitle}>Almacén de Productos Terminados</Text>
              <Text style={styles.pageSubtitle}>Administra productos listos para la venta, bebidas directas, platos y control de stock</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.addBtn} onPress={openNewItemModal}>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <Text style={styles.addBtnTxt}>➕ Nuevo Directo (Sin Receta)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tarjetas KPI de Resumen */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
              <MaterialCommunityIcons name="food-drumstick" size={24} color="#0284c7" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>PRODUCTOS</Text>
              <Text style={styles.kpiValue}>{totalItemsCount}</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#ecfdf5' }]}>
              <MaterialCommunityIcons name="layers-triple-outline" size={24} color="#10b981" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>STOCK EN UNIDADES</Text>
              <Text style={[styles.kpiValue, { color: '#10b981' }]}>{totalStockUnits.toFixed(0)}</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="currency-usd" size={24} color="#d97706" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>VALOR EN INVENTARIO</Text>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>$ {totalInventoryValue.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#fef2f2' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>STOCK BAJO / AGOTADO</Text>
              <Text style={[styles.kpiValue, { color: lowStockCount > 0 ? '#ef4444' : '#64748b' }]}>
                {lowStockCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Tarjeta Principal con Tabla y Filtros */}
        <View style={styles.card}>
          
          {/* Barra de Filtros y Búsqueda */}
          <View style={styles.toolbar}>
            {/* Buscador */}
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Buscar por nombre de producto..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Pestañas de Filtro */}
            <View style={styles.filterPills}>
              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]} 
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'all' && styles.filterPillTxtActive]}>Todos ({items.length})</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'direct' && styles.filterPillActive]} 
                onPress={() => setFilterType('direct')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'direct' && styles.filterPillTxtActive]}>⚡ Sin Receta</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'inStock' && styles.filterPillActive]} 
                onPress={() => setFilterType('inStock')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'inStock' && styles.filterPillTxtActive]}>Con Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'low' && styles.filterPillActive]} 
                onPress={() => setFilterType('low')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'low' && styles.filterPillTxtActive, lowStockCount > 0 && { color: '#ef4444' }]}>
                  ⚠️ Bajo Stock ({lowStockCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Encabezado de la Tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.2 }]}>PRODUCTO / TIPO</Text>
            <Text style={[styles.th, { flex: 1.3 }]}>STOCK ACTUAL</Text>
            <Text style={[styles.th, { flex: 1 }]}>MIN STOCK</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>COSTO COMPRA</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>PRECIO VENTA</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>VALOR TOTAL</Text>
            <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACCIONES</Text>
          </View>

          {/* Listado de Productos */}
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateTxt}>No se encontraron productos con los filtros seleccionados.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          )}

        </View>

      </ScrollView>

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingItem ? '✏️ Modificar Producto' : '➕ Nuevo Producto Directo'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {editingItem 
                    ? 'Edita las cantidades de stock, precios y datos del producto'
                    : 'Agrega un producto listo para la venta directa sin receta (ej: cervezas, refrescos, postres)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Formulario */}
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.label}>NOMBRE DEL PRODUCTO *</Text>
                <TextInput 
                  style={styles.input} 
                  value={formName} 
                  onChangeText={setFormName} 
                  placeholder="Ej: Cerveza Heineken, Coca Cola 1.5L, Postre Tres Leches..."
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CATEGORÍA</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formCategory} 
                    onChangeText={setFormCategory} 
                    placeholder="Bebidas, Platos, Postres..." 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>STOCK ACTUAL (UNIDADES) *</Text>
                  <TextInput 
                    style={[styles.input, { fontWeight: 'bold', color: '#10b981' }]} 
                    value={formStock} 
                    onChangeText={setFormStock} 
                    keyboardType="numeric" 
                    placeholder="Ej: 50" 
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>STOCK MÍNIMO (ALERTA)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formMinStock} 
                    onChangeText={setFormMinStock} 
                    keyboardType="numeric" 
                    placeholder="Ej: 10" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>COSTO DE COMPRA ($)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formCost} 
                    onChangeText={setFormCost} 
                    keyboardType="numeric" 
                    placeholder="0.00" 
                  />
                </View>
              </View>

              <View>
                <Text style={styles.label}>PRECIO DE VENTA EN FACTURACIÓN / POS ($)</Text>
                <TextInput 
                  style={[styles.input, { fontWeight: 'bold', color: '#0284c7' }]} 
                  value={formPrice} 
                  onChangeText={setFormPrice} 
                  keyboardType="numeric" 
                  placeholder="Ej: 2.50" 
                />
              </View>
            </View>

            {/* Acciones del Modal */}
            <View style={styles.modalFooter}>
              {editingItem && (
                <TouchableOpacity 
                  style={styles.deleteModalBtn} 
                  onPress={() => handleDeleteItem(editingItem)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  <Text style={styles.deleteModalBtnTxt}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveItem}>
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Guardar Cambios' : 'Crear Producto'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* MODAL REGISTRAR MERMA */}
      <Modal visible={isWasteModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Registrar Merma / Pérdida</Text>
                {wasteItem && <Text style={styles.modalSubtitle}>{wasteItem.name}</Text>}
              </View>
              <TouchableOpacity onPress={() => setIsWasteModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>CANTIDAD PERDIDA O DAÑADA</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={wasteAmount} 
                onChangeText={setWasteAmount} 
                keyboardType="numeric" 
                placeholder="0" 
                autoFocus={true}
              />
              <View style={[styles.input, { width: 90, justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
                <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>Unidades</Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
              Esta cantidad se descontará del inventario y se registrará en el reporte de mermas.
            </Text>

            <View style={styles.modalFooter}>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWasteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#ef4444' }]} onPress={handleProcessWaste}>
                <Text style={styles.saveBtnText}>Descontar Merma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 25 },
  
  headerSection: { marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // KPIs
  kpiContainer: { flexDirection: 'row', gap: 15, marginBottom: 20, flexWrap: 'wrap' },
  kpiCard: { flex: 1, minWidth: 200, backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  kpiIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  kpiLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },

  // Card & Table
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 15, flexWrap: 'wrap' },
  searchBox: { flex: 1, minWidth: 260, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1e293b', outlineStyle: 'none' },

  filterPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
  filterPillActive: { backgroundColor: '#0f172a' },
  filterPillTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterPillTxtActive: { color: '#fff' },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 8 },
  th: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLow: { backgroundColor: '#fff7ed', borderRadius: 8, paddingHorizontal: 8 },
  cellTxt: { fontSize: 13, color: '#1e293b' },

  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeDirect: { backgroundColor: '#ecfdf5' },
  badgeRecipe: { backgroundColor: '#eff6ff' },
  badgeTxt: { fontSize: 10, fontWeight: 'bold' },
  badgeTxtDirect: { color: '#059669' },
  badgeTxtRecipe: { color: '#2563eb' },

  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, gap: 4 },
  editBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#0284c7' },

  wasteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, gap: 4 },
  wasteBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#d97706' },

  deleteBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  emptyState: { paddingVertical: 50, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyStateTxt: { color: '#94a3b8', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 25, width: '100%', maxWidth: 520, ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 3 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 6, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1e293b', outlineStyle: 'none' },
  
  modalFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 22, gap: 10 },
  deleteModalBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, gap: 4 },
  deleteModalBtnTxt: { fontSize: 12, fontWeight: 'bold', color: '#ef4444' },
  cancelBtn: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 8 },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  saveBtn: { backgroundColor: '#10b981', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
