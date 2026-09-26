import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: '1', title: 'Proveedores', subtitle: 'Gestión de facturas y pagos a proveedores', icon: 'truck-fast', color: '#ef4444', type: 'Proveedores' },
  { id: '2', title: 'Intercompañías', subtitle: 'Cuentas por pagar a empresas relacionadas', icon: 'domain', color: '#f59e0b', type: 'Intercompañías' },
  { id: '3', title: 'Accionistas', subtitle: 'Cuentas por pagar a socios y directivos', icon: 'account-tie', color: '#10b981', type: 'Accionistas' },
  { id: '4', title: 'Colaboradores', subtitle: 'Comisiones a vendedores y aliados', icon: 'briefcase', color: '#d97706', type: 'Empleados / Colaboradores' },
  { id: '5', title: 'Módulo Pago', subtitle: 'Procesamiento de egresos y conciliación', icon: 'phone-classic', color: '#334155', type: 'Pago' },
  { id: '6', title: 'Historial Pagos', subtitle: 'Ver, detallar, anular o eliminar pagos realizados', icon: 'file-document', color: '#0ea5e9', type: 'Historial' },
];

export default function PayablesMenuScreen({ navigation }) {
  
  const handlePress = (item) => {
    navigation.navigate('PayablesLedger', { type: item.type, title: item.title });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Dashboard')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
          <Text style={styles.backBtnText}>Volver al Inicio</Text>
        </TouchableOpacity>

        {/* Center Titles */}
        <View style={styles.headerTitles}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="calculator-variant-outline" size={28} color="#64748b" />
          </View>
          <Text style={styles.mainTitle}>Cuentas por Pagar</Text>
          <Text style={styles.subTitle}>Control de compromisos y gestión de egresos</Text>
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 40, alignItems: 'center' },
  backBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 8, 
    borderRadius: 8, alignSelf: 'flex-start', position: 'absolute', top: 40, left: 40 
  },
  backBtnText: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#475569' },
  
  headerTitles: { alignItems: 'center', marginTop: 60, marginBottom: 50 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subTitle: { fontSize: 15, color: '#64748b' },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    maxWidth: 900
  },
  card: {
    backgroundColor: '#ffffff',
    width: width > 900 ? 270 : width > 600 ? '45%' : '100%',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } })
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  cardSubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 }
});
