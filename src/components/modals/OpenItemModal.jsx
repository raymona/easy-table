import React from 'react';
import { generateId } from '../../utils/idGenerator';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

const STATUS_NEW = 'new';

export default function OpenItemModal() {
  const { dispatch } = usePOS();
  const {
    showOpenItemModal, setShowOpenItemModal,
    openItemType, setOpenItemType,
    openItemName, setOpenItemName,
    openItemPrice, setOpenItemPrice,
    activeTable, activeTab, activeSeat, activeCourse,
  } = useUI();

  if (!showOpenItemModal) return null;

  const addOpenItem = () => {
    if (!openItemName.trim() || !openItemPrice) return;
    const price = parseFloat(openItemPrice) || 0;
    if (price <= 0) return;
    const item = {
      id: generateId(),
      name: openItemName.trim(),
      price,
      quantity: 1,
      mods: [],
      course: activeCourse,
      status: STATUS_NEW,
      addedAt: Date.now(),
      isOpenItem: true,
      openItemType,
    };
    dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId: activeTable, tabId: activeTab, seatNum: activeSeat, item });
    setShowOpenItemModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal open-item-modal">
        <button className="modal-close" onClick={() => setShowOpenItemModal(false)}>×</button>
        <h2>Open Item</h2>
        {!openItemType ? (
          <div className="open-item-type-select">
            <button onClick={() => setOpenItemType('food')}>Open Food</button>
            <button onClick={() => setOpenItemType('beverage')}>Open Beverage</button>
          </div>
        ) : (
          <div className="open-item-form">
            <p className="open-item-type-label">{openItemType === 'food' ? 'Open Food' : 'Open Beverage'}</p>
            <label>Item Name</label>
            <input
              type="text"
              value={openItemName}
              onChange={e => setOpenItemName(e.target.value)}
              placeholder="Enter item name..."
              autoFocus
            />
            <label>Price</label>
            <input
              type="number"
              value={openItemPrice}
              onChange={e => setOpenItemPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
            <div className="modal-actions">
              <button className="back-btn" onClick={() => setOpenItemType(null)}>← Back</button>
              <button
                className="confirm-btn"
                onClick={addOpenItem}
                disabled={!openItemName.trim() || !openItemPrice}
              >Add Item</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
