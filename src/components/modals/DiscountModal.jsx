import React from 'react';
import { usePOS, useUI } from '../../context';

export default function DiscountModal() {
  const { state } = usePOS();
  const discountPresets = state.adminConfig?.discountPresets || [];
  const {
    showDiscountModal, setShowDiscountModal,
    appliedDiscount, setAppliedDiscount,
  } = useUI();

  if (!showDiscountModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal discount-modal">
        <button className="modal-close" onClick={() => setShowDiscountModal(false)}>×</button>
        <h2>Apply Discount</h2>
        <div className="discount-presets">
          {discountPresets.map(preset => (
            <button
              key={preset.label}
              onClick={() => setAppliedDiscount(preset)}
              className={appliedDiscount?.label === preset.label ? 'active' : ''}
            >{preset.label}</button>
          ))}
        </div>
        <div className="custom-discount">
          <input type="number" placeholder="Custom $" />
          <input type="number" placeholder="Custom %" />
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => { setShowDiscountModal(false); setAppliedDiscount(null); }}>
            Remove Discount
          </button>
          <button className="confirm-btn" onClick={() => setShowDiscountModal(false)} disabled={!appliedDiscount}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
