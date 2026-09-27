import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { globalUsers, globalCurrentUser, setCurrentUser, globalMasterConfig } from '../store/mockDb';

const ROLE_COLORS = {
  owner: { color: '#e11d48', bg: '#ffe4e6', label: 'Sistema', icon: 'shield-crown' },
  admin: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Administrador', icon: 'shield-account' },
  cashier: { color: '#0284c7', bg: '#f0f9ff', label: 'Cajero / POS', icon: 'cash-register' },
  cook: { color: '#d97706', bg: '#fffbeb', label: 'Cocinero / Chef', icon: 'chef-hat' }
};

export default function PinLoginModal({ visible, onUnlock }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Seleccionar usuario inicial por defecto
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMessage('');
      const defaultUser = globalUsers.find(u => u.id === globalCurrentUser.id) || globalUsers[0];
      setSelectedUser(defaultUser);
    }
  }, [visible]);

  // Soporte para teclado físico en Web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleVerifyPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, pin, selectedUser]);

  const handleDigitPress = (digit) => {
    if (pin.length >= 6) return;
    setErrorMessage('');
    const newPin = pin + digit;
    setPin(newPin);

    // Auto-verificar si tiene 4 dígitos (longitud estándar)
    if (newPin.length === 4 && selectedUser) {
      verifyCode(newPin, selectedUser);
    }
  };

  const handleDelete = () => {
    setErrorMessage('');
    setPin(prev => prev.slice(0, -1));
  };

  const verifyCode = (codeToVerify, user) => {
    const isCorrect = (user && user.pin === codeToVerify) || codeToVerify === globalMasterConfig.masterPin;
    if (isCorrect) {
      setCurrentUser(user.id);
      setPin('');
      setErrorMessage('');
      if (onUnlock) onUnlock(user);
    } else {
      setErrorMessage('❌ PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const handleVerifyPin = () => {
    if (!selectedUser) {
      setErrorMessage('Selecciona un usuario primero.');
      return;
    }
    verifyCode(pin, selectedUser);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={styles.container}>
        
        {/* Logo y Encabezado */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
          />
          <Text style={styles.title}>LAGO WOK ZHEN</Text>
          <Text style={styles.subtitle}>Selecciona tu usuario e ingresa tu PIN de acceso</Text>
        </View>

        {/* Tarjetas de Selección de Usuario */}
        <View style={styles.usersRow}>
          {globalUsers.map(user => {
            const isSelected = selectedUser && selectedUser.id === user.id;
            const roleInfo = ROLE_COLORS[user.role] || ROLE_COLORS.cashier;

            return (
              <TouchableOpacity 
                key={user.id} 
                style={[styles.userCard, isSelected && styles.userCardSelected]}
                onPress={() => {
                  setSelectedUser(user);
                  setPin('');
                  setErrorMessage('');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarBox, { backgroundColor: roleInfo.bg }]}>
                  <MaterialCommunityIcons name={roleInfo.icon} size={28} color={roleInfo.color} />
                </View>
                <Text style={styles.userNameText} numberOfLines={1}>{user.name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
                  <Text style={[styles.roleBadgeTxt, { color: roleInfo.color }]}>
                    {roleInfo.label.toUpperCase()}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedCheck}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Panel de PIN */}
        <View style={styles.pinPanel}>
          {selectedUser && (
            <Text style={styles.pinPrompt}>
              Ingresa el PIN de <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{selectedUser.name}</Text>:
            </Text>
          )}

          {/* Indicador de dígitos ingresados */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  pin.length > i && styles.dotFilled,
                  errorMessage ? styles.dotError : null
                ]} 
              />
            ))}
          </View>

          {/* Mensaje de error */}
          {errorMessage.length > 0 && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* Teclado Numérico */}
          <View style={styles.keypad}>
            <View style={styles.keyRow}>
              {[1, 2, 3].map(num => (
                <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleDigitPress(num.toString())}>
                  <Text style={styles.keyText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keyRow}>
              {[4, 5, 6].map(num => (
                <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleDigitPress(num.toString())}>
                  <Text style={styles.keyText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keyRow}>
              {[7, 8, 9].map(num => (
                <TouchableOpacity key={num} style={styles.keyBtn} onPress={() => handleDigitPress(num.toString())}>
                  <Text style={styles.keyText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keyRow}>
              <TouchableOpacity style={[styles.keyBtn, styles.actionKey]} onPress={handleDelete}>
                <MaterialCommunityIcons name="backspace-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.keyBtn} onPress={() => handleDigitPress('0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.keyBtn, styles.enterKey]} onPress={handleVerifyPin}>
                <MaterialCommunityIcons name="arrow-right-bold" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 24
  },
  logo: {
    height: 70,
    width: 220,
    resizeMode: 'contain',
    marginBottom: 8
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4
  },
  usersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 25,
    maxWidth: 600
  },
  userCard: {
    backgroundColor: '#131b2e',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 130,
    borderWidth: 2,
    borderColor: '#1e293b',
    position: 'relative',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s' } })
  },
  userCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#172554',
    transform: [{ scale: 1.03 }]
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  userNameText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    maxWidth: 120,
    textAlign: 'center'
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  roleBadgeTxt: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  selectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6
  },
  pinPanel: {
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#1f2937',
    ...Platform.select({ web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' } })
  },
  pinPrompt: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center'
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: 'transparent'
  },
  dotFilled: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8'
  },
  dotError: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  keypad: {
    width: '100%',
    gap: 10,
    marginTop: 8
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  keyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#1f293d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({ web: { cursor: 'pointer', userSelect: 'none' } })
  },
  keyText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold'
  },
  actionKey: {
    backgroundColor: '#331e28',
    borderColor: '#5c2234'
  },
  enterKey: {
    backgroundColor: '#10b981',
    borderColor: '#059669'
  }
});
