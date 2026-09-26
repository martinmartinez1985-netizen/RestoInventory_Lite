import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, SafeAreaView, Dimensions, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const columns = width > 1000 ? 4 : width > 600 ? 3 : 1;

const INITIAL_CLIENTS = [
  { id: '1', name: 'DANIEL VILLASMIL', docId: 'V-58748394', email: 'Sin correo', phone: '04146183019', address: 'SECTOR PANAMERICANO' },
  { id: '2', name: 'AMRO FAUZET HOMMAID', docId: 'E-84613570', email: 'Sin correo', phone: 'Sin teléfono', address: 'VALENCIA' },
  { id: '3', name: 'KARLA UBAN FARAYA', docId: 'V-25346463', email: 'Sin correo', phone: '04247164917', address: 'VENTUS 1 LA LAGO' },
  { id: '4', name: 'MARIA TORRES', docId: 'V-24250591', email: 'Sin correo', phone: '0412-4216565', address: 'Valle Claro edif belen pb' },
  { id: '5', name: 'GERARDO PEÑA', docId: 'V-18202500', email: 'Sin correo', phone: '04127575860', address: 'BRR INTEGRACION COMUNAL' },
  { id: '6', name: 'JAGI CAPS (JORGE COLINA)', docId: 'J-315300333', email: 'Sin correo', phone: 'Sin teléfono', address: 'CALLE 100 CC PLAZA LAGO NIVEL PB LOC...' },
  { id: '7', name: 'KEILY HERNANDEZ', docId: 'V-16069335', email: 'HERNANDEZKEILYO@GMAIL.COM', phone: '04126577721', address: 'AV 12 CASA 90-75 BELLOSO' },
  { id: '8', name: 'KARIBEL URDANETA', docId: 'V-18370662', email: 'Sin correo', phone: 'Sin teléfono', address: 'Sin dirección' },
];

const TABS = ['Todos', 'Clientes', 'Proveedores', 'Intercompañías', 'Accionistas', 'Empleados / Colaboradores'];

export default function ClientsListScreen({ navigation }) {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [activeTab, setActiveTab] = useState('Clientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState(null);

  const handleSaveEdit = () => {
    setClients(prev => prev.map(c => c.id === editingClient.id ? editingClient : c));
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.docId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderClientCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="domain" size={20} color="#3b82f6" />
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.clientName}>{item.name}</Text>
          <Text style={styles.clientId}>ID: {item.docId}</Text>
        </View>
        <TouchableOpacity onPress={() => setEditingClient(item)} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color="#94a3b8" style={styles.infoIcon} />
          <Text style={[styles.infoText, item.email === 'Sin correo' && styles.italicText]}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color="#94a3b8" style={styles.infoIcon} />
          <Text style={[styles.infoText, item.phone === 'Sin teléfono' && styles.italicText]}>{item.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#94a3b8" style={styles.infoIcon} />
          <Text style={[styles.infoText, item.address === 'Sin dirección' && styles.italicText]} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.tagText}>CLIENTE</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top actions */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Contacts')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#64748b" />
          <Text style={styles.backButtonText}>Volver al Menú de Directorio</Text>
        </TouchableOpacity>

        {/* Header Title & Button */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Gestión de Clientes</Text>
            <Text style={styles.pageSubtitle}>Administra la información de tus contactos comerciales</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Nuevo Registro</Text>
          </TouchableOpacity>
        </View>

        {/* Filter and Search Bar */}
        <View style={styles.toolbarContainer}>
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Buscar por nombre o ID..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Grid List */}
        <FlatList
          data={filteredClients}
          keyExtractor={(item) => item.id}
          renderItem={renderClientCard}
          numColumns={columns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          key={columns} // Force re-render on orientation change
        />

        {/* Edit Modal */}
        <Modal visible={!!editingClient} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Cliente</Text>
              
              {editingClient && (
                <>
                  <Text style={styles.label}>Nombre</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingClient.name} 
                    onChangeText={(val) => setEditingClient({...editingClient, name: val})}
                  />
                  
                  <Text style={styles.label}>ID / Documento</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingClient.docId} 
                    onChangeText={(val) => setEditingClient({...editingClient, docId: val})}
                  />
                  
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingClient.phone} 
                    onChangeText={(val) => setEditingClient({...editingClient, phone: val})}
                  />
                  
                  <Text style={styles.label}>Correo</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingClient.email} 
                    onChangeText={(val) => setEditingClient({...editingClient, email: val})}
                  />
                  
                  <Text style={styles.label}>Dirección</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingClient.address} 
                    onChangeText={(val) => setEditingClient({...editingClient, address: val})}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingClient(null)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                  <Text style={styles.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
    paddingHorizontal: 40,
    paddingTop: 30,
    backgroundColor: '#ffffff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 25,
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b', // Dark blue/black like in the image
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  toolbarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 6,
    marginBottom: 30,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }
    })
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
    })
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 250,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e293b',
    outlineStyle: 'none', // For web to remove focus outline
  },
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: 20,
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    backgroundColor: '#eff6ff', // Light blue bg
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  clientId: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 8,
    width: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  italicText: {
    fontStyle: 'italic',
    color: '#94a3b8',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: 400,
    maxWidth: '90%',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.2)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }
    })
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 16,
    outlineStyle: 'none',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
