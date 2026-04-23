import React, { useState } from 'react';
import { usePOS, POS_ACTIONS } from '../../../context';

export default function VoidReasonsSection() {
  const { state, dispatch } = usePOS();
  const [reasons, setReasons] = useState([...state.adminConfig.voidReasons]);

  const updateReason = (idx, value) => {
    setReasons(prev => prev.map((r, i) => i === idx ? value : r));
  };

  const deleteReason = (idx) => {
    setReasons(prev => prev.filter((_, i) => i !== idx));
  };

  const addReason = () => {
    setReasons(prev => [...prev, '']);
  };

  const save = () => {
    dispatch({ type: POS_ACTIONS.UPDATE_ADMIN_CONFIG, updates: { voidReasons: reasons.filter(r => r.trim()) } });
  };

  return (
    <div>
      <h3>Void Reasons</h3>
      {reasons.map((reason, idx) => (
        <div key={idx} className="admin-list-row">
          <input
            type="text"
            value={reason}
            onChange={e => updateReason(idx, e.target.value)}
            placeholder="Reason text"
          />
          <button
            onClick={() => deleteReason(idx)}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
          >×</button>
        </div>
      ))}
      <button
        onClick={addReason}
        style={{ marginTop: 8, marginBottom: 20, background: 'var(--bg-raised)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}
      >+ Add Reason</button>
      <div className="modal-actions">
        <button className="confirm-btn" onClick={save}>Save</button>
      </div>
    </div>
  );
}
