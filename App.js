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

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary captured error:", error, errorInfo);
  }

  handleReset = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('RESTOSYS_LITE_DB_V1');
    }
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', color: '#f43f5e', marginBottom: '12px' }}>
            ⚠️ Lago Wok Zhen - Error de inicialización
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
            Ocurrió un problema temporal al cargar los datos en memoria. Puedes presionar el botón a continuación para restablecer y recargar la aplicación limpiamente.
          </p>
          <button 
            onClick={this.handleReset}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 Recargar y Restablecer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

