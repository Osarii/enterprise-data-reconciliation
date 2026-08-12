import type { ReactNode } from 'react';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import {
  CheckCircle2,
  Database,
  HardDrive,
  Moon,
  Sun,
  Trash2,
} from 'lucide-react';

import { useReconciliation } from '../../context/ReconciliationContext';
import { useThemeMode } from '../../context/ThemeModeContext';

export default function Settings() {
  const {
    erpData,
    crmData,
    reconciliationResult,
    persistenceStatus,
    persistenceError,
    lastSavedAt,
    restoredFromStorage,
    clearData,
  } = useReconciliation();

  const {
    mode,
    setMode,
  } = useThemeMode();

  const hasWorkspaceData = Boolean(
    erpData ||
      crmData ||
      reconciliationResult
  );

  const handleClearWorkspace = () => {
    const shouldClear = window.confirm(
      'Clear the current ERP/CRM workspace, reconciliation result, review progress and persisted browser data?'
    );

    if (shouldClear) {
      clearData();
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontSize: '1.75rem' }}
        >
          Settings
        </Typography>

        <Typography
          sx={{
            mt: 0.6,
            color: 'text.secondary',
            fontSize: '0.86rem',
          }}
        >
          Manage appearance and local workspace persistence for this browser.
        </Typography>
      </Box>

      <Stack spacing={2.5}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
                mb: 2.5,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  Appearance
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.82rem',
                  }}
                >
                  Your selected theme is remembered on this device.
                </Typography>
              </Box>

              <Chip
                size="small"
                label={
                  mode === 'dark'
                    ? 'Dark mode'
                    : 'Light mode'
                }
                sx={{
                  fontWeight: 650,
                  backgroundColor: 'var(--primary-soft)',
                  color: 'primary.main',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              <ThemeChoice
                active={mode === 'light'}
                title="Light"
                description="Original light enterprise workspace."
                icon={<Sun size={20} />}
                onClick={() => setMode('light')}
              />

              <ThemeChoice
                active={mode === 'dark'}
                title="Dark"
                description="Low-glare night workspace for long sessions."
                icon={<Moon size={20} />}
                onClick={() => setMode('dark')}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  Workspace Persistence
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.82rem',
                    maxWidth: 760,
                  }}
                >
                  ERP/CRM imports, the latest reconciliation and exception review progress are automatically saved in this browser.
                </Typography>
              </Box>

              <Chip
                size="small"
                icon={<CheckCircle2 size={14} />}
                label={
                  persistenceStatus === 'saved'
                    ? 'Auto-save active'
                    : 'Persistence issue'
                }
                sx={{
                  fontWeight: 650,
                  backgroundColor:
                    persistenceStatus === 'saved'
                      ? 'var(--success-soft)'
                      : 'var(--danger-soft)',
                  color:
                    persistenceStatus === 'saved'
                      ? 'var(--success-fg)'
                      : 'var(--danger-fg)',

                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              <PersistenceMetric
                label="ERP Dataset"
                value={erpData?.fileName ?? 'Not loaded'}
                icon={<Database size={17} />}
              />

              <PersistenceMetric
                label="CRM Dataset"
                value={crmData?.fileName ?? 'Not loaded'}
                icon={<Database size={17} />}
              />

              <PersistenceMetric
                label="Reconciliation"
                value={
                  reconciliationResult
                    ? 'Saved'
                    : 'Not available'
                }
                icon={<HardDrive size={17} />}
              />

              <PersistenceMetric
                label="Last Saved"
                value={formatSavedAt(lastSavedAt)}
                icon={<CheckCircle2 size={17} />}
              />
            </Box>

            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: '14px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 650,
                  fontSize: '0.82rem',
                }}
              >
                Persistence scope
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.78rem',
                  lineHeight: 1.55,
                }}
              >
                This V0.1.4 frontend persists the current workspace with browser localStorage. It is intentionally device-local and is not a replacement for the PostgreSQL-backed persistence planned for V0.2.
              </Typography>

              {restoredFromStorage && (
                <Typography
                  sx={{
                    mt: 1,
                    color: 'primary.main',
                    fontSize: '0.76rem',
                    fontWeight: 650,
                  }}
                >
                  This session restored a previously saved workspace.
                </Typography>
              )}

              {persistenceError && (
                <Typography
                  sx={{
                    mt: 1,
                    color: 'error.main',
                    fontSize: '0.76rem',
                    fontWeight: 650,
                  }}
                >
                  {persistenceError}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                mt: 2.5,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={17} />}
                disabled={!hasWorkspaceData}
                onClick={handleClearWorkspace}
              >
                Clear workspace data
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

interface ThemeChoiceProps {
  active: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

function ThemeChoice({
  active,
  title,
  description,
  icon,
  onClick,
}: ThemeChoiceProps) {
  return (
    <Button
      onClick={onClick}
      variant="outlined"
      sx={{
        minHeight: 104,
        p: 2,
        justifyContent: 'flex-start',
        textAlign: 'left',
        color: 'text.primary',
        borderColor: active
          ? 'primary.main'
          : 'divider',
        backgroundColor: active
          ? 'var(--primary-soft)'
          : 'var(--surface-subtle)',

        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: active
            ? 'var(--primary-soft)'
            : 'action.hover',
        },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 1.5,
          backgroundColor: active
            ? 'primary.main'
            : 'background.paper',
          color: active
            ? '#FFFFFF'
            : 'text.secondary',
          border: '1px solid',
          borderColor: active
            ? 'primary.main'
            : 'divider',
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.35,
            color: 'text.secondary',
            fontSize: '0.76rem',
            lineHeight: 1.45,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Button>
  );
}

interface PersistenceMetricProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function PersistenceMetric({
  label,
  value,
  icon,
}: PersistenceMetricProps) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: '14px',
        backgroundColor: 'var(--surface-subtle)',
        border: '1px solid',
        borderColor: 'divider',
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          color: 'text.secondary',
        }}
      >
        {icon}

        <Typography
          sx={{
            fontSize: '0.69rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Typography>
      </Box>

      <Typography
        title={value}
        sx={{
          mt: 1,
          fontSize: '0.83rem',
          fontWeight: 650,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function formatSavedAt(value: string | null): string {
  if (!value) {
    return 'Not saved yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Saved';
  }

  return date.toLocaleString();
}
