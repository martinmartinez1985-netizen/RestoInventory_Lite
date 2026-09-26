const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const newDbLogic = `
// --- RESTAURANT POS MODULE ---

export const globalTables = Array.from({ length: 12 }, (_, i) => ({
  id: \`T\${i + 1}\`,
  name: \`Mesa \${i + 1}\`,
  status: 'free', // 'free', 'occupied', 'billed'
  capacity: i < 4 ? 2 : (i < 8 ? 4 : 6)
}));

export const globalActiveOrders = [];
export const globalOrderHistory = [];

export const createOrder = (type, tableId = null, customerName = null) => {
  const newOrder = {
    id: 'ORD-' + Date.now().toString().slice(-6),
    type, // 'dine_in', 'pickup', 'delivery'
    tableId,
    customerName,
    items: [],
    status: 'open', // 'open', 'sent_to_kitchen', 'paid'
    total: 0,
    createdAt: new Date().toISOString()
  };
  globalActiveOrders.push(newOrder);
  
  if (type === 'dine_in' && tableId) {
    const table = globalTables.find(t => t.id === tableId);
    if (table) table.status = 'occupied';
  }
  
  return newOrder;
};
`;

content += newDbLogic;
fs.writeFileSync(dbPath, content);
console.log("mockDb updated with POS logic.");
