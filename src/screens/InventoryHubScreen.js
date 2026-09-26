import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const inventoryTypes = [
  { id: '1', title: 'Materia Prima', subtitle: 'Ingredientes básicos sin procesar', icon: 'leaf', color: '#10b981', route: 'RawMaterials' },
  { id: '2', title: 'En Proceso', subtitle: 'Preparaciones intermedias y salsas', icon: 'pot-mix', color: '#f59e0b', route: 'Wip' },
  { id: '3', title: 'Producto Terminado', subtitle: 'Platos y productos listos para la venta', icon: 'food-cloche', color: '#3b82f6', route: 'FinishedGoods' },
  { id: '4', title: 'Producción / Lotes', subtitle: 'Transformar materia prima en productos', icon: 'cogs', color: '#6366f1', route: 'Production' },
];

export default function InventoryHubScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(item.route)}>
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
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 15}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver al Dashboard</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: 20}}>
            <Text style={styles.pageTitle}>Centro de Inventarios</Text>
            <Text style={styles.pageSubtitle}>Gestión de stock por etapas de producción</Text>
          </View>
        </View>

        <FlatList
          data={inventoryTypes}
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
