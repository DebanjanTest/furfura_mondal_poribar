import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Providers
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AudioProvider } from './context/AudioContext.jsx';
import { UIProvider } from './context/UIContext.jsx';

// Stylesheets
import './styles/main.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL REACT RENDER ERROR:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: '#160205',
          color: '#ffcf40',
          padding: '2rem',
          zIndex: 999999,
          overflow: 'auto',
          fontFamily: 'monospace'
        }}>
          <h2>React Encountered a Display Issue</h2>
          <p style={{ color: '#ffffff' }}>{this.state.error?.message || String(this.state.error)}</p>
          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px', color: '#ff7777', overflowX: 'auto' }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ffcf40',
              color: '#160308',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <GlobalErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AudioProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </AudioProvider>
        </AuthProvider>
      </LanguageProvider>
    </GlobalErrorBoundary>
  );
}
