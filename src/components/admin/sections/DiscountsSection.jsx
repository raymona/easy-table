import React, { useState } from 'react';
import { usePOS, POS_ACTIONS } from '../../../context';

export default function DiscountsSection() {
  const { state, dispatch } = usePOS();
  const [presets, setPresets] = useState(
    JSON.parse(JSON.stringify(state.adminConfig.discountPresets))
  );

  const updatePreset = (idx, field, value) => {
    setPresets(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const deletePreset = (idx) => {
    setPresets(prev => prev.filter((_, i) => i !== idx));
  };

  const addPreset = () => {
    setPresets(prev => [...prev, { label: '', type: 'percent', value: 0 }]);
  };

  const save = () => {
    const cleaned = presets.map(p => ({
      label: p.label,
      type: p.type,
      value: parseFloat(p.value) || 0,
    }));
    dispatch({ type: POS_ACTIONS.UPDATE_ADMIN_CONFIG, updates: { discountPresets: cleaned } });
  };

  return (
    <div>
      <h3>Discount Presets</h3>
      {presets.map((preset, idx) => (
        <div key={idx} className="admin-list-row">
          <input
            type="text"
            placeholder="Label"
            value={preset.label}
            onChange={e => updatePreset(idx, 'label', e.target.value)}
            style={{ flex: 2 }}
          />
          <select
            value={preset.type}
            onChange={e => updatePreset(idx, 'type', e.target.value)}
            style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px' }}
          >
            <option value="percent">%</option>
            <option value="fixed">$</option>
          </select>
          <input
            type="number"
            placeholder="Value"
            value={preset.value}
            min="0"
            onChange={e => updatePreset(idx, 'value', e.target.value)}
            style={{ width: 80 }}
          />
          <button
            onClick={() => deletePreset(idx)}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
          >×</button>
        </div>
      ))}
      <button
        onClick={addPreset}
        style={{ marginTop: 8, marginBottom: 20, background: 'var(--bg-raised)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}
      >+ Add Preset</button>
      <div className="modal-actions">
        <button className="confirm-btn" onClick={save}>Save</button>
      </div>
    </div>
  );
}
