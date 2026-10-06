import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalShift, closeShift, registerShiftSale, openShift } from '../store/mockDb';

export default function CashCloseScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [actualCash, setActualCash] = useState('');
  const [hasClosed, setHasClosed] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onSync = () => setTick(t => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('RESTOSYS_DATA_SYNCED', onSync);
      return () => window.removeEventListener('RESTOSYS_DATA_SYNCED', onSync);
    }
  }, []);

  const expectedCash = (globalShift.openingCash || 0) + (globalShift.sales?.usdCash || 0);
  const inputCashNum = parseFloat(actualCash) || 0;
  const discrepancy = inputCashNum - expectedCash;

  // Demostration shortcut
  const simulateCashSale = () => {
    registerShiftSale(50, 'Efectivo', 'USD');
    alert("Venta en efectivo de $50 registrada.");
  };

  const handleClose = () => {
    if (!window.confirm("¿Seguro que deseas cerrar la caja? Esto generará el Reporte Z.")) return;
    const report = closeShift(inputCashNum, discrepancy);
    setLatestReport(report);
    setHasClosed(true);
  };

  
  if (!globalShift.isOpen && !hasClosed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c24'}}>
          <MaterialCommunityIcons name="lock-outline" size={80} color="#3f4b5b" />
          <Text style={{color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 20}}>La Caja está Cerrada</Text>
          <Text style={{color: '#6c7a8f', fontSize: 16, marginTop: 10, marginBottom: 40}}>Abre un nuevo turno para empezar a facturar.</Text>
          
          <TouchableOpacity 
            style={{backgroundColor: '#10b981', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12}}
            onPress={() => {
              openShift(100); // 100 de fondo de caja por defecto
              setTick(t => t + 1);
            }}
          >
            <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>ABRIR CAJA ($100 FONDO)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hasClosed && latestReport) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.pageTitle}>Reporte Z Generado</Text>
          <View style={styles.card}>
            <Text style={{fontSize: 18, marginBottom: 10}}>Reporte ID: {latestReport.id}</Text>
            <Text style={{fontSize: 16, marginBottom: 10}}>Efectivo Declarado: ${latestReport.actualCash}</Text>
            <Text style={{fontSize: 16, marginBottom: 10, color: latestReport.discrepancy < 0 ? 'red' : 'green'}}>
              Diferencia: ${latestReport.discrepancy}
            </Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.submitBtnTxt}>Ir al Dashboard</Text>
              </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isMobile && { paddingHorizontal: 16, paddingTop: 16 }]}>
        
        {/* Header */}
        <View style={[styles.headerSection, isMobile && { marginBottom: 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 15, alignSelf: 'flex-start'}}>
            <View style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
              <Text style={styles.backBtnText}>Volver</Text>
            </View>
          </TouchableOpacity>
          <View style={{marginTop: isMobile ? 8 : 15}}>
            <Text style={[styles.pageTitle, isMobile && { fontSize: 20 }]}>Cierre de Caja (Reporte Z)</Text>
            <Text style={[styles.pageSubtitle, isMobile && { fontSize: 12 }]}>Cuadre físico de efectivo y resumen de métodos de pago</Text>
          </View>
        </View>

        <View style={[styles.layout, isMobile && { flexDirection: 'column', gap: 16 }]}>
          
          {/* Lado Izquierdo: Resumen del Sistema */}
          <View style={styles.sysCol}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Registros del Sistema</Text>
              
              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Fondo de Caja (Apertura):</Text>
                <Text style={styles.dataVal}>$ {(globalShift.openingCash || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Ingresos por Efectivo (USD):</Text>
                <Text style={[styles.dataVal, {color: '#10b981'}]}>+ $ {(globalShift.sales?.usdCash || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.dataGroup}>
                <Text style={[styles.dataLabel, {fontSize: 14, fontWeight: 'bold'}]}>Efectivo Esperado en Gaveta:</Text>
                <Text style={[styles.dataVal, {fontSize: 24, fontWeight: 'bold'}]}>$ {expectedCash.toFixed(2)}</Text>
              </View>

              <View style={[styles.divider, { marginTop: 30 }]} />
              
              <Text style={styles.cardTitle}>Otros Métodos de Pago</Text>
              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Zelle / Binance (USD):</Text>
                <Text style={styles.dataVal}>$ {(globalShift.sales?.usdDigital || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Efectivo Bs:</Text>
                <Text style={styles.dataVal}>Bs {(globalShift.sales?.bsCash || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Pago Móvil / POS / Transferencia (Bs):</Text>
                <Text style={styles.dataVal}>Bs {(globalShift.sales?.bsDigital || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.dataGroup}>
                <Text style={styles.dataLabel}>Crédito Otorgado (CxC):</Text>
                <Text style={[styles.dataVal, {color: '#ef4444'}]}>$ {(globalShift.sales?.cxc || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Lado Derecho: Arqueo Físico */}
          <View style={styles.calcCol}>
            <View style={[styles.card, {backgroundColor: '#f8fafc', borderColor: '#cbd5e1'}]}>
              <Text style={styles.cardTitle}>Conteo Físico (Arqueo)</Text>
              
              <Text style={styles.label}>TOTAL EFECTIVO ENCONTRADO ($)</Text>
              <TextInput 
                style={styles.input} 
                value={actualCash} 
                onChangeText={setActualCash} 
                keyboardType="numeric" 
                placeholder="0.00"
                autoFocus
              />

              <View style={styles.discrepancyBox}>
                <Text style={styles.discrepancyLabel}>DIFERENCIA (CUADRE):</Text>
                <Text style={[
                  styles.discrepancyVal, 
                  { color: actualCash === '' ? '#64748b' : (discrepancy < 0 ? '#ef4444' : (discrepancy > 0 ? '#f59e0b' : '#10b981')) }
                ]}>
                  {actualCash === '' ? '$ 0.00' : `$ ${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(2)}`}
                </Text>
              </View>

              {actualCash !== '' && discrepancy < 0 && (
                <Text style={styles.warningTxt}>⚠️ FALTANTE: Faltan billetes en la gaveta. El cajero es responsable de justificar esta pérdida.</Text>
              )}
              {actualCash !== '' && discrepancy > 0 && (
                <Text style={[styles.warningTxt, {color: '#d97706', backgroundColor: '#fef3c7', borderColor: '#fde68a'}]}>ℹ️ SOBRANTE: Hay más dinero del registrado. Puede ser un error al dar vuelto.</Text>
              )}
              {actualCash !== '' && discrepancy === 0 && (
                <Text style={[styles.warningTxt, {color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0'}]}>✅ CUADRE PERFECTO.</Text>
              )}

              <TouchableOpacity style={styles.processBtn} onPress={handleClose}>
                <MaterialCommunityIcons name="lock-check" size={24} color="#fff" style={{marginRight: 10}} />
                <Text style={styles.processBtnTxt}>Ejecutar Cierre Z</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { paddingHorizontal: 40, paddingTop: 30, paddingBottom: 50 },
  
  headerSection: { marginBottom: 30 },
  backBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  demoBtn: { backgroundColor: '#e0e7ff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  demoBtnTxt: { color: '#4338ca', fontWeight: 'bold', fontSize: 12 },

  layout: { flexDirection: 'row', gap: 30 },
  sysCol: { flex: 1 },
  calcCol: { flex: 1.2 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 30, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  
  dataGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  dataLabel: { fontSize: 13, color: '#64748b' },
  dataVal: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },

  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 18, fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 30, backgroundColor: '#fff', outlineStyle: 'none', textAlign: 'center' },

  discrepancyBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  discrepancyLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  discrepancyVal: { fontSize: 28, fontWeight: '900' },

  warningTxt: { fontSize: 13, color: '#dc2626', backgroundColor: '#fef2f2', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 30, lineHeight: 20 },

  processBtn: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(15, 23, 42, 0.2)' } }) },
  processBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 }
});
