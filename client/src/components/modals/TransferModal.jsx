import React from 'react';
import { TABLES } from '../../data/menu';
import { usePOS, useUI } from '../../context';
import { usePOSActions } from '../../hooks/usePOSActions';

export default function TransferModal() {
  const { state } = usePOS();
  const { tableStates, currentServer } = state;
  const actions = usePOSActions();
  const {
    showTransferModal, setShowTransferModal,
    activeTable, setActiveTable,
    activeTab, setActiveTab,
  } = useUI();

  if (!showTransferModal) return null;

  const isTableView = activeTable !== null;

  const transferFullTable = async (toTableId) => {
    await actions.transferTable(activeTable, toTableId);
    setActiveTable(toTableId);
    setShowTransferModal(false);
  };

  const transferTabToTable = async (tableId) => {
    await actions.transferTabToTable(activeTab, tableId, currentServer);
    setActiveTab(null);
    setActiveTable(tableId);
    setShowTransferModal(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal transfer-modal">
        <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
        {isTableView ? (
          <>
            <h2>Transfer Table {activeTable}</h2>
            <p>Move entire table to a different table:</p>
            <div className="available-tables-grid">
              {TABLES.filter(t => !tableStates[t.id] && t.id !== activeTable).map(table => (
                <button key={table.id} onClick={() => transferFullTable(table.id)}>
                  Table {table.id}
                </button>
              ))}
            </div>
            {TABLES.filter(t => !tableStates[t.id] && t.id !== activeTable).length === 0 && (
              <p className="no-tables">No available tables</p>
            )}
          </>
        ) : (
          <>
            <h2>Transfer Tab to Table</h2>
            <p>Select a table to transfer this tab to:</p>
            <div className="available-tables-grid">
              {TABLES.map(table => (
                <button key={table.id} onClick={() => transferTabToTable(table.id)}>
                  Table {table.id} {tableStates[table.id] ? '(add to)' : ''}
                </button>
              ))}
            </div>
          </>
        )}
        <button className="cancel-btn" onClick={() => setShowTransferModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
