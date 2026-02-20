import React from 'react';
import { usePOS, useUI, POS_ACTIONS } from '../../../context';
import { groupItemsByCourse } from '../../../utils/orderHelpers';
import { generateId } from '../../../utils/idGenerator';
import {
  getSubtotal, getTax, getSeatTotal, applyDiscount,
  getTablePaidAmount, getTablePaidSeats,
} from '../../../utils/calculations';
import SeatSection from './SeatSection';
import OrderItem from './OrderItem';

const STATUS = { NEW: 'new', SENT: 'sent', FIRED: 'fired' };

export default function OrderPanel() {
  const { state, dispatch } = usePOS();
  const { tableStates, tabStates, tablePayments } = state;
  const {
    activeTable, setActiveTable,
    activeTab, setActiveTab,
    activeSeat, setActiveSeat,
    activeCourse,
    appliedDiscount,
    setSelectedItem, setShowItemActions,
    draggedItem, setDraggedItem,
    // mod screen setters (used when dropping a menu item that needs mods)
    setPendingItem, setItemQuantity, setItemCookTemp, setItemCourse,
    setItemAddOns, setItemModLines, setItemAllergyLines, setItemNoteLines, setItemTiming,
    setShowModScreen,
  } = useUI();

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
  const paidSeats = activeTable ? getTablePaidSeats(tablePayments, activeTable) : [];

  // ── Course firing ─────────────────────────────────────────────────────────
  const coursesToFire = (() => {
    if (!activeTable || !tableStates[activeTable]) return [];
    const allItems = Object.values(tableStates[activeTable].orders).flat();
    const courses = [];
    if (allItems.some(i => i.status === STATUS.SENT && i.course === 'Mains')) courses.push('Mains');
    if (allItems.some(i => i.status === STATUS.SENT && i.course === 'Dessert')) courses.push('Dessert');
    return courses;
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleBackFromTable = () => {
    if (activeTable) dispatch({ type: POS_ACTIONS.CLOSE_TABLE_IF_EMPTY, tableId: activeTable });
    setActiveTable(null);
    setActiveTab(null);
  };

  const adjustSeatCount = (delta) => {
    if (!activeTable) return;
    dispatch({ type: POS_ACTIONS.ADJUST_SEATS, tableId: activeTable, delta });
    const newCount = Math.max(1, tableStates[activeTable].seats + delta);
    if (activeSeat > newCount) setActiveSeat(newCount);
  };

  const handleItemClick = (item, seatNum) => {
    setSelectedItem({ item, seatNum });
    setShowItemActions(true);
  };

  const handleDragStart = (item, seatNum) => setDraggedItem({ source: 'order', item, seatNum });

  const handleDrop = (targetSeat) => {
    if (!draggedItem) return;

    if (draggedItem.source === 'order') {
      if (draggedItem.seatNum !== targetSeat) {
        dispatch({
          type: POS_ACTIONS.DRAG_DROP_ITEM,
          tableId: activeTable,
          itemId: draggedItem.item.id,
          fromSeat: draggedItem.seatNum,
          toSeat: targetSeat,
        });
      }
    } else if (draggedItem.source === 'menu') {
      const menuItem = draggedItem.menuItem;
      setActiveSeat(targetSeat);
      if (menuItem.needsModScreen) {
        setPendingItem(menuItem);
        setItemQuantity(1);
        setItemCookTemp(menuItem.hasCookTemp ? 'Medium Rare' : '');
        setItemCourse(activeCourse);
        setItemAddOns([]);
        setItemModLines([{ prefix: '', value: '' }]);
        setItemAllergyLines(['']);
        setItemNoteLines(['']);
        setItemTiming('');
        setShowModScreen(true);
      } else {
        dispatch({
          type: POS_ACTIONS.ADD_ITEM,
          tableId: activeTable,
          seatNum: targetSeat,
          item: {
            ...menuItem,
            id: generateId(),
            quantity: 1,
            mods: [],
            course: activeCourse,
            status: STATUS.NEW,
            addedAt: Date.now(),
          },
        });
      }
    }

    setDraggedItem(null);
  };

  return (
    <div className="order-panel">
      <div className="order-header">
        <button className="back-btn" onClick={handleBackFromTable}>← Back</button>
        <h2>{isTableView ? `Table ${activeTable}` : tabStates[activeTab]?.name}</h2>
        {isTableView && (
          <div className="seat-controls">
            <button onClick={() => adjustSeatCount(-1)}>−</button>
            <input
              type="number"
              className="seat-count-input"
              value={tableStates[activeTable]?.seats || 1}
              onChange={e => {
                const newCount = Math.max(1, parseInt(e.target.value) || 1);
                const currentSeats = tableStates[activeTable]?.seats || 1;
                adjustSeatCount(newCount - currentSeats);
              }}
              min="1"
            />
            <span className="seats-label">seats</span>
            <button onClick={() => adjustSeatCount(1)}>+</button>
          </div>
        )}
      </div>

      {coursesToFire.length > 0 && (
        <div className="fire-buttons">
          {coursesToFire.map(course => (
            <button
              key={course}
              className="fire-btn"
              onClick={() => dispatch({ type: POS_ACTIONS.FIRE_COURSE, tableId: activeTable, course })}
            >Fire {course}</button>
          ))}
        </div>
      )}

      <div className="order-items-scroll">
        {isTableView && tableStates[activeTable] && (
          Object.entries(tableStates[activeTable].orders).map(([seatNum, items]) => (
            <SeatSection
              key={seatNum}
              seatNum={parseInt(seatNum)}
              items={items}
              activeSeat={activeSeat}
              onSeatClick={() => setActiveSeat(parseInt(seatNum))}
              onDrop={() => handleDrop(parseInt(seatNum))}
              onItemClick={handleItemClick}
              onDragStart={handleDragStart}
            />
          ))
        )}

        {isTabView && tabStates[activeTab] && (
          <div className="tab-items-list">
            {groupItemsByCourse(tabStates[activeTab].items).map(([course, courseItems]) => (
              <div key={course || 'none'} className="course-group">
                <div className="course-label">{course || 'No Course'}</div>
                {courseItems.map(item => (
                  <OrderItem
                    key={item.id}
                    item={item}
                    onItemClick={(item) => handleItemClick(item, null)}
                  />
                ))}
              </div>
            ))}
            {tabStates[activeTab].items.length === 0 && <div className="empty-tab">No items</div>}
          </div>
        )}
      </div>

      <div className="order-footer">
        <div className="order-totals">
          <div className="subtotal"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {appliedDiscount && (
            <div className="discount">
              <span>Discount ({appliedDiscount.label})</span>
              <span style={{ color: 'var(--success)' }}>−${(rawSubtotal - subtotal).toFixed(2)}</span>
            </div>
          )}
          <div className="tax"><span>Tax (13%)</span><span>${tax.toFixed(2)}</span></div>
          <div className="total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          {activeTable && paidSeats.length > 0 && (
            <div className="remaining">
              <span>Remaining</span>
              <span>${Math.max(0, total - getTablePaidAmount(tablePayments, activeTable)).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
