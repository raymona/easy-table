import React from 'react';
import { usePOS, useUI } from '../../context';
import { getOrderTotal } from '../../utils/calculations';

export default function TabsView() {
  const { state } = usePOS();
  const { tabStates, currentServer } = state;
  const { setActiveTab, setActiveTable, setShowNewTabModal } = useUI();

  const myTabs = Object.entries(tabStates).filter(([, tab]) => tab.server === currentServer);

  return (
    <div className="tabs-view">
      <div className="tabs-header">
        <h2>Bar Tabs</h2>
        <button className="new-tab-btn" onClick={() => setShowNewTabModal(true)}>+ New Tab</button>
      </div>
      <div className="tabs-grid">
        {myTabs.map(([tabId, tab]) => (
          <div
            key={tabId}
            className="tab-card"
            onClick={() => { setActiveTab(tabId); setActiveTable(null); }}
          >
            <span className="tab-name">{tab.name}</span>
            <span className="tab-items">{tab.items.length} items</span>
            <span className="tab-total">${getOrderTotal(tab.items).toFixed(2)}</span>
          </div>
        ))}
        {myTabs.length === 0 && <p className="no-tabs">No open tabs</p>}
      </div>
    </div>
  );
}
