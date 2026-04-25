import { useCallback } from 'react';
import { usePOS, POS_ACTIONS } from '../context';
import { useAuth } from '../context/AuthContext';
import { generateId } from '../utils/idGenerator';
import * as posApi from '../services/posApi';

/**
 * Central integration hook. Provides named action functions that:
 * - When backend enabled: call API first, then dispatch with backend IDs
 * - When backend disabled: dispatch directly (localStorage mode)
 *
 * Components use this instead of raw dispatch for any action that should sync.
 */
export function usePOSActions() {
  const { state, dispatch } = usePOS();
  const { backendEnabled } = useAuth();

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getSessionId = useCallback((tableId) => {
    return state.sessionMap[tableId] || null;
  }, [state.sessionMap]);

  const getTabSessionId = useCallback((tabId) => {
    return state.tabSessionMap[tabId] || tabId; // in backend mode, tabId IS the session ID
  }, [state.tabSessionMap]);

  const getBackendItemId = useCallback((localId) => {
    return state.itemIdMap[localId] || localId;
  }, [state.itemIdMap]);

  // ── Server (local only) ──────────────────────────────────────────────────

  const setServer = useCallback((serverId) => {
    dispatch({ type: POS_ACTIONS.SET_SERVER, serverId });
  }, [dispatch]);

  const signOut = useCallback(() => {
    dispatch({ type: POS_ACTIONS.SIGN_OUT });
  }, [dispatch]);

  const setDaypart = useCallback((daypart) => {
    dispatch({ type: POS_ACTIONS.SET_DAYPART, daypart });
  }, [dispatch]);

  // ── Tables ───────────────────────────────────────────────────────────────

  const openTable = useCallback(async (tableId, server, seatCount) => {
    if (backendEnabled) {
      const { session } = await posApi.apiOpenTable(tableId, seatCount);
      dispatch({ type: POS_ACTIONS.OPEN_TABLE, tableId, server, seatCount });
      dispatch({ type: POS_ACTIONS.SET_SESSION_ID, tableNumber: tableId, sessionId: session.id });
    } else {
      dispatch({ type: POS_ACTIONS.OPEN_TABLE, tableId, server, seatCount });
    }
  }, [backendEnabled, dispatch]);

  const closeTableIfEmpty = useCallback(async (tableId) => {
    if (backendEnabled) {
      const sessionId = getSessionId(tableId);
      if (sessionId) {
        try { await posApi.apiCloseEmptyTable(sessionId); } catch { /* may not be empty */ }
      }
    }
    dispatch({ type: POS_ACTIONS.CLOSE_TABLE_IF_EMPTY, tableId });
  }, [backendEnabled, dispatch, getSessionId]);

  const adjustSeats = useCallback(async (tableId, delta) => {
    dispatch({ type: POS_ACTIONS.ADJUST_SEATS, tableId, delta });
    if (backendEnabled) {
      const sessionId = getSessionId(tableId);
      const table = state.tableStates[tableId];
      if (sessionId && table) {
        const newCount = Math.max(1, table.seats + delta);
        try { await posApi.apiAdjustSeats(sessionId, newCount); } catch (e) { console.error('adjustSeats sync failed:', e); }
      }
    }
  }, [backendEnabled, dispatch, getSessionId, state.tableStates]);

  // ── Items ────────────────────────────────────────────────────────────────

  const addItem = useCallback(async (tableId, tabId, seatNum, item) => {
    if (backendEnabled) {
      const sessionId = tableId ? getSessionId(tableId) : null;
      const tabSessionId = tabId ? getTabSessionId(tabId) : null;
      const { item: backendItem } = await posApi.apiAddItem(sessionId, tabSessionId, seatNum, {
        menuItemId: item.menuItemId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        course: item.course || '',
        mods: item.mods || [],
        addOns: item.selectedAddOns || [],
        cookTemp: item.cookTemp || null,
        allergies: item.allergies || [],
        notes: item.notes || [],
        timing: item.timing || null,
      });
      // Use backend ID for the item
      const localItem = { ...item, id: backendItem.id };
      dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId, tabId, seatNum, item: localItem });
      dispatch({ type: POS_ACTIONS.MAP_ITEM_ID, localId: backendItem.id, backendId: backendItem.id });
    } else {
      dispatch({ type: POS_ACTIONS.ADD_ITEM, tableId, tabId, seatNum, item });
    }
  }, [backendEnabled, dispatch, getSessionId, getTabSessionId]);

  const updateItem = useCallback(async (tableId, tabId, seatNum, itemId, updatedItem, extraItems = []) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      await posApi.apiUpdateItem(backendId, {
        name: updatedItem.name,
        price: updatedItem.price,
        mods: updatedItem.mods || [],
        addOns: updatedItem.selectedAddOns || [],
        cookTemp: updatedItem.cookTemp || null,
        allergies: updatedItem.allergies || [],
        notes: updatedItem.notes || [],
        course: updatedItem.course || '',
      });
      // Add extra items (quantity > 1) to backend too
      for (const extra of extraItems) {
        const sessionId = tableId ? getSessionId(tableId) : null;
        const tabSessionId = tabId ? getTabSessionId(tabId) : null;
        const { item: backendExtra } = await posApi.apiAddItem(sessionId, tabSessionId, seatNum, {
          menuItemId: extra.menuItemId || null,
          name: extra.name,
          price: extra.price,
          course: extra.course || '',
          mods: extra.mods || [],
          addOns: extra.selectedAddOns || [],
          cookTemp: extra.cookTemp || null,
        });
        extra.id = backendExtra.id;
      }
    }
    dispatch({ type: POS_ACTIONS.UPDATE_ITEM, tableId, tabId, seatNum, itemId, updatedItem, extraItems });
  }, [backendEnabled, dispatch, getBackendItemId, getSessionId, getTabSessionId]);

  const voidItem = useCallback(async (tableId, tabId, seatNum, itemId, reason = '') => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      await posApi.apiVoidItem(backendId, reason);
    }
    dispatch({ type: POS_ACTIONS.VOID_ITEM, tableId, tabId, seatNum, itemId, reason });
  }, [backendEnabled, dispatch, getBackendItemId]);

  const sendOrder = useCallback(async (tableId, tabId) => {
    if (backendEnabled) {
      const sessionId = tableId ? getSessionId(tableId) : getTabSessionId(tabId);
      const sessionType = tableId ? 'table' : 'tab';
      await posApi.apiSendOrder(sessionId, sessionType);
    }
    dispatch({ type: POS_ACTIONS.SEND_ORDER, tableId, tabId });
  }, [backendEnabled, dispatch, getSessionId, getTabSessionId]);

  const fireCourse = useCallback(async (tableId, course) => {
    if (backendEnabled) {
      const sessionId = getSessionId(tableId);
      await posApi.apiFireCourse(sessionId, 'table', course);
    }
    dispatch({ type: POS_ACTIONS.FIRE_COURSE, tableId, course });
  }, [backendEnabled, dispatch, getSessionId]);

  const moveItem = useCallback(async (tableId, itemId, fromSeat, toSeat) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      await posApi.apiMoveItem(backendId, toSeat);
    }
    dispatch({ type: POS_ACTIONS.MOVE_ITEM, tableId, itemId, fromSeat, toSeat });
  }, [backendEnabled, dispatch, getBackendItemId]);

  const splitItem = useCallback(async (tableId, tabId, seatNum, itemId, splitWays) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      const { copies } = await posApi.apiSplitItem(backendId, splitWays);
      // Backend handles split — we need to refresh local state
      // For now, dispatch locally and map the new IDs
      dispatch({ type: POS_ACTIONS.SPLIT_ITEM, tableId, tabId, seatNum, itemId, splitWays });
    } else {
      dispatch({ type: POS_ACTIONS.SPLIT_ITEM, tableId, tabId, seatNum, itemId, splitWays });
    }
  }, [backendEnabled, dispatch, getBackendItemId]);

  const dragDropItem = useCallback(async (tableId, itemId, fromSeat, toSeat) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      await posApi.apiMoveItem(backendId, toSeat);
    }
    dispatch({ type: POS_ACTIONS.DRAG_DROP_ITEM, tableId, itemId, fromSeat, toSeat });
  }, [backendEnabled, dispatch, getBackendItemId]);

  const compItem = useCallback(async (tableId, tabId, seatNum, itemId) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(itemId);
      await posApi.apiCompItem(backendId);
    }
    dispatch({ type: POS_ACTIONS.COMP_ITEM, tableId, tabId, seatNum, itemId });
  }, [backendEnabled, dispatch, getBackendItemId]);

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const openTab = useCallback(async (tabId, name, server) => {
    if (backendEnabled) {
      const { tab } = await posApi.apiOpenTab(name);
      // Use backend CUID as the tab ID
      dispatch({ type: POS_ACTIONS.OPEN_TAB, tabId: tab.id, name, server });
      return tab.id; // caller needs this for setActiveTab
    } else {
      dispatch({ type: POS_ACTIONS.OPEN_TAB, tabId, name, server });
      return tabId;
    }
  }, [backendEnabled, dispatch]);

  // ── Payments ─────────────────────────────────────────────────────────────

  const processPayment = useCallback(async (tableId, payment, newSeatPayments, newPaidSeats) => {
    if (backendEnabled) {
      const sessionId = getSessionId(tableId);
      await posApi.apiProcessPayment({
        tableSessionId: sessionId,
        method: payment.method,
        amount: payment.amount,
        seatNumber: payment.seat || null,
        tipAmount: payment.tip || 0,
        roomNumber: payment.roomNumber || null,
        guestName: payment.guestName || null,
        giftCardCode: payment.giftCardCode || null,
      });
    }
    dispatch({ type: POS_ACTIONS.PROCESS_TABLE_PAYMENT, tableId, payment, newSeatPayments, newPaidSeats });
  }, [backendEnabled, dispatch, getSessionId]);

  const voidLastPayment = useCallback(async (tableId) => {
    if (backendEnabled) {
      const payments = state.tablePayments[tableId]?.payments;
      if (payments?.length) {
        const lastPayment = payments[payments.length - 1];
        if (lastPayment.id) {
          await posApi.apiVoidPayment(lastPayment.id);
        }
      }
    }
    dispatch({ type: POS_ACTIONS.VOID_LAST_PAYMENT, tableId });
  }, [backendEnabled, dispatch, state.tablePayments]);

  const closeTableBill = useCallback(async (tableId, closedBill) => {
    if (backendEnabled) {
      const sessionId = getSessionId(tableId);
      await posApi.apiCloseBill({
        tableSessionId: sessionId,
        subtotal: closedBill.subtotal,
        discountAmount: closedBill.discountAmount || 0,
        discountLabel: closedBill.discountLabel || null,
        taxAmount: closedBill.tax,
        total: closedBill.total,
        tipTotal: closedBill.tip || 0,
        amountPaid: closedBill.amountPaid,
      });
    }
    dispatch({ type: POS_ACTIONS.CLOSE_TABLE_BILL, tableId, closedBill });
  }, [backendEnabled, dispatch, getSessionId]);

  const closeTabBill = useCallback(async (tabId, closedBill) => {
    if (backendEnabled) {
      const tabSessionId = getTabSessionId(tabId);
      await posApi.apiCloseBill({
        tabSessionId,
        subtotal: closedBill.subtotal,
        discountAmount: closedBill.discountAmount || 0,
        discountLabel: closedBill.discountLabel || null,
        taxAmount: closedBill.tax,
        total: closedBill.total,
        tipTotal: closedBill.tip || 0,
        amountPaid: closedBill.amountPaid,
      });
    }
    dispatch({ type: POS_ACTIONS.CLOSE_TAB_BILL, tabId, closedBill });
  }, [backendEnabled, dispatch, getTabSessionId]);

  // ── Gift Cards ───────────────────────────────────────────────────────────

  const redeemGiftCard = useCallback((code, amount) => {
    dispatch({ type: POS_ACTIONS.REDEEM_GIFT_CARD, code, amount });
  }, [dispatch]);

  // ── Transfers ────────────────────────────────────────────────────────────

  const transferTable = useCallback(async (fromTableId, toTableId) => {
    if (backendEnabled) {
      const sessionId = getSessionId(fromTableId);
      await posApi.apiTransferTable(sessionId, toTableId);
      // Update session map: remove old, add new
      dispatch({ type: POS_ACTIONS.SET_SESSION_ID, tableNumber: toTableId, sessionId });
    }
    dispatch({ type: POS_ACTIONS.TRANSFER_TABLE, fromTableId, toTableId });
  }, [backendEnabled, dispatch, getSessionId]);

  const transferTabToTable = useCallback(async (tabId, tableId, server) => {
    dispatch({ type: POS_ACTIONS.TRANSFER_TAB_TO_TABLE, tabId, tableId, server });
  }, [dispatch]);

  const transferItem = useCallback(async (fromTableId, fromSeat, toTableId, toSeat, item) => {
    if (backendEnabled) {
      const backendId = getBackendItemId(item.id);
      const toSessionId = getSessionId(toTableId);
      await posApi.apiTransferItem(backendId, toSessionId, null, toSeat);
    }
    dispatch({ type: POS_ACTIONS.TRANSFER_ITEM, fromTableId, fromSeat, toTableId, toSeat, item });
  }, [backendEnabled, dispatch, getBackendItemId, getSessionId]);

  // ── Bills ────────────────────────────────────────────────────────────────

  const reopenBill = useCallback(async (bill, newTableId, newTabId) => {
    if (backendEnabled && bill.backendBillId) {
      await posApi.apiReopenBill(bill.backendBillId);
    }
    dispatch({ type: POS_ACTIONS.REOPEN_BILL, bill, newTableId, newTabId });
  }, [backendEnabled, dispatch]);

  const updatePayment = useCallback(async (billId, newMethod, newAmount) => {
    dispatch({ type: POS_ACTIONS.UPDATE_PAYMENT, billId, newMethod, newAmount });
  }, [dispatch]);

  // ── Admin ────────────────────────────────────────────────────────────────

  const updateAdminConfig = useCallback(async (updates) => {
    if (backendEnabled) {
      await posApi.apiUpdateConfig(updates);
    }
    dispatch({ type: POS_ACTIONS.UPDATE_ADMIN_CONFIG, updates });
  }, [backendEnabled, dispatch]);

  const updateServiceConfig = useCallback(async (serviceConfig) => {
    dispatch({ type: POS_ACTIONS.UPDATE_SERVICE_CONFIG, serviceConfig });
  }, [dispatch]);

  // ── Day Management ───────────────────────────────────────────────────────

  const newDay = useCallback(() => {
    dispatch({ type: POS_ACTIONS.NEW_DAY });
  }, [dispatch]);

  return {
    // Server
    setServer, signOut, setDaypart,
    // Tables
    openTable, closeTableIfEmpty, adjustSeats,
    // Items
    addItem, updateItem, voidItem, sendOrder, fireCourse,
    moveItem, splitItem, dragDropItem, compItem,
    // Tabs
    openTab,
    // Payments
    processPayment, voidLastPayment, closeTableBill, closeTabBill,
    redeemGiftCard,
    // Transfers
    transferTable, transferTabToTable, transferItem,
    // Bills
    reopenBill, updatePayment,
    // Admin
    updateAdminConfig, updateServiceConfig,
    // Day
    newDay,
  };
}
