import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalTables, globalActiveOrders, createOrder } from '../store/mockDb';

export default function BillingScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dine_in');
  const [refresh, setRefresh] = useState(0);

  // Force re-render on focus to show updated table statuses
  useFocusEffect(
    React.useCallback(() => {
      setRefresh(prev => prev + 1);
    }, [])
  );

  const handleTablePress = (table) => {
    let order = globalActiveOrders.find(o => o.tableId === table.id && o.status !== 'paid');
    
    if (!order) {
      // Create new open tab for this table
      order = createOrder('dine_in', table.id, null);
    }
    
    // Navigate to ordering screen with the order ID
    navigation.navigate('PosOrdering', { orderId: order.id });
  };

  const handleQuickOrder = (type) => {
    const customer = prompt("Nombre del Cliente:");
    if (!customer) return;
    const order = createOrder(type, null, customer);
    navigation.navigate('PosOrdering', { orderId: order.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 15}}>
              <Image source={require('../../assets/logo.png')} style={{width: 120, height: 40, resizeMode: 'contain'}} />
            </TouchableOpacity>
          <View style={{marginTop: 15}}>
            <Text style={styles.pageTitle}>Facturación y Pedidos</Text>
            <Text style={styles.pageSubtitle}>Gestión de Mesas, Delivery y Pick-up</Text>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dine_in' && styles.tabActive]}
            onPress={() => setActiveTab('dine_in')}
          >
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={activeTab === 'dine_in' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'dine_in' && styles.tabTextActive]}>Salón (Mesas)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pickup' && styles.tabActive]}
            onPress={() => setActiveTab('pickup')}
          >
            <MaterialCommunityIcons name="shopping" size={20} color={activeTab === 'pickup' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive]}>Para Llevar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
            onPress={() => setActiveTab('delivery')}
          >
            <MaterialCommunityIcons name="motorbike" size={20} color={activeTab === 'delivery' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive]}>A Domicilio</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'dine_in' && (
            <View style={styles.grid}>
              {globalTables.map(table => (
                <TouchableOpacity 
                  key={table.id}
                  style={[
                    styles.tableCard,
                    table.status === 'occupied' && styles.tableCardOccupied,
                    table.status === 'billed' && styles.tableCardBilled
                  ]}
                  onPress={() => handleTablePress(table)}
                >
                  <View style={styles.tableHeader}>
                    <Text style={[
                      styles.tableTitle,
                      table.status !== 'free' && { color: '#fff' }
                    ]}>{table.name}</Text>
                    <View style={styles.capacityBadge}>
                      <MaterialCommunityIcons name="account" size={12} color="#64748b" />
                      <Text style={styles.capacityText}>{table.capacity}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.tableBody}>
                    <MaterialCommunityIcons 
                      name={table.status === 'free' ? 'chair-rolling' : (table.status === 'occupied' ? 'account-group' : 'receipt')} 
                      size={32} 
                      color={table.status === 'free' ? '#cbd5e1' : '#fff'} 
                    />
                    <Text style={[
                      styles.statusText,
                      table.status !== 'free' && { color: '#e2e8f0' }
                    ]}>
                      {table.status === 'free' ? 'Libre' : (table.status === 'occupied' ? 'Ocupada' : 'Por Cobrar')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab !== 'dine_in' && (
            <View style={styles.otherServicesBox}>
              <TouchableOpacity style={styles.newOrderBtn} onPress={() => handleQuickOrder(activeTab)}>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.newOrderBtnTxt}>Nueva Orden {activeTab === 'pickup' ? 'Para Llevar' : 'A Domicilio'}</Text>
              </TouchableOpacity>
              
              <Text style={{marginTop: 30, fontSize: 16, fontWeight: 'bold', color: '#1e293b'}}>Órdenes Activas ({activeTab}):</Text>
              {globalActiveOrders.filter(o => o.type === activeTab && o.status !== 'paid').map(order => (
                <TouchableOpacity 
                  key={order.id} 
                  style={styles.activeOrderCard}
                  onPress={() => navigation.navigate('PosOrdering', { orderId: order.id })}
                >
                  <View>
                    <Text style={{fontWeight: 'bold', fontSize: 16, color: '#1e293b'}}>{order.customerName}</Text>
                    <Text style={{color: '#64748b', fontSize: 13}}>Orden: {order.id}</Text>
                  </View>
                  <Text style={{fontWeight: 'bold', fontSize: 16, color: '#10b981'}}>$ {order.total.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30 },
  
  header: { marginBottom: 30 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 6, marginBottom: 30, borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  content: { paddingBottom: 50 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  tableCard: { width: 160, height: 140, backgroundColor: '#fff', borderRadius: 16, padding: 15, borderWidth: 2, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  tableCardOccupied: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  tableCardBilled: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  capacityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  capacityText: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginLeft: 2 },

  tableBody: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginTop: 5 },

  otherServicesBox: { backgroundColor: '#fff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  newOrderBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', padding: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  newOrderBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  activeOrderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 15 }
});
