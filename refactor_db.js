const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const cutoff = content.indexOf('// --- RECIPES & INVENTORY MODULE ---');
if (cutoff !== -1) {
  content = content.substring(0, cutoff);
}

const newDbLogic = `
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
  if (!recipe) throw new Error("Receta no encontrada");

  let totalBatchCost = 0;

  for (const ingReq of recipe.ingredients) {
    const requiredAmount = ingReq.amount * multiplier;
    let item = globalRawMaterials.find(i => i.id === ingReq.id) || globalWip.find(i => i.id === ingReq.id);
    
    if (!item) throw new Error("Ingrediente no encontrado: " + ingReq.id);
    if (item.baseStock < requiredAmount) {
      throw new Error("Stock insuficiente de " + item.name + ". Faltan: " + (requiredAmount - item.baseStock));
    }

    totalBatchCost += (requiredAmount * item.baseCost);
    item.baseStock -= requiredAmount;
  }

  const outputAmount = recipe.yieldAmount * multiplier;
  const costPerOutputUnit = totalBatchCost / outputAmount;

  updateStock(recipe.outputId, outputAmount, costPerOutputUnit);
  
  return { success: true, totalCost: totalBatchCost, outputAmount, costPerUnit: costPerOutputUnit };
};
`;

content += newDbLogic;
fs.writeFileSync(dbPath, content);
console.log("mockDb refactored for 3-tier inventory");
