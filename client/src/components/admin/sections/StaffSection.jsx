import React, { useState } from 'react';
import { usePOS, useUI } from '../../../context';
import { usePOSActions } from '../../../hooks/usePOSActions';

export default function StaffSection() {
  const { state } = usePOS();
  const actions = usePOSActions();
  const { showToast } = useUI();
  const [saving, setSaving] = useState(false);
  const [servers, setServers] = useState(
    JSON.parse(JSON.stringify(state.adminConfig.servers))
  );

  const updateServer = (idx, field, value) => {
    setServers(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const deleteServer = (idx) => {
    setServers(prev => prev.filter((_, i) => i !== idx));
  };

  const addServer = () => {
    setServers(prev => [...prev, { id: Date.now(), name: '', pin: '', color: '#888888' }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await actions.updateAdminConfig({ servers });
      showToast('Staff saved', 'success');
    } catch (err) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3>Staff</h3>
      {servers.map((server, idx) => (
        <div key={server.id} className="admin-list-row">
          <input
            type="text"
            placeholder="Name"
            value={server.name}
            onChange={e => updateServer(idx, 'name', e.target.value)}
          />
          <input
            type="text"
            placeholder="PIN"
            value={server.pin || ''}
            onChange={e => updateServer(idx, 'pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            inputMode="numeric"
            style={{ width: 70, textAlign: 'center', letterSpacing: 4 }}
          />
          <input
            type="color"
            value={server.color}
            onChange={e => updateServer(idx, 'color', e.target.value)}
            style={{ width: 40, height: 34, padding: 2, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', background: 'transparent' }}
          />
          <button
            onClick={() => deleteServer(idx)}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
          >×</button>
        </div>
      ))}
      <button
        onClick={addServer}
        style={{ marginTop: 8, marginBottom: 20, background: 'var(--bg-raised)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', cursor: 'pointer' }}
      >+ Add Staff</button>
      <div className="modal-actions">
        <button className="confirm-btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}
