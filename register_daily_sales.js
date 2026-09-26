const fs = require('fs');

// 1. Update AppNavigator.js
const navPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let navContent = fs.readFileSync(navPath, 'utf8');

if (!navContent.includes('DailySalesScreen')) {
  navContent = navContent.replace(
    /import CashCloseScreen from '\.\.\/screens\/CashCloseScreen';/,
    "import CashCloseScreen from '../screens/CashCloseScreen';\nimport DailySalesScreen from '../screens/DailySalesScreen';"
  );

  navContent = navContent.replace(
    /<Stack\.Screen name="CashClose" component=\{CashCloseScreen\} options=\{\{ headerShown: false \}\} \/>/,
    `<Stack.Screen name="CashClose" component={CashCloseScreen} options={{ headerShown: false }} />\n        <Stack.Screen name="DailySales" component={DailySalesScreen} options={{ headerShown: false }} />`
  );

  fs.writeFileSync(navPath, navContent, 'utf8');
  console.log("AppNavigator updated with DailySales route");
}

// 2. Update DashboardScreen.js
const dashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');

if (!dashContent.includes('DailySales')) {
  dashContent = dashContent.replace(
    /\{ id: '10', title: 'Cocina \(KDS\)', icon: 'fire', colors: \['#ef4444', '#dc2626'\], route: 'Kitchen' \},/,
    `{ id: '10', title: 'Cocina (KDS)', icon: 'fire', colors: ['#ef4444', '#dc2626'], route: 'Kitchen' },\n  { id: '11', title: 'Ventas Diarias', icon: 'chart-box-outline', colors: ['#0284c7', '#0369a1'], route: 'DailySales' },`
  );

  fs.writeFileSync(dashPath, dashContent, 'utf8');
  console.log("DashboardScreen updated with Ventas Diarias card");
}
