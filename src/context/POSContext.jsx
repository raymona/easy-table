import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TABLES, SERVERS, getCurrentDaypart } from '../data/menu';
import { generateId } from '../utils/idGenerator';

// ─── localStorage persistence ───────────────────────────────────────────────

const STATE_KEY = 'easy-table-v2';
const STATE_VERSION = 3;

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const { version, data } = JSON.parse(raw);
    if (version !== STATE_VERSION) return null; // schema changed — start fresh
    return { ...data, currentServer: null };    // always force sign-in
  } catch { return null; }
}

// ─── Action Types ──────────────────────────────────────────────────────────

export const POS_ACTIONS = {
  // Server
  SET_SERVER: 'SET_SERVER',
  SIGN_OUT: 'SIGN_OUT',

  // Daypart
  SET_DAYPART: 'SET_DAYPART',

  // Tables
  OPEN_TABLE: 'OPEN_TABLE',
  CLOSE_TABLE_IF_EMPTY: 'CLOSE_TABLE_IF_EMPTY',
  ADJUST_SEATS: 'ADJUST_SEATS',

  // Items
  ADD_ITEM: 'ADD_ITEM',
  VOID_ITEM: 'VOID_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  SEND_ORDER: 'SEND_ORDER',
  FIRE_COURSE: 'FIRE_COURSE',
  MOVE_ITEM: 'MOVE_ITEM',
  SPLIT_ITEM: 'SPLIT_ITEM',
  DRAG_DROP_ITEM: 'DRAG_DROP_ITEM',

  // Bar Tabs
  OPEN_TAB: 'OPEN_TAB',

  // Payments
  PROCESS_TABLE_PAYMENT: 'PROCESS_TABLE_PAYMENT',
  VOID_LAST_PAYMENT: 'VOID_LAST_PAYMENT',
  CLOSE_TABLE_BILL: 'CLOSE_TABLE_BILL',
  CLOSE_TAB_BILL: 'CLOSE_TAB_BILL',

  // Closed bills
  REOPEN_BILL: 'REOPEN_BILL',
  REOPEN_BILL_TO_TABLE: 'REOPEN_BILL_TO_TABLE',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',

  // Transfers
  TRANSFER_TABLE: 'TRANSFER_TABLE',
  TRANSFER_TAB_TO_TABLE: 'TRANSFER_TAB_TO_TABLE',
  TRANSFER_ITEM: 'TRANSFER_ITEM',

  // Gift cards
  REDEEM_GIFT_CARD: 'REDEEM_GIFT_CARD',
  ADD_GIFT_CARD: 'ADD_GIFT_CARD',

  // Comps
  COMP_ITEM: 'COMP_ITEM',

  // Day management
  NEW_DAY: 'NEW_DAY',

  // Admin config
  UPDATE_SERVICE_CONFIG: 'UPDATE_SERVICE_CONFIG',
  UPDATE_ADMIN_CONFIG: 'UPDATE_ADMIN_CONFIG',
};

// ─── Initial State ─────────────────────────────────────────────────────────

const initialState = {
  currentServer: null,
  daypart: getCurrentDaypart(),
  tableStates: {},     // { [tableId]: { server, seats, orders: { [seatNum]: item[] }, voidedItems: [], openedAt } }
  tabStates: {},       // { [tabId]: { name, server, items: item[], voidedItems: [], openedAt } }
  tablePayments: {},   // { [tableId]: { payments: [], paidSeats: [], seatPayments: {} } }
  closedBills: [],     // closed bill records
  // Demo gift cards — replace with backend lookup in production
  giftCards: {
    'ET-001': 50.00,
    'ET-002': 100.00,
    'ET-003': 25.00,
    'ET-VIP': 500.00,
  },
  serviceConfig: {
    lunch:  { start: '11:00', end: '16:59' },
    dinner: { start: '17:00', end: '22:59' },
  },
  adminConfig: {
    pin: '1234',
    mode: 'restaurant',     // 'restaurant' | 'hotel' | 'bar' | 'bar-hotel'
    taxRate: 0.13,
    tipPresets: [15, 18, 20, 25],
    discountPresets: [
      { label: '10%', type: 'percent', value: 10 },
      { label: '20%', type: 'percent', value: 20 },
      { label: '50% Industry', type: 'percent', value: 50 },
      { label: '100% Comp', type: 'percent', value: 100 },
      { label: '$5 off', type: 'fixed', value: 5 },
      { label: '$10 off', type: 'fixed', value: 10 },
      { label: '$20 off', type: 'fixed', value: 20 },
    ],
    voidReasons: [
      'Guest changed mind', 'Kitchen error', 'Server error', "86'd", 'Other',
    ],
    servers: [
      { id: 1, name: 'Ray', color: '#3B82F6' },
      { id: 2, name: 'Nik', color: '#10B981' },
      { id: 3, name: 'Hannah', color: '#F59E0B' },
      { id: 4, name: 'Yaro', color: '#8B5CF6' },
      { id: 5, name: 'Ashley', color: '#EC4899' },
    ],
  },
};

