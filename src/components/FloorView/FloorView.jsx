import React, { useMemo } from 'react';
import { TABLES, SERVERS, FLOOR_SECTIONS, FLOOR_SECTION_LABELS } from '../../data/menu';
import { usePOS, useUI, getServerInfo } from '../../context';
import FloorTable from './FloorTable';

export default function FloorView() {
  const { state } = usePOS();
  const { tableStates, tablePayments, currentServer, adminConfig } = state;
  const {
    floorSection, setFloorSection,
    setActiveTable, setActiveTab, setActiveSeat,
    setPendingTableId, setSeatCount, setShowSeatPicker,
  } = useUI();

  const sectionTables = useMemo(
    () => TABLES.filter(t => t.section === floorSection),
    [floorSection]
  );

  const openTable = (tableId) => {
    if (tableStates[tableId]) {
      setActiveTable(tableId);
      setActiveTab(null);
      setActiveSeat(1);
    } else {
      setPendingTableId(tableId);
      const defaultSeats = TABLES.find(t => t.id === tableId)?.defaultSeats || 2;
      setSeatCount(defaultSeats);
      setShowSeatPicker(true);
    }
  };

  return (
    <div className="floor-view">
      <div className="floor-section-tabs">
        {FLOOR_SECTIONS.map(section => (
          <button
            key={section}
            className={floorSection === section ? 'active' : ''}
            onClick={() => setFloorSection(section)}
          >{FLOOR_SECTION_LABELS[section]}</button>
        ))}
      </div>
      <div className="floor-map">
        {sectionTables.map(table => {
          const tState = tableStates[table.id];
          const tableServer = tState ? getServerInfo(tState.server, adminConfig.servers) : null;
          const isPartiallyPaid = (tablePayments[table.id]?.payments || []).length > 0;
          return (
            <FloorTable
              key={table.id}
              table={table}
              tState={tState}
              tableServer={tableServer}
              isPartiallyPaid={isPartiallyPaid}
              currentServer={currentServer}
              onOpen={() => openTable(table.id)}
            />
          );
        })}
      </div>
      <div className="floor-legend">
        <div className="legend-item"><span className="legend-dot empty"></span> Available</div>
        <div className="legend-item"><span className="legend-swatch dashed"></span> Partial Payment</div>
        {SERVERS.map(s => (
          <div key={s.id} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }}></span> {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}
