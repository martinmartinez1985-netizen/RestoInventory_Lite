import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  Platform,
  Image,
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  globalUsers, 
  globalCurrentUser, 
  globalMasterConfig, 
  addUser, 
  updateUser, 
  deleteUser, 
  setCurrentUser, 
  updateMasterPin, 
  executeMasterWipe,
  ALL_MODULE_KEYS,
  getUserPermissions,
  DEFAULT_PERMISSIONS
} from '../store/mockDb';
import { getSupabaseConfig, testSupabaseConnection, reloadSupabaseClient } from '../config/supabase';
import { supabaseService } from '../services/supabaseService';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#0ea5e9',
  primaryDark: '#0284c7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

const ROLE_INFO = {
  admin: {
    label: 'Administrador',
    icon: 'crown',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    desc: 'Acceso total a finanzas, inventarios, recetas, configuración y borrado.'
  },
  cashier: {
    label: 'Cajero',
    icon: 'cash-register',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    desc: 'Acceso a Facturación POS, Ventas Diarias, Cierres de Caja y Clientes.'
  },
  cook: {
    label: 'Cocinero',
    icon: 'chef-hat',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    desc: 'Acceso exclusivo a Pantalla de Cocina (KDS) y consulta de recetas.'
  }
};

export default function SettingsScreen({ navigation }) {
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  // Tab activo
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'security', 'danger'

  // Modal Crear / Editar Usuario
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPin, setNewUserPin] = useState('');
  const [newUserRole, setNewUserRole] = useState('cashier');
  const [userPermissions, setUserPermissions] = useState([]);

  // Modal Cambiar Clave Maestra
  const [currentMasterPin, setCurrentMasterPin] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');

  // Modal Confirmación Borrado Maestro
  const [isWipeModalVisible, setIsWipeModalVisible] = useState(false);
  const [wipeType, setWipeType] = useState('sales'); // 'sales' o 'factory'
  const [inputMasterPin, setInputMasterPin] = useState('');

  // Ver PIN de usuario en lista
  const [revealedPins, setRevealedPins] = useState({});
  // Estados de Supabase
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

  const [isPinging, setIsPinging] = useState(false);
  const handleTestPing = async () => {
    if (!isSupaConnected) {
      alert("Primero presione 'Probar Conexión y Guardar' para validar sus credenciales.");
      return;
    }
    setIsPinging(true);
    try {
      const res = await supabaseService.testPingRecord();
      alert(`🎉 ¡Prueba en Vivo Exitosa!\n\nSe insertó y leyó directamente de la tabla 'customers' de tu Supabase:\n\n• ID: ${res.testCustomer.id}\n• Nombre: ${res.testCustomer.name}\n• Cédula: ${res.testCustomer.doc_id}\n\nPuedes abrir tu Supabase ➡️ Table Editor ➡️ customers y verás este registro en vivo.`);
    } catch (err) {
      alert("Error en la prueba en vivo: " + err.message);
    } finally {
      setIsPinging(false);
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
      alert(`¡Migración a Supabase completada con éxito!\n\n• Clientes subidos: ${res.customers}\n• Platos/Recetas subidas: ${res.recipes}\n• Materias primas: ${res.materials}\n• Facturas/Órdenes: ${res.orders}\n• Usuarios: ${res.users}`);
    } catch (err) {
      alert("Error durante la migración: " + err.message);
    } finally {
      setIsMigratingSupa(false);
    }
  };

  const togglePinReveal = (id) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenNewUser = () => {
    setEditingUserId(null);
    setNewUserName('');
    setNewUserLogin('');
    setNewUserPin('');
    setNewUserRole('cashier');
    setUserPermissions([...(DEFAULT_PERMISSIONS.cashier || [])]);
    setIsUserModalVisible(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUserId(user.id);
    setNewUserName(user.name);
    setNewUserLogin(user.username);
    setNewUserPin(user.pin);
    setNewUserRole(user.role);
    setUserPermissions([...getUserPermissions(user)]);
    setIsUserModalVisible(true);
  };

  const handleRoleChangeInModal = (roleKey) => {
    setNewUserRole(roleKey);
    setUserPermissions([...(DEFAULT_PERMISSIONS[roleKey] || [])]);
  };

  const togglePermission = (key) => {
    setUserPermissions(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectAllPermissions = () => {
    setUserPermissions(ALL_MODULE_KEYS.map(m => m.key));
  };

  const handleClearPermissions = () => {
    setUserPermissions([]);
  };

  // Guardar usuario (Nuevo o Editado)
  const handleSaveUser = () => {
    if (!newUserName.trim() || !newUserLogin.trim() || !newUserPin.trim()) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    if (newUserPin.trim().length < 4) {
      alert("El PIN debe tener al menos 4 dígitos numéricos.");
      return;
    }

    try {
      if (editingUserId) {
        updateUser({
          id: editingUserId,
          name: newUserName.trim(),
          username: newUserLogin.trim().toLowerCase(),
          pin: newUserPin.trim(),
          role: newUserRole,
          permissions: userPermissions
        });
        alert("Usuario y permisos actualizados exitosamente.");
      } else {
        addUser({
          name: newUserName.trim(),
          username: newUserLogin.trim().toLowerCase(),
          pin: newUserPin.trim(),
          role: newUserRole,
          permissions: userPermissions
        });
        alert("Usuario creado exitosamente.");
      }
      setIsUserModalVisible(false);
      setEditingUserId(null);
      setNewUserName('');
      setNewUserLogin('');
      setNewUserPin('');
      setNewUserRole('cashier');
      setUserPermissions([]);
      refresh();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = (userId) => {
    if (window.confirm("¿Está seguro de que desea eliminar este usuario?")) {
      try {
        deleteUser(userId);
        refresh();
        alert("Usuario eliminado.");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Cambiar usuario activo
  const handleSwitchUser = (userId) => {
    setCurrentUser(userId);
    refresh();
    alert(`Sesión cambiada a: ${globalCurrentUser.name} (${ROLE_INFO[globalCurrentUser.role]?.label})`);
  };

  // Actualizar Clave Maestra
  const handleUpdateMasterPin = () => {
    try {
      updateMasterPin(currentMasterPin, newMasterPin);
      setCurrentMasterPin('');
      setNewMasterPin('');
      refresh();
      alert("Clave Maestra actualizada con éxito.");
    } catch (err) {
      alert(err.message);
    }
  };

  // Abrir diálogo de borrado
  const openWipeDialog = (type) => {
    setWipeType(type);
    setInputMasterPin('');
    setIsWipeModalVisible(true);
  };

  // Confirmar y ejecutar borrado
  const handleConfirmWipe = () => {
    try {
      const res = executeMasterWipe(wipeType, inputMasterPin);
      setIsWipeModalVisible(false);
      setInputMasterPin('');
      refresh();
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const currentRoleConfig = ROLE_INFO[globalCurrentUser.role] || ROLE_INFO.admin;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header Superior */}
        <View style={styles.topHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Dashboard')} 
              style={styles.logoBtn}
            >
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: 130, height: 40, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.moduleTitle}>Configuración del Sistema</Text>
              <Text style={styles.moduleSubtitle}>Gestión de usuarios, control de roles y mantenimiento maestro</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.dashboardBtn} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialCommunityIcons name="home-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.dashboardBtnText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.mainScroll} contentContainerStyle={{ padding: 25 }}>
          
          {/* Banner de Sesión Activa */}
          <View style={[styles.activeUserBanner, { borderLeftColor: currentRoleConfig.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <View style={[styles.activeUserIconBox, { backgroundColor: currentRoleConfig.bgColor }]}>
                <MaterialCommunityIcons name={currentRoleConfig.icon} size={28} color={currentRoleConfig.color} />
              </View>
              <View>
                <Text style={styles.activeUserPre}>SESIÓN ACTIVA ACTUALMENTE:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                  <Text style={styles.activeUserName}>{globalCurrentUser.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: currentRoleConfig.bgColor, borderColor: currentRoleConfig.borderColor }]}>
                    <Text style={[styles.roleBadgeText, { color: currentRoleConfig.color }]}>
                      {currentRoleConfig.label.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activeUserDesc}>{currentRoleConfig.desc}</Text>
              </View>
            </View>
          </View>

          {/* Navegación de Pestañas */}
          <View style={styles.tabsHeader}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'users' && styles.tabBtnActive]}
              onPress={() => setActiveTab('users')}
            >
              <MaterialCommunityIcons 
                name="account-group" 
                size={18} 
                color={activeTab === 'users' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'users' && styles.tabBtnTextActive]}>
                Usuarios y Permisos ({globalUsers.length})
              </Text>
            </TouchableOpacity>

                        <TouchableOpacity 
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
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabBtn, activeTab === 'security' && styles.tabBtnActive]}
              onPress={() => setActiveTab('security')}
            >
              <MaterialCommunityIcons 
                name="shield-key-outline" 
                size={18} 
                color={activeTab === 'security' ? COLORS.primary : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'security' && styles.tabBtnTextActive]}>
                Clave Maestra
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 'danger' && styles.tabBtnActiveDanger]}
              onPress={() => setActiveTab('danger')}
            >
              <MaterialCommunityIcons 
                name="alert-octagon-outline" 
                size={18} 
                color={activeTab === 'danger' ? COLORS.danger : COLORS.textMuted} 
                style={{ marginRight: 6 }} 
              />
              <Text style={[styles.tabBtnText, activeTab === 'danger' && { color: COLORS.danger, fontWeight: '800' }]}>
                Borrado General (Peligro)
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: USUARIOS Y PERMISOS */}
          {activeTab === 'users' && (
            <View>
              {/* Barra superior de usuarios */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Directorio de Operadores</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Haz clic en "Cambiar Sesión" para simular o cambiar el rol de trabajo</Text>
                </View>

                <TouchableOpacity 
                  style={styles.newUserBtn}
                  onPress={handleOpenNewUser}
                >
                  <MaterialCommunityIcons name="account-plus" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.newUserBtnText}>Nuevo Usuario</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de Usuarios */}
              <View style={{ gap: 12, marginBottom: 30 }}>
                {globalUsers.map(user => {
                  const roleConfig = ROLE_INFO[user.role] || ROLE_INFO.cashier;
                  const isActive = globalCurrentUser.id === user.id;
                  const isPinRevealed = !!revealedPins[user.id];
                  const userPerms = getUserPermissions(user);

                  return (
                    <View key={user.id} style={[styles.userCard, isActive && styles.userCardActive]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View style={[styles.userAvatar, { backgroundColor: roleConfig.bgColor }]}>
                          <MaterialCommunityIcons name={roleConfig.icon} size={24} color={roleConfig.color} />
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.userName}>{user.name}</Text>
                            {isActive && (
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>EN USO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.userUsername}>@{user.username}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                            <MaterialCommunityIcons name="shield-check-outline" size={13} color="#059669" />
                            <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>
                              {userPerms.length} de {ALL_MODULE_KEYS.length} módulos habilitados
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        {/* Rol */}
                        <View style={[styles.roleBadge, { backgroundColor: roleConfig.bgColor, borderColor: roleConfig.borderColor }]}>
                          <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>
                            {roleConfig.label.toUpperCase()}
                          </Text>
                        </View>

                        {/* PIN */}
                        <TouchableOpacity 
                          style={styles.pinWrapper}
                          onPress={() => togglePinReveal(user.id)}
                          title="Haga clic para revelar/ocultar PIN"
                        >
                          <Text style={styles.pinLabel}>PIN:</Text>
                          <Text style={styles.pinText}>{isPinRevealed ? user.pin : '••••'}</Text>
                          <MaterialCommunityIcons 
                            name={isPinRevealed ? "eye-off-outline" : "eye-outline"} 
                            size={14} 
                            color={COLORS.textMuted} 
                            style={{ marginLeft: 4 }} 
                          />
                        </TouchableOpacity>

                        {/* Botón Editar Usuario y Permisos */}
                        <TouchableOpacity 
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#e0f2fe',
                            borderWidth: 1,
                            borderColor: '#7dd3fc',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8
                          }}
                          onPress={() => handleOpenEditUser(user)}
                        >
                          <MaterialCommunityIcons name="pencil-outline" size={15} color="#0284c7" style={{ marginRight: 4 }} />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0284c7' }}>Editar</Text>
                        </TouchableOpacity>

                        {/* Botones de acción */}
                        {!isActive ? (
                          <TouchableOpacity 
                            style={styles.switchUserBtn}
                            onPress={() => handleSwitchUser(user.id)}
                          >
                            <MaterialCommunityIcons name="swap-horizontal" size={16} color="#0284c7" />
                            <Text style={styles.switchUserText}>Cambiar Sesión</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.currentIndicator}>
                            <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                            <Text style={styles.currentIndicatorText}>Sesión Actual</Text>
                          </View>
                        )}

                        {!isActive && globalUsers.length > 1 && (
                          <TouchableOpacity 
                            style={styles.deleteUserBtn}
                            onPress={() => handleDeleteUser(user.id)}
                            title="Eliminar usuario"
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Guía de Permisos por Rol */}
              <View style={styles.guideCard}>
                <Text style={styles.guideTitle}>Matriz de Permisos por Rol de Trabajo</Text>
                <View style={styles.guideGrid}>
                  
                  <View style={[styles.guideCol, { borderTopColor: '#8b5cf6' }]}>
                    <Text style={[styles.guideRoleName, { color: '#8b5cf6' }]}>👑 Administrador</Text>
                    <Text style={styles.guideRoleSub}>Control gerencial total</Text>
                    <View style={{ gap: 6, marginTop: 10 }}>
                      <Text style={styles.guideItemOk}>✔ Acceso total a los 10 módulos</Text>
                      <Text style={styles.guideItemOk}>✔ Finanzas, Cuentas por Cobrar/Pagar</Text>
                      <Text style={styles.guideItemOk}>✔ Ajuste de Recetas, Costos e Inventario</Text>
                      <Text style={styles.guideItemOk}>✔ Creación de Usuarios y Clave Maestra</Text>
                      <Text style={styles.guideItemOk}>✔ Ejecución de Borrado General</Text>
                    </View>
                  </View>

                  <View style={[styles.guideCol, { borderTopColor: '#0284c7' }]}>
                    <Text style={[styles.guideRoleName, { color: '#0284c7' }]}>💵 Cajero</Text>
                    <Text style={styles.guideRoleSub}>Operación comercial y cobro</Text>
                    <View style={{ gap: 6, marginTop: 10 }}>
                      <Text style={styles.guideItemOk}>✔ Punto de Venta (POS) y Comandas</Text>
                      <Text style={styles.guideItemOk}>✔ Monitor de Ventas Diarias</Text>
                      <Text style={styles.guideItemOk}>✔ Cierre de Caja y Arqueo Z</Text>
                      <Text style={styles.guideItemOk}>✔ Directorio de Clientes</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Recetas y Costos</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Cuentas por Pagar</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Configuración y Borrado</Text>
                    </View>
                  </View>

                  <View style={[styles.guideCol, { borderTopColor: '#d97706' }]}>
                    <Text style={[styles.guideRoleName, { color: '#d97706' }]}>🍳 Cocinero</Text>
                    <Text style={styles.guideRoleSub}>Preparación y despacho</Text>
                    <View style={{ gap: 6, marginTop: 10 }}>
                      <Text style={styles.guideItemOk}>✔ Pantalla de Cocina (KDS)</Text>
                      <Text style={styles.guideItemOk}>✔ Consulta de Recetas y Platos</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Facturación y Cobros</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Cierres de Caja</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Dinero y Reportes</Text>
                      <Text style={styles.guideItemNo}>✖ Bloqueado: Configuración</Text>
                    </View>
                  </View>

                </View>
              </View>

            </View>
          )}

                    {/* TAB 4: NUBE SUPABASE */}
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
                        {isTestingSupa ? 'Conectando...' : 'Guardar Conexión'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.saveMasterPinBtn, { flex: 1.3, backgroundColor: isSupaConnected ? '#8b5cf6' : '#64748b' }]}
                      onPress={handleTestPing}
                      disabled={!isSupaConnected || isPinging}
                    >
                      <MaterialCommunityIcons name="database-check" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveMasterPinBtnText}>
                        {isPinging ? 'Probando...' : '🧪 Probar con 1 Registro Limpio'}
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


          {/* TAB 2: CLAVE MAESTRA */}
          {activeTab === 'security' && (
            <View style={{ maxWidth: 600 }}>
              <View style={styles.securityCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                  <View style={[styles.activeUserIconBox, { backgroundColor: '#fef3c7' }]}>
                    <MaterialCommunityIcons name="shield-lock" size={26} color="#d97706" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Clave Maestra de Seguridad</Text>
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Protege las operaciones de borrado y reinicio del sistema</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 20 }}>
                  La Clave Maestra es el código de autorización requerido para ejecutar acciones destructivas (como el borrado de ventas o el reinicio de fábrica). Por defecto es <Text style={{ fontWeight: 'bold', color: COLORS.text }}>ZHEN2026</Text>.
                </Text>

                <View style={{ gap: 15 }}>
                  <View>
                    <Text style={styles.formLabel}>CLAVE MAESTRA ACTUAL:</Text>
                    <TextInput 
                      style={styles.formInput}
                      value={currentMasterPin}
                      onChangeText={setCurrentMasterPin}
                      placeholder="Ingrese la clave actual..."
                      secureTextEntry
                    />
                  </View>

                  <View>
                    <Text style={styles.formLabel}>NUEVA CLAVE MAESTRA:</Text>
                    <TextInput 
                      style={styles.formInput}
                      value={newMasterPin}
                      onChangeText={setNewMasterPin}
                      placeholder="Mínimo 4 caracteres..."
                      secureTextEntry
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.saveMasterPinBtn}
                    onPress={handleUpdateMasterPin}
                  >
                    <MaterialCommunityIcons name="content-save-check" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveMasterPinBtnText}>Guardar Nueva Clave Maestra</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: ZONA DE PELIGRO / BORRADO GENERAL */}
          {activeTab === 'danger' && (
            <View style={{ maxWidth: 750 }}>
              
              <View style={styles.dangerAlertBanner}>
                <MaterialCommunityIcons name="alert" size={28} color="#b91c1c" />
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={styles.dangerAlertTitle}>ZONA DE ALTO RIESGO / REINICIO DEL SISTEMA</Text>
                  <Text style={styles.dangerAlertSub}>
                    Las operaciones de esta sección eliminan registros de la base de datos local. Solo el Administrador autorizado con la Clave Maestra puede ejecutarlas.
                  </Text>
                </View>
              </View>

              <View style={{ gap: 20 }}>
                
                {/* Opción 1: Reinicio de Ventas y Turnos */}
                <View style={styles.wipeCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 20 }}>
                      <Text style={styles.wipeCardTitle}>1. Reiniciar Ventas, Comandas y Turnos</Text>
                      <Text style={styles.wipeCardDesc}>
                        Limpia todas las órdenes activas del POS, el historial completo de ventas facturadas, los arqueos de caja y los Reportes Z. 
                      </Text>
                      <Text style={[styles.wipeCardNote, { color: '#047857' }]}>
                        ✔ Mantiene intactos: Catálogo de productos, recetas, almacén de materias primas y directorio de clientes.
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.wipeActionBtnOrange}
                      onPress={() => openWipeDialog('sales')}
                    >
                      <MaterialCommunityIcons name="receipt-text-remove" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.wipeActionBtnText}>Reiniciar Ventas</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Opción 2: Reinicio Total de Fábrica */}
                <View style={[styles.wipeCard, { borderColor: '#fecaca', backgroundColor: '#fff5f5' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 20 }}>
                      <Text style={[styles.wipeCardTitle, { color: '#b91c1c' }]}>2. Borrado Total de Fábrica (Factory Reset)</Text>
                      <Text style={styles.wipeCardDesc}>
                        Elimina por completo el almacenamiento local del navegador (`localStorage`). El sistema se reiniciará como si recién hubiese sido instalado desde cero.
                      </Text>
                      <Text style={[styles.wipeCardNote, { color: '#b91c1c' }]}>
                        ⚠ ADVERTENCIA: Esta acción es irreversible. Se perderán todos los datos personalizados.
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.wipeActionBtnRed}
                      onPress={() => openWipeDialog('factory')}
                    >
                      <MaterialCommunityIcons name="nuke" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.wipeActionBtnText}>Borrado Total</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>

            </View>
          )}

        </ScrollView>

        {/* MODAL CREAR / EDITAR USUARIO Y PERMISOS */}
        <Modal visible={isUserModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: 560, maxHeight: '90%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons 
                    name={editingUserId ? "account-edit-outline" : "account-plus"} 
                    size={24} 
                    color={COLORS.primary} 
                  />
                  <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>
                    {editingUserId ? 'Editar Usuario y Permisos' : 'Crear Nuevo Usuario'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsUserModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                <View>
                  <Text style={styles.formLabel}>NOMBRE COMPLETO:</Text>
                  <TextInput 
                    style={styles.formInput}
                    placeholder="Ej. Juan Pérez"
                    value={newUserName}
                    onChangeText={setNewUserName}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>USUARIO / LOGIN:</Text>
                    <TextInput 
                      style={styles.formInput}
                      placeholder="Ej. juanp"
                      value={newUserLogin}
                      onChangeText={setNewUserLogin}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>PIN DE ACCESO (MÍN. 4 DÍGITOS):</Text>
                    <TextInput 
                      style={styles.formInput}
                      placeholder="Ej. 1234"
                      value={newUserPin}
                      onChangeText={setNewUserPin}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.formLabel}>ROL DEL USUARIO (PLANTILLA BASE):</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { key: 'cashier', label: 'Cajero', icon: 'cash-register' },
                      { key: 'cook', label: 'Cocinero', icon: 'chef-hat' },
                      { key: 'admin', label: 'Admin', icon: 'crown' }
                    ].map(r => (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.roleSelectBtn, newUserRole === r.key && styles.roleSelectBtnActive]}
                        onPress={() => handleRoleChangeInModal(r.key)}
                      >
                        <MaterialCommunityIcons 
                          name={r.icon} 
                          size={18} 
                          color={newUserRole === r.key ? '#ffffff' : COLORS.textMuted} 
                        />
                        <Text style={[styles.roleSelectBtnText, newUserRole === r.key && styles.roleSelectBtnTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* SELECCIÓN DE PERMISOS DE MÓDULOS */}
                <View style={{ marginTop: 4, backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text }}>
                        Módulos Visibles en el Menú:
                      </Text>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        Selecciona qué módulos puede ver y acceder este usuario ({userPermissions.length} / {ALL_MODULE_KEYS.length})
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#e2e8f0', borderRadius: 6 }}
                        onPress={handleSelectAllPermissions}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>Todos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#fee2e2', borderRadius: 6 }}
                        onPress={handleClearPermissions}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#b91c1c' }}>Ninguno</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_MODULE_KEYS.map(mod => {
                      const isChecked = userPermissions.includes(mod.key);
                      return (
                        <TouchableOpacity
                          key={mod.key}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            borderColor: isChecked ? '#0284c7' : '#cbd5e1',
                            backgroundColor: isChecked ? '#e0f2fe' : '#ffffff',
                            width: '48%',
                            minWidth: 180
                          }}
                          onPress={() => togglePermission(mod.key)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons 
                            name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"} 
                            size={18} 
                            color={isChecked ? "#0284c7" : "#94a3b8"} 
                            style={{ marginRight: 6 }}
                          />
                          <MaterialCommunityIcons 
                            name={mod.icon} 
                            size={16} 
                            color={isChecked ? "#0369a1" : "#64748b"} 
                            style={{ marginRight: 6 }}
                          />
                          <Text style={{
                            fontSize: 12,
                            fontWeight: isChecked ? '700' : '500',
                            color: isChecked ? '#0369a1' : '#475569',
                            flex: 1
                          }} numberOfLines={1}>
                            {mod.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn}
                    onPress={() => setIsUserModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalSubmitBtn}
                    onPress={handleSaveUser}
                  >
                    <Text style={styles.modalSubmitText}>
                      {editingUserId ? 'Guardar Cambios' : 'Guardar Usuario'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* MODAL CLAVE MAESTRA PARA BORRADO */}
        <Modal visible={isWipeModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: 440 }]}>
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                  <MaterialCommunityIcons name="shield-alert" size={28} color="#ef4444" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center' }}>
                  Autorización con Clave Maestra
                </Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 }}>
                  {wipeType === 'sales' 
                    ? 'Está a punto de reiniciar todas las ventas y comandas registradas.'
                    : 'Está a punto de borrar TODOS los datos y restaurar de fábrica el sistema.'}
                </Text>
              </View>

              <View style={{ gap: 15 }}>
                <View>
                  <Text style={styles.formLabel}>INGRESE LA CLAVE MAESTRA:</Text>
                  <TextInput 
                    style={[styles.formInput, { textAlign: 'center', letterSpacing: 3, fontSize: 18, fontWeight: 'bold' }]}
                    placeholder="••••••••"
                    value={inputMasterPin}
                    onChangeText={setInputMasterPin}
                    secureTextEntry
                    autoFocus
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 5 }}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn}
                    onPress={() => setIsWipeModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalSubmitBtn, { backgroundColor: '#ef4444' }]}
                    onPress={handleConfirmWipe}
                  >
                    <Text style={styles.modalSubmitText}>Confirmar y Ejecutar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg },

  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 25,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } })
  },
  logoBtn: { padding: 4 },
  moduleTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  moduleSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  dashboardBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  mainScroll: { flex: 1 },

  activeUserBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    marginBottom: 25,
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' } })
  },
  activeUserIconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeUserPre: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  activeUserName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  activeUserDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 25,
    gap: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: COLORS.primary },
  tabBtnActiveDanger: { borderBottomColor: COLORS.danger },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  tabBtnTextActive: { color: COLORS.primary, fontWeight: '800' },

  newUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  newUserBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    ...Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.02)' } })
  },
  userCardActive: {
    borderColor: '#0284c7',
    borderWidth: 1.5,
    backgroundColor: '#f8fafc',
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  userUsername: { fontSize: 12, color: COLORS.textMuted },
  
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  activePillText: { fontSize: 10, fontWeight: '800', color: '#15803d' },

  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },

  pinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  pinLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginRight: 4 },
  pinText: { fontSize: 12, fontWeight: 'bold', color: COLORS.text },

  switchUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 4
  },
  switchUserText: { fontSize: 12, fontWeight: '700', color: '#0284c7' },

  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  currentIndicatorText: { fontSize: 12, fontWeight: '700', color: '#10b981' },

  deleteUserBtn: { padding: 6 },

  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guideTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 15 },
  guideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  guideCol: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guideRoleName: { fontSize: 14, fontWeight: '800' },
  guideRoleSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  guideItemOk: { fontSize: 12, color: '#047857', fontWeight: '600' },
  guideItemNo: { fontSize: 12, color: '#dc2626', fontWeight: '500' },

  securityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    outlineStyle: 'none'
  },
  saveMasterPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  saveMasterPinBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  dangerAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 20,
  },
  dangerAlertTitle: { fontSize: 14, fontWeight: '800', color: '#b91c1c' },
  dangerAlertSub: { fontSize: 12, color: '#991b1b', marginTop: 2 },

  wipeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wipeCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  wipeCardDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  wipeCardNote: { fontSize: 12, fontWeight: '600', marginTop: 8 },

  wipeActionBtnOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wipeActionBtnRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  wipeActionBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: 480,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({ web: { boxShadow: '0px 10px 40px rgba(0,0,0,0.2)' } })
  },
  roleSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#f8fafc',
  },
  roleSelectBtnActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  roleSelectBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  roleSelectBtnTextActive: { color: '#ffffff' },

  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  modalSubmitText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
});
