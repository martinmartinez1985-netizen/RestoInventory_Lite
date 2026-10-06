import { supabase } from '../config/supabase';
import { 
  globalDirectory, 
  globalRawMaterials, 
  globalRecipes, 
  globalFinishedGoods,
  globalTables, 
  globalUsers, 
  globalOrderHistory, 
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
          globalSettings.exchangeRate = rateRow.value.toString();
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

    // 7. Subir Configuración
    await supabase.from('settings').upsert([
      { key: 'exchange_rate', value: String(globalSettings.exchangeRate || '40.00') },
      { key: 'last_sync', value: new Date().toISOString() }
    ]);

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
    if (!supabase) return;
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

  syncOrder: async (o) => {
    if (!supabase) return;
    try {
      await supabase.from('orders').upsert([{
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
      }]);
    } catch (e) {
      console.warn("Error sync orden:", e.message);
    }
  }
};

