import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const menuItems = [
  { id: '1', title: 'Catálogo de Ingredientes', subtitle: 'Registra nuevos ingredientes base', icon: 'format-list-bulleted-type', route: 'IngredientCatalog', color: '#8b5cf6' },
  { id: '2', title: 'Compras e Ingresos', subtitle: 'Registra facturas y alimenta el stock multimetrica', icon: 'truck-delivery-outline', route: 'Purchases', color: '#3b82f6' },
  { id: '3', title: 'Gestión de Almacén', subtitle: 'Consulta el inventario en tiempo real y registra mermas', icon: 'warehouse', route: 'InventoryHub', color: '#10b981' },
  { id: '4', title: 'Creador de Recetas', subtitle: 'Fichas técnicas y costeo de platos', icon: 'book-open-variant', route: 'RecipeCreator', color: '#f59e0b' },
];

export default function RecipesMenuScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate(item.route)}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver al Dashboard</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 20}}>
            <Text style={styles.pageTitle}>Recetas e Inventario</Text>
            <Text style={styles.pageSubtitle}>Gestión integral de materia prima y fichas técnicas</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <FlatList
          data={menuItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={{ gap: 20 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          key={3}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30, backgroundColor: '#f8fafc' },
  
  headerSection: { marginBottom: 30 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'flex-start', minWidth: 250, ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  iconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 20 }
});
