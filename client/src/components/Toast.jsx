import { useEffect } from 'react';
import { useUI } from '../context';

export default function Toast() {
  const { toast, setToast } = useUI();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>
      {toast.message}
    </div>
  );
}
