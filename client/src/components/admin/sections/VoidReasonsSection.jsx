import React, { useState } from 'react';
import { usePOS, useUI } from '../../../context';
import { usePOSActions } from '../../../hooks/usePOSActions';

export default function VoidReasonsSection() {
  const { state } = usePOS();
  const actions = usePOSActions();
  const { showToast } = useUI();
  const [saving, setSaving] = useState(false);
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

  const save = async () => {
    setSaving(true);
    try {
      await actions.updateAdminConfig({ voidReasons: reasons.filter(r => r.trim()) });
      showToast('Void reasons saved', 'success');
    } catch (err) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
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
        <button className="confirm-btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}
