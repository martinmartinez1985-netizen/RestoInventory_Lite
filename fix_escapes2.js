const fs = require('fs');

const filesToFix = [
  'src/screens/ProductionScreen.js',
  'src/screens/CashCloseScreen.js'
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
