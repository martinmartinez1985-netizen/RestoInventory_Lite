const fs = require('fs');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const newFunc = `
export const addRawMaterial = (ing) => {
  globalRawMaterials.push({
    id: 'RAW-' + Date.now().toString().slice(-4),
    baseStock: 0,
    ...ing
  });
};
`;

if (!content.includes('addRawMaterial')) {
  content += newFunc;
  fs.writeFileSync(dbPath, content);
  console.log("addRawMaterial added to mockDb");
}
