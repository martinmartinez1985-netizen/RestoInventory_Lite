const fs = require('fs');
const path = require('path');

const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let nav = fs.readFileSync(navPath, 'utf8');

const importStr = "import CashCloseScreen from '../screens/CashCloseScreen';";
if (!nav.includes(importStr)) {
  nav = nav.replace(/import ProductionScreen from '\.\.\/screens\/ProductionScreen';/, "import ProductionScreen from '../screens/ProductionScreen';\n" + importStr);
}

const routeStr = '<Stack.Screen name="CashClose" component={CashCloseScreen} options={{ headerShown: false }} />';
if (!nav.includes(routeStr)) {
  nav = nav.replace(/<Stack\.Screen name="Reports" component=\{PlaceholderScreen\} \/>/, routeStr + '\n        <Stack.Screen name="Reports" component={PlaceholderScreen} />');
}

fs.writeFileSync(navPath, nav);
console.log("Nav updated with CashCloseScreen");
