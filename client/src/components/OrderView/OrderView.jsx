import React from 'react';
import OrderPanel from './OrderPanel/OrderPanel';
import MenuPanel from './MenuPanel/MenuPanel';

export default function OrderView() {
  return (
    <div className="order-view">
      <OrderPanel />
      <MenuPanel />
    </div>
  );
}
