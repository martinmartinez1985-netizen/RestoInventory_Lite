const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(path, 'utf8');

// remove corrupted UTF-16 lines at the end
content = content.replace(/e\x00x\x00p\x00o\x00r\x00t[\s\S]*$/, '');

if (!content.includes('export const globalSettings = { exchangeRate: ')) {
  content += "\nexport const globalSettings = { exchangeRate: '40.00' };\n";
}

fs.writeFileSync(path, content);
console.log("mockDb fixed");
