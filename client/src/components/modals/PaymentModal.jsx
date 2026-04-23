import React, { useState } from 'react';
import { CARD_TYPES } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';
import { generateId } from '../../utils/idGenerator';
import {
  getSubtotal, getTax, getSeatTotal, applyDiscount,
  getTablePaidAmount, getTableSeatPaidAmount, getTablePaidSeats,
} from '../../utils/calculations';

export default function PaymentModal() {
  const { state, dispatch } = usePOS();
  const { tableStates, tablePayments, tabStates, giftCards, adminConfig } = state;
  const {
    showPaymentModal, setShowPaymentModal,
    activeTable, setActiveTable,
    activeTab, setActiveTab,
    setView,
    selectedPaySeat, setSelectedPaySeat,
    selectedPaymentMethod, setSelectedPaymentMethod,
    paymentAmount, setPaymentAmount,
    payFullBill, setPayFullBill,
    appliedDiscount, setAppliedDiscount,
  } = useUI();

  // ── Gift card local state ─────────────────────────────────────────────────
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardBalance, setGiftCardBalance] = useState(null);
  const [giftCardError, setGiftCardError] = useState('');

  // ── Room charge local state ───────────────────────────────────────────────
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');

  if (!showPaymentModal) return null;

  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;

  // ── Totals ────────────────────────────────────────────────────────────────
  const currentOrder = isTableView
    ? (tableStates[activeTable]?.orders || {})
    : (isTabView ? (tabStates[activeTab]?.items || []) : {});

  const rawSubtotal = getSubtotal(currentOrder);
  const subtotal = appliedDiscount ? applyDiscount(rawSubtotal, appliedDiscount) : rawSubtotal;
  const tax = getTax(subtotal);
  const total = subtotal + tax;

  const getSeatTotalFn = (seatNum) => {
    if (!activeTable || !tableStates[activeTable]) return 0;
    return getSeatTotal(tableStates[activeTable].orders[seatNum] || []);
  };

  const paidSeats = activeTable ? getTablePaidSeats(tablePayments, activeTable) : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const resetGiftCard = () => {
    setGiftCardCode('');
    setGiftCardBalance(null);
    setGiftCardError('');
  };

  const resetRoomCharge = () => {
    setRoomNumber('');
    setGuestName('');
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedPaySeat(null);
    setSelectedPaymentMethod(null);
    setPayFullBill(false);
    resetGiftCard();
    resetRoomCharge();
  };

  const selectSeatToPay = (seatNum) => {
    const seatTotal = getSeatTotalFn(seatNum);
    const paidOnSeat = getTableSeatPaidAmount(tablePayments, activeTable, seatNum);
    setSelectedPaySeat(seatNum);
    setPaymentAmount((seatTotal - paidOnSeat).toFixed(2));
  };

  const openFullBillPayment = () => {
    const paid = getTablePaidAmount(tablePayments, activeTable);
    setPaymentAmount((total - paid).toFixed(2));
    setPayFullBill(true);
  };

  const closeTableBill = (payments) => {
    const tableData = tableStates[activeTable];
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const closedBill = {
      id: generateId(),
      type: 'table',
      tableId: activeTable,
      server: tableData.server,
      orders: tableData.orders,
      voidedItems: tableData.voidedItems || [],
      subtotal,
      tax,
      total,
      discount: appliedDiscount || null,
      payments,
      amountPaid: totalPaid,
      tip: totalPaid - total > 0 ? totalPaid - total : 0,
      closedAt: Date.now(),
      openedAt: tableData.openedAt,
    };
    dispatch({ type: POS_ACTIONS.CLOSE_TABLE_BILL, tableId: activeTable, closedBill });
    setAppliedDiscount(null);
    setActiveTable(null);
    setShowPaymentModal(false);
    setView('floor');
  };

  const processPayment = () => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;
    const payment = {
      seat: selectedPaySeat, method: selectedPaymentMethod, amount, timestamp: Date.now(),
      ...(selectedPaymentMethod === 'room' && { roomNumber, guestName }),
    };

    if (selectedPaymentMethod === 'gift' && giftCardCode) {
      dispatch({ type: POS_ACTIONS.REDEEM_GIFT_CARD, code: giftCardCode.trim().toUpperCase(), amount });
    }

    if (isTableView) {
      const currentTablePayments = tablePayments[activeTable] || { payments: [], paidSeats: [], seatPayments: {} };
      const newPayments = [...currentTablePayments.payments, payment];

      if (selectedPaySeat !== null && !payFullBill) {
        // Pay by seat
        const currentSeatPaid = (currentTablePayments.seatPayments[selectedPaySeat] || 0) + amount;
        const seatTotal = getSeatTotalFn(selectedPaySeat);
        const seatFullyPaid = currentSeatPaid >= seatTotal;
        const newSeatPayments = { ...currentTablePayments.seatPayments, [selectedPaySeat]: currentSeatPaid };
        const newPaidSeats = seatFullyPaid && !currentTablePayments.paidSeats.includes(selectedPaySeat)
          ? [...currentTablePayments.paidSeats, selectedPaySeat]
          : currentTablePayments.paidSeats;

        dispatch({ type: POS_ACTIONS.PROCESS_TABLE_PAYMENT, tableId: activeTable, payment, newSeatPayments, newPaidSeats });

        const seatsWithItems = Object.entries(tableStates[activeTable]?.orders || {})
          .filter(([, items]) => items.length > 0)
          .map(([s]) => parseInt(s));
        const allPaid = seatsWithItems.every(s => newPaidSeats.includes(s));

        if (allPaid) {
          closeTableBill(newPayments);
        } else if (seatFullyPaid) {
          const nextUnpaid = seatsWithItems.find(s => !newPaidSeats.includes(s));
          if (nextUnpaid !== undefined) {
            const nextTotal = getSeatTotalFn(nextUnpaid);
            const nextPaid = newSeatPayments[nextUnpaid] || 0;
            setSelectedPaySeat(nextUnpaid);
            setPaymentAmount((nextTotal - nextPaid).toFixed(2));
          } else {
            setSelectedPaySeat(null);
            setPaymentAmount('');
          }
          setSelectedPaymentMethod(null);
        } else {
          setPaymentAmount((seatTotal - currentSeatPaid).toFixed(2));
          setSelectedPaymentMethod(null);
        }
      } else {
        // Pay full bill
        const totalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
        dispatch({ type: POS_ACTIONS.PROCESS_TABLE_PAYMENT, tableId: activeTable, payment, newSeatPayments: currentTablePayments.seatPayments, newPaidSeats: currentTablePayments.paidSeats });
        if (totalPaid >= total) {
          closeTableBill(newPayments);
        } else {
          setPaymentAmount((total - totalPaid).toFixed(2));
          setSelectedPaymentMethod(null);
        }
      }
    } else if (isTabView) {
      const tip = amount - total > 0 ? amount - total : 0;
      const tabData = tabStates[activeTab];
      const closedBill = {
        id: generateId(),
        type: 'tab',
        tabName: tabData.name,
        server: tabData.server,
        items: tabData.items,
        subtotal,
        tax,
        total,
        discount: appliedDiscount || null,
        payments: [payment],
        amountPaid: amount,
        tip,
        closedAt: Date.now(),
        openedAt: tabData.openedAt,
      };
      dispatch({ type: POS_ACTIONS.CLOSE_TAB_BILL, tabId: activeTab, closedBill });
      setAppliedDiscount(null);
      setActiveTab(null);
      setShowPaymentModal(false);
      setView('floor');
    }
  };

  const lookupGiftCard = () => {
    const code = giftCardCode.trim().toUpperCase();
    const balance = giftCards?.[code];
    if (balance === undefined) {
      setGiftCardError('Card not found');
      setGiftCardBalance(null);
    } else if (balance <= 0) {
      setGiftCardError('Card has no remaining balance');
      setGiftCardBalance(null);
    } else {
      setGiftCardError('');
      setGiftCardBalance(balance);
      const amountDue = parseFloat(paymentAmount) || total;
      setPaymentAmount(Math.min(balance, amountDue).toFixed(2));
    }
  };

  const voidLastPayment = () => {
    if (activeTable) dispatch({ type: POS_ACTIONS.VOID_LAST_PAYMENT, tableId: activeTable });
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const tablePaidAmount = activeTable ? getTablePaidAmount(tablePayments, activeTable) : 0;
  const tableRemainingBalance = Math.max(0, total - tablePaidAmount);
  const hasExistingPayments = (tablePayments[activeTable]?.payments?.length || 0) > 0;

  const showSeatSelection = isTableView && !selectedPaySeat && !selectedPaymentMethod && !payFullBill;
  const showAmountSection = (isTabView || selectedPaySeat !== null || payFullBill) && !selectedPaymentMethod;

  return (
    <div className="modal-overlay">
      <div className="modal payment-modal">
        <button className="modal-close" onClick={closeModal}>×</button>
        <h2>Payment</h2>

        {isTableView && hasExistingPayments && !selectedPaymentMethod && (
          <div className="payment-status-banner">
            <div className="payment-status-info">
              <span className="paid-amount">${tablePaidAmount.toFixed(2)} paid</span>
              <span className="remaining-amount">${tableRemainingBalance.toFixed(2)} remaining</span>
            </div>
            <button className="void-last-btn" onClick={voidLastPayment}>Void Last Payment</button>
          </div>
        )}

        {showSeatSelection && (
          <div className="seat-payment-section">
            <div className="payment-type-choice">
              <button className="pay-full-btn" onClick={openFullBillPayment}>
                Pay Full Bill (${total.toFixed(2)})
              </button>
              <div className="divider-text">or pay by seat</div>
            </div>
            <div className="seat-payment-grid">
              {Object.entries(tableStates[activeTable]?.orders || {})
                .filter(([, items]) => items.length > 0)
                .map(([seatNum, items]) => {
                  const seatTotal = getSeatTotalFn(parseInt(seatNum));
                  const seatPaid = getTableSeatPaidAmount(tablePayments, activeTable, parseInt(seatNum));
                  const seatRemaining = seatTotal - seatPaid;
                  const isPaid = paidSeats.includes(parseInt(seatNum));
                  return (
                    <button
                      key={seatNum}
                      className={`seat-pay-btn ${isPaid ? 'paid' : ''} ${seatPaid > 0 && !isPaid ? 'partial' : ''}`}
                      onClick={() => !isPaid && selectSeatToPay(parseInt(seatNum))}
                      disabled={isPaid}
                    >
                      <span className="seat-num">Seat {seatNum}</span>
                      <span className="seat-items">{items.length} items</span>
                      <span className="seat-total">
                        {isPaid ? 'PAID' : seatPaid > 0 ? `$${seatRemaining.toFixed(2)} left` : `$${seatTotal.toFixed(2)}`}
                      </span>
                    </button>
                  );
                })}
            </div>
            {paidSeats.length > 0 && (
              <div className="paid-summary">
                {paidSeats.length} of{' '}
                {Object.entries(tableStates[activeTable]?.orders || {}).filter(([, items]) => items.length > 0).length}{' '}
                seats paid
              </div>
            )}
          </div>
        )}

        {showAmountSection && (
          <>
            <div className="payment-summary">
              {selectedPaySeat !== null && !payFullBill && (
                <div className="paying-for">Paying for Seat {selectedPaySeat}</div>
              )}
              {payFullBill && <div className="paying-for">Paying Full Bill</div>}
              <div className="summary-row total">
                <span>{selectedPaySeat !== null && !payFullBill ? 'Seat Total' : 'Bill Total'}</span>
                <span>${selectedPaySeat !== null && !payFullBill ? getSeatTotalFn(selectedPaySeat).toFixed(2) : total.toFixed(2)}</span>
              </div>
              {selectedPaySeat !== null && !payFullBill && getTableSeatPaidAmount(tablePayments, activeTable, selectedPaySeat) > 0 && (
                <>
                  <div className="summary-row paid">
                    <span>Already Paid</span>
                    <span>${getTableSeatPaidAmount(tablePayments, activeTable, selectedPaySeat).toFixed(2)}</span>
                  </div>
                  <div className="summary-row remaining">
                    <span>Remaining</span>
                    <span>${(getSeatTotalFn(selectedPaySeat) - getTableSeatPaidAmount(tablePayments, activeTable, selectedPaySeat)).toFixed(2)}</span>
                  </div>
                </>
              )}
              {payFullBill && tablePaidAmount > 0 && (
                <>
                  <div className="summary-row paid"><span>Already Paid</span><span>${tablePaidAmount.toFixed(2)}</span></div>
                  <div className="summary-row remaining"><span>Remaining</span><span>${tableRemainingBalance.toFixed(2)}</span></div>
                </>
              )}
            </div>
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="method-buttons">
                <button onClick={() => setSelectedPaymentMethod('cash')}>Cash</button>
                {CARD_TYPES.map(type => (
                  <button key={type} onClick={() => setSelectedPaymentMethod(type)}>{type}</button>
                ))}
                <button onClick={() => setSelectedPaymentMethod('gift')}>Gift Card</button>
                {(adminConfig.mode === 'hotel' || adminConfig.mode === 'bar-hotel') && (
                  <button onClick={() => setSelectedPaymentMethod('room')}>Charge to Room</button>
                )}
              </div>
            </div>
            {(selectedPaySeat !== null || payFullBill) && isTableView && (
              <button className="back-btn" onClick={() => { setSelectedPaySeat(null); setPayFullBill(false); }}>
                ← Back to Options
              </button>
            )}
          </>
        )}

        {selectedPaymentMethod === 'room' && (
          <div className="payment-amount-section">
            <h3>Charge to Room</h3>
            {selectedPaySeat !== null && !payFullBill && <div className="paying-for">Seat {selectedPaySeat}</div>}
            {payFullBill && <div className="paying-for">Full Bill</div>}
            <label>Room Number</label>
            <input
              type="text"
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              placeholder="e.g. 412"
              autoFocus
            />
            <label>Guest Name</label>
            <input
              type="text"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Guest name"
            />
            <label>Amount</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
            />
            <div className="payment-actions">
              <button className="back-btn" onClick={() => { setSelectedPaymentMethod(null); resetRoomCharge(); }}>← Back</button>
              <button
                className="confirm-btn"
                onClick={processPayment}
                disabled={!roomNumber.trim()}
              >Charge</button>
            </div>
          </div>
        )}

        {selectedPaymentMethod && selectedPaymentMethod === 'gift' && giftCardBalance === null && (
          <div className="payment-amount-section">
            <h3>Gift Card Payment</h3>
            {selectedPaySeat !== null && !payFullBill && <div className="paying-for">Seat {selectedPaySeat}</div>}
            {payFullBill && <div className="paying-for">Full Bill</div>}
            <label>Gift Card Code</label>
            <input
              type="text"
              value={giftCardCode}
              onChange={e => { setGiftCardCode(e.target.value.toUpperCase()); setGiftCardError(''); }}
              onKeyDown={e => e.key === 'Enter' && lookupGiftCard()}
              placeholder="e.g. ET-001"
              autoFocus
            />
            {giftCardError && <div className="gift-card-error">{giftCardError}</div>}
            <div className="payment-actions">
              <button className="back-btn" onClick={() => { setSelectedPaymentMethod(null); resetGiftCard(); }}>← Back</button>
              <button className="confirm-btn" onClick={lookupGiftCard}>Look Up</button>
            </div>
          </div>
        )}

        {selectedPaymentMethod && selectedPaymentMethod !== 'room' && (selectedPaymentMethod !== 'gift' || giftCardBalance !== null) && (
          <div className="payment-amount-section">
            <h3>{selectedPaymentMethod === 'cash' ? 'Cash' : selectedPaymentMethod === 'gift' ? 'Gift Card' : selectedPaymentMethod} Payment</h3>
            {selectedPaySeat !== null && !payFullBill && <div className="paying-for">Seat {selectedPaySeat}</div>}
            {payFullBill && <div className="paying-for">Full Bill</div>}
            {selectedPaymentMethod === 'gift' && giftCardBalance !== null && (
              <div className="gift-card-balance">Card balance: ${giftCardBalance.toFixed(2)}</div>
            )}
            <label>Amount</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              autoFocus
            />
            <div className="payment-actions">
              <button className="back-btn" onClick={() => { setSelectedPaymentMethod(null); resetGiftCard(); resetRoomCharge(); }}>← Back</button>
              <button className="confirm-btn" onClick={processPayment}>Pay</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
