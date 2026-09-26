import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRawMaterials, addRawMaterial } from '../store/mockDb';

export default function IngredientCatalogScreen({ navigation }) {
  const [name, setName] = useState('');
  const [baseType, setBaseType] = useState('weight');
  const [baseCost, setBaseCost] = useState('');
  const [minStock, setMinStock] = useState('');
  const [editingId, setEditingId] = useState(null); // Nuevo estado para saber si estamos editando
  const [, setTick] = useState(0);

  const handleSave = () => {
    if (!name) {
      alert("El nombre es obligatorio");
      return;
    }

    if (editingId) {
      // Modificar existente
      const ing = globalRawMaterials.find(i => i.id === editingId);
      if (ing) {
        ing.name = name;
        ing.baseType = baseType;
        ing.baseCost = parseFloat(baseCost) || 0;
        ing.minStock = parseFloat(minStock) || 0;
      }
      alert("Ingrediente actualizado con éxito.");
    } else {
      // Crear nuevo
      addRawMaterial({
        name,
        baseType,
        baseCost: parseFloat(baseCost) || 0,
        minStock: parseFloat(minStock) || 0
      });
      alert("Ingrediente creado con éxito.");
    }

    // Limpiar formulario
    setName('');
    setBaseCost('');
    setMinStock('');
    setBaseType('weight');
    setEditingId(null);
    setTick(t => t + 1);
  };

  const handleEdit = (ing) => {
    setEditingId(ing.id);
    setName(ing.name);
    setBaseType(ing.baseType);
    setBaseCost(ing.baseCost.toString());
    setMinStock(ing.minStock ? ing.minStock.toString() : '0');
  };

  const handleDelete = (id) => {
    if (typeof window !== 'undefined' && window.confirm && window.confirm("¿Estás seguro de que quieres borrar este ingrediente?")) {
      const index = globalRawMaterials.findIndex(i => i.id === id);
      if (index !== -1) {
        globalRawMaterials.splice(index, 1);
        
        // Si estábamos editando el que se borró, limpiamos el formulario
        if (editingId === id) {
          setName('');
          setBaseCost('');
          setMinStock('');
          setEditingId(null);
        }
        
        setTick(t => t + 1);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setBaseCost('');
    setMinStock('');
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
            <Text style={styles.pageTitle}>Catálogo de Materia Prima</Text>
            <Text style={styles.pageSubtitle}>Registra y administra ingredientes en el sistema</Text>
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
                    <Text style={{color: '#64748b', fontSize: 12, fontWeight: 'bold'}}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.label}>NOMBRE DEL INGREDIENTE</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej: Carne Molida" />

              <Text style={styles.label}>TIPO DE MEDIDA (Crucial)</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'weight' && styles.typeBtnActive]} onPress={() => setBaseType('weight')}>
                  <MaterialCommunityIcons name="weight-kilogram" size={20} color={baseType === 'weight' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'weight' && {color: '#fff'}]}>Peso (g/kg)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'volume' && styles.typeBtnActive]} onPress={() => setBaseType('volume')}>
                  <MaterialCommunityIcons name="cup-water" size={20} color={baseType === 'volume' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'volume' && {color: '#fff'}]}>Volumen (ml/L)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, baseType === 'unit' && styles.typeBtnActive]} onPress={() => setBaseType('unit')}>
                  <MaterialCommunityIcons name="package-variant" size={20} color={baseType === 'unit' ? '#fff' : '#64748b'} />
                  <Text style={[styles.typeBtnTxt, baseType === 'unit' && {color: '#fff'}]}>Unidad (Cajas/Pzas)</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>El sistema central trabajará en base a gramos, mililitros o unidades.</Text>

              <View style={{flexDirection: 'row', gap: 15}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>COSTO BASE ACTUAL ($)</Text>
                  <TextInput style={styles.input} value={baseCost} onChangeText={setBaseCost} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>ALERTA STOCK MÍNIMO</Text>
                  <TextInput style={styles.input} value={minStock} onChangeText={setMinStock} keyboardType="numeric" placeholder="1000" />
                </View>
              </View>

              <TouchableOpacity style={[styles.submitBtn, editingId && {backgroundColor: '#f59e0b'}]} onPress={handleSave}>
                <MaterialCommunityIcons name={editingId ? "content-save-edit" : "plus-circle"} size={20} color="#fff" />
                <Text style={styles.submitBtnTxt}>{editingId ? 'Guardar Cambios' : 'Añadir al Catálogo'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lado Derecho: Lista Existente */}
          <View style={styles.listCol}>
            <View style={[styles.card, {backgroundColor: '#f8fafc', borderColor: '#e2e8f0', flex: 1}]}>
              <Text style={styles.cardTitle}>Ingredientes Registrados</Text>
              <ScrollView style={{maxHeight: 500}}>
                {globalRawMaterials.map((ing, idx) => (
                  <View key={idx} style={[styles.ingRow, editingId === ing.id && {backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1, paddingHorizontal: 10, borderRadius: 8}]}>
                    <View style={styles.ingIcon}>
                      <MaterialCommunityIcons name={ing.baseType === 'weight' ? 'weight-kilogram' : (ing.baseType === 'volume' ? 'cup-water' : 'package-variant')} size={20} color="#3b82f6" />
                    </View>
                    <View style={{flex: 1, marginLeft: 10}}>
                      <Text style={styles.ingName}>{ing.name}</Text>
                      <Text style={styles.ingID}>{ing.id}</Text>
                    </View>
                    
                    {/* Actions */}
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <TouchableOpacity onPress={() => handleEdit(ing)} style={{padding: 8, backgroundColor: '#e0f2fe', borderRadius: 8}}>
                        <MaterialCommunityIcons name="pencil" size={18} color="#0284c7" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(ing.id)} style={{padding: 8, backgroundColor: '#fee2e2', borderRadius: 8}}>
                        <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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
  formCol: { flex: 1.5 },
  listCol: { flex: 1 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 0 },
  
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#0f172a', marginBottom: 20, backgroundColor: '#fff', outlineStyle: 'none' },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: -15, marginBottom: 20 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 12, borderRadius: 8, backgroundColor: '#f1f5f9' },
  typeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  typeBtnTxt: { marginLeft: 8, fontSize: 13, fontWeight: 'bold', color: '#475569' },

  submitBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },

  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ingIcon: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 8 },
  ingName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  ingID: { fontSize: 11, color: '#64748b' },
});
