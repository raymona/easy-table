import React, { useState } from 'react';
import { usePOS, POS_ACTIONS } from '../../../context';

const VENUE_MODES = [
  { value: 'restaurant', label: 'Full Service Restaurant', desc: 'Multi-course, seat-based ordering, floor plan' },
  { value: 'hotel', label: 'Full Service + Hotel (Room Charge)', desc: 'All FSR features plus Charge to Room payment' },
  { value: 'bar', label: 'Quick Bar / Counter Service', desc: 'No tables, fast tab open/close' },
  { value: 'bar-hotel', label: 'Quick Bar + Hotel (Room Charge)', desc: 'Bar mode plus Charge to Room payment' },
];

export default function GeneralSection() {
  const { state, dispatch } = usePOS();
  const { adminConfig, serviceConfig } = state;

  const [localMode, setLocalMode] = useState(adminConfig.mode);
  const [localTaxRate, setLocalTaxRate] = useState(String(Math.round(adminConfig.taxRate * 100)));
  const [localTipPresets, setLocalTipPresets] = useState([...adminConfig.tipPresets]);
  const [localServiceConfig, setLocalServiceConfig] = useState(
    JSON.parse(JSON.stringify(serviceConfig))
  );

  const updateServiceTime = (period, field, value) => {
    setLocalServiceConfig(prev => ({
      ...prev,
      [period]: { ...prev[period], [field]: value },
    }));
  };

  const save = () => {
    const taxRate = Math.max(0, Math.min(100, parseFloat(localTaxRate) || 0)) / 100;
    dispatch({
      type: POS_ACTIONS.UPDATE_ADMIN_CONFIG,
      updates: {
        mode: localMode,
        taxRate,
        tipPresets: localTipPresets.map(v => parseInt(v) || 0),
      },
    });
    dispatch({ type: POS_ACTIONS.UPDATE_SERVICE_CONFIG, serviceConfig: localServiceConfig });
  };

  return (
    <div>
      <h3>Venue Mode</h3>
      <div className="venue-mode-options">
        {VENUE_MODES.map(opt => (
          <label
            key={opt.value}
            className={`venue-mode-option${localMode === opt.value ? ' selected' : ''}`}
          >
            <input
              type="radio"
              name="venue-mode"
              value={opt.value}
              checked={localMode === opt.value}
              onChange={() => setLocalMode(opt.value)}
            />
            <div>
              <div className="venue-mode-label">{opt.label}</div>
              <div className="venue-mode-desc">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      <h3>Service Times</h3>
      {Object.entries(localServiceConfig).map(([period, { start, end }]) => (
        <div key={period} className="admin-field-row">
          <label>{period.charAt(0).toUpperCase() + period.slice(1)}</label>
          <input
            type="time"
            value={start}
            onChange={e => updateServiceTime(period, 'start', e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
          <input
            type="time"
            value={end}
            onChange={e => updateServiceTime(period, 'end', e.target.value)}
          />
        </div>
      ))}

      <h3>Tax Rate</h3>
      <div className="admin-field-row">
        <label>Tax Rate (%)</label>
        <input
          type="number"
          value={localTaxRate}
          min="0"
          max="100"
          step="0.1"
          onChange={e => setLocalTaxRate(e.target.value)}
          style={{ maxWidth: 100 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
      </div>

      <h3>Tip Presets</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {localTipPresets.map((val, idx) => (
          <input
            key={idx}
            type="number"
            value={val}
            min="0"
            max="100"
            onChange={e => setLocalTipPresets(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
            style={{ width: 60 }}
          />
        ))}
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>%</span>
      </div>

      <div className="modal-actions" style={{ marginTop: 8 }}>
        <button className="confirm-btn" onClick={save}>Save</button>
      </div>
    </div>
  );
}
