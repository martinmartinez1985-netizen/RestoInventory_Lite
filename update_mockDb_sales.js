const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';

let content = fs.readFileSync(path, 'utf8');

// Check if recordCompletedOrder is already defined
if (!content.includes('recordCompletedOrder')) {
  const insertCode = `
export const recordCompletedOrder = (order, paymentInfo = {}) => {
  const completedOrder = {
    ...order,
    status: 'paid',
    customerName: order.customerName || (paymentInfo.clientName || 'Cliente General'),
    clientId: order.clientId || (paymentInfo.clientId || 'Sin Doc'),
    payment: {
      method: paymentInfo.method || 'Efectivo',
      currency: paymentInfo.currency || 'USD',
      amount: paymentInfo.amount || order.total,
      exchangeRate: paymentInfo.exchangeRate || (parseFloat(globalSettings.exchangeRate) || 40),
      paidAt: paymentInfo.paidAt || new Date().toISOString()
    }
  };

  // Agregar al inicio del historial de ventas
  globalOrderHistory.unshift(completedOrder);

  // Remover de ordenes activas
  const activeIdx = globalActiveOrders.findIndex(o => o.id === order.id);
  if (activeIdx !== -1) {
    globalActiveOrders.splice(activeIdx, 1);
  }

  return completedOrder;
};

// Seed de muestra si el historial está vacío para auditoría y rango de fechas
export const seedSampleSalesIfEmpty = () => {
  if (globalOrderHistory.length > 0) return;

  const now = new Date();
  const todayStr = now.toISOString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString();

  const sampleSales = [
    {
      id: 'ORD-971101',
      type: 'dine_in',
      tableId: 'T1',
      customerName: 'CARLOS MENDOZA',
      clientId: 'V-19823456',
      status: 'paid',
      total: 35.98,
      createdAt: todayStr,
      items: [
        { recipeId: 'REC-002', name: 'Plato Pollo Agridulce', qty: 2, price: 15.99, sentToKitchen: true },
        { recipeId: 'REC-009', name: 'Limonada', qty: 2, price: 2.00, sentToKitchen: true }
      ],
      payment: { method: 'Zelle', currency: 'USD', amount: 35.98, exchangeRate: 40.00, paidAt: todayStr }
    },
    {
      id: 'ORD-971102',
      type: 'dine_in',
      tableId: 'T3',
      customerName: 'MARIA FERNANDA ROJAS',
      clientId: 'V-24551982',
      status: 'paid',
      total: 19.99,
      createdAt: todayStr,
      items: [
        { recipeId: 'REC-004', name: 'Double Cheese Burger', qty: 1, price: 17.99, sentToKitchen: true },
        { recipeId: 'REC-008', name: 'Coca Cola Zero', qty: 1, price: 2.00, sentToKitchen: true }
      ],
      payment: { method: 'Pago Movil', currency: 'VES', amount: 799.60, exchangeRate: 40.00, paidAt: todayStr }
    },
    {
      id: 'ORD-971103',
      type: 'delivery',
      tableId: null,
      customerName: 'ALEJANDRO GUERRA',
      clientId: 'V-18774211',
      status: 'paid',
      total: 42.50,
      createdAt: todayStr,
      items: [
        { recipeId: 'REC-007', name: 'Ramen Especial', qty: 2, price: 18.25, sentToKitchen: true },
        { recipeId: 'REC-009', name: 'Limonada', qty: 3, price: 2.00, sentToKitchen: true }
      ],
      payment: { method: 'Efectivo', currency: 'USD', amount: 42.50, exchangeRate: 40.00, paidAt: todayStr }
    },
    {
      id: 'ORD-971104',
      type: 'pickup',
      tableId: null,
      customerName: 'JUAN VALDEZ',
      clientId: 'V-14223109',
      status: 'paid',
      total: 28.00,
      createdAt: yesterdayStr,
      items: [
        { recipeId: 'REC-006', name: 'Noodles Teriyaki', qty: 2, price: 12.50, sentToKitchen: true },
        { recipeId: 'REC-008', name: 'Coca Cola Zero', qty: 1, price: 3.00, sentToKitchen: true }
      ],
      payment: { method: 'POS', currency: 'VES', amount: 1120.00, exchangeRate: 40.00, paidAt: yesterdayStr }
    },
    {
      id: 'ORD-971105',
      type: 'dine_in',
      tableId: 'T5',
      customerName: 'DANIEL VILLASMIL',
      clientId: 'V-58748394',
      status: 'paid',
      total: 54.00,
      createdAt: twoDaysAgoStr,
      items: [
        { recipeId: 'REC-003', name: 'Original Burger', qty: 3, price: 16.00, sentToKitchen: true },
        { recipeId: 'REC-009', name: 'Limonada', qty: 3, price: 2.00, sentToKitchen: true }
      ],
      payment: { method: 'CxC', currency: 'CxC', amount: 54.00, exchangeRate: 40.00, paidAt: twoDaysAgoStr }
    }
  ];

  globalOrderHistory.push(...sampleSales);
};

seedSampleSalesIfEmpty();
`;

  content += "\n" + insertCode;
  fs.writeFileSync(path, content, 'utf8');
  console.log("mockDb updated with recordCompletedOrder and sample sales");
} else {
  console.log("recordCompletedOrder already exists");
}
