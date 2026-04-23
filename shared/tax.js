// Canadian province tax rules
// HST = single combined rate
// GST+PST = federal + provincial (applied independently on subtotal)
// GST+QST = federal + Quebec Sales Tax (QST applied on pre-GST subtotal)

export const CA_TAX_RULES = {
  AB: { gst: 0.05, pst: 0,       type: 'GST',     label: 'GST (5%)' },
  BC: { gst: 0.05, pst: 0.07,    type: 'GST+PST', label: 'GST (5%) + PST (7%)' },
  MB: { gst: 0.05, pst: 0.07,    type: 'GST+PST', label: 'GST (5%) + RST (7%)' },
  NB: { gst: 0.15, pst: 0,       type: 'HST',     label: 'HST (15%)' },
  NL: { gst: 0.15, pst: 0,       type: 'HST',     label: 'HST (15%)' },
  NS: { gst: 0.15, pst: 0,       type: 'HST',     label: 'HST (15%)' },
  NT: { gst: 0.05, pst: 0,       type: 'GST',     label: 'GST (5%)' },
  NU: { gst: 0.05, pst: 0,       type: 'GST',     label: 'GST (5%)' },
  ON: { gst: 0.13, pst: 0,       type: 'HST',     label: 'HST (13%)' },
  PE: { gst: 0.15, pst: 0,       type: 'HST',     label: 'HST (15%)' },
  QC: { gst: 0.05, pst: 0.09975, type: 'GST+QST', label: 'GST (5%) + QST (9.975%)' },
  SK: { gst: 0.05, pst: 0.06,    type: 'GST+PST', label: 'GST (5%) + PST (6%)' },
  YT: { gst: 0.05, pst: 0,       type: 'GST',     label: 'GST (5%)' },
};

/**
 * Calculate tax breakdown for a given subtotal and province.
 * @param {number} subtotal - Pre-tax amount
 * @param {string} province - 2-letter province code (e.g. 'ON', 'BC', 'QC')
 * @returns {{ gst: number, pst: number, total: number, label: string, type: string }}
 */
export function calculateTax(subtotal, province) {
  const rule = CA_TAX_RULES[province];
  if (!rule) throw new Error(`Unknown province: ${province}`);

  if (rule.type === 'HST') {
    const hst = Math.round(subtotal * rule.gst * 100) / 100;
    return { gst: hst, pst: 0, total: hst, label: rule.label, type: rule.type };
  }

  const gst = Math.round(subtotal * rule.gst * 100) / 100;
  const pst = Math.round(subtotal * rule.pst * 100) / 100;
  return {
    gst,
    pst,
    total: Math.round((gst + pst) * 100) / 100,
    label: rule.label,
    type: rule.type,
  };
}

/**
 * Get combined tax rate for a province (for simple percentage display).
 * @param {string} province - 2-letter province code
 * @returns {number} Combined rate (e.g. 0.13 for Ontario)
 */
export function getTotalTaxRate(province) {
  const rule = CA_TAX_RULES[province];
  if (!rule) throw new Error(`Unknown province: ${province}`);
  return rule.gst + rule.pst;
}
