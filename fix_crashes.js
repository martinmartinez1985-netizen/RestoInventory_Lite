const fs = require('fs');

// Fix DashboardScreen.js imports
const dashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(
  /import \{ View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, SafeAreaView, Platform, Image \} from 'react-native';/,
  "import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, SafeAreaView, Platform, Image, TextInput } from 'react-native';"
);
fs.writeFileSync(dashPath, dashContent);

// Fix mockDb.js trailing garbage
const mockDbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let mockContent = fs.readFileSync(mockDbPath, 'utf8');

// The file should end properly. Let's just crop it at the `setInterval` and add it back cleanly.
const match = mockContent.indexOf('setInterval(persistData, 3000);');
if (match !== -1) {
  mockContent = mockContent.substring(0, match);
  mockContent += `setInterval(persistData, 3000); // Autoguardar cada 3 segundos
}

export const globalSettings = { exchangeRate: '40.00' };
`;
}

fs.writeFileSync(mockDbPath, mockContent);
console.log("Fixed errors");
