const fs = require('fs');
const path = 'C:\\\\Users\\\\USUARIO\\\\.gemini\\\\antigravity\\\\scratch\\\\RestoInventory_Lite\\\\src\\\\components\\\\TicketModal.js';

let content = fs.readFileSync(path, 'utf8');

// Replace in printable HTML
const oldPrintPaymentRegex = /\$\{\!isPreAccount && order\.payment \? `[\s\S]*?` : ''\}/;

const newPrintPaymentCode = `\${!isPreAccount && order.payments && order.payments.length > 1 ? \`
            <div style="margin-top: 6px; font-size: 11px;">
              <p style="font-weight: bold; margin-bottom: 2px;">DESGLOSE DE PAGO MIXTO:</p>
              \${order.payments.map(p => \`
                <p style="margin: 2px 0;">• \${p.method}: \${p.currency === 'VES' ? 'Bs ' + formatMoney(p.amount) + ' ($' + formatMoney(p.amountUsd) + ')' : '$' + formatMoney(p.amount)}</p>
              \`).join('')}
            </div>
          \` : (!isPreAccount && order.payment ? \`
            <p style="font-size: 11px;">MÉTODO DE PAGO: \${order.payment.method || 'Efectivo'} (\${order.payment.currency || 'USD'})</p>
          \` : '')}`;

content = content.replace(oldPrintPaymentRegex, newPrintPaymentCode);

// Replace on simulated paper JSX
const oldScreenPaymentRegex = /\{\!isPreAccount && order\.payment && \([\s\S]*?PAGADO:[\s\S]*?<\/Text>[\s\S]*?\)\}/;

const newScreenPaymentCode = `{!isPreAccount && order.payments && order.payments.length > 1 ? (
                    <View style={{ marginTop: 6, backgroundColor: '#f8fafc', padding: 6, borderRadius: 4 }}>
                      <Text style={[styles.ticketMeta, { fontWeight: 'bold', color: '#047857' }]}>DESGLOSE DE PAGO MIXTO:</Text>
                      {order.payments.map((p, idx) => (
                        <Text key={idx} style={[styles.ticketMeta, { fontSize: 10 }]}>
                          • {p.method}: {p.currency === 'VES' ? \`Bs \${formatMoney(p.amount)} ($\${formatMoney(p.amountUsd)})\` : \`$\${formatMoney(p.amount)}\`}
                        </Text>
                      ))}
                    </View>
                  ) : (!isPreAccount && order.payment && (
                    <Text style={[styles.ticketMeta, { textAlign: 'center', fontWeight: 'bold', color: '#047857' }]}>
                      PAGADO: {order.payment.method || 'Efectivo'} ({order.payment.currency || 'USD'})
                    </Text>
                  ))}`;

content = content.replace(oldScreenPaymentRegex, newScreenPaymentCode);

fs.writeFileSync(path, content, 'utf8');
console.log("TicketModal updated with split payments rendering");
