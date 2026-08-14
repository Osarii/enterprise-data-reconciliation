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
  ChartNoAxesCombined,
  Database,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Settings,
  TriangleAlert,
  Upload,
  type LucideIcon,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

import {
  NAVIGATION_ITEMS,
  type NavigationIconKey,
} from '../../config/navigationConfig';

const drawerWidth = 250;

const iconMap: Record<NavigationIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  imports: Upload,
  reconciliation: GitCompareArrows,
  exceptions: TriangleAlert,
  reports: ChartNoAxesCombined,
  history: History,
  settings: Settings,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
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
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Database size={20} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
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
        component="nav"
        aria-label="Workspace navigation"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.iconKey];

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
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
                secondary={item.description}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.88rem',
                      fontWeight: 500,
                    },
                  },
                  secondary: {
                    sx: {
                      display: { xs: 'block', md: 'none' },
                      mt: 0.25,
                      fontSize: '0.72rem',
                      lineHeight: 1.35,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}

export default function Sidebar({
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const paperSx = {
    width: drawerWidth,
    boxSizing: 'border-box',
    borderRight: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    padding: '20px 14px',
  } as const;

  return (
    <Box
      component="aside"
      aria-label="Primary workspace navigation"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': paperSx,
        }}
      >
        <SidebarContent onNavigate={onMobileClose} />
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': paperSx,
        }}
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}
