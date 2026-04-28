import api from './api';

// ── Auth (public) ───────────────────────────────────────────────────────────

export const fetchVenues = () => api.get('/api/auth/venues');
export const fetchStaff = (venueId) => api.get(`/api/auth/staff?venueId=${venueId}`);
export const apiLogout = () => api.post('/api/auth/logout');

// ── Fetch ────────────────────────────────────────────────────────────────────

export const fetchOpenTables = () => api.get('/api/tables');
export const fetchOpenTabs = () => api.get('/api/tabs');
export const fetchMenu = (daypart) => api.get(`/api/menu${daypart ? `?daypart=${daypart}` : ''}`);
export const fetchFloor = () => api.get('/api/floor');
export const fetchAdminConfig = () => api.get('/api/admin/config');
export const fetchClosedBills = (date) => api.get(`/api/bills${date ? `?date=${date}` : ''}`);

// ── Tables ───────────────────────────────────────────────────────────────────

export const apiOpenTable = (tableNumber, seatCount) =>
  api.post(`/api/tables/${tableNumber}/open`, { seatCount });

export const apiCloseEmptyTable = (sessionId) =>
  api.post(`/api/tables/${sessionId}/close`);

export const apiAdjustSeats = (sessionId, seatCount) =>
  api.patch(`/api/tables/${sessionId}/seats`, { seatCount });

export const apiTransferTable = (sessionId, toTableNumber) =>
  api.post(`/api/tables/${sessionId}/transfer`, { toTableNumber });

// ── Tabs ─────────────────────────────────────────────────────────────────────

export const apiOpenTab = (name, preAuthRef, cardLast4) =>
  api.post('/api/tabs/open', { name, preAuthRef, cardLast4 });

export const apiCloseTab = (tabSessionId) =>
  api.post(`/api/tabs/${tabSessionId}/close`);

export const apiConvertTabToTable = (tabSessionId, tableNumber, seatCount) =>
  api.post(`/api/tabs/${tabSessionId}/convert-to-table`, { tableNumber, seatCount });

// ── Order Items ──────────────────────────────────────────────────────────────

export const apiAddItem = (tableSessionId, tabSessionId, seatNumber, item) =>
  api.post('/api/orders/items', { tableSessionId, tabSessionId, seatNumber, item });

export const apiUpdateItem = (itemId, updates) =>
  api.patch(`/api/orders/items/${itemId}`, { updates });

export const apiVoidItem = (itemId, reason) =>
  api.delete(`/api/orders/items/${itemId}`, { reason });

export const apiSendOrder = (sessionId, sessionType) =>
  api.post('/api/orders/send', { sessionId, sessionType });

export const apiFireCourse = (sessionId, sessionType, course) =>
  api.post('/api/orders/fire-course', { sessionId, sessionType, course });

export const apiMoveItem = (itemId, toSeat) =>
  api.post('/api/orders/move-item', { itemId, toSeat });

export const apiSplitItem = (itemId, splitWays) =>
  api.post('/api/orders/split-item', { itemId, splitWays });

export const apiCompItem = (itemId, reason) =>
  api.post('/api/orders/comp-item', { itemId, reason });

export const apiTransferItem = (itemId, toTableSessionId, toTabSessionId, toSeat) =>
  api.post('/api/orders/transfer-item', { itemId, toTableSessionId, toTabSessionId, toSeat });

// ── Payments ─────────────────────────────────────────────────────────────────

export const apiProcessPayment = (params) =>
  api.post('/api/payments', params);

export const apiVoidPayment = (paymentId) =>
  api.delete(`/api/payments/${paymentId}`);

// ── Bills ────────────────────────────────────────────────────────────────────

export const apiCloseBill = (params) =>
  api.post('/api/bills', params);

export const apiReopenBill = (billId) =>
  api.post(`/api/bills/${billId}/reopen`);

export const apiUpdateBillPayment = (billId, paymentId, method, amount) =>
  api.patch(`/api/bills/${billId}/payment`, { paymentId, method, amount });

// ── Admin ────────────────────────────────────────────────────────────────────

export const apiUpdateConfig = (updates) =>
  api.patch('/api/admin/config', updates);

export const apiSyncStaff = (staff) =>
  api.put('/api/admin/staff/sync', { staff });

export const apiSyncDiscounts = (presets) =>
  api.put('/api/admin/discounts/sync', { presets });

export const apiSyncVoidReasons = (reasons) =>
  api.put('/api/admin/void-reasons/sync', { reasons });

export const apiUpdateServiceConfig = (configs) =>
  api.patch('/api/admin/service-config', { configs });

// ── Menu ─────────────────────────────────────────────────────────────────────

export const apiSyncMenu = (categories) =>
  api.put('/api/menu/sync', { categories });

// ── KDS ─────────────────────────────────────────────────────────────────────

export const fetchKdsStations = () => api.get('/api/kds/stations');
export const fetchKdsTickets = (stationKey) => api.get(`/api/kds/tickets/${stationKey}`);
export const apiBumpItem = (itemId) => api.post('/api/kds/bump-item', { itemId });
export const apiBumpTicket = (sessionId, stationKey) => api.post('/api/kds/bump-ticket', { sessionId, stationKey });
