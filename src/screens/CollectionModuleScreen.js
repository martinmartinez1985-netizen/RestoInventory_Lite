import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CollectionModuleScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Main Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Receivables')} style={{marginRight: 15}}>
              <View style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={16} color="#64748b" />
                <Text style={styles.backBtnText}>Volver</Text>
              </View>
            </TouchableOpacity>
            <View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialCommunityIcons name="account-group" size={26} color="#1e293b" style={{marginRight: 8}} />
                <Text style={styles.pageTitle}>Módulo Cobranza</Text>
              </View>
              <Text style={styles.pageSubtitle}>Gestión de cartera, derechos de cobro y antigüedad de saldos</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.newDocBtn}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.newDocBtnTxt}>NUEVO DOCUMENTO / CXC</Text>
          </TouchableOpacity>
        </View>

        {/* Content Layout: 2 Columns */}
        <View style={styles.contentLayout}>
          
          {/* Left Column: Form */}
          <View style={styles.leftCol}>
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="bank-outline" size={20} color="#334155" />
                <Text style={styles.cardTitle}>Detalles del Cobro</Text>
              </View>

              <Text style={styles.label}>BANCO A AFECTAR</Text>
              <View style={styles.fakeDropdown}>
                <Text style={styles.fakeDropdownTxt}>Seleccione un banco...</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
              </View>

              <Text style={styles.label}>Nº REFERENCIA</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. DEP-00123" 
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>FECHA DE COBRO</Text>
              <View style={styles.fakeDropdown}>
                <Text style={styles.fakeDropdownTxt}>23/08/2026</Text>
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#1e293b" />
              </View>

              <View style={styles.clientLabelRow}>
                <Text style={styles.label}>CLIENTE / ENTIDAD</Text>
                <View style={styles.typeButtonsRow}>
                  <View style={styles.tinyBtn}><Text style={styles.tinyBtnTxt}>C</Text></View>
                  <View style={styles.tinyBtn}><Text style={styles.tinyBtnTxt}>I</Text></View>
                  <View style={styles.tinyBtn}><Text style={styles.tinyBtnTxt}>A</Text></View>
                  <View style={styles.tinyBtn}><Text style={styles.tinyBtnTxt}>E</Text></View>
                </View>
              </View>
              
              <View style={styles.searchBox}>
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Haga click para buscar cliente..." 
                  placeholderTextColor="#94a3b8"
                />
                <MaterialCommunityIcons name="magnify" size={20} color="#cbd5e1" style={styles.searchIcon} />
              </View>

            </View>
          </View>

          {/* Right Column: Placeholder */}
          <View style={styles.rightCol}>
            <View style={styles.placeholderBox}>
              <View style={styles.placeholderIconCircle}>
                <MaterialCommunityIcons name="account-group-outline" size={40} color="#cbd5e1" />
              </View>
              <Text style={styles.placeholderTitle}>Seleccione un cliente</Text>
              <Text style={styles.placeholderSub}>Elija un cliente en el panel de detalles para ver sus cuentas pendientes y registrar un nuevo cobro.</Text>
            </View>
          </View>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30, backgroundColor: '#f8fafc' },
  
  // Header
  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  backBtnText: { marginLeft: 4, fontSize: 13, fontWeight: '600', color: '#475569' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  newDocBtn: { backgroundColor: '#4f46e5', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(79, 70, 229, 0.4)' } }) },
  newDocBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginLeft: 8 },

  // Layout
  contentLayout: { flexDirection: 'row', flex: 1, gap: 20, paddingBottom: 40 },
  
  // Left Col
  leftCol: { width: 350 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 25, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.03)' } }) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginLeft: 10 },
  
  label: { fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  fakeDropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 20 },
  fakeDropdownTxt: { fontSize: 14, color: '#475569' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1e293b', marginBottom: 20, backgroundColor: '#f8fafc', outlineStyle: 'none' },
  
  clientLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeButtonsRow: { flexDirection: 'row', gap: 4 },
  tinyBtn: { width: 22, height: 22, backgroundColor: '#0f172a', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  tinyBtnTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: '#f8fafc' },
  searchInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1e293b', outlineStyle: 'none' },
  searchIcon: { paddingRight: 15 },

  // Right Col
  rightCol: { flex: 1 },
  placeholderBox: { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 40 },
  placeholderIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 },
  placeholderSub: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 400, lineHeight: 22 }
});
