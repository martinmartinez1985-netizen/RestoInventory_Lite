import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, persistData } from '../store/mockDb';

export default function IngredientCatalogScreen({ navigation }) {
  const [name, setName] = useState('');
  const [baseType, setBaseType] = useState('weight');
  const [stock, setStock] = useState('0');
  const [baseCost, setBaseCost] = useState('0.00');
  const [minStock, setMinStock] = useState('5');
  const [editingId, setEditingId] = useState(null);
  const [, setTick] = useState(0);

  const getUnitSuffix = (type) => {
    if (type === 'weight') return 'Kg';
    if (type === 'volume') return 'L';
    return 'Unid';
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert("El nombre es obligatorio");
      else Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    const multiplier = baseType === 'unit' ? 1 : 1000;
    const parsedStock = parseFloat(stock) || 0;
    const parsedCost = parseFloat(baseCost) || 0;
    const parsedMinStock = parseFloat(minStock) || 0;

    const baseStockVal = parsedStock * multiplier;
    const baseCostVal = parsedCost / multiplier;
    const minStockVal = parsedMinStock * multiplier;

    if (editingId) {
      // Modificar existente
      updateRawMaterial(editingId, {
        name: name.trim(),
        baseType,
        baseStock: baseStockVal,
        baseCost: baseCostVal,
        minStock: minStockVal
      });
      if (Platform.OS === 'web') window.alert("Ingrediente actualizado con éxito.");
    } else {
      // Crear nuevo
      addRawMaterial({
        name: name.trim(),
        baseType,
        baseStock: baseStockVal,
        baseCost: baseCostVal,
        minStock: minStockVal
      });
      if (Platform.OS === 'web') window.alert("Ingrediente creado con éxito.");
    }

    persistData();

    // Limpiar formulario
    cancelEdit();
    setTick(t => t + 1);
  };

  const handleEdit = (ing) => {
    setEditingId(ing.id);
    setName(ing.name);
    setBaseType(ing.baseType || 'weight');

    const multiplier = ing.baseType === 'unit' ? 1 : 1000;
    const humanStock = ((ing.baseStock || 0) / multiplier).toFixed(2);
    const humanCost = ((ing.baseCost || 0) * multiplier).toFixed(2);
    const humanMinStock = ((ing.minStock || 0) / multiplier).toFixed(2);

    setStock(parseFloat(humanStock).toString());
    setBaseCost(parseFloat(humanCost).toString());
    setMinStock(parseFloat(humanMinStock).toString());
  };

  const handleDelete = (id) => {
    const doDelete = () => {
      deleteRawMaterial(id);
      persistData();
      if (editingId === id) {
        cancelEdit();
      }
      setTick(t => t + 1);
    };

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que deseas eliminar este ingrediente del inventario?")) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Confirmar",
        "¿Estás seguro de que deseas eliminar este ingrediente?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: doDelete }
        ]
      );
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setStock('0');
    setBaseCost('0.00');
    setMinStock('5');
    setBaseType('weight');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 15}}>
            <Text style={styles.pageTitle}>Catálogo de Materia Prima e Insumos</Text>
            <Text style={styles.pageSubtitle}>Registra y administra ingredientes, unidades, costos y existencias</Text>
          </View>
        </View>

        <View style={styles.layout}>
          
          {/* Lado Izquierdo: Formulario */}
          <View style={styles.formCol}>
            <View style={styles.card}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                <Text style={styles.cardTitle}>{editingId ? 'Editar Ingrediente' : 'Crear Nuevo Ingrediente'}</Text>
                {editingId && (
                  <TouchableOpacity onPress={cancelEdit} style={{backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6}}>
                    <Text style={{color: '#64748b', fontSize: 12, fontWeight: 'bold'}}>Cancelar Edición</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.label}>NOMBRE DEL INGREDIENTE *</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Ej: Pollo Pechuga, Harina de Trigo..." 
              />

              <Text style={styles.label}>TIPO DE MEDIDA</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'weight' && styles.typeBtnActive]} onPress={() => setBaseType('weight')}>
                  <MaterialCommunityIcons name="weight-kilogram" size={20} color={baseType === 'weight' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'weight' && {color: '#fff'}]}>Peso (Kg/g)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'volume' && styles.typeBtnActive]} onPress={() => setBaseType('volume')}>
                  <MaterialCommunityIcons name="cup-water" size={20} color={baseType === 'volume' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'volume' && {color: '#fff'}]}>Volumen (L/ml)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'unit' && styles.typeBtnActive]} onPress={() => setBaseType('unit')}>
                  <MaterialCommunityIcons name="package-variant" size={20} color={baseType === 'unit' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'unit' && {color: '#fff'}]}>Unidad (Pzas)</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>El sistema convierte automáticamente los valores entre Kilogramos/Litros y gramos/ml.</Text>

              {/* Fila: Stock Actual */}
              <View style={{marginBottom: 15}}>
                <Text style={styles.label}>STOCK ACTUAL DISPONIBLE ({getUnitSuffix(baseType)})</Text>
                <TextInput 
                  style={styles.input} 
                  value={stock} 
                  onChangeText={setStock} 
                  keyboardType="numeric" 
                  placeholder="0.00" 
                />
              </View>

              <View style={{flexDirection: 'row', gap: 15}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>COSTO POR {getUnitSuffix(baseType)} ($)</Text>
                  <TextInput style={styles.input} value={baseCost} onChangeText={setBaseCost} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>STOCK MÍNIMO ({getUnitSuffix(baseType)})</Text>
                  <TextInput style={styles.input} value={minStock} onChangeText={setMinStock} keyboardType="numeric" placeholder="5" />
                </View>
              </View>

              <TouchableOpacity style={[styles.submitBtn, editingId && {backgroundColor: '#2563eb'}]} onPress={handleSave}>
                <MaterialCommunityIcons name={editingId ? "content-save-edit" : "plus-circle"} size={20} color="#fff" />
                <Text style={styles.submitBtnTxt}>{editingId ? 'Guardar Cambios' : 'Añadir al Catálogo'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lado Derecho: Lista Existente */}
          <View style={styles.listCol}>
            <View style={[styles.card, {backgroundColor: '#f8fafc', borderColor: '#e2e8f0', flex: 1}]}>
              <Text style={styles.cardTitle}>Insumos Registrados ({globalRawMaterials.length})</Text>
              <ScrollView style={{maxHeight: 520}}>
                {globalRawMaterials.map((ing, idx) => {
                  const mult = ing.baseType === 'unit' ? 1 : 1000;
                  const displayStock = ((ing.baseStock || 0) / mult).toFixed(2);
                  const displayCost = ((ing.baseCost || 0) * mult).toFixed(2);
                  const suffix = getUnitSuffix(ing.baseType);

                  return (
                    <View key={idx} style={[styles.ingRow, editingId === ing.id && {backgroundColor: '#eff6ff', borderColor: '#93c5fd', borderWidth: 1, paddingHorizontal: 10, borderRadius: 8}]}>
                      <View style={styles.ingIcon}>
                        <MaterialCommunityIcons name={ing.baseType === 'weight' ? 'weight-kilogram' : (ing.baseType === 'volume' ? 'cup-water' : 'package-variant')} size={18} color="#3b82f6" />
                      </View>
                      <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.ingName}>{ing.name}</Text>
                        <Text style={styles.ingStock}>
                          Stock: <Text style={{fontWeight: 'bold', color: '#10b981'}}>{displayStock} {suffix}</Text> | Costo: ${displayCost}/{suffix}
                        </Text>
                      </View>
                      
                      {/* Actions */}
                      <View style={{flexDirection: 'row', gap: 6}}>
                        <TouchableOpacity onPress={() => handleEdit(ing)} style={{padding: 7, backgroundColor: '#e0f2fe', borderRadius: 6}}>
                          <MaterialCommunityIcons name="pencil" size={16} color="#0284c7" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(ing.id)} style={{padding: 7, backgroundColor: '#fee2e2', borderRadius: 6}}>
                          <MaterialCommunityIcons name="delete" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 50 },
  
  headerSection: { marginBottom: 30 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  layout: { flexDirection: 'row', gap: 30 },
  formCol: { flex: 1.3 },
  listCol: { flex: 1.2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  label: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13.5, color: '#0f172a', marginBottom: 15, backgroundColor: '#f8fafc', outlineStyle: 'none' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: -10, marginBottom: 15 },

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9' },
  typeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeBtnTxt: { marginLeft: 6, fontSize: 12, fontWeight: 'bold', color: '#475569' },

  submitBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  submitBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },

  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ingIcon: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 8 },
  ingName: { fontSize: 13.5, fontWeight: 'bold', color: '#1e293b' },
  ingStock: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
});
