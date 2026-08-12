import {
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  BarChart3,
  CalendarClock,
  Database,
  Eye,
  History as HistoryIcon,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import {
  RECONCILIATION_HISTORY_LIMIT,
} from '../../config/storageConfig';

import {
  useReconciliation,
} from '../../context/ReconciliationContext';

import type {
  ReconciliationHistoryEntry,
} from '../../types/ReconciliationHistory';

import {
  calculateAverageHistoryMatchRate,
  calculateAverageHistoryQuality,
  calculateBestHistoryMatchRate,
  getHistoryEntryAverageQuality,
} from '../../utils/reconciliationHistory';

export default function History() {
  const {
    reconciliationHistory,
    deleteHistoryEntry,
    clearHistory,
  } = useReconciliation();

  const [selectedEntryId, setSelectedEntryId] =
    useState<string | null>(
      reconciliationHistory[0]?.id ?? null
    );

  const selectedEntry = useMemo(
    () =>
      reconciliationHistory.find(
        (entry) => entry.id === selectedEntryId
      ) ??
      reconciliationHistory[0] ??
      null,
    [reconciliationHistory, selectedEntryId]
  );

  const averageMatchRate =
    calculateAverageHistoryMatchRate(
      reconciliationHistory
    );

  const bestMatchRate =
    calculateBestHistoryMatchRate(
      reconciliationHistory
    );

  const averageQuality =
    calculateAverageHistoryQuality(
      reconciliationHistory
    );

  const handleDeleteEntry = (
    entry: ReconciliationHistoryEntry
  ) => {
    const shouldDelete = window.confirm(
      `Delete the reconciliation history entry from ${formatDate(
        entry.executedAt
      )}?`
    );

    if (!shouldDelete) {
      return;
    }

    deleteHistoryEntry(entry.id);

    if (selectedEntryId === entry.id) {
      setSelectedEntryId(null);
    }
  };

  const handleClearHistory = () => {
    const shouldClear = window.confirm(
      'Delete all locally stored reconciliation history? The current workspace and latest reconciliation will remain available.'
    );

    if (!shouldClear) {
      return;
    }

    clearHistory();
    setSelectedEntryId(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: '1.75rem',
            }}
          >
            Reconciliation History
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              color: 'text.secondary',
              fontSize: '0.86rem',
            }}
          >
            Review locally persisted reconciliation runs and their executive metrics.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Trash2 size={17} />}
          disabled={reconciliationHistory.length === 0}
          onClick={handleClearHistory}
          sx={{
            alignSelf: 'flex-start',
          }}
        >
          Clear History
        </Button>
      </Box>

      <Alert
        severity="info"
        icon={<HistoryIcon size={19} />}
        sx={{
          mb: 2.5,
          borderRadius: '14px',
        }}
      >
        V0.1.5 stores compact reconciliation snapshots in this browser and retains the latest {RECONCILIATION_HISTORY_LIMIT} runs. Full audit-grade history will move to PostgreSQL in the backend phase.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <MetricCard
          label="Total Runs"
          value={String(reconciliationHistory.length)}
          detail={`Latest ${RECONCILIATION_HISTORY_LIMIT} retained locally`}
          icon={<HistoryIcon size={18} />}
        />

        <MetricCard
          label="Average Match Rate"
          value={`${averageMatchRate.toFixed(1)}%`}
          detail="Across saved reconciliation runs"
          icon={<BarChart3 size={18} />}
        />

        <MetricCard
          label="Best Match Rate"
          value={`${bestMatchRate.toFixed(1)}%`}
          detail="Highest historical result"
          icon={<Sparkles size={18} />}
        />

        <MetricCard
          label="Average Data Quality"
          value={`${averageQuality.toFixed(1)}%`}
          detail="Average ERP and CRM quality"
          icon={<Database size={18} />}
        />
      </Box>

      {reconciliationHistory.length === 0 ? (
        <Card>
          <CardContent
            sx={{
              p: '34px !important',
            }}
          >
            <Box
              sx={{
                maxWidth: 620,
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--primary-soft)',
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                <CalendarClock size={24} />
              </Box>

              <Typography
                variant="h6"
                sx={{ fontWeight: 650 }}
              >
                No reconciliation history yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  color: 'text.secondary',
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                }}
              >
                Each successful reconciliation will create a compact historical snapshot containing dataset metadata, quality scores and reconciliation metrics.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 2.5 }}>
            <CardContent
              sx={{
                p: '0 !important',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 2.2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  Saved Runs
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: 'text.secondary',
                    fontSize: '0.78rem',
                  }}
                >
                  Newest runs appear first. History entries are immutable snapshots unless explicitly deleted.
                </Typography>
              </Box>

              <Box sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 1020 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Executed</TableCell>
                      <TableCell>ERP Dataset</TableCell>
                      <TableCell>CRM Dataset</TableCell>
                      <TableCell>Match Rate</TableCell>
                      <TableCell>Matched</TableCell>
                      <TableCell>Exceptions</TableCell>
                      <TableCell>Avg. Quality</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {reconciliationHistory.map((entry) => {
                      const isSelected = selectedEntry?.id === entry.id;

                      return (
                        <TableRow
                          key={entry.id}
                          hover
                          sx={{
                            backgroundColor: isSelected
                              ? 'var(--primary-soft)'
                              : 'transparent',
                          }}
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 650,
                                fontSize: '0.8rem',
                              }}
                            >
                              {formatDate(entry.executedAt)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <DatasetCell
                              fileName={entry.erpDataset.fileName}
                              rows={entry.erpDataset.totalRows}
                            />
                          </TableCell>

                          <TableCell>
                            <DatasetCell
                              fileName={entry.crmDataset.fileName}
                              rows={entry.crmDataset.totalRows}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 750,
                                fontSize: '0.84rem',
                              }}
                            >
                              {entry.summary.matchRate.toFixed(1)}%
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {entry.summary.matched}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={entry.exceptionCount}
                              sx={{
                                minWidth: 38,
                                fontWeight: 700,
                                backgroundColor:
                                  entry.exceptionCount === 0
                                    ? 'var(--success-soft)'
                                    : 'var(--warning-soft)',
                                color:
                                  entry.exceptionCount === 0
                                    ? 'var(--success-fg)'
                                    : 'var(--warning-fg)',
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            {getHistoryEntryAverageQuality(entry).toFixed(1)}%
                          </TableCell>

                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 1,
                              }}
                            >
                              <Button
                                size="small"
                                variant={isSelected ? 'contained' : 'outlined'}
                                startIcon={<Eye size={15} />}
                                onClick={() => setSelectedEntryId(entry.id)}
                              >
                                View
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleDeleteEntry(entry)}
                                sx={{
                                  minWidth: 40,
                                  px: 1,
                                }}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          {selectedEntry && (
            <HistoryDetail entry={selectedEntry} />
          )}
        </>
      )}
    </Box>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: '20px !important' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              {label}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                fontSize: '1.55rem',
                fontWeight: 750,
                letterSpacing: '-0.03em',
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              {detail}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary-soft)',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface DatasetCellProps {
  fileName: string;
  rows: number;
}

