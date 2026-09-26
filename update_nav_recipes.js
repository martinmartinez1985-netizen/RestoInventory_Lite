const fs = require('fs');
let content = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

const importReplacement = `import BanksScreen from '../screens/BanksScreen';
import RecipesMenuScreen from '../screens/RecipesMenuScreen';
import PurchasesScreen from '../screens/PurchasesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import RecipeCreatorScreen from '../screens/RecipeCreatorScreen';
`;
content = content.replace("import BanksScreen from '../screens/BanksScreen';", importReplacement);

const routesReplacement = `
        <Stack.Screen name="Recipes" component={RecipesMenuScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Purchases" component={PurchasesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecipeCreator" component={RecipeCreatorScreen} options={{ headerShown: false }} />
`;
content = content.replace("{/* Placeholder for other modules */}", routesReplacement + "\n        {/* Placeholder for other modules */}");

fs.writeFileSync('src/navigation/AppNavigator.js', content);
