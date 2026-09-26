import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRawMaterials, updateStock, addPurchase } from '../store/mockDb';
import { toBase } from '../utils/unitConverter';

export default function PurchasesScreen({ navigation }) {
  const [supplier, setSupplier] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [items, setItems] = useState([]);
  
  // Temporary state for the new line item
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('lb'); // default for weights
  const [totalCost, setTotalCost] = useState('');

  const handleAddItem = () => {
    if (!selectedIngredient || !amount || !totalCost) {
      alert("Por favor complete los datos del ítem.");
      return;
    }
    const ing = globalRawMaterials.find(i => i.id === selectedIngredient);
    
    // Calculate base metrics
    const parsedAmount = parseFloat(amount);
    const parsedCost = parseFloat(totalCost);
    const baseAmount = toBase(parsedAmount, unit);
    const costPerBaseUnit = parsedCost / baseAmount;

    setItems([...items, {
      id: Date.now().toString(),
      ingredientId: ing.id,
      name: ing.name,
      originalAmount: parsedAmount,
      originalUnit: unit,
      totalCost: parsedCost,
      baseAmount,
      costPerBaseUnit
    }]);

    setSelectedIngredient(null);
    setAmount('');
    setTotalCost('');
  };

  const handleProcessPurchase = () => {
    if (!supplier || items.length === 0) {
      alert("Ingrese proveedor y al menos un ítem.");
      return;
    }
    
    // 1. Save purchase history
    addPurchase({
      id: `PUR-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      supplier,
      invoiceRef,
      total: items.reduce((sum, item) => sum + item.totalCost, 0),
      items
    });

    // 2. Update stock & cost for each ingredient
    items.forEach(item => {
      updateStock(item.ingredientId, item.baseAmount, item.costPerBaseUnit);
    });

    alert("Compra procesada e inventario actualizado.");
    navigation.navigate('Recipes');
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <Text style={[styles.itemText, {flex: 2}]}>{item.name}</Text>
      <Text style={[styles.itemText, {flex: 1}]}>{item.originalAmount} {item.originalUnit}</Text>
      <Text style={[styles.itemText, {flex: 1}]}>$ {item.totalCost.toFixed(2)}</Text>
      <Text style={[styles.itemSubtext, {flex: 1}]}>$ {item.costPerBaseUnit.toFixed(4)} / base</Text>
      <TouchableOpacity onPress={() => setItems(items.filter(i => i.id !== item.id))}>
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Recipes')} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 15}}>
            <Text style={styles.pageTitle}>Ingreso de Compras</Text>
            <Text style={styles.pageSubtitle}>Registra facturas en sistema imperial o métrico</Text>
          </View>
        </View>

        <View style={styles.mainLayout}>
          {/* Form Column */}
          <View style={styles.formCol}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Datos de Factura</Text>
              
              <Text style={styles.label}>PROVEEDOR</Text>
              <TextInput style={styles.input} value={supplier} onChangeText={setSupplier} placeholder="Ej. Comercializadora XYZ" />
              
              <Text style={styles.label}>Nº FACTURA / REF</Text>
              <TextInput style={styles.input} value={invoiceRef} onChangeText={setInvoiceRef} placeholder="Ej. F-00123" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Añadir Ingrediente</Text>
              
              <Text style={styles.label}>INGREDIENTE</Text>
              <View style={styles.rowGrid}>
                {globalRawMaterials.map(ing => (
                  <TouchableOpacity 
                    key={ing.id} 
                    style={[styles.ingPill, selectedIngredient === ing.id && styles.ingPillActive]}
                    onPress={() => {
                      setSelectedIngredient(ing.id);
                      setUnit(ing.baseType === 'weight' ? 'lb' : 'gal');
                    }}
                  >
                    <Text style={[styles.ingPillTxt, selectedIngredient === ing.id && styles.ingPillTxtActive]}>{ing.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>CANTIDAD</Text>
                  <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>UNIDAD MEDIDA</Text>
                  {/* Simplified toggle for demo, depends on ingredient type */}
                  <View style={{flexDirection: 'row', gap: 5}}>
                    {['lb', 'oz', 'kg', 'g', 'gal', 'L', 'ml'].map(u => (
                      <TouchableOpacity key={u} style={[styles.unitPill, unit === u && styles.unitPillActive]} onPress={() => setUnit(u)}>
                        <Text style={[styles.unitPillTxt, unit === u && styles.unitPillTxtActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.label}>COSTO TOTAL (LÍNEA)</Text>
              <TextInput style={styles.input} value={totalCost} onChangeText={setTotalCost} keyboardType="numeric" placeholder="$ 0.00" />

              <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                <Text style={styles.addBtnTxt}>+ Añadir a la factura</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List Column */}
          <View style={styles.listCol}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Detalle de la Factura</Text>
              
              <View style={styles.tableHeader}>
                <Text style={[styles.th, {flex: 2}]}>INGREDIENTE</Text>
                <Text style={[styles.th, {flex: 1}]}>CANTIDAD</Text>
                <Text style={[styles.th, {flex: 1}]}>COSTO</Text>
                <Text style={[styles.th, {flex: 1}]}>COSTO/BASE</Text>
                <View style={{width: 20}} />
              </View>

              <FlatList
                data={items}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={{padding: 20, textAlign: 'center', color: '#94a3b8'}}>No hay ítems en la factura</Text>}
              />

              <View style={styles.totalsBox}>
                <Text style={styles.totalLabel}>TOTAL FACTURA</Text>
                <Text style={styles.totalVal}>$ {items.reduce((sum, item) => sum + item.totalCost, 0).toFixed(2)}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.processBtn, items.length === 0 && {backgroundColor: '#94a3b8'}]} 
                onPress={handleProcessPurchase}
                disabled={items.length === 0}
              >
                <Text style={styles.processBtnTxt}>Procesar Compra</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
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

  mainLayout: { flexDirection: 'row', gap: 20, flex: 1 },
  formCol: { flex: 1 },
  listCol: { flex: 1.2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 20, backgroundColor: '#f8fafc', outlineStyle: 'none' },

  rowGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  ingPillActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  ingPillTxt: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  ingPillTxtActive: { color: '#fff' },

  unitPill: { paddingHorizontal: 8, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  unitPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  unitPillTxt: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  unitPillTxtActive: { color: '#fff' },

  addBtn: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  addBtnTxt: { color: '#3b82f6', fontWeight: 'bold' },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 10 },
  th: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemText: { fontSize: 13, color: '#1e293b', fontWeight: '500' },
  itemSubtext: { fontSize: 11, color: '#64748b' },

  totalsBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: 20, backgroundColor: '#f8fafc', borderRadius: 12 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  totalVal: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },

  processBtn: { backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 20, ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(16, 185, 129, 0.3)' } }) },
  processBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
