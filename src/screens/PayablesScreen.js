import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalPayables, addPayable, updatePayable, globalDirectory, globalBanks, updateBankBalance } from '../store/mockDb';

const MethodButton = ({ method, current, onSelect, icon }) => (
  <TouchableOpacity 
    style={[styles.methodBtn, current === method && styles.methodBtnActive]}
    onPress={() => onSelect(method)}
  >
    <MaterialCommunityIcons name={icon} size={28} color={current === method ? '#3b82f6' : '#64748b'} />
    <Text style={[styles.methodBtnText, current === method && styles.methodBtnTextActive]}>{method}</Text>
  </TouchableOpacity>
);

export default function PayablesScreen({ route, navigation }) {
  const [debts, setDebts] = useState(globalPayables);
  const [selectedClientId, setSelectedClientId] = useState(null);
  
  const filterType = route.params?.type;
  const pageTitleExtra = route.params?.title || '';

  // Payment Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentConcept, setPaymentConcept] = useState('Abono');
  const [exchangeRate, setExchangeRate] = useState('38.50');
  const [amountUSD, setAmountUSD] = useState('');
  const [amountBS, setAmountBS] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('DIVISAS');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);

  // View/Edit Modal State
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setDebts([...globalPayables]);
    }, [])
  );

  // Data processing
  const clientsLedger = useMemo(() => {
    const ledger = {};
    debts.forEach(trx => {
      // Find client to determine type
      const dirContact = globalDirectory.find(c => c.id === trx.clientId);
      const cType = dirContact ? dirContact.type : 'Clientes'; // Default if not found
      
      // If a filter type is set and doesn't match, skip
      if (filterType && cType !== filterType) return;

      if (!ledger[trx.clientId]) {
        ledger[trx.clientId] = {
          clientId: trx.clientId,
          clientName: trx.clientName,
          transactions: [],
          balance: 0,
          totalCargos: 0,
          totalAbonos: 0
        };
      }
      ledger[trx.clientId].transactions.push(trx);
      ledger[trx.clientId].totalCargos += trx.debit || 0;
      ledger[trx.clientId].totalAbonos += trx.credit || 0;
      ledger[trx.clientId].balance += (trx.credit - trx.debit);
    });
    return ledger;
  }, [debts, filterType]);

  const ledgerData = Object.values(clientsLedger).filter(c => c.balance > 0 || c.transactions.length > 0);
  const totalGlobalDebts = ledgerData.reduce((sum, item) => sum + item.balance, 0);

  const activeClientData = selectedClientId ? clientsLedger[selectedClientId] : null;

  // Modals logic
  const handleOpenPayment = () => {
    if (!activeClientData) return;
    setAmountUSD(activeClientData.balance.toFixed(2));
    setAmountBS((activeClientData.balance * parseFloat(exchangeRate)).toFixed(2));
    setIsPaymentModalVisible(true);
  };

  const handleUSDChange = (text) => {
    setAmountUSD(text);
    const rate = parseFloat(exchangeRate) || 0;
    const usd = parseFloat(text) || 0;
    setAmountBS((usd * rate).toFixed(2));
  };

  const handleBSChange = (text) => {
    setAmountBS(text);
    const rate = parseFloat(exchangeRate) || 0;
    const bs = parseFloat(text) || 0;
    if (rate > 0) setAmountUSD((bs / rate).toFixed(2));
  };

  const handleRateChange = (text) => {
    setExchangeRate(text);
    const rate = parseFloat(text) || 0;
    const usd = parseFloat(amountUSD) || 0;
    setAmountBS((usd * rate).toFixed(2));
  };

  const handleProcessPayment = () => {
    const amt = parseFloat(amountUSD);
    if (!amt || amt <= 0) {
      alert("Por favor ingrese un monto válido.");
      return;
    }
    if (!paymentMethod) {
      alert("Por favor selecciona un método de pago.");
      return;
    }
    if (!selectedBank) {
      alert("Por favor selecciona un banco a afectar.");
      return;
    }
    
    const methodInfo = `${paymentCurrency} - ${paymentMethod}`;
    const rateInfo = paymentCurrency === 'BS' ? ` | Tasa: ${exchangeRate} | Ref: ${amountBS} BS` : '';
    const finalConcept = `${paymentConcept} (${methodInfo}${rateInfo})`;

    const newTrx = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      clientId: activeClientData.clientId,
      clientName: activeClientData.clientName,
      date: new Date().toISOString().split('T')[0],
      concept: finalConcept,
      debit: amt,
      credit: 0
    };

    addPayable(newTrx);
    // Money goes OUT in Payables
    updateBankBalance(selectedBank, -amt, paymentCurrency === 'BS' ? -parseFloat(amountBS) : 0);
    setDebts([...globalPayables]); 
    setIsPaymentModalVisible(false);
    setPaymentMethod('');
    setSelectedBank(null);
  };

  const handleOpenView = (trx) => {
    // Deep copy to allow editing without mutating state directly until save
    setEditingDoc({
      ...trx,
      amountStr: trx.debit > 0 ? trx.debit.toString() : trx.credit.toString(),
      typeStr: trx.debit > 0 ? 'CARGO' : 'ABONO'
    });
    setIsViewModalVisible(true);
  };

  const handleSaveView = () => {
    if (!editingDoc.id || !editingDoc.date || !editingDoc.concept) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }
    
    const numAmt = parseFloat(editingDoc.amountStr);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert('El monto debe ser un número válido mayor a 0.');
      return;
    }

    const updatedTrx = {
      ...editingDoc,
      debit: editingDoc.typeStr === 'CARGO' ? numAmt : 0,
      credit: editingDoc.typeStr === 'ABONO' ? numAmt : 0,
    };
    
    // Remove temporary view fields
    delete updatedTrx.amountStr;
    delete updatedTrx.typeStr;

    updatePayable(updatedTrx);
    setDebts([...globalPayables]); // refresh
    setIsViewModalVisible(false);
  };

  const renderClientRow = ({ item }) => (
    <TouchableOpacity style={styles.clientRow} onPress={() => setSelectedClientId(item.clientId)}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="account-tie" size={24} color="#3b82f6" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.clientNameTxt}>{item.clientName}</Text>
        <Text style={styles.clientCountTxt}>{item.transactions.length} Documentos</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.clientBalanceTxt}>${item.balance.toFixed(2)}</Text>
        <Text style={styles.clientStatusTxt}>{item.balance > 0 ? 'Con Deuda' : 'Solvente'}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" style={{ marginLeft: 15 }} />
    </TouchableOpacity>
  );

  const renderDetailView = () => {
    if (!activeClientData) return null;
    let runningBalance = 0;

    return (
      <View style={styles.detailContainer}>
        {/* Top bar inside card */}
        <View style={styles.detailTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedClientId(null)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#64748b" />
            <Text style={styles.backBtnText}>Volver al listado</Text>
          </TouchableOpacity>
          <View style={styles.globalBalanceBox}>
            <Text style={styles.globalBalanceLabel}>SALDO GLOBAL ADEUDADO</Text>
            <Text style={styles.globalBalanceVal}>${activeClientData.balance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.clientHeader}>
          <Text style={styles.clientLabel}>CLIENTE</Text>
          <Text style={styles.clientTitle}>{activeClientData.clientName}</Text>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>PERÍODO</Text>
          <View style={styles.dropdownFake}>
            <Text style={styles.dropdownFakeTxt}>Historial Completo</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.5 }]}>FECHA</Text>
            <Text style={[styles.th, { flex: 2 }]}>Nº DOCUMENTO / REF</Text>
            <Text style={[styles.th, { flex: 3 }]}>CONCEPTO</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>CARGO</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>ABONO</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>SALDO</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>ACCIONES</Text>
          </View>

          {activeClientData.transactions.map((trx) => {
            runningBalance += (trx.credit - trx.debit);
            return (
              <View key={trx.id} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.5 }]}>{trx.date}</Text>
                <Text style={[styles.td, { flex: 2, color: '#64748b' }]}>{trx.id}</Text>
                <Text style={[styles.td, { flex: 3 }]}>{trx.concept}</Text>
                <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: trx.debit > 0 ? '600' : '400' }]}>
                  {trx.debit > 0 ? `$${trx.debit.toFixed(2)}` : '-'}
                </Text>
                <Text style={[styles.td, { flex: 1.5, textAlign: 'right', color: trx.credit > 0 ? '#10b981' : '#1e293b' }]}>
                  {trx.credit > 0 ? `$${trx.credit.toFixed(2)}` : '-'}
                </Text>
                <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: 'bold' }]}>
                  ${runningBalance.toFixed(2)}
                </Text>
                <View style={[styles.td, { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 10 }]}>
                  <TouchableOpacity onPress={() => handleOpenView(trx)} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="eye-outline" size={18} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => alert('Eliminar documento')} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.tableFooter}>
            <Text style={[styles.footerLabel, { flex: 6.5, textAlign: 'right', paddingRight: 20 }]}>TOTALES DEL PERÍODO:</Text>
            <Text style={[styles.footerVal, { flex: 1.5, textAlign: 'right' }]}>${activeClientData.totalCargos.toFixed(2)}</Text>
            <Text style={[styles.footerVal, { flex: 1.5, textAlign: 'right', color: '#10b981' }]}>${activeClientData.totalAbonos.toFixed(2)}</Text>
            <Text style={[styles.footerVal, { flex: 1.5, textAlign: 'right' }]}>${activeClientData.balance.toFixed(2)}</Text>
            <Text style={{ flex: 1, textAlign: 'center', color: '#64748b' }}>-</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Main Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            {!selectedClientId && (
              <TouchableOpacity onPress={() => navigation.navigate('Payables')} style={{marginRight: 15}}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.pageTitle}>{selectedClientId ? 'Libro Mayor del Cliente' : `Cuentas por Pagar ${pageTitleExtra ? '- ' + pageTitleExtra : ''}`}</Text>
              <Text style={styles.pageSubtitle}>Gestión de cartera, derechos de cobro y antigüedad de saldos</Text>
            </View>
          </View>
          
          {selectedClientId ? (
            <TouchableOpacity style={styles.newDocBtn} onPress={handleOpenPayment}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.newDocBtnTxt}>NUEVO DOCUMENTO / CXC</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Cartera Total (USD)</Text>
              <Text style={styles.totalVal}>${totalGlobalDebts.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {selectedClientId ? (
          renderDetailView()
        ) : (
          <View style={styles.listWrapper}>
             <FlatList
              data={ledgerData}
              keyExtractor={(item) => item.clientId}
              renderItem={renderClientRow}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        )}

        {/* Payment Modal */}
        <Modal visible={isPaymentModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Registrar Documento (Abono)</Text>
              {activeClientData && (
                <Text style={{ marginBottom: 15, color: '#475569', fontSize: 14 }}>
                  Cliente: <Text style={{ fontWeight: 'bold' }}>{activeClientData.clientName}</Text>
                  {'\n'}Saldo Actual: <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>${activeClientData.balance.toFixed(2)}</Text>
                </Text>
              )}

              <Text style={styles.label}>Concepto</Text>
              <TextInput style={styles.input} value={paymentConcept} onChangeText={setPaymentConcept} />

              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tasa de Cambio (BS)</Text>
                  <TextInput style={[styles.input, { marginBottom: 0, color: '#10b981', fontWeight: 'bold' }]} value={exchangeRate} onChangeText={handleRateChange} keyboardType="numeric" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Monto en Divisas (USD)</Text>
                  <TextInput style={[styles.input, { fontWeight: 'bold' }]} value={amountUSD} onChangeText={handleUSDChange} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Monto en Bolívares (BS)</Text>
                  <TextInput style={[styles.input, { fontWeight: 'bold' }]} value={amountBS} onChangeText={handleBSChange} keyboardType="numeric" />
                </View>
              </View>

              <Text style={styles.label}>Moneda del Pago:</Text>
              <View style={styles.currencyToggle}>
                <TouchableOpacity style={[styles.currencyBtn, paymentCurrency === 'DIVISAS' && styles.currencyBtnActive]} onPress={() => { setPaymentCurrency('DIVISAS'); setPaymentMethod(''); }}>
                  <Text style={[styles.currencyBtnText, paymentCurrency === 'DIVISAS' && styles.currencyBtnTextActive]}>DIVISAS (USD)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.currencyBtn, paymentCurrency === 'BS' && styles.currencyBtnActive]} onPress={() => { setPaymentCurrency('BS'); setPaymentMethod(''); }}>
                  <Text style={[styles.currencyBtnText, paymentCurrency === 'BS' && styles.currencyBtnTextActive]}>BOLÍVARES (BS)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Método de pago:</Text>
              <View style={styles.methodsContainer}>
                {paymentCurrency === 'DIVISAS' ? (
                  <>
                    <MethodButton method="Zelle" current={paymentMethod} onSelect={setPaymentMethod} icon="bank-transfer" />
                    <MethodButton method="Efectivo" current={paymentMethod} onSelect={setPaymentMethod} icon="cash" />
                    <MethodButton method="Binance" current={paymentMethod} onSelect={setPaymentMethod} icon="bitcoin" />
                  </>
                ) : (
                  <>
                    <MethodButton method="Pago Móvil" current={paymentMethod} onSelect={setPaymentMethod} icon="cellphone" />
                    <MethodButton method="Transferencia" current={paymentMethod} onSelect={setPaymentMethod} icon="bank" />
                    <MethodButton method="Efectivo" current={paymentMethod} onSelect={setPaymentMethod} icon="cash-multiple" />
                  </>
                )}
              </View>

              <Text style={styles.label}>Banco a Afectar:</Text>
              <View style={{ marginBottom: 25, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {globalBanks.map(b => (
                  <TouchableOpacity 
                    key={b.id} 
                    style={[styles.bankSelectBtn, selectedBank === b.id && styles.bankSelectBtnActive]}
                    onPress={() => setSelectedBank(b.id)}
                  >
                    <Text style={[styles.bankSelectBtnTxt, selectedBank === b.id && styles.bankSelectBtnTxtActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsPaymentModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, (!paymentMethod || !selectedBank) && { backgroundColor: '#94a3b8' }]} disabled={!paymentMethod || !selectedBank} onPress={handleProcessPayment}>
                  <Text style={styles.confirmBtnText}>Procesar Pago</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* View/Edit Modal */}
        <Modal visible={isViewModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              
              <View style={styles.viewModalHeader}>
                <View style={styles.viewModalTitleRow}>
                  <View style={styles.iconBoxSmall}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={styles.modalTitleSmall}>Ver / Editar Documento</Text>
                    <Text style={styles.modalSubtitle}>Modificar los parámetros y saldos contables del documento</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsViewModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {editingDoc && (
                <>
                  <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>FECHA</Text>
                      <TextInput 
                        style={styles.input} 
                        value={editingDoc.date} 
                        onChangeText={(val) => setEditingDoc({...editingDoc, date: val})}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Nº DOCUMENTO / REF</Text>
                      <TextInput 
                        style={styles.input} 
                        value={editingDoc.id} 
                        editable={false} // IDs shouldn't be edited normally, but visually looks like input
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>DESCRIPCIÓN</Text>
                  <TextInput 
                    style={styles.input} 
                    value={editingDoc.concept} 
                    onChangeText={(val) => setEditingDoc({...editingDoc, concept: val})}
                  />

                  <View style={styles.grayBoxForm}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>MONTO DEL MOVIMIENTO ($)</Text>
                      <TextInput 
                        style={[styles.input, { backgroundColor: '#fff' }]} 
                        value={editingDoc.amountStr} 
                        onChangeText={(val) => setEditingDoc({...editingDoc, amountStr: val})}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>TIPO (Cargo / Abono)</Text>
                      <View style={styles.typeSelectorRow}>
                        <TouchableOpacity 
                          style={[styles.typeBtn, editingDoc.typeStr === 'CARGO' && styles.typeBtnActiveC]}
                          onPress={() => setEditingDoc({...editingDoc, typeStr: 'CARGO'})}
                        >
                          <Text style={[styles.typeBtnTxt, editingDoc.typeStr === 'CARGO' && styles.typeBtnTxtActive]}>CARGO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.typeBtn, editingDoc.typeStr === 'ABONO' && styles.typeBtnActiveA]}
                          onPress={() => setEditingDoc({...editingDoc, typeStr: 'ABONO'})}
                        >
                          <Text style={[styles.typeBtnTxt, editingDoc.typeStr === 'ABONO' && styles.typeBtnTxtActive]}>ABONO</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsViewModalVisible(false)}>
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveDarkBtn} onPress={handleSaveView}>
                      <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
                      <Text style={styles.saveDarkBtnText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30, backgroundColor: '#f8fafc' },
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748b' },
  totalBox: { backgroundColor: '#1e293b', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 16, alignItems: 'flex-end', ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(31, 42, 58, 0.3)' } }) },
  totalLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  totalVal: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  newDocBtn: { backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(79, 70, 229, 0.4)' } }) },
  newDocBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },

  listWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  clientRow: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBox: { width: 45, height: 45, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  clientNameTxt: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  clientCountTxt: { fontSize: 13, color: '#64748b' },
  clientBalanceTxt: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  clientStatusTxt: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 2 },

  detailContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.05)' } }) },
  detailTopBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  backBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#475569' },
  globalBalanceBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
  globalBalanceLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  globalBalanceVal: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  
  clientHeader: { paddingHorizontal: 25, paddingTop: 25 },
  clientLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginBottom: 4 },
  clientTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  
  filterRow: { paddingHorizontal: 25, paddingVertical: 20 },
  filterLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold', marginBottom: 8 },
  dropdownFake: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, width: 220 },
  dropdownFakeTxt: { fontSize: 14, color: '#1e293b' },

  tableContainer: { flex: 1 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 15, backgroundColor: '#f8fafc', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  th: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  td: { fontSize: 13, color: '#1e293b' },
  tableFooter: { flexDirection: 'row', paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#f8fafc', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  footerLabel: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  footerVal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: 450, maxWidth: '90%', borderRadius: 16, padding: 24, ...Platform.select({ web: { boxShadow: '0px 20px 40px rgba(0,0,0,0.2)' } }) },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b', marginBottom: 16, outlineStyle: 'none' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#10b981', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },

  currencyToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 15 },
  currencyBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  currencyBtnActive: { backgroundColor: '#ffffff', ...Platform.select({ web: { boxShadow: '0px 2px 10px rgba(0,0,0,0.05)' } }) },
  currencyBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  currencyBtnTextActive: { color: '#0f172a' },
  methodsContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  methodBtn: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, alignItems: 'center', justifyContent: 'center' },
  methodBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  methodBtnText: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#64748b' },
  methodBtnTextActive: { color: '#3b82f6' },

  bankSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  bankSelectBtnActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  bankSelectBtnTxt: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  bankSelectBtnTxtActive: { color: '#fff' },

  // View Modal specific styles
  viewModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  viewModalTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBoxSmall: { backgroundColor: '#eff6ff', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  modalTitleSmall: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  grayBoxForm: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 20, flexDirection: 'row', gap: 15, marginTop: 5, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
  typeSelectorRow: { flexDirection: 'row', gap: 10, marginTop: 0 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', alignItems: 'center' },
  typeBtnActiveC: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  typeBtnActiveA: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  typeBtnTxt: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  typeBtnTxtActive: { color: '#0f172a' },
  saveDarkBtn: { backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  saveDarkBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 }
});
