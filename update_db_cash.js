const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const newDbLogic = `
// --- SHIFT & CASH CLOSURE MODULE ---

export const globalShift = {
  isOpen: true,
  openingCash: 100.00, // Fondo de caja inicial
  sales: {
    cash: 250.50,      // Efectivo en gaveta por ventas
    card: 430.00,
    transfer: 120.00
  }
};

export const globalZReports = [];

// Mock function to register a sale (normally called from BillingScreen)
export const registerShiftSale = (amount, method) => {
  if (!globalShift.isOpen) return;
  if (method === 'efectivo') globalShift.sales.cash += amount;
  if (method === 'tarjeta') globalShift.sales.card += amount;
  if (method === 'transferencia') globalShift.sales.transfer += amount;
};

export const closeShift = (actualCash, discrepancies) => {
  const report = {
    id: 'Z-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    expectedCash: globalShift.openingCash + globalShift.sales.cash,
    actualCash,
    discrepancy: discrepancies.cash,
    totalSales: globalShift.sales.cash + globalShift.sales.card + globalShift.sales.transfer
  };
  globalZReports.push(report);
  
  // Reset for next shift
  globalShift.openingCash = actualCash; // El efectivo que quedó físicamente se vuelve el fondo del día siguiente
  globalShift.sales.cash = 0;
  globalShift.sales.card = 0;
  globalShift.sales.transfer = 0;
  
  return report;
};
`;

content += newDbLogic;
fs.writeFileSync(dbPath, content);
console.log("mockDb updated with shift logic.");
