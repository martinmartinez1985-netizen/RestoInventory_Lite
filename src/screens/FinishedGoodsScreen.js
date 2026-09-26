import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalFinishedGoods, globalRecipes, addWaste, updateStock } from '../store/mockDb';
import { formatDisplay, toBase } from '../utils/unitConverter';

export default function FinishedGoodsScreen({ navigation }) {
  const [ingredients, setIngredients] = useState([]);
  const [system, setSystem] = useState('metric'); // 'metric' | 'imperial'
  
  // Waste Modal
  const [isWasteModalVisible, setIsWasteModalVisible] = useState(false);
  const [wasteIngredient, setWasteIngredient] = useState(null);
  const [wasteAmount, setWasteAmount] = useState('');

  // Add Item Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bebidas');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newImage, setNewImage] = useState('');

  const handleAddItem = () => {
    if (!newName.trim()) return alert("El nombre es obligatorio");
    const fgId = 'FG-' + Date.now().toString().slice(-6);
    
    // 1. Add to Finished Goods Inventory
    globalFinishedGoods.push({
      id: fgId,
      name: newName,
      baseUnit: 'Unidades',
      baseCost: parseFloat(newCost) || 0,
      baseStock: parseFloat(newStock) || 0,
      minStock: 10,
      isDirectSale: true
    });

    // 2. Create Dummy Recipe so it appears in POS
    globalRecipes.push({
      id: 'REC-' + Date.now().toString().slice(-6),
      name: newName,
      outputId: fgId,
      outputType: 'finished',
      yieldAmount: 1,
      yieldUnit: 'Unidades',
      ingredients: [], // No raw materials! Direct sale.
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      image: newImage || 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=300&q=80'
    });

    setIsAddModalVisible(false);
    setNewName('');
    setNewCategory('Bebidas');
    setNewPrice('');
    setNewCost('');
    setNewStock('');
    setNewImage('');
    setIngredients([...globalFinishedGoods]);
  };
  const [wasteUnit, setWasteUnit] = useState('');

  useFocusEffect(
    useCallback(() => {
      setIngredients([...globalFinishedGoods]);
    }, [])
  );

  const openWasteModal = (ing) => {
    setWasteIngredient(ing);
    setWasteUnit(ing.baseType === 'weight' ? (system === 'metric' ? 'g' : 'oz') : (system === 'metric' ? 'ml' : 'fl oz'));
    setIsWasteModalVisible(true);
  };

  const handleProcessWaste = () => {
    if (!wasteAmount) return;
    const amountNum = parseFloat(wasteAmount);
    if (amountNum <= 0) return;

    const baseAmount = toBase(amountNum, wasteUnit);
    
    // Financial cost of the waste
    const lostValue = baseAmount * wasteIngredient.baseCost;

    addWaste({
      id: `WST-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      ingredientId: wasteIngredient.id,
      ingredientName: wasteIngredient.name,
      lostValue,
      originalAmount: amountNum,
      originalUnit: wasteUnit
    });

    // Reduce stock (negative delta)
    updateStock(wasteIngredient.id, -baseAmount);

    setIngredients([...globalFinishedGoods]);
    setIsWasteModalVisible(false);
    setWasteAmount('');
  };

  const renderItem = ({ item }) => {
    const isLow = item.baseStock <= item.minStock;
    const stockDisplay = formatDisplay(item.baseStock, item.baseType, system);
    const minDisplay = formatDisplay(item.minStock, item.baseType, system);

    return (
      <View style={[styles.row, isLow && styles.rowLow]}>
        <View style={{flex: 2, flexDirection: 'row', alignItems: 'center'}}>
          {isLow && <MaterialCommunityIcons name="alert" size={16} color="#ef4444" style={{marginRight: 8}} />}
          <Text style={[styles.cellTxt, { fontWeight: 'bold' }]}>{item.name}</Text>
        </View>
        <Text style={[styles.cellTxt, {flex: 1.5, color: isLow ? '#ef4444' : '#10b981', fontWeight: 'bold'}]}>{stockDisplay}</Text>
        <Text style={[styles.cellTxt, {flex: 1.5, color: '#64748b'}]}>{minDisplay}</Text>
        <Text style={[styles.cellTxt, {flex: 1.5}]}>$ {(item.baseStock * item.baseCost).toFixed(2)}</Text>
        <View style={{flex: 1, alignItems: 'flex-end'}}>
          <TouchableOpacity style={styles.wasteBtn} onPress={() => openWasteModal(item)}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
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
          <TouchableOpacity onPress={() => navigation.navigate('InventoryHub')} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 15}}>
            <Text style={styles.pageTitle}>Almacén de Productos Terminados</Text>
            <Text style={styles.pageSubtitle}>Stock disponible para la venta de platos y bebidas</Text>
          </View>
        </View>

        <View style={styles.card}>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.switchBox}>
              <Text style={styles.switchLabel}>Sistema de Medición:</Text>
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
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={[styles.reportBtn, {backgroundColor: '#10b981', borderColor: '#10b981'}]} onPress={() => setIsAddModalVisible(true)}>
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                <Text style={[styles.reportBtnTxt, {color: '#fff'}]}>Nuevo Directo (Sin Receta)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportBtn}>
                <MaterialCommunityIcons name="file-chart-outline" size={18} color="#0f172a" />
                <Text style={styles.reportBtnTxt}>Reporte de Mermas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, {flex: 2}]}>INGREDIENTE</Text>
            <Text style={[styles.th, {flex: 1.5}]}>STOCK ACTUAL</Text>
            <Text style={[styles.th, {flex: 1.5}]}>MIN STOCK</Text>
            <Text style={[styles.th, {flex: 1.5}]}>VALOR TOTAL</Text>
            <Text style={[styles.th, {flex: 1, textAlign: 'right'}]}>ACCIONES</Text>
          </View>

          <FlatList
            data={ingredients}
            keyExtractor={item => item.id}
            renderItem={renderItem}
          />
        </View>

        {/* Waste Modal */}
        <Modal visible={isWasteModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Registrar Merma</Text>
              {wasteIngredient && <Text style={styles.modalSubtitle}>{wasteIngredient.name}</Text>}
              
              <Text style={styles.label}>CANTIDAD PERDIDA / DAÑADA</Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                <TextInput 
                  style={[styles.input, {flex: 1}]} 
                  value={wasteAmount} 
                  onChangeText={setWasteAmount} 
                  keyboardType="numeric" 
                  placeholder="0.00" 
                />
                <View style={[styles.input, {width: 80, justifyContent: 'center', backgroundColor: '#f1f5f9'}]}>
                  <Text style={{textAlign: 'center', fontWeight: 'bold'}}>{wasteUnit}</Text>
                </View>
              </View>
              <Text style={{fontSize: 12, color: '#94a3b8', marginBottom: 20}}>
                El costo de esta merma se registrará en un reporte separado y no afectará el costo del stock bueno restante.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWasteModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleProcessWaste}>
                  <Text style={styles.confirmBtnText}>Registrar Merma</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    
      {/* Add Direct Item Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Producto Directo</Text>
            <Text style={styles.modalSubtitle}>Agrega platos o bebidas compradas listas para la venta (Ej: Cervezas, Refrescos) sin necesidad de receta.</Text>
            
            <Text style={styles.label}>NOMBRE DEL PRODUCTO</Text>
            <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Ej: Cerveza Polar" />
            
            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.label}>CATEGORÍA</Text>
                <TextInput style={styles.input} value={newCategory} onChangeText={setNewCategory} placeholder="Ej: Bebidas" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>PRECIO VENTA ($)</Text>
                <TextInput style={styles.input} value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" placeholder="1.50" />
              </View>
            </View>

            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                <Text style={styles.label}>COSTO COMPRA ($)</Text>
                <TextInput style={styles.input} value={newCost} onChangeText={setNewCost} keyboardType="numeric" placeholder="0.80" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>STOCK INICIAL (Unid)</Text>
                <TextInput style={styles.input} value={newStock} onChangeText={setNewStock} keyboardType="numeric" placeholder="50" />
              </View>
            </View>

            <Text style={styles.label}>URL IMAGEN (Opcional)</Text>
            <TextInput style={styles.input} value={newImage} onChangeText={setNewImage} placeholder="https://..." />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, {backgroundColor: '#10b981'}]} onPress={handleAddItem}>
                <Text style={styles.confirmBtnText}>Guardar y Enviar al POS</Text>
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
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30 },
  
  headerSection: { marginBottom: 30 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  switchLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  switchToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  switchBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  switchBtnActive: { backgroundColor: '#fff', ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.1)' } }) },
  switchBtnTxt: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  switchBtnTxtActive: { color: '#0f172a' },
  
  reportBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  reportBtnTxt: { fontSize: 13, fontWeight: 'bold', marginLeft: 8, color: '#0f172a' },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 10 },
  th: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rowLow: { backgroundColor: '#fef2f2', borderRadius: 8, paddingHorizontal: 10 },
  cellTxt: { fontSize: 13, color: '#1e293b' },
  
  wasteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  wasteBtnTxt: { fontSize: 11, fontWeight: 'bold', color: '#ef4444', marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 30, width: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, marginBottom: 10, outlineStyle: 'none' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 15, paddingVertical: 10 },
  cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' }
});
