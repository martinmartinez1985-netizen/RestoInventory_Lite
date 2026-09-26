const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\components';
if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
}
console.log("components directory ready");
