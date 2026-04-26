import React from 'react';
import { usePOS, useUI } from '../../context';
import { getSubtotal, getTax, applyDiscount } from '../../utils/calculations';
import { generateGuestChequePDF } from '../../services/printService';
import { buildGuestChequeData } from '../../utils/printHelpers';

export default function PrintChequeModal() {
  const { state } = usePOS();
  const { tableStates, tabStates, adminConfig } = state;
  const {
    showPrintChequeModal, setShowPrintChequeModal,
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

  const printCheque = (splitMode, splitCount = null) => {
    try {
      const data = buildGuestChequeData({
        tableId: activeTable,
        tabId: activeTab,
        tableStates,
        tabStates,
        adminConfig,
        appliedDiscount,
        splitMode,
        splitCount,
      });
      generateGuestChequePDF(data);
    } catch (err) {
      console.error('Guest cheque PDF failed:', err);
    }
    setShowPrintChequeModal(false);
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
        <div className="bill-options">
          <button onClick={() => printCheque('full')}>Print Full Cheque</button>
          {isTableView && seatCount > 1 && (
            <button onClick={() => printCheque('bySeat')}>Split by Seat</button>
          )}
          <button onClick={() => printCheque('even', seatCount || 2)}>Split Evenly</button>
          <button onClick={() => setShowDiscountModal(true)}>Apply Discount</button>
          {isTabView && <button onClick={() => setShowTransferModal(true)}>Transfer to Table</button>}
        </div>
        <button className="cancel-btn" onClick={() => setShowPrintChequeModal(false)}>Cancel</button>
      </div>
    </div>
  );
}
