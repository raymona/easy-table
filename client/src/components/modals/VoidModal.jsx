import React from 'react';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function VoidModal() {
  const { state, dispatch } = usePOS();
  const voidReasons = state.adminConfig?.voidReasons || [];
  const {
    showVoidModal, setShowVoidModal,
    voidReason, setVoidReason,
    selectedItem, setSelectedItem,
    setShowItemActions,
    activeTable, activeTab,
  } = useUI();

  if (!showVoidModal || !selectedItem) return null;

  const voidItem = () => {
    if (!voidReason) return;
    const { item, seatNum } = selectedItem;
    dispatch({ type: POS_ACTIONS.VOID_ITEM, tableId: activeTable, tabId: activeTab, seatNum, itemId: item.id, reason: voidReason });
    setShowItemActions(false);
    setSelectedItem(null);
    setShowVoidModal(false);
    setVoidReason('');
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
          <input type="text" placeholder="Specify reason..." className="void-other-input" />
        )}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => { setShowVoidModal(false); setVoidReason(''); }}>Cancel</button>
          <button className="confirm-btn" onClick={voidItem} disabled={!voidReason}>Void Item</button>
        </div>
      </div>
    </div>
  );
}
