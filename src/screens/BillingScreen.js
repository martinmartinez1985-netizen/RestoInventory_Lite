import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, useWindowDimensions, Modal, TextInput, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  globalTables, 
  globalActiveOrders, 
  createOrder, 
  persistData, 
  pushTableToCloud, 
  globalRecipes, 
  updateStock, 
  deleteOrderFromCloud,
  addTemporaryTable,
  removeTemporaryTable,
  joinTables,
  unjoinTable
} from '../store/mockDb';

export default function BillingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isTablet = width >= 720 && width < 1050;
  
  const [activeTab, setActiveTab] = useState('dine_in'); // 'dine_in' | 'pickup' | 'delivery'
  const [viewMode, setViewMode] = useState('floor_plan'); // 'floor_plan' | 'grid'
  const [refresh, setRefresh] = useState(0);

  // Modals state
  const [selectedTableForMenu, setSelectedTableForMenu] = useState(null);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isExtraModalVisible, setIsExtraModalVisible] = useState(false);
  const [extraTableName, setExtraTableName] = useState('');
  const [extraTableCapacity, setExtraTableCapacity] = useState('4');

  // Calcular el estado real y dinámico de cada mesa
  const getTableStatus = useCallback((table) => {
    if (!table) return 'free';
    // Si la mesa está unida a otra, refleja el estado de la mesa principal
    const effectiveTableId = table.linkedTo || table.id;
    const activeOrder = globalActiveOrders.find(o => o.tableId === effectiveTableId && o.status !== 'paid');
    if (activeOrder && activeOrder.items && activeOrder.items.length > 0) {
      return activeOrder.status === 'billed' ? 'billed' : 'occupied';
    }
    return table.linkedTo ? 'occupied' : 'free';
  }, []);

  const getTableActiveTotal = useCallback((table) => {
    if (!table) return 0;
    const effectiveTableId = table.linkedTo || table.id;
    const activeOrder = globalActiveOrders.find(o => o.tableId === effectiveTableId && o.status !== 'paid');
    return Number(activeOrder?.total || 0);
  }, []);

  // Limpieza y auto-detección defensiva al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      // Limpiar órdenes activas vacías
      for (let i = globalActiveOrders.length - 1; i >= 0; i--) {
        const o = globalActiveOrders[i];
        if (!o.items || o.items.length === 0) {
          globalActiveOrders.splice(i, 1);
        }
      }
      // Actualizar estado de las mesas
      globalTables.forEach(t => {
        const effectiveId = t.linkedTo || t.id;
        const active = globalActiveOrders.find(o => o.tableId === effectiveId && o.status !== 'paid' && o.items && o.items.length > 0);
        t.status = active ? (active.status === 'billed' ? 'billed' : 'occupied') : (t.linkedTo ? 'occupied' : 'free');
      });
      persistData();
      setRefresh(prev => prev + 1);
    }, [])
  );

  // Re-render en tiempo real ante cambios en la nube
  useEffect(() => {
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
      const effectiveId = t.linkedTo || t.id;
      const active = globalActiveOrders.find(o => o.tableId === effectiveId && o.status !== 'paid' && o.items && o.items.length > 0);
      t.status = active ? (active.status === 'billed' ? 'billed' : 'occupied') : (t.linkedTo ? 'occupied' : 'free');
      pushTableToCloud(t);
    });
    persistData();
    setRefresh(r => r + 1);
    if (Platform.OS === 'web') alert("¡Mesas actualizadas y liberadas con éxito!");
    else Alert.alert("Éxito", "¡Mesas actualizadas y liberadas con éxito!");
  };

  const handleTablePress = (table) => {
    if (!table) return;
    // Si la mesa está unida a otra, abrir la orden de la mesa principal
    const effectiveTableId = table.linkedTo || table.id;
    let order = globalActiveOrders.find(o => o.tableId === effectiveTableId && o.status !== 'paid');
    
    if (!order) {
      const primaryTable = globalTables.find(t => t.id === effectiveTableId) || table;
      // Chequear si tiene mesas hijas unidas a esta
      const linkedChildren = globalTables.filter(t => t.linkedTo === primaryTable.id);
      let customerName = primaryTable.name;
      if (linkedChildren.length > 0) {
        customerName += ' + ' + linkedChildren.map(c => c.name).join(', ');
      }
      order = createOrder('dine_in', effectiveTableId, customerName);
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

      for (let i = globalActiveOrders.length - 1; i >= 0; i--) {
        if (globalActiveOrders[i].id === orderToCancel.id) {
          globalActiveOrders.splice(i, 1);
        }
      }

      deleteOrderFromCloud(orderToCancel.id);
      persistData();
      setRefresh(r => r + 1);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('RESTOSYS_DATA_SYNCED'));
      }
      alert(`Pedido ${orderToCancel.id} anulado y eliminado.`);
    } catch (err) {
      alert("Error al anular pedido: " + err.message);
    }
  };

  // Creación de mesa extra / temporal
  const handleCreateExtraTable = () => {
    const capNum = parseInt(extraTableCapacity, 10) || 4;
    addTemporaryTable(extraTableName, capNum);
    setExtraTableName('');
    setExtraTableCapacity('4');
    setIsExtraModalVisible(false);
    setRefresh(r => r + 1);
  };

  // Unir mesas
  const handleConfirmJoin = (targetMasterId) => {
    if (!selectedTableForMenu) return;
    joinTables(targetMasterId, selectedTableForMenu.id);
    setIsJoinModalVisible(false);
    setSelectedTableForMenu(null);
    setRefresh(r => r + 1);
    if (Platform.OS === 'web') alert("¡Mesas unidas exitosamente!");
    else Alert.alert("Éxito", "¡Mesas unidas exitosamente!");
  };

  // Desunir / Separar mesa
  const handleUnjoin = (table) => {
    unjoinTable(table.id);
    setSelectedTableForMenu(null);
    setRefresh(r => r + 1);
  };

  // Eliminar mesa temporal
  const handleDeleteExtra = (table) => {
    const active = globalActiveOrders.find(o => o.tableId === table.id && o.status !== 'paid');
    if (active) {
      const msg = "Esta mesa tiene una orden activa. Cóbrala o anúlala antes de eliminarla.";
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert("Aviso", msg);
      return;
    }
    removeTemporaryTable(table.id);
    setSelectedTableForMenu(null);
    setRefresh(r => r + 1);
  };

  // Extraer mesas fijas para el plano (1 al 9)
  const t1 = globalTables.find(t => t.id === 'T1');
  const t2 = globalTables.find(t => t.id === 'T2');
  const t3 = globalTables.find(t => t.id === 'T3');
  const t4 = globalTables.find(t => t.id === 'T4');
  const t5 = globalTables.find(t => t.id === 'T5');
  const t6 = globalTables.find(t => t.id === 'T6');
  const t7 = globalTables.find(t => t.id === 'T7');
  const t8 = globalTables.find(t => t.id === 'T8');
  const t9 = globalTables.find(t => t.id === 'T9');

  const extraTables = globalTables.filter(t => !['T1','T2','T3','T4','T5','T6','T7','T8','T9'].includes(t.id));

  // Render individual de cada tarjeta de mesa
  const renderTableCard = (table, customStyle = {}) => {
    if (!table) return <View style={[styles.tableSlotEmpty, customStyle]} />;
    
    const effectiveStatus = getTableStatus(table);
    const activeTotal = getTableActiveTotal(table);
    const isJoinedChild = Boolean(table.linkedTo);
    const joinedChildren = globalTables.filter(t => t.linkedTo === table.id);

    return (
      <TouchableOpacity 
        key={table.id}
        style={[
          styles.tableCard,
          customStyle,
          effectiveStatus === 'occupied' && styles.tableCardOccupied,
          effectiveStatus === 'billed' && styles.tableCardBilled,
          isJoinedChild && styles.tableCardJoinedChild
        ]}
        onPress={() => handleTablePress(table)}
        activeOpacity={0.85}
      >
        {/* Header tarjeta */}
        <View style={styles.tableCardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[
              styles.tableTitle,
              effectiveStatus !== 'free' && { color: '#fff' }
            ]}>
              {table.name}
            </Text>
            {table.isTemporary && (
              <View style={styles.tempBadge}>
                <Text style={styles.tempBadgeTxt}>Extra</Text>
              </View>
            )}
          </View>

          {/* Botón de opciones (tres puntos / unir) */}
          <TouchableOpacity 
            style={styles.optionsDotBtn} 
            onPress={(e) => {
              e.stopPropagation();
              setSelectedTableForMenu(table);
            }}
          >
            <MaterialCommunityIcons 
              name="dots-vertical" 
              size={18} 
              color={effectiveStatus !== 'free' ? '#fff' : '#64748b'} 
            />
          </TouchableOpacity>
        </View>

        {/* Badges de Unión */}
        {isJoinedChild && (
          <View style={styles.joinedBadge}>
            <MaterialCommunityIcons name="link-variant" size={12} color="#fff" />
            <Text style={styles.joinedBadgeTxt}>
              Unida a {globalTables.find(t => t.id === table.linkedTo)?.name || table.linkedTo}
            </Text>
          </View>
        )}

        {joinedChildren.length > 0 && !isJoinedChild && (
          <View style={[styles.joinedBadge, { backgroundColor: '#7c3aed' }]}>
            <MaterialCommunityIcons name="link-variant-plus" size={12} color="#fff" />
            <Text style={styles.joinedBadgeTxt}>
              +{joinedChildren.map(c => c.name.replace('Mesa ', 'M')).join(', ')}
            </Text>
          </View>
        )}

        {/* Cuerpo / Ícono */}
        <View style={styles.tableCardBody}>
          <MaterialCommunityIcons 
            name={
              effectiveStatus === 'free' 
                ? 'table-chair' 
                : (effectiveStatus === 'occupied' ? 'account-group' : 'receipt')
            } 
            size={30} 
            color={effectiveStatus === 'free' ? '#94a3b8' : '#ffffff'} 
          />
          <Text style={[
            styles.statusText,
            effectiveStatus !== 'free' && { color: '#e2e8f0' }
          ]}>
            {effectiveStatus === 'free' 
              ? 'Libre' 
              : (effectiveStatus === 'occupied' ? 'Ocupada' : 'Por Cobrar')}
          </Text>
        </View>

        {/* Footer: Capacidad y Total Consumido */}
        <View style={styles.tableCardFooter}>
          <View style={styles.capacityBadge}>
            <MaterialCommunityIcons 
              name="account" 
              size={12} 
              color={effectiveStatus !== 'free' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.capacityText, effectiveStatus !== 'free' && { color: '#fff' }]}>
              {table.capacity}
            </Text>
          </View>

          {activeTotal > 0 && (
            <Text style={[styles.totalConsumedText, effectiveStatus !== 'free' && { color: '#fff' }]}>
              ${activeTotal.toFixed(2)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, (isMobile || isTablet) && { paddingHorizontal: 12, paddingTop: 12 }]}>
        
        {/* HEADER SUPERIOR */}
        <View style={[styles.header, (isMobile || isTablet) && { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ marginRight: 10 }}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: isMobile ? 85 : 120, height: isMobile ? 28 : 40, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
            <View>
              <Text style={[styles.pageTitle, isMobile && { fontSize: 17 }]}>Facturación y Pedidos</Text>
              <Text style={[styles.pageSubtitle, isMobile && { fontSize: 11 }]}>
                {activeTab === 'dine_in' ? 'Plano del Salón y Mesas' : 'Servicios Directos'}
              </Text>
            </View>
          </View>

          {/* ACCIONES SUPERIORES */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {activeTab === 'dine_in' && (
              <>
                <TouchableOpacity 
                  onPress={() => setIsExtraModalVisible(true)}
                  style={styles.extraTableBtn}
                  title="Añadir mesa improvisada o temporal"
                >
                  <MaterialCommunityIcons name="plus-circle" size={16} color="#fff" />
                  <Text style={styles.extraTableBtnTxt}>{isMobile ? '+ Extra' : '+ Mesa Extra'}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setViewMode(v => v === 'floor_plan' ? 'grid' : 'floor_plan')}
                  style={styles.viewToggleBtn}
                  title="Alternar entre plano visual y cuadrícula"
                >
                  <MaterialCommunityIcons 
                    name={viewMode === 'floor_plan' ? 'view-grid-outline' : 'floor-plan'} 
                    size={16} 
                    color="#475569" 
                  />
                  {!isMobile && (
                    <Text style={styles.viewToggleBtnTxt}>
                      {viewMode === 'floor_plan' ? 'Cuadrícula' : 'Plano'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              onPress={handleFreeAllEmptyTables}
              style={styles.freeTablesBtn}
              title="Limpiar y liberar mesas vacías"
            >
              <MaterialCommunityIcons name="broom" size={16} color="#64748b" />
              {!isMobile && <Text style={styles.freeTablesBtnTxt}>Liberar Vacías</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* TABS (SALÓN, PARA LLEVAR, DELIVERY) */}
        <View style={[styles.tabsContainer, (isMobile || isTablet) && { marginBottom: 14, padding: 3 }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dine_in' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('dine_in')}
          >
            <MaterialCommunityIcons 
              name="silverware-fork-knife" 
              size={isMobile ? 16 : 20} 
              color={activeTab === 'dine_in' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'dine_in' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>
              Salón ({globalTables.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pickup' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('pickup')}
          >
            <MaterialCommunityIcons 
              name="shopping" 
              size={isMobile ? 16 : 20} 
              color={activeTab === 'pickup' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>
              Para Llevar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'delivery' && styles.tabActive, isMobile && { paddingVertical: 8 }]}
            onPress={() => setActiveTab('delivery')}
          >
            <MaterialCommunityIcons 
              name="motorbike" 
              size={isMobile ? 16 : 20} 
              color={activeTab === 'delivery' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive, isMobile && { fontSize: 11, marginLeft: 4 }]}>
              Delivery
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          
          {/* ===================== TAB SALÓN ===================== */}
          {activeTab === 'dine_in' && viewMode === 'floor_plan' && (
            <View style={styles.floorPlanWrapper}>
              
              {/* LEYENDA DEL PLANO */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.legendTxt}>Libre</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.legendTxt}>Ocupada</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendTxt}>Por Cobrar</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
                  <Text style={styles.legendTxt}>Mesas Unidas 🔗</Text>
                </View>
              </View>

              {/* CONTENEDOR ARQUITECTÓNICO DEL PLANO */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={[styles.floorPlanCanvas, isMobile && { minWidth: 640 }]}>
                  
                  {/* ====== COLUMNA IZQUIERDA (PASILLO LATERAL: M9, M8, CAJA) ====== */}
                  <View style={styles.sideCorridorColumn}>
                    {/* Mesa 9 (Arriba) */}
                    <View style={styles.tableSlot}>
                      {renderTableCard(t9, styles.floorTableCard)}
                    </View>

                    {/* Mesa 8 (Abajo) */}
                    <View style={styles.tableSlot}>
                      {renderTableCard(t8, styles.floorTableCard)}
                    </View>

                    {/* ZONA DE CAJA */}
                    <View style={styles.cashierBox}>
                      <View style={styles.cashierCounter}>
                        <MaterialCommunityIcons name="cash-register" size={24} color="#1e3a8a" />
                        <Text style={styles.cashierTitle}>CAJA</Text>
                        <Text style={styles.cashierSubtitle}>Cobro / Arqueo</Text>
                      </View>
                    </View>
                  </View>

                  {/* ====== PARED DIVISORIA VERTICAL ====== */}
                  <View style={styles.verticalWallContainer}>
                    {/* Quiebre / Pasillo superior */}
                    <View style={styles.wallOpeningTop}>
                      <View style={styles.angledWallPiece} />
                    </View>
                    {/* Pared sólida media e inferior */}
                    <View style={styles.verticalSolidWall} />
                  </View>

                  {/* ====== SALÓN PRINCIPAL (DERECHA) ====== */}
                  <View style={styles.mainRoomColumn}>
                    
                    {/* FILA SUPERIOR (FONDO): MESA 5, MESA 4, MESA 2 */}
                    <View style={styles.roomRowTop}>
                      <View style={styles.tableSlot}>
                        {renderTableCard(t5, styles.floorTableCard)}
                      </View>
                      <View style={styles.tableSlot}>
                        {renderTableCard(t4, styles.floorTableCard)}
                      </View>
                      <View style={styles.tableSlot}>
                        {renderTableCard(t2, styles.floorTableCard)}
                      </View>
                    </View>

                    {/* FILA MEDIA: MESA 3 y MESA 1 */}
                    <View style={styles.roomRowMiddle}>
                      <View style={styles.tableSlotSpacer} />
                      <View style={styles.tableSlot}>
                        {renderTableCard(t3, styles.floorTableCard)}
                      </View>
                      <View style={styles.tableSlot}>
                        {renderTableCard(t1, styles.floorTableCard)}
                      </View>
                    </View>

                    {/* LÍNEA DIVISORIA HORIZONTAL (MURETE / BARRA CENTRAL) */}
                    <View style={styles.horizontalDividerRow}>
                      <View style={styles.horizontalDividerLine} />
                    </View>

                    {/* FILA INFERIOR: MESA 6 y MESA 7 */}
                    <View style={styles.roomRowBottom}>
                      <View style={styles.tableSlotSpacer} />
                      <View style={styles.tableSlot}>
                        {renderTableCard(t6, styles.floorTableCard)}
                      </View>
                      <View style={styles.tableSlot}>
                        {renderTableCard(t7, styles.floorTableCard)}
                      </View>
                    </View>

                    {/* PUERTA DE ENTRADA (ABAJO AL LADO DE CAJA) */}
                    <View style={styles.entranceRow}>
                      <View style={styles.doorBox}>
                        <MaterialCommunityIcons name="door-open" size={20} color="#047857" />
                        <Text style={styles.doorText}>ENTRADA</Text>
                      </View>
                    </View>

                  </View>

                </View>
              </ScrollView>

              {/* SECCIÓN DE MESAS EXTRAS / IMPROVISADAS (SI EXISTEN) */}
              {extraTables.length > 0 && (
                <View style={styles.extraSectionContainer}>
                  <View style={styles.extraSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="star-box-outline" size={20} color="#f59e0b" />
                      <Text style={styles.extraSectionTitle}>Mesas Extras / Improvisadas</Text>
                    </View>
                    <Text style={styles.extraSectionSubtitle}>
                      {extraTables.length} mesa(s) temporal(es) activa(s)
                    </Text>
                  </View>
                  <View style={styles.extraGrid}>
                    {extraTables.map(tbl => renderTableCard(tbl, styles.extraTableCardItem))}
                  </View>
                </View>
              )}

            </View>
          )}

          {/* VISTA CUADRÍCULA ALTERNATIVA */}
          {activeTab === 'dine_in' && viewMode === 'grid' && (
            <View style={styles.grid}>
              {globalTables.map(table => renderTableCard(table, styles.gridCard))}
            </View>
          )}

          {/* ===================== TABS DIRECTOS (PICKUP / DELIVERY) ===================== */}
          {activeTab !== 'dine_in' && (
            <View style={styles.otherServicesBox}>
              <TouchableOpacity 
                style={styles.newOrderBtn} 
                onPress={() => handleQuickOrder(activeTab)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.newOrderBtnTxt}>
                  Nueva Orden {activeTab === 'pickup' ? 'Para Llevar' : 'A Domicilio'}
                </Text>
              </TouchableOpacity>
              
              <Text style={{ marginTop: 30, fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                Órdenes Activas ({activeTab}):
              </Text>
              
              {globalActiveOrders.filter(o => o.type === activeTab && o.status !== 'paid').map(order => (
                <View key={order.id} style={styles.activeOrderCard}>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('PosOrdering', { orderId: order.id })}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1e293b' }}>
                      {order.customerName}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 13 }}>ID: {order.id}</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#10b981' }}>
                      $ {Number(order.total || 0).toFixed(2)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.cancelOrderBtn}
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

        {/* ================= MODAL: OPCIONES DE MESA (UNIR / SEPARAR / ELIMINAR) ================= */}
        <Modal 
          visible={Boolean(selectedTableForMenu)} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setSelectedTableForMenu(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.menuModalContent}>
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedTableForMenu?.name}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Estado: {selectedTableForMenu ? getTableStatus(selectedTableForMenu).toUpperCase() : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTableForMenu(null)}>
                  <MaterialCommunityIcons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Botón 1: Abrir / Ver Comanda */}
              <TouchableOpacity 
                style={styles.modalActionBtn}
                onPress={() => {
                  const tbl = selectedTableForMenu;
                  setSelectedTableForMenu(null);
                  handleTablePress(tbl);
                }}
              >
                <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#2563eb" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionBtnTitle}>Abrir / Ver Comanda</Text>
                  <Text style={styles.actionBtnSub}>Cargar platos, bebidas o cobrar cuenta</Text>
                </View>
              </TouchableOpacity>

              {/* Botón 2: Unir con otra mesa */}
              {!selectedTableForMenu?.linkedTo && (
                <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setIsJoinModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="link-variant-plus" size={20} color="#7c3aed" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.actionBtnTitle}>Unir con otra mesa</Text>
                    <Text style={styles.actionBtnSub}>Fusionar comandas para grupos grandes</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Botón 3: Separar mesa si está unida */}
              {selectedTableForMenu?.linkedTo && (
                <TouchableOpacity 
                  style={[styles.modalActionBtn, { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }]}
                  onPress={() => handleUnjoin(selectedTableForMenu)}
                >
                  <MaterialCommunityIcons name="link-variant-off" size={20} color="#4f46e5" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionBtnTitle, { color: '#4338ca' }]}>Separar / Desvincular Mesa</Text>
                    <Text style={styles.actionBtnSub}>Volver a operar de forma independiente</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Botón 4: Eliminar mesa si es temporal */}
              {selectedTableForMenu?.isTemporary && (
                <TouchableOpacity 
                  style={[styles.modalActionBtn, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}
                  onPress={() => handleDeleteExtra(selectedTableForMenu)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.actionBtnTitle, { color: '#b91c1c' }]}>Retirar / Eliminar Mesa Extra</Text>
                    <Text style={styles.actionBtnSub}>Quitar esta mesa temporal del salón</Text>
                  </View>
                </TouchableOpacity>
              )}

            </View>
          </View>
        </Modal>

        {/* ================= MODAL: SELECCIONAR MESA PARA UNIR ================= */}
        <Modal 
          visible={isJoinModalVisible} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setIsJoinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.joinModalContent}>
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Unir {selectedTableForMenu?.name}</Text>
                  <Text style={styles.modalSubtitle}>¿Con cuál mesa deseas fusionarla?</Text>
                </View>
                <TouchableOpacity onPress={() => setIsJoinModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                {globalTables
                  .filter(t => t.id !== selectedTableForMenu?.id && t.linkedTo !== selectedTableForMenu?.id)
                  .map(targetTbl => {
                    const status = getTableStatus(targetTbl);
                    return (
                      <TouchableOpacity 
                        key={targetTbl.id}
                        style={styles.joinTargetItem}
                        onPress={() => handleConfirmJoin(targetTbl.id)}
                      >
                        <MaterialCommunityIcons name="table-chair" size={22} color="#475569" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1e293b' }}>
                            {targetTbl.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#64748b' }}>
                            Capacidad: {targetTbl.capacity} personas • Estado: {status.toUpperCase()}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="link-variant" size={20} color="#2563eb" />
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

            </View>
          </View>
        </Modal>

        {/* ================= MODAL: AÑADIR MESA EXTRA / TEMPORAL ================= */}
        <Modal 
          visible={isExtraModalVisible} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setIsExtraModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.extraModalContent}>
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Improvisar Mesa Extra</Text>
                  <Text style={styles.modalSubtitle}>Crea una mesa rápida para terraza, pasillo o barra</Text>
                </View>
                <TouchableOpacity onPress={() => setIsExtraModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>NOMBRE DE LA MESA:</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Ej. Mesa 10, Terraza 1, Barra 2"
                placeholderTextColor="#94a3b8"
                value={extraTableName}
                onChangeText={setExtraTableName}
              />

              <Text style={styles.inputLabel}>CAPACIDAD (PERSONAS):</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="4"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={extraTableCapacity}
                onChangeText={setExtraTableCapacity}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 }}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setIsExtraModalVisible(false)}
                >
                  <Text style={styles.cancelBtnTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmSaveBtn} 
                  onPress={handleCreateExtraTable}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="#fff" />
                  <Text style={styles.confirmSaveBtnTxt}>Crear Mesa</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 35, paddingTop: 24 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },

  extraTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    ...Platform.select({ web: { boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)', cursor: 'pointer' } })
  },
  extraTableBtnTxt: { color: '#fff', fontSize: 12.5, fontWeight: 'bold' },

  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  viewToggleBtnTxt: { color: '#475569', fontSize: 12, fontWeight: '700' },

  freeTablesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  freeTablesBtnTxt: { color: '#475569', fontSize: 12, fontWeight: '700' },

  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 6, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { marginLeft: 8, fontSize: 13.5, fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  contentScroll: { paddingBottom: 60 },

  // ================= PLANO ARQUITECTÓNICO =================
  floorPlanWrapper: { alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  floorPlanCanvas: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 24,
    minHeight: 520,
    ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(15, 23, 42, 0.05)' } })
  },

  // Columna Izquierda (Pasillo con M9, M8, Caja)
  sideCorridorColumn: {
    width: 155,
    justifyContent: 'space-between',
    paddingRight: 15
  },

  cashierBox: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    padding: 12,
    alignItems: 'center'
  },
  cashierCounter: { alignItems: 'center' },
  cashierTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginTop: 4 },
  cashierSubtitle: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },

  // Muro vertical divisorio
  verticalWallContainer: {
    width: 24,
    alignItems: 'center'
  },
  wallOpeningTop: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  angledWallPiece: {
    width: 6,
    height: 45,
    backgroundColor: '#94a3b8',
    borderRadius: 3,
    transform: [{ rotate: '30deg' }]
  },
  verticalSolidWall: {
    flex: 1,
    width: 6,
    backgroundColor: '#64748b',
    borderRadius: 3
  },

  // Salón Principal (Derecha)
  mainRoomColumn: {
    flex: 1,
    minWidth: 460,
    paddingLeft: 20,
    justifyContent: 'space-between'
  },

  roomRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15
  },
  roomRowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    marginTop: 18
  },
  roomRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
    marginTop: 18
  },

  horizontalDividerRow: {
    marginVertical: 18,
    alignItems: 'flex-end',
    paddingRight: 10
  },
  horizontalDividerLine: {
    width: '75%',
    height: 5,
    backgroundColor: '#94a3b8',
    borderRadius: 3
  },

  entranceRow: {
    marginTop: 20,
    alignItems: 'flex-start',
    paddingLeft: 10
  },
  doorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  doorText: { fontSize: 11, fontWeight: 'bold', color: '#065f46' },

  tableSlot: { flex: 1, minWidth: 130, maxWidth: 150 },
  tableSlotSpacer: { flex: 1, minWidth: 130, maxWidth: 150 },

  // Tarjeta de mesa estilo plano
  floorTableCard: {
    width: '100%',
    height: 125
  },

  // ================= ESTILO GENERAL DE TARJETA DE MESA =================
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' } })
  },
  tableCardOccupied: { 
    backgroundColor: '#f59e0b', 
    borderColor: '#d97706' 
  },
  tableCardBilled: { 
    backgroundColor: '#ef4444', 
    borderColor: '#dc2626' 
  },
  tableCardJoinedChild: {
    borderColor: '#6366f1',
    borderStyle: 'dashed'
  },

  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  optionsDotBtn: {
    padding: 2
  },

  tempBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  tempBadgeTxt: { fontSize: 9, fontWeight: 'bold', color: '#b45309' },

  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
    marginTop: 2
  },
  joinedBadgeTxt: { fontSize: 9.5, fontWeight: 'bold', color: '#fff' },

  tableCardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  statusText: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginTop: 2 
  },

  tableCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  capacityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.06)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 8 
  },
  capacityText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginLeft: 2 
  },
  totalConsumedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981'
  },

  // Vista Cuadrícula
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridCard: { width: 155, height: 135 },

  // Sección de Extras
  extraSectionContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16
  },
  extraSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8
  },
  extraSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  extraSectionSubtitle: { fontSize: 11, color: '#64748b' },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  extraTableCardItem: { width: 140, height: 125 },

  // Otros servicios
  otherServicesBox: { 
    backgroundColor: '#fff', 
    padding: 30, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  newOrderBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#3b82f6', 
    padding: 18, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  newOrderBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  activeOrderCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 18, 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginTop: 12 
  },
  cancelOrderBtn: {
    backgroundColor: '#fee2e2', 
    padding: 8, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#fca5a5'
  },

  // Modales
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.65)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  menuModalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 22, 
    width: 380, 
    maxWidth: '100%',
    ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } })
  },
  joinModalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 22, 
    width: 440, 
    maxWidth: '100%',
    ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } })
  },
  extraModalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 22, 
    width: 400, 
    maxWidth: '100%',
    ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } })
  },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10
  },
  actionBtnTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  actionBtnSub: { fontSize: 11, color: '#64748b', marginTop: 2 },

  joinTargetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    backgroundColor: '#f8fafc'
  },

  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 6, marginTop: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8fafc'
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  cancelBtnTxt: { color: '#64748b', fontWeight: 'bold', fontSize: 13 },
  confirmSaveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#7c3aed', 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8, 
    gap: 6 
  },
  confirmSaveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
