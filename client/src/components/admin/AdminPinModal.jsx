import React, { useState } from 'react';
import { usePOS, useUI } from '../../context';

export default function AdminPinModal() {
  const { state } = usePOS();
  const { setView, setAdminUnlocked } = useUI();
  const correctPin = state.adminConfig?.pin || '1234';

  const [digits, setDigits] = useState([]);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const appendDigit = (d) => {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    setError('');
    if (next.length === 4) {
      if (next.join('') === correctPin) {
        setAdminUnlocked(true);
      } else {
        setShake(true);
        setError('Incorrect PIN');
        setTimeout(() => { setDigits([]); setShake(false); }, 600);
      }
    }
  };

  const backspace = () => {
    setDigits(prev => prev.slice(0, -1));
    setError('');
  };

  const cancel = () => {
    setView('floor');
    setDigits([]);
    setError('');
  };

  return (
    <div className="admin-pin-overlay">
      <div className={`admin-pin-card${shake ? ' pin-shake' : ''}`}>
        <h2>Admin Access</h2>
        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot${digits.length > i ? ' filled' : ''}`} />
          ))}
        </div>
        {error && <div className="pin-error">{error}</div>}
        <div className="pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} className="pin-btn" onClick={() => appendDigit(String(n))}>{n}</button>
          ))}
          <button className="pin-btn" onClick={cancel}>Cancel</button>
          <button className="pin-btn" onClick={() => appendDigit('0')}>0</button>
          <button className="pin-btn" onClick={backspace}>⌫</button>
        </div>
      </div>
    </div>
  );
}
