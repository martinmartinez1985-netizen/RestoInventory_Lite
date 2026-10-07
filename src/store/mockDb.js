import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
export const globalDirectory = [];

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

export const globalReceivables = [];

export const addReceivable = (transaction) => {
  globalReceivables.push(transaction); 
  persistData();
};

export const updateReceivable = (updatedTrx) => {
  const index = globalReceivables.findIndex(t => t.id === updatedTrx.id);
  if (index !== -1) {
    globalReceivables[index] = updatedTrx;
    persistData();
  }
};

export const globalPayables = [];

export const addPayable = (transaction) => {
  globalPayables.push(transaction); 
  persistData();
};

export const updatePayable = (updatedTrx) => {
  const index = globalPayables.findIndex(t => t.id === updatedTrx.id);
  if (index !== -1) {
    globalPayables[index] = updatedTrx;
    persistData();
  }
};

export const globalBanks = [];

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
    persistData();
  }
};


// --- RECIPES & 3-TIER INVENTORY MODULE ---

export const globalRawMaterials = [];
export const globalWip = [];
export const globalFinishedGoods = [];
export const globalRecipes = [];
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
  openingCash: 0.00,
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

// Puentes de sincronización en vivo hacia Supabase Cloud
export const pushOrderToCloud = (order) => {
  if (Platform.OS === 'web') {
    import('../services/supabaseService').then(({ supabaseService }) => {
      if (supabaseService && supabaseService.pushOrder) supabaseService.pushOrder(order);
    }).catch(() => {});
  }
};

export const pushTableToCloud = (table) => {
  if (Platform.OS === 'web') {
    import('../services/supabaseService').then(({ supabaseService }) => {
      if (supabaseService && supabaseService.pushTable) supabaseService.pushTable(table);
    }).catch(() => {});
  }
};

export const pushShiftToCloud = () => {
  if (Platform.OS === 'web') {
    import('../services/supabaseService').then(({ supabaseService }) => {
      if (supabaseService && supabaseService.pushShift) supabaseService.pushShift(globalShift);
    }).catch(() => {});
  }
};

export const pushZReportToCloud = (report) => {
  if (Platform.OS === 'web') {
    import('../services/supabaseService').then(({ supabaseService }) => {
      if (supabaseService && supabaseService.pushZReport) supabaseService.pushZReport(report);
    }).catch(() => {});
  }
};

export const pushExchangeRateToCloud = (rate) => {
  if (Platform.OS === 'web') {
    import('../services/supabaseService').then(({ supabaseService }) => {
      if (supabaseService && supabaseService.pushExchangeRate) supabaseService.pushExchangeRate(rate);
    }).catch(() => {});
  }
};

export const openShift = (cash = 0) => {
  globalShift.isOpen = true;
  globalShift.openingCash = Number(cash) || 0;
  globalShift.startTime = new Date().toISOString();
  globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
  persistData();
  pushShiftToCloud();
  return globalShift;
};

// Registrar venta en turno y sincronizar en vivo
export const registerShiftSale = (amount, method, currency) => {
  if (!globalShift.isOpen) return;
  
  if (globalShift.sales.usdCash === undefined) {
    globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
  }
  
  if (currency === 'USD') {
    if (method === 'Efectivo') globalShift.sales.usdCash += amount;
    else globalShift.sales.usdDigital += amount;
  } else if (currency === 'VES') {
    if (method === 'Efectivo') globalShift.sales.bsCash += amount;
    else globalShift.sales.bsDigital += amount;
  } else if (currency === 'CxC') {
    globalShift.sales.cxc += amount;
  }
  persistData();
  pushShiftToCloud();
};

