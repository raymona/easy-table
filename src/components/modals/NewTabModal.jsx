import React from 'react';
import { generateId } from '../../utils/idGenerator';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function NewTabModal() {
  const { state, dispatch } = usePOS();
  const { currentServer } = state;
  const {
    showNewTabModal, setShowNewTabModal,
    newTabName, setNewTabName,
    setActiveTab, setActiveTable,
  } = useUI();

  if (!showNewTabModal) return null;

  const openNewTab = () => {
    if (!newTabName.trim()) return;
    const tabId = generateId();
    dispatch({ type: POS_ACTIONS.OPEN_TAB, tabId, name: newTabName.trim(), server: currentServer });
    setActiveTab(tabId);
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
