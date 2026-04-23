import React from 'react';
import { SERVERS } from '../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../context';
import { generateId } from '../../utils/idGenerator';

export default function ServerScreen() {
  const { state, dispatch } = usePOS();
  const { closedBills, currentServer, tableStates } = state;
  const {
    showServerScreen, setShowServerScreen,
    setActiveTable, setActiveTab,
    setSelectedClosedBill,
    setShowEditPaymentModal,
    setShowReopenTablePicker,
  } = useUI();

  if (!showServerScreen) return null;

  const serverBills = closedBills.filter(b => b.server === currentServer);

  const voidCount = serverBills.reduce((s, b) => s + (b.voidedItems?.length || 0), 0);
  const voidTotal = serverBills.reduce(
    (s, b) => s + (b.voidedItems?.reduce((v, i) => v + i.price, 0) || 0),
    0
  );
  const compCount = serverBills.reduce((s, b) => {
    const orderItems = b.orders
      ? Object.values(b.orders).flat()
      : (b.items || []);
    return s + orderItems.filter(i => i.isComped).length;
  }, 0);

  const stats = {
    totalSales: serverBills.reduce((s, b) => s + b.total, 0),
    totalTips: serverBills.reduce((s, b) => s + b.tip, 0),
    totalPaid: serverBills.reduce((s, b) => s + b.amountPaid, 0),
    billCount: serverBills.length,
  };

  const avgCheck = stats.billCount > 0 ? stats.totalSales / stats.billCount : 0;

  const reopenBill = (bill) => {
    if (bill.type === 'table') {
      if (!tableStates[bill.tableId]) {
        dispatch({ type: POS_ACTIONS.REOPEN_BILL, bill, newTableId: bill.tableId });
        setShowServerScreen(false);
        setActiveTable(bill.tableId);
      } else {
        setSelectedClosedBill(bill);
        setShowReopenTablePicker(true);
      }
    } else {
      const newTabId = generateId();
      dispatch({ type: POS_ACTIONS.REOPEN_BILL, bill, newTabId });
      setShowServerScreen(false);
      setActiveTab(newTabId);
    }
  };

  const handleNewDay = () => {
    if (window.confirm('Clear all shift data and start a new day? This cannot be undone.')) {
      dispatch({ type: POS_ACTIONS.NEW_DAY });
      setShowServerScreen(false);
    }
  };

  const serverName = SERVERS.find(s => s.id === currentServer)?.name;

  return (
    <div className="modal-overlay">
      <div className="modal server-screen-modal wide">
        <button className="modal-close" onClick={() => setShowServerScreen(false)}>×</button>
        <h2>{serverName}'s Shift</h2>
        <div className="server-screen-layout">
          <div className="shift-stats">
            <h3>Shift Summary</h3>
            <div className="stat-grid">
              {[
                ['Bills Closed', stats.billCount],
                ['Total Sales', `$${stats.totalSales.toFixed(2)}`],
                ['Total Tips', `$${stats.totalTips.toFixed(2)}`],
                ['Total Collected', `$${stats.totalPaid.toFixed(2)}`],
                ['Avg Check', `$${avgCheck.toFixed(2)}`],
                ['Voids', voidCount > 0 ? `${voidCount} ($${voidTotal.toFixed(2)})` : '0'],
                ['Comps', compCount],
              ].map(([label, value]) => (
                <div key={label} className="stat-card">
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="closed-bills-section">
            <h3>Closed Bills</h3>
            {serverBills.length === 0 ? (
              <p className="no-bills">No closed bills yet</p>
            ) : (
              <div className="closed-bills-list">
                {serverBills.map(bill => (
                  <div key={bill.id} className="closed-bill-card">
                    <div className="bill-header">
                      <span className="bill-name">
                        {bill.type === 'table' ? `Table ${bill.tableId}` : bill.tabName}
                      </span>
                      <span className="bill-time">
                        {new Date(bill.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bill-details">
                      <div className="bill-row"><span>Subtotal</span><span>${bill.subtotal.toFixed(2)}</span></div>
                      {bill.discount && (
                        <div className="bill-row discount">
                          <span>Discount ({bill.discount.label})</span>
                          <span style={{ color: 'var(--success)' }}>−</span>
                        </div>
                      )}
                      <div className="bill-row"><span>Tax</span><span>${bill.tax.toFixed(2)}</span></div>
                      <div className="bill-row total"><span>Total</span><span>${bill.total.toFixed(2)}</span></div>
                      <div className="bill-row paid">
                        <span>Paid ({
                          bill.payments[0]?.method === 'room'
                            ? `Room ${bill.payments[0]?.roomNumber}`
                            : bill.payments[0]?.method
                        })</span>
                        <span>${bill.amountPaid.toFixed(2)}</span>
                      </div>
                      {bill.tip > 0 && (
                        <div className="bill-row tip"><span>Tip</span><span>${bill.tip.toFixed(2)}</span></div>
                      )}
                    </div>
                    {bill.voidedItems?.length > 0 && (
                      <details className="bill-voids">
                        <summary className="bill-voids-summary">
                          Voids ({bill.voidedItems.length})
                        </summary>
                        <div className="bill-voids-list">
                          {bill.voidedItems.map((vi, idx) => (
                            <div key={idx} className="void-record-row">
                              <span className="void-record-name">{vi.name}</span>
                              <span className="void-record-reason">{vi.voidReason || 'No reason'}</span>
                              <span className="void-record-price">${vi.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    <div className="bill-actions">
                      <button onClick={() => reopenBill(bill)}>Reopen Bill</button>
                      <button onClick={() => { setSelectedClosedBill(bill); setShowEditPaymentModal(true); }}>
                        Edit Payment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="new-day-section">
            <button className="new-day-btn" onClick={handleNewDay}>
              New Day / Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