export const closeShift = (actualCash, discrepancies) => {
  const actual = Number(actualCash || 0);
  const diff = typeof discrepancies === 'object' ? Number(discrepancies.cash || 0) : Number(discrepancies || 0);
  const totalSalesVal = (globalShift.sales?.usdCash || 0) + (globalShift.sales?.usdDigital || 0) + (globalShift.sales?.bsCash || 0) + (globalShift.sales?.bsDigital || 0);

  const report = {
    id: 'Z-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    expectedCash: (globalShift.openingCash || 0) + (globalShift.sales?.usdCash || 0),
    actualCash: actual,
    discrepancy: diff,
    totalSales: totalSalesVal
  };
  globalZReports.push(report);
  
  // Reset for next shift
  globalShift.isOpen = false;
  globalShift.openingCash = actual;
  globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
  
  persistData();
  pushZReportToCloud(report);
  pushShiftToCloud();
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
  persistData();
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

export const RATE_STORAGE_KEY = 'RESTOSYS_EXCHANGE_RATE_V1';

export const globalSettings = { 
  exchangeRate: (Platform.OS === 'web' && typeof localStorage !== 'undefined' && localStorage.getItem(RATE_STORAGE_KEY)) || '' 
};

let rateDebounceTimer = null;

export const updateExchangeRate = (rate) => {
  if (rate !== undefined && rate !== null) {
    const rateStr = rate.toString().trim();
    globalSettings.exchangeRate = rateStr;
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(RATE_STORAGE_KEY, rateStr);
      } catch (e) {}
    }
    persistData();

    // Notificar en vivo a toda la interfaz
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('RESTOSYS_RATE_CHANGED', { detail: rateStr }));
    }

    // Sincronizar hacia Supabase Nube con debounce para no saturar al escribir
    if (rateDebounceTimer) clearTimeout(rateDebounceTimer);
    rateDebounceTimer = setTimeout(() => {
      const parsed = parseFloat(rateStr);
      if (!isNaN(parsed) && parsed > 0) {
        pushExchangeRateToCloud(rateStr);
      }
    }, 400);
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
      // 1. Cargar la tasa desde su clave blindada independiente
      if (typeof localStorage !== 'undefined') {
        const isolatedRate = localStorage.getItem(RATE_STORAGE_KEY);
        if (isolatedRate) {
          globalSettings.exchangeRate = isolatedRate;
        }
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      // Respaldo secundario para la tasa
      if (saved && !globalSettings.exchangeRate) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.globalSettings && parsed.globalSettings.exchangeRate) {
            globalSettings.exchangeRate = parsed.globalSettings.exchangeRate.toString();
            try { localStorage.setItem(RATE_STORAGE_KEY, globalSettings.exchangeRate); } catch (e) {}
          }
        } catch (e) {}
      }

      const CLEAN_KEY = 'RESTO_CLEAN_SLATE_2026_ZERO_V1';
      if (typeof localStorage !== 'undefined' && !localStorage.getItem(CLEAN_KEY)) {
        localStorage.setItem(CLEAN_KEY, 'true');
        globalDirectory.length = 0;
        globalReceivables.length = 0;
        globalPayables.length = 0;
        globalBanks.length = 0;
        globalRawMaterials.length = 0;
        globalWip.length = 0;
        globalFinishedGoods.length = 0;
        globalRecipes.length = 0;
        globalPurchases.length = 0;
        globalWaste.length = 0;
        globalActiveOrders.length = 0;
        globalOrderHistory.length = 0;
        globalZReports.length = 0;
        globalTables.forEach(t => { t.status = 'free'; });
        globalShift.isOpen = false;
        globalShift.openingCash = 0;
        globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
        persistData();
        console.log("Sistema puesto en 0 exitosamente, Tasa de cambio preservada:", globalSettings.exchangeRate);
        return;
      }
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

// Auto-sincronización inicial con la nube Supabase al iniciar en Web
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      if (globalRecipes.length === 0) {
        const { supabaseService } = await import('../services/supabaseService');
        const count = await supabaseService.downloadRecipes();
        if (count > 0) {
          console.log(`☁️ ${count} platos sincronizados automáticamente desde Supabase Cloud.`);
        }
      }
    } catch (e) {
      console.log("Auto-sync inicial:", e.message);
    }
  }, 1000);
}

// Respaldo y transferencia manual de Menú
export const exportMenuJson = () => {
  return JSON.stringify(globalRecipes, null, 2);
};

