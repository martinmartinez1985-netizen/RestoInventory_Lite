import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalTables, globalActiveOrders, createOrder, persistData, pushTableToCloud, globalRecipes, updateStock } from '../store/mockDb';

export default function BillingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 680;
  const isTablet = width >= 680 && width < 1050;
  const [activeTab, setActiveTab] = useState('dine_in');
  const [refresh, setRefresh] = useState(0);

  // Calcular el estado real y dinámico de cada mesa (Solo ocupada si tiene platos activos)
  const getTableStatus = (table) => {
    const activeOrder = globalActiveOrders.find(o => o.tableId === table.id && o.status !== 'paid');
    if (activeOrder && activeOrder.items && activeOrder.items.length > 0) {
      return activeOrder.status === 'billed' ? 'billed' : 'occupied';
    }
    return 'free';
  };

  // Limpieza y auto-detección defensiva al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
      // Limpiar órdenes activas sin ítems
      for (let i = globalActiveOrders.length - 1; i >= 0; i--) {
        const o = globalActiveOrders[i];
        if (!o.items || o.items.length === 0) {
          globalActiveOrders.splice(i, 1);
        }
      }
      // Actualizar estado de las mesas
      globalTables.forEach(t => {
        const active = globalActiveOrders.find(o => o.tableId === t.id && o.status !== 'paid' && o.items && o.items.length > 0);
        t.status = active ? (active.status === 'billed' ? 'billed' : 'occupied') : 'free';
      });
      persistData();
      setRefresh(prev => prev + 1);
    }, [])
  );

  // Re-render en tiempo real ante cambios en la nube
  React.useEffect(() => {
    const onSync = () => setRefresh(prev => prev + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('RESTOSYS_DATA_SYNCED', onSync);
      return () => window.removeEventListener('RESTOSYS_DATA_SYNCED', onSync);
    }
  }, []);

  const handleFreeAllEmptyTables = () => {
    for (let i = globalActiveOrders.length - 1; i >= 0; i--) {
      const o = globalActiveOrders[i];
      if (!o.items || o.items.length === 0) {
        globalActiveOrders.splice(i, 1);
      }
    }
    globalTables.forEach(t => {
      const active = globalActiveOrders.find(o => o.tableId === t.id && o.status !== 'paid' && o.items && o.items.length > 0);
      t.status = active ? (active.status === 'billed' ? 'billed' : 'occupied') : 'free';
      pushTableToCloud(t);
    });
    persistData();
    setRefresh(r => r + 1);
    alert("¡Mesas actualizadas y liberadas con éxito!");
  };

  const handleTablePress = (table) => {
    let order = globalActiveOrders.find(o => o.tableId === table.id && o.status !== 'paid');
    
    if (!order) {
      order = createOrder('dine_in', table.id, null);
    }
    
    navigation.navigate('PosOrdering', { orderId: order.id });
  };

  const handleQuickOrder = (type) => {
    const customer = prompt("Nombre del Cliente:");
    if (!customer) return;
    const order = createOrder(type, null, customer);
    navigation.navigate('PosOrdering', { orderId: order.id });
  };

  const handleCancelDirectOrder = async (orderToCancel) => {
    const confirmCancel = typeof window !== 'undefined' ? window.confirm(
      `⚠️ ¿ESTÁS SEGURO DE ANULAR ESTE PEDIDO (${orderToCancel.id})?\n\n` +
      `• Cliente: ${orderToCancel.customerName || 'Cliente General'}\n` +
      `• Total: $${Number(orderToCancel.total || 0).toFixed(2)}\n\n` +
      `Esta acción devolverá los ingredientes al almacén (si ya estaban en cocina) y eliminará el pedido.`
    ) : false;

    if (!confirmCancel) return;

    try {
      if (orderToCancel.items && Array.isArray(orderToCancel.items)) {
        orderToCancel.items.forEach(item => {
          const sentCount = item.sentQty || (item.sentToKitchen ? item.qty : 0);
          if (sentCount > 0) {
            const recipe = globalRecipes.find(r => (item.recipeId && r.id === item.recipeId) || r.name === item.name);
            if (recipe && recipe.ingredients) {
              recipe.ingredients.forEach(ing => {
                updateStock(ing.id, ing.amount * sentCount);
              });
            }
          }
        });
      }

      const idx = globalActiveOrders.findIndex(o => o.id === orderToCancel.id);
      if (idx !== -1) {
        globalActiveOrders.splice(idx, 1);
      }

      try {
        const { supabase } = await import('../config/supabase');
        if (supabase) {
          await supabase.from('orders').delete().eq('id', orderToCancel.id);
        }
      } catch (e) {
        console.warn("Error eliminando pedido en Supabase:", e.message);
      }

      persistData();
      setRefresh(r => r + 1);
      alert(`Pedido ${orderToCancel.id} anulado y eliminado.`);
    } catch (err) {
      alert("Error al anular pedido: " + err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, (isMobile || isTablet) && { paddingHorizontal: 15, paddingTop: 15 }]}>
        
        <View style={[styles.header, (isMobile || isTablet) && { marginBottom: 15 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 10}}>
              <Image source={require('../../assets/logo.png')} style={{width: isMobile ? 90 : 120, height: isMobile ? 30 : 40, resizeMode: 'contain'}} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.pageTitle, isMobile && { fontSize: 18 }]}>Facturación y Pedidos</Text>
              <Text style={[styles.pageSubtitle, isMobile && { fontSize: 11 }]}>Mesas, Delivery y Pick-up</Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleFreeAllEmptyTables}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', gap: 6 }}
          >
            <MaterialCommunityIcons name="broom" size={16} color="#64748b" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Liberar Vacías</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={[styles.tabsContainer, (isMobile || isTablet) && { marginBottom: 15, padding: 3 }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dine_in' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('dine_in')}
          >
            <MaterialCommunityIcons name="silverware-fork-knife" size={isMobile ? 16 : 20} color={activeTab === 'dine_in' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'dine_in' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>Salón</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pickup' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('pickup')}
          >
            <MaterialCommunityIcons name="shopping" size={isMobile ? 16 : 20} color={activeTab === 'pickup' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>Para Llevar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'delivery' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('delivery')}
          >
            <MaterialCommunityIcons name="motorbike" size={isMobile ? 16 : 20} color={activeTab === 'delivery' ? '#fff' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'dine_in' && (
            <View style={[styles.grid, (isMobile || isTablet) && { gap: 12 }]}>
              {globalTables.map(table => {
                const effectiveStatus = getTableStatus(table);
                return (
                  <TouchableOpacity 
                    key={table.id}
                    style={[
                      styles.tableCard,
                      isMobile && { width: (width - 42) / 2, height: 125, padding: 10 },
                      isTablet && { width: (width - 80) / 4, height: 130, padding: 10 },
                      effectiveStatus === 'occupied' && styles.tableCardOccupied,
                      effectiveStatus === 'billed' && styles.tableCardBilled
                    ]}
                    onPress={() => handleTablePress(table)}
                  >
                    <View style={styles.tableHeader}>
                      <Text style={[
                        styles.tableTitle,
                        effectiveStatus !== 'free' && { color: '#fff' }
                      ]}>{table.name}</Text>
                      <View style={styles.capacityBadge}>
                        <MaterialCommunityIcons name="account" size={12} color={effectiveStatus !== 'free' ? '#fff' : '#64748b'} />
                        <Text style={[styles.capacityText, effectiveStatus !== 'free' && { color: '#fff' }]}>{table.capacity}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.tableBody}>
                      <MaterialCommunityIcons 
                        name={effectiveStatus === 'free' ? 'chair-rolling' : (effectiveStatus === 'occupied' ? 'account-group' : 'receipt')} 
                        size={32} 
                        color={effectiveStatus === 'free' ? '#cbd5e1' : '#fff'} 
                      />
                      <Text style={[
                        styles.statusText,
                        effectiveStatus !== 'free' && { color: '#e2e8f0' }
                      ]}>
                        {effectiveStatus === 'free' ? 'Libre' : (effectiveStatus === 'occupied' ? 'Ocupada' : 'Por Cobrar')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
                <View 
                  key={order.id} 
                  style={styles.activeOrderCard}
                >
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('PosOrdering', { orderId: order.id })}
                  >
                    <Text style={{fontWeight: 'bold', fontSize: 16, color: '#1e293b'}}>{order.customerName}</Text>
                    <Text style={{color: '#64748b', fontSize: 13}}>Orden: {order.id}</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{fontWeight: 'bold', fontSize: 16, color: '#10b981'}}>$ {Number(order.total || 0).toFixed(2)}</Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' }}
                      onPress={() => handleCancelDirectOrder(order)}
                      title="Anular Pedido"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
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
