const fs = require('fs');
const path = require('path');

const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let nav = fs.readFileSync(navPath, 'utf8');

// Add imports
const imports = `import RawMaterialsScreen from '../screens/RawMaterialsScreen';
import WipScreen from '../screens/WipScreen';
import FinishedGoodsScreen from '../screens/FinishedGoodsScreen';
import ProductionScreen from '../screens/ProductionScreen';
`;

nav = nav.replace(/import InventoryHubScreen from '\.\.\/screens\/InventoryHubScreen';/, "import InventoryHubScreen from '../screens/InventoryHubScreen';\n" + imports);

// Add routes
const routes = `<Stack.Screen name="RawMaterials" component={RawMaterialsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wip" component={WipScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FinishedGoods" component={FinishedGoodsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Production" component={ProductionScreen} options={{ headerShown: false }} />
`;

nav = nav.replace(/<Stack\.Screen name="InventoryHub" component=\{InventoryHubScreen\}.*\/>/, '<Stack.Screen name="InventoryHub" component={InventoryHubScreen} options={{ headerShown: false }} />\n        ' + routes);

fs.writeFileSync(navPath, nav);
console.log("Nav updated");
