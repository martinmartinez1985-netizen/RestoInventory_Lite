import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, Platform, Image, TextInput, useWindowDimensions } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalSettings, globalCurrentUser, updateExchangeRate } from '../store/mockDb';
import PinLoginModal from '../components/PinLoginModal';

import DashboardScreen from '../screens/DashboardScreen';
import InventoryHubScreen from '../screens/InventoryHubScreen';
import RawMaterialsScreen from '../screens/RawMaterialsScreen';
import WipScreen from '../screens/WipScreen';
import FinishedGoodsScreen from '../screens/FinishedGoodsScreen';
import ProductionScreen from '../screens/ProductionScreen';
import CashCloseScreen from '../screens/CashCloseScreen';
import DailySalesScreen from '../screens/DailySalesScreen';
import SettingsScreen from '../screens/SettingsScreen';

import OperationsScreen from '../screens/OperationsScreen';
import CostingScreen from '../screens/CostingScreen';
import BillingScreen from '../screens/BillingScreen';
import PosOrderingScreen from '../screens/PosOrderingScreen';
import KitchenScreen from '../screens/KitchenScreen';
import SuppliersScreen from '../screens/SuppliersScreen';

import ContactsMenuScreen from '../screens/ContactsMenuScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import ReceivablesMenuScreen from '../screens/ReceivablesMenuScreen';
import ReceivablesScreen from '../screens/ReceivablesScreen';
import PayablesMenuScreen from '../screens/PayablesMenuScreen';
import PayablesScreen from '../screens/PayablesScreen';
import CollectionModuleScreen from '../screens/CollectionModuleScreen';
import RecipesMenuScreen from '../screens/RecipesMenuScreen';
import IngredientCatalogScreen from '../screens/IngredientCatalogScreen';
import PurchasesScreen from '../screens/PurchasesScreen';
import RecipeCreatorScreen from '../screens/RecipeCreatorScreen';


const Stack = createNativeStackNavigator();

