const CARD_METHODS = ['Visa', 'Mastercard', 'Amex', 'Discover', 'Debit'];

/**
 * Check if a payment method requires terminal simulation.
 */
export function isCardPayment(method) {
  return CARD_METHODS.includes(method);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateAuthCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateLast4() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Simulate a card payment terminal transaction.
 * Drives the UI via onStageChange callback.
 *
 * @param {string} method — 'Visa', 'Mastercard', etc.
 * @param {number} amount
 * @param {(stage: Object) => void} onStageChange
 * @returns {Promise<{approved: boolean, authCode: string|null, cardLast4: string, message: string}>}
 */
export async function simulateCardPayment(method, amount, onStageChange) {
  const cardLast4 = generateLast4();

  // Stage 1: Insert / Tap / Swipe
  onStageChange({
    stage: 'insert',
    method,
    amount,
    message: 'Insert / Tap / Swipe Card',
    cardLast4: null,
  });
  await delay(1200 + Math.random() * 800); // 1.2-2s

  // Stage 2: Reading card
  onStageChange({
    stage: 'reading',
    method,
    amount,
    message: `Reading ${method} •••• ${cardLast4}`,
    cardLast4,
  });
  await delay(600 + Math.random() * 400); // 0.6-1s

  // Stage 3: Processing
  onStageChange({
    stage: 'processing',
    method,
    amount,
    message: 'Processing',
    cardLast4,
  });
  await delay(1000 + Math.random() * 1500); // 1-2.5s

  // ~5% decline rate
  const declined = Math.random() < 0.05;

  if (declined) {
    const result = {
      approved: false,
      authCode: null,
      cardLast4,
      message: 'DECLINED',
    };
    onStageChange({ stage: 'declined', ...result, method, amount });
    return result;
  }

  // Approved
  const authCode = generateAuthCode();
  const result = {
    approved: true,
    authCode,
    cardLast4,
    message: 'APPROVED',
  };
  onStageChange({ stage: 'approved', ...result, method, amount });
  await delay(1200); // show approved for 1.2s

  return result;
}

/**
 * Simulate a card pre-authorization (hold, not charge).
 * Used when opening a bar tab with a card on file.
 *
 * @param {(stage: Object) => void} onStageChange
 * @returns {Promise<{approved: boolean, preAuthRef: string|null, cardLast4: string, cardBrand: string, message: string}>}
 */
export async function simulatePreAuth(onStageChange) {
  const cardLast4 = generateLast4();
  const brands = ['Visa', 'Mastercard', 'Amex'];
  const cardBrand = brands[Math.floor(Math.random() * brands.length)];

  // Stage 1: Insert / Tap / Swipe
  onStageChange({
    stage: 'insert',
    message: 'Insert / Tap / Swipe Card',
    cardLast4: null,
  });
  await delay(1200 + Math.random() * 800);

  // Stage 2: Reading card
  onStageChange({
    stage: 'reading',
    message: `Reading ${cardBrand} •••• ${cardLast4}`,
    cardLast4,
    cardBrand,
  });
  await delay(600 + Math.random() * 400);

  // Stage 3: Authorizing hold
  onStageChange({
    stage: 'processing',
    message: 'Authorizing Hold',
    cardLast4,
    cardBrand,
  });
  await delay(800 + Math.random() * 1000);

  // ~3% decline rate for pre-auths
  const declined = Math.random() < 0.03;

  if (declined) {
    const result = {
      approved: false,
      preAuthRef: null,
      cardLast4,
      cardBrand,
      message: 'DECLINED',
    };
    onStageChange({ stage: 'declined', ...result });
    return result;
  }

  const preAuthRef = 'PA-' + generateAuthCode();
  const result = {
    approved: true,
    preAuthRef,
    cardLast4,
    cardBrand,
    message: 'CARD AUTHORIZED',
  };
  onStageChange({ stage: 'authorized', ...result });
  await delay(1000);

  return result;
}

/**
 * Simulate capturing a pre-authorized hold (completing the charge on tab close).
 * Faster than a full payment since the card is already on file.
 *
 * @param {string} preAuthRef
 * @param {string} cardLast4
 * @param {string} cardBrand
 * @param {number} amount
 * @param {(stage: Object) => void} onStageChange
 * @returns {Promise<{approved: boolean, authCode: string|null, message: string}>}
 */
export async function simulateCapture(preAuthRef, cardLast4, cardBrand, amount, onStageChange) {
  onStageChange({
    stage: 'processing',
    message: `Capturing ${cardBrand} •••• ${cardLast4}`,
    amount,
  });
  await delay(800 + Math.random() * 600);

  // Captures almost never fail (card already authorized)
  const authCode = generateAuthCode();
  const result = {
    approved: true,
    authCode,
    cardLast4,
    message: 'CAPTURED',
  };
  onStageChange({ stage: 'approved', ...result, amount, cardBrand });
  await delay(1000);

  return result;
}
