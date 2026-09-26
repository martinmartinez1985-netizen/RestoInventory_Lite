const fs = require('fs');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const persistenceLogic = `
import { Platform } from 'react-native';

const STORAGE_KEY = 'RESTOSYS_LITE_DB_V1';

export const persistData = () => {
  if (Platform.OS === 'web') {
    const snapshot = {
      globalDirectory, globalReceivables, globalPayables, globalBanks,
      globalRawMaterials, globalWip, globalFinishedGoods, globalRecipes,
      globalPurchases, globalWaste, globalShift, globalZReports,
      globalTables, globalActiveOrders, globalOrderHistory
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
    } catch (e) {}
  }
};

loadData();

// Hack global para guardar automaticamente (setInterval) en vez de modificar todas las funciones
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  setInterval(persistData, 3000); // Autoguardar cada 3 segundos
}
`;

if (!content.includes('persistData')) {
  content = content + '\\n' + persistenceLogic;
  fs.writeFileSync(dbPath, content);
  console.log("Persistence injected via setInterval hack.");
}
