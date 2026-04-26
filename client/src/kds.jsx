import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './context/AuthContext';
import KDSView from './components/KDSView/KDSView';
import './index.css';
import './components/POS.css';

function KDSApp() {
  const { loading, isAuthenticated, backendEnabled } = useAuth();

  if (!backendEnabled) {
    return (
      <div className="kds-standalone">
        <div className="kds-offline">
          <h2>KDS Unavailable</h2>
          <p>No backend configured. Set VITE_API_URL to enable KDS.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kds-standalone">
        <div className="kds-offline">
          <p>Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="kds-standalone">
        <div className="kds-offline">
          <h2>Not Authenticated</h2>
          <p>Sign in on the POS first, then reopen this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kds-standalone">
      <div className="kds-standalone-header">
        <span className="kds-standalone-title">Easy Table KDS</span>
      </div>
      <KDSView />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <KDSApp />
    </AuthProvider>
  </React.StrictMode>,
);
