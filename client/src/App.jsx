import { POSProvider } from './context/POSContext';
import { UIProvider } from './context/UIContext';
import { AuthProvider } from './context/AuthContext';
import BackendSync from './components/BackendSync';
import POS from './components/POS';

function App() {
  return (
    <AuthProvider>
      <POSProvider>
        <BackendSync />
        <UIProvider>
          <POS />
        </UIProvider>
      </POSProvider>
    </AuthProvider>
  );
}

export default App;
