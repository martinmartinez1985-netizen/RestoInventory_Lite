const fs = require('fs');

const file = 'src/screens/PosOrderingScreen.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync(file, content);
console.log("Fixed escapes for PosOrderingScreen");
