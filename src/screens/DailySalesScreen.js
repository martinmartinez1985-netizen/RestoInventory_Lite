import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  Platform,
  Image,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalOrderHistory, globalSettings, globalShift, pushShiftToCloud, globalRecipes, updateStock, persistData, deleteOrderFromCloud } from '../store/mockDb';
import TicketModal from '../components/TicketModal';

const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  headerBg: '#1e293b',
  primary: '#0ea5e9',
  primaryDark: '#0284c7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

// Formateador de dinero
const formatMoney = (val) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Formateador de fechas YYYY-MM-DD
const toISODateOnly = (d) => {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailySalesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);
  const [isAuditModalVisible, setIsAuditModalVisible] = useState(false);
  const today = toISODateOnly(new Date());

  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const onSync = () => setLiveTick(t => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('RESTOSYS_DATA_SYNCED', onSync);
      return () => window.removeEventListener('RESTOSYS_DATA_SYNCED', onSync);
    }
  }, []);

  // Rango de fechas
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activePreset, setActivePreset] = useState('today'); // 'today', 'yesterday', 'week', 'month', 'all'
  
  // Pestaña activa
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'dishes', 'payments'
  
  // Filtro de búsqueda en auditoría
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');

  const handleVoidInvoice = async (orderToVoid) => {
    const confirmVoid = typeof window !== 'undefined' ? window.confirm(
      `⚠️ ¿ESTÁS SEGURO DE ANULAR ESTA FACTURA (${orderToVoid.id})?\n\n` +
      `• Monto: $${formatMoney(orderToVoid.total)}\n` +
      `• Cliente: ${orderToVoid.customerName || 'Cliente General'}\n\n` +
      `Esta acción:\n` +
      `1. Restará el monto de las ventas del día y del turno actual.\n` +
      `2. Devolverá los ingredientes de los platos al almacén.\n` +
      `3. Eliminará la factura del historial de ventas y de la nube.`
    ) : false;

    if (!confirmVoid) return;

    try {
      // 1. Devolver ingredientes al almacén
      if (orderToVoid.items && Array.isArray(orderToVoid.items)) {
        orderToVoid.items.forEach(item => {
          const qty = Number(item.qty || 1);
          const recipe = globalRecipes.find(r => (item.recipeId && r.id === item.recipeId) || r.name === item.name);
          if (recipe && recipe.ingredients) {
            recipe.ingredients.forEach(ing => {
              updateStock(ing.id, ing.amount * qty);
            });
          }
        });
      }

      // 2. Revertir monto de las ventas del turno actual si está abierto
      if (globalShift && globalShift.sales) {
        const pay = orderToVoid.payment || {};
        const curr = pay.currency || 'USD';
        const meth = pay.method || 'Efectivo';
        const amt = Number(pay.amount || orderToVoid.total || 0);

        if (curr === 'USD') {
          if (meth === 'Efectivo' && globalShift.sales.usdCash !== undefined) {
            globalShift.sales.usdCash = Math.max(0, globalShift.sales.usdCash - amt);
          } else if (globalShift.sales.usdDigital !== undefined) {
            globalShift.sales.usdDigital = Math.max(0, globalShift.sales.usdDigital - amt);
          }
        } else if (curr === 'VES') {
          if (meth === 'Efectivo' && globalShift.sales.bsCash !== undefined) {
            globalShift.sales.bsCash = Math.max(0, globalShift.sales.bsCash - amt);
          } else if (globalShift.sales.bsDigital !== undefined) {
            globalShift.sales.bsDigital = Math.max(0, globalShift.sales.bsDigital - amt);
          }
        } else if (curr === 'CxC' && globalShift.sales.cxc !== undefined) {
          globalShift.sales.cxc = Math.max(0, globalShift.sales.cxc - amt);
        }
        pushShiftToCloud();
      }

      // 3. Remover de globalOrderHistory
      for (let i = globalOrderHistory.length - 1; i >= 0; i--) {
        if (globalOrderHistory[i].id === orderToVoid.id) {
          globalOrderHistory.splice(i, 1);
        }
      }

      // 4. Eliminar de Supabase Cloud
      deleteOrderFromCloud(orderToVoid.id);

      persistData();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('RESTOSYS_DATA_SYNCED'));
      }
      setLiveTick(t => t + 1);
      alert(`Factura ${orderToVoid.id} anulada y eliminada exitosamente.`);
    } catch (err) {
      alert("Error al anular factura: " + err.message);
    }
  };

  // Presets de fechas
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const d = toISODateOnly(now);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const d = toISODateOnly(y);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1); // Lunes
      setStartDate(toISODateOnly(startOfWeek));
      setEndDate(toISODateOnly(now));
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toISODateOnly(startOfMonth));
      setEndDate(toISODateOnly(now));
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  // Filtrado de órdenes por rango de fecha
  const filteredOrders = useMemo(() => {
    return globalOrderHistory.filter(order => {
      const orderDate = toISODateOnly(order.payment?.paidAt || order.createdAt || new Date());
      const inDateRange = orderDate >= startDate && orderDate <= endDate;
      
      if (!inDateRange) return false;

      // Filtro de búsqueda por texto (cliente o Nro de orden)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesDoc = (order.clientId || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesDoc) return false;
      }

      // Filtro por método de pago
      if (filterMethod !== 'ALL') {
        const method = order.payment?.method || 'Efectivo';
        if (method !== filterMethod) return false;
      }

      return true;
    });
  }, [startDate, endDate, searchQuery, filterMethod, globalOrderHistory.length]);

  // Cálculos de KPIs con tasa histórica por cada orden
  const stats = useMemo(() => {
    let totalUsd = 0;
    let totalBs = 0;
    let totalOrders = filteredOrders.length;
    let totalItemsCount = 0;

    const defaultRate = parseFloat(globalSettings.exchangeRate) || 40;

    const paymentTotals = {
      'Efectivo USD': { usd: 0, bs: 0 },
      'Zelle': { usd: 0, bs: 0 },
      'Binance': { usd: 0, bs: 0 },
      'Efectivo Bs': { usd: 0, bs: 0 },
      'Pago Movil': { usd: 0, bs: 0 },
      'POS': { usd: 0, bs: 0 },
      'Transferencia': { usd: 0, bs: 0 },
      'CxC': { usd: 0, bs: 0 },
    };

    const dishSalesMap = {};

    filteredOrders.forEach(order => {
      const orderUsd = Number(order.total || 0);
      const orderRate = Number(order.payment?.exchangeRate) || defaultRate;

      // Si el cobro se hizo en VES, tomar el monto exacto en Bs registrado o calcularlo con su tasa exacta
      let orderBs = 0;
      if (order.payment?.currency === 'VES') {
        orderBs = Number(order.payment?.amount || (orderUsd * orderRate));
      } else {
        orderBs = orderUsd * orderRate;
      }

      totalUsd += orderUsd;
      totalBs += orderBs;

      // Desglose por método de pago
      const method = order.payment?.method || 'Efectivo';
      const currency = order.payment?.currency || 'USD';
      const key = (currency === 'USD' && method === 'Efectivo') ? 'Efectivo USD' : 
                  (currency === 'VES' && method === 'Efectivo') ? 'Efectivo Bs' : method;

      if (!paymentTotals[key]) {
        paymentTotals[key] = { usd: 0, bs: 0 };
      }
      paymentTotals[key].usd += orderUsd;
      paymentTotals[key].bs += orderBs;

      // Desglose por platos
      (order.items || []).forEach(item => {
        const qty = Number(item.qty || 1);
        const price = Number(item.price || 0);
        totalItemsCount += qty;

        const dishName = item.name || 'Sin Nombre';
        if (!dishSalesMap[dishName]) {
          dishSalesMap[dishName] = { name: dishName, qty: 0, revenue: 0 };
        }
        dishSalesMap[dishName].qty += qty;
        dishSalesMap[dishName].revenue += (qty * price);
      });
    });

    const averageTicket = totalOrders > 0 ? (totalUsd / totalOrders) : 0;
    const effectiveAvgRate = totalUsd > 0 ? (totalBs / totalUsd) : defaultRate;

    // Convertir mapa de platos a array ordenado
    const topDishes = Object.values(dishSalesMap).sort((a, b) => b.qty - a.qty);

    return {
      totalUsd,
      totalBs,
      totalOrders,
      averageTicket,
      totalItemsCount,
      paymentTotals,
      topDishes,
      defaultRate,
      effectiveAvgRate
    };
  }, [filteredOrders]);

  // Imprimir resumen consolidado
  const handlePrintSummary = () => {
    if (typeof window === 'undefined') return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Habilite las ventanas emergentes para imprimir.");

    const html = `
      <html>
        <head>
          <title>Resumen de Ventas - LAGO WOK ZHEN</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; }
            h2, h3, p { text-align: center; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { padding: 6px 4px; text-align: left; }
            th { border-bottom: 2px solid #000; }
            .right { text-align: right; }
            .divider { border-top: 1px dashed #000; margin: 15px 0; }
          </style>
        </head>
        <body>
          <h2>LAGO WOK ZHEN</h2>
          <p>REPORTE CONSOLIDADO DE VENTAS</p>
          <p>Rango: ${startDate} al ${endDate}</p>
          <p>Tasa Promedio Ponderada: 1 USD = ${stats.effectiveAvgRate.toFixed(2)} Bs</p>
          <div class="divider"></div>
          <table>
            <tr><td><strong>TOTAL FACTURADO USD:</strong></td><td class="right"><strong>$${formatMoney(stats.totalUsd)}</strong></td></tr>
            <tr><td><strong>TOTAL EXACTO BS:</strong></td><td class="right"><strong>Bs ${formatMoney(stats.totalBs)}</strong></td></tr>
            <tr><td>Total Facturas / Órdenes:</td><td class="right">${stats.totalOrders}</td></tr>
            <tr><td>Ticket Promedio:</td><td class="right">$${formatMoney(stats.averageTicket)}</td></tr>
            <tr><td>Platos / Bebidas Vendidos:</td><td class="right">${stats.totalItemsCount} unds</td></tr>
          </table>
          <div class="divider"></div>
          <h3>DESGLOSE POR FORMA DE PAGO (A TASA HISTÓRICA)</h3>
          <table>
            ${Object.entries(stats.paymentTotals).filter(([, val]) => val.usd > 0).map(([k, val]) => `
              <tr>
                <td>${k}:</td>
                <td class="right">$${formatMoney(val.usd)} | Bs ${formatMoney(val.bs)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <h3>TOP PLATOS VENDIDOS</h3>
          <table>
            <tr><th>Cant</th><th>Plato</th><th class="right">Total $</th></tr>
            ${stats.topDishes.slice(0, 10).map(d => `
              <tr><td>${d.qty}x</td><td>${d.name}</td><td class="right">$${formatMoney(d.revenue)}</td></tr>
            `).join('')}
          </table>
          <script>setTimeout(() => { window.print(); window.close(); }, 300);</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header Superior */}
        <View style={[styles.topHeader, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10, paddingHorizontal: 15, paddingVertical: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Dashboard')} 
              style={styles.logoBtn}
            >
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: isMobile ? 100 : 130, height: isMobile ? 32 : 40, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
            {isMobile && (
              <TouchableOpacity 
                style={[styles.dashboardBtn, { paddingHorizontal: 10, paddingVertical: 6 }]} 
                onPress={() => navigation.navigate('Dashboard')}
              >
                <MaterialCommunityIcons name="home-outline" size={16} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={[styles.dashboardBtnText, { fontSize: 12 }]}>Inicio</Text>
              </TouchableOpacity>
            )}
            {!isMobile && (
              <View style={{ marginLeft: 20 }}>
                <Text style={styles.moduleTitle}>Ventas Diarias y Facturación</Text>
                <Text style={styles.moduleSubtitle}>Cálculo exacto en Bolívares a la tasa histórica de cada cobro</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
            <TouchableOpacity 
              style={[styles.printSummaryBtn, isMobile && { flex: 1, justifyContent: 'center' }]} 
              onPress={handlePrintSummary}
            >
              <MaterialCommunityIcons name="printer" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.printSummaryText}>Imprimir Reporte</Text>
            </TouchableOpacity>

            {!isMobile && (
              <TouchableOpacity 
                style={styles.dashboardBtn} 
                onPress={() => navigation.navigate('Dashboard')}
              >
                <MaterialCommunityIcons name="home-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
                <Text style={styles.dashboardBtnText}>Inicio</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.mainScroll} contentContainerStyle={{ padding: isMobile ? 12 : 25 }}>
          
          {/* Barra de Filtro de Rango de Fechas */}
          <View style={styles.filterCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 15 }}>
              
              {/* Presets Rápidos */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginRight: 5 }}>RANGO:</Text>
                {[
                  { key: 'today', label: 'Hoy' },
                  { key: 'yesterday', label: 'Ayer' },
                  { key: 'week', label: 'Esta Semana' },
                  { key: 'month', label: 'Este Mes' },
                  { key: 'all', label: 'Todo' }
                ].map(p => (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.presetBtn, activePreset === p.key && styles.presetBtnActive]}
                    onPress={() => applyPreset(p.key)}
                  >
                    <Text style={[styles.presetBtnText, activePreset === p.key && styles.presetBtnTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Inputs Fecha Inicio y Fecha Fin */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>DESDE:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={(val) => { setStartDate(val); setActivePreset('custom'); }}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textMuted} />

                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>HASTA:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={(val) => { setEndDate(val); setActivePreset('custom'); }}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

            </View>
          </View>

          {/* Tarjetas KPIs Resumen */}
          <View style={styles.kpiGrid}>
            
            {/* KPI: Total USD */}
            <View style={[styles.kpiCard, { borderLeftColor: COLORS.success, borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.kpiLabel}>TOTAL FACTURADO (USD)</Text>
                  <Text style={[styles.kpiValue, { color: '#047857' }]}>${formatMoney(stats.totalUsd)}</Text>
                </View>
                <View style={[styles.kpiIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <MaterialCommunityIcons name="currency-usd" size={24} color="#10b981" />
                </View>
              </View>
              <Text style={styles.kpiSub}>Facturación neta en divisas</Text>
            </View>

            {/* KPI: Total Bs (Suma a la tasa histórica) */}
            <View style={[styles.kpiCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.kpiLabel}>TOTAL BOLÍVARES RECIBIDOS</Text>
                  <Text style={[styles.kpiValue, { color: '#0369a1' }]}>Bs {formatMoney(stats.totalBs)}</Text>
                </View>
                <View style={[styles.kpiIconBox, { backgroundColor: '#f0f9ff' }]}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#0ea5e9" />
                </View>
              </View>
              <Text style={styles.kpiSub}>
                Suma a tasa exacta recibida (Promedio: {stats.effectiveAvgRate.toFixed(2)} Bs/$)
              </Text>
            </View>

            {/* KPI: Cantidad de Órdenes */}
            <View style={[styles.kpiCard, { borderLeftColor: COLORS.purple, borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.kpiLabel}>FACTURAS COBRADAS</Text>
                  <Text style={[styles.kpiValue, { color: '#6d28d9' }]}>{stats.totalOrders}</Text>
                </View>
                <View style={[styles.kpiIconBox, { backgroundColor: '#f5f3ff' }]}>
                  <MaterialCommunityIcons name="receipt" size={24} color="#8b5cf6" />
                </View>
              </View>
              <Text style={styles.kpiSub}>Comandas cerradas con éxito</Text>
            </View>

            {/* KPI: Ticket Promedio */}
            <View style={[styles.kpiCard, { borderLeftColor: COLORS.warning, borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.kpiLabel}>TICKET PROMEDIO</Text>
                  <Text style={[styles.kpiValue, { color: '#b45309' }]}>${formatMoney(stats.averageTicket)}</Text>
                </View>
                <View style={[styles.kpiIconBox, { backgroundColor: '#fffbeb' }]}>
                  <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="#f59e0b" />
                </View>
              </View>
              <Text style={styles.kpiSub}>Promedio gastado por mesa/orden</Text>
            </View>

            {/* KPI: Platos Vendidos */}
            <View style={[styles.kpiCard, { borderLeftColor: '#ec4899', borderLeftWidth: 4 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.kpiLabel}>PLATOS Y BEBIDAS</Text>
                  <Text style={[styles.kpiValue, { color: '#be185d' }]}>{stats.totalItemsCount}</Text>
                </View>
                <View style={[styles.kpiIconBox, { backgroundColor: '#fdf2f8' }]}>
                  <MaterialCommunityIcons name="food" size={24} color="#ec4899" />
                </View>
              </View>
              <Text style={styles.kpiSub}>Unidades despachadas de cocina</Text>
            </View>

          </View>

          {/* Navegación de Pestañas de Vista con Scroll Horizontal */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20, flexGrow: 0 }}
            contentContainerStyle={styles.tabsHeader}
          >
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
              onPress={() => setActiveTab('orders')}
            >
              <MaterialCommunityIcons 
                name="format-list-bulleted" 
                size={18} 
                color={activeTab === 'orders' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'orders' && styles.tabBtnTextActive]}>
                Auditoría ({filteredOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'dishes' && styles.tabBtnActive]}
              onPress={() => setActiveTab('dishes')}
            >
              <MaterialCommunityIcons 
                name="silverware-fork-knife" 
                size={18} 
                color={activeTab === 'dishes' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'dishes' && styles.tabBtnTextActive]}>
                Platos Vendidos ({stats.topDishes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
              onPress={() => setActiveTab('payments')}
            >
              <MaterialCommunityIcons 
                name="credit-card-outline" 
                size={18} 
                color={activeTab === 'payments' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}>
                Formas de Pago
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* CONTENIDO TAB 1: LISTADO DE FACTURAS */}
          {activeTab === 'orders' && (
            <View style={styles.sectionContainer}>
              
              {/* Barra de Búsqueda y Filtros de Factura */}
              <View style={styles.searchBarRow}>
                <View style={styles.searchBox}>
                  <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por Nro Orden (ORD-...) o Nombre de Cliente..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Filtro Rápido por Forma de Pago */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {['ALL', 'Efectivo', 'Zelle', 'Pago Movil', 'POS', 'CxC'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodFilterBtn, filterMethod === m && styles.methodFilterBtnActive]}
                      onPress={() => setFilterMethod(m)}
                    >
                      <Text style={[styles.methodFilterText, filterMethod === m && styles.methodFilterTextActive]}>
                        {m === 'ALL' ? 'Todos los Pagos' : m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Lista de Facturas */}
              {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="receipt-text-remove-outline" size={54} color={COLORS.border} />
                  <Text style={styles.emptyTitle}>No se encontraron ventas</Text>
                  <Text style={styles.emptySub}>No hay comandas registradas en el rango de fechas seleccionado.</Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {filteredOrders.map((order, idx) => {
                    const paidDate = new Date(order.payment?.paidAt || order.createdAt || new Date());
                    const timeStr = paidDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = paidDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const orderRate = Number(order.payment?.exchangeRate) || stats.defaultRate;
                    const orderBs = (Number(order.total || 0) * orderRate).toFixed(2);
                    
                    return (
                      <View key={order.id || idx} style={styles.orderCard}>
                        
                        {/* Cabecera de la factura */}
                        <View style={styles.orderCardHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={styles.orderIdBadge}>
                              <Text style={styles.orderIdText}>{order.id}</Text>
                            </View>

                            <View style={[styles.typeBadge, 
                              order.type === 'dine_in' ? { backgroundColor: '#e0f2fe' } :
                              order.type === 'delivery' ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#fef3c7' }
                            ]}>
                              <Text style={[styles.typeBadgeText,
                                order.type === 'dine_in' ? { color: '#0369a1' } :
                                order.type === 'delivery' ? { color: '#b91c1c' } : { color: '#b45309' }
                              ]}>
                                {order.type === 'dine_in' ? `Mesa ${order.tableId ? order.tableId.replace('T', '') : '1'}` :
                                 order.type === 'delivery' ? 'Delivery' : 'Para Llevar'}
                              </Text>
                            </View>

                            <Text style={styles.orderDateTime}>📅 {dateStr} • ⏰ {timeStr}</Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.orderTotalUsd}>${formatMoney(order.total)}</Text>
                              <Text style={styles.orderTotalBs}>Bs {formatMoney(orderBs)}</Text>
                              <Text style={styles.orderRateBadge}>Tasa: {orderRate.toFixed(2)} Bs/$</Text>
                            </View>

                            {/* Botón Reimprimir Ticket */}
                            <TouchableOpacity 
                              style={styles.reprintBtn}
                              onPress={() => { setSelectedAuditOrder(order); setIsAuditModalVisible(true); }}
                              title="Reimprimir Ticket de Pago"
                            >
                              <MaterialCommunityIcons name="printer" size={16} color="#0284c7" />
                              <Text style={styles.reprintText}>Ticket</Text>
                            </TouchableOpacity>

                            {/* Botón Anular Factura */}
                            <TouchableOpacity 
                              style={[styles.reprintBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                              onPress={() => handleVoidInvoice(order)}
                              title="Anular y Eliminar Factura"
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                              <Text style={[styles.reprintText, { color: '#ef4444' }]}>Anular</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Datos del Cliente y Forma de Pago */}
                        <View style={styles.orderCardMeta}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialCommunityIcons name="account" size={16} color={COLORS.textMuted} />
                            <Text style={styles.clientNameText}>
                              {order.customerName ? order.customerName.toUpperCase() : 'CLIENTE GENERAL'}
                            </Text>
                            {order.clientId && (
                              <Text style={styles.clientIdText}>({order.clientId})</Text>
                            )}
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.paymentMethodLabel}>PAGADO CON:</Text>
                            {order.payments && order.payments.length > 1 ? (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {order.payments.map((p, pIdx) => (
                                  <View key={pIdx} style={styles.paymentMethodBadge}>
                                    <Text style={styles.paymentMethodText}>
                                      {p.method}: {p.currency === 'VES' ? ("Bs " + formatMoney(p.amount)) : ("$" + formatMoney(p.amount))}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <View style={styles.paymentMethodBadge}>
                                <MaterialCommunityIcons 
                                  name={
                                    order.payment?.currency === 'USD' ? 'currency-usd' :
                                    order.payment?.method === 'Zelle' ? 'flash' :
                                    order.payment?.currency === 'CxC' ? 'clock-alert-outline' : 'cash'
                                  } 
                                  size={14} 
                                  color="#047857" 
                                />
                                <Text style={styles.paymentMethodText}>
                                  {order.payment?.method || 'Efectivo'} ({order.payment?.currency || 'USD'})
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Detalle de Platos Consumidos */}
                        <View style={styles.orderItemsList}>
                          {(order.items || []).map((it, itIdx) => (
                            <View key={itIdx} style={styles.itemPill}>
                              <Text style={styles.itemPillQty}>{it.qty}x</Text>
                              <Text style={styles.itemPillName}>{it.name}</Text>
                              <Text style={styles.itemPillPrice}>${formatMoney((it.price || 0) * (it.qty || 1))}</Text>
                            </View>
                          ))}
                        </View>

                      </View>
                    );
                  })}
                </View>
              )}

            </View>
          )}

          {/* CONTENIDO TAB 2: PLATOS MÁS VENDIDOS */}
          {activeTab === 'dishes' && (
            <View style={styles.sectionContainer}>
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableColHeader, { flex: 0.5, textAlign: 'center' }]}>#</Text>
                  <Text style={[styles.tableColHeader, { flex: 3 }]}>PLATO / PRODUCTO</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'center' }]}>CANT. VENDIDA</Text>
                  <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>TOTAL INGRESOS ($)</Text>
                  <Text style={[styles.tableColHeader, { flex: 2 }]}>PARTICIPACIÓN</Text>
                </View>

                {stats.topDishes.length === 0 ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted }}>No hay platos vendidos en este rango de fecha.</Text>
                  </View>
                ) : (
                  stats.topDishes.map((dish, i) => {
                    const percent = stats.totalUsd > 0 ? ((dish.revenue / stats.totalUsd) * 100).toFixed(1) : 0;
                    return (
                      <View key={i} style={styles.tableRow}>
                        <View style={[styles.rankBadge, i === 0 ? { backgroundColor: '#fef3c7' } : i === 1 ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#fdf2f8' }]}>
                          <Text style={[styles.rankText, i === 0 ? { color: '#d97706' } : { color: '#475569' }]}>
                            {i + 1}
                          </Text>
                        </View>

                        <View style={{ flex: 3, paddingLeft: 10 }}>
                          <Text style={styles.dishName}>{dish.name}</Text>
                        </View>

                        <Text style={[styles.dishQty, { flex: 1.5, textAlign: 'center' }]}>
                          {dish.qty} unds
                        </Text>

                        <Text style={[styles.dishRevenue, { flex: 1.5, textAlign: 'right' }]}>
                          ${formatMoney(dish.revenue)}
                        </Text>

                        <View style={{ flex: 2, paddingLeft: 15 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted }}>{percent}%</Text>
                          </View>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%` }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* CONTENIDO TAB 3: MÉTODOS DE PAGO (A TASA HISTÓRICA EXACTA) */}
          {activeTab === 'payments' && (
            <View style={styles.sectionContainer}>
              <View style={styles.paymentsGrid}>
                {Object.entries(stats.paymentTotals).map(([method, data]) => {
                  const percent = stats.totalUsd > 0 ? ((data.usd / stats.totalUsd) * 100).toFixed(1) : 0;
                  const isZero = data.usd === 0;

                  return (
                    <View key={method} style={[styles.paymentCard, isZero && { opacity: 0.6 }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={styles.paymentCardTitle}>{method}</Text>
                        <MaterialCommunityIcons 
                          name={
                            method.includes('USD') || method === 'Zelle' || method === 'Binance' ? 'currency-usd' :
                            method === 'CxC' ? 'clock-alert-outline' : 'cash'
                          } 
                          size={22} 
                          color={isZero ? COLORS.textMuted : COLORS.primary} 
                        />
                      </View>

                      <Text style={styles.paymentCardUsd}>${formatMoney(data.usd)}</Text>
                      <Text style={styles.paymentCardBs}>Bs {formatMoney(data.bs)}</Text>

                      <View style={{ marginTop: 15 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Participación:</Text>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: COLORS.text }}>{percent}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                          <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: COLORS.primary }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>
      </View>
      <TicketModal 
        visible={isAuditModalVisible}
        type="receipt"
        order={selectedAuditOrder}
        customRate={selectedAuditOrder?.payment?.exchangeRate}
        onClose={() => setIsAuditModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header superior
  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 25,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } })
  },
  logoBtn: { padding: 4 },
  moduleTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  moduleSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  
  printSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  printSummaryText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  dashboardBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  mainScroll: { flex: 1 },

  // Barra de Rango de Fechas
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  presetBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  presetBtnTextActive: { color: '#ffffff' },

  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dateLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginRight: 6 },
  dateInput: { fontSize: 13, fontWeight: '600', color: COLORS.text, width: 100, outlineStyle: 'none' },

  // Grid KPIs
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 25,
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.03)' } })
  },
  kpiLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  kpiValue: { fontSize: 24, fontWeight: '900' },
  kpiSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  kpiIconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Pestañas
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabBtnTextActive: { color: COLORS.primary, fontWeight: '800' },

  // Sección genérica
  sectionContainer: { marginBottom: 30 },

  // Barra de búsqueda de facturas
  searchBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: COLORS.text, outlineStyle: 'none' },

  methodFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodFilterBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  methodFilterText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  methodFilterTextActive: { color: '#ffffff' },

  // Tarjeta de Factura
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.02)' } })
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  orderIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderIdText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  orderDateTime: { fontSize: 12, color: COLORS.textMuted },
  orderTotalUsd: { fontSize: 18, fontWeight: '900', color: '#047857' },
  orderTotalBs: { fontSize: 13, fontWeight: '700', color: '#0369a1' },
  orderRateBadge: { fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 2 },

  reprintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  reprintText: { fontSize: 12, fontWeight: '700', color: '#0284c7', marginLeft: 4 },

  orderCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  clientNameText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  clientIdText: { fontSize: 12, color: COLORS.textMuted },
  paymentMethodLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 4,
  },
  paymentMethodText: { fontSize: 11, fontWeight: '700', color: '#047857' },

  orderItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  itemPillQty: { fontSize: 12, fontWeight: '800', color: COLORS.primaryDark },
  itemPillName: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  itemPillPrice: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },

  // Tabla Platos más vendidos
  tableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  tableColHeader: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  dishName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  dishQty: { fontSize: 14, fontWeight: '700', color: '#0284c7' },
  dishRevenue: { fontSize: 14, fontWeight: '800', color: '#047857' },

  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },

  // Grid Formas de Pago
  paymentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  paymentCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' } })
  },
  paymentCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  paymentCardUsd: { fontSize: 20, fontWeight: '900', color: '#047857', marginTop: 4 },
  paymentCardBs: { fontSize: 13, fontWeight: '700', color: '#0369a1', marginTop: 2 },

  // Estado vacío
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
});
