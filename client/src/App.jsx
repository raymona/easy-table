import { POSProvider } from './context/POSContext';
import { UIProvider } from './context/UIContext';
import { AuthProvider } from './context/AuthContext';
import POS from './components/POS';

function App() {
  return (
    <AuthProvider>
      <POSProvider>
        <UIProvider>
          <POS />
        </UIProvider>
      </POSProvider>
    </AuthProvider>
  );
}

export default App;
