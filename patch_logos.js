const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens';

// 1. PosOrderingScreen.js
const posPath = path.join(dir, 'PosOrderingScreen.js');
let posContent = fs.readFileSync(posPath, 'utf8');

// Replace sidebar logo
const oldSidebarLogo = /<View style=\{\{alignItems: 'center', marginBottom: 30\}\}>[\s\S]*?<\/View>/;
const newSidebarLogo = `<View style={{alignItems: 'center', marginBottom: 30}}>
              <Image source={require('../../assets/logo.png')} style={{width: 100, height: 40, resizeMode: 'contain'}} />
            </View>`;
posContent = posContent.replace(oldSidebarLogo, newSidebarLogo);

// Replace main header logo text
posContent = posContent.replace(
  /<Text style=\{styles.restaurantName\}>RESTOSYS Lite<\/Text>/,
  "" // Remove text, we don't need it if the logo is in the sidebar
);
fs.writeFileSync(posPath, posContent);

// 2. BillingScreen.js
const billingPath = path.join(dir, 'BillingScreen.js');
let billingContent = fs.readFileSync(billingPath, 'utf8');
if (!billingContent.includes('Image')) billingContent = billingContent.replace(/import \{ View, Text/, "import { View, Text, Image");
billingContent = billingContent.replace(
  /<TouchableOpacity onPress=\{\(\) => navigation\.navigate\('Dashboard'\)\} style=\{\{marginRight: 15\}\}>[\s\S]*?<\/TouchableOpacity>/,
  `<TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 15}}>
              <Image source={require('../../assets/logo.png')} style={{width: 120, height: 40, resizeMode: 'contain'}} />
            </TouchableOpacity>`
);
fs.writeFileSync(billingPath, billingContent);

// 3. KitchenScreen.js
const kitchenPath = path.join(dir, 'KitchenScreen.js');
let kitchenContent = fs.readFileSync(kitchenPath, 'utf8');
if (!kitchenContent.includes('Image')) kitchenContent = kitchenContent.replace(/import \{ View, Text/, "import { View, Text, Image");
kitchenContent = kitchenContent.replace(
  /<TouchableOpacity style=\{styles\.backBtn\} onPress=\{\(\) => navigation\.navigate\('Dashboard'\)\}>[\s\S]*?<\/TouchableOpacity>/,
  `<TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{marginRight: 15}}>
            <Image source={require('../../assets/logo.png')} style={{width: 120, height: 40, resizeMode: 'contain'}} />
          </TouchableOpacity>`
);
fs.writeFileSync(kitchenPath, kitchenContent);

// 4. CashCloseScreen.js (Wait, CashClose doesn't have the back button explicitly unless it's in the success screen)
const cashPath = path.join(dir, 'CashCloseScreen.js');
let cashContent = fs.readFileSync(cashPath, 'utf8');
if (!cashContent.includes('Image')) cashContent = cashContent.replace(/import \{ View, Text/, "import { View, Text, Image");
cashContent = cashContent.replace(
  /<TouchableOpacity style=\{styles\.submitBtn\} onPress=\{\(\) => navigation\.navigate\('Dashboard'\)\}>[\s\S]*?<\/TouchableOpacity>/,
  `<TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.submitBtnTxt}>Ir al Dashboard</Text>
              </TouchableOpacity>`
);
fs.writeFileSync(cashPath, cashContent);

console.log("Logos applied to manual back buttons");
