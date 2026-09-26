const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens';

// 1. Fix PurchasesScreen.js
const pPath = path.join(srcDir, 'PurchasesScreen.js');
if (fs.existsSync(pPath)) {
  let content = fs.readFileSync(pPath, 'utf8');
  content = content.replace(/globalIngredients/g, 'globalRawMaterials');
  content = content.replace(/updateIngredientStock/g, 'updateStock');
  fs.writeFileSync(pPath, content);
}

// 2. Fix RecipeCreatorScreen.js
const rcPath = path.join(srcDir, 'RecipeCreatorScreen.js');
if (fs.existsSync(rcPath)) {
  let content = fs.readFileSync(rcPath, 'utf8');
  content = content.replace(/globalIngredients/g, 'globalRawMaterials');
  fs.writeFileSync(rcPath, content);
}

// 3. Fix RecipesMenuScreen.js (Route Inventory -> InventoryHub)
const rmPath = path.join(srcDir, 'RecipesMenuScreen.js');
if (fs.existsSync(rmPath)) {
  let content = fs.readFileSync(rmPath, 'utf8');
  content = content.replace(/route:\s*'Inventory'/g, "route: 'InventoryHub'");
  fs.writeFileSync(rmPath, content);
}

// 4. Fix AppNavigator.js (Remove old InventoryScreen)
const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
if (fs.existsSync(navPath)) {
  let content = fs.readFileSync(navPath, 'utf8');
  content = content.replace(/import InventoryScreen from '\.\.\/screens\/InventoryScreen';\n?/g, '');
  content = content.replace(/<Stack\.Screen name="Inventory" component=\{InventoryScreen\}.*\/>\n?/g, '');
  fs.writeFileSync(navPath, content);
}

console.log("Fixed broken references to old globalIngredients.");
