import React, { useState } from 'react';
import { usePOS, POS_ACTIONS } from '../../../context';

export default function StaffSection() {
  const { state, dispatch } = usePOS();
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
    setServers(prev => [...prev, { id: Date.now(), name: '', color: '#888888' }]);
  };

  const save = () => {
    dispatch({ type: POS_ACTIONS.UPDATE_ADMIN_CONFIG, updates: { servers } });
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
        <button className="confirm-btn" onClick={save}>Save</button>
      </div>
    </div>
  );
}
