const fs = require('fs');

// 1. Update AppNavigator.js
const navPath = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\navigation\\\\AppNavigator.js';
let navContent = fs.readFileSync(navPath, 'utf8');

if (!navContent.includes('SettingsScreen')) {
  navContent = navContent.replace(
    /import DailySalesScreen from '\.\.\/screens\/DailySalesScreen';/,
    "import DailySalesScreen from '../screens/DailySalesScreen';\nimport SettingsScreen from '../screens/SettingsScreen';"
  );

  navContent = navContent.replace(
    /import \{ globalSettings \} from '\.\.\/store\/mockDb';/,
    "import { globalSettings, globalCurrentUser } from '../store/mockDb';"
  );

  navContent = navContent.replace(
    /<Stack\.Screen name="Settings" component=\{PlaceholderScreen\} \/>/,
    `<Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />`
  );

  // Update profile button
  const oldProfileRegex = /\{\/\* Botn Perfil \*\/\}[\s\S]*?<Text style=\{\{ fontSize: 13, color: '#6c7a8f', fontWeight: '600' \}\}>Perfil<\/Text>[\s\S]*?<\/TouchableOpacity>/;
  
  const newProfileCode = `{/* Botón Perfil / Usuario Activo */}
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.navigate('Settings')}
              >
                <View style={{
                  backgroundColor: '#e2e8f0',
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 8
                }}>
                  <MaterialCommunityIcons 
                    name={globalCurrentUser.role === 'admin' ? 'crown' : globalCurrentUser.role === 'cook' ? 'chef-hat' : 'cash-register'} 
                    size={16} 
                    color="#0284c7" 
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#1e293b', fontWeight: '700' }}>
                    {globalCurrentUser.name.split(' ')[0]}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                    {globalCurrentUser.role}
                  </Text>
                </View>
              </TouchableOpacity>`;

  navContent = navContent.replace(oldProfileRegex, newProfileCode);

  fs.writeFileSync(navPath, navContent, 'utf8');
  console.log("AppNavigator updated with SettingsScreen and active user profile");
}

// 2. Update DashboardScreen.js
const dashPath = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');

if (!dashContent.includes('ROLE_PERMISSIONS')) {
  dashContent = dashContent.replace(
    /import \{ globalSettings \} from '\.\.\/store\/mockDb';/,
    "import { globalSettings, globalCurrentUser } from '../store/mockDb';"
  );

  const rolePermissionsCode = `
const ROLE_PERMISSIONS = {
  admin: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings'],
  cashier: ['Billing', 'Kitchen', 'DailySales', 'CashClose', 'Contacts'],
  cook: ['Kitchen', 'Recipes']
};
`;

  dashContent = dashContent.replace(
    /const MODULES = \[/,
    rolePermissionsCode + "\nconst MODULES = ["
  );

  // Update render in DashboardScreen
  dashContent = dashContent.replace(
    /export default function DashboardScreen\(\{ navigation \}\) \{[\s\S]*?const renderItem/,
    `export default function DashboardScreen({ navigation }) {
  const [tick, setTick] = React.useState(0);

  // Filtrar modulos segun el rol del usuario activo
  const allowedRoutes = ROLE_PERMISSIONS[globalCurrentUser.role] || ROLE_PERMISSIONS.admin;
  const filteredModules = MODULES.filter(m => allowedRoutes.includes(m.route));

  const renderItem`
  );

  // Update FlatList data
  dashContent = dashContent.replace(
    /<FlatList\s+data=\{MODULES\}/,
    `<FlatList\n          data={filteredModules}`
  );

  // Update welcomeSection
  const oldWelcomeRegex = /\{\/\* Welcome Section \*\/\}[\s\S]*?<Text style=\{styles\.subtitleText\}>Selecciona un mdulo para comenzar a trabajar<\/Text>[\s\S]*?<\/View>/;

  const newWelcomeCode = `{/* Welcome Section con Operador Activo */}
        <View style={styles.welcomeSection}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ height: 110, width: 320, resizeMode: 'contain', marginBottom: 10 }} 
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 4, gap: 8 }}>
            <MaterialCommunityIcons 
              name={globalCurrentUser.role === 'admin' ? 'crown' : globalCurrentUser.role === 'cook' ? 'chef-hat' : 'cash-register'} 
              size={18} 
              color={globalCurrentUser.role === 'admin' ? '#8b5cf6' : globalCurrentUser.role === 'cook' ? '#d97706' : '#0284c7'} 
            />
            <Text style={{ fontSize: 13, color: '#334155', fontWeight: '700' }}>
              Operador: {globalCurrentUser.name} ({globalCurrentUser.role.toUpperCase()})
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '800', marginLeft: 4 }}>⚙️ Cambiar</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.subtitleText, { marginTop: 10 }]}>
            {globalCurrentUser.role === 'cook' 
              ? 'Módulos operativos de cocina y preparación' 
              : globalCurrentUser.role === 'cashier' 
              ? 'Módulos autorizados para caja y atención al cliente' 
              : 'Selecciona un módulo para comenzar a trabajar'}
          </Text>
        </View>`;

  dashContent = dashContent.replace(oldWelcomeRegex, newWelcomeCode);

  fs.writeFileSync(dashPath, dashContent, 'utf8');
  console.log("DashboardScreen updated with dynamic role filtering and user ribbon");
}
