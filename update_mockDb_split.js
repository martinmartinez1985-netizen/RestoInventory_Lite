const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\store\\\\mockDb.js';

let content = fs.readFileSync(path, 'utf8');

const oldRecordRegex = /export const recordCompletedOrder = \(order, paymentInfo = \{\}\) => \{[\s\S]*?return completedOrder;\s*\};/;

const newRecordCode = `export const recordCompletedOrder = (order, paymentInfo = {}) => {
  const rate = paymentInfo.exchangeRate || (parseFloat(globalSettings.exchangeRate) || 40);
  const paidAt = paymentInfo.paidAt || new Date().toISOString();

  let payments = [];
  if (paymentInfo.payments && paymentInfo.payments.length > 0) {
    payments = paymentInfo.payments.map(p => ({
      method: p.method,
      currency: p.currency,
      amount: Number(p.amount),
      amountUsd: Number(p.amountUsd),
      amountBs: Number(p.amountBs || (p.currency === 'VES' ? p.amount : p.amountUsd * rate)),
      exchangeRate: rate
    }));
  } else {
    const isVes = paymentInfo.currency === 'VES';
    const amt = Number(paymentInfo.amount || order.total);
    const amtUsd = isVes ? (amt / rate) : amt;
    const amtBs = isVes ? amt : (amt * rate);

    payments = [{
      method: paymentInfo.method || 'Efectivo',
      currency: paymentInfo.currency || 'USD',
      amount: amt,
      amountUsd: amtUsd,
      amountBs: amtBs,
      exchangeRate: rate
    }];
  }

  const completedOrder = {
    ...order,
    status: 'paid',
    customerName: order.customerName || (paymentInfo.clientName || 'Cliente General'),
    clientId: order.clientId || (paymentInfo.clientId || 'Sin Doc'),
    payment: {
      method: payments.length > 1 ? 'Pago Mixto' : payments[0].method,
      currency: payments.length > 1 ? 'Multi' : payments[0].currency,
      amount: payments.length > 1 ? order.total : payments[0].amount,
      exchangeRate: rate,
      paidAt
    },
    payments
  };

  // Registrar en caja cada abono individual
  payments.forEach(p => {
    registerShiftSale(p.amount, p.method, p.currency);
  });

  // Agregar al inicio del historial de ventas
  globalOrderHistory.unshift(completedOrder);

  // Remover de ordenes activas
  const activeIdx = globalActiveOrders.findIndex(o => o.id === order.id);
  if (activeIdx !== -1) {
    globalActiveOrders.splice(activeIdx, 1);
  }

  persistData();
  return completedOrder;
};`;

content = content.replace(oldRecordRegex, newRecordCode);

fs.writeFileSync(path, content, 'utf8');
console.log("mockDb updated with split payments support");
