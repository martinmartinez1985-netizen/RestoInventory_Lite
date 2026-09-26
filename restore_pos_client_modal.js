const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

// Ensure handleCreateClient and selectClient are clean
const clientOverlayCode = `
        {/* Modal de Búsqueda y Creación de Clientes CRM */}
        {isClientModalVisible && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { width: 480, maxHeight: '90%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>
                  {isCreatingClient ? 'Crear Nuevo Cliente' : 'Seleccionar Cliente'}
                </Text>
                <TouchableOpacity onPress={() => { setIsClientModalVisible(false); setIsCreatingClient(false); }}>
                  <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {!isCreatingClient ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 }}>
                    <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
                    <TextInput 
                      style={{ flex: 1, marginLeft: 8, color: COLORS.text, paddingVertical: 12, outlineStyle: 'none' }}
                      placeholder="Buscar por nombre o cédula..."
                      placeholderTextColor={COLORS.textMuted}
                      value={clientSearch}
                      onChangeText={setClientSearch}
                      autoFocus
                    />
                    {clientSearch ? (
                      <TouchableOpacity onPress={() => setClientSearch('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  
                  <ScrollView style={{ maxHeight: 280, marginBottom: 15 }}>
                    {filteredClients.length > 0 ? filteredClients.map(client => (
                      <TouchableOpacity 
                        key={client.id} 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        onPress={() => selectClient(client)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 14 }}>{client.name}</Text>
                          <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>ID: {client.docId} • Tel: {client.phone || 'N/A'}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )) : (
                      <View style={{ padding: 30, alignItems: 'center' }}>
                        <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No se encontró ningún cliente con ese nombre o documento.</Text>
                      </View>
                    )}
                  </ScrollView>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#10b981', padding: 14, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    onPress={() => setIsCreatingClient(true)}
                  >
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>CREAR NUEVO CLIENTE</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={{ gap: 14 }}>
                  <View>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontWeight: 'bold' }}>NOMBRE COMPLETO / RAZÓN SOCIAL (*):</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none' }}
                      value={newClientName}
                      onChangeText={setNewClientName}
                      placeholder="Ej. JUAN PÉREZ"
                      placeholderTextColor={COLORS.textMuted}
                      autoFocus
                    />
                  </View>

                  <View>
                    <Text style={{ color: COLORS.textMuted, fontSize: 11, marginBottom: 5, fontWeight: 'bold' }}>CÉDULA / RIF (*):</Text>
                    <TextInput 
                      style={{ backgroundColor: COLORS.bg, color: COLORS.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, outlineStyle: 'none' }}
                      value={newClientDocId}
                      onChangeText={setNewClientDocId}
                      placeholder="Ej. V-12345678"
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg }} 
                      onPress={() => setIsCreatingClient(false)}
                    >
                      <Text style={{ color: COLORS.textMuted, fontWeight: 'bold' }}>Volver a Buscar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#10b981', padding: 14, borderRadius: 8, alignItems: 'center' }} 
                      onPress={handleCreateClient}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar y Asignar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
`;

// Insert clientOverlayCode right before {/* Checkout Modal Dark Theme */}
content = content.replace(
  /\{\/\* Checkout Modal Dark Theme \*\/\}/,
  clientOverlayCode + "\n        {/* Checkout Modal Dark Theme */}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("PosOrderingScreen client modal restored successfully!");
