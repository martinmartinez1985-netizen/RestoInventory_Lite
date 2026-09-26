import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalActiveOrders, syncFromCloud, pushOrderToCloud } from '../store/mockDb';
import TicketModal from '../components/TicketModal';

// Helper ultra defensivo para formatear la hora sin que jamás lance excepciones
const formatOrderTime = (createdAt) => {
  try {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

// Helper seguro para obtener la etiqueta de la mesa
const getTableTitle = (order) => {
  try {
    if (!order) return 'Mesa 1';
    if (order.type === 'delivery') return 'Delivery';
    if (order.type === 'pickup') return 'Para Llevar';
    const rawId = order.tableId !== undefined && order.tableId !== null ? String(order.tableId) : '1';
    return `Mesa ${rawId.replace(/^T/i, '')}`;
  } catch (e) {
    return 'Mesa';
  }
};

// Componente Boundary interno para atrapar cualquier error inesperado
class KitchenErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error ? error.toString() : 'Error' };
  }
  componentDidCatch(error, info) {
    console.error("Error en pantalla de cocina:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#ef4444" />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 15 }}>Aviso en Pantalla de Cocina</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, textAlign: 'center', maxWidth: 400 }}>
            {this.state.errorMsg}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 20 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reintentar Cocina</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function KitchenScreenContent({ navigation }) {
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState(null);
  const [isKitchenModalVisible, setIsKitchenModalVisible] = useState(false);
  const [tick, setTick] = useState(0);

  // Auto-refrescar cada 3 segundos sincronizando con Supabase en tiempo real
  useEffect(() => {
    let interval;
    if (Platform.OS === 'web') {
      interval = setInterval(async () => {
        try {
          await syncFromCloud();
        } catch (e) {}
        setTick(t => t + 1);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, []);

  // Filtrar órdenes que tengan al menos 1 ítem enviado a cocina y no despachado
  const ordersList = Array.isArray(globalActiveOrders) ? globalActiveOrders : [];
  
  const pendingOrders = ordersList.filter(order => {
    if (!order || typeof order !== 'object') return false;
    let items = order.items;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!Array.isArray(items)) return false;
    return items.some(item => item && item.sentToKitchen === true && !item.kitchenReady);
  });

  const markItemReady = (orderId, itemIndex) => {
    const order = ordersList.find(o => o && o.id === orderId);
    if (order) {
      let items = order.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); order.items = items; } catch (e) { items = []; }
      }
      if (Array.isArray(items) && items[itemIndex]) {
        items[itemIndex].kitchenReady = true;
        try { pushOrderToCloud(order); } catch (e) {}
        setTick(t => t + 1);
      }
    }
  };

  const markOrderReady = (orderId) => {
    const order = ordersList.find(o => o && o.id === orderId);
    if (order) {
      let items = order.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); order.items = items; } catch (e) { items = []; }
      }
      if (Array.isArray(items)) {
        items.forEach(i => {
          if (i && i.sentToKitchen) i.kitchenReady = true;
        });
      }
      try { pushOrderToCloud(order); } catch (e) {}
      setTick(t => t + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navbar Oscuro para la Cocina */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (navigation && navigation.navigate) navigation.navigate('Dashboard');
            else if (navigation && navigation.goBack) navigation.goBack();
          }} 
          style={styles.backBtn}
        >
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
            <Text style={styles.emptySub}>La cocina está libre y lista para recibir pedidos</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {pendingOrders.map((order, i) => {
              let items = order.items;
              if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
              }
              const validItems = Array.isArray(items) ? items : [];
              const pendingItems = validItems.filter(item => item && item.sentToKitchen && !item.kitchenReady);

              return (
                <View key={order.id || i} style={styles.ticketCard}>
                  <View style={[styles.ticketHeader, order.type === 'delivery' ? { backgroundColor: '#ef4444' } : (order.type === 'dine_in' ? { backgroundColor: '#10b981' } : { backgroundColor: '#f59e0b' })]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.ticketTitle}>
                        {getTableTitle(order)}
                      </Text>
                      <Text style={styles.ticketTime}>{formatOrderTime(order.createdAt)}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 13, marginTop: 4, fontWeight: 'bold', opacity: 0.9 }}>
                      Ord: {order.order_number || order.id || 'N/A'}
                    </Text>
                    {order.customerName || order.customer_name ? (
                      <Text style={{ color: '#fff', fontSize: 15, marginTop: 4, fontWeight: 'bold' }}>
                        👤 {order.customerName || order.customer_name}
                      </Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.ticketBody}>
                    {pendingItems.map((item, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.itemRow} 
                        onPress={() => markItemReady(order.id, validItems.indexOf(item))}
                      >
                        <View style={styles.qtyBox}>
                          <Text style={styles.qtyText}>{item.qty || 1}</Text>
                        </View>
                        <Text style={styles.itemName}>{item.name || 'Plato'}</Text>
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
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Imprimir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1.4, backgroundColor: '#10b981', padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }} 
                      onPress={() => markOrderReady(order.id)}
                    >
                      <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Despachar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Impresión de Comanda */}
      {isKitchenModalVisible && selectedKitchenOrder && (
        <TicketModal 
          visible={isKitchenModalVisible}
          type="kitchen"
          order={selectedKitchenOrder}
          onClose={() => setIsKitchenModalVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

export default function KitchenScreen(props) {
  return (
    <KitchenErrorBoundary>
      <KitchenScreenContent {...props} />
    </KitchenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  header: { backgroundColor: '#1e293b', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  backBtnText: { color: '#fff', marginLeft: 6, fontWeight: 'bold', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  pulseDot: { width: 10, height: 10, backgroundColor: '#10b981', borderRadius: 5, ...Platform.select({ web: { boxShadow: '0 0 10px #10b981' } }) },
  
  container: { padding: 20, minHeight: '100%' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', fontSize: 22, fontWeight: 'bold', marginTop: 20 },
  emptySub: { color: '#64748b', fontSize: 14, marginTop: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  ticketCard: { backgroundColor: '#fff', width: 310, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  ticketHeader: { padding: 14 },
  ticketTitle: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  ticketTime: { color: '#fff', fontSize: 13, fontWeight: 'bold', opacity: 0.85 },
  
  ticketBody: { padding: 14, minHeight: 140 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  qtyBox: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
});
