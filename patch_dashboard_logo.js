const fs = require('fs');
const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\DashboardScreen.js';
let content = fs.readFileSync(path, 'utf8');

const oldHeader = /<View style=\{\{ alignItems: 'flex-start', marginBottom: 40 \}\}>[\s\S]*?<\/View>/;
const newHeader = `<View style={{ alignItems: 'flex-start', marginBottom: 40 }}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ height: 80, width: 280, resizeMode: 'contain', marginBottom: 15 }} 
          />
          <Text style={styles.subtitleText}>Selecciona un módulo para comenzar a trabajar</Text>
        </View>`;

content = content.replace(oldHeader, newHeader);

// make sure Image is imported
if (!content.includes('import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from \'react-native\'')) {
  content = content.replace(/import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';/, "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Image } from 'react-native';");
}

fs.writeFileSync(path, content);
console.log("Dashboard updated with logo");
