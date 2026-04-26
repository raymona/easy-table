import { getServerInfo } from '../context';
import { getSubtotal, getTax, getSeatTotal, applyDiscount } from './calculations';

const STATUS = { NEW: 'new', SENT: 'sent', FIRED: 'fired' };

/**
 * Determine which items are about to fire, based on pre-dispatch state.
 * - sendOrder: new items with course '' / 'Drinks' / 'Apps' auto-fire
 * - fireCourse: sent items matching the given course
 *
 * @param {Object} tableStates
 * @param {Object} tabStates
 * @param {number|null} tableId
 * @param {string|null} tabId
 * @param {string|null} course — null for sendOrder, course name for fireCourse
 * @returns {Array<{name, quantity, course, seatNum, cookTemp, mods, addOns, allergies, notes}>}
 */
export function getItemsToFire(tableStates, tabStates, tableId, tabId, course = null) {
  const items = [];

  if (course) {
    // fireCourse: collect sent items matching course
    if (tableId != null && tableStates[tableId]) {
      const orders = tableStates[tableId].orders || {};
      for (const [seatNum, seatItems] of Object.entries(orders)) {
        for (const item of seatItems) {
          if (item.status === STATUS.SENT && item.course === course) {
            items.push({ ...item, seatNum: parseInt(seatNum) });
          }
        }
      }
    }
  } else {
    // sendOrder: collect new items that will auto-fire (Drinks/Apps/no-course)
    if (tableId != null && tableStates[tableId]) {
      const orders = tableStates[tableId].orders || {};
      for (const [seatNum, seatItems] of Object.entries(orders)) {
        for (const item of seatItems) {
          if (item.status !== STATUS.NEW) continue;
          const c = item.course || '';
          const autoFire = !c || c === 'Drinks' || c === 'Apps';
          if (autoFire) {
            items.push({ ...item, seatNum: parseInt(seatNum) });
          }
        }
      }
    } else if (tabId != null && tabStates[tabId]) {
      // Tabs fire all new items immediately
      for (const item of tabStates[tabId].items || []) {
        if (item.status === STATUS.NEW) {
          items.push({ ...item, seatNum: null });
        }
      }
    }
  }

  return items;
}

/**
 * Build the data object for generateKitchenTicketPDF.
 */
export function buildKitchenTicketData({ tableId, tabId, tableStates, tabStates, adminConfig, course = null }) {
  const items = getItemsToFire(tableStates, tabStates, tableId, tabId, course);

  // Resolve server name
  const serverId = tableId != null
    ? tableStates[tableId]?.server
    : tabStates[tabId]?.server;
  const serverInfo = getServerInfo(serverId, adminConfig?.servers);
  const serverName = serverInfo?.name || 'Unknown';

  // Tab name
  const tabName = tabId != null ? (tabStates[tabId]?.name || 'Tab') : null;

  return {
    tableId,
    tabName,
    serverName,
    timestamp: Date.now(),
    courseFired: course || null,
    items,
  };
}

/**
 * Build the data object for generateGuestChequePDF.
 *
 * @param {Object} params
 * @param {'full'|'bySeat'|'even'} params.splitMode
 * @param {number|null} params.splitCount — for even split
 */
export function buildGuestChequeData({ tableId, tabId, tableStates, tabStates, adminConfig, appliedDiscount, splitMode = 'full', splitCount = null }) {
  const taxRate = adminConfig?.taxRate || 0.13;

  // Resolve server name
  const serverId = tableId != null
    ? tableStates[tableId]?.server
    : tabStates[tabId]?.server;
  const serverInfo = getServerInfo(serverId, adminConfig?.servers);
  const serverName = serverInfo?.name || 'Unknown';

  // Tab name
  const tabName = tabId != null ? (tabStates[tabId]?.name || 'Tab') : null;

  let seats = null;
  let items = null;
  let currentOrder;

  if (tableId != null && tableStates[tableId]) {
    currentOrder = tableStates[tableId].orders || {};
    seats = {};
    for (const [seatNum, seatItems] of Object.entries(currentOrder)) {
      if (seatItems && seatItems.length > 0) {
        seats[seatNum] = seatItems;
      }
    }
  } else if (tabId != null && tabStates[tabId]) {
    currentOrder = tabStates[tabId].items || [];
    items = currentOrder;
  }

  const rawSubtotal = getSubtotal(currentOrder);
  const subtotal = appliedDiscount ? applyDiscount(rawSubtotal, appliedDiscount) : rawSubtotal;
  const tax = getTax(subtotal);
  const total = subtotal + tax;

  let discount = null;
  if (appliedDiscount) {
    discount = {
      label: appliedDiscount.label || `${appliedDiscount.value}${appliedDiscount.type === 'percent' ? '%' : '$'}`,
      amount: rawSubtotal - subtotal,
    };
  }

  // For even split, default to seat count
  if (splitMode === 'even' && !splitCount && seats) {
    splitCount = Object.keys(seats).length;
  }

  return {
    restaurantName: 'EASY TABLE',
    tableId,
    tabName,
    serverName,
    timestamp: Date.now(),
    seats,
    items,
    subtotal,
    discount,
    taxRate,
    tax,
    total,
    splitMode,
    splitCount,
  };
}
