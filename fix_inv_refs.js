const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens';

['RawMaterialsScreen.js', 'WipScreen.js', 'FinishedGoodsScreen.js'].forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/updateIngredientStock/g, 'updateStock');
    fs.writeFileSync(filePath, content);
  }
});
console.log("Fixed updateStock references in inventory screens.");
