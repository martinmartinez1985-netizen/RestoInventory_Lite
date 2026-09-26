const fs = require('fs');

// 1. UPDATE PosOrderingScreen.js
const posPath = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\PosOrderingScreen.js';
let posContent = fs.readFileSync(posPath, 'utf8');

if (!posContent.includes('TicketModal')) {
  posContent = posContent.replace(
    /import \{ printTicket \} from '\.\.\/utils\/printer';/,
    "import TicketModal from '../components/TicketModal';"
  );

  // Add states for ticket modal
  posContent = posContent.replace(
    /const \[newClientDocId, setNewClientDocId\] = useState\(''\);/,
    `const [newClientDocId, setNewClientDocId] = useState('');
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketModalType, setTicketModalType] = useState('kitchen');`
  );

  // Update sendToKitchen to open TicketModal
  const oldSendRegex = /const sendToKitchen = \(\) => \{[\s\S]*?if \(successCount > 0\) alert\("Enviado a cocina\. Inventario descontado\."\);[\s\S]*?setTick\(t => t \+ 1\);[\s\S]*?\} catch \(err\) \{/;
  
  const newSendCode = `const sendToKitchen = () => {
      let successCount = 0;
      try {
        order.items.forEach(item => {
          if (!item.sentToKitchen) {
            processProductionBatch(item.recipeId, item.qty);
            const recipe = globalRecipes.find(r => r.id === item.recipeId);
            updateStock(recipe.outputId, -item.qty);
            item.sentToKitchen = true;
            successCount++;
          }
        });
        setTicketModalType('kitchen');
        setTicketModalVisible(true);
        setTick(t => t + 1);
      } catch (err) {`;

  posContent = posContent.replace(oldSendRegex, newSendCode);

  // Update handlePay to open TicketModal with 'receipt'
  const oldPayRegex = /recordCompletedOrder\(order, \{[\s\S]*?\}\);[\s\S]*?printTicket\('receipt', order, globalSettings\);[\s\S]*?alert\(`.*?`\);[\s\S]*?setCheckoutVisible\(false\);[\s\S]*?navigation\.navigate\('Billing'\);/;

  const newPayCode = `recordCompletedOrder(order, {
        method: payMethod,
        currency: payCurrency,
        amount: amountToRegister,
        exchangeRate: parseFloat(exchangeRate) || parseFloat(globalSettings.exchangeRate) || 40,
        clientName: clientName || order.customerName,
        clientId: clientId || order.clientId
      });
      setCheckoutVisible(false);
      setTicketModalType('receipt');
      setTicketModalVisible(true);`;

  posContent = posContent.replace(oldPayRegex, newPayCode);

  // Add Pre-cuenta button above totalsBox in the ticket panel
  posContent = posContent.replace(
    /<View style=\{styles\.totalsBox\}>/,
    `<TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14, gap: 6 }}
              onPress={() => {
                setTicketModalType('pre_account');
                setTicketModalVisible(true);
              }}
            >
              <MaterialCommunityIcons name="receipt" size={18} color={COLORS.primary} />
              <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: 'bold' }}>Ver / Imprimir Pre-cuenta</Text>
            </TouchableOpacity>

            <View style={styles.totalsBox}>`
  );

  // Render TicketModal at the end of safeArea
  posContent = posContent.replace(
    /<\/SafeAreaView>/,
    `  {/* Visualizador e Impresor Térmico Real */}
        <TicketModal 
          visible={ticketModalVisible}
          type={ticketModalType}
          order={order}
          customRate={parseFloat(exchangeRate) || 40}
          onClose={() => {
            setTicketModalVisible(false);
            if (order.status === 'paid') {
              navigation.navigate('Billing');
            }
          }}
        />
      </SafeAreaView>`
  );

  fs.writeFileSync(posPath, posContent, 'utf8');
  console.log("PosOrderingScreen wired with TicketModal");
}

// 2. UPDATE KitchenScreen.js
const kitchenPath = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\KitchenScreen.js';
let kitchenContent = fs.readFileSync(kitchenPath, 'utf8');

if (!kitchenContent.includes('TicketModal')) {
  kitchenContent = kitchenContent.replace(
    /import React, \{ useState \} from 'react';/,
    "import React, { useState } from 'react';\nimport TicketModal from '../components/TicketModal';"
  );

  // Add state for selected kitchen ticket
  kitchenContent = kitchenContent.replace(
    /export default function KitchenScreen\(\{ navigation \}\) \{/,
    `export default function KitchenScreen({ navigation }) {
  const [selectedKitchenOrder, setSelectedKitchenOrder] = useState(null);
  const [isKitchenModalVisible, setIsKitchenModalVisible] = useState(false);`
  );

  // Add print button next to dispatchBtn
  const oldDispatchRegex = /<TouchableOpacity style=\{styles\.dispatchBtn\} onPress=\{\(\) => markOrderReady\(order\.id\)\}>[\s\S]*?<\/TouchableOpacity>/;

  const newButtonsCode = `<View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#0284c7', padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }} 
                      onPress={() => {
                        setSelectedKitchenOrder(order);
                        setIsKitchenModalVisible(true);
                      }}
                    >
                      <MaterialCommunityIcons name="printer" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Imprimir Comanda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={{ flex: 1.5, backgroundColor: '#10b981', padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }} 
                      onPress={() => markOrderReady(order.id)}
                    >
                      <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Despachar Mesa</Text>
                    </TouchableOpacity>
                  </View>`;

  kitchenContent = kitchenContent.replace(oldDispatchRegex, newButtonsCode);

  // Render TicketModal in KitchenScreen
  kitchenContent = kitchenContent.replace(
    /<\/SafeAreaView>/,
    `  <TicketModal 
        visible={isKitchenModalVisible}
        type="kitchen"
        order={selectedKitchenOrder}
        onClose={() => setIsKitchenModalVisible(false)}
      />
    </SafeAreaView>`
  );

  fs.writeFileSync(kitchenPath, kitchenContent, 'utf8');
  console.log("KitchenScreen wired with TicketModal");
}

// 3. UPDATE DailySalesScreen.js
const salesPath = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\DailySalesScreen.js';
let salesContent = fs.readFileSync(salesPath, 'utf8');

if (!salesContent.includes('TicketModal')) {
  salesContent = salesContent.replace(
    /import \{ printTicket \} from '\.\.\/utils\/printer';/,
    "import TicketModal from '../components/TicketModal';"
  );

  // Add state for selected order to view/print
  salesContent = salesContent.replace(
    /export default function DailySalesScreen\(\{ navigation \}\) \{/,
    `export default function DailySalesScreen({ navigation }) {
  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);
  const [isAuditModalVisible, setIsAuditModalVisible] = useState(false);`
  );

  // Replace reprintBtn onPress
  salesContent = salesContent.replace(
    /onPress=\{\(\) => printTicket\('receipt', order, \{ exchangeRate: orderRate \}\)\}/g,
    `onPress={() => { setSelectedAuditOrder(order); setIsAuditModalVisible(true); }}`
  );

  // Render TicketModal in DailySalesScreen
  salesContent = salesContent.replace(
    /<\/SafeAreaView>/,
    `  <TicketModal 
        visible={isAuditModalVisible}
        type="receipt"
        order={selectedAuditOrder}
        customRate={selectedAuditOrder?.payment?.exchangeRate}
        onClose={() => setIsAuditModalVisible(false)}
      />
    </SafeAreaView>`
  );

  fs.writeFileSync(salesPath, salesContent, 'utf8');
  console.log("DailySalesScreen wired with TicketModal");
}
