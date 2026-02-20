import React from 'react';
import { usePOS, POS_ACTIONS } from '../../context';

export default function SignIn() {
  const { state, dispatch } = usePOS();
  const servers = state.adminConfig?.servers || [];
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
              onClick={() => dispatch({ type: POS_ACTIONS.SET_SERVER, serverId: server.id })}
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
