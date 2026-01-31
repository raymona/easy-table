import React, { useState, useEffect, useMemo } from 'react';
import { MENU, SERVERS, TABLES, COOK_TEMPS, COURSES, VOID_REASONS, DISCOUNT_PRESETS, CARD_TYPES, FLOOR_SECTIONS, FLOOR_SECTION_LABELS, getCurrentDaypart } from '../data/menu';
import './POS.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const STATUS = {
  NEW: 'new',
  SENT: 'sent',
  FIRED: 'fired',
};

const COURSE_ORDER = { '': 0, 'Drinks': 1, 'Apps': 2, 'Mains': 3, 'Dessert': 4 };

const MOD_PREFIXES = ['no', 'side', 'sub', 'extra', 'light'];

export default function POS() {
  const [currentServer, setCurrentServer] = useState(null);
  const [view, setView] = useState('floor');
  const [floorSection, setFloorSection] = useState('dining');
  const [activeTable, setActiveTable] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [daypart, setDaypart] = useState(getCurrentDaypart());
  const [activeCategory, setActiveCategory] = useState('drinks');
  const [activeCourse, setActiveCourse] = useState('');
  const [tableStates, setTableStates] = useState({});
  const [tabStates, setTabStates] = useState({});
  const [activeSeat, setActiveSeat] = useState(1);
  const [showModScreen, setShowModScreen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemCookTemp, setItemCookTemp] = useState('');
  const [itemCourse, setItemCourse] = useState('');
  const [itemAddOns, setItemAddOns] = useState([]);
  const [itemModLines, setItemModLines] = useState([{ prefix: '', value: '' }]);
  const [itemAllergyLines, setItemAllergyLines] = useState(['']);
  const [itemNoteLines, setItemNoteLines] = useState(['']);
  const [itemTiming, setItemTiming] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemActions, setShowItemActions] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [pendingTableId, setPendingTableId] = useState(null);
  const [seatCount, setSeatCount] = useState(2);
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPrintChequeModal, setShowPrintChequeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedPaySeat, setSelectedPaySeat] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showSplitItemModal, setShowSplitItemModal] = useState(false);
  const [splitWays, setSplitWays] = useState(2);
  const [showMoveItemModal, setShowMoveItemModal] = useState(false);
  const [closedBills, setClosedBills] = useState([]);
  const [showServerScreen, setShowServerScreen] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedClosedBill, setSelectedClosedBill] = useState(null);
  const [showOpenItemModal, setShowOpenItemModal] = useState(false);
  const [openItemType, setOpenItemType] = useState(null);
  const [openItemName, setOpenItemName] = useState('');
  const [openItemPrice, setOpenItemPrice] = useState('');
  const [showReopenTablePicker, setShowReopenTablePicker] = useState(false);
  const [tablePayments, setTablePayments] = useState({}); // { tableId: { payments: [], paidSeats: [], seatPayments: {} } }
  const [payFullBill, setPayFullBill] = useState(false); // When true, pay entire bill as one (not by seat)
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState(null); // 'item' or 'table'

  const menu = useMemo(() => MENU[daypart], [daypart]);
  const categories = useMemo(() => Object.keys(menu), [menu]);
  const sectionTables = useMemo(() => TABLES.filter(t => t.section === floorSection), [floorSection]);
  
  const currentOrder = useMemo(() => {
    if (activeTable) return tableStates[activeTable]?.orders || {};
    if (activeTab) return tabStates[activeTab]?.items || [];
    return {};
  }, [activeTable, activeTab, tableStates, tabStates]);
  
  const hasUnsent = useMemo(() => {
    if (!currentOrder) return false;
    if (Array.isArray(currentOrder)) return currentOrder.some(item => item.status === STATUS.NEW);
    return Object.values(currentOrder).some(seatItems => seatItems.some(item => item.status === STATUS.NEW));
  }, [currentOrder]);

  const hasSentItems = useMemo(() => {
    if (!currentOrder) return false;
    if (Array.isArray(currentOrder)) return currentOrder.some(item => item.status === STATUS.SENT || item.status === STATUS.FIRED);
    return Object.values(currentOrder).some(seatItems => seatItems.some(item => item.status === STATUS.SENT || item.status === STATUS.FIRED));
  }, [currentOrder]);

  useEffect(() => {
    const checkDaypart = () => {
      const newDaypart = getCurrentDaypart();
      if (newDaypart !== daypart) setDaypart(newDaypart);
    };
    const interval = setInterval(checkDaypart, 60000);
    return () => clearInterval(interval);
  }, [daypart]);

  const openTable = (tableId) => {
    if (tableStates[tableId]) {
      setActiveTable(tableId);
      setActiveTab(null);
      setActiveSeat(1);
    } else {
      setPendingTableId(tableId);
      const defaultSeats = TABLES.find(t => t.id === tableId)?.defaultSeats || 2;
      setSeatCount(defaultSeats);
      setShowSeatPicker(true);
    }
  };
  
  const confirmOpenTable = () => {
    const tableId = pendingTableId;
    setTableStates(prev => ({
      ...prev,
      [tableId]: {
        server: currentServer,
        seats: seatCount,
        orders: Object.fromEntries(Array.from({ length: seatCount }, (_, i) => [i + 1, []])),
        openedAt: Date.now(),
      }
    }));
    setActiveTable(tableId);
    setActiveTab(null);
    setActiveSeat(1);
    setShowSeatPicker(false);
    setPendingTableId(null);
  };
  
  const openNewTab = () => {
    if (!newTabName.trim()) return;
    const tabId = generateId();
    setTabStates(prev => ({
      ...prev,
      [tabId]: { name: newTabName.trim(), server: currentServer, items: [], openedAt: Date.now() }
    }));
    setActiveTab(tabId);
    setActiveTable(null);
    setShowNewTabModal(false);
    setNewTabName('');
  };
  
  const adjustSeatCount = (delta) => {
    if (!activeTable) return;
    const current = tableStates[activeTable].seats;
    const newCount = Math.max(1, current + delta);
    setTableStates(prev => {
      const orders = { ...prev[activeTable].orders };
      if (delta > 0) {
        for (let i = current + 1; i <= newCount; i++) orders[i] = [];
      } else if (delta < 0 && newCount < current) {
        const removedItems = orders[current] || [];
        if (removedItems.length > 0) orders[1] = [...orders[1], ...removedItems];
        delete orders[current];
      }
      return { ...prev, [activeTable]: { ...prev[activeTable], seats: newCount, orders } };
    });
    if (activeSeat > newCount) setActiveSeat(newCount);
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
      addItemToOrder({ ...item, id: generateId(), quantity: 1, mods: [], course: activeCourse, status: STATUS.NEW, addedAt: Date.now() });
    }
  };
  
  const confirmModScreen = () => {
    const mods = [];
    if (itemCookTemp) mods.push(itemCookTemp);
    if (itemAddOns.length) mods.push(...itemAddOns);
    // Process mod lines
    itemModLines.forEach(line => {
      if (line.prefix && line.value.trim()) {
        mods.push(`${line.prefix} ${line.value.trim()}`);
      }
    });
    // Process allergy lines
    const allergies = itemAllergyLines.filter(a => a.trim()).join(', ');
    if (allergies) mods.push(`ALLERGY: ${allergies}`);
    if (itemTiming) mods.push(itemTiming.toUpperCase());
    // Process note lines
    const notes = itemNoteLines.filter(n => n.trim()).join('; ');
    if (notes) mods.push(`Note: ${notes}`);
    
    if (editingItem) {
      // Editing existing item - update it and add extra copies if quantity > 1
      const { item: oldItem, seatNum } = editingItem;
      const updatedItem = { ...pendingItem, id: oldItem.id, quantity: 1, mods, course: itemCourse, status: oldItem.status, addedAt: oldItem.addedAt };
      
      // Create additional copies if quantity > 1
      const extraItems = [];
      for (let i = 1; i < itemQuantity; i++) {
        extraItems.push({ ...pendingItem, id: generateId(), quantity: 1, mods, course: itemCourse, status: oldItem.status, addedAt: Date.now() });
      }
      
      if (activeTable && seatNum) {
        setTableStates(prev => ({
          ...prev,
          [activeTable]: {
            ...prev[activeTable],
            orders: {
              ...prev[activeTable].orders,
              [seatNum]: [
                ...prev[activeTable].orders[seatNum].map(i => i.id === oldItem.id ? updatedItem : i),
                ...extraItems
              ]
            }
          }
        }));
      } else if (activeTab) {
        setTabStates(prev => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            items: [
              ...prev[activeTab].items.map(i => i.id === oldItem.id ? updatedItem : i),
              ...extraItems
            ]
          }
        }));
      }
      setEditingItem(null);
    } else {
      // Adding new item(s)
      for (let i = 0; i < itemQuantity; i++) {
        addItemToOrder({ ...pendingItem, id: generateId(), quantity: 1, mods, course: itemCourse, status: STATUS.NEW, addedAt: Date.now() });
      }
    }
    
    setShowModScreen(false);
    setPendingItem(null);
  };
  
  const addItemToOrder = (item) => {
    if (activeTable) {
      setTableStates(prev => ({
        ...prev,
        [activeTable]: {
          ...prev[activeTable],
          orders: { ...prev[activeTable].orders, [activeSeat]: [...(prev[activeTable].orders[activeSeat] || []), item] }
        }
      }));
    } else if (activeTab) {
      setTabStates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], items: [...prev[activeTab].items, item] } }));
    }
  };

  const handleItemClick = (item, seatNum) => { setSelectedItem({ item, seatNum }); setShowItemActions(true); };
  
  const quickVoidItem = () => {
    if (!selectedItem) return;
    const { item, seatNum } = selectedItem;
    if (activeTable) {
      setTableStates(prev => ({
        ...prev,
        [activeTable]: {
          ...prev[activeTable],
          orders: { ...prev[activeTable].orders, [seatNum]: prev[activeTable].orders[seatNum].filter(i => i.id !== item.id) }
        }
      }));
    } else if (activeTab) {
      setTabStates(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], items: prev[activeTab].items.filter(i => i.id !== item.id) } }));
    }
    setShowItemActions(false);
    setSelectedItem(null);
  };
  
  const voidItemWithReason = () => { if (!selectedItem || !voidReason) return; quickVoidItem(); setShowVoidModal(false); setVoidReason(''); };
  
  const reorderItem = () => {
    if (!selectedItem) return;
    const { item, seatNum } = selectedItem;
    const newItem = { ...item, id: generateId(), status: STATUS.NEW, addedAt: Date.now() };
    
    if (activeTable && seatNum) {
      // Add to the same seat the item came from
      setTableStates(prev => ({
        ...prev,
        [activeTable]: {
          ...prev[activeTable],
          orders: { ...prev[activeTable].orders, [seatNum]: [...(prev[activeTable].orders[seatNum] || []), newItem] }
        }
      }));
    } else {
      // Tab or fallback
      addItemToOrder(newItem);
    }
    
    setShowItemActions(false);
    setSelectedItem(null);
  };

  const splitItem = () => {
    if (!selectedItem || splitWays < 2) return;
    const { item, seatNum } = selectedItem;
    
    // Calculate split price
    const splitPrice = item.price / splitWays;
    const splitName = `1/${splitWays} ${item.name}`;
    
    // Create split items
    const splitItems = Array.from({ length: splitWays }, () => ({
      ...item,
      id: generateId(),
      name: splitName,
      price: Math.round(splitPrice * 100) / 100, // Round to cents
      originalPrice: item.price,
      splitFrom: item.id,
    }));
    
    if (activeTable && seatNum) {
      setTableStates(prev => {
        const orders = { ...prev[activeTable].orders };
        // Remove original item
        orders[seatNum] = orders[seatNum].filter(i => i.id !== item.id);
        // Add split items to same seat
        orders[seatNum] = [...orders[seatNum], ...splitItems];
        return { ...prev, [activeTable]: { ...prev[activeTable], orders } };
      });
    } else if (activeTab) {
      setTabStates(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          items: [...prev[activeTab].items.filter(i => i.id !== item.id), ...splitItems]
        }
      }));
    }
    
    setShowSplitItemModal(false);
    setShowItemActions(false);
    setSelectedItem(null);
    setSplitWays(2);
  };

  const moveItemToSeat = (targetSeat) => {
    if (!selectedItem || !activeTable) return;
    const { item, seatNum } = selectedItem;
    if (seatNum === targetSeat) return;
    
    setTableStates(prev => {
      const orders = { ...prev[activeTable].orders };
      // Remove from current seat
      orders[seatNum] = orders[seatNum].filter(i => i.id !== item.id);
      // Add to target seat
      orders[targetSeat] = [...(orders[targetSeat] || []), item];
      return { ...prev, [activeTable]: { ...prev[activeTable], orders } };
    });
    
    setShowMoveItemModal(false);
    setShowItemActions(false);
    setSelectedItem(null);
  };

  const sendOrder = () => {
    const timestamp = Date.now();
    if (activeTable) {
      setTableStates(prev => {
        const orders = { ...prev[activeTable].orders };
        Object.keys(orders).forEach(seat => {
          orders[seat] = orders[seat].map(item => {
            if (item.status !== STATUS.NEW) return item;
            const course = item.course || '';
            if (!course || course === 'Drinks' || course === 'Apps') return { ...item, status: STATUS.FIRED, sentAt: timestamp };
            return { ...item, status: STATUS.SENT, sentAt: timestamp };
          });
        });
        return { ...prev, [activeTable]: { ...prev[activeTable], orders } };
      });
    } else if (activeTab) {
      setTabStates(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], items: prev[activeTab].items.map(item => item.status === STATUS.NEW ? { ...item, status: STATUS.FIRED, sentAt: timestamp } : item) }
      }));
    }
  };

  const getCoursesToFire = () => {
    if (!activeTable || !tableStates[activeTable]) return [];
    const allItems = Object.values(tableStates[activeTable].orders).flat();
    const coursesWaiting = [];
    if (allItems.some(i => i.status === STATUS.SENT && i.course === 'Mains')) coursesWaiting.push('Mains');
    if (allItems.some(i => i.status === STATUS.SENT && i.course === 'Dessert')) coursesWaiting.push('Dessert');
    return coursesWaiting;
  };
  
  const fireCourse = (course) => {
    if (!activeTable) return;
    setTableStates(prev => {
      const orders = { ...prev[activeTable].orders };
      Object.keys(orders).forEach(seat => {
        orders[seat] = orders[seat].map(item => item.status === STATUS.SENT && item.course === course ? { ...item, status: STATUS.FIRED, firedAt: Date.now() } : item);
      });
      return { ...prev, [activeTable]: { ...prev[activeTable], orders } };
    });
  };

  const handleDragStart = (item, seatNum) => { setDraggedItem({ item, seatNum }); };
  
  const handleDrop = (targetSeat) => {
    if (!draggedItem || draggedItem.seatNum === targetSeat) { setDraggedItem(null); return; }
    if (activeTable) {
      setTableStates(prev => {
        const orders = { ...prev[activeTable].orders };
        orders[draggedItem.seatNum] = orders[draggedItem.seatNum].filter(i => i.id !== draggedItem.item.id);
        orders[targetSeat] = [...(orders[targetSeat] || []), draggedItem.item];
        return { ...prev, [activeTable]: { ...prev[activeTable], orders } };
      });
    }
    setDraggedItem(null);
  };

  const getOrderTotal = (orders) => {
    if (Array.isArray(orders)) return orders.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return Object.values(orders).flat().reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };
  
  const getSeatTotal = (seatNum) => {
    if (!activeTable || !tableStates[activeTable]) return 0;
    const items = tableStates[activeTable].orders[seatNum] || [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return subtotal * 1.13; // Include tax
  };
  
  const getSubtotal = () => getOrderTotal(currentOrder);
  const getTax = () => getSubtotal() * 0.13;
  const getTotal = () => getSubtotal() + getTax();
  
  const getUnpaidTotal = () => {
    if (!activeTable || !tableStates[activeTable]) return getTotal();
    const allSeats = Object.keys(tableStates[activeTable].orders);
    const unpaidSeats = allSeats.filter(s => !paidSeats.includes(parseInt(s)));
    return unpaidSeats.reduce((sum, s) => sum + getSeatTotal(parseInt(s)), 0);
  };
  
  const openPaymentModal = (fullBill = false) => { 
    setSelectedPaymentMethod(null);
    setSelectedPaySeat(null);
    setPaymentAmount(fullBill ? getTotal().toFixed(2) : '');
    setPayFullBill(fullBill);
    setShowPaymentModal(true); 
  };
  
  const selectSeatToPay = (seatNum) => {
    const seatTotal = getSeatTotal(seatNum);
    const paidOnSeat = getTableSeatPaidAmount(activeTable, seatNum);
    const remaining = seatTotal - paidOnSeat;
    setSelectedPaySeat(seatNum);
    setPaymentAmount(remaining.toFixed(2));
  };
  
  const selectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
  };
  
  const processPayment = () => {
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;
    
    const payment = {
      seat: selectedPaySeat,
      method: selectedPaymentMethod,
      amount,
      timestamp: Date.now(),
    };
    
    if (activeTable) {
      // Initialize table payment tracking if needed
      const currentTablePayments = tablePayments[activeTable] || { payments: [], paidSeats: [], seatPayments: {} };
      const newPayments = [...currentTablePayments.payments, payment];
      
      if (selectedPaySeat !== null && !payFullBill) {
        // Seat-based payment
        const currentSeatPaid = (currentTablePayments.seatPayments[selectedPaySeat] || 0) + amount;
        const seatTotal = getSeatTotal(selectedPaySeat);
        const seatFullyPaid = currentSeatPaid >= seatTotal;
        
        const newSeatPayments = {
          ...currentTablePayments.seatPayments,
          [selectedPaySeat]: currentSeatPaid,
        };
        
        const newPaidSeats = seatFullyPaid && !currentTablePayments.paidSeats.includes(selectedPaySeat)
          ? [...currentTablePayments.paidSeats, selectedPaySeat]
          : currentTablePayments.paidSeats;
        
        setTablePayments(prev => ({
          ...prev,
          [activeTable]: {
            payments: newPayments,
            paidSeats: newPaidSeats,
            seatPayments: newSeatPayments,
          },
        }));
        
        // Check if all seats WITH ITEMS are paid
        const seatsWithItems = Object.entries(tableStates[activeTable]?.orders || {})
          .filter(([, items]) => items.length > 0)
          .map(([seatNum]) => parseInt(seatNum));
        const allPaid = seatsWithItems.every(s => newPaidSeats.includes(s));
        
        if (allPaid) {
          // All seats paid - close table
          closeTableBill(newPayments);
        } else if (seatFullyPaid) {
          // This seat fully paid - auto-advance to next unpaid seat
          const nextUnpaidSeat = seatsWithItems.find(s => !newPaidSeats.includes(s));
          if (nextUnpaidSeat !== undefined) {
            const nextSeatTotal = getSeatTotal(nextUnpaidSeat);
            const nextSeatPaid = newSeatPayments[nextUnpaidSeat] || 0;
            setSelectedPaySeat(nextUnpaidSeat);
            setPaymentAmount((nextSeatTotal - nextSeatPaid).toFixed(2));
          } else {
            setSelectedPaySeat(null);
            setPaymentAmount('');
          }
          setSelectedPaymentMethod(null);
        } else {
          // Seat not fully paid - stay on same seat
          setPaymentAmount((seatTotal - currentSeatPaid).toFixed(2));
          setSelectedPaymentMethod(null);
        }
      } else {
        // Full bill payment (not by seat)
        const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
        const billTotal = getTotal();
        
        setTablePayments(prev => ({
          ...prev,
          [activeTable]: {
            ...currentTablePayments,
            payments: newPayments,
          },
        }));
        
        if (totalPaid >= billTotal) {
          // Fully paid - close the bill
          closeTableBill(newPayments);
        } else {
          // Partial payment - stay in modal, update remaining
          setPaymentAmount((billTotal - totalPaid).toFixed(2));
          setSelectedPaymentMethod(null);
        }
      }
    } else if (activeTab) {
      // Tab payment
      const billTotal = getTotal();
      const tip = amount - billTotal > 0 ? amount - billTotal : 0;
      
      const tabData = tabStates[activeTab];
      const closedBill = {
        id: generateId(),
        type: 'tab',
        tabName: tabData.name,
        server: tabData.server,
        items: tabData.items,
        subtotal: getSubtotal(),
        tax: getTax(),
        total: billTotal,
        payments: [payment],
        amountPaid: amount,
        tip,
        closedAt: Date.now(),
        openedAt: tabData.openedAt,
      };
      setClosedBills(prev => [closedBill, ...prev]);
      setTabStates(prev => { const { [activeTab]: _, ...rest } = prev; return rest; }); 
      setActiveTab(null);
      setShowPaymentModal(false);
      setView('floor');
    }
  };
  
  const closeTableBill = (payments) => {
    const tableData = tableStates[activeTable];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const billTotal = getTotal();
    const closedBill = {
      id: generateId(),
      type: 'table',
      tableId: activeTable,
      server: tableData.server,
      orders: tableData.orders,
      subtotal: getSubtotal(),
      tax: getTax(),
      total: billTotal,
      payments: payments,
      amountPaid: totalPaid,
      tip: totalPaid - billTotal > 0 ? totalPaid - billTotal : 0,
      closedAt: Date.now(),
      openedAt: tableData.openedAt,
    };
    setClosedBills(prev => [closedBill, ...prev]);
    setTableStates(prev => { const { [activeTable]: _, ...rest } = prev; return rest; }); 
    setTablePayments(prev => { const { [activeTable]: _, ...rest } = prev; return rest; });
    setActiveTable(null);
    setShowPaymentModal(false);
    setView('floor');
  };
  
  const voidLastPayment = () => {
    if (!activeTable || !tablePayments[activeTable]?.payments?.length) return;
    
    const currentTablePayments = tablePayments[activeTable];
    const payments = currentTablePayments.payments;
    const lastPayment = payments[payments.length - 1];
    
    // Update seat payments if it was a seat payment
    let newSeatPayments = { ...currentTablePayments.seatPayments };
    let newPaidSeats = [...currentTablePayments.paidSeats];
    
    if (lastPayment.seat !== null) {
      newSeatPayments[lastPayment.seat] = (newSeatPayments[lastPayment.seat] || 0) - lastPayment.amount;
      if (newSeatPayments[lastPayment.seat] <= 0) {
        delete newSeatPayments[lastPayment.seat];
      }
      // Remove from paid seats if no longer fully paid
      const seatTotal = getSeatTotal(lastPayment.seat);
      if ((newSeatPayments[lastPayment.seat] || 0) < seatTotal) {
        newPaidSeats = newPaidSeats.filter(s => s !== lastPayment.seat);
      }
    }
    
    setTablePayments(prev => ({
      ...prev,
      [activeTable]: {
        payments: payments.slice(0, -1),
        paidSeats: newPaidSeats,
        seatPayments: newSeatPayments,
      },
    }));
  };
  
  const getTablePaidAmount = (tableId) => {
    return (tablePayments[tableId]?.payments || []).reduce((sum, p) => sum + p.amount, 0);
  };
  
  const getTableSeatPaidAmount = (tableId, seatNum) => {
    return tablePayments[tableId]?.seatPayments?.[seatNum] || 0;
  };
  
  const getTablePaidSeats = (tableId) => {
    return tablePayments[tableId]?.paidSeats || [];
  };
  
  const getTableRemainingBalance = (tableId) => {
    if (!tableStates[tableId]) return 0;
    const orders = tableStates[tableId].orders || {};
    const subtotal = Object.values(orders).flat().reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.13;
    const total = subtotal + tax;
    return total - getTablePaidAmount(tableId);
  };
  
  const hasPartialPayment = (tableId) => {
    return (tablePayments[tableId]?.payments || []).length > 0;
  };
  
  // Transfer functions
  const transferItemToTable = (item, fromSeat, toTableId, toSeat) => {
    if (!activeTable || !tableStates[toTableId]) return;
    
    // Remove from current table/seat
    setTableStates(prev => {
      const currentOrders = { ...prev[activeTable].orders };
      currentOrders[fromSeat] = currentOrders[fromSeat].filter(i => i.id !== item.id);
      
      // Add to destination table/seat
      const destOrders = { ...prev[toTableId].orders };
      if (!destOrders[toSeat]) destOrders[toSeat] = [];
      destOrders[toSeat] = [...destOrders[toSeat], item];
      
      return {
        ...prev,
        [activeTable]: { ...prev[activeTable], orders: currentOrders },
        [toTableId]: { ...prev[toTableId], orders: destOrders },
      };
    });
  };
  
  const transferFullTable = (fromTableId, toTableId) => {
    if (!tableStates[fromTableId] || tableStates[toTableId]) return; // Can only transfer to empty table
    
    const tableData = tableStates[fromTableId];
    setTableStates(prev => {
      const { [fromTableId]: _, ...rest } = prev;
      return {
        ...rest,
        [toTableId]: { ...tableData },
      };
    });
    
    // Also transfer any partial payments
    if (tablePayments[fromTableId]) {
      setTablePayments(prev => {
        const { [fromTableId]: payments, ...rest } = prev;
        return {
          ...rest,
          [toTableId]: payments,
        };
      });
    }
    
    setActiveTable(toTableId);
  };

  const reopenBill = (bill) => {
    if (bill.type === 'table') {
      // Check if original table is available
      if (!tableStates[bill.tableId]) {
        // Table available - reopen there
        setTableStates(prev => ({
          ...prev,
          [bill.tableId]: {
            server: bill.server,
            seats: Object.keys(bill.orders).length,
            orders: bill.orders,
            openedAt: bill.openedAt,
          }
        }));
        setClosedBills(prev => prev.filter(b => b.id !== bill.id));
        setShowServerScreen(false);
        setActiveTable(bill.tableId);
      } else {
        // Table occupied - show picker
        setSelectedClosedBill(bill);
        setShowReopenTablePicker(true);
      }
    } else {
      // Tab - just reopen
      const tabId = generateId();
      setTabStates(prev => ({
        ...prev,
        [tabId]: {
          name: bill.tabName,
          server: bill.server,
          items: bill.items,
          openedAt: bill.openedAt,
        }
      }));
      setClosedBills(prev => prev.filter(b => b.id !== bill.id));
      setShowServerScreen(false);
      setActiveTab(tabId);
    }
  };

  const reopenBillToTable = (bill, tableId) => {
    setTableStates(prev => ({
      ...prev,
      [tableId]: {
        server: bill.server,
        seats: Object.keys(bill.orders).length,
        orders: bill.orders,
        openedAt: bill.openedAt,
      }
    }));
    setClosedBills(prev => prev.filter(b => b.id !== bill.id));
    setShowReopenTablePicker(false);
    setSelectedClosedBill(null);
    setShowServerScreen(false);
    setActiveTable(tableId);
  };

  const updatePayment = (billId, newMethod, newAmount) => {
    setClosedBills(prev => prev.map(bill => {
      if (bill.id !== billId) return bill;
      const amount = parseFloat(newAmount) || bill.amountPaid;
      return {
        ...bill,
        payments: [{ method: newMethod, amount }],
        amountPaid: amount,
        tip: amount - bill.total > 0 ? amount - bill.total : 0,
      };
    }));
    setShowEditPaymentModal(false);
    setSelectedClosedBill(null);
  };

  const getServerClosedBills = () => closedBills.filter(b => b.server === currentServer);
  
  const getServerShiftStats = () => {
    const bills = getServerClosedBills();
    const totalSales = bills.reduce((sum, b) => sum + b.total, 0);
    const totalTips = bills.reduce((sum, b) => sum + b.tip, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.amountPaid, 0);
    return { totalSales, totalTips, totalPaid, billCount: bills.length };
  };

  const handleOpenItemClick = () => {
    setShowOpenItemModal(true);
    setOpenItemType(null);
    setOpenItemName('');
    setOpenItemPrice('');
  };

  const addOpenItem = () => {
    if (!openItemName.trim() || !openItemPrice) return;
    const price = parseFloat(openItemPrice) || 0;
    if (price <= 0) return;
    
    const item = {
      id: generateId(),
      name: openItemName.trim(),
      price,
      quantity: 1,
      mods: [],
      course: activeCourse,
      status: STATUS.NEW,
      addedAt: Date.now(),
      isOpenItem: true,
      openItemType,
    };
    addItemToOrder(item);
    setShowOpenItemModal(false);
  };

  const getAvailableTables = () => {
    return TABLES.filter(t => !tableStates[t.id]).map(t => t.id);
  };
  
  const transferTabToTable = (tabId, tableId) => {
    const tab = tabStates[tabId];
    if (!tab) return;
    if (!tableStates[tableId]) {
      setTableStates(prev => ({ ...prev, [tableId]: { server: currentServer, seats: 1, orders: { 1: tab.items }, openedAt: Date.now() } }));
    } else {
      setTableStates(prev => ({ ...prev, [tableId]: { ...prev[tableId], orders: { ...prev[tableId].orders, 1: [...prev[tableId].orders[1], ...tab.items] } } }));
    }
    setTabStates(prev => { const { [tabId]: _, ...rest } = prev; return rest; });
    setActiveTab(null);
    setActiveTable(tableId);
  };

  const getServerInfo = (serverId) => SERVERS.find(s => s.id === serverId);
  
  const groupItemsByCourse = (items) => {
    const groups = {};
    items.forEach(item => { const course = item.course || ''; if (!groups[course]) groups[course] = []; groups[course].push(item); });
    return Object.entries(groups).sort((a, b) => (COURSE_ORDER[a[0]] || 0) - (COURSE_ORDER[b[0]] || 0));
  };

  if (!currentServer) {
    return (
      <div className="sign-in-screen">
        <div className="sign-in-box">
          <h1>Easy Table</h1>
          <p>Select your name to sign in</p>
          <div className="server-grid">
            {SERVERS.map(server => (
              <button key={server.id} className="server-btn" onClick={() => setCurrentServer(server.id)}>
                <span className="server-avatar" style={{ background: server.color }}>{server.name.charAt(0)}</span>
                <span>{server.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const serverInfo = getServerInfo(currentServer);
  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;
  const coursesToFire = getCoursesToFire();
  
  return (
    <div className="pos-container">
      <header className="pos-header">
        <div className="header-left">
          <h1 className="logo">Easy Table</h1>
          <nav className="main-nav">
            <button className={view === 'floor' && !isTableView && !isTabView ? 'active' : ''} onClick={() => { setView('floor'); setActiveTable(null); setActiveTab(null); }}>Floor</button>
            <button className={view === 'tabs' ? 'active' : ''} onClick={() => { setView('tabs'); setActiveTable(null); setActiveTab(null); }}>Bar Tabs</button>
          </nav>
        </div>
        <div className="header-right">
          <div className="daypart-toggle">
            <button className={daypart === 'lunch' ? 'active' : ''} onClick={() => setDaypart('lunch')}>Lunch</button>
            <button className={daypart === 'dinner' ? 'active' : ''} onClick={() => setDaypart('dinner')}>Dinner</button>
          </div>
          <div className="server-info" onClick={() => setShowServerScreen(true)}>
            <span className="server-avatar" style={{ background: serverInfo.color }}>{serverInfo.name.charAt(0)}</span>
            <span>{serverInfo.name}</span>
            <button className="sign-out" onClick={(e) => { e.stopPropagation(); setCurrentServer(null); }}>×</button>
          </div>
        </div>
      </header>

      <main className="pos-main">
        {view === 'floor' && !isTableView && !isTabView && (
          <div className="floor-view">
            <div className="floor-section-tabs">
              {FLOOR_SECTIONS.map(section => (
                <button key={section} className={floorSection === section ? 'active' : ''} onClick={() => setFloorSection(section)}>
                  {FLOOR_SECTION_LABELS[section]}
                </button>
              ))}
            </div>
            <div className="floor-map">
              {sectionTables.map(table => {
                const state = tableStates[table.id];
                const tableServer = state ? getServerInfo(state.server) : null;
                const isPartiallyPaid = hasPartialPayment(table.id);
                return (
                  <div 
                    key={table.id} 
                    className={`floor-table ${table.shape} ${state ? 'occupied' : 'empty'} ${state?.server === currentServer ? 'yours' : ''} ${isPartiallyPaid ? 'partial-payment' : ''}`} 
                    style={{ 
                      left: table.x, 
                      top: table.y,
                      '--server-color': tableServer?.color || 'var(--border)',
                    }} 
                    onClick={() => openTable(table.id)}
                  >
                    <span className="table-number">{table.id}</span>
                    {state && <span className="table-server-dot" style={{ background: tableServer?.color }} />}
                  </div>
                );
              })}
            </div>
            <div className="floor-legend">
              <div className="legend-item"><span className="legend-dot empty"></span> Available</div>
              <div className="legend-item"><span className="legend-swatch dashed"></span> Partial Payment</div>
              {SERVERS.map(s => (<div key={s.id} className="legend-item"><span className="legend-dot" style={{ background: s.color }}></span> {s.name}</div>))}
            </div>
          </div>
        )}

        {view === 'tabs' && !isTabView && (
          <div className="tabs-view">
            <div className="tabs-header">
              <h2>Bar Tabs</h2>
              <button className="new-tab-btn" onClick={() => setShowNewTabModal(true)}>+ New Tab</button>
            </div>
            <div className="tabs-grid">
              {Object.entries(tabStates).filter(([_, tab]) => tab.server === currentServer).map(([tabId, tab]) => (
                <div key={tabId} className="tab-card" onClick={() => setActiveTab(tabId)}>
                  <span className="tab-name">{tab.name}</span>
                  <span className="tab-items">{tab.items.length} items</span>
                  <span className="tab-total">${getOrderTotal(tab.items).toFixed(2)}</span>
                </div>
              ))}
              {Object.entries(tabStates).filter(([_, tab]) => tab.server === currentServer).length === 0 && <p className="no-tabs">No open tabs</p>}
            </div>
          </div>
        )}

        {(isTableView || isTabView) && (
          <div className="order-view">
            <div className="order-panel">
              <div className="order-header">
                <button className="back-btn" onClick={() => { setActiveTable(null); setActiveTab(null); }}>← Back</button>
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
                  {coursesToFire.map(course => (<button key={course} className="fire-btn" onClick={() => fireCourse(course)}>Fire {course}</button>))}
                </div>
              )}
              
              <div className="order-items-scroll">
                {isTableView && tableStates[activeTable] && (
                  Object.entries(tableStates[activeTable].orders).map(([seatNum, items]) => (
                    <div key={seatNum} className={`seat-section ${activeSeat === parseInt(seatNum) ? 'active' : ''}`} onClick={() => setActiveSeat(parseInt(seatNum))} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(parseInt(seatNum))}>
                      <div className="seat-header">Seat {seatNum}</div>
                      {groupItemsByCourse(items).map(([course, courseItems]) => (
                        <div key={course || 'none'} className="course-group">
                          <div className="course-label">{course || 'No Course'}</div>
                          {courseItems.map(item => (
                            <div key={item.id} className={`order-item ${item.status}`} draggable onDragStart={() => handleDragStart(item, parseInt(seatNum))} onClick={(e) => { e.stopPropagation(); handleItemClick(item, parseInt(seatNum)); }}>
                              <span className="item-name">{item.name}</span>
                              {item.mods?.length > 0 && <span className="item-mods">{item.mods.join(', ')}</span>}
                              <span className="item-price">${item.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      {items.length === 0 && <div className="empty-seat">No items</div>}
                    </div>
                  ))
                )}
                
                {isTabView && tabStates[activeTab] && (
                  <div className="tab-items-list">
                    {groupItemsByCourse(tabStates[activeTab].items).map(([course, courseItems]) => (
                      <div key={course || 'none'} className="course-group">
                        <div className="course-label">{course || 'No Course'}</div>
                        {courseItems.map(item => (
                          <div key={item.id} className={`order-item ${item.status}`} onClick={() => handleItemClick(item, null)}>
                            <span className="item-name">{item.name}</span>
                            {item.mods?.length > 0 && <span className="item-mods">{item.mods.join(', ')}</span>}
                            <span className="item-price">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {tabStates[activeTab].items.length === 0 && <div className="empty-tab">No items</div>}
                  </div>
                )}
              </div>
              
              <div className="order-footer">
                <div className="order-totals">
                  <div className="subtotal"><span>Subtotal</span><span>${getSubtotal().toFixed(2)}</span></div>
                  <div className="tax"><span>Tax (13%)</span><span>${getTax().toFixed(2)}</span></div>
                  <div className="total"><span>Total</span><span>${getTotal().toFixed(2)}</span></div>
                  {activeTable && getTablePaidSeats(activeTable).length > 0 && (
                    <div className="remaining"><span>Remaining</span><span>${getTableRemainingBalance(activeTable).toFixed(2)}</span></div>
                  )}
                </div>
              </div>
            </div>

            <div className="menu-panel">
              <div className="course-selector">
                <span className="course-label-text">Course:</span>
                {COURSES.map(course => (<button key={course || 'none'} className={activeCourse === course ? 'active' : ''} onClick={() => setActiveCourse(course)}>{course || 'None'}</button>))}
              </div>
              
              <div className="category-tabs">
                {categories.map(cat => (<button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>{menu[cat].label}</button>))}
              </div>
              
              <div className="menu-items">
                {menu[activeCategory]?.items.map(item => (
                  <button key={item.id} className="menu-item" onClick={() => handleMenuItemClick(item)}>
                    <span className="menu-item-name">{item.name}</span>
                    <span className="menu-item-price">${item.price.toFixed(2)}</span>
                  </button>
                ))}
                <button className="menu-item open-item" onClick={handleOpenItemClick}>
                  <span className="menu-item-name">+ Open Item</span>
                </button>
              </div>
              
              <div className="action-bar">
                {hasUnsent && <button className="action-btn send" onClick={sendOrder}>Send Order</button>}
                {isTableView && <button className="action-btn transfer" onClick={() => setShowTransferModal(true)}>Transfer</button>}
                <button className="action-btn print" onClick={() => setShowPrintChequeModal(true)} disabled={!hasSentItems}>Print Cheque</button>
                <button className="action-btn pay" onClick={() => openPaymentModal(false)} disabled={!hasSentItems}>Pay</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showSeatPicker && (
        <div className="modal-overlay">
          <div className="modal seat-picker-modal">
            <button className="modal-close" onClick={() => setShowSeatPicker(false)}>×</button>
            <h2>Open Table {pendingTableId}</h2>
            <p>How many seats?</p>
            <div className="seat-picker">
              <button onClick={() => setSeatCount(c => Math.max(1, c - 1))}>−</button>
              <span className="seat-count">{seatCount}</span>
              <button onClick={() => setSeatCount(c => c + 1)}>+</button>
            </div>
            <div className="quick-picks">
              {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (<button key={n} className={seatCount === n ? 'active' : ''} onClick={() => setSeatCount(n)}>{n}</button>))}
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowSeatPicker(false)}>Cancel</button>
              <button className="confirm-btn" onClick={confirmOpenTable}>Open Table</button>
            </div>
          </div>
        </div>
      )}

      {showNewTabModal && (
        <div className="modal-overlay">
          <div className="modal new-tab-modal">
            <button className="modal-close" onClick={() => setShowNewTabModal(false)}>×</button>
            <h2>Open New Tab</h2>
            <input type="text" placeholder="Name..." value={newTabName} onChange={e => setNewTabName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && openNewTab()} />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowNewTabModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={openNewTab} disabled={!newTabName.trim()}>Open Tab</button>
            </div>
          </div>
        </div>
      )}

      {showModScreen && pendingItem && (
        <div className="modal-overlay">
          <div className="modal mod-screen-modal wide">
            <button className="modal-close" onClick={() => { setShowModScreen(false); setEditingItem(null); }}>×</button>
            <h2>{pendingItem.name}</h2>
            <div className="mod-screen-content">
              <div className="mod-section">
                <label>Quantity</label>
                <div className="quantity-picker">
                  <button onClick={() => setItemQuantity(q => Math.max(1, q - 1))}>−</button>
                  <input 
                    type="number" 
                    className="quantity-input" 
                    value={itemQuantity} 
                    onChange={e => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                  <button onClick={() => setItemQuantity(q => q + 1)}>+</button>
                </div>
              </div>
              {pendingItem.hasCookTemp && (
                <div className="mod-section">
                  <label>Temperature</label>
                  <div className="temp-options">
                    {COOK_TEMPS.map(temp => (<button key={temp} className={itemCookTemp === temp ? 'active' : ''} onClick={() => setItemCookTemp(temp)}>{temp}</button>))}
                  </div>
                </div>
              )}
              <div className="mod-section">
                <label>Course</label>
                <div className="course-options">
                  {COURSES.map(course => (<button key={course || 'none'} className={itemCourse === course ? 'active' : ''} onClick={() => setItemCourse(course)}>{course || 'No Course'}</button>))}
                </div>
              </div>
              {pendingItem.addOns?.length > 0 && (
                <div className="mod-section">
                  <label>Add-ons</label>
                  <div className="addon-options">
                    {pendingItem.addOns.map(addon => (<button key={addon} className={itemAddOns.includes(addon) ? 'active' : ''} onClick={() => setItemAddOns(prev => prev.includes(addon) ? prev.filter(a => a !== addon) : [...prev, addon])}>{addon}</button>))}
                  </div>
                </div>
              )}
              <div className="mod-section">
                <label>Timing</label>
                <div className="timing-options">
                  <button className={itemTiming === '' ? 'active' : ''} onClick={() => setItemTiming('')}>Normal</button>
                  <button className={itemTiming === 'hold' ? 'active' : ''} onClick={() => setItemTiming('hold')}>Hold</button>
                  <button className={itemTiming === 'rush' ? 'active' : ''} onClick={() => setItemTiming('rush')}>Rush</button>
                </div>
              </div>
              <div className="mod-section">
                <label>Modifications <button className="add-line-btn" onClick={() => setItemModLines(prev => [...prev, { prefix: '', value: '' }])}>+ Add</button></label>
                {itemModLines.map((line, idx) => (
                  <div key={idx} className="mod-line">
                    <select value={line.prefix} onChange={e => setItemModLines(prev => prev.map((l, i) => i === idx ? { ...l, prefix: e.target.value } : l))}>
                      <option value="">Select...</option>
                      {MOD_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input type="text" placeholder="e.g., onions, fries..." value={line.value} onChange={e => setItemModLines(prev => prev.map((l, i) => i === idx ? { ...l, value: e.target.value } : l))} />
                    {itemModLines.length > 1 && <button className="remove-line-btn" onClick={() => setItemModLines(prev => prev.filter((_, i) => i !== idx))}>×</button>}
                  </div>
                ))}
              </div>
              <div className="mod-section">
                <label>Allergies <button className="add-line-btn" onClick={() => setItemAllergyLines(prev => [...prev, ''])}>+ Add</button></label>
                {itemAllergyLines.map((allergy, idx) => (
                  <div key={idx} className="allergy-line">
                    <input type="text" placeholder="e.g., gluten, dairy, nuts..." value={allergy} onChange={e => setItemAllergyLines(prev => prev.map((a, i) => i === idx ? e.target.value : a))} />
                    {itemAllergyLines.length > 1 && <button className="remove-line-btn" onClick={() => setItemAllergyLines(prev => prev.filter((_, i) => i !== idx))}>×</button>}
                  </div>
                ))}
              </div>
              <div className="mod-section">
                <label>Kitchen Note <button className="add-line-btn" onClick={() => setItemNoteLines(prev => [...prev, ''])}>+ Add</button></label>
                {itemNoteLines.map((note, idx) => (
                  <div key={idx} className="note-line">
                    <input type="text" placeholder="Note for kitchen..." value={note} onChange={e => setItemNoteLines(prev => prev.map((n, i) => i === idx ? e.target.value : n))} />
                    {itemNoteLines.length > 1 && <button className="remove-line-btn" onClick={() => setItemNoteLines(prev => prev.filter((_, i) => i !== idx))}>×</button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowModScreen(false); setEditingItem(null); }}>Cancel</button>
              <button className="confirm-btn" onClick={confirmModScreen}>{editingItem ? (itemQuantity > 1 ? `Save + Add ${itemQuantity - 1} more` : 'Save') : (itemQuantity > 1 ? `Add (${itemQuantity})` : 'Add')}</button>
            </div>
          </div>
        </div>
      )}

      {showItemActions && selectedItem && (
        <div className="modal-overlay">
          <div className="modal item-actions-modal">
            <button className="modal-close" onClick={() => setShowItemActions(false)}>×</button>
            <h2>{selectedItem.item.name}</h2>
            <p className="item-price-display">${selectedItem.item.price.toFixed(2)}</p>
            {selectedItem.item.mods?.length > 0 && <p className="item-mods-display">{selectedItem.item.mods.join(', ')}</p>}
            <div className="action-buttons">
              {selectedItem.item.status === STATUS.NEW ? (
                <>
                  <button onClick={quickVoidItem}>Remove</button>
                  <button onClick={() => { 
                    setEditingItem(selectedItem);
                    setPendingItem(selectedItem.item); 
                    setItemQuantity(1); 
                    setItemCookTemp(selectedItem.item.mods?.find(m => COOK_TEMPS.includes(m)) || ''); 
                    setItemCourse(selectedItem.item.course || '');
                    setItemModLines([{ prefix: '', value: '' }]);
                    setItemAllergyLines(['']);
                    setItemNoteLines(['']);
                    setItemTiming('');
                    setShowItemActions(false); 
                    setShowModScreen(true); 
                  }}>Edit</button>
                  <button onClick={() => { setShowItemActions(false); setShowSplitItemModal(true); }}>Split</button>
                  {isTableView && selectedItem.seatNum && tableStates[activeTable]?.seats > 1 && (
                    <button onClick={() => { setShowItemActions(false); setShowMoveItemModal(true); }}>Move</button>
                  )}
                </>
              ) : (
                <>
                  <button onClick={() => { setShowItemActions(false); setShowVoidModal(true); }}>Void</button>
                  <button onClick={reorderItem}>Reorder</button>
                  <button onClick={() => { setShowItemActions(false); setShowSplitItemModal(true); }}>Split</button>
                  {isTableView && selectedItem.seatNum && tableStates[activeTable]?.seats > 1 && (
                    <button onClick={() => { setShowItemActions(false); setShowMoveItemModal(true); }}>Move</button>
                  )}
                </>
              )}
            </div>
            <button className="cancel-btn" onClick={() => setShowItemActions(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showVoidModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal void-modal">
            <button className="modal-close" onClick={() => setShowVoidModal(false)}>×</button>
            <h2>Void {selectedItem.item.name}</h2>
            <p>Select a reason:</p>
            <div className="void-reasons">
              {VOID_REASONS.map(reason => (<button key={reason} className={voidReason === reason ? 'active' : ''} onClick={() => setVoidReason(reason)}>{reason}</button>))}
            </div>
            {voidReason === 'Other' && <input type="text" placeholder="Specify reason..." className="void-other-input" />}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowVoidModal(false); setVoidReason(''); }}>Cancel</button>
              <button className="confirm-btn" onClick={voidItemWithReason} disabled={!voidReason}>Void Item</button>
            </div>
          </div>
        </div>
      )}

      {showSplitItemModal && selectedItem && (
        <div className="modal-overlay">
          <div className="modal split-item-modal">
            <button className="modal-close" onClick={() => { setShowSplitItemModal(false); setSplitWays(2); }}>×</button>
            <h2>Split {selectedItem.item.name}</h2>
            <p className="item-price-display">${selectedItem.item.price.toFixed(2)}</p>
            <div className="split-picker">
              <label>Split how many ways?</label>
              <div className="split-controls">
                <button onClick={() => setSplitWays(w => Math.max(2, w - 1))}>−</button>
                <span className="split-count">{splitWays}</span>
                <button onClick={() => setSplitWays(w => w + 1)}>+</button>
              </div>
              <div className="split-preview">
                Each: ${(selectedItem.item.price / splitWays).toFixed(2)}
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowSplitItemModal(false); setSplitWays(2); }}>Cancel</button>
              <button className="confirm-btn" onClick={splitItem}>Split Item</button>
            </div>
          </div>
        </div>
      )}

      {showMoveItemModal && selectedItem && activeTable && (
        <div className="modal-overlay">
          <div className="modal move-item-modal">
            <button className="modal-close" onClick={() => setShowMoveItemModal(false)}>×</button>
            <h2>Move {selectedItem.item.name}</h2>
            <p>Currently on Seat {selectedItem.seatNum}</p>
            <div className="seat-options">
              {Array.from({ length: tableStates[activeTable]?.seats || 0 }, (_, i) => i + 1)
                .filter(s => s !== selectedItem.seatNum)
                .map(seat => (
                  <button key={seat} onClick={() => moveItemToSeat(seat)}>Seat {seat}</button>
                ))
              }
            </div>
            <button className="cancel-btn" onClick={() => setShowMoveItemModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showPrintChequeModal && (
        <div className="modal-overlay">
          <div className="modal print-cheque-modal">
            <button className="modal-close" onClick={() => setShowPrintChequeModal(false)}>×</button>
            <h2>Print Cheque</h2>
            <div className="bill-total"><span>Total</span><span className="big-total">${getTotal().toFixed(2)}</span></div>
            <div className="bill-options">
              <button onClick={() => { alert('Full cheque printed'); setShowPrintChequeModal(false); }}>Print Full Cheque</button>
              {isTableView && Object.values(currentOrder).filter(items => items.length > 0).length > 1 && (
                <button onClick={() => { alert('Split by seat cheques printed'); setShowPrintChequeModal(false); }}>Split by Seat</button>
              )}
              <button onClick={() => { alert('Even split cheques printed'); setShowPrintChequeModal(false); }}>Split Evenly</button>
              <button onClick={() => setShowDiscountModal(true)}>Apply Discount</button>
              {isTabView && <button onClick={() => { const tableId = prompt('Enter table number to transfer to:'); if (tableId) { transferTabToTable(activeTab, parseInt(tableId)); setShowPrintChequeModal(false); } }}>Transfer to Table</button>}
            </div>
            <button className="cancel-btn" onClick={() => setShowPrintChequeModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <button className="modal-close" onClick={() => { setShowPaymentModal(false); setSelectedPaySeat(null); setSelectedPaymentMethod(null); setPayFullBill(false); }}>×</button>
            <h2>Payment</h2>
            
            {/* Show payment status banner if partial payments exist */}
            {activeTable && tablePayments[activeTable]?.payments?.length > 0 && !selectedPaymentMethod && (
              <div className="payment-status-banner">
                <div className="payment-status-info">
                  <span className="paid-amount">${getTablePaidAmount(activeTable).toFixed(2)} paid</span>
                  <span className="remaining-amount">${getTableRemainingBalance(activeTable).toFixed(2)} remaining</span>
                </div>
                <button className="void-last-btn" onClick={voidLastPayment}>Void Last Payment</button>
              </div>
            )}
            
            {/* For tables: Show seat selection OR pay full bill option */}
            {isTableView && !selectedPaySeat && !selectedPaymentMethod && !payFullBill && (
              <div className="seat-payment-section">
                <div className="payment-type-choice">
                  <button className="pay-full-btn" onClick={() => openPaymentModal(true)}>Pay Full Bill (${getTotal().toFixed(2)})</button>
                  <div className="divider-text">or pay by seat</div>
                </div>
                <div className="seat-payment-grid">
                  {Object.entries(tableStates[activeTable]?.orders || {})
                    .filter(([, items]) => items.length > 0)
                    .map(([seatNum, items]) => {
                      const seatTotal = getSeatTotal(parseInt(seatNum));
                      const seatPaid = getTableSeatPaidAmount(activeTable, parseInt(seatNum));
                      const seatRemaining = seatTotal - seatPaid;
                      const isPaid = getTablePaidSeats(activeTable).includes(parseInt(seatNum));
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
                {getTablePaidSeats(activeTable).length > 0 && (
                  <div className="paid-summary">
                    {getTablePaidSeats(activeTable).length} of {Object.entries(tableStates[activeTable]?.orders || {}).filter(([, items]) => items.length > 0).length} seats paid
                  </div>
                )}
              </div>
            )}

            {/* For tabs, full bill payment, or after seat selected: Show payment summary */}
            {(isTabView || selectedPaySeat !== null || payFullBill) && !selectedPaymentMethod && (
              <>
                <div className="payment-summary">
                  {selectedPaySeat !== null && !payFullBill && (
                    <div className="paying-for">Paying for Seat {selectedPaySeat}</div>
                  )}
                  {payFullBill && (
                    <div className="paying-for">Paying Full Bill</div>
                  )}
                  <div className="summary-row total">
                    <span>{selectedPaySeat !== null && !payFullBill ? 'Seat Total' : 'Bill Total'}</span>
                    <span>${selectedPaySeat !== null && !payFullBill ? getSeatTotal(selectedPaySeat).toFixed(2) : getTotal().toFixed(2)}</span>
                  </div>
                  {selectedPaySeat !== null && !payFullBill && getTableSeatPaidAmount(activeTable, selectedPaySeat) > 0 && (
                    <>
                      <div className="summary-row paid">
                        <span>Already Paid</span>
                        <span>${getTableSeatPaidAmount(activeTable, selectedPaySeat).toFixed(2)}</span>
                      </div>
                      <div className="summary-row remaining">
                        <span>Remaining</span>
                        <span>${(getSeatTotal(selectedPaySeat) - getTableSeatPaidAmount(activeTable, selectedPaySeat)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {payFullBill && getTablePaidAmount(activeTable) > 0 && (
                    <>
                      <div className="summary-row paid">
                        <span>Already Paid</span>
                        <span>${getTablePaidAmount(activeTable).toFixed(2)}</span>
                      </div>
                      <div className="summary-row remaining">
                        <span>Remaining</span>
                        <span>${getTableRemainingBalance(activeTable).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="payment-methods">
                  <h3>Select Payment Method</h3>
                  <div className="method-buttons">
                    <button onClick={() => selectPaymentMethod('cash')}>Cash</button>
                    {CARD_TYPES.map(type => (<button key={type} onClick={() => selectPaymentMethod(type)}>{type}</button>))}
                    <button onClick={() => selectPaymentMethod('gift')}>Gift Card</button>
                  </div>
                </div>
                
                {(selectedPaySeat !== null || payFullBill) && isTableView && (
                  <button className="back-btn" onClick={() => { setSelectedPaySeat(null); setPayFullBill(false); }}>← Back to Options</button>
                )}
              </>
            )}

            {/* After payment method selected: Show amount input */}
            {selectedPaymentMethod && (
              <div className="payment-amount-section">
                <h3>{selectedPaymentMethod === 'cash' ? 'Cash' : selectedPaymentMethod} Payment</h3>
                {selectedPaySeat !== null && !payFullBill && (
                  <div className="paying-for">Seat {selectedPaySeat}</div>
                )}
                {payFullBill && (
                  <div className="paying-for">Full Bill</div>
                )}
                <label>Amount</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  autoFocus
                />
                <div className="payment-actions">
                  <button className="back-btn" onClick={() => setSelectedPaymentMethod(null)}>← Back</button>
                  <button className="confirm-btn" onClick={processPayment}>Pay</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="modal-overlay">
          <div className="modal discount-modal">
            <button className="modal-close" onClick={() => setShowDiscountModal(false)}>×</button>
            <h2>Apply Discount</h2>
            <div className="discount-presets">
              {DISCOUNT_PRESETS.map(preset => (<button key={preset.label} onClick={() => setAppliedDiscount(preset)} className={appliedDiscount?.label === preset.label ? 'active' : ''}>{preset.label}</button>))}
            </div>
            <div className="custom-discount"><input type="number" placeholder="Custom $" /><input type="number" placeholder="Custom %" /></div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDiscountModal(false)}>Cancel</button>
              <button className="confirm-btn" onClick={() => setShowDiscountModal(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {showServerScreen && (
        <div className="modal-overlay">
          <div className="modal server-screen-modal wide">
            <button className="modal-close" onClick={() => setShowServerScreen(false)}>×</button>
            <h2>{SERVERS.find(s => s.id === currentServer)?.name}'s Shift</h2>
            
            <div className="server-screen-layout">
              <div className="shift-stats">
                <h3>Shift Summary</h3>
                <div className="stat-grid">
                  <div className="stat-card">
                    <span className="stat-label">Bills Closed</span>
                    <span className="stat-value">{getServerShiftStats().billCount}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total Sales</span>
                    <span className="stat-value">${getServerShiftStats().totalSales.toFixed(2)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total Tips</span>
                    <span className="stat-value">${getServerShiftStats().totalTips.toFixed(2)}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Total Collected</span>
                    <span className="stat-value">${getServerShiftStats().totalPaid.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="closed-bills-section">
                <h3>Closed Bills</h3>
                {getServerClosedBills().length === 0 ? (
                  <p className="no-bills">No closed bills yet</p>
                ) : (
                  <div className="closed-bills-list">
                    {getServerClosedBills().map(bill => (
                      <div key={bill.id} className="closed-bill-card">
                        <div className="bill-header">
                          <span className="bill-name">{bill.type === 'table' ? `Table ${bill.tableId}` : bill.tabName}</span>
                          <span className="bill-time">{new Date(bill.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="bill-details">
                          <div className="bill-row"><span>Subtotal</span><span>${bill.subtotal.toFixed(2)}</span></div>
                          <div className="bill-row"><span>Tax</span><span>${bill.tax.toFixed(2)}</span></div>
                          <div className="bill-row total"><span>Total</span><span>${bill.total.toFixed(2)}</span></div>
                          <div className="bill-row paid"><span>Paid ({bill.payments[0]?.method})</span><span>${bill.amountPaid.toFixed(2)}</span></div>
                          {bill.tip > 0 && <div className="bill-row tip"><span>Tip</span><span>${bill.tip.toFixed(2)}</span></div>}
                        </div>
                        <div className="bill-actions">
                          <button onClick={() => reopenBill(bill)}>Reopen Bill</button>
                          <button onClick={() => { setSelectedClosedBill(bill); setShowEditPaymentModal(true); }}>Edit Payment</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditPaymentModal && selectedClosedBill && (
        <div className="modal-overlay">
          <div className="modal edit-payment-modal">
            <button className="modal-close" onClick={() => { setShowEditPaymentModal(false); setSelectedClosedBill(null); }}>×</button>
            <h2>Edit Payment</h2>
            <p>{selectedClosedBill.type === 'table' ? `Table ${selectedClosedBill.tableId}` : selectedClosedBill.tabName}</p>
            <div className="edit-payment-form">
              <label>Payment Method</label>
              <div className="method-buttons">
                <button onClick={() => setSelectedClosedBill(prev => ({ ...prev, payments: [{ ...prev.payments[0], method: 'cash' }] }))} className={selectedClosedBill.payments[0]?.method === 'cash' ? 'active' : ''}>Cash</button>
                {CARD_TYPES.map(type => (
                  <button key={type} onClick={() => setSelectedClosedBill(prev => ({ ...prev, payments: [{ ...prev.payments[0], method: type }] }))} className={selectedClosedBill.payments[0]?.method === type ? 'active' : ''}>{type}</button>
                ))}
                <button onClick={() => setSelectedClosedBill(prev => ({ ...prev, payments: [{ ...prev.payments[0], method: 'gift' }] }))} className={selectedClosedBill.payments[0]?.method === 'gift' ? 'active' : ''}>Gift Card</button>
              </div>
              <label>Amount Paid</label>
              <input 
                type="number" 
                value={selectedClosedBill.amountPaid} 
                onChange={e => setSelectedClosedBill(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
              />
              <div className="bill-total-reminder">Bill Total: ${selectedClosedBill.total.toFixed(2)}</div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => { setShowEditPaymentModal(false); setSelectedClosedBill(null); }}>Cancel</button>
              <button className="confirm-btn" onClick={() => updatePayment(selectedClosedBill.id, selectedClosedBill.payments[0]?.method, selectedClosedBill.amountPaid)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showReopenTablePicker && selectedClosedBill && (
        <div className="modal-overlay">
          <div className="modal reopen-table-modal">
            <button className="modal-close" onClick={() => { setShowReopenTablePicker(false); setSelectedClosedBill(null); }}>×</button>
            <h2>Table {selectedClosedBill.tableId} is Occupied</h2>
            <p>Select an available table:</p>
            <div className="available-tables-grid">
              {getAvailableTables().map(tableId => (
                <button key={tableId} onClick={() => reopenBillToTable(selectedClosedBill, tableId)}>Table {tableId}</button>
              ))}
            </div>
            {getAvailableTables().length === 0 && <p className="no-tables">No tables available</p>}
            <button className="cancel-btn" onClick={() => { setShowReopenTablePicker(false); setSelectedClosedBill(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {showOpenItemModal && (
        <div className="modal-overlay">
          <div className="modal open-item-modal">
            <button className="modal-close" onClick={() => setShowOpenItemModal(false)}>×</button>
            <h2>Open Item</h2>
            {!openItemType ? (
              <div className="open-item-type-select">
                <button onClick={() => setOpenItemType('food')}>Open Food</button>
                <button onClick={() => setOpenItemType('beverage')}>Open Beverage</button>
              </div>
            ) : (
              <div className="open-item-form">
                <p className="open-item-type-label">{openItemType === 'food' ? 'Open Food' : 'Open Beverage'}</p>
                <label>Item Name</label>
                <input type="text" value={openItemName} onChange={e => setOpenItemName(e.target.value)} placeholder="Enter item name..." autoFocus />
                <label>Price</label>
                <input type="number" value={openItemPrice} onChange={e => setOpenItemPrice(e.target.value)} placeholder="0.00" step="0.01" />
                <div className="modal-actions">
                  <button className="back-btn" onClick={() => setOpenItemType(null)}>← Back</button>
                  <button className="confirm-btn" onClick={addOpenItem} disabled={!openItemName.trim() || !openItemPrice}>Add Item</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTransferModal && activeTable && (
        <div className="modal-overlay">
          <div className="modal transfer-modal">
            <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            <h2>Transfer Table {activeTable}</h2>
            <p>Move entire table to a different table:</p>
            <div className="available-tables-grid">
              {TABLES.filter(t => !tableStates[t.id] && t.id !== activeTable).map(table => (
                <button key={table.id} onClick={() => { transferFullTable(activeTable, table.id); setShowTransferModal(false); }}>
                  Table {table.id}
                </button>
              ))}
            </div>
            {TABLES.filter(t => !tableStates[t.id] && t.id !== activeTable).length === 0 && (
              <p className="no-tables">No available tables</p>
            )}
            <button className="cancel-btn" onClick={() => setShowTransferModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
