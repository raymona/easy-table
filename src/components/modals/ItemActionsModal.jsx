import React from 'react';
import { COOK_TEMPS } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';
import { generateId } from '../../utils/idGenerator';

const STATUS = { NEW: 'new', SENT: 'sent', FIRED: 'fired' };

export default function ItemActionsModal() {
  const { state, dispatch } = usePOS();
  const { tableStates } = state;
  const {
    showItemActions, setShowItemActions,
    selectedItem, setSelectedItem,
    setEditingItem, setPendingItem,
    setItemQuantity, setItemCookTemp, setItemCourse,
    setItemModLines, setItemAllergyLines, setItemNoteLines, setItemTiming,
    setShowModScreen,
    setShowVoidModal,
    setShowSplitItemModal,
    setShowMoveItemModal,
    activeTable, activeTab, activeSeat,
  } = useUI();

  if (!showItemActions || !selectedItem) return null;

  const { item, seatNum } = selectedItem;
  const isNew = item.status === STATUS.NEW;
  const isQuickVoidable = !isNew && item.sentAt && (Date.now() - item.sentAt) < 120_000;
  const canMove = activeTable && seatNum && (tableStates[activeTable]?.seats || 0) > 1;

  const close = () => { setShowItemActions(false); };

  const quickVoidItem = () => {
    dispatch({ type: POS_ACTIONS.VOID_ITEM, tableId: activeTable, tabId: activeTab, seatNum, itemId: item.id });
    setShowItemActions(false);
    setSelectedItem(null);
  };

  const reorderItem = () => {
    const newItem = { ...item, id: generateId(), status: STATUS.NEW, addedAt: Date.now() };
    if (activeTable && seatNum) {
      dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId: activeTable, seatNum, item: newItem });
    } else {
      dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId: activeTable, tabId: activeTab, seatNum: activeSeat, item: newItem });
    }
    setShowItemActions(false);
    setSelectedItem(null);
  };

  const openEdit = () => {
    setEditingItem(selectedItem);
    setPendingItem(item);
    setItemQuantity(1);
    setItemCookTemp(item.mods?.find(m => COOK_TEMPS.includes(m)) || '');
    setItemCourse(item.course || '');
    setItemModLines([{ prefix: '', value: '' }]);
    setItemAllergyLines(['']);
    setItemNoteLines(['']);
    setItemTiming('');
    setShowItemActions(false);
    setShowModScreen(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal item-actions-modal">
        <button className="modal-close" onClick={close}>×</button>
        <h2>{item.name}</h2>
        {item.selectedAddOns?.length > 0 ? (
          <div className="item-price-breakdown">
            <p>${item.basePrice.toFixed(2)} base</p>
            {item.selectedAddOns.map(ao => <p key={ao.name}>+ {ao.name} ${ao.price.toFixed(2)}</p>)}
            <p className="total-price">Total: ${item.price.toFixed(2)}</p>
          </div>
        ) : (
          <p className="item-price-display">${item.price.toFixed(2)}</p>
        )}
        {item.mods?.length > 0 && <p className="item-mods-display">{item.mods.join(', ')}</p>}
        <div className="action-buttons">
          {isNew ? (
            <>
              <button onClick={quickVoidItem}>Remove</button>
              <button onClick={openEdit}>Edit</button>
              <button onClick={() => { setShowItemActions(false); setShowSplitItemModal(true); }}>Split</button>
              {canMove && (
                <button onClick={() => { setShowItemActions(false); setShowMoveItemModal(true); }}>Move</button>
              )}
            </>
          ) : (
            <>
              {isQuickVoidable && (
                <button onClick={quickVoidItem}>Quick Void</button>
              )}
              <button onClick={() => { setShowItemActions(false); setShowVoidModal(true); }}>
                {isQuickVoidable ? 'Void (with reason)...' : 'Void'}
              </button>
              {!item.isComped && (
                <button onClick={() => {
                  dispatch({ type: POS_ACTIONS.COMP_ITEM, tableId: activeTable, tabId: activeTab, seatNum, itemId: item.id });
                  setShowItemActions(false);
                  setSelectedItem(null);
                }}>Comp</button>
              )}
              <button onClick={reorderItem}>Reorder</button>
              <button onClick={() => { setShowItemActions(false); setShowSplitItemModal(true); }}>Split</button>
              {canMove && (
                <button onClick={() => { setShowItemActions(false); setShowMoveItemModal(true); }}>Move</button>
              )}
            </>
          )}
        </div>
        <button className="cancel-btn" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}
