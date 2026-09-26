const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\navigation\\AppNavigator.js';
let content = fs.readFileSync(path, 'utf8');

// Add Image to react-native imports
if (!content.includes('Image')) {
  content = content.replace(/import { TouchableOpacity, View, Text, Platform } from 'react-native';/, "import { TouchableOpacity, View, Text, Platform, Image } from 'react-native';");
}

// Replace headerLeft
const oldHeaderLeftRegex = /headerLeft:\s*\(\)\s*=>\s*\([\s\S]*?RESTOSYS[\s\S]*?<\/TouchableOpacity>\s*\),/;
const newHeaderLeft = `headerLeft: () => (
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 15 }} 
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ height: 40, width: 140, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
          ),`;

content = content.replace(oldHeaderLeftRegex, newHeaderLeft);

// Change title from "RESTOSYS Lite" to "LAGO WOK ZHEN" everywhere in DashboardScreen.js
const dashPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(/RESTOSYS Lite/g, 'LAGO WOK ZHEN');
fs.writeFileSync(dashPath, dashContent);

fs.writeFileSync(path, content);
console.log("Logo updated");
