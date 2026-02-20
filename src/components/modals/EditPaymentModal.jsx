import React from 'react';
import { CARD_TYPES } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';

export default function EditPaymentModal() {
  const { dispatch } = usePOS();
  const {
    showEditPaymentModal, setShowEditPaymentModal,
    selectedClosedBill, setSelectedClosedBill,
  } = useUI();

  if (!showEditPaymentModal || !selectedClosedBill) return null;

  const setMethod = (method) =>
    setSelectedClosedBill(prev => ({ ...prev, payments: [{ ...prev.payments[0], method }] }));

  const setAmount = (val) =>
    setSelectedClosedBill(prev => ({ ...prev, amountPaid: parseFloat(val) || 0 }));

  const savePayment = () => {
    dispatch({
      type: POS_ACTIONS.UPDATE_PAYMENT,
      billId: selectedClosedBill.id,
      newMethod: selectedClosedBill.payments[0]?.method,
      newAmount: selectedClosedBill.amountPaid,
    });
    setShowEditPaymentModal(false);
    setSelectedClosedBill(null);
  };

  const currentMethod = selectedClosedBill.payments[0]?.method;

  return (
    <div className="modal-overlay">
      <div className="modal edit-payment-modal">
        <button className="modal-close" onClick={() => { setShowEditPaymentModal(false); setSelectedClosedBill(null); }}>×</button>
        <h2>Edit Payment</h2>
        <p>{selectedClosedBill.type === 'table' ? `Table ${selectedClosedBill.tableId}` : selectedClosedBill.tabName}</p>
        <div className="edit-payment-form">
          <label>Payment Method</label>
          <div className="method-buttons">
            <button onClick={() => setMethod('cash')} className={currentMethod === 'cash' ? 'active' : ''}>Cash</button>
            {CARD_TYPES.map(type => (
              <button key={type} onClick={() => setMethod(type)} className={currentMethod === type ? 'active' : ''}>{type}</button>
            ))}
            <button onClick={() => setMethod('gift')} className={currentMethod === 'gift' ? 'active' : ''}>Gift Card</button>
          </div>
          <label>Amount Paid</label>
          <input
            type="number"
            value={selectedClosedBill.amountPaid}
            onChange={e => setAmount(e.target.value)}
          />
          <div className="bill-total-reminder">Bill Total: ${selectedClosedBill.total.toFixed(2)}</div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => { setShowEditPaymentModal(false); setSelectedClosedBill(null); }}>Cancel</button>
          <button className="confirm-btn" onClick={savePayment}>Save</button>
        </div>
      </div>
    </div>
  );
}
