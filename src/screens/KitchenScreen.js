import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalActiveOrders, syncFromCloud, pushOrderToCloud } from '../store/mockDb';
import TicketModal from '../components/TicketModal';

export default function KitchenScreen({ navigation }) {
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState(null);
  const [isKitchenModalVisible, setIsKitchenModalVisible] = useState(false);
  const [tick, setTick] = useState(0);

  // Auto-refrescar cada 3 segundos sincronizando con Supabase en tiempo real
  useEffect(() => {
    let interval;
    if (Platform.OS === 'web') {
      interval = setInterval(async () => {
        await syncFromCloud();
        setTick(t => t + 1);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, []);

  // Filtrar órdenes que tengan al menos 1 ítem enviado a cocina y no despachado
  const pendingOrders = (globalActiveOrders || []).filter(order => 
    order.items && order.items.some(item => item.sentToKitchen === true && !item.kitchenReady)
  );

  const markItemReady = (orderId, itemIndex) => {
    const order = globalActiveOrders.find(o => o.id === orderId);
    if (order && order.items[itemIndex]) {
      order.items[itemIndex].kitchenReady = true;
      pushOrderToCloud(order);
      setTick(t => t + 1);
    }
  };

  const markOrderReady = (orderId) => {
    const order = globalActiveOrders.find(o => o.id === orderId);
    if (order) {
      order.items.forEach(i => {
        if (i.sentToKitchen) i.kitchenReady = true;
      });
      pushOrderToCloud(order);
      setTick(t => t + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navbar Oscuro para la Cocina */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pantalla de Cocina (KDS)</Text>
        <View style={styles.pulseDot} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {pendingOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="silverware-clean" size={60} color="#334155" />
            <Text style={styles.emptyText}>No hay comandas pendientes</Text>
            <Text style={styles.emptySub}>La cocina está libre</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {pendingOrders.map((order, i) => (
              <View key={i} style={styles.ticketCard}>
                <View style={[styles.ticketHeader, order.type === 'delivery' ? {backgroundColor: '#ef4444'} : (order.type === 'dine_in' ? {backgroundColor: '#10b981'} : {backgroundColor: '#f59e0b'})]}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={styles.ticketTitle}>
                        {order.type === 'dine_in' ? `Mesa ${order.tableId ? order.tableId.replace('T', '') : '1'}` : (order.type === 'delivery' ? 'Delivery' : 'Pick-up')}
                      </Text>
                      <Text style={styles.ticketTime}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                    <Text style={{color: '#fff', fontSize: 14, marginTop: 4, fontWeight: 'bold', opacity: 0.9}}>Ord: {order.id}</Text>
                    {order.customerName ? (
                      <Text style={{color: '#fff', fontSize: 16, marginTop: 4, fontWeight: 'bold'}}>👤 {order.customerName}</Text>
                    ) : null}
                  </View>
                
                <View style={styles.ticketBody}>
                  {order.items.filter(item => item.sentToKitchen && !item.kitchenReady).map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.itemRow} onPress={() => markItemReady(order.id, order.items.indexOf(item))}>
                      <View style={styles.qtyBox}><Text style={styles.qtyText}>{item.qty}</Text></View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <MaterialCommunityIcons name="check-circle-outline" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#0284c7', padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }} 
                      onPress={() => {
                        setSelectedKitchenOrder(order);
                        setIsKitchenModalVisible(true);
                      }}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Imprimir Comanda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1.5, backgroundColor: '#10b981', padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }} 
                      onPress={() => markOrderReady(order.id)}
                    >
                      <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Despachar Mesa</Text>
                    </TouchableOpacity>
                  </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <TicketModal 
        visible={isKitchenModalVisible}
        type="kitchen"
        order={selectedKitchenOrder}
        onClose={() => setIsKitchenModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { backgroundColor: '#1e293b', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backBtnText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  pulseDot: { width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 6, ...Platform.select({ web: { boxShadow: '0 0 10px #10b981' } }) },
  
  container: { padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  emptySub: { color: '#475569', fontSize: 16, marginTop: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  ticketCard: { backgroundColor: '#fff', width: 300, borderRadius: 12, overflow: 'hidden' },
  ticketHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  ticketTime: { color: '#fff', fontSize: 14, fontWeight: 'bold', opacity: 0.8 },
  
  ticketBody: { padding: 15, minHeight: 150 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  qtyBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 15 },
  qtyText: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  itemName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b' },
  
  dispatchBtn: { backgroundColor: '#10b981', padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  dispatchTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
