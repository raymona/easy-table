import React from 'react';

export default function FloorTable({ table, tState, tableServer, isPartiallyPaid, currentServer, onOpen }) {
  return (
    <div
      className={[
        'floor-table',
        table.shape,
        tState ? 'occupied' : 'empty',
        tState?.server === currentServer ? 'yours' : '',
        isPartiallyPaid ? 'partial-payment' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: table.x, top: table.y, '--server-color': tableServer?.color || 'var(--border)' }}
      onClick={onOpen}
    >
      <span className="table-number">{table.id}</span>
      {tState && <span className="table-server-dot" style={{ background: tableServer?.color }} />}
    </div>
  );
}