export const importMenuFromJson = (jsonStr) => {
  try {
    const list = JSON.parse(jsonStr);
    if (!Array.isArray(list)) throw new Error("El formato debe ser una lista de platos válida.");
    let count = 0;
    list.forEach(item => {
      if (!item.name) return;
      const existingIdx = globalRecipes.findIndex(r => r.id === item.id || r.name.toLowerCase() === item.name.toLowerCase());
      const formatted = {
        id: item.id || `REC-${Date.now().toString().slice(-6)}`,
        name: item.name,
        category: item.category || 'Platos Principales',
        image: item.image || '',
        outputType: 'finished',
        outputId: item.outputId || `FG-${item.id}`,
        yieldAmount: 1,
        yieldUnit: 'unit',
        price: Number(item.price || item.salePrice || item.sale_price || 0),
        salePrice: Number(item.salePrice || item.price || item.sale_price || 0),
        cost: Number(item.cost || 0),
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : []
      };

      if (existingIdx !== -1) {
        globalRecipes[existingIdx] = { ...globalRecipes[existingIdx], ...formatted };
      } else {
        globalRecipes.push(formatted);
      }

      const fgExists = globalFinishedGoods.find(fg => fg.id === formatted.outputId || fg.name === formatted.name);
      if (!fgExists) {
        globalFinishedGoods.push({
          id: formatted.outputId,
          name: formatted.name,
          baseType: 'unit',
          baseStock: 0,
          baseCost: formatted.cost,
          minStock: 5
        });
      }
      count++;
    });
    persistData();
    return { success: true, count };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Autoguardado local y Sincronización en vivo constante con Supabase Cloud
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setInterval(persistData, 3000); // Autoguardar localmente cada 3 segundos

  // Sincronización en vivo con todas las PCs y dispositivos cada 3.5 segundos
  setInterval(async () => {
    try {
      const { supabaseService } = await import('../services/supabaseService');
      if (supabaseService && supabaseService.pullLiveSync) {
        await supabaseService.pullLiveSync();
      }
    } catch (e) {}
  }, 3500);
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

  // Liberar mesa si aplica y sincronizar
  if (order.type === 'dine_in' && order.tableId) {
    const table = globalTables.find(t => t.id === order.tableId);
    if (table) {
      table.status = 'free';
      pushTableToCloud(table);
    }
  }

  persistData();
  pushOrderToCloud(completedOrder);
  pushShiftToCloud();
  return completedOrder;
};

export const executeMasterWipe = (type, inputPin) => {
  if (inputPin !== globalMasterConfig.masterPin) {
    throw new Error("Clave Maestra incorrecta. Acceso denegado.");
  }

  if (type === 'sales') {
    // Reiniciar ventas, órdenes activas, turnos y arqueos a 0
    globalActiveOrders.length = 0;
    globalOrderHistory.length = 0;
    globalZReports.length = 0;
    globalTables.forEach(t => { t.status = 'free'; });
    globalShift.isOpen = false;
    globalShift.openedAt = null;
    globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
    globalShift.expectedCash = 0;
    persistData();
    return { success: true, message: "Ventas, comandas y arqueos de caja reiniciados con éxito a cero (0)." };
  }

  if (type === 'factory') {
    // Borrado total a 0 de todo el sistema (listo para producción real)
    globalDirectory.length = 0;
    globalReceivables.length = 0;
    globalPayables.length = 0;
    globalBanks.length = 0;
    globalRawMaterials.length = 0;
    globalWip.length = 0;
    globalFinishedGoods.length = 0;
    globalRecipes.length = 0;
    globalPurchases.length = 0;
    globalWaste.length = 0;
    globalActiveOrders.length = 0;
    globalOrderHistory.length = 0;
    globalZReports.length = 0;
    globalTables.forEach(t => { t.status = 'free'; });
    globalShift.isOpen = false;
    globalShift.openingCash = 0;
    globalShift.sales = { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 };
    globalShift.expectedCash = 0;
    persistData();
    setTimeout(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 500);
    return { success: true, message: "Sistema reseteado a CERO en todos los módulos (listo para cargar datos reales)." };
  }

  throw new Error("Tipo de borrado no reconocido.");
};

