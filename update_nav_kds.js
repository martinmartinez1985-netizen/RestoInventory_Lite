const fs = require('fs');

const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let nav = fs.readFileSync(navPath, 'utf8');

const importStr = "import KitchenScreen from '../screens/KitchenScreen';";
if (!nav.includes(importStr)) {
  nav = nav.replace(/import PosOrderingScreen from '\.\.\/screens\/PosOrderingScreen';/, "import PosOrderingScreen from '../screens/PosOrderingScreen';\n" + importStr);
}

const routeStr = '<Stack.Screen name="Kitchen" component={KitchenScreen} options={{ headerShown: false }} />';
if (!nav.includes(routeStr)) {
  nav = nav.replace(/<Stack\.Screen name="PosOrdering" component=\{PosOrderingScreen\} options=\{\{ headerShown: false \}\} \/>/, '<Stack.Screen name="PosOrdering" component={PosOrderingScreen} options={{ headerShown: false }} />\n        ' + routeStr);
}

fs.writeFileSync(navPath, nav);
console.log("Nav updated with KitchenScreen");
