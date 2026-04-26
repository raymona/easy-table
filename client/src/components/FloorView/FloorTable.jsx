import React from 'react';

// Original layout is roughly 350x300px. Convert to percentages with padding.
const LAYOUT_W = 380;
const LAYOUT_H = 320;

export default function FloorTable({ table, tState, tableServer, isPartiallyPaid, currentServer, onOpen }) {
  const leftPct = ((table.x + 10) / LAYOUT_W * 100).toFixed(1) + '%';
  const topPct = ((table.y + 10) / LAYOUT_H * 100).toFixed(1) + '%';

  return (
    <div
      className={[
        'floor-table',
        table.shape,
        tState ? 'occupied' : 'empty',
        tState?.server === currentServer ? 'yours' : '',
        isPartiallyPaid ? 'partial-payment' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: leftPct, top: topPct, '--server-color': tableServer?.color || 'var(--border)' }}
      onClick={onOpen}
    >
      <span className="table-number">{table.id}</span>
      {tState && <span className="table-server-dot" style={{ background: tableServer?.color }} />}
    </div>
  );
}
