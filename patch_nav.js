const fs = require('fs');

// 1. Remove from DashboardScreen.js
const dashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');

const widgetRegex = /\{\/\* Tasa del Día Widget \*\/\}[\s\S]*?\{\/\* Grid Section \*\/\}/;
dashContent = dashContent.replace(widgetRegex, "{/* Grid Section */}");
fs.writeFileSync(dashPath, dashContent);

// 2. Add to AppNavigator.js
const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let navContent = fs.readFileSync(navPath, 'utf8');

if (!navContent.includes('globalSettings')) {
  navContent = navContent.replace(
    /import \{ MaterialCommunityIcons \} from '@expo\/vector-icons';/,
    "import { MaterialCommunityIcons } from '@expo/vector-icons';\nimport { globalSettings } from '../store/mockDb';"
  );
}

if (!navContent.includes('TextInput')) {
  navContent = navContent.replace(
    /import \{ TouchableOpacity, View, Text, Platform, Image \} from 'react-native';/,
    "import { TouchableOpacity, View, Text, Platform, Image, TextInput } from 'react-native';"
  );
}

const ratePill = `
              {/* Tasa del Día Pill */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#e6f4ea', 
                paddingHorizontal: 10, 
                paddingVertical: 4, 
                borderRadius: 20,
                borderWidth: 1,
                borderColor: '#a7f3d0'
              }}>
                <MaterialCommunityIcons name="currency-usd" size={14} color="#10b981" />
                <Text style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold', marginLeft: 2 }}>TASA:</Text>
                <TextInput 
                  style={{ fontSize: 13, fontWeight: 'bold', color: '#047857', width: 45, outlineStyle: 'none', marginLeft: 4}}
                  defaultValue={globalSettings.exchangeRate}
                  onChangeText={(val) => { globalSettings.exchangeRate = val; }}
                  keyboardType="numeric"
                />
              </View>
`;

navContent = navContent.replace(
  /\{\/\* Dropdown sucrsal simulado \*\/\}/,
  ratePill + "\n              {/* Dropdown sucrsal simulado */}"
);

fs.writeFileSync(navPath, navContent);
console.log("Nav patched");
