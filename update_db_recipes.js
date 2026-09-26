const fs = require('fs');
let content = fs.readFileSync('src/store/mockDb.js', 'utf8');

const newData = `
// --- RECIPES & INVENTORY MODULE ---

export const globalIngredients = [
  { id: 'ING-001', name: 'Pollo Pechuga', baseType: 'weight', baseStock: 15000, baseCost: 0.005, minStock: 5000 }, // $5 per kg
  { id: 'ING-002', name: 'Salsa Soya', baseType: 'volume', baseStock: 10000, baseCost: 0.003, minStock: 2000 },
  { id: 'ING-003', name: 'Arroz Blanco', baseType: 'weight', baseStock: 50000, baseCost: 0.001, minStock: 10000 },
  { id: 'ING-004', name: 'Cebollín', baseType: 'weight', baseStock: 2000, baseCost: 0.002, minStock: 500 },
];

export const globalRecipes = [
  { 
    id: 'REC-001', 
    name: 'Pollo Agridulce', 
    category: 'Plato Principal',
    price: 15.00,
    ingredients: [
      { id: 'ING-001', amount: 250 }, // g
      { id: 'ING-002', amount: 30 }  // ml
    ]
  },
  { 
    id: 'REC-002', 
    name: 'Arroz Frito Especial', 
    category: 'Arroces',
    price: 12.00,
    ingredients: [
      { id: 'ING-003', amount: 300 }, // g
      { id: 'ING-001', amount: 100 }, // g
      { id: 'ING-004', amount: 20 },  // g
      { id: 'ING-002', amount: 45 }   // ml
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

export const updateIngredientStock = (id, baseAmountDelta, newBaseCost = null) => {
  const ing = globalIngredients.find(i => i.id === id);
  if (ing) {
    if (newBaseCost !== null && baseAmountDelta > 0) {
      // Weighted average cost calculation
      if (ing.baseStock + baseAmountDelta > 0) {
        const totalValue = (ing.baseStock * ing.baseCost) + (baseAmountDelta * newBaseCost);
        ing.baseCost = totalValue / (ing.baseStock + baseAmountDelta);
      }
    }
    ing.baseStock += baseAmountDelta;
  }
};
`;

content += newData;
fs.writeFileSync('src/store/mockDb.js', content);
