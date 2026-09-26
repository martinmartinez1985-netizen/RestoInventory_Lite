const fs = require('fs');

const filesToFix = [
  'src/screens/PurchasesScreen.js',
  'src/screens/InventoryScreen.js',
  'src/screens/RecipeCreatorScreen.js',
  'src/utils/unitConverter.js',
  'src/store/mockDb.js'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace \` with `
    content = content.replace(/\\`/g, '`');
    // Replace \$ with $
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
  }
});
