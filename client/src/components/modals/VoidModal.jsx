import React, { useState } from 'react';
import { usePOS, useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';

export default function VoidModal() {
  const { state } = usePOS();
  const voidReasons = state.adminConfig?.voidReasons || [];
  const actions = usePOSActions();
  const [otherText, setOtherText] = useState('');
  const {
    showVoidModal, setShowVoidModal,
    voidReason, setVoidReason,
    selectedItem, setSelectedItem,
    setShowItemActions,
    activeTable, activeTab,
  } = useUI();

  if (!showVoidModal || !selectedItem) return null;

  const reason = voidReason === 'Other' ? otherText.trim() || '' : voidReason;
  const canVoid = voidReason && (voidReason !== 'Other' || otherText.trim());

  const voidItem = async () => {
    if (!canVoid) return;
    const { item, seatNum } = selectedItem;
    await actions.voidItem(activeTable, activeTab, seatNum, item.id, reason);
    setShowItemActions(false);
    setSelectedItem(null);
    setShowVoidModal(false);
    setVoidReason('');
    setOtherText('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal void-modal">
        <button className="modal-close" onClick={() => setShowVoidModal(false)}>×</button>
        <h2>Void {selectedItem.item.name}</h2>
        <p>Select a reason:</p>
        <div className="void-reasons">
          {voidReasons.map(reason => (
            <button
              key={reason}
              className={voidReason === reason ? 'active' : ''}
              onClick={() => setVoidReason(reason)}
            >{reason}</button>
          ))}
        </div>
        {voidReason === 'Other' && (
          <input
            type="text"
            placeholder="Specify reason..."
            className="void-other-input"
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            autoFocus
          />
        )}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => { setShowVoidModal(false); setVoidReason(''); setOtherText(''); }}>Cancel</button>
          <button className="confirm-btn" onClick={voidItem} disabled={!canVoid}>Void Item</button>
        </div>
      </div>
    </div>
  );
}
