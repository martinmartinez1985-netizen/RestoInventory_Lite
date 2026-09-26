const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { printTicket }")) {
  content = content.replace(
    /import \{ globalActiveOrders, globalRecipes/,
    "import { printTicket } from '../utils/printer';\nimport { globalActiveOrders, globalRecipes"
  );
}

// Update sendToKitchen
const oldSend = /const sendToKitchen = \(\) => \{[\s\S]*?alert\("Comanda enviada a la cocina\."\);\s*setTick\(t => t\+1\);\s*\}\s*\};/;
const newSend = `const sendToKitchen = () => {
    const newItems = [];
    order.items.forEach(item => {
      if (!item.sentToKitchen) {
        item.sentToKitchen = true;
        newItems.push({...item});
        processProductionBatch(item.recipeId, item.qty);
      }
    });
    if (newItems.length > 0) {
      printTicket('kitchen', { ...order, items: newItems }, globalSettings);
      alert("Comanda enviada a la cocina.");
      setTick(t => t+1);
    }
  };`;

content = content.replace(oldSend, newSend);

// Update handlePay
const oldPay = /registerShiftSale\(amountToRegister, payMethod, payCurrency\);\s*order\.status = 'paid';/;
const newPay = `registerShiftSale(amountToRegister, payMethod, payCurrency);
    order.status = 'paid';
    printTicket('receipt', order, globalSettings);`;

content = content.replace(oldPay, newPay);

fs.writeFileSync(path, content);
console.log("POS patched with printer");