function PlaceholderScreen({ route }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <Text style={{ fontSize: 20 }}>Módulo: {route.name}</Text>
      <Text style={{ color: '#888', marginTop: 10 }}>En construcción...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 480;
  const [isLocked, setIsLocked] = useState(true);
  const [rateText, setRateText] = useState(globalSettings.exchangeRate || '');
  const [, setHeaderTick] = useState(0);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const onRateChange = (e) => {
      const current = e?.detail || globalSettings.exchangeRate;
      if (current !== undefined && current !== null && current !== '') {
        setRateText(current.toString());
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('RESTOSYS_RATE_CHANGED', onRateChange);
      window.addEventListener('RESTOSYS_DATA_SYNCED', onRateChange);
      return () => {
        window.removeEventListener('RESTOSYS_RATE_CHANGED', onRateChange);
        window.removeEventListener('RESTOSYS_DATA_SYNCED', onRateChange);
      };
    }
  }, []);

  const handleUnlock = (user) => {
    setIsLocked(false);
    setRateText(globalSettings.exchangeRate || '');
    setHeaderTick(t => t + 1);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Dashboard');
    }
  };

  const handleLockSession = () => {
    setIsLocked(true);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Dashboard');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName="Dashboard"
          screenOptions={({ navigation }) => ({
            headerTitle: '', // Se usa headerLeft en lugar de headerTitle para pegarlo a la izquierda
            headerLeft: () => (
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginLeft: isSmallMobile ? 6 : 15 }} 
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Image 
                  source={require('../../assets/logo.png')} 
                  style={{ height: isSmallMobile ? 30 : 40, width: isSmallMobile ? 95 : 140, resizeMode: 'contain' }} 
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: isSmallMobile ? 6 : 15, gap: isSmallMobile ? 6 : 10 }}>
                
                {/* Tasa del Día Pill */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: '#e6f4ea', 
                  paddingHorizontal: isSmallMobile ? 6 : 10, 
                  paddingVertical: isSmallMobile ? 3 : 4, 
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#a7f3d0'
                }}>
                  <MaterialCommunityIcons name="currency-usd" size={isSmallMobile ? 12 : 14} color="#10b981" />
                  {!isSmallMobile && (
                    <Text style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold', marginLeft: 2 }}>TASA:</Text>
                  )}
                  <TextInput 
                    style={{ fontSize: isSmallMobile ? 12 : 13, fontWeight: 'bold', color: '#047857', minWidth: isSmallMobile ? 36 : 45, outlineStyle: 'none', marginLeft: 2}}
                    value={rateText}
                    onChangeText={(val) => {
                      setRateText(val);
                      updateExchangeRate(val);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>

                {/* Dropdown sucursal - oculto en modo celular */}
                {!isMobile && (
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#f4f6f8', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6, 
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#e2e8f0'
                  }}>
                    <MaterialCommunityIcons name="office-building" size={16} color="#6c7a8f" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, color: '#6c7a8f', fontWeight: '600', marginRight: 6 }}>
                      PRINCIPAL (2026)
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#6c7a8f" />
                  </View>
                )}

                {/* Botón Usuario Activo / Cambiar */}
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    paddingHorizontal: isSmallMobile ? 6 : 10,
                    paddingVertical: isSmallMobile ? 4 : 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#cbd5e1'
                  }}
                  onPress={handleLockSession}
                  title="Clic para cambiar operador o bloquear sesión"
                >
                  <View style={{
                    backgroundColor: globalCurrentUser?.role === 'owner' ? '#e11d48' : globalCurrentUser?.role === 'admin' ? '#8b5cf6' : globalCurrentUser?.role === 'cook' ? '#d97706' : '#0284c7',
                    width: isSmallMobile ? 22 : 24,
                    height: isSmallMobile ? 22 : 24,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: isSmallMobile ? 0 : 6
                  }}>
                    <MaterialCommunityIcons 
                      name={globalCurrentUser?.role === 'owner' ? 'shield-crown' : globalCurrentUser?.role === 'admin' ? 'shield-account' : globalCurrentUser?.role === 'cook' ? 'chef-hat' : 'account'} 
                      size={isSmallMobile ? 12 : 14} 
                      color="#ffffff" 
                    />
                  </View>
                  {!isSmallMobile && (
                    <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: 'bold' }}>
                      {globalCurrentUser?.role === 'owner' ? '🛡️ Sistema' : (globalCurrentUser?.name || 'Usuario').split(' ')[0]}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Botón Salir / Bloquear */}
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#fee2e2', 
                    paddingHorizontal: isSmallMobile ? 8 : 10, 
                    paddingVertical: isSmallMobile ? 5 : 6, 
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#fca5a5'
                  }}
                  onPress={handleLockSession}
                >
                  <MaterialCommunityIcons name="lock-outline" size={14} color="#ef4444" style={!isSmallMobile ? { marginRight: 4 } : {}} />
                  {!isSmallMobile && (
                    <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: 'bold' }}>Bloquear</Text>
                  )}
                </TouchableOpacity>

              </View>
            ),
            headerStyle: { backgroundColor: '#ffffff' },
            headerShadowVisible: true,
            headerTintColor: '#1a1a24',
          })}
        >
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
        />
        <Stack.Screen name="InventoryHub" component={InventoryHubScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RawMaterials" component={RawMaterialsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Wip" component={WipScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FinishedGoods" component={FinishedGoodsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Production" component={ProductionScreen} options={{ headerShown: false }} />

        <Stack.Screen 
          name="Accounting" 
          component={CostingScreen} 
        />
        <Stack.Screen name="Billing" component={BillingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PosOrdering" component={PosOrderingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Kitchen" component={KitchenScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Contacts" 
          component={ContactsMenuScreen} 
        />
        <Stack.Screen 
          name="Directory" 
          component={DirectoryScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Receivables" 
          component={ReceivablesMenuScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ReceivablesLedger" 
          component={ReceivablesScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Payables" 
          component={PayablesMenuScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PayablesLedger" 
          component={PayablesScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CollectionModule" 
          component={CollectionModuleScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Recipes" component={RecipesMenuScreen} options={{ headerShown: false }} />
        <Stack.Screen name="IngredientCatalog" component={IngredientCatalogScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Purchases" component={PurchasesScreen} options={{ headerShown: false }} />
                <Stack.Screen name="RecipeCreator" component={RecipeCreatorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CashClose" component={CashCloseScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DailySales" component={DailySalesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Reports" component={PlaceholderScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    <PinLoginModal 
      visible={isLocked} 
      onUnlock={handleUnlock} 
    />
  </View>
  );
}
