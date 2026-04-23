import { useMemo, useCallback } from 'react';
import { usePOS } from '../context/POSContext';
import {
  getTablePaidAmount,
  getTableSeatPaidAmount,
  getTablePaidSeats,
  getTableRemainingBalance,
} from '../utils/calculations';

/**
 * Provides payment-tracking helpers for a specific table.
 * @param {number|string} tableId
 */
export function usePayments(tableId) {
  const { tablePayments, tableStates } = usePOS();

  const paidAmount = useMemo(
    () => getTablePaidAmount(tablePayments, tableId),
    [tablePayments, tableId]
  );

  const paidSeats = useMemo(
    () => getTablePaidSeats(tablePayments, tableId),
    [tablePayments, tableId]
  );

  const remainingBalance = useMemo(
    () => getTableRemainingBalance(tableStates, tablePayments, tableId),
    [tableStates, tablePayments, tableId]
  );

  const getSeatPaidAmount = useCallback(
    (seatNum) => getTableSeatPaidAmount(tablePayments, tableId, seatNum),
    [tablePayments, tableId]
  );

  const hasPartialPayment = (tablePayments[tableId]?.payments || []).length > 0;

  return { paidAmount, paidSeats, remainingBalance, getSeatPaidAmount, hasPartialPayment };
}
