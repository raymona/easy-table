import { useEffect, useRef } from 'react';
import { usePOS } from '../context';
import { usePOSActions } from './usePOSActions';

/**
 * Auto-signs out the current staff member after a period of inactivity.
 * Watches for touch, mouse, and keyboard events. Resets the timer on any activity.
 * Timeout is configured via adminConfig.autoSignOutMinutes (0 = disabled).
 */
export function useInactivityTimeout() {
  const { state } = usePOS();
  const actions = usePOSActions();
  const timerRef = useRef(null);

  const minutes = state.adminConfig?.autoSignOutMinutes ?? 2;
  const isSignedIn = !!state.currentServer;

  useEffect(() => {
    if (!isSignedIn || minutes <= 0) return;

    const ms = minutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        actions.signOut();
      }, ms);
    };

    const events = ['pointerdown', 'keydown', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start the clock

    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [isSignedIn, minutes, actions]);
}
