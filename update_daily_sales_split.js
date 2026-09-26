const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\screens\\\\DailySalesScreen.js';

let content = fs.readFileSync(path, 'utf8');

// Replace payment accumulation in DailySalesScreen
const oldAccumRegex = /\/\/ Desglose por mǸtodo de pago[\s\S]*?paymentTotals\[key\]\.usd \+= orderUsd;\s*paymentTotals\[key\]\.bs \+= orderBs;/;

const newAccumCode = `// Desglose por método de pago (soporte para pagos mixtos/divididos)
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(p => {
          const key = (p.currency === 'USD' && p.method === 'Efectivo') ? 'Efectivo USD' : 
                      (p.currency === 'VES' && p.method === 'Efectivo') ? 'Efectivo Bs' : p.method;

          if (!paymentTotals[key]) {
            paymentTotals[key] = { usd: 0, bs: 0 };
          }
          paymentTotals[key].usd += Number(p.amountUsd || 0);
          paymentTotals[key].bs += Number(p.amountBs || (p.amountUsd * orderRate));
        });
      } else {
        const method = order.payment?.method || 'Efectivo';
        const currency = order.payment?.currency || 'USD';
        const key = (currency === 'USD' && method === 'Efectivo') ? 'Efectivo USD' : 
                    (currency === 'VES' && method === 'Efectivo') ? 'Efectivo Bs' : method;

        if (!paymentTotals[key]) {
          paymentTotals[key] = { usd: 0, bs: 0 };
        }
        paymentTotals[key].usd += orderUsd;
        paymentTotals[key].bs += orderBs;
      }`;

content = content.replace(oldAccumRegex, newAccumCode);

// Replace payment badge in audit list
const oldBadgeRegex = /<View style=\{styles\.paymentMethodBadge\}>[\s\S]*?<Text style=\{styles\.paymentMethodText\}>[\s\S]*?\{order\.payment\?\.method \|\| 'Efectivo'\} \(\{order\.payment\?\.currency \|\| 'USD'\}\)[\s\S]*?<\/Text>[\s\S]*?<\/View>/;

const newBadgeCode = `{order.payments && order.payments.length > 1 ? (
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                {order.payments.map((p, pIdx) => (
                                  <View key={pIdx} style={styles.paymentMethodBadge}>
                                    <Text style={styles.paymentMethodText}>
                                      {p.method}: {p.currency === 'VES' ? ("Bs " + formatMoney(p.amount)) : ("$" + formatMoney(p.amount))}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <View style={styles.paymentMethodBadge}>
                                <MaterialCommunityIcons 
                                  name={
                                    order.payment?.currency === 'USD' ? 'currency-usd' :
                                    order.payment?.method === 'Zelle' ? 'flash' :
                                    order.payment?.currency === 'CxC' ? 'clock-alert-outline' : 'cash'
                                  } 
                                  size={14} 
                                  color="#047857" 
                                />
                                <Text style={styles.paymentMethodText}>
                                  {order.payment?.method || 'Efectivo'} ({order.payment?.currency || 'USD'})
                                </Text>
                              </View>
                            )}`;

content = content.replace(oldBadgeRegex, newBadgeCode);

fs.writeFileSync(path, content, 'utf8');
console.log("DailySalesScreen updated with split payments support");
