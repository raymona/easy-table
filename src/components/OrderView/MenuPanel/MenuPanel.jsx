import React, { useMemo, useState, useEffect } from 'react';
import { MENU, COURSES } from '../../../data/menu';
import { usePOS, useUI, POS_ACTIONS } from '../../../context';
import { generateId } from '../../../utils/idGenerator';
import MenuItem from './MenuItem';

const STATUS_NEW = 'new';

export default function MenuPanel() {
  const { state, dispatch } = usePOS();
  const { tableStates, tabStates, daypart } = state;
  const {
    activeTable, activeTab,
    activeSeat,
    activeCategory, setActiveCategory,
    activeCourse, setActiveCourse,
    setPendingItem, setItemQuantity, setItemCookTemp, setItemCourse,
    setItemAddOns, setItemModLines, setItemAllergyLines, setItemNoteLines, setItemTiming,
    setShowModScreen,
    setShowTransferModal,
    setShowPrintChequeModal,
    setShowPaymentModal,
    setSelectedPaymentMethod, setSelectedPaySeat, setPaymentAmount, setPayFullBill,
    setShowOpenItemModal, setOpenItemType, setOpenItemName, setOpenItemPrice,
    appliedDiscount,
    setDraggedItem,
  } = useUI();

  const [menuDaypart, setMenuDaypart] = useState(daypart);

  // Follow global daypart switches (e.g. auto-switch at 5 PM)
  useEffect(() => { setMenuDaypart(daypart); }, [daypart]);

  const menu = useMemo(() => MENU[menuDaypart], [menuDaypart]);
  const categories = useMemo(() => Object.keys(menu), [menu]);

  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;

  // ── Derived state ─────────────────────────────────────────────────────────
  const currentOrder = isTableView
    ? (tableStates[activeTable]?.orders || {})
    : (isTabView ? (tabStates[activeTab]?.items || []) : {});

  const hasUnsent = useMemo(() => {
    if (Array.isArray(currentOrder)) return currentOrder.some(i => i.status === STATUS_NEW);
    return Object.values(currentOrder).some(seatItems => seatItems.some(i => i.status === STATUS_NEW));
  }, [currentOrder]);

  const hasSentItems = useMemo(() => {
    if (Array.isArray(currentOrder)) return currentOrder.some(i => i.status === 'sent' || i.status === 'fired');
    return Object.values(currentOrder).some(seatItems => seatItems.some(i => i.status === 'sent' || i.status === 'fired'));
  }, [currentOrder]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const addItemToOrder = (item) => {
    dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId: activeTable, tabId: activeTab, seatNum: activeSeat, item });
  };

  const handleMenuItemClick = (item) => {
    if (item.needsModScreen) {
      setPendingItem(item);
      setItemQuantity(1);
      setItemCookTemp(item.hasCookTemp ? 'Medium Rare' : '');
      setItemCourse(activeCourse);
      setItemAddOns([]);
      setItemModLines([{ prefix: '', value: '' }]);
      setItemAllergyLines(['']);
      setItemNoteLines(['']);
      setItemTiming('');
      setShowModScreen(true);
    } else {
      addItemToOrder({ ...item, id: generateId(), quantity: 1, mods: [], course: activeCourse, status: STATUS_NEW, addedAt: Date.now() });
    }
  };

  const openPaymentModal = () => {
    setSelectedPaymentMethod(null);
    setSelectedPaySeat(null);
    setPaymentAmount('');
    setPayFullBill(false);
    setShowPaymentModal(true);
  };

  const openOpenItemModal = () => {
    setShowOpenItemModal(true);
    setOpenItemType(null);
    setOpenItemName('');
    setOpenItemPrice('');
  };

  return (
    <div className="menu-panel">
      <div className="menu-daypart-toggle">
        <button
          className={menuDaypart === 'lunch' ? 'active' : ''}
          onClick={() => { setMenuDaypart('lunch'); setActiveCategory('drinks'); }}
        >Lunch</button>
        <button
          className={menuDaypart === 'dinner' ? 'active' : ''}
          onClick={() => { setMenuDaypart('dinner'); setActiveCategory('drinks'); }}
        >Dinner</button>
      </div>
      <div className="course-selector">
        <span className="course-label-text">Course:</span>
        {COURSES.map(course => (
          <button
            key={course || 'none'}
            className={activeCourse === course ? 'active' : ''}
            onClick={() => setActiveCourse(course)}
          >{course || 'None'}</button>
        ))}
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => setActiveCategory(cat)}
          >{menu[cat].label}</button>
        ))}
      </div>

      <div className="menu-items">
        {menu[activeCategory]?.items.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            onClick={() => handleMenuItemClick(item)}
            onDragStart={activeTable ? (menuItem) => setDraggedItem({ source: 'menu', menuItem }) : undefined}
          />
        ))}
        <button className="menu-item open-item" onClick={openOpenItemModal}>
          <span className="menu-item-name">+ Open Item</span>
        </button>
      </div>

      <div className="action-bar">
        {hasUnsent && (
          <button className="action-btn send" onClick={() => dispatch({ type: POS_ACTIONS.SEND_ORDER, tableId: activeTable, tabId: activeTab })}>
            Send Order
          </button>
        )}
        {isTableView && (
          <button className="action-btn transfer" onClick={() => setShowTransferModal(true)}>Transfer</button>
        )}
        <button
          className="action-btn print"
          onClick={() => setShowPrintChequeModal(true)}
          disabled={!hasSentItems}
        >Print Cheque</button>
        <button
          className="action-btn pay"
          onClick={openPaymentModal}
          disabled={!hasSentItems}
        >Pay</button>
      </div>
    </div>
  );
}
