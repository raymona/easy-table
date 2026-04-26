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
