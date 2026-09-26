const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Import globalDirectory and addContactToGlobal
content = content.replace(
  /import \{ globalActiveOrders, globalRecipes, processProductionBatch, updateStock, registerShiftSale, globalTables, globalSettings \} from '\.\.\/store\/mockDb';/,
  "import { globalActiveOrders, globalRecipes, processProductionBatch, updateStock, registerShiftSale, globalTables, globalSettings, globalDirectory, addContactToGlobal } from '../store/mockDb';"
);

// 2. Add states for Client Modal
const stateHooks = `  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState('');

  // CRM States
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDocId, setNewClientDocId] = useState('');

  const filteredClients = globalDirectory.filter(c => c.type === 'Clientes' && (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.docId.toLowerCase().includes(clientSearch.toLowerCase())));

  const selectClient = (client) => {
    setClientName(client.name);
    setClientId(client.docId);
    if(order) { order.customerName = client.name; order.clientId = client.docId; }
    setIsClientModalVisible(false);
    setTick(t => t+1);
  };

  const handleCreateClient = () => {
    if (!newClientName || !newClientDocId) return alert("Nombre y Cédula/RIF son obligatorios");
    const newContact = {
      id: 'C-' + Date.now(),
      name: newClientName.toUpperCase(),
      docId: newClientDocId.toUpperCase(),
      email: 'Sin correo',
      phone: 'Sin teléfono',
      address: 'Sin dirección',
      type: 'Clientes'
    };
    addContactToGlobal(newContact);
    selectClient(newContact);
    setIsCreatingClient(false);
    setNewClientName('');
    setNewClientDocId('');
  };`;

content = content.replace(
  /const \[clientName, setClientName\] = useState\(''\);\s*const \[clientId, setClientId\] = useState\(''\);/,
  stateHooks
);

// 3. Replace TextInput in the sidebar with a TouchableOpacity
const oldSidebarInput = /<TextInput \s*style=\{\{backgroundColor: '#1f1f2b'[\s\S]*?\/>/;
const newSidebarInput = `<TouchableOpacity 
              style={{backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10, marginBottom: 5, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}
              onPress={() => setIsClientModalVisible(true)}
            >
              <MaterialCommunityIcons name="account-search" size={16} color={COLORS.textMuted} style={{marginRight: 8}} />
              <Text style={{color: clientName ? COLORS.text : COLORS.textMuted, fontSize: 13, flex: 1}}>
                {clientName ? clientName : "Asignar Cliente..."}
              </Text>
            </TouchableOpacity>`;

content = content.replace(oldSidebarInput, newSidebarInput);

// 4. Client Modal UI
const clientModalUi = `
      {/* CRM Client Modal */}
      <Modal visible={isClientModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {width: 450}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <Text style={{fontSize: 20, fontWeight: 'bold', color: COLORS.text}}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => {setIsClientModalVisible(false); setIsCreatingClient(false);}}><MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} /></TouchableOpacity>
            </View>

            {!isCreatingClient ? (
              <>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15, outlineStyle: 'none'}}
                  placeholder="Buscar por nombre o cédula..."
                  placeholderTextColor={COLORS.textMuted}
                  value={clientSearch}
                  onChangeText={setClientSearch}
                />
                
                <ScrollView style={{maxHeight: 300, marginBottom: 15}}>
                  {filteredClients.length > 0 ? filteredClients.map(client => (
                    <TouchableOpacity 
                      key={client.id} 
                      style={{padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border}}
                      onPress={() => selectClient(client)}
                    >
                      <Text style={{color: COLORS.text, fontWeight: 'bold', fontSize: 14}}>{client.name}</Text>
                      <Text style={{color: COLORS.textMuted, fontSize: 12}}>{client.docId}</Text>
                    </TouchableOpacity>
                  )) : (
                    <Text style={{color: COLORS.textMuted, textAlign: 'center', marginTop: 20}}>No se encontraron clientes.</Text>
                  )}
                </ScrollView>

                <TouchableOpacity 
                  style={{backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center'}}
                  onPress={() => setIsCreatingClient(true)}
                >
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>+ CREAR NUEVO CLIENTE</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>NOMBRE / RAZÓN SOCIAL</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15, outlineStyle: 'none'}}
                  value={newClientName}
                  onChangeText={setNewClientName}
                  placeholder="Ej: JUAN PEREZ"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={{color: COLORS.textMuted, fontSize: 12, marginBottom: 5, fontWeight: 'bold'}}>CÉDULA / RIF</Text>
                <TextInput 
                  style={{backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, outlineStyle: 'none'}}
                  value={newClientDocId}
                  onChangeText={setNewClientDocId}
                  placeholder="Ej: V-12345678"
                  placeholderTextColor={COLORS.textMuted}
                />
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={{flex: 1, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center'}} onPress={() => setIsCreatingClient(false)}>
                    <Text style={{color: COLORS.textMuted, fontWeight: 'bold'}}>VOLVER A BUSCAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center'}} onPress={handleCreateClient}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>GUARDAR</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
`;

content = content.replace(
  /\{\/\* Modal Checkout \*\/\}/,
  clientModalUi + "\n      {/* Modal Checkout */}"
);

// We should also replace the onChangeText={setClientName} in checkout to update order.customerName as well, but we already did that in the last step.
// Actually let's make sure it's using the selected client info. The selectClient function already updates both states.

fs.writeFileSync(path, content);
console.log("Client integration complete");
