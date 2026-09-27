import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
export const globalDirectory = [
  // Clientes
  { id: '1', name: 'DANIEL VILLASMIL', docId: 'V-58748394', email: 'Sin correo', phone: '04146183019', address: 'SECTOR PANAMERICANO', type: 'Clientes' },
  { id: '2', name: 'AMRO FAUZET HOMMAID', docId: 'E-84613570', email: 'Sin correo', phone: 'Sin teléfono', address: 'VALENCIA', type: 'Clientes' },
  
  // Proveedores
  { id: '3', name: 'DISTRIBUIDORA DE LICORES S.A.', docId: 'J-123456789', email: 'ventas@licores.com', phone: '0212-5551234', address: 'ZONA INDUSTRIAL 1', type: 'Proveedores' },
  { id: '4', name: 'CARNES PREMIUM EL RANCHO', docId: 'J-987654321', email: 'pedidos@elrancho.com', phone: '0414-9998877', address: 'MERCADO MAYORISTA', type: 'Proveedores' },
  
  // Intercompañías
  { id: '5', name: 'INVERSIONES ABC C.A.', docId: 'J-111222333', email: 'finanzas@invabc.com', phone: '0212-3334455', address: 'TORRE EMPRESARIAL', type: 'Intercompañías' },
  
  // Accionistas
  { id: '6', name: 'CARLOS MAYOR', docId: 'V-25481632', email: 'Sin correo', phone: '0412-1126593', address: 'Sin dirección', type: 'Accionistas' },
  
  // Empleados
  { id: '7', name: 'MARIA GARCIA (MESERA)', docId: 'V-19887766', email: 'maria.g@restosys.com', phone: '0414-5556677', address: 'AV 5 DE JULIO', type: 'Empleados / Colaboradores' },
];

export const addContactToGlobal = (contact) => {
  globalDirectory.unshift(contact);
  persistData();
};

export const updateContactInGlobal = (contact) => {
  const index = globalDirectory.findIndex(c => c.id === contact.id);
  if (index !== -1) {
    globalDirectory[index] = contact;
    persistData();
  }
};

export const globalReceivables = [
  { id: 'REC-101', clientId: '1', clientName: 'DANIEL VILLASMIL', date: '2026-08-20', concept: 'Factura inicial', debit: 45.00, credit: 0 },
  { id: 'PAY-101', clientId: '1', clientName: 'DANIEL VILLASMIL', date: '2026-08-21', concept: 'Abono Zelle', debit: 0, credit: 20.00 },
  { id: 'REC-102', clientId: '5', clientName: 'INVERSIONES ABC C.A.', date: '2026-08-21', concept: 'Factura servicios', debit: 120.50, credit: 0 }
];

export const addReceivable = (transaction) => {
  globalReceivables.push(transaction); 
};

export const updateReceivable = (updatedTrx) => {
  const index = globalReceivables.findIndex(t => t.id === updatedTrx.id);
  if (index !== -1) {
    globalReceivables[index] = updatedTrx;
  }
};

export const globalPayables = [
  { id: 'CXC-201', clientId: '3', clientName: 'DISTRIBUIDORA DE LICORES S.A.', date: '2026-08-15', concept: 'Factura de licores #8892', debit: 0, credit: 350.00 },
  { id: 'PAY-201', clientId: '3', clientName: 'DISTRIBUIDORA DE LICORES S.A.', date: '2026-08-18', concept: 'Abono Transferencia Banesco', debit: 150.00, credit: 0 },
];

export const addPayable = (transaction) => {
  globalPayables.push(transaction); 
};

export const updatePayable = (updatedTrx) => {
  const index = globalPayables.findIndex(t => t.id === updatedTrx.id);
  if (index !== -1) {
    globalPayables[index] = updatedTrx;
  }
};

