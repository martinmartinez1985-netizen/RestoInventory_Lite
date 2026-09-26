const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\CashCloseScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Fix the undefined errors by adding ( ... || 0)
content = content.replace(/globalShift\.openingCash\.toFixed/g, "(globalShift.openingCash || 0).toFixed");
content = content.replace(/globalShift\.sales\.usdCash\.toFixed/g, "(globalShift.sales?.usdCash || 0).toFixed");
content = content.replace(/globalShift\.sales\.usdDigital\.toFixed/g, "(globalShift.sales?.usdDigital || 0).toFixed");
content = content.replace(/globalShift\.sales\.bsCash\.toFixed/g, "(globalShift.sales?.bsCash || 0).toFixed");
content = content.replace(/globalShift\.sales\.bsDigital\.toFixed/g, "(globalShift.sales?.bsDigital || 0).toFixed");
content = content.replace(/globalShift\.sales\.cxc\.toFixed/g, "(globalShift.sales?.cxc || 0).toFixed");
content = content.replace(/globalShift\.openingCash \+ globalShift\.sales\.usdCash/g, "(globalShift.openingCash || 0) + (globalShift.sales?.usdCash || 0)");

fs.writeFileSync(path, content);
console.log("CashClose patched with fallbacks");
