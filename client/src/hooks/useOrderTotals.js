import { useMemo, useCallback } from 'react';
import { usePOS } from '../context/POSContext';
import { useUI } from '../context/UIContext';
import { getSubtotal, getTax, getSeatTotal, applyDiscount } from '../utils/calculations';

/**
 * Provides computed order totals for the currently active table or tab.
 * Accounts for any applied discount from UIContext.
 */
export function useOrderTotals() {
  const { state } = usePOS();
  const { tableStates, tabStates } = state;
  const { activeTable, activeTab, appliedDiscount } = useUI();

  const currentOrder = useMemo(() => {
    if (activeTable) return tableStates[activeTable]?.orders || {};
    if (activeTab) return tabStates[activeTab]?.items || [];
    return {};
  }, [activeTable, activeTab, tableStates, tabStates]);

  const rawSubtotal = useMemo(() => getSubtotal(currentOrder), [currentOrder]);
  const subtotal = useMemo(
    () => (appliedDiscount ? applyDiscount(rawSubtotal, appliedDiscount) : rawSubtotal),
    [rawSubtotal, appliedDiscount]
  );
  const tax = useMemo(() => getTax(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const getSeatTotalFn = useCallback(
    (seatNum) => {
      if (!activeTable || !tableStates[activeTable]) return 0;
      return getSeatTotal(tableStates[activeTable].orders[seatNum] || []);
    },
    [activeTable, tableStates]
  );

  return { subtotal, tax, total, rawSubtotal, getSeatTotal: getSeatTotalFn, currentOrder };
}
