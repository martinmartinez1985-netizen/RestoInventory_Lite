const fs = require('fs');

const dbPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\store\\mockDb.js';
let content = fs.readFileSync(dbPath, 'utf8');

const newFinishedGoods = `,
  { id: 'FG-002', name: 'Original Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-003', name: 'Double Cheese Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-004', name: 'Spicy Burger', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-005', name: 'Noodles Teriyaki', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-006', name: 'Ramen Especial', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-007', name: 'Coca Cola Zero', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 },
  { id: 'FG-008', name: 'Limonada', baseType: 'unit', baseStock: 0, baseCost: 0, minStock: 10 }
];`;

content = content.replace(/\];\s*export const globalRecipes/g, newFinishedGoods + '\nexport const globalRecipes');

const newRecipes = `,
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
];`;

content = content.replace(/\];\s*export const globalPurchases/g, newRecipes + '\nexport const globalPurchases');

fs.writeFileSync(dbPath, content);
console.log("Mock data injected.");
