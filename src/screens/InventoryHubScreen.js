import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalRawMaterials } from '../store/mockDb';

const inventoryTypes = [
  { id: '1', title: 'Materia Prima', subtitle: 'Ingredientes básicos sin procesar', icon: 'leaf', color: '#10b981', route: 'RawMaterials' },
  { id: '2', title: 'En Proceso', subtitle: 'Preparaciones intermedias y salsas', icon: 'pot-mix', color: '#f59e0b', route: 'Wip' },
  { id: '3', title: 'Producto Terminado', subtitle: 'Platos y productos listos para la venta', icon: 'food-cloche', color: '#3b82f6', route: 'FinishedGoods' },
  { id: '4', title: 'Producción / Lotes', subtitle: 'Transformar materia prima en productos', icon: 'cogs', color: '#6366f1', route: 'Production' },
];

export default function InventoryHubScreen({ navigation }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleCloudSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const { supabaseService } = await import('../services/supabaseService');
      if (!supabaseService) throw new Error("Servicio de sincronización no disponible.");

      if (globalRawMaterials.length === 0) {
        const count = await supabaseService.downloadInventory();
        const msg = `Se descargaron ${count} insumo(s) exitosamente desde la nube.`;
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert("Sincronización Exitosa", msg);
      } else {
        let shouldUpload = true;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          shouldUpload = window.confirm(
            "¿Deseas SUBIR el inventario actual a la nube para compartirlo con otros dispositivos?\n\n- ACEPTAR: Sube tus materias primas y productos a Supabase.\n- CANCELAR: Descarga y sincroniza desde la nube."
          );
        }

        if (shouldUpload) {
          const count = await supabaseService.uploadInventory();
          const msg = `¡Inventario subido a la nube! ${count} insumo(s) sincronizados para todos los dispositivos.`;
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert("Nube Actualizada", msg);
        } else {
          const count = await supabaseService.downloadInventory();
          const msg = `Se descargaron ${count} insumo(s) desde la nube.`;
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert("Descarga Exitosa", msg);
        }
      }
    } catch (err) {
      console.error("Error sincronizando inventario:", err);
      const errMsg = "Error al sincronizar con la nube: " + (err.message || err);
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert("Error", errMsg);
    } finally {
      setIsSyncing(false);
    }
  };

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
          <View style={{marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12}}>
            <View>
              <Text style={styles.pageTitle}>Centro de Inventarios</Text>
              <Text style={styles.pageSubtitle}>Gestión de stock por etapas de producción</Text>
            </View>
            <TouchableOpacity 
              style={[styles.syncCloudBtn, isSyncing && { opacity: 0.7 }]} 
              onPress={handleCloudSync}
              disabled={isSyncing}
            >
              <MaterialCommunityIcons name={isSyncing ? "cloud-sync-outline" : "cloud-sync"} size={20} color="#fff" />
              <Text style={styles.syncCloudBtnTxt}>{isSyncing ? 'Sincronizando...' : 'Sincronizar Inventario en la Nube'}</Text>
            </TouchableOpacity>
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
  syncCloudBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0284c7', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, gap: 8, ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(2,132,199,0.3)', cursor: 'pointer' } }) },
  syncCloudBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'flex-start', minWidth: 250, ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  iconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: '#64748b', lineHeight: 20 }
});

