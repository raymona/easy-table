import React, { useMemo } from 'react';
import { getServerInfo } from '../../context';

function formatElapsed(openedAt) {
  if (!openedAt) return '';
  const mins = Math.floor((Date.now() - openedAt) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function FloorListView({ tables, tableStates, tablePayments, currentServer, adminConfig, onOpenTable }) {
  // Sort: occupied first (grouped by server), then available
  const rows = useMemo(() => {
    const occupied = [];
    const available = [];

    for (const table of tables) {
      const tState = tableStates[table.id];
      if (tState) {
        const server = getServerInfo(tState.server, adminConfig.servers);
        const itemCount = Object.values(tState.orders || {}).reduce((sum, items) => sum + items.length, 0);
        const hasPay = (tablePayments[table.id]?.payments || []).length > 0;
        occupied.push({ table, tState, server, itemCount, hasPay });
      } else {
        available.push({ table, tState: null, server: null, itemCount: 0, hasPay: false });
      }
    }

    // Group occupied by server name
    occupied.sort((a, b) => (a.server?.name || '').localeCompare(b.server?.name || ''));

    return [...occupied, ...available];
  }, [tables, tableStates, tablePayments, adminConfig.servers]);

  return (
    <div className="floor-list">
      <div className="floor-list-header">
        <span className="fl-col-table">Table</span>
        <span className="fl-col-status">Status</span>
        <span className="fl-col-server">Server</span>
        <span className="fl-col-seats">Seats</span>
        <span className="fl-col-items">Items</span>
        <span className="fl-col-time">Time</span>
      </div>
      {rows.map(({ table, tState, server, itemCount, hasPay }) => (
        <div
          key={table.id}
          className={`floor-list-row${tState ? ' occupied' : ''}${tState?.server === currentServer ? ' yours' : ''}${hasPay ? ' partial-payment' : ''}`}
          onClick={() => onOpenTable(table.id)}
        >
          <span className="fl-col-table">{table.id}</span>
          <span className="fl-col-status">
            {tState ? (hasPay ? 'Partial Pay' : 'Occupied') : 'Available'}
          </span>
          <span className="fl-col-server">
            {server && (
              <>
                <span className="fl-server-dot" style={{ background: server.color }} />
                {server.name}
              </>
            )}
          </span>
          <span className="fl-col-seats">{tState ? tState.seats : table.defaultSeats}</span>
          <span className="fl-col-items">{itemCount || ''}</span>
          <span className="fl-col-time">{tState ? formatElapsed(tState.openedAt) : ''}</span>
        </div>
      ))}
    </div>
  );
}
