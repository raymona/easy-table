import { describe, it, expect, vi } from 'vitest';
import { isCardPayment, simulateCardPayment } from '../paymentSimulator';

// ─── isCardPayment ──────────────────────────────────────────────────────────

describe('isCardPayment', () => {
  it('returns true for all card methods', () => {
    expect(isCardPayment('Visa')).toBe(true);
    expect(isCardPayment('Mastercard')).toBe(true);
    expect(isCardPayment('Amex')).toBe(true);
    expect(isCardPayment('Discover')).toBe(true);
    expect(isCardPayment('Debit')).toBe(true);
  });

  it('returns false for non-card methods', () => {
    expect(isCardPayment('cash')).toBe(false);
    expect(isCardPayment('gift')).toBe(false);
    expect(isCardPayment('room')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isCardPayment('visa')).toBe(false);
    expect(isCardPayment('VISA')).toBe(false);
  });
});

// ─── simulateCardPayment ────────────────────────────────────────────────────

describe('simulateCardPayment', () => {
  // Speed up tests by mocking timers
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onStageChange with insert, reading, processing stages', async () => {
    // Force approval (mock Math.random to return > 0.05)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const stages = [];
    const onStageChange = (stage) => stages.push(stage.stage);

    const promise = simulateCardPayment('Visa', 42.50, onStageChange);

    // Advance through all delays
    await vi.advanceTimersByTimeAsync(10000);

    const result = await promise;

    expect(stages).toContain('insert');
    expect(stages).toContain('reading');
    expect(stages).toContain('processing');
    expect(stages).toContain('approved');

    // insert comes before reading, reading before processing, etc.
    expect(stages.indexOf('insert')).toBeLessThan(stages.indexOf('reading'));
    expect(stages.indexOf('reading')).toBeLessThan(stages.indexOf('processing'));
    expect(stages.indexOf('processing')).toBeLessThan(stages.indexOf('approved'));

    Math.random.mockRestore();
  });

  it('returns approved result with authCode and cardLast4', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const onStageChange = vi.fn();
    const promise = simulateCardPayment('Mastercard', 100, onStageChange);
    await vi.advanceTimersByTimeAsync(10000);

    const result = await promise;

    expect(result.approved).toBe(true);
    expect(result.authCode).toMatch(/^\d{6}$/);
    expect(result.cardLast4).toMatch(/^\d{4}$/);
    expect(result.message).toBe('APPROVED');

    Math.random.mockRestore();
  });

  it('returns declined result when random < 0.05', async () => {
    // First call for cardLast4 generation returns 0.5, decline check returns 0.01
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      // The decline check is the 3rd call to Math.random (after last4 + delays)
      // Simpler: always return 0.01 which forces decline and gives valid last4
      return 0.01;
    });

    const onStageChange = vi.fn();
    const promise = simulateCardPayment('Visa', 50, onStageChange);
    await vi.advanceTimersByTimeAsync(10000);

    const result = await promise;

    expect(result.approved).toBe(false);
    expect(result.authCode).toBeNull();
    expect(result.cardLast4).toMatch(/^\d{4}$/);
    expect(result.message).toBe('DECLINED');

    Math.random.mockRestore();
  });

  it('passes method and amount to stage callbacks', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const stages = [];
    const onStageChange = (stage) => stages.push(stage);

    const promise = simulateCardPayment('Amex', 75.00, onStageChange);
    await vi.advanceTimersByTimeAsync(10000);
    await promise;

    expect(stages[0].method).toBe('Amex');
    expect(stages[0].amount).toBe(75.00);

    Math.random.mockRestore();
  });
});
