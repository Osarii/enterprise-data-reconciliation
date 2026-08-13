import { Suspense } from 'react';

import {
  Alert,
  Box,
} from '@mui/material';

import { Outlet } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import PageLoader from '../components/common/PageLoader';

import { useReconciliation } from '../context/ReconciliationContext';

export default function MainLayout() {
  const {
    persistenceStatus,
    persistenceError,
    persistenceMode,
  } = useReconciliation();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
        }}
      >
        <Header />

        <Box
          component="main"
          sx={{
            p: {
              xs: 2,
              md: 4,
            },
          }}
        >
          {persistenceStatus === 'limited' &&
            persistenceMode === 'summary-only' && (
              <Alert
                severity="info"
                sx={{ mb: 2.5 }}
              >
                Large Dataset Mode is active. Current ERP/CRM records and the latest reconciliation remain in memory to avoid blocking or exhausting localStorage. Compact history, mappings and reconciliation rules are still saved. Refreshing the page will discard the current large datasets.
              </Alert>
            )}

          {persistenceStatus === 'error' && persistenceError && (
            <Alert
              severity="warning"
              sx={{ mb: 2.5 }}
            >
              {persistenceError}
            </Alert>
          )}

          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </Box>
  );
}
