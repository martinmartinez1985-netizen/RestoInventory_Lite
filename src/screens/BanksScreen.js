import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { globalBanks } from '../store/mockDb';

export default function BanksScreen() {
  const [banks, setBanks] = useState(globalBanks);

  useFocusEffect(
    useCallback(() => {
      setBanks([...globalBanks]);
    }, [])
  );

  const globalLiquidity = banks.reduce((sum, bank) => sum + bank.usd, 0);

  const formatMoney = (amount) => {
    return Math.abs(amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderCard = ({ item }) => {
    const isRed = item.isOverdraft;
    const cardBorderColor = isRed ? '#fca5a5' : '#e2e8f0';
    const amountColor = isRed ? '#ef4444' : '#0f172a';
    const pillColor = item.type.includes('USD') ? '#10b981' : (isRed ? '#64748b' : '#64748b'); // green for USD, grey for BS

    return (
      <View style={[styles.card, { borderColor: cardBorderColor }]}>
        <View style={styles.cardTop}>
          <View style={styles.bankIconBox}>
            <MaterialCommunityIcons name="bank" size={18} color="#64748b" />
          </View>
          <View style={styles.bankInfo}>
            <Text style={styles.bankName}>{item.name}</Text>
            {item.code ? <Text style={styles.bankCode}>{item.code}</Text> : null}
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={[styles.usdAmount, { color: amountColor }]}>
              {item.usd < 0 ? '-' : ''}$ {formatMoney(item.usd)}
            </Text>
            {item.bs !== null && (
              <Text style={[styles.bsAmount, { color: isRed ? '#ef4444' : '#64748b' }]}>
                {item.bs < 0 ? '-' : ''}Bs. {formatMoney(item.bs)}
              </Text>
            )}
          </View>
          
          <View style={[styles.pill, { borderColor: pillColor }]}>
            <Text style={[styles.pillText, { color: pillColor }]}>{item.type}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header Title */}
        <View style={styles.headerSection}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name="bank-outline" size={28} color="#1e293b" style={{marginRight: 10}} />
            <Text style={styles.pageTitle}>Tesorería y Bancos</Text>
          </View>
          <Text style={styles.pageSubtitle}>Gestiona la liquidez y las cuentas bancarias de la empresa.</Text>
        </View>

        {/* Global Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.liquidityBox}>
            <Text style={styles.liquidityLabel}>LIQUIDEZ GLOBAL</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={styles.greenDot} />
              <Text style={styles.liquidityVal}>$ {formatMoney(globalLiquidity)}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.btnWhite}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#1e293b" />
              <Text style={styles.btnWhiteTxt}>Traspasos entre Cuentas</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnWhite}>
              <MaterialCommunityIcons name="chart-bar" size={18} color="#1e293b" />
              <Text style={styles.btnWhiteTxt}>SAPS (FX)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDark}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.btnDarkTxt}>Añadir Cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banks Grid */}
        <FlatList
          data={banks}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          numColumns={4}
          columnWrapperStyle={{ gap: 20 }}
          contentContainerStyle={{ paddingBottom: 40, gap: 20 }}
          key={4} // Force 4 columns on wide screens
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingHorizontal: 40, paddingTop: 30, backgroundColor: '#f8fafc' },
  
  headerSection: { marginBottom: 30 },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 20 },
  liquidityBox: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  liquidityLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
  liquidityVal: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },

  actionButtons: { flexDirection: 'row', gap: 12 },
  btnWhite: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnWhiteTxt: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#1e293b' },
  btnDark: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnDarkTxt: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#fff' },

  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, padding: 20, minWidth: 250, ...Platform.select({ web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.02)' } }) },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  bankIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  bankCode: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  usdAmount: { fontSize: 20, fontWeight: 'bold' },
  bsAmount: { fontSize: 11, marginTop: 4 },
  
  pill: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillText: { fontSize: 10, fontWeight: '600' }
});
