import React from 'react';
import { TABLES } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function TransferModal() {
  const { state, dispatch } = usePOS();
  const { tableStates, currentServer } = state;
  const {
    showTransferModal, setShowTransferModal,
    activeTable, setActiveTable,
    activeTab, setActiveTab,
  } = useUI();

  if (!showTransferModal) return null;

  const isTableView = activeTable !== null;

  const transferFullTable = (toTableId) => {
    dispatch({ type: POS_ACTIONS.TRANSFER_TABLE, fromTableId: activeTable, toTableId });
    setActiveTable(toTableId);
    setShowTransferModal(false);
  };

  const transferTabToTable = (tableId) => {
    dispatch({ type: POS_ACTIONS.TRANSFER_TAB_TO_TABLE, tabId: activeTab, tableId, server: currentServer });
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
