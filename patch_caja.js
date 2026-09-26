const fs = require('fs');

// Patch mockDb.js
const mockDbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let mockContent = fs.readFileSync(mockDbPath, 'utf8');

const oldCloseShift = /export const closeShift = \(actualCash, discrepancies\) => \{[\s\S]*?globalShift\.isOpen = false;[\s\S]*?return report;\s*\};/;
const newCloseShift = `export const openShift = (openingCash = 100) => {
  globalShift.isOpen = true;
  globalShift.openingCash = openingCash;
  globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
  globalShift.startTime = new Date().toISOString();
};

export const closeShift = (actualCash, discrepancy) => {
  const report = {
    id: 'Z-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    expectedCash: globalShift.openingCash + globalShift.sales.usdCash,
    actualCash,
    discrepancy,
    totalSales: globalShift.sales.usdCash + globalShift.sales.usdDigital + (globalShift.sales.bsCash / 40) + (globalShift.sales.bsDigital / 40) + globalShift.sales.cxc
  };
  globalZReports.push(report);
  
  globalShift.isOpen = false;
  return report;
};`;

mockContent = mockContent.replace(oldCloseShift, newCloseShift);
fs.writeFileSync(mockDbPath, mockContent);

// Patch CashCloseScreen.js
const cashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\CashCloseScreen.js';
let cashContent = fs.readFileSync(cashPath, 'utf8');

// Replace imports
cashContent = cashContent.replace(
  /import \{ globalShift, closeShift, registerShiftSale \} from '\.\.\/store\/mockDb';/,
  "import { globalShift, closeShift, registerShiftSale, openShift } from '../store/mockDb';"
);

// Add state for tick to force re-render
if (!cashContent.includes('const [tick, setTick]')) {
  cashContent = cashContent.replace(
    /const \[latestReport, setLatestReport\] = useState\(null\);/,
    "const [latestReport, setLatestReport] = useState(null);\n  const [tick, setTick] = useState(0);"
  );
}

// Add closed state UI
const closedUi = `
  if (!globalShift.isOpen && !hasClosed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c24'}}>
          <MaterialCommunityIcons name="lock-outline" size={80} color="#3f4b5b" />
          <Text style={{color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20}}>La Caja está Cerrada</Text>
          <Text style={{color: '#6c7a8f', fontSize: 16, marginTop: 10, marginBottom: 40}}>Abre un nuevo turno para empezar a facturar.</Text>
          
          <TouchableOpacity 
            style={{backgroundColor: '#10b981', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12}}
            onPress={() => {
              openShift(100); // 100 de fondo de caja por defecto
              setTick(t => t + 1);
            }}
          >
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>ABRIR CAJA ($100 FONDO)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
`;

if (!cashContent.includes('La Caja está Cerrada')) {
  cashContent = cashContent.replace(
    /if \(hasClosed && latestReport\) \{/,
    closedUi + "\n  if (hasClosed && latestReport) {"
  );
}

// Fix handleClose
cashContent = cashContent.replace(
  /const report = closeShift\(inputCashNum, discrepancy\);/,
  "const report = closeShift(inputCashNum, discrepancy);"
);

fs.writeFileSync(cashPath, cashContent);
console.log("Caja patched");
