import { describe, it, expect, vi } from 'vitest';
import { getItemsToFire, buildKitchenTicketData, buildGuestChequeData } from '../printHelpers';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const mkItem = (overrides = {}) => ({
  id: 'item-1',
  name: 'Burger',
  price: 18,
  quantity: 1,
  course: '',
  status: 'new',
  mods: [],
  addOns: [],
  cookTemp: null,
  allergies: [],
  notes: [],
  ...overrides,
});

const mkTableStates = (orders) => ({
  1: {
    server: 101,
    seats: Object.keys(orders).length,
    orders,
    voidedItems: [],
    openedAt: Date.now(),
  },
});

const mkTabStates = (items) => ({
  'tab-1': {
    name: 'Ray Tab',
    server: 101,
    items,
    voidedItems: [],
    openedAt: Date.now(),
  },
});

const adminConfig = {
  servers: [
    { id: 101, name: 'Ray', color: '#3B82F6' },
    { id: 102, name: 'Nik', color: '#10B981' },
  ],
  taxRate: 0.13,
};

// ─── getItemsToFire ─────────────────────────────────────────────────────────

describe('getItemsToFire', () => {
  describe('sendOrder (course = null)', () => {
    it('returns new items with auto-fire courses (Drinks, Apps, no-course)', () => {
      const orders = {
        1: [
          mkItem({ id: 'a', name: 'Beer', course: 'Drinks', status: 'new' }),
          mkItem({ id: 'b', name: 'Wings', course: 'Apps', status: 'new' }),
          mkItem({ id: 'c', name: 'Side', course: '', status: 'new' }),
        ],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, null);
      expect(result).toHaveLength(3);
      expect(result.map(i => i.name)).toEqual(['Beer', 'Wings', 'Side']);
    });

    it('excludes Mains and Dessert items (they stage, not fire)', () => {
      const orders = {
        1: [
          mkItem({ id: 'a', course: 'Drinks', status: 'new' }),
          mkItem({ id: 'b', course: 'Mains', status: 'new' }),
          mkItem({ id: 'c', course: 'Dessert', status: 'new' }),
        ],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].course).toBe('Drinks');
    });

    it('excludes already-sent/fired items', () => {
      const orders = {
        1: [
          mkItem({ id: 'a', course: 'Drinks', status: 'fired' }),
          mkItem({ id: 'b', course: 'Apps', status: 'sent' }),
          mkItem({ id: 'c', course: 'Apps', status: 'new' }),
        ],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, null);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c');
    });

    it('collects items across multiple seats with correct seatNum', () => {
      const orders = {
        1: [mkItem({ id: 'a', course: 'Drinks', status: 'new' })],
        2: [mkItem({ id: 'b', course: 'Apps', status: 'new' })],
        3: [mkItem({ id: 'c', course: 'Mains', status: 'new' })],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, null);
      expect(result).toHaveLength(2);
      expect(result[0].seatNum).toBe(1);
      expect(result[1].seatNum).toBe(2);
    });

    it('returns empty array when no new items exist', () => {
      const orders = {
        1: [mkItem({ status: 'fired', course: 'Drinks' })],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, null);
      expect(result).toEqual([]);
    });

    it('fires all new tab items regardless of course', () => {
      const items = [
        mkItem({ id: 'a', course: 'Mains', status: 'new' }),
        mkItem({ id: 'b', course: 'Drinks', status: 'new' }),
        mkItem({ id: 'c', course: '', status: 'fired' }),
      ];
      const result = getItemsToFire({}, mkTabStates(items), null, 'tab-1', null);
      expect(result).toHaveLength(2);
      expect(result.every(i => i.seatNum === null)).toBe(true);
    });
  });

  describe('fireCourse (course specified)', () => {
    it('returns sent items matching the given course', () => {
      const orders = {
        1: [
          mkItem({ id: 'a', course: 'Mains', status: 'sent' }),
          mkItem({ id: 'b', course: 'Mains', status: 'fired' }),
          mkItem({ id: 'c', course: 'Dessert', status: 'sent' }),
        ],
        2: [
          mkItem({ id: 'd', course: 'Mains', status: 'sent' }),
        ],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, 'Mains');
      expect(result).toHaveLength(2);
      expect(result.map(i => i.id)).toEqual(['a', 'd']);
      expect(result[0].seatNum).toBe(1);
      expect(result[1].seatNum).toBe(2);
    });

    it('returns empty when no sent items match course', () => {
      const orders = {
        1: [mkItem({ course: 'Mains', status: 'fired' })],
      };
      const result = getItemsToFire(mkTableStates(orders), {}, 1, null, 'Mains');
      expect(result).toEqual([]);
    });
  });
});

