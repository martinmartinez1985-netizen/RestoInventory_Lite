import { supabase } from '../config/supabase';
import { 
  globalDirectory, 
  globalRawMaterials, 
  globalRecipes, 
  globalFinishedGoods,
  globalTables, 
  globalUsers, 
  globalMasterConfig,
  globalActiveOrders,
  globalOrderHistory, 
  globalShift,
  globalZReports,
  globalSettings,
  persistData
} from '../store/mockDb';

export const supabaseService = {
  // 1. Subir solo el menú / recetas a Supabase
  uploadRecipes: async () => {
    if (!supabase) throw new Error("Supabase no está configurado. Conéctelo en Configuración primero.");
    if (!globalRecipes || globalRecipes.length === 0) {
      throw new Error("No hay platos en la memoria de esta PC para subir.");
    }
    const recipeData = globalRecipes.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category || 'Platos Principales',
      sale_price: Number(r.salePrice || r.price || 0),
      cost: Number(r.cost || 0),
      image: r.image || '',
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      is_active: true
    }));
    const { error } = await supabase.from('recipes').upsert(recipeData);
    if (error) throw new Error("Error subiendo recetas: " + error.message);
    return recipeData.length;
  },

  // 2. Descargar recetas / menú desde Supabase hacia la memoria de esta PC
  downloadRecipes: async () => {
    if (!supabase) throw new Error("Supabase no está conectado.");
    const { data, error } = await supabase.from('recipes').select('*', 500);
    if (error) throw new Error("Error descargando recetas: " + error.message);
    if (!data || data.length === 0) return 0;

    data.forEach(cloudRecipe => {
      const existingIdx = globalRecipes.findIndex(r => r.id === cloudRecipe.id || r.name.toLowerCase() === (cloudRecipe.name || '').toLowerCase());
      const formatted = {
        id: cloudRecipe.id,
        name: cloudRecipe.name,
        category: cloudRecipe.category || 'Platos Principales',
        image: cloudRecipe.image || '',
        outputType: 'finished',
        outputId: `FG-${cloudRecipe.id}`,
        yieldAmount: 1,
        yieldUnit: 'unit',
        price: Number(cloudRecipe.sale_price || 0),
        salePrice: Number(cloudRecipe.sale_price || 0),
        cost: Number(cloudRecipe.cost || 0),
        ingredients: Array.isArray(cloudRecipe.ingredients) ? cloudRecipe.ingredients : []
      };

      if (existingIdx !== -1) {
        globalRecipes[existingIdx] = { ...globalRecipes[existingIdx], ...formatted };
      } else {
        globalRecipes.push(formatted);
      }

      // Garantizar que exista en Productos Terminados para inventario
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
    });

    persistData();
    return data.length;
  },

  // 3. Sincronizar 1 receta individual al crear o editar
  syncRecipe: async (r) => {
    if (!supabase) return;
    try {
      await supabase.from('recipes').upsert([{
        id: r.id,
        name: r.name,
        category: r.category || 'Platos Principales',
        sale_price: Number(r.salePrice || r.price || 0),
        cost: Number(r.cost || 0),
        image: r.image || '',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        is_active: true
      }]);
    } catch (e) {
      console.warn("Error auto-sync receta:", e.message);
    }
  },

  // 4. Descargar todos los datos disponibles en la nube (Menú, Clientes, Configuración)
  downloadAllData: async () => {
    if (!supabase) throw new Error("Supabase no está conectado.");
    const stats = { recipes: 0, customers: 0 };
    
    // Recetas
    try {
      const recCount = await supabaseService.downloadRecipes();
      stats.recipes = recCount;
    } catch (e) {
      console.warn("Error descargando recetas:", e.message);
    }

    // Clientes
    try {
      const { data: custs } = await supabase.from('customers').select('*', 500);
      if (custs && custs.length > 0) {
        custs.forEach(c => {
          if (!globalDirectory.some(d => d.id === c.id || (d.docId && d.docId === c.doc_id))) {
            globalDirectory.push({
              id: c.id,
              name: c.name,
              docId: c.doc_id,
              phone: c.phone,
              email: c.email,
              address: c.address,
              type: c.type || 'Clientes'
            });
          }
        });
        stats.customers = custs.length;
      }
    } catch (e) {
      console.warn("Error descargando clientes:", e.message);
    }

    // Configuración (tasa, etc.)
    try {
      const { data: settings } = await supabase.from('settings').select('*', 50);
      if (settings && settings.length > 0) {
        const rateRow = settings.find(s => s.key === 'exchange_rate');
        if (rateRow && rateRow.value) {
          const cloudRate = rateRow.value.toString().trim();
          globalSettings.exchangeRate = cloudRate;
          if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem('RESTOSYS_EXCHANGE_RATE_V1', cloudRate); } catch (e) {}
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('RESTOSYS_RATE_CHANGED', { detail: cloudRate }));
          }
        }

        const masterRow = settings.find(s => s.key === 'master_pin');
        if (masterRow && masterRow.value) {
          globalMasterConfig.masterPin = masterRow.value.toString().trim();
        }

        const usersRow = settings.find(s => s.key === 'users_config');
        if (usersRow && usersRow.value) {
          try {
            const parsed = JSON.parse(usersRow.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              globalUsers.length = 0;
              globalUsers.push(...parsed);
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    persistData();
    return stats;
  },

  // 5. Migración masiva de datos locales hacia la base de datos Supabase
  uploadLocalData: async () => {
    if (!supabase) throw new Error("Supabase no está configurado. Conéctelo en Configuración primero.");

    const stats = {
      customers: 0,
      materials: 0,
      recipes: 0,
      tables: 0,
      users: 0,
      orders: 0
    };

    // 1. Subir Clientes
    if (globalDirectory && globalDirectory.length > 0) {
      const customersData = globalDirectory.map(c => ({
        id: c.id,
        name: c.name,
        doc_id: c.docId || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        type: c.type || 'Clientes'
      }));
      const { error } = await supabase.from('customers').upsert(customersData);
      if (error) throw new Error("Error subiendo clientes: " + error.message);
      stats.customers = customersData.length;
    }

    // 2. Subir Materias Primas
    if (globalRawMaterials && globalRawMaterials.length > 0) {
      const rawData = globalRawMaterials.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category || '',
        unit: m.unit || 'kg',
        stock: m.currentStock || 0,
        min_stock: m.minStock || 0,
        cost: m.averageCost || 0
      }));
      const { error } = await supabase.from('raw_materials').upsert(rawData);
      if (error) throw new Error("Error subiendo inventario: " + error.message);
      stats.materials = rawData.length;
    }

    // 3. Subir Recetas y Platos
    if (globalRecipes && globalRecipes.length > 0) {
      const recipeData = globalRecipes.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category || 'Platos Principales',
        sale_price: Number(r.salePrice || r.price || 0),
        cost: Number(r.cost || 0),
        image: r.image || '',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        is_active: true
      }));
      const { error } = await supabase.from('recipes').upsert(recipeData);
      if (error) throw new Error("Error subiendo recetas: " + error.message);
      stats.recipes = recipeData.length;
    }

    // 4. Subir Mesas
    if (globalTables && globalTables.length > 0) {
      const tablesData = globalTables.map(t => ({
        id: t.id,
        label: t.label || t.id,
        capacity: t.capacity || 4,
        status: t.status || 'free'
      }));
      const { error } = await supabase.from('tables').upsert(tablesData);
      if (error) throw new Error("Error subiendo mesas: " + error.message);
      stats.tables = tablesData.length;
    }

    // 5. Subir Usuarios
    if (globalUsers && globalUsers.length > 0) {
      const usersData = globalUsers.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        pin: u.pin,
        role: u.role
      }));
      const { error } = await supabase.from('users').upsert(usersData);
      if (error) throw new Error("Error subiendo usuarios: " + error.message);
      stats.users = usersData.length;
    }

    // 6. Subir Órdenes Históricas
    if (globalOrderHistory && globalOrderHistory.length > 0) {
      const ordersData = globalOrderHistory.map(o => ({
        id: o.id,
        order_number: o.id,
        type: o.type || 'dine_in',
        table_id: o.tableId || null,
        customer_name: o.customerName || 'Cliente General',
        client_id: o.clientId || '',
        status: o.status || 'paid',
        total: o.total || 0,
        items: o.items || [],
        payment: o.payment || {},
        payments: o.payments || [],
        created_at: o.createdAt || new Date().toISOString(),
        paid_at: o.payment?.paidAt || o.createdAt
      }));
      const { error } = await supabase.from('orders').upsert(ordersData);
      if (error) throw new Error("Error subiendo órdenes: " + error.message);
      stats.orders = ordersData.length;
    }

    // 7. Subir Configuración y Usuarios
    const settingsPayload = [
      { key: 'last_sync', value: new Date().toISOString() }
    ];
    if (globalSettings.exchangeRate) {
      settingsPayload.push({ key: 'exchange_rate', value: String(globalSettings.exchangeRate) });
    }
    if (globalMasterConfig.masterPin) {
      settingsPayload.push({ key: 'master_pin', value: String(globalMasterConfig.masterPin) });
    }
    if (globalUsers && globalUsers.length > 0) {
      settingsPayload.push({ key: 'users_config', value: JSON.stringify(globalUsers) });
    }
    await supabase.from('settings').upsert(settingsPayload);
    await supabaseService.pushUsers(globalUsers);

    return stats;
  },

  // Prueba rápida con 1 solo registro en vivo sin tocar tus datos locales
  testPingRecord: async () => {
    if (!supabase) throw new Error("Supabase no está conectado.");
    const testId = 'TEST-' + Math.floor(1000 + Math.random() * 9000);
    const nowTime = new Date().toLocaleTimeString();
    const testCustomer = {
      id: testId,
      name: 'CLIENTE PRUEBA (' + nowTime + ')',
      doc_id: 'V-99999999',
      phone: '0414-0000000',
      email: 'prueba@supabase.com',
      address: 'Lago Wok Zhen Cloud',
      type: 'Clientes'
    };

    const insertRes = await supabase.from('customers').insert([testCustomer]);
    if (insertRes.error) throw new Error(insertRes.error.message || "Error al insertar");

    const readRes = await supabase.from('customers').select('*');
    return {
      testCustomer,
      totalInSupabase: readRes.data ? readRes.data.length : 1
    };
  },

  syncCustomer: async (c) => {
    if (!supabase || !c) return;
    try {
      await supabase.from('customers').upsert([{
        id: c.id,
        name: c.name,
        doc_id: c.docId || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        type: c.type || 'Clientes'
      }]);
    } catch (e) {
      console.warn("Error sync cliente:", e.message);
    }
  },

  // Sincronizar orden individual (abierta o pagada) en la nube
  pushOrder: async (o) => {
    if (!supabase || !o) return;
    try {
      const orderPayload = {
        id: o.id,
        order_number: o.orderNumber || o.id,
        type: o.type || 'dine_in',
        table_id: o.tableId || null,
        customer_name: o.customerName || 'Cliente General',
        client_id: o.clientId || '',
        status: o.status || 'open',
        total: Number(o.total || 0),
        items: Array.isArray(o.items) ? o.items : [],
        payment: o.payment || {},
        payments: Array.isArray(o.payments) ? o.payments : [],
        created_at: o.createdAt || new Date().toISOString(),
        paid_at: o.payment?.paidAt || (o.status === 'paid' ? (o.paidAt || new Date().toISOString()) : null)
      };
      await supabase.from('orders').upsert([orderPayload]);
    } catch (e) {
      console.warn("Error push orden en vivo:", e.message);
    }
  },

  // Sincronizar mesa en vivo
  pushTable: async (t) => {
    if (!supabase || !t) return;
    try {
      await supabase.from('tables').upsert([{
        id: t.id,
        label: t.name || t.label || t.id,
        capacity: Number(t.capacity || 4),
        status: t.status || 'free',
        updated_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn("Error push mesa:", e.message);
    }
  },

  // Sincronizar estado de turno / caja en vivo
  pushShift: async (s) => {
    if (!supabase) return;
    const shiftObj = s || globalShift;
    try {
      const payload = {
        id: 'current_shift',
        is_open: Boolean(shiftObj.isOpen),
        opened_at: shiftObj.startTime || new Date().toISOString(),
        initial_cash: { amount: Number(shiftObj.openingCash || 0) },
        sales: shiftObj.sales || { usdCash: 0, usdDigital: 0, bsCash: 0, bsDigital: 0, cxc: 0 },
        opened_by_user: 'cajero'
      };
      await supabase.from('shifts').upsert([payload]);
    } catch (e) {
      console.warn("Error push turno caja:", e.message);
    }
  },

  // Sincronizar Reporte Z al cerrar caja
  pushZReport: async (report) => {
    if (!supabase || !report) return;
    try {
      const payload = {
        id: report.id,
        is_open: false,
        closed_at: report.date || new Date().toISOString(),
        actual_cash: { amount: Number(report.actualCash || 0) },
        discrepancies: { amount: Number(report.discrepancy || 0) },
        sales: { totalSales: Number(report.totalSales || 0) }
      };
      await supabase.from('shifts').upsert([payload]);
    } catch (e) {
      console.warn("Error push reporte Z:", e.message);
    }
  },

  // Sincronizar configuración (ej. Tasa de cambio)
  pushSetting: async (key, val) => {
    if (!supabase) return;
    try {
      await supabase.from('settings').upsert([{
        key: String(key),
        value: String(val),
        updated_at: new Date().toISOString()
      }]);
    } catch (e) {
      console.warn("Error push setting:", e.message);
    }
  },

  pushExchangeRate: async (rate) => {
    if (!supabase) return;
    try {
      const r = String(rate).trim();
      if (!r) return;
      await supabase.from('settings').upsert([{
        key: 'exchange_rate',
        value: r,
        updated_at: new Date().toISOString()
      }], { onConflict: 'key' });
    } catch (e) {
      console.warn("Error push exchange rate:", e.message);
    }
  },

  pushMasterPin: async (pin) => {
    if (!supabase) return;
    try {
      const p = String(pin).trim();
      if (!p) return;
      await supabase.from('settings').upsert([{
        key: 'master_pin',
        value: p,
        updated_at: new Date().toISOString()
      }], { onConflict: 'key' });
      console.log("☁️ Clave Maestra sincronizada en Supabase:", p);
    } catch (e) {
      console.warn("Error push master pin:", e.message);
    }
  },

  pushUsers: async (users) => {
    if (!supabase || !Array.isArray(users)) return;
    try {
      await supabase.from('settings').upsert([{
        key: 'users_config',
        value: JSON.stringify(users),
        updated_at: new Date().toISOString()
      }], { onConflict: 'key' });

      for (const u of users) {
        try {
          const { data: existing } = await supabase.from('users').select('id').eq('username', u.username).maybeSingle();
          if (existing) {
            await supabase.from('users').update({
              name: u.name,
              pin: u.pin,
              role: u.role || 'cashier'
            }).eq('username', u.username);
          } else {
            await supabase.from('users').insert([{
              id: u.id,
              name: u.name,
              username: u.username,
              pin: u.pin,
              role: u.role || 'cashier',
              created_at: new Date().toISOString()
            }]);
          }
        } catch (e) {}
      }
      console.log(`☁️ ${users.length} usuarios y sus claves sincronizados en Supabase.`);
    } catch (e) {
      console.warn("Error push users:", e.message);
    }
  },

  // MOTOR EN VIVO: Consulta periódica de cambios en la nube y actualización de estado
  pullLiveSync: async () => {
    if (!supabase) return false;
    let hasChanges = false;
    try {
      // 1. Órdenes (Activas y Ventas Diarias)
      const { data: cloudOrders } = await supabase.from('orders').select('*', 100);
      if (cloudOrders && Array.isArray(cloudOrders) && cloudOrders.length > 0) {
        cloudOrders.forEach(co => {
          let parsedItems = co.items;
          if (typeof parsedItems === 'string') {
            try { parsedItems = JSON.parse(parsedItems); } catch (e) {}
          }
          let parsedPayments = co.payments;
          if (typeof parsedPayments === 'string') {
            try { parsedPayments = JSON.parse(parsedPayments); } catch (e) {}
          }
          let parsedPayment = co.payment;
          if (typeof parsedPayment === 'string') {
            try { parsedPayment = JSON.parse(parsedPayment); } catch (e) {}
          }

          const formatted = {
            id: co.id,
            orderNumber: co.order_number || co.id,
            type: co.type || 'dine_in',
            tableId: co.table_id,
            customerName: co.customer_name || 'Cliente General',
            clientId: co.client_id || '',
            status: co.status || 'open',
            total: Number(co.total || 0),
            items: Array.isArray(parsedItems) ? parsedItems : [],
            payment: parsedPayment || {},
            payments: Array.isArray(parsedPayments) ? parsedPayments : [],
            createdAt: co.created_at,
            paidAt: co.paid_at || co.created_at
          };

          if (formatted.status === 'paid') {
            // Si estaba en órdenes activas de esta PC, removerla
            const activeIdx = globalActiveOrders.findIndex(o => o.id === formatted.id);
            if (activeIdx !== -1) {
              globalActiveOrders.splice(activeIdx, 1);
              hasChanges = true;
            }
            // Agregar o actualizar en historial de ventas
            const histIdx = globalOrderHistory.findIndex(o => o.id === formatted.id);
            if (histIdx !== -1) {
              if (JSON.stringify(globalOrderHistory[histIdx]) !== JSON.stringify(formatted)) {
                globalOrderHistory[histIdx] = formatted;
                hasChanges = true;
              }
            } else {
              globalOrderHistory.unshift(formatted);
              hasChanges = true;
            }
          } else {
            // Orden abierta o en cocina
            const activeIdx = globalActiveOrders.findIndex(o => o.id === formatted.id);
            if (activeIdx !== -1) {
              if (JSON.stringify(globalActiveOrders[activeIdx]) !== JSON.stringify(formatted)) {
                globalActiveOrders[activeIdx] = formatted;
                hasChanges = true;
              }
            } else {
              globalActiveOrders.push(formatted);
              hasChanges = true;
            }
          }
        });
      }

      // 2. Mesas
      const { data: cloudTables } = await supabase.from('tables').select('*', 50);
      if (cloudTables && Array.isArray(cloudTables) && cloudTables.length > 0) {
        cloudTables.forEach(ct => {
          const localTable = globalTables.find(t => t.id === ct.id);
          if (localTable && localTable.status !== ct.status) {
            localTable.status = ct.status;
            hasChanges = true;
          }
        });
      }

      // 3. Turno de Caja y Arqueos
      const { data: cloudShifts } = await supabase.from('shifts').select('*', 30);
      if (cloudShifts && Array.isArray(cloudShifts)) {
        const liveShiftRow = cloudShifts.find(s => s.id === 'current_shift');
        if (liveShiftRow) {
          const cloudIsOpen = Boolean(liveShiftRow.is_open);
          const cloudOpening = Number(liveShiftRow.initial_cash?.amount || 0);
          let cloudSales = liveShiftRow.sales;
          if (typeof cloudSales === 'string') {
            try { cloudSales = JSON.parse(cloudSales); } catch (e) {}
          }
          if (cloudSales && (
            globalShift.isOpen !== cloudIsOpen ||
            JSON.stringify(globalShift.sales) !== JSON.stringify(cloudSales)
          )) {
            globalShift.isOpen = cloudIsOpen;
            globalShift.openingCash = cloudOpening;
            if (cloudSales) globalShift.sales = cloudSales;
            hasChanges = true;
          }
        }

        // Reportes Z
        const zRows = cloudShifts.filter(s => s.id && s.id.startsWith('Z-'));
        zRows.forEach(zr => {
          if (!globalZReports.some(z => z.id === zr.id)) {
            let zSales = zr.sales;
            if (typeof zSales === 'string') {
              try { zSales = JSON.parse(zSales); } catch (e) {}
            }
            globalZReports.unshift({
              id: zr.id,
              date: zr.closed_at || new Date().toISOString(),
              actualCash: Number(zr.actual_cash?.amount || 0),
              discrepancy: Number(zr.discrepancies?.amount || 0),
              totalSales: Number(zSales?.totalSales || 0)
            });
            hasChanges = true;
          }
        });
      }

      // 4. Tasa de cambio
      const { data: settings } = await supabase.from('settings').select('*', 20);
      if (settings && Array.isArray(settings)) {
        const rateRow = settings.find(s => s.key === 'exchange_rate');
        if (rateRow && rateRow.value && rateRow.value !== globalSettings.exchangeRate) {
          const cloudRate = rateRow.value.toString().trim();
          globalSettings.exchangeRate = cloudRate;
          if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem('RESTOSYS_EXCHANGE_RATE_V1', cloudRate); } catch (e) {}
          }
          hasChanges = true;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('RESTOSYS_RATE_CHANGED', { detail: cloudRate }));
          }
        }

        // 4b. Clave Maestra
        const masterRow = settings.find(s => s.key === 'master_pin');
        if (masterRow && masterRow.value && masterRow.value !== globalMasterConfig.masterPin) {
          globalMasterConfig.masterPin = masterRow.value.toString().trim();
          hasChanges = true;
        }

        // 4c. Usuarios y Claves (PINs)
        const usersRow = settings.find(s => s.key === 'users_config');
        if (usersRow && usersRow.value) {
          try {
            const parsedUsers = JSON.parse(usersRow.value);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
              if (JSON.stringify(globalUsers) !== JSON.stringify(parsedUsers)) {
                globalUsers.length = 0;
                globalUsers.push(...parsedUsers);
                hasChanges = true;
              }
            }
          } catch (e) {}
        }
      }

      // 5. Si la PC no tiene menú, descargarlo
      if (globalRecipes.length === 0) {
        const recCount = await supabaseService.downloadRecipes();
        if (recCount > 0) hasChanges = true;
      }

      if (hasChanges) {
        persistData();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('RESTOSYS_DATA_SYNCED'));
        }
      }
      return hasChanges;
    } catch (e) {
      console.warn("Live sync error:", e.message);
      return false;
    }
  }
};

