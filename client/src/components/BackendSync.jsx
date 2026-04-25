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

  // Reset hydration flag on logout so re-login triggers a fresh hydrate
  useEffect(() => {
    if (!isAuthenticated) hydrated.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!backendEnabled || !isAuthenticated || hydrated.current) return;
    hydrated.current = true;

    async function hydrate() {
      try {
        const [tablesData, tabsData, billsData, configData] = await Promise.all([
          posApi.fetchOpenTables(),
          posApi.fetchOpenTabs(),
          posApi.fetchClosedBills(),
          posApi.fetchAdminConfig(),
        ]);

        const { tableStates, tablePayments, sessionMap, itemIdMap } =
          transformSessionsToState(tablesData.sessions || []);

        const { tabStates, tabSessionMap, itemIdMap: tabItemIdMap } =
          transformTabsToState(tabsData.tabs || []);

        const venueConfig = configData.config || venue;
        const adminConfig = venueConfig ? transformAdminConfig(venueConfig) : undefined;
        const serviceConfig = venueConfig?.serviceConfigs
          ? transformServiceConfig(venueConfig.serviceConfigs)
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
