import React, { useState } from 'react';
import { generateId } from '../../utils/idGenerator';
import { usePOS, useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';
import { simulatePreAuth } from '../../services/paymentSimulator';

export default function NewTabModal() {
  const { state } = usePOS();
  const { currentServer } = state;
  const actions = usePOSActions();
  const {
    showNewTabModal, setShowNewTabModal,
    newTabName, setNewTabName,
    setActiveTab, setActiveTable,
  } = useUI();

  const [preAuthStage, setPreAuthStage] = useState(null);
  const [preAuthRunning, setPreAuthRunning] = useState(false);

  if (!showNewTabModal) return null;

  const finishOpen = async (preAuth = null) => {
    if (!newTabName.trim()) return;
    const tabId = generateId();
    const finalTabId = await actions.openTab(tabId, newTabName.trim(), currentServer, preAuth || {});
    setActiveTab(finalTabId);
    setActiveTable(null);
    resetAndClose();
  };

  const resetAndClose = () => {
    setShowNewTabModal(false);
    setNewTabName('');
    setPreAuthStage(null);
    setPreAuthRunning(false);
  };

  const openWithCard = async () => {
    if (!newTabName.trim()) return;
    setPreAuthRunning(true);
    try {
      const result = await simulatePreAuth(setPreAuthStage);
      if (result.approved) {
        await finishOpen({
          preAuthRef: result.preAuthRef,
          cardLast4: result.cardLast4,
          cardBrand: result.cardBrand,
        });
      }
      // If declined, user stays on modal — preAuthStage shows declined
    } catch {
      setPreAuthRunning(false);
      setPreAuthStage(null);
    }
  };

  const retryPreAuth = () => {
    setPreAuthStage(null);
    setPreAuthRunning(false);
    setTimeout(openWithCard, 100);
  };

  const isDeclined = preAuthStage?.stage === 'declined';
  const showTerminal = preAuthRunning || isDeclined;

  return (
    <div className="modal-overlay">
      <div className="modal new-tab-modal">
        <button className="modal-close" onClick={resetAndClose}>×</button>
        <h2>Open New Tab</h2>

        {!showTerminal && (
          <>
            <input
              type="text"
              placeholder="Name..."
              value={newTabName}
              onChange={e => setNewTabName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && finishOpen()}
            />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={resetAndClose}>Cancel</button>
              <button
                className="confirm-btn"
                onClick={() => finishOpen()}
                disabled={!newTabName.trim()}
              >Open Tab</button>
              <button
                className="confirm-btn preauth-btn"
                onClick={openWithCard}
                disabled={!newTabName.trim()}
              >Open with Card</button>
            </div>
          </>
        )}

        {showTerminal && (
          <div className="terminal-modal terminal-inline">
            <div className="terminal-screen">
              {preAuthStage?.stage === 'insert' && (
                <div className="terminal-stage">
                  <div className="terminal-card-icon terminal-pulse">
                    <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
                      <rect x="1" y="1" width="46" height="34" rx="4" stroke="#4ade80" strokeWidth="2"/>
                      <rect x="6" y="8" width="12" height="10" rx="2" fill="#4ade80" opacity="0.6"/>
                      <line x1="6" y1="24" x2="42" y2="24" stroke="#4ade80" strokeWidth="2" opacity="0.4"/>
                      <line x1="6" y1="28" x2="28" y2="28" stroke="#4ade80" strokeWidth="1.5" opacity="0.3"/>
                    </svg>
                  </div>
                  <div className="terminal-message">{preAuthStage.message}</div>
                </div>
              )}

              {preAuthStage?.stage === 'reading' && (
                <div className="terminal-stage">
                  <div className="terminal-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <div className="terminal-message">{preAuthStage.message}</div>
                </div>
              )}

              {preAuthStage?.stage === 'processing' && (
                <div className="terminal-stage">
                  <div className="terminal-spinner"></div>
                  <div className="terminal-message terminal-processing">{preAuthStage.message}</div>
                </div>
              )}

              {preAuthStage?.stage === 'authorized' && (
                <div className="terminal-stage">
                  <div className="terminal-checkmark">&#10003;</div>
                  <div className="terminal-message terminal-approved-text">{preAuthStage.message}</div>
                  <div className="terminal-auth">{preAuthStage.cardBrand} •••• {preAuthStage.cardLast4}</div>
                  <div className="terminal-auth">Ref: {preAuthStage.preAuthRef}</div>
                </div>
              )}

              {preAuthStage?.stage === 'declined' && (
                <div className="terminal-stage">
                  <div className="terminal-x-mark">&#10007;</div>
                  <div className="terminal-message terminal-declined-text">{preAuthStage.message}</div>
                  <div className="terminal-auth">Card: •••• {preAuthStage.cardLast4}</div>
                </div>
              )}
            </div>

            {isDeclined && (
              <div className="terminal-actions">
                <button className="terminal-retry-btn" onClick={retryPreAuth}>Retry</button>
                <button className="terminal-cancel-btn" onClick={() => { setPreAuthStage(null); setPreAuthRunning(false); }}>Back</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
