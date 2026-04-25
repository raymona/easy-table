import React, { useState, useEffect } from 'react';
import { usePOS, POS_ACTIONS } from '../../context';
import { useAuth } from '../../context/AuthContext';
import { fetchVenues, fetchStaff } from '../../services/posApi';

export default function SignIn() {
  const { state, dispatch } = usePOS();
  const { backendEnabled, login } = useAuth();
  const localServers = state.adminConfig?.servers || [];

  const [servers, setServers] = useState(localServers);
  const [venueId, setVenueId] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch staff from backend on mount
  useEffect(() => {
    if (!backendEnabled) return;

    async function loadStaff() {
      try {
        const { venues } = await fetchVenues();
        if (venues.length === 0) return;
        const vid = venues[0].id;
        setVenueId(vid);
        const { staff } = await fetchStaff(vid);
        setServers(staff);
      } catch (e) {
        console.error('Failed to load staff:', e);
      }
    }
    loadStaff();
  }, [backendEnabled]);

  const handleServerClick = (server) => {
    if (backendEnabled) {
      setSelectedServer(server);
      setPin('');
      setError('');
    } else {
      dispatch({ type: POS_ACTIONS.SET_SERVER, serverId: server.id });
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const staff = await login(pin, venueId);
      dispatch({ type: POS_ACTIONS.SET_SERVER, serverId: staff.id });
    } catch (e) {
      setError('Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  // PIN entry screen
  if (selectedServer) {
    return (
      <div className="sign-in-screen">
        <div className="sign-in-box">
          <h1>Easy Table</h1>
          <p>Enter PIN for {selectedServer.name}</p>
          <div className="pin-entry">
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
              autoFocus
              placeholder="••••"
              className="pin-input"
            />
            {error && <div className="pin-error">{error}</div>}
          </div>
          <div className="modal-actions">
            <button className="cancel-btn" onClick={() => setSelectedServer(null)}>Back</button>
            <button
              className="confirm-btn"
              onClick={handlePinSubmit}
              disabled={pin.length < 4 || loading}
            >{loading ? 'Signing in...' : 'Sign In'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sign-in-screen">
      <div className="sign-in-box">
        <h1>Easy Table</h1>
        <p>Select your name to sign in</p>
        <div className="server-grid">
          {servers.map(server => (
            <button
              key={server.id}
              className="server-btn"
              onClick={() => handleServerClick(server)}
            >
              <span className="server-avatar" style={{ background: server.color }}>
                {server.name.charAt(0)}
              </span>
              <span>{server.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
