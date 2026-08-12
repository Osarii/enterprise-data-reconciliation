import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  Bell,
  Moon,
  Search,
  Sun,
} from 'lucide-react';

import { useTheme } from '@mui/material/styles';

import { useThemeMode } from '../../context/ThemeModeContext';

export default function Header() {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();

  const isDark = mode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: isDark
          ? 'rgba(22,22,28,0.86)'
          : 'rgba(255,255,255,0.82)',
        color: 'text.primary',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
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
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'action.hover',
          }}
        >
          <Search
            size={17}
            color={theme.palette.text.secondary}
          />

          <InputBase
            placeholder="Search records, fields or imports..."
            sx={{
              ml: 1,
              flex: 1,
              fontSize: '0.85rem',
              color: 'text.primary',

              '& input::placeholder': {
                color: 'text.secondary',
                opacity: 1,
              },
            }}
          />
        </Box>

        <Tooltip
          title={
            isDark
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
        >
          <IconButton
            onClick={toggleMode}
            aria-label={
              isDark
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',

              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {isDark ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </IconButton>
        </Tooltip>

        <IconButton>
          <Bell size={20} />
        </IconButton>

        <Avatar
          sx={{
            width: 38,
            height: 38,
            bgcolor: isDark
              ? 'primary.main'
              : 'text.primary',
            color: '#FFFFFF',
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
