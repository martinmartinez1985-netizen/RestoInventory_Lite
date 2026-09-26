const fs = require('fs');

const path = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let content = fs.readFileSync(path, 'utf8');

const oldInput = /<TouchableOpacity [\s\S]*?Asignar Cliente\.\.\.[\s\S]*?<\/TouchableOpacity>/;
const newButtons = `<View style={{flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 15}}>
              <TouchableOpacity 
                style={{flex: 1, backgroundColor: '#1f1f2b', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center'}}
                onPress={() => setIsClientModalVisible(true)}
              >
                <MaterialCommunityIcons name="account-search" size={16} color={COLORS.textMuted} style={{marginRight: 8}} />
                <Text style={{color: clientName ? COLORS.text : COLORS.textMuted, fontSize: 13, flex: 1}} numberOfLines={1}>
                  {clientName ? clientName : "Buscar Cliente..."}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{backgroundColor: '#10b981', borderRadius: 6, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center'}}
                onPress={() => { setIsClientModalVisible(true); setIsCreatingClient(true); }}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>`;

content = content.replace(oldInput, newButtons);

fs.writeFileSync(path, content);
console.log("Client buttons updated");
