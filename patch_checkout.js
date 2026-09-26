const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Añadir variables de estado
content = content.replace(
  /const \[tick, setTick\] = useState\(0\);/,
  `const [tick, setTick] = useState(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [payCurrency, setPayCurrency] = useState('USD');
  const [payMethod, setPayMethod] = useState('');`
);

// 2. Actualizar handlePay
content = content.replace(
  /const handlePay = \(method\) => \{[\s\S]*?recalcTotal\(\);\n  \};/,
  `const handlePay = () => {
    if (order.items.some(i => !i.sentToKitchen)) {
      alert("Envíe primero todos los ítems a la cocina para descontar el stock.");
      return;
    }
    if (!payMethod) {
      alert("Seleccione un método de pago.");
      return;
    }
    
    registerShiftSale(order.total, payMethod, payCurrency);
    order.status = 'paid';
    alert("¡Pagado con " + payMethod + " (" + payCurrency + ")! Total: $" + order.total.toFixed(2));
    
    // Reset para la siguiente orden
    setOrder({
      id: 'ORD-' + Math.floor(Math.random()*1000000),
      tableId: order.tableId,
      type: order.type,
      items: [],
      total: 0,
      status: 'open',
      createdAt: new Date().toISOString()
    });
    setCheckoutVisible(false);
    recalcTotal();
  };`
);

// 3. Reemplazar los botones viejos por el nuevo botón unificado
content = content.replace(
  /<View style=\{\{flexDirection: 'row', gap: 10\}\}\>[\s\S]*?<\/View>/,
  `<TouchableOpacity 
      style={{backgroundColor: '#10b981', padding: 18, borderRadius: 12, alignItems: 'center'}}
      onPress={() => setCheckoutVisible(true)}
    >
      <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>COBRAR ORDEN</Text>
    </TouchableOpacity>`
);

// 4. Agregar el Checkout Modal al final del SafeAreaView
const modalCode = `
      {/* Checkout Modal */}
      {checkoutVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{fontSize: 22, fontWeight: 'bold', marginBottom: 20}}>Seleccionar Método de Pago</Text>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
              <Text style={{fontSize: 18}}>Total a Cobrar:</Text>
              <View>
                <Text style={{fontSize: 24, fontWeight: 'bold', color: '#10b981', textAlign: 'right'}}>$ {order.total.toFixed(2)}</Text>
                <Text style={{fontSize: 14, color: '#64748b', textAlign: 'right'}}>Bs {(order.total * 40).toFixed(2)} (Tasa Ref: 40)</Text>
              </View>
            </View>

            <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
              <TouchableOpacity style={[styles.currBtn, payCurrency === 'USD' && styles.currBtnActive]} onPress={() => {setPayCurrency('USD'); setPayMethod('');}}>
                <Text style={[styles.currBtnTxt, payCurrency === 'USD' && {color:'#fff'}]}>DIVISAS (USD)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.currBtn, payCurrency === 'VES' && styles.currBtnActive]} onPress={() => {setPayCurrency('VES'); setPayMethod('');}}>
                <Text style={[styles.currBtnTxt, payCurrency === 'VES' && {color:'#fff'}]}>BOLÍVARES (Bs)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.currBtn, payCurrency === 'CxC' && styles.currBtnActive]} onPress={() => {setPayCurrency('CxC'); setPayMethod('Crédito');}}>
                <Text style={[styles.currBtnTxt, payCurrency === 'CxC' && {color:'#fff'}]}>CRÉDITO (CxC)</Text>
              </TouchableOpacity>
            </View>

            {payCurrency === 'USD' && (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
                {['Efectivo', 'Zelle', 'Binance', 'Otro'].map(m => (
                  <TouchableOpacity key={m} style={[styles.methBtn, payMethod === m && styles.methBtnActive]} onPress={() => setPayMethod(m)}>
                    <Text style={[styles.methBtnTxt, payMethod === m && {color:'#fff'}]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {payCurrency === 'VES' && (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
                {['Efectivo', 'Pago Móvil', 'Transferencia', 'Punto de Venta'].map(m => (
                  <TouchableOpacity key={m} style={[styles.methBtn, payMethod === m && styles.methBtnActive]} onPress={() => setPayMethod(m)}>
                    <Text style={[styles.methBtnTxt, payMethod === m && {color:'#fff'}]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity style={{flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#e2e8f0', alignItems: 'center'}} onPress={() => setCheckoutVisible(false)}>
                <Text style={{fontWeight: 'bold', color: '#475569'}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center'}} onPress={handlePay}>
                <Text style={{fontWeight: 'bold', color: '#fff'}}>Confirmar Pago</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      )}
`;

content = content.replace(/<\/SafeAreaView>/, modalCode + '\n    </SafeAreaView>');

// 5. Agregar estilos del Modal
const modalStyles = `
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', width: 500, borderRadius: 16, padding: 30, ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.3)' } }) },
  currBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#f8fafc' },
  currBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  currBtnTxt: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  methBtn: { width: '47%', paddingVertical: 15, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', backgroundColor: '#fff' },
  methBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  methBtnTxt: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
`;

content = content.replace(/actionsBox: \{ marginTop: 'auto' \},/, modalStyles + '\n  actionsBox: { marginTop: "auto" },');

fs.writeFileSync(path, content);
console.log("Checkout patched!");
