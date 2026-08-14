import { Suspense, useState } from 'react';

import {
  Alert,
  Box,
} from '@mui/material';

import { Outlet } from 'react-router-dom';

import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import PageLoader from '../components/common/PageLoader';
import RouteAnnouncer from '../components/common/RouteAnnouncer';

import { useReconciliation } from '../context/ReconciliationContext';

export default function MainLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  const {
    persistenceStatus,
    persistenceError,
    persistenceMode,
  } = useReconciliation();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <RouteAnnouncer />

      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Sidebar
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
        />

        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { xs: '100%', md: 'auto' },
          }}
        >
          <Header
            onOpenNavigation={() => setMobileNavigationOpen(true)}
          />

          <Box
            component="main"
            id="main-content"
            tabIndex={-1}
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
                md: 4,
              },
            }}
          >
            {persistenceStatus === 'limited' &&
              persistenceMode === 'summary-only' && (
                <Alert severity="info" sx={{ mb: 2.5 }}>
                  Large Dataset Mode is active. Current ERP/CRM records and the latest reconciliation remain in memory to avoid blocking or exhausting localStorage. Compact history, mappings and reconciliation rules are still saved. Refreshing the page will discard the current large datasets.
                </Alert>
              )}

            {persistenceStatus === 'error' && persistenceError && (
              <Alert severity="warning" sx={{ mb: 2.5 }}>
                {persistenceError}
              </Alert>
            )}

            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </Box>
        </Box>
      </Box>
    </>
  );
}
