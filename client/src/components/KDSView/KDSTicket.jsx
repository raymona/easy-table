import React from 'react';

function formatElapsed(firedAt, now) {
  const elapsed = Math.max(0, now - new Date(firedAt).getTime());
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function urgencyClass(firedAt, now) {
  const minutes = (now - new Date(firedAt).getTime()) / 60000;
  if (minutes >= 10) return 'kds-ticket-late';
  if (minutes >= 5) return 'kds-ticket-warning';
  return '';
}

export default function KDSTicket({ ticket, now, stations, activeStation, onBumpItem, onBumpTicket }) {
  const label = ticket.tableNumber
    ? `Table ${ticket.tableNumber}`
    : ticket.tabName || 'Tab';
  const urgency = urgencyClass(ticket.firedAt, now);
  const elapsed = formatElapsed(ticket.firedAt, now);

  return (
    <div className={`kds-ticket ${urgency}`}>
      <div className="kds-ticket-header">
        <span className="kds-ticket-label">{label}</span>
        <span className={`kds-ticket-time ${urgency}`}>{elapsed}</span>
      </div>

      <div className="kds-ticket-items">
        {ticket.items.map(item => (
          <div
            key={item.id}
            className="kds-item"
            onClick={() => onBumpItem(item.id)}
            title="Tap to bump this item"
          >
            <div className="kds-item-main">
              {item.quantity > 1 && <span className="kds-item-qty">{item.quantity}x</span>}
              <span className="kds-item-name">{item.name}</span>
              {item.seatNumber != null && (
                <span className="kds-item-seat">S{item.seatNumber}</span>
              )}
              {activeStation === 'all' && item.stationKey && (
                <span
                  className="kds-item-station-dot"
                  style={{ background: stations.find(s => s.key === item.stationKey)?.color }}
                  title={stations.find(s => s.key === item.stationKey)?.name}
                />
              )}
            </div>
            {item.cookTemp && (
              <div className="kds-item-detail kds-cook-temp">{item.cookTemp}</div>
            )}
            {item.mods?.length > 0 && (
              <div className="kds-item-detail kds-mods">
                {item.mods.map((mod, i) => <span key={i}>{typeof mod === 'string' ? mod : `${mod.prefix || ''} ${mod.value || ''}`.trim()}</span>)}
              </div>
            )}
            {item.addOns?.length > 0 && (
              <div className="kds-item-detail kds-addons">
                {item.addOns.map((ao, i) => <span key={i}>+ {ao.name || ao}</span>)}
              </div>
            )}
            {item.allergies?.length > 0 && (
              <div className="kds-item-detail kds-allergies">
                ALLERGY: {item.allergies.join(', ')}
              </div>
            )}
            {item.notes?.length > 0 && (
              <div className="kds-item-detail kds-notes">
                {item.notes.map((n, i) => <span key={i}>{n}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="kds-bump-btn"
        onClick={() => onBumpTicket(ticket.sessionId, ticket.stationKeys)}
      >
        BUMP
      </button>
    </div>
  );
}
