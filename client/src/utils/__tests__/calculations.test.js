import { describe, it, expect } from 'vitest';
import {
  TAX_RATE,
  getOrderTotal,
  getSeatTotal,
  getSubtotal,
  getTax,
  getTotal,
  applyDiscount,
  getTablePaidAmount,
  getTableSeatPaidAmount,
  getTablePaidSeats,
  getTableRemainingBalance,
  getUnpaidTotal,
} from '../calculations';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const mkItem = (price, quantity = 1) => ({
  price,
  quantity,
  id: 'x',
  name: 'Test',
  status: 'new',
});

// Array-style orders (tab)
const arrayOrders = [mkItem(10), mkItem(20), mkItem(5, 2)]; // 10 + 20 + 10 = 40

// Seat-keyed orders (table)
const seatOrders = {
  1: [mkItem(10), mkItem(20)], // seat 1 subtotal = 30
  2: [mkItem(15)],             // seat 2 subtotal = 15
  3: [],                       // empty seat
};

const emptyPayments = {};
const partialPayments = {
  T1: {
    payments: [{ seat: 1, method: 'Visa', amount: 30 * 1.13 }],
    paidSeats: [1],
    seatPayments: { 1: 30 * 1.13 },
  },
};
const tableStates = {
  T1: { orders: seatOrders, seats: 3 },
};

// ─── getOrderTotal ───────────────────────────────────────────────────────────

describe('getOrderTotal', () => {
  it('sums an array of items', () => {
    expect(getOrderTotal(arrayOrders)).toBe(40);
  });

  it('sums a seat-keyed order object', () => {
    expect(getOrderTotal(seatOrders)).toBe(45); // 30 + 15
  });

  it('returns 0 for empty array', () => {
    expect(getOrderTotal([])).toBe(0);
  });

  it('returns 0 for empty object', () => {
    expect(getOrderTotal({})).toBe(0);
  });

  it('respects item.quantity', () => {
    expect(getOrderTotal([mkItem(10, 3)])).toBe(30);
  });

  it('defaults quantity to 1 when property is missing', () => {
    expect(getOrderTotal([{ price: 10, id: 'a', name: 'X', status: 'new' }])).toBe(10);
  });
});

// ─── getSeatTotal ─────────────────────────────────────────────────────────────

describe('getSeatTotal', () => {
  it('returns subtotal * (1 + TAX_RATE) for a seat', () => {
    const items = seatOrders[1]; // 30 subtotal
    expect(getSeatTotal(items)).toBeCloseTo(30 * (1 + TAX_RATE), 5);
  });

  it('returns 0 for an empty array', () => {
    expect(getSeatTotal([])).toBe(0);
  });

  it('returns 0 for null/undefined gracefully', () => {
    expect(getSeatTotal(null)).toBe(0);
    expect(getSeatTotal(undefined)).toBe(0);
  });
});

// ─── getSubtotal / getTax / getTotal ─────────────────────────────────────────

describe('getSubtotal', () => {
  it('equals getOrderTotal', () => {
    expect(getSubtotal(seatOrders)).toBe(getOrderTotal(seatOrders));
  });
});

describe('getTax', () => {
  it('is TAX_RATE * subtotal', () => {
    expect(getTax(100)).toBeCloseTo(TAX_RATE * 100, 5);
  });

  it('is 0 for 0 subtotal', () => {
    expect(getTax(0)).toBe(0);
  });
});

describe('getTotal', () => {
  it('is subtotal + tax with no discount', () => {
    const sub = getOrderTotal(seatOrders); // 45
    expect(getTotal(seatOrders)).toBeCloseTo(sub * (1 + TAX_RATE), 5);
  });

  it('applies a percent discount before tax', () => {
    const discount = { type: 'percent', value: 10 };
    const discountedSub = getOrderTotal(seatOrders) * 0.9; // 40.5
    // Use getTax (which rounds to cents) so the expected value matches the implementation
    expect(getTotal(seatOrders, discount)).toBeCloseTo(discountedSub + getTax(discountedSub), 5);
  });

  it('applies a fixed discount before tax', () => {
    const discount = { type: 'fixed', value: 5 };
    const discountedSub = getOrderTotal(seatOrders) - 5; // 40
    expect(getTotal(seatOrders, discount)).toBeCloseTo(discountedSub * (1 + TAX_RATE), 5);
  });

  it('returns 0 for empty orders', () => {
    expect(getTotal([])).toBe(0);
  });
});