export const globalBanks = [
  { id: '1', name: 'BANCO DE VENEZUELA', code: '0102', usd: 0.00, bs: 0.00, type: 'Corriente Bs', isOverdraft: false },
  { id: '2', name: 'CAJA IVA', code: '0155', usd: 536.00, bs: null, type: 'Corriente USD', isOverdraft: false },
  { id: '3', name: 'CAJA PRINCIPAL', code: '0134', usd: 1796.75, bs: null, type: 'Corriente USD', isOverdraft: false },
  { id: '4', name: 'BANESCO', code: '0134', usd: -91.88, bs: -10197.81, type: 'Corriente Bs (Sobregiro)', isOverdraft: true },
  { id: '5', name: 'BANESCO PANAMA', code: '0134', usd: 156.72, bs: null, type: 'Corriente USD', isOverdraft: false },
  { id: '6', name: 'GASTO REEMBOLSABLE', code: '', usd: 0.00, bs: null, type: 'Corriente USD', isOverdraft: false },
  { id: '7', name: 'BANCO BINANCE', code: '0431', usd: 52.39, bs: null, type: 'Corriente USD', isOverdraft: false },
  { id: '8', name: 'CAJA CHICA', code: '0134', usd: 5.00, bs: null, type: 'Corriente USD', isOverdraft: false },
];

export const updateBankBalance = (bankId, amountUSD, amountBS) => {
  const bank = globalBanks.find(b => b.id === bankId);
  if (bank) {
    bank.usd += parseFloat(amountUSD || 0);
    if (bank.bs !== null && amountBS) {
      bank.bs += parseFloat(amountBS || 0);
    }
    // Update overdraft status
    bank.isOverdraft = bank.usd < 0 || (bank.bs !== null && bank.bs < 0);
    if (bank.isOverdraft && !bank.type.includes('Sobregiro')) {
      bank.type = bank.type + ' (Sobregiro)';
    } else if (!bank.isOverdraft && bank.type.includes('Sobregiro')) {
      bank.type = bank.type.replace(' (Sobregiro)', '');
    }
  }
};


// --- RECIPES & 3-TIER INVENTORY MODULE ---

export const globalRawMaterials = [
  { id: 'RAW-001', name: 'Pollo Pechuga', baseType: 'weight', baseStock: 15000, baseCost: 0.005, minStock: 5000 },
  { id: 'RAW-002', name: 'Salsa Soya', baseType: 'volume', baseStock: 10000, baseCost: 0.003, minStock: 2000 },
  { id: 'RAW-003', name: 'Arroz Blanco', baseType: 'weight', baseStock: 50000, baseCost: 0.001, minStock: 10000 },
  { id: 'RAW-004', name: 'Cebollín', baseType: 'weight', baseStock: 2000, baseCost: 0.002, minStock: 500 },
];

export const globalWip = [
  { id: 'WIP-001', name: 'Salsa Agridulce Base', baseType: 'volume', baseStock: 0, baseCost: 0, minStock: 1000 }
];

