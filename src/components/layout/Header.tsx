import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
} from '@mui/material';

import { Bell, Search } from 'lucide-react';

export default function Header() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255,255,255,0.82)',
        color: 'text.primary',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: '72px !important',
          gap: 2,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'text.secondary',
            }}
          >
            Operations Data Platform
          </Typography>

          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 650,
            }}
          >
            Enterprise Data Reconciliation
          </Typography>
        </Box>

        <Box
          sx={{
            width: 330,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.07)',
            backgroundColor: '#F5F5F7',
          }}
        >
          <Search size={17} color="#6E6E73" />

          <InputBase
            placeholder="Search records, fields or imports..."
            sx={{
              ml: 1,
              flex: 1,
              fontSize: '0.85rem',
            }}
          />
        </Box>

        <IconButton>
          <Bell size={20} />
        </IconButton>

        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: '#1D1D1F',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          JP
        </Avatar>
      </Toolbar>
    </AppBar>
  );
}