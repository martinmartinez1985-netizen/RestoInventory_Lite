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

  // MODO UNIR MESAS
  const [isJoinMode, setIsJoinMode] = useState(false);
  const [joinSourceTable, setJoinSourceTable] = useState(null);

  // Modal para mesas unidas o mesas extras
  const [selectedJoinedTable, setSelectedJoinedTable] = useState(null);

  // Modal para crear mesa extra
  const [isExtraModalVisible, setIsExtraModalVisible] = useState(false);
  const [extraTableName, setExtraTableName] = useState('');
  const [extraTableCapacity, setExtraTableCapacity] = useState('4');

  // Calcular el estado real y dinámico de cada mesa
  const getTableStatus = useCallback((table) => {
    if (!table) return 'free';
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

  // Limpieza defensiva al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
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
      });
      persistData();
      setRefresh(prev => prev + 1);
    }, [])
  );

  // Re-render en tiempo real ante eventos de Supabase
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

  // Manejador principal de toque en una mesa
  const handleTablePress = (table) => {
    if (!table) return;

    // 1. SI ESTAMOS EN MODO UNIR MESAS
    if (isJoinMode) {
      if (!joinSourceTable) {
        // Seleccionar la primera mesa
        setJoinSourceTable(table);
      } else {
        // Seleccionar la segunda mesa y unirlas
        if (joinSourceTable.id === table.id) {
          // Deseleccionar si toca la misma
          setJoinSourceTable(null);
          return;
        }
        joinTables(joinSourceTable.id, table.id);
        setIsJoinMode(false);
        setJoinSourceTable(null);
        setRefresh(r => r + 1);
        const msg = `¡${joinSourceTable.name} y ${table.name} unidas con éxito!`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert("Mesas Unidas", msg);
      }
      return;
    }

    // 2. SI LA MESA YA ESTÁ UNIDA A OTRA O TIENE MESAS UNIDAS A ELLA:
    // Mostrar modal con opciones (Abrir comanda o Separar)
    const isLinked = Boolean(table.linkedTo);
    const hasChildren = globalTables.some(t => t.linkedTo === table.id);

    if (isLinked || hasChildren) {
      setSelectedJoinedTable(table);
      return;
    }

    // 3. FLUJO NORMAL: ABRIR COMANDA DIRECTA
    openOrderForTable(table);
  };

  const openOrderForTable = (table) => {
    const effectiveTableId = table.linkedTo || table.id;
    let order = globalActiveOrders.find(o => o.tableId === effectiveTableId && o.status !== 'paid');
    
    if (!order) {
      const primaryTable = globalTables.find(t => t.id === effectiveTableId) || table;
      const linkedChildren = globalTables.filter(t => t.linkedTo === primaryTable.id);
      let customerName = primaryTable.name;
      if (linkedChildren.length > 0) {
        customerName += ' + ' + linkedChildren.map(c => c.name).join(', ');
      }
      order = createOrder('dine_in', effectiveTableId, customerName);
    }
    
    navigation.navigate('PosOrdering', { orderId: order.id });
  };

  const handleSeparateTable = (table) => {
    if (table.linkedTo) {
      unjoinTable(table.id);
    } else {
      // Si era la mesa principal, desunir a todas las hijas
      const children = globalTables.filter(t => t.linkedTo === table.id);
      children.forEach(c => unjoinTable(c.id));
    }
    setSelectedJoinedTable(null);
    setRefresh(r => r + 1);
    if (Platform.OS === 'web') alert("¡Mesas separadas con éxito!");
    else Alert.alert("Éxito", "¡Mesas separadas con éxito!");
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

  const handleCreateExtraTable = () => {
    const capNum = parseInt(extraTableCapacity, 10) || 4;
    addTemporaryTable(extraTableName, capNum);
    setExtraTableName('');
    setExtraTableCapacity('4');
    setIsExtraModalVisible(false);
    setRefresh(r => r + 1);
  };

  const handleDeleteExtraTable = (table) => {
    const active = globalActiveOrders.find(o => o.tableId === table.id && o.status !== 'paid');
    if (active) {
      alert("Esta mesa tiene una orden activa. Cóbrala o anúlala antes de eliminarla.");
      return;
    }
    removeTemporaryTable(table.id);
    setSelectedJoinedTable(null);
    setRefresh(r => r + 1);
  };

  // Mesas fijas (T1..T9)
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

  // Render individual de cada tarjeta de mesa (compacta y nítida)
  const renderTableCard = (table, customStyle = {}) => {
    if (!table) return <View style={[styles.tableSlotEmpty, customStyle]} />;
    
    const effectiveStatus = getTableStatus(table);
    const activeTotal = getTableActiveTotal(table);
    const isLinked = Boolean(table.linkedTo);
    const isMasterOfLinked = globalTables.some(t => t.linkedTo === table.id);
    const isSelectedInJoinMode = joinSourceTable?.id === table.id;

    return (
      <TouchableOpacity 
        key={table.id}
        style={[
          styles.tableCard,
          customStyle,
          effectiveStatus === 'occupied' && styles.tableCardOccupied,
          effectiveStatus === 'billed' && styles.tableCardBilled,
          (isLinked || isMasterOfLinked) && styles.tableCardJoined,
          isSelectedInJoinMode && styles.tableCardSelectedForJoin
        ]}
        onPress={() => handleTablePress(table)}
        activeOpacity={0.8}
      >
        {/* Header tarjeta */}
        <View style={styles.tableCardHeader}>
          <Text style={[
            styles.tableTitle,
            (effectiveStatus !== 'free' || isLinked || isMasterOfLinked || isSelectedInJoinMode) && { color: '#fff' }
          ]}>
            {table.name}
          </Text>

          <View style={styles.capacityBadge}>
            <MaterialCommunityIcons 
              name="account" 
              size={11} 
              color={(effectiveStatus !== 'free' || isLinked || isMasterOfLinked || isSelectedInJoinMode) ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.capacityText, (effectiveStatus !== 'free' || isLinked || isMasterOfLinked || isSelectedInJoinMode) && { color: '#fff' }]}>
              {table.capacity}
            </Text>
          </View>
        </View>

        {/* Indicador de Unión */}
        {isLinked && (
          <View style={styles.badgeJoinedPill}>
            <MaterialCommunityIcons name="link-variant" size={11} color="#fff" />
            <Text style={styles.badgeJoinedTxt}>Unida a {table.linkedTo}</Text>
          </View>
        )}
        {isMasterOfLinked && !isLinked && (
          <View style={[styles.badgeJoinedPill, { backgroundColor: '#6366f1' }]}>
            <MaterialCommunityIcons name="link-variant" size={11} color="#fff" />
            <Text style={styles.badgeJoinedTxt}>Mesas unidas</Text>
          </View>
        )}

        {/* Cuerpo */}
        <View style={styles.tableCardBody}>
          <MaterialCommunityIcons 
            name={
              effectiveStatus === 'free' 
                ? 'table-chair' 
                : (effectiveStatus === 'occupied' ? 'account-group' : 'receipt')
            } 
            size={22} 
            color={(effectiveStatus !== 'free' || isLinked || isMasterOfLinked || isSelectedInJoinMode) ? '#ffffff' : '#94a3b8'} 
          />
          <Text style={[
            styles.statusText,
            (effectiveStatus !== 'free' || isLinked || isMasterOfLinked || isSelectedInJoinMode) && { color: '#ffffff' }
          ]}>
            {isJoinMode 
              ? (isSelectedInJoinMode ? '✓ Seleccionada' : 'Toca para unir')
              : (effectiveStatus === 'free' ? 'Libre' : (effectiveStatus === 'occupied' ? 'Ocupada' : 'Por Cobrar'))}
          </Text>
        </View>

        {/* Footer: Monto consumido si está ocupada */}
        {activeTotal > 0 && (
          <View style={styles.tableCardFooter}>
            <Text style={styles.totalConsumedText}>
              ${activeTotal.toFixed(2)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, (isMobile || isTablet) && { paddingHorizontal: 12, paddingTop: 10 }]}>
        
        {/* HEADER SUPERIOR */}
        <View style={[styles.header, (isMobile || isTablet) && { marginBottom: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ marginRight: 8 }}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: isMobile ? 80 : 110, height: isMobile ? 26 : 36, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
            <View>
              <Text style={[styles.pageTitle, isMobile && { fontSize: 16 }]}>Facturación y Pedidos</Text>
              <Text style={[styles.pageSubtitle, isMobile && { fontSize: 10.5 }]}>
                {activeTab === 'dine_in' ? 'Plano del Salón' : 'Servicios Directos'}
              </Text>
            </View>
          </View>

          {/* ACCIONES SUPERIORES */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {activeTab === 'dine_in' && (
              <>
                {/* BOTÓN PROMINENTE: UNIR MESAS */}
                <TouchableOpacity 
                  onPress={() => {
                    setIsJoinMode(prev => !prev);
                    setJoinSourceTable(null);
                  }}
                  style={[styles.joinModeBtn, isJoinMode && styles.joinModeBtnActive]}
                >
                  <MaterialCommunityIcons 
                    name={isJoinMode ? "close-circle" : "link-variant-plus"} 
                    size={15} 
                    color="#fff" 
                  />
                  <Text style={styles.joinModeBtnTxt}>
                    {isJoinMode ? 'Cancelar Unión' : '🔗 Unir Mesas'}
                  </Text>
                </TouchableOpacity>

                {/* BOTÓN: MESA EXTRA */}
                <TouchableOpacity 
                  onPress={() => setIsExtraModalVisible(true)}
                  style={styles.extraTableBtn}
                >
                  <MaterialCommunityIcons name="plus" size={15} color="#fff" />
                  <Text style={styles.extraTableBtnTxt}>+ Mesa Extra</Text>
                </TouchableOpacity>

                {/* TOGGLE VISTA */}
                <TouchableOpacity 
                  onPress={() => setViewMode(v => v === 'floor_plan' ? 'grid' : 'floor_plan')}
                  style={styles.viewToggleBtn}
                >
                  <MaterialCommunityIcons 
                    name={viewMode === 'floor_plan' ? 'view-grid-outline' : 'floor-plan'} 
                    size={15} 
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
            >
              <MaterialCommunityIcons name="broom" size={15} color="#64748b" />
              {!isMobile && <Text style={styles.freeTablesBtnTxt}>Liberar Vacías</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* BANNER INFORMATIVO CUANDO EL MODO UNIR MESAS ESTÁ ACTIVO */}
        {isJoinMode && (
          <View style={styles.joinBanner}>
            <MaterialCommunityIcons name="information" size={18} color="#fff" />
            <Text style={styles.joinBannerTxt}>
              {!joinSourceTable 
                ? "Paso 1: Toca en el plano la primera mesa que deseas unir."
                : `Paso 2: Toca la segunda mesa para unirla con "${joinSourceTable.name}".`}
            </Text>
            <TouchableOpacity onPress={() => { setIsJoinMode(false); setJoinSourceTable(null); }} style={styles.joinBannerClose}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>✕ Salir</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TABS (SALÓN, PARA LLEVAR, DELIVERY) */}
        <View style={[styles.tabsContainer, (isMobile || isTablet) && { marginBottom: 10, padding: 3 }]}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'dine_in' && styles.tabActive]}
            onPress={() => setActiveTab('dine_in')}
          >
            <MaterialCommunityIcons 
              name="silverware-fork-knife" 
              size={isMobile ? 15 : 18} 
              color={activeTab === 'dine_in' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'dine_in' && styles.tabTextActive, isMobile && { fontSize: 11.5, marginLeft: 4 }]}>
              Salón ({globalTables.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pickup' && styles.tabActive]}
            onPress={() => setActiveTab('pickup')}
          >
            <MaterialCommunityIcons 
              name="shopping" 
              size={isMobile ? 15 : 18} 
              color={activeTab === 'pickup' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive, isMobile && { fontSize: 11.5, marginLeft: 4 }]}>
              Para Llevar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
            onPress={() => setActiveTab('delivery')}
          >
            <MaterialCommunityIcons 
              name="motorbike" 
              size={isMobile ? 15 : 18} 
              color={activeTab === 'delivery' ? '#fff' : '#64748b'} 
            />
            <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive, isMobile && { fontSize: 11.5, marginLeft: 4 }]}>
              Delivery
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          
          {/* ===================== TAB SALÓN ===================== */}
          {activeTab === 'dine_in' && viewMode === 'floor_plan' && (
            <View style={styles.floorPlanWrapper}>
              
              {/* LEYENDA DEL PLANO (COMPACTA) */}
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
                  <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
                  <Text style={styles.legendTxt}>Unidas 🔗</Text>
                </View>
              </View>

              {/* CONTENEDOR ARQUITECTÓNICO DEL PLANO (AUTO-AJUSTABLE) */}
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={[styles.floorPlanCanvas, isMobile && { minWidth: 580 }]}>
                  
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
                      <MaterialCommunityIcons name="cash-register" size={20} color="#1e3a8a" />
                      <Text style={styles.cashierTitle}>CAJA</Text>
                      <Text style={styles.cashierSubtitle}>Cobro / Arqueo</Text>
                    </View>
                  </View>

                  {/* ====== PARED DIVISORIA VERTICAL ====== */}
                  <View style={styles.verticalWallContainer}>
                    <View style={styles.wallOpeningTop}>
                      <View style={styles.angledWallPiece} />
                    </View>
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

                    {/* LÍNEA DIVISORIA HORIZONTAL */}
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

                    {/* ENTRADA */}
                    <View style={styles.entranceRow}>
                      <View style={styles.doorBox}>
                        <MaterialCommunityIcons name="door-open" size={16} color="#047857" />
                        <Text style={styles.doorText}>ENTRADA</Text>
                      </View>
                    </View>

                  </View>

                </View>
              </ScrollView>

              {/* SECCIÓN DE MESAS EXTRAS / IMPROVISADAS */}
              {extraTables.length > 0 && (
                <View style={styles.extraSectionContainer}>
                  <View style={styles.extraSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="star-box" size={18} color="#f59e0b" />
                      <Text style={styles.extraSectionTitle}>Mesas Extras / Improvisadas</Text>
                    </View>
                    <Text style={styles.extraSectionSubtitle}>
                      {extraTables.length} mesa(s) temporal(es)
                    </Text>
                  </View>
                  <View style={styles.extraGrid}>
                    {extraTables.map(tbl => (
                      <View key={tbl.id} style={{ position: 'relative' }}>
                        {renderTableCard(tbl, styles.extraTableCardItem)}
                        <TouchableOpacity 
                          style={styles.deleteExtraBadgeBtn}
                          onPress={() => handleDeleteExtraTable(tbl)}
                          title="Eliminar esta mesa extra"
                        >
                          <MaterialCommunityIcons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
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

          {/* TABS DIRECTOS (PICKUP / DELIVERY) */}
          {activeTab !== 'dine_in' && (
            <View style={styles.otherServicesBox}>
              <TouchableOpacity 
                style={styles.newOrderBtn} 
                onPress={() => handleQuickOrder(activeTab)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="plus-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.newOrderBtnTxt}>
                  Nueva Orden {activeTab === 'pickup' ? 'Para Llevar' : 'A Domicilio'}
                </Text>
              </TouchableOpacity>
              
              <Text style={{ marginTop: 24, fontSize: 15, fontWeight: 'bold', color: '#1e293b' }}>
                Órdenes Activas ({activeTab}):
              </Text>
              
              {globalActiveOrders.filter(o => o.type === activeTab && o.status !== 'paid').map(order => (
                <View key={order.id} style={styles.activeOrderCard}>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => navigation.navigate('PosOrdering', { orderId: order.id })}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#1e293b' }}>
                      {order.customerName}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>ID: {order.id}</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#10b981' }}>
                      $ {Number(order.total || 0).toFixed(2)}
                    </Text>
                    <TouchableOpacity 
                      style={styles.cancelOrderBtn}
                      onPress={() => handleCancelDirectOrder(order)}
                      title="Anular Pedido"
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={17} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>

        {/* ================= MODAL DE ACCIÓN PARA MESAS UNIDAS ================= */}
        <Modal 
          visible={Boolean(selectedJoinedTable)} 
          transparent={true} 
          animationType="fade"
          onRequestClose={() => setSelectedJoinedTable(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.menuModalContent}>
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedJoinedTable?.name} (Mesas Unidas 🔗)
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedJoinedTable?.linkedTo 
                      ? `Unida a la mesa principal ${selectedJoinedTable.linkedTo}`
                      : 'Mesa principal con otras mesas agrupadas'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedJoinedTable(null)}>
                  <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Botón 1: Abrir Comanda Unificada */}
              <TouchableOpacity 
                style={styles.modalActionBtn}
                onPress={() => {
                  const tbl = selectedJoinedTable;
                  setSelectedJoinedTable(null);
                  openOrderForTable(tbl);
                }}
              >
                <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#2563eb" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.actionBtnTitle}>Abrir / Cobrar Comanda Unificada</Text>
                  <Text style={styles.actionBtnSub}>Ver cuenta conjunta de las mesas</Text>
                </View>
              </TouchableOpacity>

              {/* Botón 2: Separar Mesas */}
              <TouchableOpacity 
                style={[styles.modalActionBtn, { borderColor: '#c7d2fe', backgroundColor: '#eef2ff' }]}
                onPress={() => handleSeparateTable(selectedJoinedTable)}
              >
                <MaterialCommunityIcons name="link-variant-off" size={18} color="#4f46e5" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.actionBtnTitle, { color: '#4338ca' }]}>✂️ Separar / Desvincular Mesas</Text>
                  <Text style={styles.actionBtnSub}>Volver a operar de forma independiente</Text>
                </View>
              </TouchableOpacity>

              {/* Botón 3: Si es temporal, opción de eliminar */}
              {selectedJoinedTable?.isTemporary && (
                <TouchableOpacity 
                  style={[styles.modalActionBtn, { borderColor: '#fca5a5', backgroundColor: '#fef2f2' }]}
                  onPress={() => handleDeleteExtraTable(selectedJoinedTable)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.actionBtnTitle, { color: '#b91c1c' }]}>Eliminar Mesa Extra</Text>
                    <Text style={styles.actionBtnSub}>Retirar esta mesa improvisada</Text>
                  </View>
                </TouchableOpacity>
              )}

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
                  <Text style={styles.modalSubtitle}>Crea una mesa rápida para terraza o barra</Text>
                </View>
                <TouchableOpacity onPress={() => setIsExtraModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>NOMBRE DE LA MESA:</Text>
              <TextInput 
                style={styles.modalInput}
                placeholder="Ej. Mesa 10, Terraza 1, Barra"
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
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 16 },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 12, color: '#64748b', marginTop: 1 },

  // Botón Prominente Unir Mesas
  joinModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    ...Platform.select({ web: { boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)', cursor: 'pointer' } })
  },
  joinModeBtnActive: {
    backgroundColor: '#dc2626'
  },
  joinModeBtnTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  extraTableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  extraTableBtnTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  viewToggleBtnTxt: { color: '#475569', fontSize: 11.5, fontWeight: '700' },

  freeTablesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4
  },
  freeTablesBtnTxt: { color: '#475569', fontSize: 11.5, fontWeight: '700' },

  // Banner Informativo Modo Unir
  joinBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8
  },
  joinBannerTxt: { flex: 1, color: '#fff', fontSize: 12.5, fontWeight: 'bold' },
  joinBannerClose: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 4, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { marginLeft: 6, fontSize: 12.5, fontWeight: 'bold', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  contentScroll: { paddingBottom: 35 },

  // ================= PLANO ARQUITECTÓNICO COMPACTO =================
  floorPlanWrapper: { alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendTxt: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  floorPlanCanvas: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 14,
    ...Platform.select({ web: { boxShadow: '0px 4px 16px rgba(15, 23, 42, 0.05)' } })
  },

  // Columna Izquierda (Pasillo con M9, M8, Caja)
  sideCorridorColumn: {
    width: 130,
    justifyContent: 'space-between',
    paddingRight: 10
  },

  cashierBox: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    padding: 8,
    alignItems: 'center',
    height: 70,
    justifyContent: 'center'
  },
  cashierTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },
  cashierSubtitle: { fontSize: 9.5, color: '#3b82f6', fontWeight: '600' },

  // Muro vertical divisorio
  verticalWallContainer: {
    width: 20,
    alignItems: 'center'
  },
  wallOpeningTop: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  angledWallPiece: {
    width: 5,
    height: 38,
    backgroundColor: '#94a3b8',
    borderRadius: 2,
    transform: [{ rotate: '30deg' }]
  },
  verticalSolidWall: {
    flex: 1,
    width: 5,
    backgroundColor: '#64748b',
    borderRadius: 2
  },

  // Salón Principal (Derecha)
  mainRoomColumn: {
    flex: 1,
    minWidth: 410,
    paddingLeft: 14,
    justifyContent: 'space-between'
  },

  roomRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },
  roomRowMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 8
  },
  roomRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 8
  },

  horizontalDividerRow: {
    marginVertical: 10,
    alignItems: 'flex-end',
    paddingRight: 6
  },
  horizontalDividerLine: {
    width: '74%',
    height: 4,
    backgroundColor: '#94a3b8',
    borderRadius: 2
  },

  entranceRow: {
    marginTop: 10,
    alignItems: 'flex-start',
    paddingLeft: 6
  },
  doorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  doorText: { fontSize: 10, fontWeight: 'bold', color: '#065f46' },

  tableSlot: { flex: 1, minWidth: 110, maxWidth: 135 },
  tableSlotSpacer: { flex: 1, minWidth: 110, maxWidth: 135 },

  // Tarjeta de mesa compacta (altura reducida de 125 a 84)
  floorTableCard: {
    width: '100%',
    height: 84
  },

  // ================= ESTILO DE TARJETA DE MESA =================
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
    ...Platform.select({ web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.03)', cursor: 'pointer' } })
  },
  tableCardOccupied: { 
    backgroundColor: '#f59e0b', 
    borderColor: '#d97706' 
  },
  tableCardBilled: { 
    backgroundColor: '#ef4444', 
    borderColor: '#dc2626' 
  },
  tableCardJoined: {
    backgroundColor: '#7c3aed',
    borderColor: '#6d28d9'
  },
  tableCardSelectedForJoin: {
    backgroundColor: '#a855f7',
    borderColor: '#fff',
    borderWidth: 2,
    transform: [{ scale: 1.04 }]
  },

  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tableTitle: { 
    fontSize: 12.5, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },

  badgeJoinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
    alignSelf: 'flex-start',
    marginTop: 1
  },
  badgeJoinedTxt: { fontSize: 9, fontWeight: 'bold', color: '#fff' },

  tableCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 2
  },
  statusText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#64748b'
  },

  tableCardFooter: {
    alignItems: 'flex-end'
  },
  capacityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    paddingHorizontal: 5, 
    paddingVertical: 1.5, 
    borderRadius: 6 
  },
  capacityText: { 
    fontSize: 9.5, 
    fontWeight: 'bold', 
    color: '#64748b', 
    marginLeft: 2 
  },
  totalConsumedText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#fff'
  },

  // Vista Cuadrícula
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCard: { width: 140, height: 95 },

  // Sección de Extras Compacta
  extraSectionContainer: {
    marginTop: 12,
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10
  },
  extraSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4
  },
  extraSectionTitle: { fontSize: 12.5, fontWeight: 'bold', color: '#1e293b' },
  extraSectionSubtitle: { fontSize: 10.5, color: '#64748b' },
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  extraTableCardItem: { width: 120, height: 80 },
  deleteExtraBadgeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },

  // Otros servicios (Pickup / Delivery)
  otherServicesBox: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  newOrderBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  newOrderBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  activeOrderCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#f8fafc', 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    marginTop: 10 
  },
  cancelOrderBtn: {
    backgroundColor: '#fee2e2', 
    padding: 7, 
    borderRadius: 6, 
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
    borderRadius: 14, 
    padding: 20, 
    width: 360, 
    maxWidth: '100%',
    ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } })
  },
  extraModalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    padding: 20, 
    width: 380, 
    maxWidth: '100%',
    ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' } })
  },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 14 
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 11.5, color: '#64748b', marginTop: 2 },

  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 8
  },
  actionBtnTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  actionBtnSub: { fontSize: 10.5, color: '#64748b', marginTop: 1 },

  inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#475569', marginBottom: 5, marginTop: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13.5,
    backgroundColor: '#f8fafc'
  },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  cancelBtnTxt: { color: '#64748b', fontWeight: 'bold', fontSize: 12.5 },
  confirmSaveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#7c3aed', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 6, 
    gap: 4 
  },
  confirmSaveBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12.5 }
});
