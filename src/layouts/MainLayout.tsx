import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function MainLayout() {
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
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}