export const globalFinishedGoods = [
  { id: 'FG-001', name: 'Pollo Agridulce Especial', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 }
,
  { id: 'FG-002', name: 'Original Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-003', name: 'Double Cheese Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-004', name: 'Spicy Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-005', name: 'Noodles Teriyaki', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-006', name: 'Ramen Especial', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-007', name: 'Coca Cola Zero', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-008', name: 'Limonada', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 }
];
export const globalRecipes = [
  { 
    id: 'REC-001', 
    name: 'Producir Salsa Agridulce', 
    category: 'Preparaciones',
    outputType: 'wip',
    outputId: 'WIP-001',
    yieldAmount: 1000,
    yieldUnit: 'ml',
    ingredients: [
      { id: 'RAW-002', amount: 200 },
      { id: 'RAW-004', amount: 50 }
    ]
  },
  { 
    id: 'REC-002', 
    name: 'Plato Pollo Agridulce', 
    category: 'Platos Principales',
    outputType: 'finished',
    outputId: 'FG-001',
    yieldAmount: 1,
    yieldUnit: 'unit',
    ingredients: [
      { id: 'RAW-001', amount: 250 },
      { id: 'WIP-001', amount: 100 }
    ]
  }
,
  { 
    id: 'REC-003', name: 'Original Burger', category: 'Burger', outputType: 'finished', outputId: 'FG-002', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: [{ id: 'RAW-001', amount: 150 }]
  },
  { 
    id: 'REC-004', name: 'Double Cheese Burger', category: 'Burger', outputType: 'finished', outputId: 'FG-003', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: [{ id: 'RAW-001', amount: 300 }]
  },
  { 
    id: 'REC-005', name: 'Spicy Burger', category: 'Burger', outputType: 'finished', outputId: 'FG-004', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: [{ id: 'RAW-001', amount: 150 }]
  },
  { 
    id: 'REC-006', name: 'Noodles Teriyaki', category: 'Noodles', outputType: 'finished', outputId: 'FG-005', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: [{ id: 'RAW-002', amount: 50 }]
  },
  { 
    id: 'REC-007', name: 'Ramen Especial', category: 'Noodles', outputType: 'finished', outputId: 'FG-006', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: [{ id: 'RAW-002', amount: 100 }, { id: 'RAW-004', amount: 20 }]
  },
  { 
    id: 'REC-008', name: 'Coca Cola Zero', category: 'Drinks', outputType: 'finished', outputId: 'FG-007', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: []
  },
  { 
    id: 'REC-009', name: 'Limonada', category: 'Drinks', outputType: 'finished', outputId: 'FG-008', yieldAmount: 1, yieldUnit: 'unit',
    ingredients: []
  }
];
export const globalPurchases = [];
export const globalWaste = [];

export const addPurchase = (purchase) => {
  globalPurchases.push(purchase);
};

export const addWaste = (waste) => {
  globalWaste.push(waste);
};

export const updateStock = (id, baseAmountDelta, newBaseCost = null) => {
  const arrays = [globalRawMaterials, globalWip, globalFinishedGoods];
  for (const arr of arrays) {
    const item = arr.find(i => i.id === id);
    if (item) {
      if (newBaseCost !== null && baseAmountDelta > 0) {
        if (item.baseStock + baseAmountDelta > 0) {
          const totalValue = (item.baseStock * item.baseCost) + (baseAmountDelta * newBaseCost);
          item.baseCost = totalValue / (item.baseStock + baseAmountDelta);
        }
      }
      item.baseStock += baseAmountDelta;
      return true;
    }
  }
  return false;
};

export const processProductionBatch = (recipeId, multiplier = 1) => {
  const recipe = globalRecipes.find(r => r.id === recipeId);
  if (!recipe) {
    console.warn("Receta no encontrada");
    return;
  }

  let totalBatchCost = 0;

  recipe.ingredients.forEach(ingReq => {
    const requiredAmount = ingReq.amount * multiplier;
    let item = globalRawMaterials.find(i => i.id === ingReq.id) || globalWip.find(i => i.id === ingReq.id);
    
    if (!item) {
      console.warn("Ingrediente no encontrado: " + ingReq.id);
      return; // Skip this ingredient
    }
    
    if (item.baseStock < requiredAmount) {
      console.warn("Stock insuficiente de " + item.name + ". El inventario quedará en negativo.");
    }

    totalBatchCost += (requiredAmount * item.baseCost);
    item.baseStock -= requiredAmount;
  });

  const outputAmount = recipe.yieldAmount * multiplier;
  const costPerOutputUnit = totalBatchCost / outputAmount;

  updateStock(recipe.outputId, outputAmount, costPerOutputUnit);
  
  return { success: true, totalCost: totalBatchCost, outputAmount, costPerUnit: costPerOutputUnit };
};

// --- SHIFT & CASH CLOSURE MODULE ---

export const globalShift = {
  isOpen: true,
  openingCash: 100.00,
  startTime: new Date().toISOString(),
  sales: {
    usdCash: 0,
    usdDigital: 0,
    bsCash: 0,
    bsDigital: 0,
    cxc: 0 // Créditos
  },
  cashOuts: [] // Para los retiros de caja chica futuros
};

export const globalZReports = [];

// Mock function to register a sale
export const registerShiftSale = (amount, method, currency) => {
  if (!globalShift.isOpen) return;
  
  // Migración segura si viene de localStorage viejo
  if (globalShift.sales.usdCash === undefined) {
    globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
  }
  
  if (currency === 'USD') {
    if (method === 'Efectivo') globalShift.sales.usdCash += amount;
    else globalShift.sales.usdDigital += amount; // Zelle, Binance, Otro
  } else if (currency === 'VES') {
    if (method === 'Efectivo') globalShift.sales.bsCash += amount;
    else globalShift.sales.bsDigital += amount; // Pago Movil, Transferencia, POS
  } else if (currency === 'CxC') {
    globalShift.sales.cxc += amount;
  }
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

// --- RESTAURANT POS MODULE ---

export const globalTables = Array.from({ length: 12 }, (_, i) => ({
  id: `T${i + 1}`,
  name: `Mesa ${i + 1}`,
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

export const addRawMaterial = (ing) => {
  const item = {
    id: ing.id || ('RAW-' + Date.now().toString().slice(-4)),
    baseStock: ing.baseStock !== undefined ? parseFloat(ing.baseStock) : 0,
    ...ing
  };
  globalRawMaterials.push(item);
  persistData();
  return item;
};

export const updateRawMaterial = (id, updatedFields) => {
  const item = globalRawMaterials.find(i => i.id === id);
  if (item) {
    Object.assign(item, updatedFields);
    persistData();
    return item;
  }
  return null;
};

export const deleteRawMaterial = (id) => {
  const idx = globalRawMaterials.findIndex(i => i.id === id);
  if (idx !== -1) {
    globalRawMaterials.splice(idx, 1);
    persistData();
    return true;
  }
  return false;
};

export const addFinishedGood = (item, recipeInfo = {}) => {
  const fgId = item.id || ('FG-' + Date.now().toString().slice(-6));
  const newItem = {
    id: fgId,
    name: (item.name || '').trim(),
    baseType: item.baseType || 'unit',
    baseUnit: item.baseUnit || 'Unidades',
    baseStock: item.baseStock !== undefined ? parseFloat(item.baseStock) || 0 : 0,
    baseCost: item.baseCost !== undefined ? parseFloat(item.baseCost) || 0 : 0,
    minStock: item.minStock !== undefined ? parseFloat(item.minStock) || 10 : 10,
    isDirectSale: item.isDirectSale !== undefined ? item.isDirectSale : true
  };
  globalFinishedGoods.push(newItem);

  // Sync / create associated Recipe in globalRecipes for POS
  const existingRecipe = globalRecipes.find(r => r.outputId === fgId);
  if (!existingRecipe) {
    const recId = 'REC-' + Date.now().toString().slice(-6);
    globalRecipes.push({
      id: recId,
      name: newItem.name,
      outputId: fgId,
      outputType: 'finished',
      yieldAmount: 1,
      yieldUnit: 'Unidades',
      ingredients: [], // Direct sale: no raw materials required
      category: recipeInfo.category || 'Bebidas',
      price: parseFloat(recipeInfo.price) || 0,
      image: recipeInfo.image || 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=300&q=80'
    });
  } else {
    existingRecipe.name = newItem.name;
    if (recipeInfo.price !== undefined) existingRecipe.price = parseFloat(recipeInfo.price) || 0;
    if (recipeInfo.category) existingRecipe.category = recipeInfo.category;
  }

  persistData();
  return newItem;
};

export const updateFinishedGood = (id, updatedFields, recipeUpdates = {}) => {
  const item = globalFinishedGoods.find(i => i.id === id);
  if (item) {
    if (updatedFields.name !== undefined) item.name = updatedFields.name.trim();
    if (updatedFields.baseStock !== undefined) item.baseStock = parseFloat(updatedFields.baseStock) || 0;
    if (updatedFields.minStock !== undefined) item.minStock = parseFloat(updatedFields.minStock) || 0;
    if (updatedFields.baseCost !== undefined) item.baseCost = parseFloat(updatedFields.baseCost) || 0;
    if (updatedFields.baseUnit !== undefined) item.baseUnit = updatedFields.baseUnit;
    if (updatedFields.baseType !== undefined) item.baseType = updatedFields.baseType;
    if (updatedFields.isDirectSale !== undefined) item.isDirectSale = updatedFields.isDirectSale;

    // Also update associated Recipe if exists
    const recipe = globalRecipes.find(r => r.outputId === id);
    if (recipe) {
      if (updatedFields.name) recipe.name = updatedFields.name.trim();
      if (recipeUpdates.price !== undefined) recipe.price = parseFloat(recipeUpdates.price) || 0;
      if (recipeUpdates.category) recipe.category = recipeUpdates.category;
    }

    persistData();
    return item;
  }
  return null;
};

export const deleteFinishedGood = (id) => {
  const idx = globalFinishedGoods.findIndex(i => i.id === id);
  if (idx !== -1) {
    globalFinishedGoods.splice(idx, 1);

    // Also delete associated recipe if it's direct sale (no raw ingredients)
    const recIdx = globalRecipes.findIndex(r => r.outputId === id && (!r.ingredients || r.ingredients.length === 0));
    if (recIdx !== -1) {
      globalRecipes.splice(recIdx, 1);
    }

    persistData();
    return true;
  }
  return false;
};

export const syncFromCloud = async () => {
  try {
    const { data: materials } = await supabase.from('raw_materials').select('*', 500);
    if (materials && Array.isArray(materials) && materials.length > 0) {
      materials.forEach(cloudItem => {
        const localIdx = globalRawMaterials.findIndex(m => m.id === cloudItem.id);
        if (localIdx !== -1) {
          globalRawMaterials[localIdx] = { ...globalRawMaterials[localIdx], ...cloudItem };
        } else {
          globalRawMaterials.push(cloudItem);
        }
      });
    }

    const { data: cloudOrders } = await supabase.from('orders').select('*', 50);
    if (cloudOrders && Array.isArray(cloudOrders) && cloudOrders.length > 0) {
      cloudOrders.forEach(co => {
        let parsedItems = co.items;
        if (typeof parsedItems === 'string') {
          try { parsedItems = JSON.parse(parsedItems); } catch (e) {}
        }
        const formatted = { ...co, items: parsedItems };
        const localIdx = globalActiveOrders.findIndex(o => o.id === co.id);
        if (localIdx !== -1) {
          globalActiveOrders[localIdx] = formatted;
        } else if (co.status !== 'paid') {
          globalActiveOrders.push(formatted);
        }
      });
    }
    persistData();
  } catch (err) {
    console.log("Cloud sync note:", err);
  }
};


// ==========================================
// USUARIOS, ROLES Y SEGURIDAD MAESTRA
// ==========================================
export const DEFAULT_PERMISSIONS = {
  owner: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings'],
  admin: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings'],
  cashier: ['Billing', 'Kitchen', 'DailySales', 'CashClose', 'Contacts'],
  cook: ['Kitchen', 'Recipes']
};

export const ALL_MODULE_KEYS = [
  { key: 'Billing', label: 'Facturación (Mesas / POS)', icon: 'calculator' },
  { key: 'Kitchen', label: 'Cocina (KDS)', icon: 'fire' },
  { key: 'DailySales', label: 'Ventas Diarias', icon: 'chart-box-outline' },
  { key: 'CashClose', label: 'Caja y Cierres', icon: 'cash-register' },
  { key: 'InventoryHub', label: 'Inventarios y Almacenes', icon: 'warehouse' },
  { key: 'Recipes', label: 'Recetas y Costeo', icon: 'pot-mix' },
  { key: 'Contacts', label: 'Contactos y Clientes', icon: 'card-account-details-outline' },
  { key: 'Receivables', label: 'Cuentas por Cobrar (CxC)', icon: 'account-multiple-outline' },
  { key: 'Payables', label: 'Cuentas por Pagar (CxP)', icon: 'office-building-outline' },
  { key: 'Settings', label: 'Configuración y Usuarios', icon: 'cog-outline' }
];

export const getUserPermissions = (user) => {
  if (!user) return ALL_MODULE_KEYS.map(m => m.key);
  // El Dueño siempre tiene acceso total garantizado e inmutable a los 10 módulos
  if (user.role === 'owner') {
    return ALL_MODULE_KEYS.map(m => m.key);
  }
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  return DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.cashier;
};

export const globalUsers = [
  { 
    id: 'usr-owner', 
    name: 'Sistema', 
    username: 'sistema', 
    pin: '1234', 
    role: 'owner',
    permissions: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings']
  },
  { 
    id: 'usr-admin', 
    name: 'Administrador / Gerente', 
    username: 'admin', 
    pin: '2026', 
    role: 'admin',
    permissions: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings']
  },
  { 
    id: 'usr-2', 
    name: 'Cajero de Turno', 
    username: 'cajero', 
    pin: '0000', 
    role: 'cashier',
    permissions: ['Billing', 'Kitchen', 'DailySales', 'CashClose', 'Contacts']
  },
  { 
    id: 'usr-3', 
    name: 'Cocinero / Chef', 
    username: 'cocina', 
    pin: '1111', 
    role: 'cook',
    permissions: ['Kitchen', 'Recipes']
  },
];

export const globalCurrentUser = { 
  id: 'usr-owner', 
  name: 'Sistema', 
  username: 'sistema', 
  role: 'owner',
  permissions: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings']
};

export const globalMasterConfig = { masterPin: 'ZHEN2026' };

export const addUser = (user) => {
  const role = user.role || 'cashier';
  const newUser = {
    id: 'usr-' + Date.now().toString().slice(-4),
    name: user.name.trim(),
    username: user.username.trim().toLowerCase(),
    pin: user.pin.trim(),
    role: role,
    permissions: user.permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.cashier
  };
  globalUsers.push(newUser);
  persistData();
  return newUser;
};

export const updateUser = (updated) => {
  const idx = globalUsers.findIndex(u => u.id === updated.id);
  if (idx !== -1) {
    globalUsers[idx] = { ...globalUsers[idx], ...updated };
    if (globalCurrentUser.id === updated.id) {
      Object.assign(globalCurrentUser, globalUsers[idx]);
    }
    persistData();
    return globalUsers[idx];
  }
  return null;
};

export const deleteUser = (userId) => {
  if (globalUsers.length <= 1) throw new Error("Debe existir al menos un usuario en el sistema.");
  if (globalCurrentUser.id === userId) throw new Error("No puede eliminar el usuario con la sesión activa.");
  const target = globalUsers.find(u => u.id === userId);
  if (target && target.role === 'owner') throw new Error("El perfil del Dueño no puede ser eliminado.");
  const idx = globalUsers.findIndex(u => u.id === userId);
  if (idx !== -1) {
    globalUsers.splice(idx, 1);
    persistData();
  }
};

export const setCurrentUser = (userId) => {
  const user = globalUsers.find(u => u.id === userId);
  if (user) {
    Object.assign(globalCurrentUser, user);
    persistData();
  }
  return globalCurrentUser;
};

export const updateMasterPin = (currentPin, newPin) => {
  if (currentPin !== globalMasterConfig.masterPin) {
    throw new Error("La Clave Maestra actual es incorrecta.");
  }
  if (!newPin || newPin.trim().length < 4) {
    throw new Error("La nueva clave debe tener al menos 4 caracteres.");
  }
  globalMasterConfig.masterPin = newPin.trim();
  persistData();
};

export const globalSettings = { exchangeRate: '40.00' };

export const updateExchangeRate = (rate) => {
  if (rate !== undefined && rate !== null) {
    globalSettings.exchangeRate = rate.toString();
    persistData();
  }
};

const STORAGE_KEY = 'RESTOSYS_LITE_DB_V1';

export const persistData = () => {
  if (Platform.OS === 'web') {
    const snapshot = {
      globalDirectory, globalReceivables, globalPayables, globalBanks,
      globalRawMaterials, globalWip, globalFinishedGoods, globalRecipes,
      globalPurchases, globalWaste, globalShift, globalZReports,
      globalTables, globalActiveOrders, globalOrderHistory,
      globalUsers, globalCurrentUser, globalMasterConfig,
      globalSettings
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      console.log("Data guardada");
    } catch (e) {}
  }
};

export const loadData = () => {
  if (Platform.OS === 'web') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.globalSettings && parsed.globalSettings.exchangeRate) {
          globalSettings.exchangeRate = parsed.globalSettings.exchangeRate.toString();
        }
        if (parsed.globalDirectory) { globalDirectory.length = 0; globalDirectory.push(...parsed.globalDirectory); }
        if (parsed.globalReceivables) { globalReceivables.length = 0; globalReceivables.push(...parsed.globalReceivables); }
        if (parsed.globalPayables) { globalPayables.length = 0; globalPayables.push(...parsed.globalPayables); }
        if (parsed.globalBanks) { globalBanks.length = 0; globalBanks.push(...parsed.globalBanks); }
        if (parsed.globalRawMaterials) { globalRawMaterials.length = 0; globalRawMaterials.push(...parsed.globalRawMaterials); }
        if (parsed.globalWip) { globalWip.length = 0; globalWip.push(...parsed.globalWip); }
        if (parsed.globalFinishedGoods) { globalFinishedGoods.length = 0; globalFinishedGoods.push(...parsed.globalFinishedGoods); }
        if (parsed.globalRecipes) { globalRecipes.length = 0; globalRecipes.push(...parsed.globalRecipes); }
        if (parsed.globalPurchases) { globalPurchases.length = 0; globalPurchases.push(...parsed.globalPurchases); }
        if (parsed.globalWaste) { globalWaste.length = 0; globalWaste.push(...parsed.globalWaste); }
        if (parsed.globalShift) { Object.assign(globalShift, parsed.globalShift); }
        if (parsed.globalZReports) { globalZReports.length = 0; globalZReports.push(...parsed.globalZReports); }
        if (parsed.globalTables) { globalTables.length = 0; globalTables.push(...parsed.globalTables); }
        if (parsed.globalActiveOrders) { globalActiveOrders.length = 0; globalActiveOrders.push(...parsed.globalActiveOrders); }
        if (parsed.globalOrderHistory) { globalOrderHistory.length = 0; globalOrderHistory.push(...parsed.globalOrderHistory); }
        if (parsed.globalUsers && parsed.globalUsers.length > 0) { 
          globalUsers.length = 0; 
          parsed.globalUsers.forEach(u => {
            if (!u.permissions) {
              u.permissions = DEFAULT_PERMISSIONS[u.role] || DEFAULT_PERMISSIONS.cashier;
            }
          });
          globalUsers.push(...parsed.globalUsers); 

          // Garantizar que existan tanto Sistema (Dueño del software) como el Administrador
          const ownerUser = globalUsers.find(u => u.role === 'owner' || u.id === 'usr-owner');
          if (ownerUser) {
            ownerUser.name = 'Sistema';
            ownerUser.username = 'sistema';
          } else {
            globalUsers.unshift({
              id: 'usr-owner',
              name: 'Sistema',
              username: 'sistema',
              pin: '1234',
              role: 'owner',
              permissions: ALL_MODULE_KEYS.map(m => m.key)
            });
          }

          const hasAdmin = globalUsers.some(u => u.role === 'admin' || u.id === 'usr-admin');
          if (!hasAdmin) {
            globalUsers.splice(1, 0, {
              id: 'usr-admin',
              name: 'Administrador / Gerente',
              username: 'admin',
              pin: '2026',
              role: 'admin',
              permissions: ALL_MODULE_KEYS.map(m => m.key)
            });
          }
        }
        if (parsed.globalCurrentUser) { 
          if (!parsed.globalCurrentUser.permissions) {
            parsed.globalCurrentUser.permissions = DEFAULT_PERMISSIONS[parsed.globalCurrentUser.role] || DEFAULT_PERMISSIONS.admin;
          }
          if (parsed.globalCurrentUser.role === 'owner') {
            parsed.globalCurrentUser.name = 'Sistema';
            parsed.globalCurrentUser.username = 'sistema';
          }
          Object.assign(globalCurrentUser, parsed.globalCurrentUser); 
        }
        if (parsed.globalMasterConfig) { Object.assign(globalMasterConfig, parsed.globalMasterConfig); }
        console.log("Data restaurada desde LocalStorage");
      }
    } catch (e) {}
  }
};

loadData();

// Hack global para guardar automaticamente (setInterval) en vez de modificar todas las funciones
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setInterval(persistData, 3000); // Autoguardar cada 3 segundos
}

export const recordCompletedOrder = (order, paymentInfo = {}) => {
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

export const executeMasterWipe = (type, inputPin) => {
  if (inputPin !== globalMasterConfig.masterPin) {
    throw new Error("Clave Maestra incorrecta. Acceso denegado.");
  }

  if (type === 'sales') {
    // Reiniciar ventas, órdenes activas, turnos y arqueos
    globalActiveOrders.length = 0;
    globalOrderHistory.length = 0;
    globalZReports.length = 0;
    globalTables.forEach(t => { t.status = 'free'; });
    globalShift.isOpen = false;
    globalShift.openedAt = null;
    globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
    globalShift.expectedCash = 0;
    persistData();
    return { success: true, message: "Ventas, comandas y arqueos de caja reiniciados con éxito." };
  }

  if (type === 'factory') {
    // Borrado total de fábrica
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.reload();
      }, 500);
    }
    return { success: true, message: "Sistema reiniciado a valores de fábrica." };
  }

  throw new Error("Tipo de borrado no reconocido.");
};
