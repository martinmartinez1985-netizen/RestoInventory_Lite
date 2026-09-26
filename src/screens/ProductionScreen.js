import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRecipes, processProductionBatch } from '../store/mockDb';

export default function ProductionScreen({ navigation }) {
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [multiplier, setMultiplier] = useState('1');

  const selectedRecipe = globalRecipes.find(r => r.id === selectedRecipeId);

  const handleProcess = () => {
    if (!selectedRecipe) return;
    const multi = parseFloat(multiplier);
    if (isNaN(multi) || multi <= 0) {
      alert("Ingrese una cantidad válida.");
      return;
    }

    try {
      const result = processProductionBatch(selectedRecipe.id, multi);
      alert(`Lote procesado exitosamente.\n\nCosto Total: $${result.totalCost.toFixed(2)}\nUnidades producidas: ${result.outputAmount} ${selectedRecipe.yieldUnit}\nCosto Unitario: $${result.costPerUnit.toFixed(4)}`);
      navigation.navigate('InventoryHub');
    } catch (error) {
      alert("Error en producción:\n" + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('InventoryHub')} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 15}}>
            <Text style={styles.pageTitle}>Motor de Producción</Text>
            <Text style={styles.pageSubtitle}>Transformación de Materia Prima y Subproductos</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Seleccione la Receta a Producir</Text>
          <View style={styles.grid}>
            {globalRecipes.map(recipe => (
              <TouchableOpacity 
                key={recipe.id}
                style={[styles.recipeBox, selectedRecipeId === recipe.id && styles.recipeBoxActive]}
                onPress={() => setSelectedRecipeId(recipe.id)}
              >
                <MaterialCommunityIcons 
                  name={recipe.outputType === 'wip' ? 'pot-mix' : 'food-cloche'} 
                  size={24} 
                  color={selectedRecipeId === recipe.id ? '#fff' : '#64748b'} 
                  style={{marginBottom: 8}}
                />
                <Text style={[styles.recipeTitle, selectedRecipeId === recipe.id && {color: '#fff'}]}>
                  {recipe.name}
                </Text>
                <Text style={[styles.recipeSubtitle, selectedRecipeId === recipe.id && {color: '#e2e8f0'}]}>
                  Genera: {recipe.yieldAmount} {recipe.yieldUnit} ({recipe.outputType.toUpperCase()})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedRecipe && (
            <View style={styles.executionBox}>
              <Text style={styles.cardTitle}>2. Ejecutar Producción</Text>
              
              <Text style={styles.label}>CANTIDAD DE LOTES (Multiplicador)</Text>
              <TextInput 
                style={styles.input} 
                value={multiplier} 
                onChangeText={setMultiplier} 
                keyboardType="numeric" 
              />
              <Text style={styles.hint}>
                Producirá un total de {(parseFloat(multiplier) || 0) * selectedRecipe.yieldAmount} {selectedRecipe.yieldUnit}
              </Text>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Impacto en el Inventario:</Text>
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <Text key={idx} style={styles.summaryItem}>
                    • Se descontarán <Text style={{fontWeight: 'bold'}}>{ing.amount * (parseFloat(multiplier) || 0)}</Text> unidades del ingrediente {ing.id}.
                  </Text>
                ))}
                <Text style={[styles.summaryItem, {color: '#10b981', marginTop: 10, fontWeight: 'bold'}]}>
                  + Se añadirán {(parseFloat(multiplier) || 0) * selectedRecipe.yieldAmount} {selectedRecipe.yieldUnit} al inventario {selectedRecipe.outputType === 'wip' ? 'En Proceso' : 'Producto Terminado'}.
                </Text>
              </View>

              <TouchableOpacity style={styles.processBtn} onPress={handleProcess}>
                <MaterialCommunityIcons name="cogs" size={24} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.processBtnTxt}>Procesar Lote y Transferir Costos</Text>
              </TouchableOpacity>
            </View>
          )}

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

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 40 },
  recipeBox: { width: 220, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 20, backgroundColor: '#f8fafc' },
  recipeBoxActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  recipeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  recipeSubtitle: { fontSize: 11, color: '#64748b' },

  executionBox: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 30 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, marginBottom: 5, width: 200, backgroundColor: '#fff', outlineStyle: 'none' },
  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },

  summaryBox: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 12, marginBottom: 30 },
  summaryTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  summaryItem: { fontSize: 13, color: '#475569', marginVertical: 3 },

  processBtn: { flexDirection: 'row', backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(16, 185, 129, 0.3)' } }) },
  processBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
