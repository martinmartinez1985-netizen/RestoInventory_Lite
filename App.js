import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Inyección automática de fuentes Vector Icons para Web (garantiza íconos perfectos en cualquier hosting)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const cdnBase = 'https://cdn.jsdelivr.net/npm/@expo/vector-icons@15.1.1/build/vendor/react-native-vector-icons/Fonts';
  const iconFonts = `
    @font-face {
      font-family: 'material-community';
      src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
           url('${cdnBase}/MaterialCommunityIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'),
           url('${cdnBase}/MaterialCommunityIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'material';
      src: url('/fonts/MaterialIcons.ttf') format('truetype'),
           url('${cdnBase}/MaterialIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'MaterialIcons';
      src: url('/fonts/MaterialIcons.ttf') format('truetype'),
           url('${cdnBase}/MaterialIcons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'ionicons';
      src: url('/fonts/Ionicons.ttf') format('truetype'),
           url('${cdnBase}/Ionicons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'Ionicons';
      src: url('/fonts/Ionicons.ttf') format('truetype'),
           url('${cdnBase}/Ionicons.ttf') format('truetype');
      font-display: swap;
    }
    @font-face {
      font-family: 'FontAwesome';
      src: url('/fonts/FontAwesome.ttf') format('truetype'),
           url('${cdnBase}/FontAwesome.ttf') format('truetype');
      font-display: swap;
    }
  `;

  if (!document.getElementById('expo-vector-icons-web-fonts')) {
    const style = document.createElement('style');
    style.id = 'expo-vector-icons-web-fonts';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(iconFonts));
    document.head.appendChild(style);
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
