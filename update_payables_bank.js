const fs = require('fs');
let content = fs.readFileSync('src/screens/PayablesScreen.js', 'utf8');

// 1. Update imports
content = content.replace(
  "import { globalPayables, addPayable, updatePayable, globalDirectory } from '../store/mockDb';",
  "import { globalPayables, addPayable, updatePayable, globalDirectory, globalBanks, updateBankBalance } from '../store/mockDb';"
);

// 2. Add state
content = content.replace(
  "const [paymentMethod, setPaymentMethod] = useState('');\n",
  "const [paymentMethod, setPaymentMethod] = useState('');\n  const [selectedBank, setSelectedBank] = useState(null);\n"
);

// 3. Update handleProcessPayment
content = content.replace(
  /if \(\!paymentMethod\) \{\s*alert\("Por favor selecciona un método de pago\."\);\s*return;\s*\}/,
  `if (!paymentMethod) {
      alert("Por favor selecciona un método de pago.");
      return;
    }
    if (!selectedBank) {
      alert("Por favor selecciona un banco a afectar.");
      return;
    }`
);

content = content.replace(
  "addPayable(newTrx);",
  "addPayable(newTrx);\n    // Money goes OUT in Payables\n    updateBankBalance(selectedBank, -amt, paymentCurrency === 'BS' ? -parseFloat(amountBS) : 0);"
);

content = content.replace(
  "setPaymentMethod('');",
  "setPaymentMethod('');\n    setSelectedBank(null);"
);

// 4. Add UI
const uiToInsert = `
              <Text style={styles.label}>Banco a Afectar:</Text>
              <View style={{ marginBottom: 25, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {globalBanks.map(b => (
                  <TouchableOpacity 
                    key={b.id} 
                    style={[styles.bankSelectBtn, selectedBank === b.id && styles.bankSelectBtnActive]}
                    onPress={() => setSelectedBank(b.id)}
                  >
                    <Text style={[styles.bankSelectBtnTxt, selectedBank === b.id && styles.bankSelectBtnTxtActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
`;

content = content.replace(
  "</View>\n\n              <View style={styles.modalActions}>",
  "</View>\n" + uiToInsert + "\n              <View style={styles.modalActions}>"
);

// 5. Update confirm btn logic
content = content.replace(
  "disabled={!paymentMethod}",
  "disabled={!paymentMethod || !selectedBank}"
);
content = content.replace(
  "!paymentMethod && { backgroundColor:",
  "(!paymentMethod || !selectedBank) && { backgroundColor:"
);

// 6. Add styles
content = content.replace(
  "// View Modal specific styles",
  "bankSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },\n  bankSelectBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },\n  bankSelectBtnTxt: { fontSize: 12, color: '#64748b', fontWeight: '600' },\n  bankSelectBtnTxtActive: { color: '#fff' },\n\n  // View Modal specific styles"
);

fs.writeFileSync('src/screens/PayablesScreen.js', content);
