const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\PosOrderingScreen.js';

let content = fs.readFileSync(path, 'utf8');

// Add states for split payments if not already added
if (!content.includes('payMode')) {
  const stateHooks = `  // Split Payments States
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
  };`;

  content = content.replace(
    /const \[ticketModalVisible, setTicketModalVisible\] = useState\(false\);/,
    `const [ticketModalVisible, setTicketModalVisible] = useState(false);\n${stateHooks}`
  );
}

// Update handlePay in PosOrderingScreen
const oldHandlePayRegex = /const handlePay = \(\) => \{[\s\S]*?setTicketModalVisible\(true\);\s*\};/;

const newHandlePayCode = `const handlePay = () => {
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
  };`;

content = content.replace(oldHandlePayRegex, newHandlePayCode);

// Update Checkout Modal JSX
const oldCheckoutModalRegex = /\{\/\* Checkout Modal Dark Theme \*\/\}[\s\S]*?\{checkoutVisible && \([\s\S]*?<\/View>\s*<\/View>\s*\)\}/;

const newCheckoutModalCode = `{/* Checkout Modal Dark Theme con Pagos Mixtos */}
      {checkoutVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: 560, maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: COLORS.text }}>Facturación y Cobro</Text>
                <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Datos del Cliente y Tasa */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>CLIENTE / RAZÓN SOCIAL</Text>
                  <TextInput 
                    style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none', fontSize: 13 }} 
                    value={clientName} 
                    onChangeText={(val) => { setClientName(val); order.customerName = val; }} 
                    placeholder="Consumidor Final" 
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 4, fontWeight: 'bold' }}>CÉDULA / RIF</Text>
                  <TextInput 
                    style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none', fontSize: 13 }} 
                    value={clientId} 
                    onChangeText={setClientId} 
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
                      <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>\${formatMoney(orderTotalUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#38bdf8' }}>Bs \${formatMoney(orderTotalUsd * currentRate)}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: '700' }}>ABONADO</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#10b981' }}>\${formatMoney(totalPaidUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#38bdf8' }}>Bs \${formatMoney(totalPaidUsd * currentRate)}</Text>
                    </View>

                    <View style={{ flex: 1, backgroundColor: remainingUsd <= 0.05 ? '#064e3b' : '#450a0a', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: remainingUsd <= 0.05 ? '#059669' : '#b91c1c' }}>
                      <Text style={{ fontSize: 11, color: '#ffffff', fontWeight: '800' }}>RESTA POR PAGAR</Text>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#ffffff' }}>\${formatMoney(remainingUsd)}</Text>
                      <Text style={{ fontSize: 11, color: '#fef08a' }}>Bs \${formatMoney(remainingBs)}</Text>
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
                          style={{ flex: 1, marginLeft: 8, color: COLORS.text, paddingVertical: 10, fontSize: 16, fontWeight: 'bold', outlineStyle: 'none' }}
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
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Abonar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Lista de Abonos Registrados */}
                  <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.textMuted, marginBottom: 6 }}>
                      ABONOS APLICADOS ({splitPayments.length}):
                    </Text>

                    {splitPayments.length === 0 ? (
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic', paddingVertical: 4 }}>
                        Aún no se han agregado pagos. Selecciona un método y presiona "Abonar".
                      </Text>
                    ) : (
                      <View style={{ gap: 6 }}>
                        {splitPayments.map((p) => (
                          <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border }}>
                            <View>
                              <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 13 }}>
                                {p.method} ({p.currency})
                              </Text>
                              <Text style={{ color: COLORS.textMuted, fontSize: 11 }}>
                                {p.currency === 'VES' ? ("Bs " + formatMoney(p.amount) + " (Equivalente: $" + formatMoney(p.amountUsd) + ")") : ("$" + formatMoney(p.amount) + " (Bs " + formatMoney(p.amountBs) + ")")}
                              </Text>
                            </View>

                            <TouchableOpacity onPress={() => handleRemoveSplitPayment(p.id)} style={{ padding: 6 }}>
                              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Botones de Acción */}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                <TouchableOpacity 
                  style={{ flex: 1, padding: 16, borderRadius: 10, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' }} 
                  onPress={() => setCheckoutVisible(false)}
                >
                  <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 15 }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ 
                    flex: 1.5, 
                    padding: 16, 
                    borderRadius: 10, 
                    backgroundColor: (payMode === 'split' && remainingUsd > 0.05) ? '#334155' : '#10b981', 
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                  onPress={handlePay}
                  disabled={payMode === 'split' && remainingUsd > 0.05}
                >
                  <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 15 }}>
                    {payMode === 'split' && remainingUsd > 0.05 
                      ? ("Falta $" + remainingUsd.toFixed(2)) 
                      : 'Confirmar Pago Completo'}
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      )}`;

content = content.replace(oldCheckoutModalRegex, newCheckoutModalCode);

fs.writeFileSync(path, content, 'utf8');
console.log("PosOrderingScreen updated with full split payments checkout UI!");
