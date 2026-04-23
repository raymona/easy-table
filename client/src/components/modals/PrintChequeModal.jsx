import React from 'react';
import { usePOS, useUI } from '../../context';
import { getSubtotal, getTax } from '../../utils/calculations';
import { applyDiscount } from '../../utils/calculations';

export default function PrintChequeModal() {
  const { state } = usePOS();
  const { tableStates, tabStates } = state;
  const {
    showPrintChequeModal, setShowPrintChequeModal,
    printConfirmMsg, setPrintConfirmMsg,
    activeTable, activeTab,
    appliedDiscount,
    setShowDiscountModal,
    setShowTransferModal,
  } = useUI();

  if (!showPrintChequeModal) return null;

  const currentOrder = activeTable
    ? (tableStates[activeTable]?.orders || {})
    : (activeTab ? (tabStates[activeTab]?.items || []) : {});

  const rawSubtotal = getSubtotal(currentOrder);
  const subtotal = appliedDiscount ? applyDiscount(rawSubtotal, appliedDiscount) : rawSubtotal;
  const total = subtotal + getTax(subtotal);

  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;
  const seatCount = Object.values(currentOrder).filter(items => Array.isArray(items) && items.length > 0).length;

  const sendPrint = (msg) => {
    setPrintConfirmMsg(msg);
    setTimeout(() => { setPrintConfirmMsg(''); setShowPrintChequeModal(false); }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal print-cheque-modal">
        <button className="modal-close" onClick={() => setShowPrintChequeModal(false)}>×</button>
        <h2>Print Cheque</h2>
        <div className="bill-total">
          <span>Total</span>
          <span className="big-total">${total.toFixed(2)}</span>
        </div>
        {printConfirmMsg && (
          <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', color: 'var(--success)', marginBottom: 12 }}>
            {printConfirmMsg}
          </div>
        )}
        <div className="bill-options">
          <button onClick={() => sendPrint('Full cheque sent to printer.')}>Print Full Cheque</button>
          {isTableView && seatCount > 1 && (
            <button onClick={() => sendPrint('Split-by-seat cheques sent to printer.')}>Split by Seat</button>
          )}
          <button onClick={() => sendPrint('Even-split cheques sent to printer.')}>Split Evenly</button>
          <button onClick={() => setShowDiscountModal(true)}>Apply Discount</button>
          {isTabView && <button onClick={() => setShowTransferModal(true)}>Transfer to Table</button>}
        </div>
        <button className="cancel-btn" onClick={() => setShowPrintChequeModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
