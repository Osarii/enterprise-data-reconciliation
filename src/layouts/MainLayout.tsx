import {
  Alert,
  Box,
} from '@mui/material';

import { Outlet } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

import { useReconciliation } from '../context/ReconciliationContext';

export default function MainLayout() {
  const {
    persistenceStatus,
    persistenceError,
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
          {persistenceStatus === 'error' && persistenceError && (
            <Alert
              severity="warning"
              sx={{ mb: 2.5 }}
            >
              {persistenceError}
            </Alert>
          )}

          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
