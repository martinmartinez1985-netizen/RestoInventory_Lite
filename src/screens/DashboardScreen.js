import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, SafeAreaView, Platform, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalSettings, globalCurrentUser, getUserPermissions } from '../store/mockDb';

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
  const isFocused = useIsFocused();
  const [tick, setTick] = React.useState(0);
  const { width } = useWindowDimensions();

  // Detección automática de dispositivo móvil / tablet / escritorio
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 950;
  const columns = width > 950 ? 5 : width > 550 ? 3 : 2;

  React.useEffect(() => {
    if (isFocused) {
      setTick(t => t + 1);
    }
  }, [isFocused]);

  // Filtrar modulos segun los permisos especificos asignados al usuario activo
  const allowedRoutes = getUserPermissions(globalCurrentUser);
  const filteredModules = MODULES.filter(m => allowedRoutes.includes(m.route));

  const roleLabels = {
    owner: { label: 'Control del Sistema', color: '#e11d48', bg: '#ffe4e6', icon: 'shield-crown' },
    admin: { label: 'Administrador / Gerente', color: '#8b5cf6', bg: '#f5f3ff', icon: 'shield-account' },
    cashier: { label: 'Cajero / POS', color: '#0284c7', bg: '#f0f9ff', icon: 'cash-register' },
    cook: { label: 'Cocinero / Chef', color: '#d97706', bg: '#fffbeb', icon: 'chef-hat' }
  };
  const currentRole = roleLabels[globalCurrentUser.role] || roleLabels.cashier;

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, isMobile && { width: (width - 60) / columns }]}>
      <TouchableOpacity 
        style={[
          styles.touchable,
          Platform.OS === 'web' && { boxShadow: `0px 12px 24px ${item.colors[0]}50` },
          Platform.OS !== 'web' && { shadowColor: item.colors[0] }
        ]} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate(item.route)}
      >
        <LinearGradient
          colors={item.colors}
          style={[styles.iconBackground, isMobile && { width: 72, height: 72, borderRadius: 20, marginBottom: 10 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={item.icon} size={isMobile ? 30 : 36} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      <Text style={[styles.title, isMobile && { fontSize: 12 }]}>{item.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isMobile && { paddingTop: 20 }]}>
        
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, isMobile && { marginBottom: 20 }]}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ 
              height: isMobile ? 65 : 110, 
              width: isMobile ? 210 : 330, 
              resizeMode: 'contain', 
              marginBottom: isMobile ? 8 : 14 
            }} 
          />
          
          {/* Badge del Usuario Actual */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: currentRole.bg,
            borderWidth: 1,
            borderColor: currentRole.color + '40',
            paddingHorizontal: isMobile ? 12 : 16,
            paddingVertical: isMobile ? 5 : 7,
            borderRadius: 25,
            marginBottom: isMobile ? 6 : 10,
            gap: 6
          }}>
            <MaterialCommunityIcons name={currentRole.icon} size={isMobile ? 15 : 18} color={currentRole.color} />
            <Text style={{ fontSize: isMobile ? 11 : 13, color: '#334155', fontWeight: 'bold' }}>
              Operador:{' '}
              <Text style={{ color: currentRole.color, fontWeight: '900' }}>
                {globalCurrentUser.name}
              </Text>{' '}
              ({currentRole.label})
            </Text>
          </View>

          <Text style={[styles.subtitleText, isMobile && { fontSize: 12, paddingHorizontal: 15, textAlign: 'center' }]}>
            {filteredModules.length > 0
              ? `Acceso a ${filteredModules.length} de ${MODULES.length} módulos habilitados para tu usuario.`
              : 'No tienes módulos asignados. Contacta al Administrador.'}
          </Text>
        </View>

        {/* Grid Section - Scrollable and Mobile-Optimized */}
        {filteredModules.length > 0 ? (
          <FlatList
            key={`grid-cols-${columns}`}
            data={filteredModules}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={columns}
            contentContainerStyle={[styles.listContainer, { paddingBottom: isMobile ? 80 : 50 }]}
            columnWrapperStyle={[styles.columnWrapper, isMobile && { gap: 16, marginBottom: 18 }]}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={{ alignItems: 'center', marginTop: 40, padding: 30, backgroundColor: '#fef2f2', borderRadius: 16, borderWidth: 1, borderColor: '#fca5a5' }}>
            <MaterialCommunityIcons name="lock-alert" size={48} color="#ef4444" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#991b1b', marginBottom: 6 }}>
              Sin Módulos Habilitados
            </Text>
            <Text style={{ fontSize: 13, color: '#b91c1c', textAlign: 'center', maxWidth: 380 }}>
              Tu usuario no tiene módulos activos asignados en su perfil. Pide a un Administrador que configure tus permisos en Configuración ➡️ Usuarios.
            </Text>
          </View>
        )}
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
    paddingTop: 45,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitleText: {
    fontSize: 14,
    color: '#8492a6',
  },
  listContainer: {
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'center',
    marginBottom: 35,
    gap: 45,
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

