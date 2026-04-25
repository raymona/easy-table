import React from 'react';
import { TABLES } from '../../data/menu';
import { usePOS, useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';

export default function ReopenTablePicker() {
  const { state } = usePOS();
  const { tableStates } = state;
  const actions = usePOSActions();
  const {
    showReopenTablePicker, setShowReopenTablePicker,
    selectedClosedBill, setSelectedClosedBill,
    setShowServerScreen,
    setActiveTable,
  } = useUI();

  if (!showReopenTablePicker || !selectedClosedBill) return null;

  const availableTables = TABLES.filter(t => !tableStates[t.id]).map(t => t.id);

  const reopenBillToTable = async (tableId) => {
    await actions.reopenBill(selectedClosedBill, tableId, null);
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
