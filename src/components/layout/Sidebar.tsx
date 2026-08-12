import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import {
  LayoutDashboard,
  Upload,
  GitCompareArrows,
  TriangleAlert,
  ChartNoAxesCombined,
  History,
  Settings,
  Database,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const drawerWidth = 250;

const menuItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Imports',
    path: '/imports',
    icon: Upload,
  },
  {
    label: 'Reconciliation',
    path: '/reconciliation',
    icon: GitCompareArrows,
  },
  {
    label: 'Exceptions',
    path: '/exceptions',
    icon: TriangleAlert,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'History',
    path: '/history',
    icon: History,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,

        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          padding: '20px 14px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Database size={20} />
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Enterprise
          </Typography>

          <Typography
            sx={{
              fontSize: '0.72rem',
              color: 'text.secondary',
            }}
          >
            Reconciliation
          </Typography>
        </Box>
      </Box>

      <Typography
        sx={{
          px: 2,
          mb: 1,
          color: 'text.secondary',
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        WORKSPACE
      </Typography>

      <List
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              sx={{
                borderRadius: '12px',
                minHeight: 44,
                px: 1.5,
                color: 'text.secondary',

                '&.active': {
                  backgroundColor: 'var(--primary-soft)',
                  color: 'primary.main',

                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },

                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: 'inherit',
                }}
              >
                <Icon size={19} strokeWidth={1.8} />
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.88rem',
                      fontWeight: 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