// ─── buildKitchenTicketData ─────────────────────────────────────────────────

describe('buildKitchenTicketData', () => {
  it('returns correct shape for sendOrder', () => {
    const orders = {
      1: [mkItem({ course: 'Drinks', status: 'new' })],
    };
    const result = buildKitchenTicketData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig,
    });

    expect(result.tableId).toBe(1);
    expect(result.tabName).toBeNull();
    expect(result.serverName).toBe('Ray');
    expect(result.courseFired).toBeNull();
    expect(result.items).toHaveLength(1);
    expect(typeof result.timestamp).toBe('number');
  });

  it('returns correct shape for fireCourse', () => {
    const orders = {
      1: [mkItem({ course: 'Mains', status: 'sent' })],
    };
    const result = buildKitchenTicketData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig, course: 'Mains',
    });

    expect(result.courseFired).toBe('Mains');
    expect(result.items).toHaveLength(1);
  });

  it('resolves tab name for tab orders', () => {
    const items = [mkItem({ course: 'Drinks', status: 'new' })];
    const result = buildKitchenTicketData({
      tableId: null, tabId: 'tab-1',
      tableStates: {}, tabStates: mkTabStates(items),
      adminConfig,
    });

    expect(result.tableId).toBeNull();
    expect(result.tabName).toBe('Ray Tab');
  });

  it('returns "Unknown" when server not found', () => {
    const orders = {
      1: [mkItem({ course: 'Drinks', status: 'new' })],
    };
    const tableStates = { 1: { server: 999, seats: 1, orders, voidedItems: [] } };
    const result = buildKitchenTicketData({
      tableId: 1, tabId: null,
      tableStates, tabStates: {},
      adminConfig,
    });
    expect(result.serverName).toBe('Unknown');
  });
});

// ─── buildGuestChequeData ───────────────────────────────────────────────────

describe('buildGuestChequeData', () => {
  it('builds full bill data for a table', () => {
    const orders = {
      1: [mkItem({ price: 20 })],
      2: [mkItem({ price: 10 }), mkItem({ price: 15 })],
    };
    const result = buildGuestChequeData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig, appliedDiscount: null,
      splitMode: 'full',
    });

    expect(result.restaurantName).toBe('EASY TABLE');
    expect(result.tableId).toBe(1);
    expect(result.serverName).toBe('Ray');
    expect(result.subtotal).toBe(45);
    expect(result.taxRate).toBe(0.13);
    expect(result.tax).toBeCloseTo(45 * 0.13, 2);
    expect(result.total).toBeCloseTo(45 * 1.13, 2);
    expect(result.discount).toBeNull();
    expect(result.splitMode).toBe('full');
    expect(Object.keys(result.seats)).toEqual(['1', '2']);
    expect(result.items).toBeNull();
  });

  it('builds tab data with flat items list', () => {
    const items = [mkItem({ price: 12 }), mkItem({ price: 8 })];
    const result = buildGuestChequeData({
      tableId: null, tabId: 'tab-1',
      tableStates: {}, tabStates: mkTabStates(items),
      adminConfig, appliedDiscount: null,
      splitMode: 'full',
    });

    expect(result.tabName).toBe('Ray Tab');
    expect(result.seats).toBeNull();
    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(20);
  });

  it('applies discount correctly', () => {
    const orders = { 1: [mkItem({ price: 100 })] };
    const discount = { label: '10%', type: 'percent', value: 10 };
    const result = buildGuestChequeData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig, appliedDiscount: discount,
      splitMode: 'full',
    });

    expect(result.subtotal).toBe(90);
    expect(result.discount.label).toBe('10%');
    expect(result.discount.amount).toBe(10);
  });

  it('defaults splitCount to seat count for even split', () => {
    const orders = {
      1: [mkItem({ price: 10 })],
      2: [mkItem({ price: 10 })],
      3: [mkItem({ price: 10 })],
    };
    const result = buildGuestChequeData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig, appliedDiscount: null,
      splitMode: 'even',
    });

    expect(result.splitMode).toBe('even');
    expect(result.splitCount).toBe(3);
  });

  it('excludes empty seats from seats object', () => {
    const orders = {
      1: [mkItem({ price: 10 })],
      2: [],
    };
    const result = buildGuestChequeData({
      tableId: 1, tabId: null,
      tableStates: mkTableStates(orders), tabStates: {},
      adminConfig, appliedDiscount: null,
      splitMode: 'full',
    });

    expect(Object.keys(result.seats)).toEqual(['1']);
  });
});
