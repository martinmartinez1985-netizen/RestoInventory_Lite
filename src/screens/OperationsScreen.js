import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { inventoryService } from '../../services/inventoryService';

// Mock data for UI presentation since Firebase needs actual config keys to connect
const MOCK_INVENTORY = [
  { id: '1', name: 'Tequila Don Julio 70', category: 'Licores', stockPrincipal: 24, stockBarra: 5, unit: 'botellas' },
  { id: '2', name: 'Cerveza Corona', category: 'Licores', stockPrincipal: 120, stockBarra: 48, unit: 'unidades' },
  { id: '3', name: 'Carne de Res (Ribeye)', category: 'Alimentos', stockPrincipal: 15.5, stockBarra: 0, unit: 'kg' },
  { id: '4', name: 'Limones', category: 'Alimentos', stockPrincipal: 10, stockBarra: 3, unit: 'kg' },
];

export default function OperationsScreen() {
  const [activeTab, setActiveTab] = useState('Principal');
  const [items, setItems] = useState(MOCK_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');

  // useEffect(() => {
  //   const unsubscribe = inventoryService.subscribeToInventory((data) => {
  //     setItems(data);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleTransfer = (item) => {
    // Here we would call: inventoryService.transferStock(item.id, 'Principal', 'Barra', 1)
    console.log(`Transferring ${item.name} from Principal to Barra`);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category} • {item.unit}</Text>
      </View>
      <View style={styles.stockContainer}>
        <Text style={styles.stockText}>
          {activeTab === 'Principal' ? item.stockPrincipal : item.stockBarra}
        </Text>
        <Text style={styles.stockLabel}>En Stock</Text>
      </View>
      {activeTab === 'Principal' && (
        <TouchableOpacity style={styles.transferButton} onPress={() => handleTransfer(item)}>
          <MaterialCommunityIcons name="swap-horizontal" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Inventario</Text>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Principal' && styles.activeTab]}
            onPress={() => setActiveTab('Principal')}
          >
            <Text style={[styles.tabText, activeTab === 'Principal' && styles.activeTabText]}>Depósito Principal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Barra' && styles.activeTab]}
            onPress={() => setActiveTab('Barra')}
          >
            <Text style={[styles.tabText, activeTab === 'Barra' && styles.activeTabText]}>Barra</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#888" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar producto..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList 
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#323e54',
    marginBottom: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#323e54',
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
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
    paddingTop: 0,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 13,
    color: '#888',
  },
  stockContainer: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  stockText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#04c798',
  },
  stockLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  transferButton: {
    backgroundColor: '#323e54',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});