// ─── applyDiscount ───────────────────────────────────────────────────────────

describe('applyDiscount', () => {
  it('applies percent discount', () => {
    expect(applyDiscount(100, { type: 'percent', value: 20 })).toBe(80);
  });

  it('applies 100% comp → 0', () => {
    expect(applyDiscount(100, { type: 'percent', value: 100 })).toBe(0);
  });

  it('applies fixed discount', () => {
    expect(applyDiscount(50, { type: 'fixed', value: 10 })).toBe(40);
  });

  it('does not go below 0 for fixed discount larger than subtotal', () => {
    expect(applyDiscount(5, { type: 'fixed', value: 20 })).toBe(0);
  });

  it('returns subtotal unchanged when discount is null', () => {
    expect(applyDiscount(100, null)).toBe(100);
  });
});

// ─── getTablePaidAmount ───────────────────────────────────────────────────────

describe('getTablePaidAmount', () => {
  it('sums all payments for a table', () => {
    expect(getTablePaidAmount(partialPayments, 'T1')).toBeCloseTo(30 * 1.13, 5);
  });

  it('returns 0 when table has no payments', () => {
    expect(getTablePaidAmount(emptyPayments, 'T1')).toBe(0);
  });

  it('returns 0 for unknown table', () => {
    expect(getTablePaidAmount(partialPayments, 'T99')).toBe(0);
  });
});

// ─── getTableSeatPaidAmount ───────────────────────────────────────────────────

describe('getTableSeatPaidAmount', () => {
  it('returns amount paid on a specific seat', () => {
    expect(getTableSeatPaidAmount(partialPayments, 'T1', 1)).toBeCloseTo(30 * 1.13, 5);
  });

  it('returns 0 for an unpaid seat', () => {
    expect(getTableSeatPaidAmount(partialPayments, 'T1', 2)).toBe(0);
  });
});

// ─── getTablePaidSeats ────────────────────────────────────────────────────────

describe('getTablePaidSeats', () => {
  it('returns array of fully paid seat numbers', () => {
    expect(getTablePaidSeats(partialPayments, 'T1')).toEqual([1]);
  });

  it('returns empty array when no seats paid', () => {
    expect(getTablePaidSeats(emptyPayments, 'T1')).toEqual([]);
  });
});

// ─── getTableRemainingBalance ─────────────────────────────────────────────────

describe('getTableRemainingBalance', () => {
  it('returns total minus amount paid', () => {
    const total = 45 * (1 + TAX_RATE); // seats 1+2 subtotal = 45
    const paid = 30 * 1.13;
    expect(getTableRemainingBalance(tableStates, partialPayments, 'T1')).toBeCloseTo(
      total - paid,
      5
    );
  });

  it('returns 0 for a table that does not exist', () => {
    expect(getTableRemainingBalance({}, emptyPayments, 'T99')).toBe(0);
  });

  it('uses item.quantity (not item.qty) — bug fix', () => {
    const states = { T2: { orders: { 1: [mkItem(10, 3)] } } }; // 30 subtotal
    expect(getTableRemainingBalance(states, emptyPayments, 'T2')).toBeCloseTo(
      30 * (1 + TAX_RATE),
      5
    );
  });
});

// ─── getUnpaidTotal ───────────────────────────────────────────────────────────

describe('getUnpaidTotal', () => {
  it('sums totals of unpaid seats', () => {
    // seat 1 is paid; seat 2 (15 subtotal) and seat 3 (0) are unpaid
    const tableState = tableStates['T1'];
    const paidSeats = [1];
    expect(getUnpaidTotal(tableState, paidSeats)).toBeCloseTo(15 * (1 + TAX_RATE), 5);
  });

  it('returns 0 when tableState is null', () => {
    expect(getUnpaidTotal(null, [])).toBe(0);
  });

  it('returns full total when no seats are paid', () => {
    const tableState = tableStates['T1'];
    expect(getUnpaidTotal(tableState, [])).toBeCloseTo(45 * (1 + TAX_RATE), 5);
  });

  it('returns 0 when all seats are paid', () => {
    const tableState = tableStates['T1'];
    expect(getUnpaidTotal(tableState, [1, 2, 3])).toBe(0);
  });
});
