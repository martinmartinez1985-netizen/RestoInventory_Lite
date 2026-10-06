import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, TextInput, Image, useWindowDimensions, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TicketModal from '../components/TicketModal';
import { globalActiveOrders, globalRecipes, processProductionBatch, updateStock, registerShiftSale, globalTables, globalSettings, globalDirectory, addContactToGlobal, recordCompletedOrder, globalOrderHistory, pushOrderToCloud, persistData } from '../store/mockDb';

// Paleta de colores Dark Theme
const COLORS = {
  bg: '#1c1c24',
  sidebar: '#15151c',
  card: '#252836',
  primary: '#ff6b6b', // Rojo/Coral
  text: '#ffffff',
  textMuted: '#92929d',
  border: '#2d303e'
};

export default function PosOrderingScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 850;
  const [mobilePosTab, setMobilePosTab] = useState('menu'); // 'menu' | 'ticket'
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [, setTick] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [payCurrency, setPayCurrency] = useState('USD');
  const [payMethod, setPayMethod] = useState('');
  const [exchangeRate, setExchangeRate] = useState(globalSettings.exchangeRate);
    const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');

  // CRM States
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDocId, setNewClientDocId] = useState('');
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  // Split Payments States
  const [payMode, setPayMode] = useState('single'); // 'single' o 'split'
  const [splitPayments, setSplitPayments] = useState([]);
  const [splitCurrency, setSplitCurrency] = useState('USD');
  const [splitMethod, setSplitMethod] = useState('Efectivo');
  const [splitAmountInput, setSplitAmountInput] = useState('');

  // Sincronizar monto sugerido restante al abrir modal o cambiar de moneda
  const currentRate = parseFloat(exchangeRate) || parseFloat(globalSettings.exchangeRate) || 40;
  const orderTotalUsd = Number(order?.total || 0);
  const totalPaidUsd = splitPayments.reduce((sum, p) => sum + p.amountUsd, 0);
  const remainingUsd = Math.max(0, orderTotalUsd - totalPaidUsd);
  const remainingBs = remainingUsd * currentRate;

  const handleAddSplitPayment = () => {
    const rawVal = parseFloat(splitAmountInput);
    if (isNaN(rawVal) || rawVal <= 0) {
      alert("Ingrese un monto válido mayor a 0.");
      return;
    }

    let amtUsd = 0;
    let amtBs = 0;
    if (splitCurrency === 'VES') {
      amtBs = rawVal;
      amtUsd = rawVal / currentRate;
    } else {
      amtUsd = rawVal;
      amtBs = rawVal * currentRate;
    }

    const newPayment = {
      id: Date.now().toString(),
      method: splitMethod,
      currency: splitCurrency,
      amount: rawVal,
      amountUsd: amtUsd,
      amountBs: amtBs
    };

    const newPayments = [...splitPayments, newPayment];
    setSplitPayments(newPayments);

    // Actualizar monto sugerido para el siguiente abono
    const newPaidUsd = newPayments.reduce((sum, p) => sum + p.amountUsd, 0);
    const newRemainingUsd = Math.max(0, orderTotalUsd - newPaidUsd);
    setSplitAmountInput(splitCurrency === 'VES' ? (newRemainingUsd * currentRate).toFixed(2) : newRemainingUsd.toFixed(2));
  };

  const handleRemoveSplitPayment = (id) => {
    const newPayments = splitPayments.filter(p => p.id !== id);
    setSplitPayments(newPayments);
    const newPaidUsd = newPayments.reduce((sum, p) => sum + p.amountUsd, 0);
    const newRemainingUsd = Math.max(0, orderTotalUsd - newPaidUsd);
    setSplitAmountInput(splitCurrency === 'VES' ? (newRemainingUsd * currentRate).toFixed(2) : newRemainingUsd.toFixed(2));
  };
  const [ticketModalType, setTicketModalType] = useState('kitchen');

  // Filtrado de categorías y buscador de recetas / platos
  const standardCats = ['Todos', 'Platos Principales', 'Burger', 'Noodles', 'Drinks', 'Arroz'];
  const recipeCats = Array.from(new Set(globalRecipes.map(r => r.category).filter(Boolean)));
  const categoriesList = Array.from(new Set([...standardCats, ...recipeCats]));

  const filteredRecipes = globalRecipes.filter(recipe => {
    const matchesCategory = activeCategory === 'Todos' || recipe.category === activeCategory;

    if (!menuSearchQuery.trim()) {
      return matchesCategory;
    }

    const queryTerms = menuSearchQuery.toLowerCase().trim().split(/\s+/);
    const name = (recipe.name || '').toLowerCase();
    const cat = (recipe.category || '').toLowerCase();
    const searchableText = `${name} ${cat}`;

    const matchesSearch = queryTerms.every(term => searchableText.includes(term));
    return matchesSearch && matchesCategory;
  });

  const filteredClients = globalDirectory.filter(c => c.type === 'Clientes' && (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.docId.toLowerCase().includes(clientSearch.toLowerCase())));

  const selectClient = (client) => {
    if (!client) return;
    setClientName(client.name);
    setClientId(client.docId);
    if (order) { 
      order.customerName = client.name; 
      order.clientId = client.docId; 
      persistData();
    }
    setIsClientModalVisible(false);
    setTick(t => t + 1);
  };

  const handleCreateClient = () => {
    if (!newClientName || !newClientDocId) return alert("Nombre y Cédula/RIF son obligatorios");
    const newContact = {
      id: 'C-' + Date.now(),
      name: newClientName.toUpperCase(),
      docId: newClientDocId.toUpperCase(),
      email: 'Sin correo',
      phone: 'Sin teléfono',
      address: 'Sin dirección',
      type: 'Clientes'
    };
    addContactToGlobal(newContact);
    selectClient(newContact);
    setIsCreatingClient(false);
    setNewClientName('');
    setNewClientDocId('');
  };

  const formatMoney = (val) => Number(val).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  useEffect(() => {
    const o = globalActiveOrders.find(o => o.id === orderId);
    if (o) {
      if (Array.isArray(o.items)) {
        const consolidated = [];
        o.items.forEach(item => {
          const match = consolidated.find(c => (c.recipeId && item.recipeId && c.recipeId === item.recipeId) || c.name === item.name);
          if (match) {
            match.qty += item.qty;
            if (item.sentToKitchen) {
              match.sentQty = (match.sentQty || 0) + item.qty;
            }
            if (match.sentQty >= match.qty) {
              match.sentToKitchen = true;
            } else {
              match.sentToKitchen = false;
            }
          } else {
            consolidated.push({
              ...item,
              sentQty: item.sentToKitchen ? item.qty : (item.sentQty || 0)
            });
          }
        });
        o.items = consolidated;
      }
      if (o.customerName && o.customerName !== 'Cliente General') {
        setClientName(o.customerName);
      }
      if (o.clientId && o.clientId !== 'Sin Doc') {
        setClientId(o.clientId);
      } else if (o.customerName) {
        const matchContact = globalDirectory.find(c => c.name.toLowerCase() === o.customerName.toLowerCase());
        if (matchContact) setClientId(matchContact.docId);
      }
      setOrder(o);
    }
  }, [orderId]);

  if (!order) return <View style={{flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: COLORS.text}}>Cargando orden...</Text></View>;

  const menuItems = globalRecipes.filter(r => r.outputType === 'finished');
  
  // Extraer categorías únicas
  const categories = [...new Set(menuItems.map(item => item.category))];
  if (!categories.includes('Platos Principales')) categories.unshift('Platos Principales');

  const filteredMenu = activeCategory === 'Todos' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  
  const getImageForCategory = (category) => {
    if (category === 'Burger') return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80';
    if (category === 'Noodles') return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=300&q=80';
    if (category === 'Drinks') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80';
    return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80';
  };

  const addItem = (recipe) => {
    const targetId = recipe.id || recipe.recipeId;
    const existing = order.items.find(i => (targetId && (i.recipeId === targetId || i.id === targetId)) || i.name === recipe.name);
    if (existing) {
      existing.qty += 1;
      if (existing.sentToKitchen && existing.sentQty === undefined) {
        existing.sentQty = existing.qty - 1;
      }
      if (existing.sentQty !== undefined && existing.qty > existing.sentQty) {
        existing.sentToKitchen = false;
      }
    } else {
      order.items.push({
        recipeId: targetId,
        name: recipe.name,
        qty: 1,
        sentQty: 0,
        price: recipe.price || recipe.salePrice || 15.99,
        sentToKitchen: false,
        image: recipe.image || getImageForCategory(recipe.category)
      });
    }
    recalcTotal();
  };

  const increaseQty = (item) => {
    item.qty += 1;
    if (item.sentToKitchen && item.sentQty === undefined) {
      item.sentQty = item.qty - 1;
    }
    if (item.sentQty !== undefined && item.qty > item.sentQty) {
      item.sentToKitchen = false;
    }
    recalcTotal();
  };

  const recalcTotal = () => {
    order.total = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    setTick(t => t + 1);
  };

  const sendToKitchen = () => {
    let successCount = 0;
    try {
      order.items.forEach(item => {
        const alreadySent = item.sentQty !== undefined ? item.sentQty : (item.sentToKitchen ? item.qty : 0);
        const qtyToSend = item.qty - alreadySent;
        if (qtyToSend > 0) {
          processProductionBatch(item.recipeId, qtyToSend);
          const recipe = globalRecipes.find(r => r.id === item.recipeId || r.name === item.name);
          if (recipe && recipe.outputId) {
            updateStock(recipe.outputId, -qtyToSend);
          }
          item.sentQty = item.qty;
          item.sentToKitchen = true;
          successCount++;
        }
      });
      persistData();
      try { pushOrderToCloud(order); } catch (e) {}
      setTicketModalType('kitchen');
      setTicketModalVisible(true);
      setTick(t => t + 1);
    } catch (err) {
      alert("Error al procesar inventario: " + err.message);
    }
  };

  const reverseInventory = (recipeId, qty) => {
    const recipe = globalRecipes.find(r => r.id === recipeId || r.name === recipeId);
    if (recipe && recipe.ingredients) {
      recipe.ingredients.forEach(ing => {
        updateStock(ing.id, ing.amount * qty);
      });
    }
  };

  const decreaseQty = (item) => {
    const isSent = item.sentToKitchen || (item.sentQty && item.sentQty >= item.qty);
    if (isSent) {
      if (!window.confirm("Este plato ya está en cocina. Si reduces la cantidad, los ingredientes se devolverán al almacén. ¿Continuar?")) return;
      reverseInventory(item.recipeId || item.name, 1);
      if (item.sentQty && item.sentQty > 0) item.sentQty -= 1;
    }
    
    if (item.qty > 1) {
      item.qty -= 1;
      if (item.sentQty !== undefined && item.sentQty >= item.qty) {
        item.sentToKitchen = true;
      }
    } else {
      order.items = order.items.filter(i => i !== item);
    }
    recalcTotal();
  };

  const removeItem = (item) => {
    const sentCount = item.sentQty || (item.sentToKitchen ? item.qty : 0);
    if (sentCount > 0) {
      if (!window.confirm("Este plato ya tiene unidades en cocina. Si lo borras, los ingredientes se devolverán al almacén. ¿Continuar?")) return;
      reverseInventory(item.recipeId || item.name, sentCount);
    }
    
    order.items = order.items.filter(i => i !== item);
    recalcTotal();
  };

  const handlePay = () => {
    if (order.items.some(i => !i.sentToKitchen)) {
      alert("Envíe primero todos los ítems a la cocina para descontar el stock.");
      return;
    }

    const rate = parseFloat(exchangeRate) || parseFloat(globalSettings.exchangeRate) || 40;

    if (payMode === 'split') {
      if (splitPayments.length === 0) {
        alert("Agregue al menos un abono a la lista.");
        return;
      }
      if (remainingUsd > 0.05) {
        alert("Falta por cubrir $" + remainingUsd.toFixed(2) + " (Bs " + (remainingUsd * rate).toFixed(2) + ") para completar el total.");
        return;
      }

      recordCompletedOrder(order, {
        payments: splitPayments,
        exchangeRate: rate,
        clientName: clientName || order.customerName,
        clientId: clientId || order.clientId
      });
    } else {
      // Modo pago único
      if (!payMethod) {
        alert("Seleccione un método de pago.");
        return;
      }
      if (payCurrency === 'CxC' && clientName.trim() === '') {
        alert("Para Créditos (CxC) es obligatorio ingresar los datos del Cliente / Cédula.");
        return;
      }

      let amountToRegister = order.total;
      if (payCurrency === 'VES') {
        amountToRegister = order.total * rate;
      }

      recordCompletedOrder(order, {
        method: payMethod,
        currency: payCurrency,
        amount: amountToRegister,
        exchangeRate: rate,
        clientName: clientName || order.customerName,
        clientId: clientId || order.clientId
      });
    }

    if (order.type === 'dine_in') {
      const table = globalTables.find(t => t.id === order.tableId);
      if (table) table.status = 'free';
    }

    setCheckoutVisible(false);
    setTicketModalType('receipt');
    setTicketModalVisible(true);
  };

  const handleOpenCheckout = () => {
    if (order) {
      if (order.customerName && order.customerName !== 'Cliente General') {
        setClientName(order.customerName);
      }
      if (order.clientId && order.clientId !== 'Sin Doc') {
        setClientId(order.clientId);
      } else if (order.customerName) {
        const found = globalDirectory.find(c => c.name.toLowerCase() === order.customerName.toLowerCase());
        if (found) setClientId(found.docId);
      }
    }
    setCheckoutVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra superior de navegación exclusiva para móvil */}
      {isMobile && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.sidebar, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>Mesas</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: COLORS.border }}>
            <TouchableOpacity 
              style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }, mobilePosTab === 'menu' && { backgroundColor: COLORS.primary }]}
              onPress={() => setMobilePosTab('menu')}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: mobilePosTab === 'menu' ? '#fff' : COLORS.textMuted }}>🍽️ Menú</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }, mobilePosTab === 'ticket' && { backgroundColor: COLORS.primary }]}
              onPress={() => setMobilePosTab('ticket')}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: mobilePosTab === 'ticket' ? '#fff' : COLORS.textMuted }}>
                🧾 Cuenta ({order.items.reduce((s, i) => s + (i.qty || 1), 0)})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.container, isMobile && { flexDirection: 'column' }]}>
        
        {/* Lado Izquierdo: Sidebar Navegación (solo desktop) */}
        {!isMobile && (
          <View style={styles.sidebar}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="storefront" size={28} color={COLORS.primary} />
            </View>
            
            <TouchableOpacity style={[styles.navItem, {backgroundColor: COLORS.primary + '20'}]} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.navText, {color: COLORS.primary}]}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem}>
              <MaterialCommunityIcons name="text-box-outline" size={24} color={COLORS.primary} />
              <Text style={[styles.navText, {color: COLORS.primary}]}>Menu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Centro: Catalogo de Menu */}
        {(!isMobile || mobilePosTab === 'menu') && (
          <View style={[styles.mainContent, isMobile && { padding: 12 }]}>
            {/* Header Superior */}
            <View style={[styles.header, isMobile && { marginBottom: 12 }]}>
              <View>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              </View>
              <View style={[styles.searchBox, isMobile && { width: 160, height: 38 }]}>
                <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
                <TextInput 
                  style={[styles.searchInput, isMobile && { fontSize: 12 }]} 
                  placeholder="Buscar menu..." 
                  placeholderTextColor={COLORS.textMuted}
                  value={menuSearchQuery}
                  onChangeText={setMenuSearchQuery}
                />
                {menuSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setMenuSearchQuery('')} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Categorias */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categoriesList.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.catBadge, isMobile && { paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 }, activeCategory === cat && styles.catBadgeActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.catText, isMobile && { fontSize: 12 }, activeCategory === cat && {color: '#fff'}]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Grid de Productos */}
            <ScrollView style={styles.gridScroll}>
              {filteredRecipes.length > 0 ? (
                <View style={[styles.grid, isMobile && { gap: 10 }]}>
                  {filteredRecipes.map((recipe, i) => (
                    <TouchableOpacity 
                      key={recipe.id || i} 
                      style={[styles.menuCard, isMobile && { width: (width - 34) / 2 }]} 
                      onPress={() => addItem(recipe)}
                    >
                      <Image source={{uri: recipe.image || 'https://via.placeholder.com/150'}} style={[styles.cardImage, isMobile && { height: 100 }]} />
                      <View style={[styles.cardInfo, isMobile && { padding: 8 }]}>
                        <Text style={[styles.cardTitle, isMobile && { fontSize: 12, marginBottom: 4 }]} numberOfLines={1}>{recipe.name}</Text>
                        <Text style={[styles.cardPrice, isMobile && { fontSize: 14 }]}>${formatMoney(recipe.salePrice || recipe.price || 15.99)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 50, width: '100%' }}>
                  <MaterialCommunityIcons name="food-off" size={48} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                  <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
                    No se encontraron productos
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 300, marginBottom: 16 }}>
                    {menuSearchQuery ? `No hay resultados para "${menuSearchQuery}"` : `No hay productos en la categoría "${activeCategory}"`}
                  </Text>
                  {menuSearchQuery.length > 0 && (
                    <TouchableOpacity 
                      style={{ backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}
                      onPress={() => setMenuSearchQuery('')}
                    >
                      <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 13 }}>Limpiar búsqueda</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Botón flotante para ver cuenta en móvil */}
            {isMobile && order.items.length > 0 && (
              <TouchableOpacity 
                style={{
                  backgroundColor: '#10b981',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 8,
                  marginBottom: 4,
                }}
                onPress={() => setMobilePosTab('ticket')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="receipt" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                    Ver Cuenta ({order.items.reduce((s, i) => s + (i.qty || 1), 0)} ítems)
                  </Text>
                </View>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>
                  ${formatMoney(order.total)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lado Derecho: Ticket / Orden */}
        {(!isMobile || mobilePosTab === 'ticket') && (
          <View style={[styles.ticketPanel, isMobile && { width: '100%', flex: 1, borderLeftWidth: 0, padding: 14 }]}>
            <Text style={styles.ticketTitle}>
              {order.type === 'dine_in' ? `Orden - Mesa ${order.tableId.replace('T', '')}` : `Orden: ${order.type}`}
            </Text>
            <Text style={styles.ticketSub}>ID: {order.id}</Text>

            <View style={{flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 15}}>
              <TouchableOpacity 
                style={{flex: 1, backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}
                onPress={() => setIsClientModalVisible(true)}
              >
                <MaterialCommunityIcons name="account-search" size={16} color={COLORS.textMuted} style={{marginRight: 8}} />
                <Text style={{color: clientName ? COLORS.text : COLORS.textMuted, fontSize: 13, flex: 1}} numberOfLines={1}>
                  {clientName ? clientName : "Buscar Cliente..."}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center'}}
                onPress={() => { setIsClientModalVisible(true); setIsCreatingClient(true); }}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.ticketHeaders}>
            <Text style={[styles.thText, {flex: 3}]}>Item</Text>
            <Text style={[styles.thText, {flex: 1, textAlign: 'center'}]}>Cant.</Text>
            <Text style={[styles.thText, {flex: 1, textAlign: 'right'}]}>Total</Text>
          </View>

          <ScrollView style={styles.ticketScroll}>
            {order.items.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="food-fork-drink" size={40} color={COLORS.border} />
                <Text style={{color: COLORS.textMuted, marginTop: 10}}>Sin ítems agregados</Text>
              </View>
            ) : (
              order.items.map((item, idx) => (
                <View key={idx} style={styles.ticketItemRow}>
                  
                  {/* Diseño elegante POS */}
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                    <View style={{flexDirection: 'row', flex: 1}}>
                      <Image source={{uri: item.image}} style={styles.thumb} />
                      <View style={{marginLeft: 10, flex: 1}}>
                        <Text style={styles.tiName} numberOfLines={1}>{item.qty}x {item.name}</Text>
                        <Text style={styles.tiNote}>
                          {item.sentToKitchen && (item.sentQty === undefined || item.sentQty >= item.qty) 
                            ? '✅ En Cocina' 
                            : (item.sentQty && item.sentQty > 0 
                                ? `🟡 ${item.sentQty} en cocina / ${item.qty - item.sentQty} pendiente` 
                                : '⏳ Pendiente')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tiPrice}>${formatMoney(item.price * item.qty)}</Text>
                  </View>

                  <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8}}>
                    <TouchableOpacity onPress={() => decreaseQty(item)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="minus" size={16} color={COLORS.text} />
                    </TouchableOpacity>
                    
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    
                    <TouchableOpacity onPress={() => increaseQty(item)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="plus" size={16} color={COLORS.text} />
                    </TouchableOpacity>
                    
                    <View style={{width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 5}} />
                    
                    <TouchableOpacity onPress={() => removeItem(item)} style={styles.delBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  
                </View>
              ))
            )}
          </ScrollView>

          {/* Totales y Botones */}
          <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, gap: 6 }}
              onPress={() => {
                setTicketModalType('pre_account');
                setTicketModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="receipt" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: 'bold' }}>Ver / Imprimir Pre-cuenta</Text>
            </TouchableOpacity>

            <View style={styles.totalsBox}>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>Subtotal</Text>
              <Text style={styles.totVal}>${formatMoney(order.total)}</Text>
            </View>
            <View style={styles.totRow}>
              <Text style={styles.totLabel}>Tax (0%)</Text>
              <Text style={styles.totVal}>$0.00</Text>
            </View>
            <View style={[styles.totRow, {marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, borderStyle: 'dashed'}]}>
              <Text style={[styles.totLabel, {color: COLORS.text, fontSize: 18}]}>Total</Text>
              <Text style={[styles.totVal, {color: COLORS.text, fontSize: 22, fontWeight: 'bold'}]}>${formatMoney(order.total)}</Text>
            </View>
          </View>

          <View style={[styles.actionsBox, {flexDirection: 'row', gap: 12}]}>
            
            <TouchableOpacity 
              style={{flex: 1, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}} 
              onPress={sendToKitchen}
            >
              <MaterialCommunityIcons name="fire" size={24} color={COLORS.primary} />
              <Text style={{color: COLORS.primary, fontWeight: 'bold', fontSize: 14, marginTop: 4}}>Cocina</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{flex: 2, backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' } })}}
              onPress={handleOpenCheckout}
            >
              <MaterialCommunityIcons name="cash-register" size={24} color="#fff" />
              <Text style={{color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4}}>COBRAR</Text>
            </TouchableOpacity>

          </View>

        </View>
        )}
      </View>
    
      
        {/* Modal de Búsqueda y Creación de Clientes CRM */}
        {isClientModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: isMobile ? '95%' : 480, maxHeight: '90%', padding: isMobile ? 16 : 30 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
                  {isCreatingClient ? 'Crear Nuevo Cliente' : 'Seleccionar Cliente'}
                </Text>
                <TouchableOpacity onPress={() => { setIsClientModalVisible(false); setIsCreatingClient(false); }}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {!isCreatingClient ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 }}>
                    <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
                    <TextInput 
                      style={{ flex: 1, marginLeft: 8, color: COLORS.text, paddingVertical: 12, outlineStyle: 'none' }}
                      placeholder="Buscar por nombre o cédula..."
                      placeholderTextColor={COLORS.textMuted}
                      value={clientSearch}
                      onChangeText={setClientSearch}
                      autoFocus
                    />
                    {clientSearch ? (
                      <TouchableOpacity onPress={() => setClientSearch('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  
                  <ScrollView style={{ maxHeight: 280, marginBottom: 15 }}>
                    {filteredClients.length > 0 ? filteredClients.map(client => (
                      <TouchableOpacity 
                        key={client.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        onPress={() => selectClient(client)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 14 }}>{client.name}</Text>
                          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>ID: {client.docId} • Tel: {client.phone || 'N/A'}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )) : (
                      <View style={{ padding: 30, alignItems: 'center' }}>
                        <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No se encontró ningún cliente con ese nombre o documento.</Text>
                      </View>
                    )}
                  </ScrollView>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    onPress={() => setIsCreatingClient(true)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>CREAR NUEVO CLIENTE</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontWeight: 'bold' }}>NOMBRE COMPLETO / RAZÓN SOCIAL (*):</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none' }}
                      value={newClientName}
                      onChangeText={setNewClientName}
                      placeholder="Ej. JUAN PÉREZ"
                      placeholderTextColor={COLORS.textMuted}
                      autoFocus
                    />
                  </View>

                  <View>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontWeight: 'bold' }}>CÉDULA / RIF (*):</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none' }}
                      value={newClientDocId}
                      onChangeText={setNewClientDocId}
                      placeholder="Ej. V-12345678"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg }} 
                      onPress={() => setIsCreatingClient(false)}
                    >
                      <Text style={{ color: COLORS.textMuted, fontWeight: 'bold' }}>Volver a Buscar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' }} 
                      onPress={handleCreateClient}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar y Asignar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Checkout Modal Dark Theme con Pagos Mixtos */}
      {checkoutVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: isMobile ? '96%' : 560, maxHeight: '92%', padding: isMobile ? 16 : 30 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.text }}>Facturación y Cobro</Text>
                <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Datos del Cliente y Tasa */}
              <View style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 2 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: 'bold' }}>CLIENTE / RAZÓN SOCIAL</Text>
                      <TouchableOpacity 
                        onPress={() => setIsClientModalVisible(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284c720', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}
                      >
                        <MaterialCommunityIcons name="account-search" size={13} color="#38bdf8" />
                        <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}>Directorio</Text>
                      </TouchableOpacity>
                    </View>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none', fontSize: 13 }} 
                      value={clientName} 
                      onChangeText={(val) => { 
                        setClientName(val); 
                        if (order) order.customerName = val; 
                        const match = globalDirectory.find(c => c.name.toLowerCase() === val.toLowerCase().trim());
                        if (match) {
                          setClientId(match.docId);
                          if (order) order.clientId = match.docId;
                        }
                      }} 
                      placeholder="Consumidor Final" 
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>CÉDULA / RIF</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none', fontSize: 13 }} 
                      value={clientId} 
                      onChangeText={(val) => { 
                        setClientId(val); 
                        if (order) order.clientId = val; 
                      }} 
                      placeholder="V-000000" 
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>TASA (Bs/$)</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none', fontSize: 13, fontWeight: 'bold' }} 
                      value={exchangeRate} 
                      onChangeText={setExchangeRate} 
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Chips de Selección Rápida de Clientes del Directorio */}
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginBottom: 4 }}>
                    {clientName ? `Asignado: ${clientName} (${clientId || 'Sin Doc'}) - Toca para cambiar:` : 'Clientes registrados (toca para asignar a la cuenta):'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {globalDirectory.filter(c => c.type === 'Clientes').slice(0, 8).map(c => {
                        const isSelected = clientName && clientName.toUpperCase() === c.name.toUpperCase();
                        return (
                          <TouchableOpacity 
                            key={c.id} 
                            onPress={() => selectClient(c)}
                            style={{ 
                              backgroundColor: isSelected ? '#0284c7' : '#1e293b', 
                              borderWidth: 1, 
                              borderColor: isSelected ? '#38bdf8' : COLORS.border, 
                              paddingHorizontal: 9, 
                              paddingVertical: 5, 
                              borderRadius: 6,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <MaterialCommunityIcons name="account" size={13} color={isSelected ? '#fff' : '#38bdf8'} />
                            <Text style={{ color: isSelected ? '#fff' : '#e2e8f0', fontSize: 11, fontWeight: 'bold' }}>
                              {c.name}
                            </Text>
                            <Text style={{ color: isSelected ? '#e0f2fe' : COLORS.textMuted, fontSize: 10 }}>
                              ({c.docId})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Selector de Modo de Pago (Único vs Mixto) */}
              <View style={{ flexDirection: 'row', backgroundColor: COLORS.bg, borderRadius: 10, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: COLORS.border }}>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: payMode === 'single' ? COLORS.primary : 'transparent' }}
                  onPress={() => setPayMode('single')}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: payMode === 'single' ? '#fff' : COLORS.textMuted }}>
                    ⚡ Pago Rápido (Un Solo Método)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: payMode === 'split' ? '#10b981' : 'transparent' }}
                  onPress={() => {
                    setPayMode('split');
                    setSplitAmountInput((remainingUsd * currentRate).toFixed(2));
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: payMode === 'split' ? '#fff' : COLORS.textMuted }}>
                    🔀 Pago Mixto (Dividir Cuenta)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MODO 1: PAGO RÁPIDO */}
              {payMode === 'single' ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: COLORS.bg, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: '600' }}>Total a Cobrar:</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>$ {formatMoney(order.total)}</Text>
                      <Text style={{ fontSize: 13, color: '#38bdf8', fontWeight: 'bold' }}>Bs {formatMoney(order.total * currentRate)}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <TouchableOpacity style={[styles.currBtn, payCurrency === 'USD' && styles.currBtnActive]} onPress={() => { setPayCurrency('USD'); setPayMethod('Efectivo'); }}>
                      <Text style={[styles.currBtnTxt, payCurrency === 'USD' && { color: '#fff' }]}>DIVISAS (USD)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.currBtn, payCurrency === 'VES' && styles.currBtnActive]} onPress={() => { setPayCurrency('VES'); setPayMethod('Pago Móvil'); }}>
                      <Text style={[styles.currBtnTxt, payCurrency === 'VES' && { color: '#fff' }]}>BOLÍVARES (Bs)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.currBtn, payCurrency === 'CxC' && styles.currBtnActive]} onPress={() => { setPayCurrency('CxC'); setPayMethod('Crédito'); }}>
                      <Text style={[styles.currBtnTxt, payCurrency === 'CxC' && { color: '#fff' }]}>CRÉDITO (CxC)</Text>
                    </TouchableOpacity>
                  </View>

                  {payCurrency === 'USD' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                      {['Efectivo', 'Zelle', 'Binance', 'Otro'].map(m => (
                        <TouchableOpacity key={m} style={[styles.methBtn, payMethod === m && styles.methBtnActive]} onPress={() => setPayMethod(m)}>
                          <Text style={[styles.methBtnTxt, payMethod === m && { color: '#fff' }]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {payCurrency === 'VES' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                      {['Pago Móvil', 'Punto de Venta', 'Efectivo', 'Transferencia'].map(m => (
                        <TouchableOpacity key={m} style={[styles.methBtn, payMethod === m && styles.methBtnActive]} onPress={() => setPayMethod(m)}>
                          <Text style={[styles.methBtnTxt, payMethod === m && { color: '#fff' }]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                /* MODO 2: PAGO MIXTO / DIVIDIR CUENTA */
                <View>
                  {/* Tarjetas de Balance */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '700' }}>TOTAL ORDEN</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>${formatMoney(orderTotalUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#38bdf8' }}>Bs ${formatMoney(orderTotalUsd * currentRate)}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '700' }}>ABONADO</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#10b981' }}>${formatMoney(totalPaidUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#38bdf8' }}>Bs ${formatMoney(totalPaidUsd * currentRate)}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: remainingUsd <= 0.05 ? '#064e3b' : '#450a0a', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: remainingUsd <= 0.05 ? '#059669' : '#b91c1c' }}>
                      <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '800' }}>RESTA POR PAGAR</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#ffffff' }}>${formatMoney(remainingUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#fef08a' }}>Bs ${formatMoney(remainingBs)}</Text>
                    </View>
                  </View>

                  {/* Constructor de Abonos */}
                  <View style={{ backgroundColor: COLORS.bg, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 }}>AGREGAR ABONO / PAGO PARCIAL:</Text>

                    {/* Moneda y Método Selector */}
                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Pago Móvil (Bs)', method: 'Pago Móvil', curr: 'VES' },
                        { label: 'Punto Venta (Bs)', method: 'Punto de Venta', curr: 'VES' },
                        { label: 'Efectivo Bs', method: 'Efectivo', curr: 'VES' },
                        { label: 'Efectivo USD ($)', method: 'Efectivo', curr: 'USD' },
                        { label: 'Zelle ($)', method: 'Zelle', curr: 'USD' },
                        { label: 'Binance ($)', method: 'Binance', curr: 'USD' },
                        { label: 'Crédito CxC', method: 'Crédito', curr: 'CxC' },
                      ].map(item => {
                        const isSelected = splitMethod === item.method && splitCurrency === item.curr;
                        return (
                          <TouchableOpacity
                            key={item.label}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 6,
                              backgroundColor: isSelected ? COLORS.primary : '#1e293b',
                              borderWidth: 1,
                              borderColor: isSelected ? COLORS.primary : COLORS.border
                            }}
                            onPress={() => {
                              setSplitMethod(item.method);
                              setSplitCurrency(item.curr);
                              setSplitAmountInput(item.curr === 'VES' ? remainingBs.toFixed(2) : remainingUsd.toFixed(2));
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: isSelected ? '#fff' : COLORS.textMuted }}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Input Monto y Botón Agregar */}
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#15151c', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border }}>
                        <Text style={{ color: splitCurrency === 'VES' ? '#38bdf8' : '#10b981', fontWeight: 'bold', fontSize: 14 }}>
                          {splitCurrency === 'VES' ? 'Bs' : '$'}
                        </Text>
                        <TextInput
                          style={{ flex: 1, color: COLORS.text, padding: 10, fontSize: 16, fontWeight: 'bold', outlineStyle: 'none' }}
                          value={splitAmountInput}
                          onChangeText={setSplitAmountInput}
                          placeholder="0.00"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="numeric"
                        />
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        onPress={handleAddSplitPayment}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={18} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Añadir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Lista de Abonos agregados */}
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 8 }}>PAGOS REGISTRADOS:</Text>
                    {splitPayments.length === 0 ? (
                      <Text style={{ color: COLORS.textMuted, fontStyle: 'italic', fontSize: 12 }}>No hay pagos parciales ingresados aún.</Text>
                    ) : (
                      splitPayments.map((item) => (
                        <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, padding: 10, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border }}>
                          <View>
                            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 13 }}>{item.method} ({item.currency})</Text>
                            <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>
                              {item.currency === 'VES' ? `Bs ${formatMoney(item.amount)} (≈ $${formatMoney(item.amountUsd)})` : `$${formatMoney(item.amount)}`}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveSplitPayment(item.id)}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* Botón Finalizar Cobro */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 14, backgroundColor: '#334155', borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setCheckoutVisible(false)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 2,
                    paddingVertical: 14,
                    backgroundColor: (payMode === 'single' || remainingUsd <= 0.05) ? COLORS.primary : '#475569',
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (payMode === 'single' || remainingUsd <= 0.05) ? 1 : 0.6
                  }}
                  disabled={payMode === 'split' && remainingUsd > 0.05}
                  onPress={handlePay}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>
                    {payMode === 'split' && remainingUsd > 0.05 ? `Faltan $${formatMoney(remainingUsd)}` : 'Confirmar y Cobrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Visualizador e Impresor Térmico Real */}
        <TicketModal 
          visible={ticketModalVisible}
          type={ticketModalType}
          order={order}
          customRate={parseFloat(exchangeRate) || 40}
          onClose={() => {
            setTicketModalVisible(false);
            if (order.status === 'paid') {
              navigation.navigate('Billing');
            }
          }}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111116' }, // Exterior borders if any
  container: { flex: 1, flexDirection: 'row', backgroundColor: COLORS.bg },
  
  // Left Sidebar
  sidebar: { width: 90, backgroundColor: COLORS.sidebar, alignItems: 'center', paddingTop: 20, borderRightWidth: 1, borderRightColor: COLORS.border },
  logoBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  navItem: { width: 65, height: 70, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginBottom: 15 },
  navText: { color: COLORS.textMuted, fontSize: 11, marginTop: 5, fontWeight: '600' },

  // Center Content
  mainContent: { flex: 1, padding: 25, display: 'flex', flexDirection: 'column' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  restaurantName: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  dateText: { fontSize: 14, color: COLORS.textMuted, marginTop: 5, textTransform: 'capitalize' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, paddingHorizontal: 15, borderRadius: 8, height: 45, width: 250, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 10, color: COLORS.text, outlineStyle: 'none' },

  categoryScroll: { flexGrow: 0, marginBottom: 10 },
  catBadge: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginRight: 15, backgroundColor: COLORS.bg, justifyContent: 'center' },
  catBadgeActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: COLORS.textMuted, fontWeight: 'bold', fontSize: 14 },

  gridScroll: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  menuCard: { width: 175, backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  cardImage: { width: '100%', height: 130 },
  cardInfo: { padding: 15 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  cardPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary },

  // Right Ticket Sidebar
  ticketPanel: { width: 350, backgroundColor: COLORS.sidebar, padding: 25, borderLeftWidth: 1, borderLeftColor: COLORS.border, display: 'flex', flexDirection: 'column' },
  ticketTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  ticketSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 25, marginTop: 2 },
  
  ticketHeaders: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10, marginBottom: 15 },
  thText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  ticketScroll: { flex: 1 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ticketItemRow: { flexDirection: 'column', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 15 },
  thumb: { width: 45, height: 45, borderRadius: 8 },
  tiName: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  tiNote: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  
  qtyBtn: { backgroundColor: COLORS.card, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  qtyText: { color: COLORS.text, fontSize: 13, fontWeight: 'bold', width: 20, textAlign: 'center' },
  
  tiPrice: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  delBtn: { backgroundColor: '#ef444420', width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },

  totalsBox: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totLabel: { color: COLORS.textMuted, fontSize: 14 },
  totVal: { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },

  
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: COLORS.sidebar, width: 500, borderRadius: 16, padding: 30, borderWidth: 1, borderColor: COLORS.border, ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.5)' } }) },
  currBtn: { flex: 1, paddingVertical: 15, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg },
  currBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  currBtnTxt: { fontSize: 13, fontWeight: 'bold', color: COLORS.textMuted },
  methBtn: { width: '48%', paddingVertical: 18, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg },
  methBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  methBtnTxt: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMuted },

  actionsBox: { marginTop: "auto" },
  kitchenBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  payBtn: { flex: 1, padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 14 }
});

