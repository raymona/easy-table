import { useEffect, useRef } from 'react';
import { usePOS, POS_ACTIONS } from '../context';
import { useAuth } from '../context/AuthContext';
import * as posApi from '../services/posApi';
import {
  transformSessionsToState,
  transformTabsToState,
  transformAdminConfig,
  transformServiceConfig,
} from '../services/posTransforms';

/**
 * Invisible component that hydrates local state from the backend on mount.
 * Only runs when backend is enabled and user is authenticated.
 */
export default function BackendSync() {
  const { dispatch } = usePOS();
  const { backendEnabled, isAuthenticated, venue } = useAuth();
  const hydrated = useRef(false);

  useEffect(() => {
    if (!backendEnabled || !isAuthenticated || hydrated.current) return;
    hydrated.current = true;

    async function hydrate() {
      try {
        const [tablesData, tabsData, billsData] = await Promise.all([
          posApi.fetchOpenTables(),
          posApi.fetchOpenTabs(),
          posApi.fetchClosedBills(),
        ]);

        const { tableStates, tablePayments, sessionMap, itemIdMap } =
          transformSessionsToState(tablesData.sessions || []);

        const { tabStates, tabSessionMap, itemIdMap: tabItemIdMap } =
          transformTabsToState(tabsData.tabs || []);

        // Admin config comes from the venue object already loaded in AuthContext
        const adminConfig = venue ? transformAdminConfig(venue) : undefined;
        const serviceConfig = venue?.serviceConfigs
          ? transformServiceConfig(venue.serviceConfigs)
          : undefined;

        dispatch({
          type: POS_ACTIONS.HYDRATE_FROM_BACKEND,
          payload: {
            tableStates,
            tabStates,
            tablePayments,
            closedBills: billsData.bills || [],
            sessionMap,
            tabSessionMap,
            itemIdMap: { ...itemIdMap, ...tabItemIdMap },
            adminConfig,
            serviceConfig,
          },
        });
      } catch (err) {
        console.error('BackendSync hydration failed:', err);
      }
    }

    hydrate();
  }, [backendEnabled, isAuthenticated, venue, dispatch]);

  return null;
}
