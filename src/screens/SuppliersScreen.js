import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MOCK_SUPPLIERS = [
  { id: '1', name: 'Distribuidora de Licores S.A.', contact: 'Juan Pérez', phone: '+52 555 123 4567', email: 'ventas@licores.com', category: 'Licores' },
  { id: '2', name: 'Carnes Premium El Rancho', contact: 'María García', phone: '+52 555 987 6543', email: 'pedidos@elrancho.com', category: 'Alimentos' },
  { id: '3', name: 'Frutas y Verduras Frescas', contact: 'Carlos López', phone: '+52 555 456 7890', email: 'carlos@frescas.com', category: 'Alimentos' },
];

export default function SuppliersScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSuppliers = MOCK_SUPPLIERS.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    supplier.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSupplier = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>
      
      <View style={styles.contactInfo}>
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="account-outline" size={18} color="#888" />
          <Text style={styles.contactText}>{item.contact}</Text>
        </View>
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="phone-outline" size={18} color="#888" />
          <Text style={styles.contactText}>{item.phone}</Text>
        </View>
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="email-outline" size={18} color="#888" />
          <Text style={styles.contactText}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#007aff" />
          <Text style={[styles.actionText, { color: '#007aff' }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#04c798" />
          <Text style={[styles.actionText, { color: '#04c798' }]}>Hacer Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Proveedores y Contactos</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="account-plus-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar proveedor o categoría..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList 
        data={filteredSuppliers}
        keyExtractor={item => item.id}
        renderItem={renderSupplier}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#323e54' },
  addButton: {
    backgroundColor: '#04c798',
    padding: 10,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  listContainer: { padding: 15, paddingTop: 0 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#323e54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  category: { fontSize: 14, color: '#04c798', fontWeight: '600', marginTop: 2 },
  contactInfo: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactText: { fontSize: 14, color: '#555', marginLeft: 10 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: { marginLeft: 6, fontWeight: '600' },
});
