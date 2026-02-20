export const TAX_RATE = 0.13;

/**
 * Sum all items in an order (no tax).
 * Accepts an array (tab items) or a seat-keyed object { [seatNum]: items[] }.
 */
export const getOrderTotal = (orders) => {
  if (Array.isArray(orders))
    return orders.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  return Object.values(orders)
    .flat()
    .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
};

/** Subtotal (no tax) — alias for getOrderTotal */
export const getSubtotal = (orders) => getOrderTotal(orders);

/** Tax on a subtotal amount, rounded to cents */
export const getTax = (subtotal) => Math.round(subtotal * TAX_RATE * 100) / 100;

/**
 * Apply a discount preset to a subtotal.
 * @param {number} subtotal
 * @param {{ type: 'percent'|'fixed', value: number }|null} discount
 */
export const applyDiscount = (subtotal, discount) => {
  if (!discount) return subtotal;
  if (discount.type === 'percent') return subtotal * (1 - discount.value / 100);
  if (discount.type === 'fixed') return Math.max(0, subtotal - discount.value);
  return subtotal;
};

/**
 * Grand total including tax, optionally with a discount applied before tax.
 * @param {Array|Object} orders
 * @param {{ type: 'percent'|'fixed', value: number }|null} [discount]
 */
export const getTotal = (orders, discount = null) => {
  let subtotal = getSubtotal(orders);
  if (discount) subtotal = applyDiscount(subtotal, discount);
  return subtotal + getTax(subtotal);
};

/**
 * Total (with tax) for a specific seat's items.
 * @param {Array} seatItems - array of order items for this seat
 */
export const getSeatTotal = (seatItems) => {
  const subtotal = (seatItems || []).reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  return Math.round(subtotal * (1 + TAX_RATE) * 100) / 100;
};

/** Total amount paid on a table across all payments */
export const getTablePaidAmount = (tablePayments, tableId) =>
  (tablePayments[tableId]?.payments || []).reduce((sum, p) => sum + p.amount, 0);

/** Amount paid specifically on one seat of a table */
export const getTableSeatPaidAmount = (tablePayments, tableId, seatNum) =>
  tablePayments[tableId]?.seatPayments?.[seatNum] || 0;

/** Array of fully-paid seat numbers for a table */
export const getTablePaidSeats = (tablePayments, tableId) =>
  tablePayments[tableId]?.paidSeats || [];

/**
 * Return the active daypart based on a serviceConfig object.
 * Falls back to the first defined period if current time matches nothing.
 * @param {{ [period: string]: { start: string, end: string } }} config
 * @returns {string}
 */
export function getDaypartFromConfig(config) {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  for (const [period, { start, end }] of Object.entries(config)) {
    if (hhmm >= start && hhmm <= end) return period;
  }
  return Object.keys(config)[0]; // fallback to first period
}

/**
 * Remaining unpaid balance on a table.
 * Bug fix: original used item.qty — corrected to item.quantity.
 */
export const getTableRemainingBalance = (tableStates, tablePayments, tableId) => {
  if (!tableStates[tableId]) return 0;
  const orders = tableStates[tableId].orders || {};
  const subtotal = Object.values(orders)
    .flat()
    .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const total = subtotal + subtotal * TAX_RATE;
  return Math.max(0, total - getTablePaidAmount(tablePayments, tableId));
};

/**
 * Total still owed across unpaid seats.
 * @param {{ orders: Object }} tableState - single table's state ({ orders, seats, ... })
 * @param {number[]} paidSeats  - seat numbers already fully paid
 * @returns {number}
 */
export const getUnpaidTotal = (tableState, paidSeats) => {
  if (!tableState) return 0;
  const allSeats = Object.keys(tableState.orders).map(Number);
  const unpaidSeats = allSeats.filter((s) => !paidSeats.includes(s));
  return unpaidSeats.reduce((sum, seatNum) => {
    const items = tableState.orders[seatNum] || [];
    return sum + getSeatTotal(items);
  }, 0);
};
