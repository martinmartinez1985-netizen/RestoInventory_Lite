import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRawMaterials, globalRecipes, globalFinishedGoods } from '../store/mockDb';
import { toBase, formatDisplay } from '../utils/unitConverter';

export default function RecipeCreatorScreen({ navigation }) {
  const [recipeName, setRecipeName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [category, setCategory] = useState('Platos Principales');
  const [recipeImage, setRecipeImage] = useState('');
  const [ingredients, setIngredients] = useState([]);

  const [selectedIngId, setSelectedIngId] = useState(null);
  const [ingAmount, setIngAmount] = useState('');
  const [ingUnit, setIngUnit] = useState('g');

  const handleAddIngredient = () => {
    if (!selectedIngId || !ingAmount) return;
    const ing = globalRawMaterials.find(i => i.id === selectedIngId);
    
    const amountNum = parseFloat(ingAmount);
    const baseAmount = toBase(amountNum, ingUnit);
    const cost = baseAmount * ing.baseCost;

    setIngredients([...ingredients, {
      id: Date.now().toString(),
      ingredientId: ing.id,
      name: ing.name,
      originalAmount: amountNum,
      originalUnit: ingUnit,
      baseType: ing.baseType,
      baseAmount,
      cost
    }]);

    setIngAmount('');
    setSelectedIngId(null);
  };

  const totalCost = ingredients.reduce((sum, i) => sum + i.cost, 0);
  const priceNum = parseFloat(sellPrice) || 0;
  const grossMargin = priceNum > 0 ? ((priceNum - totalCost) / priceNum) * 100 : 0;
  const isProfitable = grossMargin >= 30; // 30% rule of thumb for food cost

  const handleSaveRecipe = () => {
    if (!recipeName || ingredients.length === 0) {
      alert("Ingrese nombre y al menos un ingrediente.");
      return;
    }
    
    // 1. Crear el ítem en Producto Terminado
    const fgId = `FG-${Date.now().toString().slice(-4)}`;
    globalFinishedGoods.push({
      id: fgId,
      name: recipeName,
      baseType: 'unit',
      baseStock: 0,
      baseCost: totalCost,
      minStock: 5
    });

    const newRecipe = {
      id: `REC-${Date.now().toString().slice(-6)}`,
      name: recipeName,
      category: category,
      image: recipeImage,
      outputType: 'finished',
      outputId: fgId,
      yieldAmount: 1,
      yieldUnit: 'unit',
      price: priceNum,
      salePrice: priceNum,
      cost: totalCost,
      ingredients: ingredients.map(i => ({ id: i.ingredientId, amount: i.baseAmount }))
    };

    // 2. Crear la Receta apuntando a ese FG
    globalRecipes.push(newRecipe);
    
    // Guardar inmediatamente
    try {
      const { persistData } = require('../store/mockDb');
      if (persistData) persistData();
    } catch (e) {}

    // Sincronizar en segundo plano con la nube Supabase para que llegue a todas las PCs
    try {
      import('../services/supabaseService').then(({ supabaseService }) => {
        if (supabaseService && supabaseService.syncRecipe) {
          supabaseService.syncRecipe(newRecipe);
        }
      }).catch(() => {});
    } catch (e) {}

    alert("Ficha técnica y Producto creados. ¡Ya aparecerá en el Menú de Ventas!");
    navigation.navigate('Recipes');
  };

  const renderIng = ({ item }) => (
    <View style={styles.ingRow}>
      <Text style={[styles.ingCell, {flex: 2, fontWeight: 'bold'}]}>{item.name}</Text>
      <Text style={[styles.ingCell, {flex: 1}]}>{item.originalAmount} {item.originalUnit}</Text>
      <Text style={[styles.ingCell, {flex: 1, textAlign: 'right', color: '#64748b'}]}>$ {item.cost.toFixed(2)}</Text>
      <TouchableOpacity onPress={() => setIngredients(ingredients.filter(i => i.id !== item.id))} style={{marginLeft: 10}}>
        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#ef4444" />
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
            <Text style={styles.pageTitle}>Ingeniería de Menú</Text>
            <Text style={styles.pageSubtitle}>Creador interactivo de Fichas Técnicas</Text>
          </View>
        </View>

        <View style={styles.layout}>
          
          {/* Builder Column */}
          <View style={styles.builderCol}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Datos del Plato</Text>
              
              <Text style={styles.label}>NOMBRE DEL PLATO</Text>
              <TextInput style={styles.input} value={recipeName} onChangeText={setRecipeName} placeholder="Ej. Pollo Agridulce Especial" />
              
              <Text style={styles.label}>PRECIO DE VENTA ($)</Text>
              <TextInput style={styles.input} value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" placeholder="0.00" />
              
              <Text style={styles.label}>CATEGORÍA (Para POS)</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Ej: Burger, Drinks, Noodles..." />

              <Text style={styles.label}>URL DE LA FOTO (Opcional)</Text>
              <TextInput style={styles.input} value={recipeImage} onChangeText={setRecipeImage} placeholder="https://unsplash.com/..." />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Añadir Ingredientes</Text>
              
              <View style={styles.pillGrid}>
                {globalRawMaterials.map(ing => (
                  <TouchableOpacity 
                    key={ing.id} 
                    style={[styles.ingPill, selectedIngId === ing.id && styles.ingPillActive]}
                    onPress={() => {
                      setSelectedIngId(ing.id);
                      setIngUnit(ing.baseType === 'weight' ? 'g' : 'ml');
                    }}
                  >
                    <Text style={[styles.ingPillTxt, selectedIngId === ing.id && styles.ingPillTxtActive]}>{ing.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>CANTIDAD</Text>
                  <TextInput style={styles.input} value={ingAmount} onChangeText={setIngAmount} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.label}>UNIDAD</Text>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5}}>
                    {['g', 'oz', 'lb', 'ml', 'fl oz', 'cup'].map(u => (
                      <TouchableOpacity key={u} style={[styles.unitPill, ingUnit === u && styles.unitPillActive]} onPress={() => setIngUnit(u)}>
                        <Text style={[styles.unitPillTxt, ingUnit === u && styles.unitPillTxtActive]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={handleAddIngredient}>
                <Text style={styles.addBtnTxt}>+ Integrar a la Receta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ficha Técnica Preview Column */}
          <View style={styles.previewCol}>
            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>{recipeName || 'Plato sin nombre'}</Text>
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagTxt}>$ {priceNum.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>INGREDIENTES & COSTOS</Text>
              <View style={styles.ingList}>
                <FlatList
                  data={ingredients}
                  keyExtractor={item => item.id}
                  renderItem={renderIng}
                  ListEmptyComponent={<Text style={{color: '#94a3b8', fontStyle: 'italic', paddingVertical: 10}}>La receta está vacía.</Text>}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.kpiGrid}>
                <View style={styles.kpiBox}>
                  <Text style={styles.kpiLabel}>FOOD COST</Text>
                  <Text style={styles.kpiVal}>$ {totalCost.toFixed(2)}</Text>
                </View>
                <View style={[styles.kpiBox, { backgroundColor: isProfitable ? '#ecfdf5' : '#fef2f2', borderColor: isProfitable ? '#a7f3d0' : '#fecaca' }]}>
                  <Text style={[styles.kpiLabel, { color: isProfitable ? '#059669' : '#dc2626' }]}>MARGEN BRUTO</Text>
                  <Text style={[styles.kpiVal, { color: isProfitable ? '#059669' : '#dc2626' }]}>{grossMargin.toFixed(1)}%</Text>
                </View>
              </View>

              <Text style={styles.insightTxt}>
                {grossMargin >= 30 
                  ? "✅ Excelente rentabilidad. El margen supera el 30% recomendado para gastronomía."
                  : (priceNum > 0 ? "⚠️ Cuidado. El margen es bajo. Considera subir el precio o cambiar proveedores." : "Ingresa un precio de venta para calcular la rentabilidad.")}
              </Text>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRecipe}>
                <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnTxt}>Guardar Ficha Técnica</Text>
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

  layout: { flexDirection: 'row', gap: 30, flex: 1 },
  builderCol: { flex: 1 },
  previewCol: { flex: 1.2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, marginBottom: 20, outlineStyle: 'none' },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  ingPillActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  ingPillTxt: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  ingPillTxtActive: { color: '#fff' },

  unitPill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  unitPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  unitPillTxt: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  unitPillTxtActive: { color: '#fff' },

  addBtn: { backgroundColor: '#fef3c7', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#fde68a' },
  addBtnTxt: { color: '#d97706', fontWeight: 'bold' },

  // Recipe Card
  recipeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.05)' } }) },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  recipeTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', flex: 1, marginRight: 15 },
  priceTag: { backgroundColor: '#0f172a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  priceTagTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 15 },
  ingList: { minHeight: 150 },
  ingRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  ingCell: { fontSize: 14, color: '#1e293b' },

  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 25 },
  
  kpiGrid: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  kpiBox: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 20, backgroundColor: '#f8fafc' },
  kpiLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  kpiVal: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },

  insightTxt: { fontSize: 13, color: '#64748b', fontStyle: 'italic', marginBottom: 30 },

  saveBtn: { flexDirection: 'row', backgroundColor: '#f59e0b', padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(245, 158, 11, 0.3)' } }) },
  saveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
});
