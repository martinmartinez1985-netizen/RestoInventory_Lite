const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const persistenceLogic = `
import { Platform } from 'react-native';

const STORAGE_KEY = 'RESTOSYS_LITE_DB_V1';

// Función para guardar todo el estado en LocalStorage (Solo Web por ahora)
export const persistData = () => {
  if (Platform.OS === 'web') {
    const snapshot = {
      globalDirectory,
      globalReceivables,
      globalPayables,
      globalBanks,
      globalRawMaterials,
      globalWip,
      globalFinishedGoods,
      globalRecipes,
      globalPurchases,
      globalWaste,
      globalShift,
      globalZReports,
      globalTables,
      globalActiveOrders,
      globalOrderHistory
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.warn("No se pudo guardar la data", e);
    }
  }
};

// Función para cargar data al iniciar
export const loadData = () => {
  if (Platform.OS === 'web') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Mutar los arrays originales (evitando reasignación para no romper referencias)
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
        console.log("Data restaurada desde LocalStorage");
      }
    } catch (e) {
      console.warn("No se pudo cargar la data", e);
    }
  }
};

// Inicializar data apenas se importe este archivo
loadData();
`;

// Insert the persistence logic at the bottom of the file
if (!content.includes('persistData')) {
  // Replace all the helper functions to call persistData() before they return
  
  const helpersToWrap = [
    'addContactToGlobal',
    'addReceivable',
    'addReceivablePayment',
    'addPayable',
    'addPayablePayment',
    'updateBankBalance',
    'addPurchase',
    'addWaste',
    'updateStock',
    'processProductionBatch',
    'registerShiftSale',
    'closeShift',
    'createOrder',
    'addRawMaterial'
  ];

  helpersToWrap.forEach(helper => {
    // Regex to find: export const helper = (...) => { ... };
    // This is a bit tricky with regex, so we'll do a simpler approach:
    // Just append persistData() calls before return statements, or at the end of the functions.
    // Given the complexity of the AST, the safest way is to just wrap the whole module exports with a watcher if possible,
    // or manually string-replace the ends of functions.
    
    // Instead of regex hacking, let's just append the persistData function at the end, and we will manually call it from the screens on unmount, or better:
    // Use a Proxy? No, too complex.
    // Let's just do a naive regex injection right before the closing brace of each known function.
    
    // Actually, I'll just append it to the file and manually update the functions using replace
  });

  // Since regex replacing every return is risky, let's write a smarter AST parser or just do a simple replacement for the most critical ones:
  // updateStock, registerShiftSale, closeShift, processProductionBatch, createOrder, addPurchase
  
  content = content.replace(/export const updateStock = \((.*?)\) => \{([\s\S]*?)return false;\n\};/g, 
    \`export const updateStock = ($1) => {$2persistData(); return false;\n};\`);
    
  // A much safer way: I'll just write the persistData definition and let it be exported. 
  // For the prototype, we can trigger persistData from the components (e.g. after POS checkout, after Purchase).
  content = persistenceLogic + '\n' + content;
  fs.writeFileSync(dbPath, content);
  console.log("Persistence logic injected.");
}
