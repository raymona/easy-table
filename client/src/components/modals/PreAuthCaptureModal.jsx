import React, { useState, useEffect, useRef } from 'react';
import { simulateCapture } from '../../services/paymentSimulator';

export default function PreAuthCaptureModal({ preAuthRef, cardLast4, cardBrand, amount, onComplete, onCancel }) {
  const [stage, setStage] = useState(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    simulateCapture(preAuthRef, cardLast4, cardBrand, amount, setStage)
      .then(result => {
        runningRef.current = false;
        if (result.approved) {
          onComplete(result);
        }
      })
      .catch(() => {
        runningRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-overlay terminal-overlay">
      <div className="terminal-modal">
        <div className="terminal-screen">
          <div className="terminal-amount">${amount.toFixed(2)}</div>
          <div className="terminal-method">{cardBrand} •••• {cardLast4}</div>

          {stage?.stage === 'processing' && (
            <div className="terminal-stage">
              <div className="terminal-spinner"></div>
              <div className="terminal-message terminal-processing">{stage.message}</div>
            </div>
          )}

          {stage?.stage === 'approved' && (
            <div className="terminal-stage">
              <div className="terminal-checkmark">&#10003;</div>
              <div className="terminal-message terminal-approved-text">{stage.message}</div>
              <div className="terminal-auth">Auth: {stage.authCode}</div>
            </div>
          )}
        </div>

        <button className="terminal-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
