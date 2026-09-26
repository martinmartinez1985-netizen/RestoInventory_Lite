const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the hardcoded image with a dynamic one based on category
const imgLogic = `
  const getImageForCategory = (category) => {
    if (category === 'Burger') return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80';
    if (category === 'Noodles') return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=300&q=80';
    if (category === 'Drinks') return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80';
    return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=300&q=80';
  };
`;

if (!content.includes('getImageForCategory')) {
  content = content.replace(/const addItem = \(recipe\) => \{/, imgLogic + '\n  const addItem = (recipe) => {');
  
  content = content.replace(/image: 'https:\/\/images.unsplash.com[^']+'/g, 'image: getImageForCategory(recipe.category)');
  content = content.replace(/<Image \n\s*source=\{\{uri: 'https:\/\/images.unsplash.com[^']+'\}\}/g, '<Image source={{uri: getImageForCategory(item.category)}}');
}

fs.writeFileSync(path, content);
console.log("Images updated.");
