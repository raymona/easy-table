import React from 'react';
import { usePOS, useUI, POS_ACTIONS, getServerInfo } from '../../context';

export default function Header() {
  const { state, dispatch } = usePOS();
  const { daypart, currentServer, adminConfig } = state;
  const { view, setView, activeTable, setActiveTable, activeTab, setActiveTab, setShowServerScreen } = useUI();

  const serverInfo = getServerInfo(currentServer, adminConfig.servers);
  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;

  return (
    <header className="pos-header">
      <div className="header-left">
        <h1 className="logo">Easy Table</h1>
        <nav className="main-nav">
          {adminConfig.mode !== 'bar' && adminConfig.mode !== 'bar-hotel' && (
            <button
              className={view === 'floor' && !isTableView && !isTabView ? 'active' : ''}
              onClick={() => { setView('floor'); setActiveTable(null); setActiveTab(null); }}
            >Floor</button>
          )}
          <button
            className={view === 'tabs' ? 'active' : ''}
            onClick={() => { setView('tabs'); setActiveTable(null); setActiveTab(null); }}
          >Bar Tabs</button>
          <button
            className={`settings-btn${view === 'admin' ? ' active' : ''}`}
            onClick={() => setView('admin')}
            title="Admin Settings"
          >⚙</button>
        </nav>
      </div>
      <div className="header-right">
        <div className="daypart-toggle">
          <button
            className={daypart === 'lunch' ? 'active' : ''}
            onClick={() => dispatch({ type: POS_ACTIONS.SET_DAYPART, daypart: 'lunch' })}
          >Lunch</button>
          <button
            className={daypart === 'dinner' ? 'active' : ''}
            onClick={() => dispatch({ type: POS_ACTIONS.SET_DAYPART, daypart: 'dinner' })}
          >Dinner</button>
        </div>
        <div className="server-info" onClick={() => setShowServerScreen(true)}>
          <span className="server-avatar" style={{ background: serverInfo.color }}>
            {serverInfo.name.charAt(0)}
          </span>
          <span>{serverInfo.name}</span>
          <button
            className="sign-out"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: POS_ACTIONS.SIGN_OUT }); }}
          >×</button>
        </div>
      </div>
    </header>
  );
}
