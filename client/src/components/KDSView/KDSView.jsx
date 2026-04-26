import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUI, useAuth } from '../../context';
import { fetchKdsStations, fetchKdsTickets, apiBumpItem, apiBumpTicket } from '../../services/posApi';
import KDSTicket from './KDSTicket';

export default function KDSView() {
  const { backendEnabled } = useAuth();
  const { showToast } = useUI();

  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [stationCounts, setStationCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const stationsRef = useRef([]);

  // Fetch stations once on mount
  useEffect(() => {
    if (!backendEnabled) return;
    fetchKdsStations()
      .then(data => {
        const s = data.stations || [];
        setStations(s);
        stationsRef.current = s;
      })
      .catch(() => showToast('Failed to load KDS stations', 'error'));
  }, [backendEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch tickets for all stations, merge by session
  const fetchAllTickets = useCallback(async () => {
    const sts = stationsRef.current;
    if (!sts.length) return [];

    const results = await Promise.all(
      sts.map(async (station) => {
        const data = await fetchKdsTickets(station.key);
        return (data.tickets || []).map(ticket => ({
          ...ticket,
          items: ticket.items.map(item => ({ ...item, stationKey: station.key })),
        }));
      })
    );

    // Compute per-station counts
    const counts = {};
    sts.forEach((s, i) => { counts[s.key] = results[i].length; });
    setStationCounts(counts);

    // Merge tickets by sessionId
    const merged = new Map();
    for (const stationTickets of results) {
      for (const ticket of stationTickets) {
        if (merged.has(ticket.sessionId)) {
          const existing = merged.get(ticket.sessionId);
          existing.items.push(...ticket.items);
          if (!existing.stationKeys.includes(ticket.items[0]?.stationKey)) {
            existing.stationKeys.push(ticket.items[0]?.stationKey);
          }
          if (new Date(ticket.firedAt) < new Date(existing.firedAt)) {
            existing.firedAt = ticket.firedAt;
          }
        } else {
          merged.set(ticket.sessionId, {
            ...ticket,
            stationKeys: [ticket.items[0]?.stationKey].filter(Boolean),
          });
        }
      }
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(a.firedAt) - new Date(b.firedAt)
    );
  }, []);

  // Fetch tickets for a single station
  const fetchStationTickets = useCallback(async (stationKey) => {
    const data = await fetchKdsTickets(stationKey);
    return (data.tickets || []).map(ticket => ({
      ...ticket,
      stationKeys: [stationKey],
      items: ticket.items.map(item => ({ ...item, stationKey })),
    })).sort((a, b) => new Date(a.firedAt) - new Date(b.firedAt));
  }, []);

  // Main fetch dispatcher
  const fetchTicketsData = useCallback(async () => {
    try {
      const result = activeStation === 'all'
        ? await fetchAllTickets()
        : await fetchStationTickets(activeStation);
      setTickets(result);
    } catch {
      // silent — don't spam toasts on poll errors
    } finally {
      setLoading(false);
    }
  }, [activeStation, fetchAllTickets, fetchStationTickets]);

  // Poll tickets
  useEffect(() => {
    if (!backendEnabled || !stationsRef.current.length) return;
    fetchTicketsData();
    const interval = setInterval(fetchTicketsData, 8000);
    return () => clearInterval(interval);
  }, [backendEnabled, stations, fetchTicketsData]);

  // Elapsed time timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  // Bump a single item
  const handleBumpItem = useCallback(async (itemId) => {
    setTickets(prev =>
      prev.map(t => ({ ...t, items: t.items.filter(i => i.id !== itemId) }))
        .filter(t => t.items.length > 0)
    );
    try {
      await apiBumpItem(itemId);
    } catch {
      showToast('Failed to bump item', 'error');
      fetchTicketsData();
    }
  }, [showToast, fetchTicketsData]);

  // Bump an entire ticket
  const handleBumpTicket = useCallback(async (sessionId, stationKeys) => {
    setTickets(prev => prev.filter(t => t.sessionId !== sessionId));
    try {
      const keys = Array.isArray(stationKeys) ? stationKeys : [stationKeys];
      await Promise.all(keys.map(key => apiBumpTicket(sessionId, key)));
    } catch {
      showToast('Failed to bump ticket', 'error');
      fetchTicketsData();
    }
  }, [showToast, fetchTicketsData]);

  if (!backendEnabled) {
    return (
      <div className="kds-view">
        <div className="kds-offline">
          <h2>KDS Unavailable</h2>
          <p>Kitchen Display System requires a backend connection.</p>
        </div>
      </div>
    );
  }

  const totalCount = tickets.length;

  return (
    <div className="kds-view">
      <div className="kds-station-tabs">
        <button
          className={`kds-station-tab${activeStation === 'all' ? ' active' : ''}`}
          onClick={() => setActiveStation('all')}
        >
          All
          {totalCount > 0 && <span className="kds-tab-count">{totalCount}</span>}
        </button>
        {stations.map(station => {
          const count = stationCounts[station.key] || 0;
          return (
            <button
              key={station.key}
              className={`kds-station-tab${activeStation === station.key ? ' active' : ''}`}
              onClick={() => setActiveStation(station.key)}
            >
              <span className="kds-station-dot" style={{ background: station.color }} />
              {station.name}
              {count > 0 && <span className="kds-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="kds-ticket-grid">
        {loading ? (
          <p className="kds-empty">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="kds-empty">All caught up</p>
        ) : (
          tickets.map(ticket => (
            <KDSTicket
              key={ticket.sessionId}
              ticket={ticket}
              now={now}
              stations={stations}
              activeStation={activeStation}
              onBumpItem={handleBumpItem}
              onBumpTicket={handleBumpTicket}
            />
          ))
        )}
      </div>
    </div>
  );
}