// ─── Status constants ──────────────────────────────────────────────────────

const STATUS = { NEW: 'new', SENT: 'sent', FIRED: 'fired' };

// ─── Reducer ──────────────────────────────────────────────────────────────

function posReducer(state, action) {
  switch (action.type) {

    // ── Server ──────────────────────────────────────────────────────────
    case POS_ACTIONS.SET_SERVER:
      return { ...state, currentServer: action.serverId };

    case POS_ACTIONS.SIGN_OUT:
      return { ...state, currentServer: null };

    // ── Daypart ─────────────────────────────────────────────────────────
    case POS_ACTIONS.SET_DAYPART:
      return { ...state, daypart: action.daypart };

    // ── Tables ──────────────────────────────────────────────────────────
    case POS_ACTIONS.OPEN_TABLE: {
      const { tableId, server, seatCount } = action;
      return {
        ...state,
        tableStates: {
          ...state.tableStates,
          [tableId]: {
            server,
            seats: seatCount,
            orders: Object.fromEntries(
              Array.from({ length: seatCount }, (_, i) => [i + 1, []])
            ),
            voidedItems: [],
            openedAt: Date.now(),
          },
        },
      };
    }

    case POS_ACTIONS.CLOSE_TABLE_IF_EMPTY: {
      const { tableId } = action;
      const orders = state.tableStates[tableId]?.orders || {};
      const hasItems = Object.values(orders).some((items) => items.length > 0);
      if (hasItems) return state;
      const { [tableId]: _, ...rest } = state.tableStates;
      return { ...state, tableStates: rest };
    }

    case POS_ACTIONS.ADJUST_SEATS: {
      const { tableId, delta } = action;
      const current = state.tableStates[tableId];
      if (!current) return state;
      const newCount = Math.max(1, current.seats + delta);
      const orders = { ...current.orders };
      if (delta > 0) {
        for (let i = current.seats + 1; i <= newCount; i++) orders[i] = [];
      } else if (delta < 0 && newCount < current.seats) {
        const removed = orders[current.seats] || [];
        if (removed.length > 0) orders[1] = [...orders[1], ...removed];
        delete orders[current.seats];
      }
      return {
        ...state,
        tableStates: {
          ...state.tableStates,
          [tableId]: { ...current, seats: newCount, orders },
        },
      };
    }

    // ── Items ────────────────────────────────────────────────────────────
    case POS_ACTIONS.ADD_ITEM: {
      const { tableId, tabId, seatNum, item } = action;
      if (tableId) {
        const table = state.tableStates[tableId];
        return {
          ...state,
          tableStates: {
            ...state.tableStates,
            [tableId]: {
              ...table,
              orders: {
                ...table.orders,
                [seatNum]: [...(table.orders[seatNum] || []), item],
              },
            },
          },
        };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: { ...tab, items: [...tab.items, item] },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.VOID_ITEM: {
      const { tableId, tabId, seatNum, itemId, reason = '' } = action;
      if (tableId) {
        const table = state.tableStates[tableId];
        const foundItem = table.orders[seatNum]?.find((i) => i.id === itemId);
        const voidRecord = foundItem
          ? { ...foundItem, voidReason: reason, voidedAt: Date.now() }
          : null;
        const voidedItems = voidRecord
          ? [...(table.voidedItems || []), voidRecord]
          : (table.voidedItems || []);
        return {
          ...state,
          tableStates: {
            ...state.tableStates,
            [tableId]: {
              ...table,
              voidedItems,
              orders: {
                ...table.orders,
                [seatNum]: table.orders[seatNum].filter((i) => i.id !== itemId),
              },
            },
          },
        };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        const foundItem = tab.items?.find((i) => i.id === itemId);
        const voidRecord = foundItem
          ? { ...foundItem, voidReason: reason, voidedAt: Date.now() }
          : null;
        const voidedItems = voidRecord
          ? [...(tab.voidedItems || []), voidRecord]
          : (tab.voidedItems || []);
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: {
              ...tab,
              voidedItems,
              items: tab.items.filter((i) => i.id !== itemId),
            },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.UPDATE_ITEM: {
      const { tableId, tabId, seatNum, itemId, updatedItem, extraItems = [] } = action;
      if (tableId) {
        const table = state.tableStates[tableId];
        return {
          ...state,
          tableStates: {
            ...state.tableStates,
            [tableId]: {
              ...table,
              orders: {
                ...table.orders,
                [seatNum]: [
                  ...table.orders[seatNum].map((i) => (i.id === itemId ? updatedItem : i)),
                  ...extraItems,
                ],
              },
            },
          },
        };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: {
              ...tab,
              items: [
                ...tab.items.map((i) => (i.id === itemId ? updatedItem : i)),
                ...extraItems,
              ],
            },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.SEND_ORDER: {
      const { tableId, tabId } = action;
      const timestamp = Date.now();
      if (tableId) {
        const table = state.tableStates[tableId];
        const orders = {};
        Object.keys(table.orders).forEach((seat) => {
          orders[seat] = table.orders[seat].map((item) => {
            if (item.status !== STATUS.NEW) return item;
            const c = item.course || '';
            const autoFire = !c || c === 'Drinks' || c === 'Apps';
            return { ...item, status: autoFire ? STATUS.FIRED : STATUS.SENT, sentAt: timestamp };
          });
        });
        return {
          ...state,
          tableStates: { ...state.tableStates, [tableId]: { ...table, orders } },
        };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: {
              ...tab,
              items: tab.items.map((item) =>
                item.status === STATUS.NEW
                  ? { ...item, status: STATUS.FIRED, sentAt: timestamp }
                  : item
              ),
            },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.FIRE_COURSE: {
      const { tableId, course } = action;
      const table = state.tableStates[tableId];
      if (!table) return state;
      const orders = {};
      Object.keys(table.orders).forEach((seat) => {
        orders[seat] = table.orders[seat].map((item) =>
          item.status === STATUS.SENT && item.course === course
            ? { ...item, status: STATUS.FIRED, firedAt: Date.now() }
            : item
        );
      });
      return { ...state, tableStates: { ...state.tableStates, [tableId]: { ...table, orders } } };
    }

    case POS_ACTIONS.MOVE_ITEM: {
      const { tableId, itemId, fromSeat, toSeat } = action;
      const table = state.tableStates[tableId];
      if (!table || fromSeat === toSeat) return state;
      const item = table.orders[fromSeat]?.find((i) => i.id === itemId);
      if (!item) return state;
      const orders = { ...table.orders };
      orders[fromSeat] = orders[fromSeat].filter((i) => i.id !== itemId);
      orders[toSeat] = [...(orders[toSeat] || []), item];
      return { ...state, tableStates: { ...state.tableStates, [tableId]: { ...table, orders } } };
    }

    case POS_ACTIONS.SPLIT_ITEM: {
      const { tableId, tabId, seatNum, itemId, splitWays } = action;
      const source = tableId
        ? (state.tableStates[tableId]?.orders[seatNum] || [])
        : (state.tabStates[tabId]?.items || []);
      const original = source.find((i) => i.id === itemId);
      if (!original) return state;
      const splitPrice = Math.round((original.price / splitWays) * 100) / 100;
      const splitItems = Array.from({ length: splitWays }, () => ({
        ...original,
        id: generateId(),
        name: `1/${splitWays} ${original.name}`,
        price: splitPrice,
        originalPrice: original.price,
        splitFrom: original.id,
      }));
      if (tableId) {
        const table = state.tableStates[tableId];
        const orders = {
          ...table.orders,
          [seatNum]: [
            ...table.orders[seatNum].filter((i) => i.id !== itemId),
            ...splitItems,
          ],
        };
        return { ...state, tableStates: { ...state.tableStates, [tableId]: { ...table, orders } } };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: {
              ...tab,
              items: [...tab.items.filter((i) => i.id !== itemId), ...splitItems],
            },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.DRAG_DROP_ITEM: {
      const { tableId, itemId, fromSeat, toSeat } = action;
      if (!tableId || fromSeat === toSeat) return state;
      const table = state.tableStates[tableId];
      const item = table.orders[fromSeat]?.find((i) => i.id === itemId);
      if (!item) return state;
      const orders = { ...table.orders };
      orders[fromSeat] = orders[fromSeat].filter((i) => i.id !== itemId);
      orders[toSeat] = [...(orders[toSeat] || []), item];
      return { ...state, tableStates: { ...state.tableStates, [tableId]: { ...table, orders } } };
    }

    // ── Bar Tabs ─────────────────────────────────────────────────────────
    case POS_ACTIONS.OPEN_TAB: {
      const { tabId, name, server } = action;
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [tabId]: { name, server, items: [], voidedItems: [], openedAt: Date.now() },
        },
      };
    }

    // ── Payments ─────────────────────────────────────────────────────────
    case POS_ACTIONS.PROCESS_TABLE_PAYMENT: {
      const { tableId, payment, newSeatPayments, newPaidSeats } = action;
      const current = state.tablePayments[tableId] || { payments: [], paidSeats: [], seatPayments: {} };
      return {
        ...state,
        tablePayments: {
          ...state.tablePayments,
          [tableId]: {
            payments: [...current.payments, payment],
            paidSeats: newPaidSeats,
            seatPayments: newSeatPayments,
          },
        },
      };
    }

    case POS_ACTIONS.VOID_LAST_PAYMENT: {
      const { tableId } = action;
      const current = state.tablePayments[tableId];
      if (!current?.payments?.length) return state;
      const payments = current.payments.slice(0, -1);
      const lastPayment = current.payments[current.payments.length - 1];
      let newSeatPayments = { ...current.seatPayments };
      let newPaidSeats = [...current.paidSeats];
      if (lastPayment.seat !== null) {
        newSeatPayments[lastPayment.seat] = (newSeatPayments[lastPayment.seat] || 0) - lastPayment.amount;
        if (newSeatPayments[lastPayment.seat] <= 0) delete newSeatPayments[lastPayment.seat];
        newPaidSeats = newPaidSeats.filter((s) => s !== lastPayment.seat);
      }
      return {
        ...state,
        tablePayments: {
          ...state.tablePayments,
          [tableId]: { payments, paidSeats: newPaidSeats, seatPayments: newSeatPayments },
        },
      };
    }

    case POS_ACTIONS.CLOSE_TABLE_BILL: {
      const { tableId, closedBill } = action;
      const { [tableId]: _t, ...restTables } = state.tableStates;
      const { [tableId]: _p, ...restPayments } = state.tablePayments;
      return {
        ...state,
        tableStates: restTables,
        tablePayments: restPayments,
        closedBills: [closedBill, ...state.closedBills],
      };
    }

    case POS_ACTIONS.CLOSE_TAB_BILL: {
      const { tabId, closedBill } = action;
      const { [tabId]: _, ...restTabs } = state.tabStates;
      return {
        ...state,
        tabStates: restTabs,
        closedBills: [closedBill, ...state.closedBills],
      };
    }

    // ── Closed Bills ─────────────────────────────────────────────────────
    case POS_ACTIONS.REOPEN_BILL: {
      const { bill, newTableId, newTabId } = action;
      const bills = state.closedBills.filter((b) => b.id !== bill.id);
      if (bill.type === 'table' && newTableId) {
        return {
          ...state,
          closedBills: bills,
          tableStates: {
            ...state.tableStates,
            [newTableId]: {
              server: bill.server,
              seats: Object.keys(bill.orders).length,
              orders: bill.orders,
              voidedItems: bill.voidedItems || [],
              openedAt: bill.openedAt,
            },
          },
        };
      }
      if (bill.type === 'tab' && newTabId) {
        return {
          ...state,
          closedBills: bills,
          tabStates: {
            ...state.tabStates,
            [newTabId]: {
              name: bill.tabName,
              server: bill.server,
              items: bill.items,
              voidedItems: bill.voidedItems || [],
              openedAt: bill.openedAt,
            },
          },
        };
      }
      return state;
    }

    case POS_ACTIONS.UPDATE_PAYMENT: {
      const { billId, newMethod, newAmount } = action;
      return {
        ...state,
        closedBills: state.closedBills.map((bill) => {
          if (bill.id !== billId) return bill;
          const amount = parseFloat(newAmount) || bill.amountPaid;
          return {
            ...bill,
            payments: [{ method: newMethod, amount }],
            amountPaid: amount,
            tip: amount - bill.total > 0 ? amount - bill.total : 0,
          };
        }),
      };
    }

    // ── Transfers ────────────────────────────────────────────────────────
    case POS_ACTIONS.TRANSFER_TABLE: {
      const { fromTableId, toTableId } = action;
      const tableData = state.tableStates[fromTableId];
      if (!tableData || state.tableStates[toTableId]) return state; // dest must be empty
      const { [fromTableId]: _t, ...restTables } = state.tableStates;
      const payments = state.tablePayments[fromTableId];
      const newPayments = { ...state.tablePayments };
      delete newPayments[fromTableId];
      if (payments) newPayments[toTableId] = payments;
      return {
        ...state,
        tableStates: { ...restTables, [toTableId]: tableData },
        tablePayments: newPayments,
      };
    }

    case POS_ACTIONS.TRANSFER_TAB_TO_TABLE: {
      const { tabId, tableId, server } = action;
      const tab = state.tabStates[tabId];
      if (!tab) return state;
      const { [tabId]: _, ...restTabs } = state.tabStates;
      const existingTable = state.tableStates[tableId];
      const newTableState = existingTable
        ? {
            ...existingTable,
            orders: {
              ...existingTable.orders,
              1: [...existingTable.orders[1], ...tab.items],
            },
          }
        : {
            server,
            seats: 1,
            orders: { 1: tab.items },
            voidedItems: tab.voidedItems || [],
            openedAt: Date.now(),
          };
      return {
        ...state,
        tabStates: restTabs,
        tableStates: { ...state.tableStates, [tableId]: newTableState },
      };
    }

    case POS_ACTIONS.TRANSFER_ITEM: {
      const { fromTableId, fromSeat, toTableId, toSeat, item } = action;
      const fromTable = state.tableStates[fromTableId];
      const toTable = state.tableStates[toTableId];
      if (!fromTable || !toTable) return state;
      const fromOrders = {
        ...fromTable.orders,
        [fromSeat]: fromTable.orders[fromSeat].filter((i) => i.id !== item.id),
      };
      const destOrders = {
        ...toTable.orders,
        [toSeat]: [...(toTable.orders[toSeat] || []), item],
      };
      return {
        ...state,
        tableStates: {
          ...state.tableStates,
          [fromTableId]: { ...fromTable, orders: fromOrders },
          [toTableId]: { ...toTable, orders: destOrders },
        },
      };
    }

    // ── Gift Cards ────────────────────────────────────────────────────────
    case POS_ACTIONS.REDEEM_GIFT_CARD: {
      const { code, amount } = action;
      if (state.giftCards[code] === undefined) return state;
      return {
        ...state,
        giftCards: {
          ...state.giftCards,
          [code]: Math.max(0, state.giftCards[code] - amount),
        },
      };
    }

    case POS_ACTIONS.ADD_GIFT_CARD: {
      const { code, balance } = action;
      return {
        ...state,
        giftCards: { ...state.giftCards, [code]: balance },
      };
    }

    // ── Comps ─────────────────────────────────────────────────────────────
    case POS_ACTIONS.COMP_ITEM: {
      const { tableId, tabId, seatNum, itemId } = action;
      if (tableId) {
        const table = state.tableStates[tableId];
        return {
          ...state,
          tableStates: {
            ...state.tableStates,
            [tableId]: {
              ...table,
              orders: {
                ...table.orders,
                [seatNum]: table.orders[seatNum].map(i =>
                  i.id === itemId ? { ...i, price: 0, isComped: true } : i
                ),
              },
            },
          },
        };
      }
      if (tabId) {
        const tab = state.tabStates[tabId];
        return {
          ...state,
          tabStates: {
            ...state.tabStates,
            [tabId]: {
              ...tab,
              items: tab.items.map(i =>
                i.id === itemId ? { ...i, price: 0, isComped: true } : i
              ),
            },
          },
        };
      }
      return state;
    }

    // ── Day Management ────────────────────────────────────────────────────
    case POS_ACTIONS.NEW_DAY: {
      try { localStorage.removeItem(STATE_KEY); } catch {}
      return { ...initialState, currentServer: state.currentServer };
    }

    // ── Admin Config ──────────────────────────────────────────────────────
    case POS_ACTIONS.UPDATE_SERVICE_CONFIG: {
      return { ...state, serviceConfig: action.serviceConfig };
    }

    case POS_ACTIONS.UPDATE_ADMIN_CONFIG: {
      return { ...state, adminConfig: { ...state.adminConfig, ...action.updates } };
    }

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────

const POSContext = createContext(null);

export function POSProvider({ children }) {
  const [state, dispatch] = useReducer(
    posReducer,
    null,
    () => {
      const stored = loadStoredState();
      // Merge stored state on top of initialState so any new top-level keys added
      // to initialState (e.g. adminConfig) are always present as defaults.
      return stored ? { ...initialState, ...stored, currentServer: null } : initialState;
    }
  );

  // Debounced localStorage save on every state change
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify({ version: STATE_VERSION, data: state }));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <POSContext.Provider value={{ state, dispatch }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used inside <POSProvider>');
  return ctx;
}

// Helper: get server info by id
// servers defaults to the static SERVERS list for backwards compatibility;
// pass adminConfig.servers when available so runtime edits are reflected.
export const getServerInfo = (serverId, servers = SERVERS) =>
  servers.find((s) => s.id === serverId);
