const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens';
const templatePath = path.join(srcDir, 'InventoryScreen.js');

if (!fs.existsSync(templatePath)) {
  console.log("Template no existe");
  process.exit(1);
}

let template = fs.readFileSync(templatePath, 'utf8');

// 1. RawMaterialsScreen
let raw = template.replace(/InventoryScreen/g, 'RawMaterialsScreen');
raw = raw.replace(/globalIngredients/g, 'globalRawMaterials');
raw = raw.replace(/'Almacén Central'/g, "'Materia Prima'");
raw = raw.replace(/'Monitor de stock y registro de mermas'/g, "'Inventario de ingredientes crudos'");
raw = raw.replace(/navigation\.navigate\('Recipes'\)/g, "navigation.navigate('InventoryHub')");
fs.writeFileSync(path.join(srcDir, 'RawMaterialsScreen.js'), raw);

// 2. WipScreen
let wip = template.replace(/InventoryScreen/g, 'WipScreen');
wip = wip.replace(/globalIngredients/g, 'globalWip');
wip = wip.replace(/'Almacén Central'/g, "'Inventario En Proceso'");
wip = wip.replace(/'Monitor de stock y registro de mermas'/g, "'Salsas, masas y preparaciones previas'");
wip = wip.replace(/navigation\.navigate\('Recipes'\)/g, "navigation.navigate('InventoryHub')");
fs.writeFileSync(path.join(srcDir, 'WipScreen.js'), wip);

// 3. FinishedGoodsScreen
let fg = template.replace(/InventoryScreen/g, 'FinishedGoodsScreen');
fg = fg.replace(/globalIngredients/g, 'globalFinishedGoods');
fg = fg.replace(/'Almacén Central'/g, "'Producto Terminado'");
fg = fg.replace(/'Monitor de stock y registro de mermas'/g, "'Platos listos para la venta'");
fg = fg.replace(/navigation\.navigate\('Recipes'\)/g, "navigation.navigate('InventoryHub')");
fs.writeFileSync(path.join(srcDir, 'FinishedGoodsScreen.js'), fg);

console.log("Inventarios creados.");
