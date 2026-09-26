const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Add formatMoney and new states
content = content.replace(
  /const \[clientInfo, setClientInfo\] = useState\(''\);/,
  `const [clientName, setClientName] = useState('');\n  const [clientId, setClientId] = useState('');\n\n  const formatMoney = (val) => Number(val).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});`
);

// Update handlePay validation
content = content.replace(
  /if \(payCurrency === 'CxC' && clientInfo\.trim\(\) === ''\)/,
  `if (payCurrency === 'CxC' && clientName.trim() === '')`
);

// Update Modal Inputs
const oldModalInputs = `<View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
              <View style={{flex: 2}}>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>CLIENTE / CÉDULA</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none'}} 
                  value={clientInfo} 
                  onChangeText={setClientInfo} 
                  placeholder="Consumidor Final" 
                  placeholderTextColor={COLORS.border}
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>TASA (Bs)</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none'}} 
                  value={exchangeRate} 
                  onChangeText={setExchangeRate} 
                  keyboardType="numeric"
                />
              </View>
            </View>`;

const newModalInputs = `<View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
              <View style={{flex: 2}}>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>NOMBRE / RAZÓN SOCIAL</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none'}} 
                  value={clientName} 
                  onChangeText={setClientName} 
                  placeholder="Consumidor Final" 
                  placeholderTextColor={COLORS.border}
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>CÉDULA / RIF</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none'}} 
                  value={clientId} 
                  onChangeText={setClientId} 
                  placeholder="V-000000" 
                  placeholderTextColor={COLORS.border}
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>TASA (Bs)</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none'}} 
                  value={exchangeRate} 
                  onChangeText={setExchangeRate} 
                  keyboardType="numeric"
                />
              </View>
            </View>`;
content = content.replace(oldModalInputs, newModalInputs);

// Replace toFixed(2) instances with formatMoney
content = content.replace(/order\.total\.toFixed\(2\)/g, "formatMoney(order.total)");
content = content.replace(/\(item\.price \|\| 15\.99\)\.toFixed\(2\)/g, "formatMoney(item.price || 15.99)");
content = content.replace(/\(item\.price \* item\.qty\)\.toFixed\(2\)/g, "formatMoney(item.price * item.qty)");
content = content.replace(/\(order\.total \* \(parseFloat\(exchangeRate\) \|\| 1\)\)\.toFixed\(2\)/g, "formatMoney(order.total * (parseFloat(exchangeRate) || 1))");

fs.writeFileSync(path, content);
console.log("Formatting patched");
