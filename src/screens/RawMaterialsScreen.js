import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalRawMaterials, addWaste, updateStock, addRawMaterial, updateRawMaterial, deleteRawMaterial, persistData } from '../store/mockDb';
import { formatDisplay, toBase } from '../utils/unitConverter';

export default function RawMaterialsScreen({ navigation }) {
  const [ingredients, setIngredients] = useState([]);
  const [system, setSystem] = useState('metric'); // 'metric' | 'imperial'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'weight' | 'volume' | 'unit' | 'low'
  
  // Waste Modal State
  const [isWasteModalVisible, setIsWasteModalVisible] = useState(false);
  const [wasteIngredient, setWasteIngredient] = useState(null);
  const [wasteAmount, setWasteAmount] = useState('');
  const [wasteUnit, setWasteUnit] = useState('');

  // Edit / Add Item Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = Crear nuevo, object = Editar
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('weight'); // 'weight' | 'volume' | 'unit'
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formCost, setFormCost] = useState('');

  // Cargar ingredientes al entrar a la pantalla
  const refreshData = useCallback(() => {
    setIngredients([...globalRawMaterials]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // --- FILTRADO Y BÚSQUEDA ---
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchSearch) return false;

      if (filterType === 'low') return item.baseStock <= item.minStock;
      if (filterType === 'weight') return item.baseType === 'weight';
      if (filterType === 'volume') return item.baseType === 'volume';
      if (filterType === 'unit') return item.baseType === 'unit';
      return true;
    });
  }, [ingredients, searchQuery, filterType]);

  // --- KPIs DE RESUMEN ---
  const totalItemsCount = ingredients.length;
  const lowStockCount = ingredients.filter(i => i.baseStock <= i.minStock).length;
  const totalInventoryValue = ingredients.reduce((sum, i) => sum + ((i.baseStock || 0) * (i.baseCost || 0)), 0);

  // --- MERMA (WASTE) ---
  const openWasteModal = (ing) => {
    setWasteIngredient(ing);
    setWasteUnit(ing.baseType === 'weight' ? (system === 'metric' ? 'g' : 'oz') : (system === 'metric' ? 'ml' : 'fl oz'));
    setIsWasteModalVisible(true);
  };

  const handleProcessWaste = () => {
    if (!wasteAmount) return;
    const amountNum = parseFloat(wasteAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      if (Platform.OS === 'web') window.alert("Ingrese una cantidad válida para la merma.");
      else Alert.alert("Error", "Ingrese una cantidad válida para la merma.");
      return;
    }

    const baseAmount = toBase(amountNum, wasteUnit);
    const lostValue = baseAmount * (wasteIngredient.baseCost || 0);

    addWaste({
      id: `WST-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      ingredientId: wasteIngredient.id,
      ingredientName: wasteIngredient.name,
      lostValue,
      originalAmount: amountNum,
      originalUnit: wasteUnit
    });

    updateStock(wasteIngredient.id, -baseAmount);
    persistData();

    refreshData();
    setIsWasteModalVisible(false);
    setWasteAmount('');
  };

  // --- CREAR / EDITAR INSUMO ---
  const openNewItemModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormType('weight');
    setFormStock('0');
    setFormMinStock('5');
    setFormCost('0.00');
    setIsEditModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.baseType || 'weight');

    // Convertir stock base interno a unidades amigables de interfaz
    // Peso: gramos -> kg. Volumen: ml -> Litros. Unidades: unidades
    const multiplier = item.baseType === 'unit' ? 1 : 1000;
    const humanStock = ((item.baseStock || 0) / multiplier).toFixed(2);
    const humanMinStock = ((item.minStock || 0) / multiplier).toFixed(2);
    const humanCost = ((item.baseCost || 0) * multiplier).toFixed(2);

    setFormStock(parseFloat(humanStock).toString());
    setFormMinStock(parseFloat(humanMinStock).toString());
    setFormCost(parseFloat(humanCost).toString());
    setIsEditModalVisible(true);
  };

  const handleSaveItem = () => {
    if (!formName.trim()) {
      if (Platform.OS === 'web') window.alert("El nombre del insumo es obligatorio.");
      else Alert.alert("Error", "El nombre del insumo es obligatorio.");
      return;
    }

    const multiplier = formType === 'unit' ? 1 : 1000;
    const parsedStock = parseFloat(formStock) || 0;
    const parsedMinStock = parseFloat(formMinStock) || 0;
    const parsedCost = parseFloat(formCost) || 0;

    // Calcular valores base internos (gramos, ml, o unidades)
    const baseStockVal = parsedStock * multiplier;
    const minStockVal = parsedMinStock * multiplier;
    const baseCostVal = parsedCost / multiplier;

    if (editingItem) {
      // Modificar existente
      updateRawMaterial(editingItem.id, {
        name: formName.trim(),
        baseType: formType,
        baseStock: baseStockVal,
        minStock: minStockVal,
        baseCost: baseCostVal
      });
      if (Platform.OS === 'web') window.alert("✅ Insumo actualizado exitosamente.");
    } else {
      // Crear nuevo
      addRawMaterial({
        name: formName.trim(),
        baseType: formType,
        baseStock: baseStockVal,
        minStock: minStockVal,
        baseCost: baseCostVal
      });
      if (Platform.OS === 'web') window.alert("✅ Insumo creado y añadido al almacén.");
    }

    persistData();
    refreshData();
    setIsEditModalVisible(false);
  };

  const handleDeleteItem = (itemToDelete) => {
    const item = itemToDelete || editingItem;
    if (!item) return;

    const confirmMessage = `¿Estás seguro de que deseas eliminar "${item.name}" del almacén? Esta acción no se puede deshacer.`;
    
    const executeDelete = () => {
      deleteRawMaterial(item.id);
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

  // Helper para etiquetas de unidades
  const getUnitLabel = (type) => {
    if (type === 'weight') return 'Kg';
    if (type === 'volume') return 'L';
    return 'Unid';
  };

  const renderItem = ({ item }) => {
    const isLow = (item.baseStock || 0) <= (item.minStock || 0);
    const stockDisplay = formatDisplay(item.baseStock || 0, item.baseType, system);
    const minDisplay = formatDisplay(item.minStock || 0, item.baseType, system);

    // Costo por unidad humana (por kg, por L o por unidad)
    const unitMultiplier = item.baseType === 'unit' ? 1 : 1000;
    const humanUnitCost = (item.baseCost || 0) * unitMultiplier;
    const unitLabel = getUnitLabel(item.baseType);
    const totalRowValue = (item.baseStock || 0) * (item.baseCost || 0);

    return (
      <View style={[styles.row, isLow && styles.rowLow]}>
        {/* INGREDIENTE */}
        <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.typeBadge, { backgroundColor: item.baseType === 'weight' ? '#e0f2fe' : item.baseType === 'volume' ? '#fef3c7' : '#f3e8ff' }]}>
            <MaterialCommunityIcons 
              name={item.baseType === 'weight' ? 'weight-kilogram' : item.baseType === 'volume' ? 'cup-water' : 'package-variant'} 
              size={14} 
              color={item.baseType === 'weight' ? '#0284c7' : item.baseType === 'volume' ? '#d97706' : '#9333ea'} 
            />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.cellTxt, { fontWeight: '700', fontSize: 13.5 }]}>{item.name}</Text>
            {isLow && (
              <View style={styles.alertPill}>
                <MaterialCommunityIcons name="alert" size={11} color="#ef4444" />
                <Text style={styles.alertPillText}>Stock Bajo</Text>
              </View>
            )}
          </View>
        </View>

        {/* STOCK ACTUAL */}
        <View style={{ flex: 1.5 }}>
          <Text style={[styles.cellTxt, { color: isLow ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: 14 }]}>
            {stockDisplay}
          </Text>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>
            {item.baseType === 'weight' ? `${(item.baseStock || 0).toLocaleString()} g` : item.baseType === 'volume' ? `${(item.baseStock || 0).toLocaleString()} ml` : 'Unidades'}
          </Text>
        </View>

        {/* MIN STOCK */}
        <View style={{ flex: 1.2 }}>
          <Text style={[styles.cellTxt, { color: '#64748b', fontSize: 13 }]}>{minDisplay}</Text>
        </View>

        {/* COSTO UNITARIO */}
        <View style={{ flex: 1.5 }}>
          <Text style={[styles.cellTxt, { fontWeight: '600', color: '#334155' }]}>
            $ {humanUnitCost.toFixed(2)} <Text style={{ fontSize: 11, color: '#94a3b8' }}>/ {unitLabel}</Text>
          </Text>
        </View>

        {/* VALOR TOTAL */}
        <View style={{ flex: 1.4 }}>
          <Text style={[styles.cellTxt, { fontWeight: '700', color: '#0f172a' }]}>
            $ {totalRowValue.toFixed(2)}
          </Text>
        </View>

        {/* ACCIONES */}
        <View style={styles.actionsCell}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => openEditModal(item)}
            title="Modificar insumo, cantidades y stock"
          >
            <MaterialCommunityIcons name="pencil-outline" size={15} color="#2563eb" />
            <Text style={styles.editBtnTxt}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.wasteBtn} 
            onPress={() => openWasteModal(item)}
            title="Registrar merma o daño"
          >
            <MaterialCommunityIcons name="trash-can-outline" size={15} color="#ef4444" />
            <Text style={styles.wasteBtnTxt}>Merma</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.navigate('InventoryHub')} style={{ marginRight: 15 }}>
                <View style={styles.backBtn}>
                  <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
                  <Text style={styles.backBtnText}>Volver</Text>
                </View>
              </TouchableOpacity>
              <View>
                <Text style={styles.pageTitle}>Almacén General (Materia Prima)</Text>
                <Text style={styles.pageSubtitle}>Modifica existencias, nombres, alertas de stock y registra mermas</Text>
              </View>
            </View>

            {/* Botón "+ Nuevo Insumo" */}
            <TouchableOpacity style={styles.primaryAddBtn} onPress={openNewItemModal}>
              <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
              <Text style={styles.primaryAddBtnTxt}>Nuevo Insumo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPIs Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="warehouse" size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>Total Insumos</Text>
              <Text style={styles.kpiValue}>{totalItemsCount}</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#ecfdf5' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color="#10b981" />
            </View>
            <View>
              <Text style={styles.kpiLabel}>Valor en Almacén</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>$ {totalInventoryValue.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: lowStockCount > 0 ? '#fef2f2' : '#f8fafc' }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={lowStockCount > 0 ? '#ef4444' : '#94a3b8'} />
            </View>
            <View>
              <Text style={styles.kpiLabel}>Alertas Stock Bajo</Text>
              <Text style={[styles.kpiValue, { color: lowStockCount > 0 ? '#ef4444' : '#64748b' }]}>
                {lowStockCount} {lowStockCount === 1 ? 'insumo' : 'insumos'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          
          {/* Toolbar: Search + Filters + Metric Switch */}
          <View style={styles.toolbar}>
            
            {/* Search Input */}
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Buscar insumo por nombre..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filterPillsContainer}>
              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'all' && styles.filterPillActive]} 
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'all' && styles.filterPillTxtActive]}>Todos ({ingredients.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'low' && styles.filterPillActiveLow]} 
                onPress={() => setFilterType('low')}
              >
                <MaterialCommunityIcons name="alert" size={12} color={filterType === 'low' ? '#fff' : '#ef4444'} style={{ marginRight: 4 }} />
                <Text style={[styles.filterPillTxt, filterType === 'low' && styles.filterPillTxtActiveLow]}>Bajo Stock ({lowStockCount})</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'weight' && styles.filterPillActive]} 
                onPress={() => setFilterType('weight')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'weight' && styles.filterPillTxtActive]}>Peso (Kg)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'volume' && styles.filterPillActive]} 
                onPress={() => setFilterType('volume')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'volume' && styles.filterPillTxtActive]}>Volumen (L)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterPill, filterType === 'unit' && styles.filterPillActive]} 
                onPress={() => setFilterType('unit')}
              >
                <Text style={[styles.filterPillTxt, filterType === 'unit' && styles.filterPillTxtActive]}>Unidades</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Measurement Switch */}
            <View style={styles.switchBox}>
              <View style={styles.switchToggle}>
                <TouchableOpacity 
                  style={[styles.switchBtn, system === 'metric' && styles.switchBtnActive]}
                  onPress={() => setSystem('metric')}
                >
                  <Text style={[styles.switchBtnTxt, system === 'metric' && styles.switchBtnTxtActive]}>Métrico</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.switchBtn, system === 'imperial' && styles.switchBtnActive]}
                  onPress={() => setSystem('imperial')}
                >
                  <Text style={[styles.switchBtnTxt, system === 'imperial' && styles.switchBtnTxtActive]}>Imperial</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.2 }]}>INSUMO / MATERIA PRIMA</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>STOCK ACTUAL</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>MIN STOCK</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>COSTO UNITARIO</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>VALOR TOTAL</Text>
            <Text style={[styles.th, { flex: 2, textAlign: 'center' }]}>ACCIONES</Text>
          </View>

          {/* Table Rows */}
          <FlatList
            data={filteredIngredients}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No se encontraron insumos</Text>
                <Text style={styles.emptySubtitle}>Intenta con otro término de búsqueda o agrega un nuevo insumo al almacén.</Text>
                <TouchableOpacity style={[styles.primaryAddBtn, { marginTop: 15 }]} onPress={openNewItemModal}>
                  <MaterialCommunityIcons name="plus-circle" size={16} color="#fff" />
                  <Text style={styles.primaryAddBtnTxt}>Crear Primer Insumo</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>

        {/* ================= MODAL: EDITAR / CREAR INSUMO ================= */}
        <Modal visible={isEditModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentLarge}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalHeaderIcon, { backgroundColor: editingItem ? '#eff6ff' : '#ecfdf5' }]}>
                    <MaterialCommunityIcons 
                      name={editingItem ? "pencil" : "plus-circle"} 
                      size={20} 
                      color={editingItem ? "#2563eb" : "#10b981"} 
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.modalTitle}>{editingItem ? 'Editar Insumo de Almacén' : 'Nuevo Insumo de Almacén'}</Text>
                    <Text style={styles.modalSubtitle}>
                      {editingItem ? `Ajusta el nombre, stock disponible o costos de "${editingItem.name}"` : 'Registra un nuevo ingrediente o producto base para tus recetas'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450 }}>
                {/* NOMBRE DEL INSUMO */}
                <Text style={styles.label}>NOMBRE DEL INSUMO *</Text>
                <TextInput 
                  style={styles.input} 
                  value={formName} 
                  onChangeText={setFormName} 
                  placeholder="Ej: Pollo Pechuga, Harina de Trigo, Aceite Vegetal..."
                  placeholderTextColor="#94a3b8"
                />

                {/* TIPO DE MEDIDA */}
                <Text style={styles.label}>TIPO DE MEDIDA</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity 
                    style={[styles.typeSelectBtn, formType === 'weight' && styles.typeSelectBtnActive]} 
                    onPress={() => setFormType('weight')}
                  >
                    <MaterialCommunityIcons name="weight-kilogram" size={18} color={formType === 'weight' ? '#fff' : '#64748b'} />
                    <Text style={[styles.typeSelectBtnTxt, formType === 'weight' && { color: '#fff' }]}>Peso (Kg / g)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.typeSelectBtn, formType === 'volume' && styles.typeSelectBtnActive]} 
                    onPress={() => setFormType('volume')}
                  >
                    <MaterialCommunityIcons name="cup-water" size={18} color={formType === 'volume' ? '#fff' : '#64748b'} />
                    <Text style={[styles.typeSelectBtnTxt, formType === 'volume' && { color: '#fff' }]}>Volumen (Litros / ml)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.typeSelectBtn, formType === 'unit' && styles.typeSelectBtnActive]} 
                    onPress={() => setFormType('unit')}
                  >
                    <MaterialCommunityIcons name="package-variant" size={18} color={formType === 'unit' ? '#fff' : '#64748b'} />
                    <Text style={[styles.typeSelectBtnTxt, formType === 'unit' && { color: '#fff' }]}>Unidad (Pzas / Cajas)</Text>
                  </TouchableOpacity>
                </View>

                {/* STOCK ACTUAL Y STOCK MÍNIMO */}
                <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                  
                  {/* STOCK ACTUAL */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>STOCK ACTUAL DISPONIBLE</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.innerInput} 
                        value={formStock} 
                        onChangeText={setFormStock} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                      />
                      <View style={styles.unitSuffix}>
                        <Text style={styles.unitSuffixText}>{getUnitLabel(formType)}</Text>
                      </View>
                    </View>
                    <Text style={styles.fieldHint}>
                      {formType === 'weight' ? `(= ${(parseFloat(formStock || 0) * 1000).toLocaleString()} gramos)` : formType === 'volume' ? `(= ${(parseFloat(formStock || 0) * 1000).toLocaleString()} ml)` : 'Unidades en existencia'}
                    </Text>
                  </View>

                  {/* STOCK MÍNIMO */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>ALERTA STOCK MÍNIMO</Text>
                    <View style={styles.inputWithUnit}>
                      <TextInput 
                        style={styles.innerInput} 
                        value={formMinStock} 
                        onChangeText={setFormMinStock} 
                        keyboardType="numeric" 
                        placeholder="5.00" 
                      />
                      <View style={styles.unitSuffix}>
                        <Text style={styles.unitSuffixText}>{getUnitLabel(formType)}</Text>
                      </View>
                    </View>
                    <Text style={styles.fieldHint}>
                      Avisa cuando el stock baje de esta cantidad
                    </Text>
                  </View>
                </View>

                {/* COSTO UNITARIO Y VALOR PROYECTADO */}
                <View style={{ flexDirection: 'row', gap: 15, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>COSTO UNITARIO ($ / {getUnitLabel(formType)})</Text>
                    <View style={styles.inputWithUnit}>
                      <View style={[styles.unitSuffix, { borderRightWidth: 1, borderLeftWidth: 0, borderColor: '#e2e8f0' }]}>
                        <Text style={styles.unitSuffixText}>$</Text>
                      </View>
                      <TextInput 
                        style={[styles.innerInput, { paddingLeft: 10 }]} 
                        value={formCost} 
                        onChangeText={setFormCost} 
                        keyboardType="numeric" 
                        placeholder="0.00" 
                      />
                    </View>
                    <Text style={styles.fieldHint}>
                      Costo por {getUnitLabel(formType)}
                    </Text>
                  </View>

                  {/* PREVIEW DE VALOR TOTAL */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>VALOR CALCULADO</Text>
                    <View style={styles.valuePreviewBox}>
                      <Text style={styles.valuePreviewLabel}>Total en Inventario:</Text>
                      <Text style={styles.valuePreviewAmount}>
                        $ {((parseFloat(formStock || 0) * parseFloat(formCost || 0)) || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

              </ScrollView>

              {/* ACCIONES DEL MODAL */}
              <View style={styles.modalActionsRow}>
                {editingItem ? (
                  <TouchableOpacity style={styles.deleteOutlineBtn} onPress={() => handleDeleteItem(editingItem)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                    <Text style={styles.deleteOutlineBtnTxt}>Eliminar Insumo</Text>
                  </TouchableOpacity>
                ) : <View />}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmSaveBtn} onPress={handleSaveItem}>
                    <MaterialCommunityIcons name="content-save" size={16} color="#fff" />
                    <Text style={styles.confirmSaveBtnTxt}>
                      {editingItem ? 'Guardar Cambios' : 'Crear Insumo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>
        </Modal>

        {/* ================= MODAL: REGISTRAR MERMA ================= */}
        <Modal visible={isWasteModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Registrar Merma / Desecho</Text>
                  {wasteIngredient && <Text style={styles.modalSubtitle}>{wasteIngredient.name}</Text>}
                </View>
                <TouchableOpacity onPress={() => setIsWasteModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>CANTIDAD PERDIDA / DAÑADA</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  value={wasteAmount} 
                  onChangeText={setWasteAmount} 
                  keyboardType="numeric" 
                  placeholder="0.00" 
                  autoFocus={true}
                />
                <View style={[styles.input, { width: 90, justifyContent: 'center', backgroundColor: '#f1f5f9' }]}>
                  <Text style={{ textAlign: 'center', fontWeight: 'bold', color: '#1e293b' }}>{wasteUnit}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, lineHeight: 17 }}>
                El costo de esta merma se deducirá de las existencias y se registrará en el reporte de pérdidas para contabilidad.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWasteModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleProcessWaste}>
                  <MaterialCommunityIcons name="trash-can" size={16} color="#fff" />
                  <Text style={styles.confirmBtnText}>Registrar Merma</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 35, paddingTop: 25 },
  
  headerSection: { marginBottom: 20 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 3 },

  primaryAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(16,185,129,0.3)' } }) },
  primaryAddBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },

  // KPI Row
  kpiRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.02)' } }) },
  kpiIconBox: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  kpiLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },

  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 22, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  
  // Toolbar
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 15 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 13, color: '#1e293b', outlineStyle: 'none' },

  filterPillsContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterPillActiveLow: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  filterPillTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterPillTxtActive: { color: '#fff' },
  filterPillTxtActiveLow: { color: '#fff' },

  switchBox: { flexDirection: 'row', alignItems: 'center' },
  switchToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 },
  switchBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  switchBtnActive: { backgroundColor: '#fff', ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.08)' } }) },
  switchBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  switchBtnTxtActive: { color: '#0f172a' },

  // Table
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 6 },
  th: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLow: { backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 8 },
  cellTxt: { fontSize: 13, color: '#1e293b' },

  typeBadge: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  alertPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2, alignSelf: 'flex-start' },
  alertPillText: { fontSize: 10, fontWeight: 'bold', color: '#ef4444', marginLeft: 3 },

  actionsCell: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  editBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#2563eb', marginLeft: 4 },
  wasteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#fecaca' },
  wasteBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#ef4444', marginLeft: 4 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#475569', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center', maxWidth: 400 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 25, width: 420, maxWidth: '100%' },
  modalContentLarge: { backgroundColor: '#fff', borderRadius: 16, padding: 25, width: 550, maxWidth: '100%', ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.15)' } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalHeaderIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 12.5, color: '#64748b', marginTop: 2 },

  label: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13.5, marginBottom: 12, outlineStyle: 'none', backgroundColor: '#f8fafc' },
  
  typeSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  typeSelectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  typeSelectBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeSelectBtnTxt: { fontSize: 11.5, fontWeight: 'bold', color: '#64748b' },

  inputWithUnit: { flexDirection: 'row', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f8fafc' },
  innerInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, outlineStyle: 'none' },
  unitSuffix: { backgroundColor: '#e2e8f0', paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  unitSuffixText: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  fieldHint: { fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 12 },

  valuePreviewBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, justifyContent: 'center' },
  valuePreviewLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  valuePreviewAmount: { fontSize: 16, fontWeight: 'bold', color: '#10b981', marginTop: 2 },

  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  deleteOutlineBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: '#fff' },
  deleteOutlineBtnTxt: { color: '#ef4444', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 8, justifyContent: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, gap: 6 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  confirmSaveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, gap: 6 },
  confirmSaveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
