const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Ensure recordCompletedOrder and globalOrderHistory are imported
if (!content.includes('recordCompletedOrder')) {
  content = content.replace(
    /import \{ (.*?) \} from '\.\.\/store\/mockDb';/,
    (match, p1) => `import { ${p1}, recordCompletedOrder, globalOrderHistory } from '../store/mockDb';`
  );
}

// 2. Fix addToOrder to addItem
content = content.replace(
  /onPress=\{\(\) => addToOrder\(recipe\)\}/g,
  'onPress={() => addItem(recipe)}'
);

// 3. Fix recipe.salePrice fallback
content = content.replace(
  /\$\{formatMoney\(recipe\.salePrice\)\}/g,
  '${formatMoney(recipe.salePrice || recipe.price || 15.99)}'
);

// 4. Update handlePay to call recordCompletedOrder
const oldHandlePayRegex = /registerShiftSale\(amountToRegister, payMethod, payCurrency\);[\s\S]*?order\.status = 'paid';[\s\S]*?printTicket\('receipt', order, globalSettings\);/;

const newHandlePayCode = `registerShiftSale(amountToRegister, payMethod, payCurrency);
      order.status = 'paid';
      recordCompletedOrder(order, {
        method: payMethod,
        currency: payCurrency,
        amount: amountToRegister,
        exchangeRate: parseFloat(exchangeRate) || parseFloat(globalSettings.exchangeRate) || 40,
        clientName: clientName || order.customerName,
        clientId: clientId || order.clientId
      });
      printTicket('receipt', order, globalSettings);`;

content = content.replace(oldHandlePayRegex, newHandlePayCode);

fs.writeFileSync(path, content, 'utf8');
console.log("PosOrderingScreen updated successfully with recordCompletedOrder and item click fix");
