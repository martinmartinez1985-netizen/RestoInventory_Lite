import { Platform } from 'react-native';

const STORAGE_KEY_CONFIG = 'RESTOSYS_SUPABASE_CONFIG_V1';

export const DEFAULT_SUPABASE_URL = 'https://smppvmucqkwcvqqikjue.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_0ObPJ7-6QLNDaVYLOB18sg_cqvPZylO';

export const getSupabaseConfig = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.anonKey && parsed.anonKey.trim().length > 0) return parsed;
      }
    } catch (e) {}
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_KEY,
    isConnected: true
  };
};

export const saveSupabaseConfig = (url, anonKey) => {
  const config = {
    url: (url || DEFAULT_SUPABASE_URL).trim(),
    anonKey: (anonKey || DEFAULT_SUPABASE_KEY).trim(),
    isConnected: !!((url || DEFAULT_SUPABASE_URL).trim() && (anonKey || DEFAULT_SUPABASE_KEY).trim())
  };
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {}
  }
  return config;
};

// Cliente Supabase REST nativo ultraligero y de alta velocidad (sin librerías pesadas)
export class SimpleSupabaseClient {
  constructor(url, key) {
    this.url = (url || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
    this.key = (key || DEFAULT_SUPABASE_KEY).trim();
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
      select: async (query = '*', limit = 100) => {
        try {
          const res = await fetch(`${self.url}/rest/v1/${table}?select=${encodeURIComponent(query)}&limit=${limit}`, {
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
      },

      delete: (matchField, matchValue) => {
        const doDelete = async (field, val) => {
          try {
            const res = await fetch(`${self.url}/rest/v1/${table}?${encodeURIComponent(field)}=eq.${encodeURIComponent(val)}`, {
              method: 'DELETE',
              headers: self.getHeaders()
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ message: res.statusText }));
              return { error: err };
            }
            return { error: null };
          } catch (err) {
            return { error: { message: err.message } };
          }
        };

        if (matchField !== undefined && matchValue !== undefined) {
          return doDelete(matchField, matchValue);
        }

        return {
          eq: async (field, val) => doDelete(field, val)
        };
      }
    };
  }
}

let currentConfig = getSupabaseConfig();
export let supabase = new SimpleSupabaseClient(currentConfig.url, currentConfig.anonKey);

export const reloadSupabaseClient = (url, anonKey) => {
  const activeUrl = url || DEFAULT_SUPABASE_URL;
  const activeKey = anonKey || DEFAULT_SUPABASE_KEY;
  supabase = new SimpleSupabaseClient(activeUrl, activeKey);
  saveSupabaseConfig(activeUrl, activeKey);
  return supabase;
};

export const testSupabaseConnection = async (url, anonKey) => {
  const cleanUrl = (url || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
  const cleanKey = (anonKey || DEFAULT_SUPABASE_KEY).trim();

  try {
    const res = await fetch(`${cleanUrl}/rest/v1/raw_materials?select=*&limit=1`, {
      headers: {
        'apikey': cleanKey,
        'Authorization': `Bearer ${cleanKey}`
      }
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error("Clave API no autorizada. Verifique que copió la anon / publishable key completa.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || res.statusText);
    }

    return { success: true, message: "¡Conexión con Supabase verificada exitosamente! Base de datos en la nube activa." };
  } catch (err) {
    throw new Error("No se pudo conectar a Supabase: " + err.message);
  }
};
