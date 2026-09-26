const fs = require('fs');
const path = require('path');

const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let nav = fs.readFileSync(navPath, 'utf8');

const importStr = "import PosOrderingScreen from '../screens/PosOrderingScreen';";
if (!nav.includes(importStr)) {
  nav = nav.replace(/import BillingScreen from '\.\.\/screens\/BillingScreen';/, "import BillingScreen from '../screens/BillingScreen';\n" + importStr);
}

const routeStr = '<Stack.Screen name="PosOrdering" component={PosOrderingScreen} options={{ headerShown: false }} />';
if (!nav.includes(routeStr)) {
  nav = nav.replace(/<Stack\.Screen \n\s*name="Billing" \n\s*component=\{BillingScreen\} \n\s*\/>/, '<Stack.Screen name="Billing" component={BillingScreen} options={{ headerShown: false }} />\n        ' + routeStr);
}

fs.writeFileSync(navPath, nav);
console.log("Nav updated with PosOrderingScreen");
