const fs = require('fs');

const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let nav = fs.readFileSync(navPath, 'utf8');

const importStr = "import IngredientCatalogScreen from '../screens/IngredientCatalogScreen';";
if (!nav.includes(importStr)) {
  nav = nav.replace(/import RecipesMenuScreen from '\.\.\/screens\/RecipesMenuScreen';/, "import RecipesMenuScreen from '../screens/RecipesMenuScreen';\n" + importStr);
}

const routeStr = '<Stack.Screen name="IngredientCatalog" component={IngredientCatalogScreen} options={{ headerShown: false }} />';
if (!nav.includes(routeStr)) {
  nav = nav.replace(/<Stack\.Screen name="Recipes" component=\{RecipesMenuScreen\} options=\{\{ headerShown: false \}\} \/>/, '<Stack.Screen name="Recipes" component={RecipesMenuScreen} options={{ headerShown: false }} />\n        ' + routeStr);
}

fs.writeFileSync(navPath, nav);
console.log("Nav updated with IngredientCatalogScreen");
