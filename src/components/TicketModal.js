import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalSettings } from '../store/mockDb';

const formatMoney = (val) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TicketModal({ visible, type = 'kitchen', order, onClose, customRate }) {
  if (!visible || !order) return null;

  const rate = Number(customRate || order.payment?.exchangeRate || globalSettings.exchangeRate || 40);
  const totalUsd = Number(order.total || 0);
  const totalBs = (totalUsd * rate).toFixed(2);

  const dateStr = new Date(order.payment?.paidAt || order.createdAt || new Date()).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isKitchen = type === 'kitchen';
  const isPreAccount = type === 'pre_account';

  // Función de impresión universal en ventana limpia
  const handlePrint = () => {
    if (typeof window === 'undefined') return;

    const printWindow = window.open('', '_blank', 'width=450,height=650');
    if (!printWindow) {
      alert("Por favor permita las ventanas emergentes (popups) en su navegador para imprimir el ticket.");
      return;
    }

    const htmlContent = isKitchen ? `
      <html>
        <head>
          <title>Comanda - ${order.id}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Courier New', monospace; width: 76mm; margin: 0 auto; padding: 10px; color: #000; }
            h2, h3, p { text-align: center; margin: 3px 0; }
            .divider { border-top: 2px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 6px 2px; text-align: left; }
            th { border-bottom: 2px solid #000; }
            .qty { font-size: 20px; font-weight: 900; width: 45px; }
            .dish { font-size: 16px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h2 style="font-size: 22px;">COMANDA DE COCINA</h2>
          <h1 style="text-align: center; font-size: 32px; margin: 8px 0;">
            ${order.type === 'dine_in' ? 'MESA ' + (order.tableId ? order.tableId.replace('T', '') : '1') : (order.type === 'delivery' ? 'DELIVERY' : 'PARA LLEVAR')}
          </h1>
          <div class="divider"></div>
          <p><strong>ORDEN:</strong> ${order.id}</p>
          <p><strong>FECHA:</strong> ${dateStr}</p>
          ${order.customerName ? `<p><strong>CLIENTE:</strong> ${order.customerName}</p>` : ''}
          <div class="divider"></div>
          <table>
            <tr><th class="qty">CANT</th><th class="dish">PLATO / PEDIDO</th></tr>
            ${(order.items || []).map(item => `
              <tr>
                <td class="qty">${item.qty}x</td>
                <td class="dish">${item.name}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <div class="footer">
            <p>--- FIN DE COMANDA ---</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 300);
          </script>
        </body>
      </html>
    ` : `
      <html>
        <head>
          <title>Factura - ${order.id}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Courier New', monospace; width: 76mm; margin: 0 auto; padding: 10px; color: #000; }
            h2, h3, p { text-align: center; margin: 3px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
            th, td { padding: 4px 2px; }
            th { border-bottom: 1px solid #000; text-align: left; }
            .right { text-align: right; }
            .total-row { font-size: 15px; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <h2 style="font-size: 20px; font-weight: 900;">LAGO WOK ZHEN</h2>
          <p style="font-size: 12px;">El Mejor Sabor Asiático</p>
          <p style="font-size: 11px;">RIF: J-50493821-0</p>
          <div class="divider"></div>
          <p style="font-size: 12px;"><strong>${isPreAccount ? 'PRE-CUENTA / CONSUMO' : 'FACTURA DE VENTA'}</strong></p>
          <p style="font-size: 12px;">ORDEN: ${order.id}</p>
          <p style="font-size: 11px;">FECHA: ${dateStr}</p>
          <p style="font-size: 11px;">UBICACIÓN: ${order.type === 'dine_in' ? 'Mesa ' + (order.tableId ? order.tableId.replace('T', '') : '1') : (order.type === 'delivery' ? 'Delivery' : 'Para Llevar')}</p>
          ${order.customerName ? `<p style="font-size: 11px;">CLIENTE: ${order.customerName}</p>` : ''}
          ${order.clientId ? `<p style="font-size: 11px;">C.I./RIF: ${order.clientId}</p>` : ''}
          <div class="divider"></div>
          <table>
            <tr><th>CANT</th><th>DESCRIPCIÓN</th><th class="right">TOTAL</th></tr>
            ${(order.items || []).map(item => `
              <tr>
                <td>${item.qty}x</td>
                <td>${item.name}</td>
                <td class="right">$${formatMoney((item.price || 0) * (item.qty || 1))}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr class="total-row"><td>TOTAL USD:</td><td class="right">$${formatMoney(totalUsd)}</td></tr>
            <tr class="total-row"><td>TOTAL BS:</td><td class="right">Bs ${formatMoney(totalBs)}</td></tr>
          </table>
          <p style="font-size: 11px; margin-top: 8px;">Tasa de Cambio: 1 USD = ${rate.toFixed(2)} Bs</p>
          ${!isPreAccount && order.payments && order.payments.length > 1 ? `
            <div style="margin-top: 6px; font-size: 11px;">
              <p style="font-weight: bold; margin-bottom: 2px;">DESGLOSE DE PAGO MIXTO:</p>
              ${order.payments.map(p => `
                <p style="margin: 2px 0;">• ${p.method}: ${p.currency === 'VES' ? 'Bs ' + formatMoney(p.amount) + ' ($' + formatMoney(p.amountUsd) + ')' : '$' + formatMoney(p.amount)}</p>
              `).join('')}
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="footer">
            <p>*** GRACIAS POR SU VISITA ***</p>
            <p>Conserve este comprobante</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            }, 300);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.containerBox}>
          
          {/* Barra Superior del Visor de Ticket */}
          <View style={styles.topBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons 
                name={isKitchen ? "fire" : "receipt"} 
                size={22} 
                color={isKitchen ? "#ef4444" : "#10b981"} 
              />
              <Text style={styles.topBarTitle}>
                {isKitchen ? 'Vista Previa: Comanda de Cocina' : isPreAccount ? 'Vista Previa: Pre-cuenta' : 'Vista Previa: Factura de Venta'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* SIMULACIÓN DE PAPEL TÉRMICO REAL (80mm) */}
          <ScrollView style={styles.paperScroll} contentContainerStyle={styles.paperContainer}>
            <View style={styles.thermalPaper}>
              
              {/* Encabezado del Ticket */}
              {isKitchen ? (
                <>
                  <Text style={styles.kitchenHeader}>COMANDA DE COCINA</Text>
                  <Text style={styles.kitchenTable}>
                    {order.type === 'dine_in' ? 'MESA ' + (order.tableId ? order.tableId.replace('T', '') : '1') : (order.type === 'delivery' ? 'DELIVERY' : 'PARA LLEVAR')}
                  </Text>
                  <View style={styles.dashedLine} />
                  <Text style={styles.ticketMeta}>ORDEN: {order.id}</Text>
                  <Text style={styles.ticketMeta}>FECHA: {dateStr}</Text>
                  {order.customerName ? <Text style={styles.ticketMeta}>CLIENTE: {order.customerName}</Text> : null}
                  <View style={styles.dashedLine} />
                  
                  {/* Tabla de Platos Cocina */}
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 4 }}>
                      <Text style={{ width: 60, fontWeight: '900', fontSize: 15, fontFamily: 'monospace' }}>CANT</Text>
                      <Text style={{ flex: 1, fontWeight: '900', fontSize: 15, fontFamily: 'monospace' }}>PLATO / PEDIDO</Text>
                    </View>
                    {(order.items || []).map((item, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                        <Text style={{ width: 60, fontWeight: '900', fontSize: 18, fontFamily: 'monospace', color: '#b91c1c' }}>{item.qty}x</Text>
                        <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 15, fontFamily: 'monospace' }}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.dashedLine} />
                  <Text style={styles.ticketFooter}>--- FIN DE COMANDA ---</Text>
                </>
              ) : (
                <>
                  <Text style={styles.brandTitle}>LAGO WOK ZHEN</Text>
                  <Text style={styles.brandSubtitle}>El Mejor Sabor Asiático</Text>
                  <Text style={styles.brandSubtitle}>RIF: J-50493821-0</Text>
                  <View style={styles.dashedLine} />
                  
                  <Text style={[styles.ticketMeta, { textAlign: 'center', fontWeight: '900' }]}>
                    {isPreAccount ? 'PRE-CUENTA / CONSUMO' : 'FACTURA DE VENTA'}
                  </Text>
                  <Text style={styles.ticketMeta}>ORDEN: {order.id}</Text>
                  <Text style={styles.ticketMeta}>FECHA: {dateStr}</Text>
                  <Text style={styles.ticketMeta}>
                    UBICACIÓN: {order.type === 'dine_in' ? 'Mesa ' + (order.tableId ? order.tableId.replace('T', '') : '1') : (order.type === 'delivery' ? 'Delivery' : 'Para Llevar')}
                  </Text>
                  {order.customerName ? <Text style={styles.ticketMeta}>CLIENTE: {order.customerName}</Text> : null}
                  {order.clientId ? <Text style={styles.ticketMeta}>C.I./RIF: {order.clientId}</Text> : null}
                  <View style={styles.dashedLine} />
                  
                  {/* Tabla de Platos Factura */}
                  <View style={{ marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4 }}>
                      <Text style={{ width: 45, fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' }}>CANT</Text>
                      <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' }}>DESCRIPCIÓN</Text>
                      <Text style={{ width: 70, textAlign: 'right', fontWeight: 'bold', fontSize: 12, fontFamily: 'monospace' }}>TOTAL</Text>
                    </View>
                    {(order.items || []).map((item, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', paddingVertical: 4 }}>
                        <Text style={{ width: 45, fontSize: 12, fontFamily: 'monospace' }}>{item.qty}x</Text>
                        <Text style={{ flex: 1, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ width: 70, textAlign: 'right', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }}>
                          ${formatMoney((item.price || 0) * (item.qty || 1))}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.dashedLine} />
                  
                  {/* Totales */}
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.totalLabel}>TOTAL USD:</Text>
                      <Text style={styles.totalValue}>${formatMoney(totalUsd)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.totalLabel}>TOTAL Bs:</Text>
                      <Text style={[styles.totalValue, { color: '#0369a1' }]}>Bs {formatMoney(totalBs)}</Text>
                    </View>
                  </View>

                  <Text style={[styles.ticketMeta, { textAlign: 'center', marginTop: 10 }]}>
                    Tasa de Cambio: 1 USD = {rate.toFixed(2)} Bs
                  </Text>
                  
                  {!isPreAccount && order.payments && order.payments.length > 1 ? (
                    <View style={{ marginTop: 6, backgroundColor: '#f8fafc', padding: 6, borderRadius: 4 }}>
                      <Text style={[styles.ticketMeta, { fontWeight: 'bold', color: '#047857' }]}>DESGLOSE DE PAGO MIXTO:</Text>
                      {order.payments.map((p, idx) => (
                        <Text key={idx} style={[styles.ticketMeta, { fontSize: 10 }]}>
                          • {p.method}: {p.currency === 'VES' ? `Bs ${formatMoney(p.amount)} (${formatMoney(p.amountUsd)})` : `${formatMoney(p.amount)}`}
                        </Text>
                      ))}
                    </View>
                  ) : (!isPreAccount && order.payment && (
                    <Text style={[styles.ticketMeta, { textAlign: 'center', fontWeight: 'bold', color: '#047857' }]}>
                      PAGADO: {order.payment.method || 'Efectivo'} ({order.payment.currency || 'USD'})
                    </Text>
                  ))}

                  <View style={styles.dashedLine} />
                  <Text style={styles.ticketFooter}>*** GRACIAS POR SU COMPRA ***</Text>
                  <Text style={[styles.ticketFooter, { fontSize: 10 }]}>Por favor conserve este recibo</Text>
                </>
              )}

            </View>
          </ScrollView>

          {/* Botones de Acción */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Cerrar / Listo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <MaterialCommunityIcons name="printer" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.printBtnText}>IMPRIMIR TICKET AHORA</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  containerBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    width: 440,
    maxWidth: '95%',
    maxHeight: '92%',
    padding: 20,
    ...Platform.select({ web: { boxShadow: '0 20px 50px rgba(0,0,0,0.5)' } })
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 15,
  },
  topBarTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  closeIconBtn: { padding: 4 },

  paperScroll: { flexGrow: 0, maxHeight: 420 },
  paperContainer: { alignItems: 'center' },

  thermalPaper: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...Platform.select({ web: { boxShadow: '0 4px 15px rgba(0,0,0,0.2)' } })
  },

  kitchenHeader: { textAlign: 'center', fontSize: 20, fontWeight: '900', fontFamily: 'monospace', color: '#000' },
  kitchenTable: { textAlign: 'center', fontSize: 28, fontWeight: '900', fontFamily: 'monospace', color: '#b91c1c', marginVertical: 6 },
  
  brandTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900', fontFamily: 'monospace', color: '#000' },
  brandSubtitle: { textAlign: 'center', fontSize: 11, fontFamily: 'monospace', color: '#555', marginTop: 1 },

  dashedLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderStyle: 'dashed',
    marginVertical: 8,
  },

  ticketMeta: { fontSize: 11, fontFamily: 'monospace', color: '#000', marginVertical: 1 },
  totalLabel: { fontSize: 14, fontWeight: '900', fontFamily: 'monospace', color: '#000' },
  totalValue: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace', color: '#000' },
  ticketFooter: { textAlign: 'center', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', color: '#555', marginTop: 4 },

  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  printBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  printBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
});
