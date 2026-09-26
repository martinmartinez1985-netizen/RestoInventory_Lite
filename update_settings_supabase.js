const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\SettingsScreen.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Add Supabase imports
content = content.replace(
  /import \{ globalUsers, /g,
  `import { getSupabaseConfig, saveSupabaseConfig, reloadSupabaseClient, testSupabaseConnection } from '../config/supabase';
import { supabaseService } from '../services/supabaseService';
import { globalUsers, `
);

// 2. Add Supabase states inside SettingsScreen
const supabaseStates = `  // Estados de Supabase
  const initialSupa = getSupabaseConfig();
  const [supaUrl, setSupaUrl] = useState(initialSupa.url || '');
  const [supaKey, setSupaKey] = useState(initialSupa.anonKey || '');
  const [isSupaConnected, setIsSupaConnected] = useState(initialSupa.isConnected || false);
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [isMigratingSupa, setIsMigratingSupa] = useState(false);

  const handleTestAndSaveSupabase = async () => {
    if (!supaUrl.trim() || !supaKey.trim()) {
      alert("Debe ingresar la URL y la API Key de Supabase.");
      return;
    }
    setIsTestingSupa(true);
    try {
      const res = await testSupabaseConnection(supaUrl.trim(), supaKey.trim());
      reloadSupabaseClient(supaUrl.trim(), supaKey.trim());
      setIsSupaConnected(true);
      refresh();
      alert(res.message || "¡Conexión establecida con éxito con Supabase!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsTestingSupa(false);
    }
  };

  const handleMigrateDataToSupabase = async () => {
    if (!isSupaConnected) {
      alert("Primero debe conectar y guardar sus credenciales de Supabase.");
      return;
    }
    if (!window.confirm("¿Desea subir y sincronizar todos sus platos, clientes, recetas y ventas locales a la Nube Supabase?")) return;

    setIsMigratingSupa(true);
    try {
      const res = await supabaseService.uploadLocalData();
      alert("¡Migración a Supabase completada con éxito!\n\n" +
        "• Clientes subidos: " + res.customers + "\n" +
        "• Platos/Recetas subidas: " + res.recipes + "\n" +
        "• Materias primas: " + res.materials + "\n" +
        "• Facturas/Órdenes: " + res.orders + "\n" +
        "• Usuarios: " + res.users);
    } catch (err) {
      alert("Error durante la migración: " + err.message);
    } finally {
      setIsMigratingSupa(false);
    }
  };`;

content = content.replace(
  /const \[revealedPins, setRevealedPins\] = useState\(\{\}\);/,
  `const [revealedPins, setRevealedPins] = useState({});\n${supabaseStates}`
);

// 3. Add Tab in Tab Header
const tabButtonCode = `            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'supabase' && styles.tabBtnActive]}
              onPress={() => setActiveTab('supabase')}
            >
              <MaterialCommunityIcons 
                name="cloud-outline" 
                size={18} 
                color={activeTab === 'supabase' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'supabase' && styles.tabBtnTextActive]}>
                Nube Supabase
              </Text>
            </TouchableOpacity>`;

content = content.replace(
  /<TouchableOpacity \s*style=\{\[styles\.tabBtn, activeTab === 'security' && styles\.tabBtnActive\]\}/,
  `${tabButtonCode}\n\n            <TouchableOpacity style={[styles.tabBtn, activeTab === 'security' && styles.tabBtnActive]}`
);

// 4. Add Tab Content
const tabContentCode = `          {/* TAB 4: NUBE SUPABASE */}
          {activeTab === 'supabase' && (
            <View style={{ maxWidth: 750 }}>
              
              {/* Banner de Estado de Conexión */}
              <View style={[styles.activeUserBanner, { borderLeftColor: isSupaConnected ? '#10b981' : '#64748b' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={[styles.activeUserIconBox, { backgroundColor: isSupaConnected ? '#ecfdf5' : '#f1f5f9' }]}>
                      <MaterialCommunityIcons 
                        name={isSupaConnected ? "cloud-check" : "cloud-off-outline"} 
                        size={28} 
                        color={isSupaConnected ? "#10b981" : "#64748b"} 
                      />
                    </View>
                    <View>
                      <Text style={styles.activeUserPre}>ESTADO DE BASE DE DATOS EN LA NUBE:</Text>
                      <Text style={[styles.activeUserName, { color: isSupaConnected ? '#047857' : '#475569' }]}>
                        {isSupaConnected ? '🟢 Conectado a Supabase (PostgreSQL)' : '⚪ Modo Local / Desconectado'}
                      </Text>
                      <Text style={styles.activeUserDesc}>
                        {isSupaConnected 
                          ? 'Los datos se sincronizan con tu base de datos cloud en Supabase.' 
                          : 'El sistema está operando en almacenamiento local del navegador.'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Formulario de Credenciales */}
              <View style={styles.securityCard}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
                  Credenciales de tu Proyecto en Supabase
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 20 }}>
                  Encuentra estos datos en tu panel de Supabase ➡️ Project Settings ➡️ API
                </Text>

                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={styles.formLabel}>URL DEL PROYECTO (PROJECT URL):</Text>
                    <TextInput 
                      style={styles.formInput}
                      placeholder="https://xyzabcdefg.supabase.co"
                      value={supaUrl}
                      onChangeText={setSupaUrl}
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text style={styles.formLabel}>API KEY PÚBLICA (ANON PUBLIC KEY):</Text>
                    <TextInput 
                      style={[styles.formInput, { fontSize: 12 }]}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supaKey}
                      onChangeText={setSupaKey}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                    <TouchableOpacity 
                      style={[styles.saveMasterPinBtn, { flex: 1, backgroundColor: '#0284c7' }]}
                      onPress={handleTestAndSaveSupabase}
                      disabled={isTestingSupa}
                    >
                      <MaterialCommunityIcons name="lightning-bolt" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveMasterPinBtnText}>
                        {isTestingSupa ? 'Conectando...' : 'Probar Conexión y Guardar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.saveMasterPinBtn, { flex: 1.2, backgroundColor: isSupaConnected ? '#10b981' : '#64748b' }]}
                      onPress={handleMigrateDataToSupabase}
                      disabled={!isSupaConnected || isMigratingSupa}
                    >
                      <MaterialCommunityIcons name="cloud-upload" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveMasterPinBtnText}>
                        {isMigratingSupa ? 'Subiendo datos...' : 'Subir y Migrar Datos a Supabase'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Guía Rápida de Configuración en Supabase */}
              <View style={[styles.guideCard, { marginTop: 20 }]}>
                <Text style={styles.guideTitle}>📋 Pasos para crear tu Base de Datos en Supabase (2 minutos):</Text>
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    <Text style={{ fontWeight: 'bold' }}>1. Crea tu cuenta gratuita</Text> en <Text style={{ color: '#0284c7', fontWeight: 'bold' }}>https://supabase.com</Text>.
                  </Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    <Text style={{ fontWeight: 'bold' }}>2. Crea un nuevo proyecto</Text> (puedes llamarlo <Text style={{ fontWeight: 'bold' }}>lago-wok-zhen</Text>).
                  </Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    <Text style={{ fontWeight: 'bold' }}>3. Ejecuta el esquema SQL</Text>: En el menú lateral de Supabase ve a <Text style={{ fontWeight: 'bold' }}>SQL Editor</Text>, abre o pega el archivo <Text style={{ fontWeight: 'bold', color: '#047857' }}>supabase_schema.sql</Text> generado en tu proyecto y dale clic a <Text style={{ fontWeight: 'bold' }}>Run</Text>.
                  </Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    <Text style={{ fontWeight: 'bold' }}>4. Copia tus claves</Text>: En Supabase ve a <Text style={{ fontWeight: 'bold' }}>Project Settings ➡️ API</Text>, copia la URL y la anon key, pégalas arriba y presiona <Text style={{ fontWeight: 'bold' }}>"Probar Conexión"</Text>.
                  </Text>
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    <Text style={{ fontWeight: 'bold' }}>5. Migra tus datos</Text>: Presiona el botón verde <Text style={{ fontWeight: 'bold' }}>"Subir y Migrar Datos a Supabase"</Text> para transferir todos tus platos, clientes y recetas a la nube.
                  </Text>
                </View>
              </View>

            </View>
          )}
`;

content = content.replace(
  /\{\/\* TAB 2: CLAVE MAESTRA \*\/\}/,
  `${tabContentCode}\n\n          {/* TAB 2: CLAVE MAESTRA */}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("SettingsScreen updated with Supabase Cloud tab!");
