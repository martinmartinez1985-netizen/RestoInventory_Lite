if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('GLOBAL WINDOW ERROR:', event.error || event.message);
    const root = document.getElementById('root');
    if (root && root.innerHTML.trim() === '') {
      root.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#090d16;color:#f8fafc;font-family:system-ui,sans-serif;padding:20px;text-align:center;">
          <h2 style="color:#f43f5e;margin-bottom:10px;">⚠️ Error de Carga en Navegador</h2>
          <p style="color:#94a3b8;max-width:500px;margin-bottom:20px;font-size:14px;">${event.message || 'Se produjo un fallo inesperado al iniciar.'}</p>
          <button onclick="localStorage.removeItem('RESTOSYS_LITE_DB_V1'); location.reload();" style="background:#10b981;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;">
            🔄 Restablecer Datos y Recargar
          </button>
        </div>
      `;
    }
  });
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
