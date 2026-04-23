import React from 'react';
import { TABLES } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function ReopenTablePicker() {
  const { state, dispatch } = usePOS();
  const { tableStates } = state;
  const {
    showReopenTablePicker, setShowReopenTablePicker,
    selectedClosedBill, setSelectedClosedBill,
    setShowServerScreen,
    setActiveTable,
  } = useUI();

  if (!showReopenTablePicker || !selectedClosedBill) return null;

  const availableTables = TABLES.filter(t => !tableStates[t.id]).map(t => t.id);

  const reopenBillToTable = (tableId) => {
    dispatch({ type: POS_ACTIONS.REOPEN_BILL, bill: selectedClosedBill, newTableId: tableId });
    setShowReopenTablePicker(false);
    setSelectedClosedBill(null);
    setShowServerScreen(false);
    setActiveTable(tableId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal reopen-table-modal">
        <button className="modal-close" onClick={() => { setShowReopenTablePicker(false); setSelectedClosedBill(null); }}>×</button>
        <h2>Table {selectedClosedBill.tableId} is Occupied</h2>
        <p>Select an available table:</p>
        <div className="available-tables-grid">
          {availableTables.map(tableId => (
            <button key={tableId} onClick={() => reopenBillToTable(tableId)}>Table {tableId}</button>
          ))}
        </div>
        {availableTables.length === 0 && <p className="no-tables">No tables available</p>}
        <button className="cancel-btn" onClick={() => { setShowReopenTablePicker(false); setSelectedClosedBill(null); }}>Cancel</button>
      </div>
    </div>
  );
}
