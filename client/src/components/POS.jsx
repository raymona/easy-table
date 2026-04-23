import React from 'react';
import { usePOS, useUI } from '../context';
import { useDaypart } from '../hooks/useDaypart';
import './POS.css';

import SignIn from './SignIn/SignIn';
import Header from './Header/Header';
import FloorView from './FloorView/FloorView';
import TabsView from './TabsView/TabsView';
import OrderView from './OrderView/OrderView';
import AdminPinModal from './admin/AdminPinModal';
import AdminShell from './admin/AdminShell';

// Modals
import SeatPickerModal from './modals/SeatPickerModal';
import NewTabModal from './modals/NewTabModal';
import ModScreen from './modals/ModScreen';
import ItemActionsModal from './modals/ItemActionsModal';
import VoidModal from './modals/VoidModal';
import SplitItemModal from './modals/SplitItemModal';
import MoveItemModal from './modals/MoveItemModal';
import PrintChequeModal from './modals/PrintChequeModal';
import PaymentModal from './modals/PaymentModal';
import DiscountModal from './modals/DiscountModal';
import OpenItemModal from './modals/OpenItemModal';
import TransferModal from './modals/TransferModal';
import ReopenTablePicker from './modals/ReopenTablePicker';
import EditPaymentModal from './modals/EditPaymentModal';
import ServerScreen from './modals/ServerScreen';

export default function POS() {
  const { state } = usePOS();
  const { currentServer } = state;
  const { view, activeTable, activeTab, adminUnlocked } = useUI();

  useDaypart(); // auto-switch daypart based on serviceConfig

  if (!currentServer) return <SignIn />;

  const isTableView = activeTable !== null;
  const isTabView = activeTab !== null;

  return (
    <div className="pos-container">
      <Header />

      <main className="pos-main">
        {view === 'admin' && (
          adminUnlocked ? <AdminShell /> : <AdminPinModal />
        )}
        {view === 'floor' && !isTableView && !isTabView && <FloorView />}
        {view === 'tabs' && !isTabView && <TabsView />}
        {(isTableView || isTabView) && <OrderView />}
      </main>

      {/* ── Modals ── */}
      <SeatPickerModal />
      <NewTabModal />
      <ModScreen />
      <ItemActionsModal />
      <VoidModal />
      <SplitItemModal />
      <MoveItemModal />
      <PrintChequeModal />
      <PaymentModal />
      <DiscountModal />
      <OpenItemModal />
      <TransferModal />
      <ReopenTablePicker />
      <EditPaymentModal />
      <ServerScreen />
    </div>
  );
}
