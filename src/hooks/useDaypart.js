import { useEffect, useRef } from 'react';
import { usePOS, POS_ACTIONS } from '../context';
import { getDaypartFromConfig } from '../utils/calculations';

/**
 * Auto-switches daypart based on serviceConfig times. Call once at the app root.
 * Runs immediately on mount, then rechecks every minute.
 */
export function useDaypart() {
  const { state, dispatch } = usePOS();
  const { daypart, serviceConfig } = state;

  // Keep a ref so the interval always reads the latest daypart
  // without making it a dependency of the interval effect
  const daypartRef = useRef(daypart);
  useEffect(() => { daypartRef.current = daypart; }, [daypart]);

  useEffect(() => {
    const check = () => {
      const next = getDaypartFromConfig(serviceConfig);
      if (next !== daypartRef.current) {
        dispatch({ type: POS_ACTIONS.SET_DAYPART, daypart: next });
      }
    };
    check(); // initial check on mount only
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [serviceConfig, dispatch]); // daypart removed — ref used instead
}
