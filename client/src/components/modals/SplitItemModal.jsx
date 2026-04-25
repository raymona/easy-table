import React from 'react';
import { useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';

export default function SplitItemModal() {
  const actions = usePOSActions();
  const {
    showSplitItemModal, setShowSplitItemModal,
    splitWays, setSplitWays,
    selectedItem, setSelectedItem,
    setShowItemActions,
    activeTable, activeTab,
  } = useUI();

  if (!showSplitItemModal || !selectedItem) return null;

  const splitItem = async () => {
    if (splitWays < 2) return;
    const { item, seatNum } = selectedItem;
    await actions.splitItem(activeTable, activeTab, seatNum, item.id, splitWays);
    setShowSplitItemModal(false);
    setShowItemActions(false);
    setSelectedItem(null);
    setSplitWays(2);
  };

  return (
    <div className="modal-overlay">
      <div className="modal split-item-modal">
        <button className="modal-close" onClick={() => { setShowSplitItemModal(false); setSplitWays(2); }}>×</button>
        <h2>Split {selectedItem.item.name}</h2>
        <p className="item-price-display">${selectedItem.item.price.toFixed(2)}</p>
        <div className="split-picker">
          <label>Split how many ways?</label>
          <div className="split-controls">
            <button onClick={() => setSplitWays(w => Math.max(2, w - 1))}>−</button>
            <span className="split-count">{splitWays}</span>
            <button onClick={() => setSplitWays(w => w + 1)}>+</button>
          </div>
          <div className="split-preview">Each: ${(selectedItem.item.price / splitWays).toFixed(2)}</div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => { setShowSplitItemModal(false); setSplitWays(2); }}>Cancel</button>
          <button className="confirm-btn" onClick={splitItem}>Split Item</button>
        </div>
      </div>
    </div>
  );
}
