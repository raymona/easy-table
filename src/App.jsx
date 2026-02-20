import { POSProvider } from './context/POSContext';
import { UIProvider } from './context/UIContext';
import POS from './components/POS';

function App() {
  return (
    <POSProvider>
      <UIProvider>
        <POS />
      </UIProvider>
    </POSProvider>
  );
}

export default App;
