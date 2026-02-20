import React, { createContext, useContext, useState } from 'react';

// ─── Context ───────────────────────────────────────────────────────────────

function getInitialView() {
  try {
    const raw = localStorage.getItem('easy-table-v2');
    if (!raw) return 'floor';
    const { data } = JSON.parse(raw);
    const mode = data?.adminConfig?.mode || 'restaurant';
    return (mode === 'bar' || mode === 'bar-hotel') ? 'tabs' : 'floor';
  } catch { return 'floor'; }
}

const UIContext = createContext(null);

export function UIProvider({ children }) {
  // Navigation
  const [view, setView] = useState(getInitialView);  // 'floor' | 'tabs'
  const [floorSection, setFloorSection] = useState('dining');
  const [activeTable, setActiveTable] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [activeSeat, setActiveSeat] = useState(1);

  // Menu selection
  const [activeCategory, setActiveCategory] = useState('drinks');
  const [activeCourse, setActiveCourse] = useState('');

  // Mod screen state
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

  // Item actions
  const [selectedItem, setSelectedItem] = useState(null);  // { item, seatNum }
  const [showItemActions, setShowItemActions] = useState(false);

  // Void
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  // Seat picker (opening a table)
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [pendingTableId, setPendingTableId] = useState(null);
  const [seatCount, setSeatCount] = useState(2);

  // New tab
  const [showNewTabModal, setShowNewTabModal] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  // Print cheque
  const [showPrintChequeModal, setShowPrintChequeModal] = useState(false);
  const [printConfirmMsg, setPrintConfirmMsg] = useState('');

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedPaySeat, setSelectedPaySeat] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payFullBill, setPayFullBill] = useState(false);

  // Discount
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Split item
  const [showSplitItemModal, setShowSplitItemModal] = useState(false);
  const [splitWays, setSplitWays] = useState(2);

  // Move item
  const [showMoveItemModal, setShowMoveItemModal] = useState(false);

  // Drag & drop
  const [draggedItem, setDraggedItem] = useState(null);

  // Server screen
  const [showServerScreen, setShowServerScreen] = useState(false);

  // Edit payment (closed bill)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedClosedBill, setSelectedClosedBill] = useState(null);

  // Open item
  const [showOpenItemModal, setShowOpenItemModal] = useState(false);
  const [openItemType, setOpenItemType] = useState(null);
  const [openItemName, setOpenItemName] = useState('');
  const [openItemPrice, setOpenItemPrice] = useState('');

  // Reopen table picker
  const [showReopenTablePicker, setShowReopenTablePicker] = useState(false);

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Admin
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const value = {
    // Navigation
    view, setView,
    floorSection, setFloorSection,
    activeTable, setActiveTable,
    activeTab, setActiveTab,
    activeSeat, setActiveSeat,
    // Menu
    activeCategory, setActiveCategory,
    activeCourse, setActiveCourse,
    // Mod screen
    showModScreen, setShowModScreen,
    pendingItem, setPendingItem,
    editingItem, setEditingItem,
    itemQuantity, setItemQuantity,
    itemCookTemp, setItemCookTemp,
    itemCourse, setItemCourse,
    itemAddOns, setItemAddOns,
    itemModLines, setItemModLines,
    itemAllergyLines, setItemAllergyLines,
    itemNoteLines, setItemNoteLines,
    itemTiming, setItemTiming,
    // Item actions
    selectedItem, setSelectedItem,
    showItemActions, setShowItemActions,
    // Void
    showVoidModal, setShowVoidModal,
    voidReason, setVoidReason,
    // Seat picker
    showSeatPicker, setShowSeatPicker,
    pendingTableId, setPendingTableId,
    seatCount, setSeatCount,
    // New tab
    showNewTabModal, setShowNewTabModal,
    newTabName, setNewTabName,
    // Print cheque
    showPrintChequeModal, setShowPrintChequeModal,
    printConfirmMsg, setPrintConfirmMsg,
    // Payment
    showPaymentModal, setShowPaymentModal,
    selectedPaymentMethod, setSelectedPaymentMethod,
    selectedPaySeat, setSelectedPaySeat,
    paymentAmount, setPaymentAmount,
    payFullBill, setPayFullBill,
    // Discount
    showDiscountModal, setShowDiscountModal,
    appliedDiscount, setAppliedDiscount,
    // Split item
    showSplitItemModal, setShowSplitItemModal,
    splitWays, setSplitWays,
    // Move item
    showMoveItemModal, setShowMoveItemModal,
    // Drag & drop
    draggedItem, setDraggedItem,
    // Server screen
    showServerScreen, setShowServerScreen,
    // Edit payment
    showEditPaymentModal, setShowEditPaymentModal,
    selectedClosedBill, setSelectedClosedBill,
    // Open item
    showOpenItemModal, setShowOpenItemModal,
    openItemType, setOpenItemType,
    openItemName, setOpenItemName,
    openItemPrice, setOpenItemPrice,
    // Reopen table
    showReopenTablePicker, setShowReopenTablePicker,
    // Transfer
    showTransferModal, setShowTransferModal,
    // Admin
    adminUnlocked, setAdminUnlocked,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
