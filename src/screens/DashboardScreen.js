import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, SafeAreaView, Platform, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalSettings, globalCurrentUser } from '../store/mockDb';

const { width } = Dimensions.get('window');
const columns = width > 800 ? 5 : 3;


const ROLE_PERMISSIONS = {
  admin: ['Contacts', 'Billing', 'Kitchen', 'DailySales', 'Receivables', 'Payables', 'Recipes', 'InventoryHub', 'CashClose', 'Settings'],
  cashier: ['Billing', 'Kitchen', 'DailySales', 'CashClose', 'Contacts'],
  cook: ['Kitchen', 'Recipes']
};

const MODULES = [
  { id: '1', title: 'Contactos', icon: 'card-account-details-outline', colors: ['#00d49f', '#00b88a'], route: 'Contacts' },
  { id: '2', title: 'Facturación', icon: 'calculator', colors: ['#5d728e', '#4b5c73'], route: 'Billing' },
  { id: '10', title: 'Cocina (KDS)', icon: 'fire', colors: ['#ef4444', '#dc2626'], route: 'Kitchen' },
  { id: '11', title: 'Ventas Diarias', icon: 'chart-box-outline', colors: ['#0284c7', '#0369a1'], route: 'DailySales' },
  { id: '3', title: 'Cuentas por Cobrar', icon: 'account-multiple-outline', colors: ['#00e3af', '#00c396'], route: 'Receivables' },
  { id: '4', title: 'Cuentas por Pagar', icon: 'office-building-outline', colors: ['#ff6854', '#f54b35'], route: 'Payables' },
  { id: '6', title: 'Recetas', icon: 'pot-mix', colors: ['#f4b400', '#d99e00'], route: 'Recipes' },
  { id: '7', title: 'Inventario', icon: 'warehouse', colors: ['#2b3648', '#1f2735'], route: 'InventoryHub' },
  { id: '8', title: 'Caja y Cierres', icon: 'cash-register', colors: ['#ff9800', '#e68900'], route: 'CashClose' },
  { id: '9', title: 'Config.', icon: 'cog-outline', colors: ['#788597', '#626e7e'], route: 'Settings' },
];

export default function DashboardScreen({ navigation }) {
  const [tick, setTick] = React.useState(0);

  // Filtrar modulos segun el rol del usuario activo
  const allowedRoutes = ROLE_PERMISSIONS[globalCurrentUser.role] || ROLE_PERMISSIONS.admin;
  const filteredModules = MODULES.filter(m => allowedRoutes.includes(m.route));

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={[
          styles.touchable,
          Platform.OS === 'web' && { boxShadow: `0px 15px 30px ${item.colors[0]}60` },
          Platform.OS !== 'web' && { shadowColor: item.colors[0] }
        ]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate(item.route)}
      >
        <LinearGradient
          colors={item.colors}
          style={styles.iconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={item.icon} size={36} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ height: 120, width: 350, resizeMode: 'contain', marginBottom: 10 }} 
          />
          <Text style={styles.subtitleText}>Selecciona un módulo para comenzar a trabajar</Text>
        </View>

        
          {/* Grid Section */}
        <FlatList
          data={filteredModules}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={columns}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 60, // En lugar de centrar, dejamos un padding fijo arriba
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoBox: {
    backgroundColor: '#1f2a3a',
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(31, 42, 58, 0.4)' },
      default: { shadowColor: '#1f2a3a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 }
    })
  },
  logoBoxText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6c7a8f',
    marginBottom: 4,
  },
  brandText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1a1a24',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: '#8492a6',
  },
  listContainer: {
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'center',
    marginBottom: 40,
    gap: 50,
  },
  itemContainer: {
    alignItems: 'center',
    width: 100,
  },
  touchable: {
    borderRadius: 24,
    backgroundColor: 'transparent',
    ...Platform.select({
      default: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
      }
    })
  },
  iconBackground: {
    width: 90,
    height: 90,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    color: '#4a5568',
    fontWeight: '600',
    textAlign: 'center',
  },
});
