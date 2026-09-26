import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  SafeAreaView, 
  Dimensions, 
  Platform, 
  Modal,
  Image,
  ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalDirectory, addContactToGlobal, updateContactInGlobal } from '../store/mockDb';

const { width } = Dimensions.get('window');

const TABS = ['Todos', 'Clientes', 'Proveedores', 'Intercompañías', 'Accionistas', 'Empleados'];

// Helper para colores según tipo de contacto
const getTypeColor = (type) => {
  switch(type) {
    case 'Clientes': return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: 'account-group-outline' };
    case 'Proveedores': return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: 'truck-fast-outline' };
    case 'Intercompañías': 
    case 'Intercompañias': 
    case 'Intercompaas': return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: 'office-building' };
    case 'Accionistas': return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', icon: 'account-tie-outline' };
    case 'Empleados': 
    case 'Empleados / Colaboradores': return { bg: '#fdf4ff', text: '#c026d3', border: '#f5d0fe', icon: 'card-account-details-outline' };
    default: return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: 'account' };
  }
};

export default function DirectoryScreen({ route, navigation }) {
  const [contacts, setContacts] = useState(globalDirectory);
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'Clientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' (por defecto) o 'grid'
  const [editingContact, setEditingContact] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Sincronizar con el store global al enfocar pantalla
  useFocusEffect(
    useCallback(() => {
      setContacts([...globalDirectory]);
    }, [])
  );

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  const handleNewRecord = () => {
    setIsNewRecord(true);
    setEditingContact({
      id: 'C-' + Date.now().toString().slice(-6),
      name: '',
      docId: '',
      phone: '',
      email: '',
      address: '',
      type: (activeTab === 'Todos' || !activeTab) ? 'Clientes' : activeTab
    });
  };

  const handleSaveEdit = () => {
    if (!editingContact.name.trim()) {
      alert("El nombre de la entidad o cliente es obligatorio.");
      return;
    }
    if (isNewRecord) {
      addContactToGlobal(editingContact);
      setContacts(prev => [editingContact, ...prev]);
    } else {
      updateContactInGlobal(editingContact);
      setContacts(prev => prev.map(c => c.id === editingContact.id ? editingContact : c));
    }
    setEditingContact(null);
    setIsNewRecord(false);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesTab = activeTab === 'Todos' || 
                       c.type === activeTab || 
                       (activeTab === 'Intercompañías' && (c.type === 'Intercompañias' || c.type?.includes('Intercompa'))) ||
                       (activeTab === 'Empleados' && (c.type === 'Empleados' || c.type?.includes('Empleados')));
    
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
                          (c.name || '').toLowerCase().includes(q) || 
                          (c.docId || '').toLowerCase().includes(q) ||
                          (c.phone || '').toLowerCase().includes(q) ||
                          (c.email || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Render fila tipo lista (Table Row)
  const renderListRow = ({ item, index }) => {
    const colorStyle = getTypeColor(item.type);

    return (
      <View style={[styles.listRow, index % 2 === 1 && styles.listRowAlt]}>
        
        {/* Columna 1: Nombre y Avatar */}
        <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.avatarBox, { backgroundColor: colorStyle.bg }]}>
            <MaterialCommunityIcons name={colorStyle.icon} size={18} color={colorStyle.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowNameText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.rowIdSubText}>{item.docId || 'Sin documento'}</Text>
          </View>
        </View>

        {/* Columna 2: Teléfono */}
        <View style={{ flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="phone-outline" size={14} color="#94a3b8" />
          <Text style={[styles.rowText, item.phone === 'Sin teléfono' && styles.mutedText]} numberOfLines={1}>
            {item.phone || 'Sin teléfono'}
          </Text>
        </View>

        {/* Columna 3: Correo */}
        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="email-outline" size={14} color="#94a3b8" />
          <Text style={[styles.rowText, item.email === 'Sin correo' && styles.mutedText]} numberOfLines={1}>
            {item.email || 'Sin correo'}
          </Text>
        </View>

        {/* Columna 4: Dirección */}
        <View style={{ flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94a3b8" />
          <Text style={[styles.rowText, item.address === 'Sin dirección' && styles.mutedText]} numberOfLines={1}>
            {item.address || 'Sin dirección'}
          </Text>
        </View>

        {/* Columna 5: Tipo / Categoría */}
        <View style={{ flex: 1.5, alignItems: 'flex-start' }}>
          <View style={[styles.typeBadge, { backgroundColor: colorStyle.bg, borderColor: colorStyle.border }]}>
            <Text style={[styles.typeBadgeText, { color: colorStyle.text }]}>
              {item.type}
            </Text>
          </View>
        </View>

        {/* Columna 6: Acciones */}
        <View style={{ width: 60, alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity 
            style={styles.editBtn} 
            onPress={() => setEditingContact(item)}
            title="Editar Contacto"
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#0284c7" />
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  // Render tarjeta cuadrícula (Grid Card)
  const renderGridCard = ({ item }) => {
    const colorStyle = getTypeColor(item.type);

    return (
      <View style={styles.gridCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarBox, { backgroundColor: colorStyle.bg }]}>
            <MaterialCommunityIcons name={colorStyle.icon} size={20} color={colorStyle.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.clientId}>{item.docId || 'Sin ID'}</Text>
          </View>
          <TouchableOpacity onPress={() => setEditingContact(item)} style={styles.editBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#0284c7" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone-outline" size={14} color="#94a3b8" />
            <Text style={[styles.infoText, item.phone === 'Sin teléfono' && styles.mutedText]}>{item.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="email-outline" size={14} color="#94a3b8" />
            <Text style={[styles.infoText, item.email === 'Sin correo' && styles.mutedText]}>{item.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94a3b8" />
            <Text style={[styles.infoText, item.address === 'Sin dirección' && styles.mutedText]} numberOfLines={1}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.typeBadge, { backgroundColor: colorStyle.bg, borderColor: colorStyle.border }]}>
            <Text style={[styles.typeBadgeText, { color: colorStyle.text }]}>{item.type}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Cabecera Superior con Logo */}
        <View style={styles.topHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Dashboard')} 
              style={{ padding: 4 }}
            >
              <Image 
                source={require('../../assets/logo.png')} 
                style={{ width: 130, height: 40, resizeMode: 'contain' }} 
              />
            </TouchableOpacity>
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.pageTitle}>Directorio de Contactos</Text>
              <Text style={styles.pageSubtitle}>Listado centralizado de clientes, proveedores y colaboradores</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleNewRecord}
            >
              <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Nuevo Registro</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.navigate('Contacts')}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.backButtonText}>Menú</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bodyContent}>
          
          {/* Barra de Herramientas y Filtros */}
          <View style={styles.toolbarCard}>
            
            {/* Pestañas de Categoría */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
              <View style={styles.tabsContainer}>
                {TABS.map((tab) => (
                  <TouchableOpacity 
                    key={tab} 
                    style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Platform.OS === 'web' && width > 900 ? 0 : 12 }}>
              
              {/* Buscador */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Buscar por nombre, C.I./RIF o teléfono..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Selector de Modo de Vista (Lista vs Cuadrícula) */}
              <View style={styles.viewModeToggle}>
                <TouchableOpacity 
                  style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}
                  onPress={() => setViewMode('list')}
                  title="Vista en Lista"
                >
                  <MaterialCommunityIcons 
                    name="view-headline" 
                    size={20} 
                    color={viewMode === 'list' ? '#ffffff' : '#64748b'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}
                  onPress={() => setViewMode('grid')}
                  title="Vista en Tarjetas"
                >
                  <MaterialCommunityIcons 
                    name="view-grid-outline" 
                    size={20} 
                    color={viewMode === 'grid' ? '#ffffff' : '#64748b'} 
                  />
                </TouchableOpacity>
              </View>

            </View>

          </View>

          {/* Contador de Registros */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>
              Mostrando {filteredContacts.length} {filteredContacts.length === 1 ? 'contacto' : 'contactos'} en <Text style={{ color: '#0284c7' }}>{activeTab}</Text>
            </Text>
          </View>

          {/* VISTA EN LISTA (TABLE VIEW) */}
          {viewMode === 'list' ? (
            <View style={styles.tableCard}>
              {/* Cabecera de la Tabla */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2.5 }]}>ENTIDAD / NOMBRE</Text>
                <Text style={[styles.tableColHeader, { flex: 1.5 }]}>TELÉFONO</Text>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>CORREO</Text>
                <Text style={[styles.tableColHeader, { flex: 2.5 }]}>DIRECCIÓN</Text>
                <Text style={[styles.tableColHeader, { flex: 1.5 }]}>CATEGORÍA</Text>
                <Text style={[styles.tableColHeader, { width: 60, textAlign: 'center' }]}>ACCIÓN</Text>
              </View>

              {filteredContacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No se encontraron contactos</Text>
                  <Text style={styles.emptySubText}>Intenta con otro término de búsqueda o categoría.</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderListRow}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          ) : (
            /* VISTA EN CUADRÍCULA (GRID VIEW) */
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={renderGridCard}
              numColumns={width > 1200 ? 4 : width > 800 ? 3 : 1}
              contentContainerStyle={{ paddingBottom: 40 }}
              columnWrapperStyle={width > 800 ? { gap: 15, marginBottom: 15 } : undefined}
            />
          )}

        </View>

        {/* MODAL CREAR / EDITAR CONTACTO */}
        <Modal visible={!!editingContact} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={styles.modalTitle}>
                  {isNewRecord ? 'Nuevo Contacto' : 'Editar Contacto'}
                </Text>
                <TouchableOpacity onPress={() => { setEditingContact(null); setIsNewRecord(false); }}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              {editingContact && (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={styles.label}>NOMBRE / RAZÓN SOCIAL (*):</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Ej. JUAN PÉREZ o COMERCIALIZADORA C.A."
                      value={editingContact.name} 
                      onChangeText={(val) => setEditingContact({...editingContact, name: val.toUpperCase()})}
                    />
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>CÉDULA / RIF:</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ej. V-12345678 o J-99887766"
                        value={editingContact.docId} 
                        onChangeText={(val) => setEditingContact({...editingContact, docId: val.toUpperCase()})}
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>TIPO DE ENTIDAD:</Text>
                      <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                        {['Clientes', 'Proveedores'].map(t => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.typeSelectBtn, editingContact.type === t && styles.typeSelectBtnActive]}
                            onPress={() => setEditingContact({...editingContact, type: t})}
                          >
                            <Text style={[styles.typeSelectBtnText, editingContact.type === t && styles.typeSelectBtnTextActive]}>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>TELÉFONO:</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Ej. 0414-1234567"
                        value={editingContact.phone} 
                        onChangeText={(val) => setEditingContact({...editingContact, phone: val})}
                      />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>CORREO ELECTRÓNICO:</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="correo@ejemplo.com"
                        value={editingContact.email} 
                        onChangeText={(val) => setEditingContact({...editingContact, email: val})}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  
                  <View>
                    <Text style={styles.label}>DIRECCIÓN:</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Dirección, sector, ciudad..."
                      value={editingContact.address} 
                      onChangeText={(val) => setEditingContact({...editingContact, address: val})}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.cancelBtn} 
                      onPress={() => {
                        setEditingContact(null);
                        setIsNewRecord(false);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                      <Text style={styles.saveBtnText}>Guardar Contacto</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, backgroundColor: '#f8fafc' },

  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } })
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  pageSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  backButtonText: { color: '#64748b', fontSize: 13, fontWeight: '600' },

  bodyContent: { flex: 1, paddingHorizontal: 30, paddingTop: 20 },

  toolbarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    ...Platform.select({ web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.02)' } })
  },
  tabsScroll: { flexGrow: 0 },
  tabsContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabButton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f1f5f9' },
  activeTabButton: { backgroundColor: '#0284c7' },
  tabText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  activeTabText: { color: '#ffffff', fontWeight: '700' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 260
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#1e293b', outlineStyle: 'none' },

  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  modeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modeBtnActive: { backgroundColor: '#0284c7' },

  // Estilos de Vista en Lista (Tabla)
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flex: 1,
    marginBottom: 20,
    ...Platform.select({ web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.03)' } })
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableColHeader: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  listRowAlt: { backgroundColor: '#fafbfc' },
  avatarBox: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  rowNameText: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  rowIdSubText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 1 },
  rowText: { fontSize: 12, color: '#334155' },
  mutedText: { color: '#94a3b8', fontStyle: 'italic' },

  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estilos de Vista en Tarjetas (Grid)
  gridCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 18,
    justifyContent: 'space-between',
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' } })
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  clientName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  clientId: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 1 },
  cardBody: { gap: 8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#475569', flex: 1 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, alignItems: 'flex-start' },

  // Empty state
  emptyContainer: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#64748b', marginTop: 12 },
  emptySubText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    backgroundColor: '#fff',
    width: 480,
    maxWidth: '95%',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({ web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.2)' } })
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  label: { fontSize: 11, color: '#64748b', fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    outlineStyle: 'none'
  },
  typeSelectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  typeSelectBtnActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  typeSelectBtnText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  typeSelectBtnTextActive: { color: '#ffffff' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  saveBtn: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});
