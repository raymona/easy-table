import React from 'react';
import { generateId } from '../../utils/idGenerator';
import { usePOS, useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';

export default function NewTabModal() {
  const { state } = usePOS();
  const { currentServer } = state;
  const actions = usePOSActions();
  const {
    showNewTabModal, setShowNewTabModal,
    newTabName, setNewTabName,
    setActiveTab, setActiveTable,
  } = useUI();

  if (!showNewTabModal) return null;

  const openNewTab = async () => {
    if (!newTabName.trim()) return;
    const tabId = generateId();
    const finalTabId = await actions.openTab(tabId, newTabName.trim(), currentServer);
    setActiveTab(finalTabId);
    setActiveTable(null);
    setShowNewTabModal(false);
    setNewTabName('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal new-tab-modal">
        <button className="modal-close" onClick={() => setShowNewTabModal(false)}>×</button>
        <h2>Open New Tab</h2>
        <input
          type="text"
          placeholder="Name..."
          value={newTabName}
          onChange={e => setNewTabName(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && openNewTab()}
        />
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowNewTabModal(false)}>Cancel</button>
          <button className="confirm-btn" onClick={openNewTab} disabled={!newTabName.trim()}>Open Tab</button>
        </div>
      </div>
    </div>
  );
}
