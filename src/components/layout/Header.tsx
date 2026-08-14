import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
} from 'lucide-react';

import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { searchNavigation } from '../../config/navigationConfig';

import { useReconciliation } from '../../context/ReconciliationContext';
import { useThemeMode } from '../../context/ThemeModeContext';

interface HeaderProps {
  onOpenNavigation: () => void;
}

export default function Header({ onOpenNavigation }: HeaderProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

  const {
    erpData,
    crmData,
    reconciliationResult,
    persistenceStatus,
    persistenceMode,
  } = useReconciliation();

  const isDark = mode === 'dark';

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);

  const searchAnchorRef = useRef<HTMLDivElement | null>(null);

  const navigationResults = useMemo(
    () => searchNavigation(query),
    [query]
  );

  const blockingIssues = useMemo(() => {
    const issues = [
      ...(erpData?.issues ?? []),
      ...(crmData?.issues ?? []),
    ];

    return issues.filter((issue) => issue.severity === 'BLOCKING').length;
  }, [erpData, crmData]);

  const exceptionCount = reconciliationResult
    ? reconciliationResult.summary.differences +
      reconciliationResult.summary.onlyERP +
      reconciliationResult.summary.onlyCRM
    : 0;

  const storageNeedsAttention =
    persistenceStatus !== 'saved' || persistenceMode === 'summary-only';

  const notificationCount =
    blockingIssues + exceptionCount + (storageNeedsAttention ? 1 : 0);

  const goTo = (path: string) => {
    setSearchOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      return;
    }

    if (event.key === 'Enter' && navigationResults.length > 0) {
      event.preventDefault();
      goTo(navigationResults[0].path);
    }
  };

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
          minHeight: { xs: '64px !important', md: '72px !important' },
          gap: { xs: 1, sm: 1.5, md: 2 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Tooltip title="Open navigation">
          <IconButton
            onClick={onOpenNavigation}
            aria-label="Open workspace navigation"
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <Menu size={20} />
          </IconButton>
        </Tooltip>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.72rem',
              color: 'text.secondary',
            }}
          >
            Operations Data Platform
          </Typography>

          <Typography
            noWrap
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontWeight: 650,
            }}
          >
            Enterprise Data Reconciliation
          </Typography>
        </Box>

        <Box
          ref={searchAnchorRef}
          sx={{
            width: { sm: 250, lg: 330 },
            height: 42,
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            px: 1.5,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: searchOpen ? 'primary.main' : 'divider',
            backgroundColor: 'action.hover',
          }}
        >
          <Search
            size={17}
            color={theme.palette.text.secondary}
            aria-hidden="true"
          />

          <InputBase
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Jump to a page or workflow..."
            slotProps={{
              input: {
                'aria-label': 'Search workspace navigation',
                'aria-expanded': searchOpen,
                'aria-controls': searchOpen
                  ? 'workspace-search-results'
                  : undefined,
              },
            }}
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

        <Popover
          open={searchOpen && Boolean(searchAnchorRef.current)}
          anchorEl={searchAnchorRef.current}
          onClose={() => setSearchOpen(false)}
          disableAutoFocus
          disableEnforceFocus
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              id: 'workspace-search-results',
              sx: {
                width: searchAnchorRef.current?.clientWidth ?? 330,
                mt: 1,
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          }}
        >
          <Box sx={{ px: 1.5, pt: 1.25, pb: 0.5 }}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'text.secondary',
                letterSpacing: '0.06em',
              }}
            >
              QUICK NAVIGATION
            </Typography>
          </Box>

          <List dense sx={{ pt: 0.5, pb: 1 }}>
            {navigationResults.length > 0 ? (
              navigationResults.map((item) => (
                <ListItemButton
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  sx={{ mx: 0.75, borderRadius: '10px' }}
                >
                  <ListItemText
                    primary={item.label}
                    secondary={item.description}
                    slotProps={{
                      primary: { sx: { fontSize: '0.86rem', fontWeight: 600 } },
                      secondary: { sx: { fontSize: '0.72rem' } },
                    }}
                  />
                </ListItemButton>
              ))
            ) : (
              <Box sx={{ px: 2, py: 2 }}>
                <Typography color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                  No workspace page matches “{query}”.
                </Typography>
              </Box>
            )}
          </List>
        </Popover>

        <Tooltip
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <IconButton
            onClick={toggleMode}
            aria-label={
              isDark ? 'Switch to light mode' : 'Switch to dark mode'
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
            {isDark ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Workspace alerts">
          <IconButton
            aria-label={`Workspace alerts${notificationCount ? `, ${notificationCount} items` : ''}`}
            onClick={(event) => setNotificationAnchor(event.currentTarget)}
          >
            <Badge
              color="error"
              badgeContent={notificationCount}
              max={99}
              invisible={notificationCount === 0}
            >
              <Bell size={20} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={Boolean(notificationAnchor)}
          anchorEl={notificationAnchor}
          onClose={() => setNotificationAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                width: 'min(360px, calc(100vw - 24px))',
                mt: 1,
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              Workspace alerts
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.78rem' }}>
              Current validation, exception and persistence signals.
            </Typography>
          </Box>

          <Divider />

          {notificationCount === 0 ? (
            <Box sx={{ p: 2 }}>
              <Chip size="small" color="success" label="No active alerts" />
            </Box>
          ) : (
            <List dense sx={{ py: 1 }}>
              {blockingIssues > 0 && (
                <ListItemButton
                  onClick={() => {
                    setNotificationAnchor(null);
                    navigate('/imports');
                  }}
                >
                  <ListItemText
                    primary={`${blockingIssues} blocking data-quality issue${blockingIssues === 1 ? '' : 's'}`}
                    secondary="Resolve validation issues before reconciliation."
                  />
                </ListItemButton>
              )}

              {exceptionCount > 0 && (
                <ListItemButton
                  onClick={() => {
                    setNotificationAnchor(null);
                    navigate('/exceptions');
                  }}
                >
                  <ListItemText
                    primary={`${exceptionCount} reconciliation exception${exceptionCount === 1 ? '' : 's'}`}
                    secondary="Review differences and source-only records."
                  />
                </ListItemButton>
              )}

              {storageNeedsAttention && (
                <ListItemButton
                  onClick={() => {
                    setNotificationAnchor(null);
                    navigate('/settings');
                  }}
                >
                  <ListItemText
                    primary={
                      persistenceMode === 'summary-only'
                        ? 'Large Dataset Mode is active'
                        : 'Workspace persistence needs attention'
                    }
                    secondary="Open Settings to review browser storage status."
                  />
                </ListItemButton>
              )}
            </List>
          )}
        </Popover>

        <Avatar
          aria-label="User profile"
          sx={{
            width: 38,
            height: 38,
            bgcolor: isDark ? 'primary.main' : 'text.primary',
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