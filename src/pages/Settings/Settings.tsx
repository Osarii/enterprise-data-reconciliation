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
  GitMerge,
  HardDrive,
  History,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
} from 'lucide-react';

import {
  CANONICAL_FIELDS,
} from '../../config/fieldMappingConfig';

import {
  useReconciliation,
} from '../../context/ReconciliationContext';

import {
  useThemeMode,
} from '../../context/ThemeModeContext';

import type {
  FieldMapping,
} from '../../types/FieldMapping';

export default function Settings() {
  const {
    erpData,
    crmData,
    reconciliationResult,
    reconciliationHistory,
    fieldMappings,
    persistenceStatus,
    persistenceError,
    lastSavedAt,
    restoredFromStorage,
    clearData,
    clearHistory,
    resetFieldMappings,
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

  const hasHistory = reconciliationHistory.length > 0;

  const handleClearWorkspace = () => {
    const shouldClear = window.confirm(
      'Clear the current ERP/CRM workspace, latest reconciliation and review progress? Reconciliation history and saved field-mapping profiles will be preserved.'
    );

    if (shouldClear) {
      clearData();
    }
  };

  const handleClearHistory = () => {
    const shouldClear = window.confirm(
      'Delete all locally stored reconciliation history? The current workspace will remain available.'
    );

    if (shouldClear) {
      clearHistory();
    }
  };

  const handleResetMappings = () => {
    const shouldReset = window.confirm(
      'Reset the saved ERP and CRM field-mapping profiles to id, cliente, monto and estado? Existing imported datasets and historical snapshots will not be changed.'
    );

    if (shouldReset) {
      resetFieldMappings();
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
          Manage appearance, field-mapping profiles, browser persistence and reconciliation history.
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
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.9,
                  }}
                >
                  <GitMerge size={18} />
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    Field Mapping Profiles
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.82rem',
                    maxWidth: 780,
                  }}
                >
                  The most recently applied ERP and CRM mappings are persisted and reused as suggestions when compatible source columns are detected.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RotateCcw size={16} />}
                onClick={handleResetMappings}
              >
                Reset mappings
              </Button>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'repeat(2, minmax(0, 1fr))',
                },
                gap: 1.5,
              }}
            >
              <MappingProfileCard
                title="ERP Mapping"
                mapping={fieldMappings.erp}
              />

              <MappingProfileCard
                title="CRM Mapping"
                mapping={fieldMappings.crm}
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
                    maxWidth: 780,
                  }}
                >
                  ERP/CRM imports, mapped schema metadata, the latest reconciliation, exception review progress and compact reconciliation history are automatically saved in this browser.
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
                  sm: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(5, minmax(0, 1fr))',
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
                label="History Runs"
                value={String(reconciliationHistory.length)}
                icon={<History size={17} />}
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
                V0.1.6 persists the active workspace, reusable field-mapping profiles and compact historical reconciliation snapshots with browser localStorage. Historical entries keep summary-level metrics and mapping metadata rather than duplicating every raw record. Audit-grade persistence will move to PostgreSQL in V0.2.
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
                  This session restored previously saved browser data.
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
                gap: 1.25,
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                color="error"
                startIcon={<History size={17} />}
                disabled={!hasHistory}
                onClick={handleClearHistory}
              >
                Clear history
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={17} />}
                disabled={!hasWorkspaceData}
                onClick={handleClearWorkspace}
              >
                Clear current workspace
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

interface MappingProfileCardProps {
  title: string;
  mapping: FieldMapping;
}

function MappingProfileCard({
  title,
  mapping,
}: MappingProfileCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '14px',
        backgroundColor: 'var(--surface-subtle)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.8rem',
        }}
      >
        {title}
      </Typography>

      <Box
        sx={{
          mt: 1.25,
          display: 'grid',
          gap: 0.7,
        }}
      >
        {CANONICAL_FIELDS.map((field) => (
          <Box
            key={field}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              py: 0.4,
            }}
          >
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              {field}
            </Typography>

            <Chip
              size="small"
              label={mapping[field] || 'Not mapped'}
              sx={{
                maxWidth: '70%',
                fontWeight: 650,
                backgroundColor: 'var(--primary-soft)',
                color: 'primary.main',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          </Box>
        ))}
      </Box>
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
