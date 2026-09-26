const fs = require('fs');

// Patch KitchenScreen.js
const kitchenPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\KitchenScreen.js';
let kitchenContent = fs.readFileSync(kitchenPath, 'utf8');

const oldHeader = /<View style=\{\[styles\.ticketHeader[\s\S]*?<\/View>/;
const newHeader = `<View style={[styles.ticketHeader, order.type === 'delivery' ? {backgroundColor: '#ef4444'} : (order.type === 'dine_in' ? {backgroundColor: '#10b981'} : {backgroundColor: '#f59e0b'})]}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={styles.ticketTitle}>
                        {order.type === 'dine_in' ? \`Mesa \${order.tableId.replace('T', '')}\` : (order.type === 'delivery' ? 'Delivery' : 'Pick-up')}
                      </Text>
                      <Text style={styles.ticketTime}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                    <Text style={{color: '#fff', fontSize: 14, marginTop: 4, fontWeight: 'bold', opacity: 0.9}}>Ord: {order.id}</Text>
                    {order.customerName ? (
                      <Text style={{color: '#fff', fontSize: 16, marginTop: 4, fontWeight: 'bold'}}>👤 {order.customerName}</Text>
                    ) : null}
                  </View>`;

kitchenContent = kitchenContent.replace(oldHeader, newHeader);
fs.writeFileSync(kitchenPath, kitchenContent);

// Patch PosOrderingScreen.js to ensure customerName is updated from checkout modal too
const posPath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\scratch\\RestoInventory_Lite\\src\\screens\\PosOrderingScreen.js';
let posContent = fs.readFileSync(posPath, 'utf8');

posContent = posContent.replace(
  /onChangeText=\{setClientName\}/,
  "onChangeText={(val) => { setClientName(val); order.customerName = val; }}"
);

fs.writeFileSync(posPath, posContent);

console.log("Patched Kitchen and POS");
