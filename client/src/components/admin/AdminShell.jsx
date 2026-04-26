import React, { useState } from 'react';
import { usePOS, useUI } from '../../context';
import GeneralSection from './sections/GeneralSection';
import DiscountsSection from './sections/DiscountsSection';
import VoidReasonsSection from './sections/VoidReasonsSection';
import StaffSection from './sections/StaffSection';
import MenuSection from './sections/MenuSection';

const SECTIONS = [
  { key: 'general', label: 'General' },
  { key: 'menu', label: 'Menu' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'void-reasons', label: 'Void Reasons' },
  { key: 'staff', label: 'Staff' },
];

export default function AdminShell() {
  const { state } = usePOS();
  const { setView, setAdminUnlocked } = useUI();
  const [activeSection, setActiveSection] = useState('general');

  const exit = () => {
    setAdminUnlocked(false);
    const mode = state.adminConfig?.mode;
    setView(mode === 'bar' || mode === 'bar-hotel' ? 'tabs' : 'floor');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span style={{ fontWeight: 700 }}>Admin</span>
          <button className="cancel-btn" onClick={exit}>Exit</button>
        </div>
        <nav>
          {SECTIONS.map(s => (
            <button
              key={s.key}
              className={activeSection === s.key ? 'active' : ''}
              onClick={() => setActiveSection(s.key)}
            >{s.label}</button>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        {activeSection === 'general' && <GeneralSection />}
        {activeSection === 'menu' && <MenuSection />}
        {activeSection === 'discounts' && <DiscountsSection />}
        {activeSection === 'void-reasons' && <VoidReasonsSection />}
        {activeSection === 'staff' && <StaffSection />}
      </div>
    </div>
  );
}
