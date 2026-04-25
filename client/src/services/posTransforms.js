// Transform backend API responses into the local state shapes used by POSContext.

/**
 * Convert a backend OrderItem into the local item shape.
 */
export function backendItemToLocal(bi) {
  return {
    id: bi.id,
    menuItemId: bi.menuItemId || null,
    name: bi.name,
    price: bi.price,
    basePrice: bi.price, // backend doesn't track basePrice separately yet
    quantity: bi.quantity || 1,
    course: bi.course || '',
    status: bi.status || 'new',
    mods: Array.isArray(bi.mods) ? bi.mods : [],
    selectedAddOns: Array.isArray(bi.addOns) ? bi.addOns : [],
    cookTemp: bi.cookTemp || null,
    allergies: Array.isArray(bi.allergies) ? bi.allergies : [],
    notes: Array.isArray(bi.notes) ? bi.notes : [],
    timing: bi.timing || null,
    isComped: bi.isComped || false,
    compReason: bi.compReason || null,
    addedAt: bi.createdAt ? new Date(bi.createdAt).getTime() : Date.now(),
    sentAt: bi.sentAt ? new Date(bi.sentAt).getTime() : null,
    firedAt: bi.firedAt ? new Date(bi.firedAt).getTime() : null,
    splitFrom: bi.splitFrom || null,
    seatNumber: bi.seatNumber,
  };
}

/**
 * Transform GET /api/tables response into local state shape.
 * Returns { tableStates, tablePayments, sessionMap, itemIdMap }
 */
export function transformSessionsToState(sessions) {
  const tableStates = {};
  const tablePayments = {};
  const sessionMap = {};
  const itemIdMap = {};

  for (const session of sessions) {
    const tableNum = session.table.number;
    sessionMap[tableNum] = session.id;

    // Group order items by seat number
    const orders = {};
    for (let i = 1; i <= session.seatCount; i++) {
      orders[i] = [];
    }

    const items = session.orderItems || [];
    for (const bi of items) {
      const localItem = backendItemToLocal(bi);
      const seat = bi.seatNumber || 1;
      if (!orders[seat]) orders[seat] = [];
      orders[seat].push(localItem);
      itemIdMap[bi.id] = bi.id; // identity map — IDs match since loaded from backend
    }

    tableStates[tableNum] = {
      server: session.staff?.id || session.staffId,
      seats: session.seatCount,
      orders,
      voidedItems: [],
      openedAt: new Date(session.openedAt).getTime(),
    };

    // Transform payments
    const payments = session.payments || [];
    if (payments.length > 0) {
      const paidSeats = [];
      const seatPayments = {};
      const paymentList = payments
        .filter(p => p.status === 'completed')
        .map(p => ({
          id: p.id,
          method: p.method,
          amount: p.amount,
          seat: p.seatNumber || null,
          tip: p.tipAmount || 0,
        }));

      for (const p of paymentList) {
        if (p.seat) {
          seatPayments[p.seat] = (seatPayments[p.seat] || 0) + p.amount;
        }
      }

      tablePayments[tableNum] = { payments: paymentList, paidSeats, seatPayments };
    }
  }

  return { tableStates, tablePayments, sessionMap, itemIdMap };
}

/**
 * Transform GET /api/tabs response into local state shape.
 * Returns { tabStates, tabSessionMap, itemIdMap }
 */
export function transformTabsToState(tabs) {
  const tabStates = {};
  const tabSessionMap = {};
  const itemIdMap = {};

  for (const tab of tabs) {
    // Use backend CUID as the tab key directly
    const tabId = tab.id;
    tabSessionMap[tabId] = tab.id;

    const items = (tab.orderItems || []).map(bi => {
      itemIdMap[bi.id] = bi.id;
      return backendItemToLocal(bi);
    });

    tabStates[tabId] = {
      name: tab.name,
      server: tab.staff?.id || tab.staffId,
      items,
      voidedItems: [],
      openedAt: new Date(tab.openedAt).getTime(),
    };
  }

  return { tabStates, tabSessionMap, itemIdMap };
}

/**
 * Transform backend venue config into local adminConfig shape.
 */
export function transformAdminConfig(venue) {
  return {
    pin: venue.adminPin || '1234',
    mode: venue.mode || 'restaurant',
    taxRate: venue.taxRate ?? 0.13,
    tipPresets: venue.tipPresets || [15, 18, 20, 25],
    discountPresets: (venue.discountPresets || []).map(d => ({
      id: d.id,
      label: d.label,
      type: d.type,
      value: d.value,
    })),
    voidReasons: (venue.voidReasons || []).map(r => r.label),
    servers: (venue.staff || []).map(s => ({
      id: s.id,
      name: s.name,
      pin: s.pin || '',
      color: s.color,
      role: s.role,
    })),
  };
}

/**
 * Transform backend service configs into local shape.
 */
export function transformServiceConfig(configs) {
  const result = {};
  for (const c of configs || []) {
    result[c.period] = { start: c.start, end: c.end };
  }
  return result;
}
