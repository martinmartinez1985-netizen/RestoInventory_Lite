import { Platform } from 'react-native';

const STORAGE_KEY_CONFIG = 'RESTOSYS_SUPABASE_CONFIG_V1';

export const getSupabaseConfig = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return {
    url: 'https://smppvmucqkwcvqqikjue.supabase.co',
    anonKey: '',
    isConnected: false
  };
};

export const saveSupabaseConfig = (url, anonKey) => {
  const config = {
    url: (url || '').trim(),
    anonKey: (anonKey || '').trim(),
    isConnected: !!((url || '').trim() && (anonKey || '').trim())
  };
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {}
  }
  return config;
};

// Cliente Supabase REST nativo ligero y ultra-confiable (sin dependencias problemáticas de Metro)
class SimpleSupabaseClient {
  constructor(url, key) {
    this.url = url ? url.replace(/\/+$/, '') : '';
    this.key = key ? key.trim() : '';
  }

  getHeaders(preferMerge = false) {
    const headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json'
    };
    if (preferMerge) {
      headers['Prefer'] = 'resolution=merge-duplicates';
    }
    return headers;
  }

  from(table) {
    const self = this;
    return {
      select: async (query = '*') => {
        try {
          const res = await fetch(`${self.url}/rest/v1/${table}?select=${encodeURIComponent(query)}&limit=50`, {
            headers: self.getHeaders()
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }
          const data = await res.json();
          return { data, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      upsert: async (rows) => {
        try {
          const dataRows = Array.isArray(rows) ? rows : [rows];
          const res = await fetch(`${self.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: self.getHeaders(true),
            body: JSON.stringify(dataRows)
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }
          return { data: true, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },
      insert: async (rows) => {
        try {
          const dataRows = Array.isArray(rows) ? rows : [rows];
          const res = await fetch(`${self.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: self.getHeaders(false),
            body: JSON.stringify(dataRows)
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            return { data: null, error: err };
          }
          return { data: true, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      }
    };
  }
}

let currentConfig = getSupabaseConfig();
export let supabase = (currentConfig.url && currentConfig.anonKey) 
  ? new SimpleSupabaseClient(currentConfig.url, currentConfig.anonKey) 
  : null;

export const reloadSupabaseClient = (url, anonKey) => {
  if (url && anonKey) {
    supabase = new SimpleSupabaseClient(url, anonKey);
    saveSupabaseConfig(url, anonKey);
    return supabase;
  }
  supabase = null;
  saveSupabaseConfig('', '');
  return null;
};

export const testSupabaseConnection = async (url, anonKey) => {
  if (!url || !anonKey) throw new Error("Debe ingresar la URL y la API Key de Supabase.");
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/settings?select=*&limit=1`, {
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error("Clave API no autorizada. Verifique que copió la anon / public key completa.");
    }

    if (res.status === 404) {
      return { success: true, message: "¡Conectado a Supabase! (Aviso: Recuerde haber ejecutado el script SQL en Supabase)." };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      if (err.message && err.message.includes('relation') && err.message.includes('does not exist')) {
        return { success: true, message: "¡Conexión con Supabase verificada exitosamente!" };
      }
      throw new Error(err.message || res.statusText);
    }

    return { success: true, message: "¡Conexión con Supabase verificada y lista para migrar!" };
  } catch (err) {
    throw new Error("No se pudo conectar a Supabase: " + err.message);
  }
};