function DatasetCell({
  fileName,
  rows,
}: DatasetCellProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 650,
          fontSize: '0.8rem',
          maxWidth: 210,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={fileName}
      >
        {fileName}
      </Typography>

      <Typography
        sx={{
          mt: 0.25,
          color: 'text.secondary',
          fontSize: '0.7rem',
        }}
      >
        {rows} rows
      </Typography>
    </Box>
  );
}

interface HistoryDetailProps {
  entry: ReconciliationHistoryEntry;
}

function HistoryDetail({
  entry,
}: HistoryDetailProps) {
  return (
    <Card>
      <CardContent sx={{ p: '26px !important' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
              }}
            >
              Run Detail
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: 'text.secondary',
                fontSize: '0.78rem',
              }}
            >
              Snapshot captured {formatDate(entry.executedAt)}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${entry.summary.matchRate.toFixed(1)}% match rate`}
            sx={{
              backgroundColor: 'var(--primary-soft)',
              color: 'primary.main',
              fontWeight: 700,
            }}
          />
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '1fr 1fr',
            },
            gap: 1.5,
          }}
        >
          <DatasetSnapshotCard
            title="ERP Snapshot"
            dataset={entry.erpDataset}
          />

          <DatasetSnapshotCard
            title="CRM Snapshot"
            dataset={entry.crmDataset}
          />
        </Box>

        <Box
          sx={{
            mt: 2,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
              xl: 'repeat(7, minmax(0, 1fr))',
            },
            gap: 1,
          }}
        >
          <DetailMetric label="Unique" value={entry.summary.totalUnique} />
          <DetailMetric label="Matched" value={entry.summary.matched} />
          <DetailMetric label="Exact" value={entry.summary.exactMatched} />
          <DetailMetric label="Normalized" value={entry.summary.normalizedMatched} />
          <DetailMetric label="Differences" value={entry.summary.differences} />
          <DetailMetric label="Only ERP" value={entry.summary.onlyERP} />
          <DetailMetric label="Only CRM" value={entry.summary.onlyCRM} />
        </Box>

        {entry.exceptionCount > 0 && (
          <Alert
            severity="warning"
            icon={<TriangleAlert size={18} />}
            sx={{
              mt: 2,
              borderRadius: '12px',
            }}
          >
            This run produced {entry.exceptionCount} reconciliation exception{entry.exceptionCount === 1 ? '' : 's'}.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface DatasetSnapshotCardProps {
  title: string;
  dataset: ReconciliationHistoryEntry['erpDataset'];
}

function DatasetSnapshotCard({
  title,
  dataset,
}: DatasetSnapshotCardProps) {
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
          fontSize: '0.72rem',
          color: 'text.secondary',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.7,
          fontWeight: 700,
          fontSize: '0.88rem',
        }}
      >
        {dataset.fileName}
      </Typography>

      <Box
        sx={{
          mt: 1.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
        }}
      >
        <SmallMetric label="Rows" value={String(dataset.totalRows)} />
        <SmallMetric label="Quality" value={`${dataset.qualityScore.toFixed(1)}%`} />
        <SmallMetric label="Warnings" value={String(dataset.warnings)} />
      </Box>
    </Box>
  );
}

interface SmallMetricProps {
  label: string;
  value: string;
}

function SmallMetric({ label, value }: SmallMetricProps) {
  return (
    <Box>
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.68rem',
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.25,
          fontWeight: 700,
          fontSize: '0.82rem',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

interface DetailMetricProps {
  label: string;
  value: number;
}

function DetailMetric({ label, value }: DetailMetricProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '12px',
        backgroundColor: 'var(--surface-subtle)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.66rem',
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.35,
          fontWeight: 750,
          fontSize: '1rem',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
