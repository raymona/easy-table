import React from 'react';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function SeatPickerModal() {
  const { state, dispatch } = usePOS();
  const { currentServer } = state;
  const {
    showSeatPicker, setShowSeatPicker,
    pendingTableId, setPendingTableId,
    seatCount, setSeatCount,
    setActiveTable, setActiveTab, setActiveSeat,
  } = useUI();

  if (!showSeatPicker) return null;

  const confirmOpenTable = () => {
    dispatch({ type: POS_ACTIONS.OPEN_TABLE, tableId: pendingTableId, server: currentServer, seatCount });
    setActiveTable(pendingTableId);
    setActiveTab(null);
    setActiveSeat(1);
    setShowSeatPicker(false);
    setPendingTableId(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal seat-picker-modal">
        <button className="modal-close" onClick={() => setShowSeatPicker(false)}>×</button>
        <h2>Open Table {pendingTableId}</h2>
        <p>How many seats?</p>
        <div className="seat-picker">
          <button onClick={() => setSeatCount(c => Math.max(1, c - 1))}>−</button>
          <span className="seat-count">{seatCount}</span>
          <button onClick={() => setSeatCount(c => c + 1)}>+</button>
        </div>
        <div className="quick-picks">
          {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
            <button key={n} className={seatCount === n ? 'active' : ''} onClick={() => setSeatCount(n)}>{n}</button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowSeatPicker(false)}>Cancel</button>
          <button className="confirm-btn" onClick={confirmOpenTable}>Open Table</button>
        </div>
      </div>
    </div>
  );
}
