const fs = require('fs');

// Patch PosOrderingScreen.js
const posPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let posContent = fs.readFileSync(posPath, 'utf8');

if (!posContent.includes('globalSettings')) {
  posContent = posContent.replace(
    /import \{ globalRecipes, globalActiveOrders, globalTables, updateStock, processProductionBatch, registerShiftSale \} from '\.\.\/store\/mockDb';/,
    "import { globalRecipes, globalActiveOrders, globalTables, updateStock, processProductionBatch, registerShiftSale, globalSettings } from '../store/mockDb';"
  );
}

posContent = posContent.replace(
  /const \[exchangeRate, setExchangeRate\] = useState\('40\.00'\);/,
  "const [exchangeRate, setExchangeRate] = useState(globalSettings.exchangeRate);"
);

fs.writeFileSync(posPath, posContent);


// Patch DashboardScreen.js
const dashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');

// Add globalSettings import if missing
if (!dashContent.includes('globalSettings')) {
  dashContent = dashContent.replace(
    /import \{ MaterialCommunityIcons \} from '@expo\/vector-icons';/,
    "import { MaterialCommunityIcons } from '@expo/vector-icons';\nimport { globalSettings } from '../store/mockDb';"
  );
}

// Add tick state
if (!dashContent.includes('const [tick, setTick]')) {
  dashContent = dashContent.replace(
    /export default function DashboardScreen\(\{ navigation \}\) \{/,
    "export default function DashboardScreen({ navigation }) {\n  const [tick, setTick] = React.useState(0);"
  );
}

// Inject Tasa del Dia Widget
const rateWidget = `
          {/* Tasa del Día Widget */}
          <View style={{backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } })}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={{backgroundColor: '#e6f4ea', padding: 10, borderRadius: 12}}>
                <MaterialCommunityIcons name="currency-usd" size={24} color="#10b981" />
              </View>
              <View style={{marginLeft: 15}}>
                <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1e293b'}}>Tasa del Día Oficial</Text>
                <Text style={{fontSize: 13, color: '#64748b', marginTop: 2}}>Aplica para todas las facturas del sistema</Text>
              </View>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={{fontSize: 15, color: '#64748b', marginRight: 10, fontWeight: 'bold'}}>1 USD = Bs.</Text>
              <TextInput 
                style={{backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 18, fontWeight: 'bold', color: '#0f172a', textAlign: 'right', minWidth: 120, outlineStyle: 'none'}}
                value={globalSettings.exchangeRate}
                onChangeText={(val) => { globalSettings.exchangeRate = val; setTick(t=>t+1); }}
                keyboardType="numeric"
              />
            </View>
          </View>
`;

dashContent = dashContent.replace(
  /\{\/\* Grid Section \*\/\}/,
  rateWidget + "\n          {/* Grid Section */}"
);

// Add TextInput to imports in Dashboard if missing
if (!dashContent.includes('TextInput')) {
  dashContent = dashContent.replace(
    /Platform, Image/,
    "Platform, Image, TextInput"
  );
}

fs.writeFileSync(dashPath, dashContent);
console.log("Tasa Widget applied");
