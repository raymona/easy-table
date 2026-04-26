import React, { useState, useEffect, useRef } from 'react';
import { simulateCardPayment } from '../../services/paymentSimulator';

export default function PaymentTerminalModal({ method, amount, onComplete, onCancel }) {
  const [stage, setStage] = useState(null);
  const runningRef = useRef(false);

  const runSimulation = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    simulateCardPayment(method, amount, setStage)
      .then(result => {
        runningRef.current = false;
        if (result.approved) {
          onComplete(result);
        }
        // If declined, user stays on modal to retry or cancel
      })
      .catch(() => {
        runningRef.current = false;
      });
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    runningRef.current = false;
    setStage(null);
    setTimeout(runSimulation, 100);
  };

  const isDeclined = stage?.stage === 'declined';

  return (
    <div className="modal-overlay terminal-overlay">
      <div className="terminal-modal">
        <div className="terminal-screen">
          {/* Amount */}
          <div className="terminal-amount">${amount.toFixed(2)}</div>
          <div className="terminal-method">{method}</div>

          {/* Insert / Tap / Swipe */}
          {stage?.stage === 'insert' && (
            <div className="terminal-stage">
              <div className="terminal-card-icon terminal-pulse">
                <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
                  <rect x="1" y="1" width="46" height="34" rx="4" stroke="#4ade80" strokeWidth="2"/>
                  <rect x="6" y="8" width="12" height="10" rx="2" fill="#4ade80" opacity="0.6"/>
                  <line x1="6" y1="24" x2="42" y2="24" stroke="#4ade80" strokeWidth="2" opacity="0.4"/>
                  <line x1="6" y1="28" x2="28" y2="28" stroke="#4ade80" strokeWidth="1.5" opacity="0.3"/>
                </svg>
              </div>
              <div className="terminal-message">{stage.message}</div>
            </div>
          )}

          {/* Reading card */}
          {stage?.stage === 'reading' && (
            <div className="terminal-stage">
              <div className="terminal-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="terminal-message">{stage.message}</div>
            </div>
          )}

          {/* Processing */}
          {stage?.stage === 'processing' && (
            <div className="terminal-stage">
              <div className="terminal-spinner"></div>
              <div className="terminal-message terminal-processing">{stage.message}</div>
            </div>
          )}

          {/* Approved */}
          {stage?.stage === 'approved' && (
            <div className="terminal-stage">
              <div className="terminal-checkmark">&#10003;</div>
              <div className="terminal-message terminal-approved-text">{stage.message}</div>
              <div className="terminal-auth">Auth: {stage.authCode}</div>
              <div className="terminal-auth">Card: •••• {stage.cardLast4}</div>
            </div>
          )}

          {/* Declined */}
          {stage?.stage === 'declined' && (
            <div className="terminal-stage">
              <div className="terminal-x-mark">&#10007;</div>
              <div className="terminal-message terminal-declined-text">{stage.message}</div>
              <div className="terminal-auth">Card: •••• {stage.cardLast4}</div>
            </div>
          )}
        </div>

        {/* Actions — only show on decline */}
        {isDeclined && (
          <div className="terminal-actions">
            <button className="terminal-retry-btn" onClick={handleRetry}>Retry</button>
            <button className="terminal-cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
