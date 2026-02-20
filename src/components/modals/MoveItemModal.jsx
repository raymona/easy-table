import React from 'react';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function MoveItemModal() {
  const { state, dispatch } = usePOS();
  const { tableStates } = state;
  const {
    showMoveItemModal, setShowMoveItemModal,
    selectedItem, setSelectedItem,
    setShowItemActions,
    activeTable,
  } = useUI();

  if (!showMoveItemModal || !selectedItem || !activeTable) return null;

  const moveItemToSeat = (targetSeat) => {
    const { item, seatNum } = selectedItem;
    dispatch({ type: POS_ACTIONS.MOVE_ITEM, tableId: activeTable, itemId: item.id, fromSeat: seatNum, toSeat: targetSeat });
    setShowMoveItemModal(false);
    setShowItemActions(false);
    setSelectedItem(null);
  };

  const otherSeats = Array.from(
    { length: tableStates[activeTable]?.seats || 0 },
    (_, i) => i + 1
  ).filter(s => s !== selectedItem.seatNum);

  return (
    <div className="modal-overlay">
      <div className="modal move-item-modal">
        <button className="modal-close" onClick={() => setShowMoveItemModal(false)}>×</button>
        <h2>Move {selectedItem.item.name}</h2>
        <p>Currently on Seat {selectedItem.seatNum}</p>
        <div className="seat-options">
          {otherSeats.map(seat => (
            <button key={seat} onClick={() => moveItemToSeat(seat)}>Seat {seat}</button>
          ))}
        </div>
        <button className="cancel-btn" onClick={() => setShowMoveItemModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
