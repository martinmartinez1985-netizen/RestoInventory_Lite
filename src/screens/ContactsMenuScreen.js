import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const columns = width > 800 ? 5 : 2;

const SUB_MODULES = [
  { 
    id: '1', 
    title: 'Clientes', 
    subtitle: 'Gestión de clientes y cuentas por cobrar',
    icon: 'account-group-outline', 
    colors: ['#3b82f6', '#2563eb'], 
    route: 'ClientsList' 
  },
  { 
    id: '2', 
    title: 'Proveedores', 
    subtitle: 'Gestión de proveedores y cuentas por pagar',
    icon: 'truck-fast-outline', 
    colors: ['#ef4444', '#dc2626'], 
    route: 'SupplierList' 
  },
  { 
    id: '3', 
    title: 'Intercompañías', 
    subtitle: 'Relaciones y saldos entre empresas del grupo',
    icon: 'domain', 
    colors: ['#f59e0b', '#d97706'], 
    route: 'Intercompanies' 
  },
  { 
    id: '4', 
    title: 'Accionistas', 
    subtitle: 'Control de socios y dividendos',
    icon: 'account-tie-outline', 
    colors: ['#10b981', '#059669'], 
    route: 'Shareholders' 
  },
  { 
    id: '5', 
    title: 'Empleados / Colaboradores', 
    subtitle: 'Gestión de nómina, vendedores y aliados',
    icon: 'card-account-details-outline', 
    colors: ['#d946ef', '#c026d3'], 
    route: 'Employees' 
  },
];

export default function ContactsMenuScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.cardContainer} 
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate('Directory', { initialTab: item.title });
      }}
    >
      <View style={[
        styles.iconShadowWrapper,
        Platform.OS === 'web' && { boxShadow: `0px 10px 20px ${item.colors[0]}60` },
        Platform.OS !== 'web' && { shadowColor: item.colors[0] }
      ]}>
        <LinearGradient
          colors={item.colors}
          style={styles.iconBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={item.icon} size={28} color="#fff" />
        </LinearGradient>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="card-account-details-outline" size={28} color="#4a5568" />
          </View>
          <Text style={styles.titleText}>Directorio de Contactos</Text>
          <Text style={styles.subtitleText}>Gestión centralizada de entidades y personas</Text>
        </View>

        {/* Cards Grid */}
        <FlatList
          data={SUB_MODULES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={columns}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  headerIconBox: {
    backgroundColor: '#ffffff',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 15,
    color: '#64748b',
  },
  listContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
    flexWrap: 'wrap',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    width: 200,
    height: 240,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.04)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 }
    })
  },
  iconShadowWrapper: {
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    ...Platform.select({
      default: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 }
    })
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
