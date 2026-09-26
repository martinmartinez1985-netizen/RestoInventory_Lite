const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\store\\\\mockDb.js';

let content = fs.readFileSync(path, 'utf8');

// Ensure users state and functions are added
if (!content.includes('globalUsers')) {
  const usersCode = `
// ==========================================
// USUARIOS, ROLES Y SEGURIDAD MAESTRA
// ==========================================
export const globalUsers = [
  { id: 'usr-1', name: 'Administrador Principal', username: 'admin', pin: '1234', role: 'admin' },
  { id: 'usr-2', name: 'Cajero de Turno', username: 'cajero', pin: '0000', role: 'cashier' },
  { id: 'usr-3', name: 'Cocinero / Chef', username: 'cocina', pin: '1111', role: 'cook' },
];

export const globalCurrentUser = { id: 'usr-1', name: 'Administrador Principal', username: 'admin', role: 'admin' };

export const globalMasterConfig = { masterPin: 'ZHEN2026' };

export const addUser = (user) => {
  const newUser = {
    id: 'usr-' + Date.now().toString().slice(-4),
    name: user.name.trim(),
    username: user.username.trim().toLowerCase(),
    pin: user.pin.trim(),
    role: user.role || 'cashier' // 'admin', 'cashier', 'cook'
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
  }
};

export const deleteUser = (userId) => {
  if (globalUsers.length <= 1) throw new Error("Debe existir al menos un usuario en el sistema.");
  if (globalCurrentUser.id === userId) throw new Error("No puede eliminar el usuario con la sesión activa.");
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
`;

  content += "\n" + usersCode;

  // Update persistData to include new fields
  content = content.replace(
    /const snapshot = \{([\s\S]*?)globalOrderHistory\s*\};/,
    `const snapshot = {\n$1globalOrderHistory,\n        globalUsers, globalCurrentUser, globalMasterConfig\n      };`
  );

  // Update loadData to restore new fields
  content = content.replace(
    /if \(parsed\.globalOrderHistory\) \{ globalOrderHistory\.length = 0; globalOrderHistory\.push\(\.\.\.parsed\.globalOrderHistory\); \}/,
    `if (parsed.globalOrderHistory) { globalOrderHistory.length = 0; globalOrderHistory.push(...parsed.globalOrderHistory); }
          if (parsed.globalUsers && parsed.globalUsers.length > 0) { globalUsers.length = 0; globalUsers.push(...parsed.globalUsers); }
          if (parsed.globalCurrentUser) { Object.assign(globalCurrentUser, parsed.globalCurrentUser); }
          if (parsed.globalMasterConfig) { Object.assign(globalMasterConfig, parsed.globalMasterConfig); }`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("mockDb updated with users, roles, and master wipe");
} else {
  console.log("globalUsers already exists in mockDb");
}
