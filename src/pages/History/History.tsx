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
  Download,
  Eye,
  GitMerge,
  History as HistoryIcon,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import {
  CANONICAL_FIELDS,
} from '../../config/fieldMappingConfig';

import {
  RECONCILIATION_HISTORY_LIMIT,
} from '../../config/storageConfig';

import {
  useReconciliation,
} from '../../context/ReconciliationContext';

import type {
  FieldMapping,
} from '../../types/FieldMapping';

import type {
  ReconciliationHistoryEntry,
} from '../../types/ReconciliationHistory';

import {
  calculateAverageHistoryMatchRate,
  calculateAverageHistoryQuality,
  calculateBestHistoryMatchRate,
  getHistoryEntryAverageQuality,
} from '../../utils/reconciliationHistory';

interface HistoryChartRow {
  label: string;
  matchRate: number;
  dataQuality: number;
  exceptions: number;
  toleranceMatches: number;
}

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

  const chartData = useMemo<HistoryChartRow[]>(
    () =>
      [...reconciliationHistory]
        .reverse()
        .map((entry, index) => ({
          label: buildChartLabel(entry.executedAt, index + 1),
          matchRate: roundOne(entry.summary.matchRate),
          dataQuality: roundOne(
            getHistoryEntryAverageQuality(entry)
          ),
          exceptions: entry.exceptionCount,
          toleranceMatches: entry.summary.toleranceMatched,
        })),
    [reconciliationHistory]
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

  const handleExportPdf = () => {
    if (reconciliationHistory.length === 0) {
      return;
    }

    exportHistoryPdf({
      history: reconciliationHistory,
      averageMatchRate,
      bestMatchRate,
      averageQuality,
    });
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
            sx={{ fontSize: '1.75rem' }}
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
            Analyze historical performance, data quality, exception trends and field mappings across reconciliation runs.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            startIcon={<Download size={17} />}
            disabled={reconciliationHistory.length === 0}
            onClick={handleExportPdf}
          >
            Export PDF
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Trash2 size={17} />}
            disabled={reconciliationHistory.length === 0}
            onClick={handleClearHistory}
          >
            Clear History
          </Button>
        </Box>
      </Box>

      <Alert
        severity="info"
        icon={<HistoryIcon size={19} />}
        sx={{
          mb: 2.5,
          borderRadius: '14px',
        }}
      >
        V0.1.7 keeps compact browser snapshots for the latest {RECONCILIATION_HISTORY_LIMIT} runs. Historical metrics, charts, field-mapping metadata and reconciliation-rule profiles can be exported to PDF.
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
        <EmptyHistory />
      ) : (
        <>
          <HistoryCharts data={chartData} />

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
                      const isSelected =
                        selectedEntry?.id === entry.id;

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
                            {getHistoryEntryAverageQuality(
                              entry
                            ).toFixed(1)}%
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
                                variant={
                                  isSelected
                                    ? 'contained'
                                    : 'outlined'
                                }
                                startIcon={<Eye size={15} />}
                                onClick={() =>
                                  setSelectedEntryId(entry.id)
                                }
                              >
                                View
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() =>
                                  handleDeleteEntry(entry)
                                }
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

function HistoryCharts({
  data,
}: {
  data: HistoryChartRow[];
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          xl: '1.45fr 1fr',
        },
        gap: 2,
        mb: 2.5,
      }}
    >
      <Card>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            Match Rate & Data Quality Trend
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              mb: 2,
              color: 'text.secondary',
              fontSize: '0.74rem',
            }}
          >
            Historical percentage trend ordered from oldest to newest run.
          </Typography>

          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="var(--neutral-fg)"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--neutral-fg)"
                  tickFormatter={(value: number) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) =>
                    `${Number(value ?? 0).toFixed(1)}%`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="matchRate"
                  name="Match Rate"
                  stroke="#0071E3"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="dataQuality"
                  name="Avg. Data Quality"
                  stroke="#248A3D"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: '24px !important' }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            Exceptions & Tolerance Matches by Run
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              mb: 2,
              color: 'text.secondary',
              fontSize: '0.74rem',
            }}
          >
            Compare exception volume with records accepted by configured amount tolerance rules.
          </Typography>

          <Box sx={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-subtle)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  stroke="var(--neutral-fg)"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  stroke="var(--neutral-fg)"
                />
                <Tooltip />
                <Bar
                  dataKey="exceptions"
                  name="Exceptions"
                  fill="#E58A22"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="toleranceMatches"
                  name="Tolerance Matches"
                  fill="#0071E3"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function EmptyHistory() {
  return (
    <Card>
      <CardContent sx={{ p: '34px !important' }}>
        <Box sx={{ maxWidth: 620 }}>
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
            Each successful reconciliation creates a compact historical snapshot containing dataset metadata, quality scores, field mappings and reconciliation metrics.
          </Typography>
        </Box>
      </CardContent>
    </Card>
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
              xl: 'repeat(8, minmax(0, 1fr))',
            },
            gap: 1,
          }}
        >
          <DetailMetric
            label="Unique"
            value={entry.summary.totalUnique}
          />
          <DetailMetric
            label="Matched"
            value={entry.summary.matched}
          />
          <DetailMetric
            label="Exact"
            value={entry.summary.exactMatched}
          />
          <DetailMetric
            label="Normalized"
            value={entry.summary.normalizedMatched}
          />
          <DetailMetric
            label="Tolerance"
            value={entry.summary.toleranceMatched}
          />
          <DetailMetric
            label="Differences"
            value={entry.summary.differences}
          />
          <DetailMetric
            label="Only ERP"
            value={entry.summary.onlyERP}
          />
          <DetailMetric
            label="Only CRM"
            value={entry.summary.onlyCRM}
          />
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: '14px',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
            Reconciliation Rule Profile
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              color: 'text.secondary',
              fontSize: '0.75rem',
              lineHeight: 1.55,
            }}
          >
            Customer normalization: {entry.reconciliationRules.normalizeCustomerNames ? 'Enabled' : 'Strict'} · Status normalization: {entry.reconciliationRules.normalizeStatuses ? 'Enabled' : 'Strict'} · Amount comparison: {entry.reconciliationRules.amountToleranceEnabled ? `Absolute tolerance ±${entry.reconciliationRules.amountTolerance}` : 'Strict'} · ID: Exact
          </Typography>
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
        <SmallMetric
          label="Rows"
          value={String(dataset.totalRows)}
        />
        <SmallMetric
          label="Quality"
          value={`${dataset.qualityScore.toFixed(1)}%`}
        />
        <SmallMetric
          label="Warnings"
          value={String(dataset.warnings)}
        />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mb: 1,
          color: 'text.secondary',
        }}
      >
        <GitMerge size={14} />
        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Field Mapping
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 0.55 }}>
        {CANONICAL_FIELDS.map((field) => (
          <Typography
            key={field}
            sx={{
              color: 'text.secondary',
              fontSize: '0.69rem',
            }}
          >
            <Box
              component="span"
              sx={{
                color: 'text.primary',
                fontWeight: 650,
              }}
            >
              {dataset.fieldMapping[field]}
            </Box>{' '}
            → {field}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

interface SmallMetricProps {
  label: string;
  value: string;
}

function SmallMetric({
  label,
  value,
}: SmallMetricProps) {
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

function DetailMetric({
  label,
  value,
}: DetailMetricProps) {
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

interface ExportHistoryPdfOptions {
  history: ReconciliationHistoryEntry[];
  averageMatchRate: number;
  bestMatchRate: number;
  averageQuality: number;
}

function exportHistoryPdf({
  history,
  averageMatchRate,
  bestMatchRate,
  averageQuality,
}: ExportHistoryPdfOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const latest = history[0];

  if (!latest) {
    return;
  }

  drawPdfHeader(doc, history.length);

  drawPdfMetric(
    doc,
    margin,
    31,
    62,
    'TOTAL RUNS',
    String(history.length),
    `${history.length} saved reconciliation${history.length === 1 ? '' : 's'}`
  );
  drawPdfMetric(
    doc,
    margin + 68,
    31,
    62,
    'AVERAGE MATCH RATE',
    `${averageMatchRate.toFixed(1)}%`,
    'Across retained history'
  );
  drawPdfMetric(
    doc,
    margin + 136,
    31,
    62,
    'BEST MATCH RATE',
    `${bestMatchRate.toFixed(1)}%`,
    'Highest recorded result'
  );
  drawPdfMetric(
    doc,
    margin + 204,
    31,
    65,
    'AVERAGE DATA QUALITY',
    `${averageQuality.toFixed(1)}%`,
    'ERP + CRM average'
  );

  drawLatestRunSnapshot(
    doc,
    latest,
    margin,
    54,
    contentWidth,
    31
  );

  if (history.length === 1) {
    drawSingleRunAnalytics(
      doc,
      latest,
      margin,
      91,
      contentWidth,
      42
    );
  } else {
    const chartGap = 6;
    const trendWidth = 174;
    const exceptionWidth = contentWidth - trendWidth - chartGap;

    drawPdfTrendChart(
      doc,
      history,
      margin,
      91,
      trendWidth,
      42
    );

    drawPdfExceptionChart(
      doc,
      history,
      margin + trendWidth + chartGap,
      91,
      exceptionWidth,
      42
    );
  }

  drawPdfSectionTitle(
    doc,
    'Run History',
    'Newest reconciliation snapshots first',
    margin,
    141
  );

  autoTable(doc, {
    startY: 148,
    margin: { left: margin, right: margin },
    head: [[
      'Executed',
      'ERP Dataset',
      'CRM Dataset',
      'Match Rate',
      'Matched',
      'Tolerance',
      'Exceptions',
      'Avg. Quality',
    ]],
    body: history.map((entry) => [
      formatDate(entry.executedAt),
      entry.erpDataset.fileName,
      entry.crmDataset.fileName,
      `${entry.summary.matchRate.toFixed(1)}%`,
      String(entry.summary.matched),
      String(entry.summary.toleranceMatched),
      String(entry.exceptionCount),
      `${getHistoryEntryAverageQuality(entry).toFixed(1)}%`,
    ]),
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: [45, 45, 50],
      lineColor: [232, 232, 236],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [0, 113, 227],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 49 },
      2: { cellWidth: 49 },
      3: { cellWidth: 23, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 28, halign: 'center' },
    },
  });

  const firstTableEndY = getAutoTableFinalY(doc);
  const pageHeight = doc.internal.pageSize.getHeight();
  let mappingStartY = firstTableEndY + 9;

  if (mappingStartY > pageHeight - 37) {
    doc.addPage();
    drawPdfContinuationHeader(doc, 'Integration & Rule Audit');
    mappingStartY = 27;
  } else {
    drawPdfSectionTitle(
      doc,
      'Integration & Rule Audit',
      'Field mapping and reconciliation rules captured with every run',
      margin,
      mappingStartY
    );
    mappingStartY += 7;
  }

  if (mappingStartY === 27) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(95, 95, 102);
    doc.text(
      'Source-to-canonical field mapping and reconciliation rules captured with every reconciliation snapshot.',
      margin,
      32
    );
    mappingStartY = 37;
  }

  autoTable(doc, {
    startY: mappingStartY,
    margin: { left: margin, right: margin },
    head: [[
      'Executed',
      'ERP Mapping',
      'CRM Mapping',
      'Rules',
    ]],
    body: history.map((entry) => [
      formatDate(entry.executedAt),
      formatMappingForPdf(entry.erpDataset.fieldMapping),
      formatMappingForPdf(entry.crmDataset.fieldMapping),
      formatRulesForPdf(entry),
    ]),
    styles: {
      fontSize: 7,
      cellPadding: 2.2,
      overflow: 'linebreak',
      textColor: [50, 50, 55],
      lineColor: [232, 232, 236],
      lineWidth: 0.15,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [38, 38, 43],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 250],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 76 },
      2: { cellWidth: 76 },
      3: { cellWidth: 80 },
    },
  });

  addPdfFooters(doc);

  doc.save(
    `reconciliation-history-${formatFileDate(new Date())}.pdf`
  );
}

function drawPdfHeader(
  doc: jsPDF,
  runCount: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 113, 227);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(20, 20, 24);
  doc.text('Reconciliation History', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 107);
  doc.text(
    'Executive performance, data quality and integration audit report',
    14,
    22
  );

  doc.setFontSize(7.5);
  doc.text(
    `Generated ${new Date().toLocaleString()}  •  ${runCount} saved run${runCount === 1 ? '' : 's'}`,
    pageWidth - 14,
    16,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 113, 227);
  doc.text(
    'ENTERPRISE DATA RECONCILIATION',
    pageWidth - 14,
    22,
    { align: 'right' }
  );
}

function drawPdfContinuationHeader(
  doc: jsPDF,
  title: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 113, 227);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(25, 25, 29);
  doc.text(title, 14, 18);
}

function drawPdfMetric(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  detail: string
) {
  doc.setFillColor(248, 248, 250);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, 17, 2.5, 2.5, 'FD');

  doc.setFillColor(0, 113, 227);
  doc.roundedRect(x, y, 2.1, 17, 2.1, 2.1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(105, 105, 112);
  doc.text(label, x + 5, y + 4.6);

  doc.setFontSize(12.5);
  doc.setTextColor(22, 22, 26);
  doc.text(value, x + 5, y + 10.7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(125, 125, 132);
  doc.text(detail, x + 5, y + 14.6);
}

function drawLatestRunSnapshot(
  doc: jsPDF,
  entry: ReconciliationHistoryEntry,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const health = getPdfHealth(entry);

  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, height, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(25, 25, 29);
  doc.text('Latest Run Snapshot', x + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(110, 110, 118);
  doc.text(formatDate(entry.executedAt), x + 5, y + 11.5);

  drawPdfStatusBadge(
    doc,
    x + width - 39,
    y + 4,
    34,
    health.label,
    health.tone
  );

  const separatorX = x + 104;
  doc.setDrawColor(232, 232, 236);
  doc.line(separatorX, y + 4, separatorX, y + height - 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.1);
  doc.setTextColor(115, 115, 122);
  doc.text('ERP DATASET', x + 5, y + 18);
  doc.text('CRM DATASET', x + 5, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(42, 42, 47);
  doc.text(
    truncatePdfText(doc, entry.erpDataset.fileName, 72),
    x + 27,
    y + 18
  );
  doc.text(
    truncatePdfText(doc, entry.crmDataset.fileName, 72),
    x + 27,
    y + 25
  );

  const metrics = [
    ['Unique', entry.summary.totalUnique],
    ['Matched', entry.summary.matched],
    ['Exact', entry.summary.exactMatched],
    ['Normalized', entry.summary.normalizedMatched],
    ['Tolerance', entry.summary.toleranceMatched],
    ['Exceptions', entry.exceptionCount],
  ] as const;

  const metricsStartX = separatorX + 7;
  const metricWidth = (width - (metricsStartX - x) - 7) / metrics.length;

  metrics.forEach(([label, value], index) => {
    const metricX = metricsStartX + metricWidth * index;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(120, 120, 127);
    doc.text(label, metricX, y + 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.2);
    doc.setTextColor(25, 25, 29);
    doc.text(String(value), metricX, y + 24.5);
  });
}

function drawPdfStatusBadge(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  tone: 'success' | 'warning' | 'danger'
) {
  const palette =
    tone === 'success'
      ? {
          fill: [235, 248, 239] as [number, number, number],
          text: [31, 122, 59] as [number, number, number],
        }
      : tone === 'warning'
        ? {
            fill: [255, 246, 230] as [number, number, number],
            text: [178, 102, 0] as [number, number, number],
          }
        : {
            fill: [253, 235, 237] as [number, number, number],
            text: [190, 28, 45] as [number, number, number],
          };

  doc.setFillColor(...palette.fill);
  doc.roundedRect(x, y, width, 7, 3.5, 3.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.3);
  doc.setTextColor(...palette.text);
  doc.text(label, x + width / 2, y + 4.7, {
    align: 'center',
  });
}

function drawSingleRunAnalytics(
  doc: jsPDF,
  entry: ReconciliationHistoryEntry,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const gap = 6;
  const outcomeWidth = 174;
  const qualityWidth = width - outcomeWidth - gap;

  drawPdfOutcomeCard(
    doc,
    entry,
    x,
    y,
    outcomeWidth,
    height
  );

  drawPdfQualityCard(
    doc,
    entry,
    x + outcomeWidth + gap,
    y,
    qualityWidth,
    height
  );
}

function drawPdfOutcomeCard(
  doc: jsPDF,
  entry: ReconciliationHistoryEntry,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, height, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 29);
  doc.text('Reconciliation Outcome', x + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.1);
  doc.setTextColor(115, 115, 122);
  doc.text(
    'Single-run distribution replaces a trend chart until more history exists.',
    x + 5,
    y + 11
  );

  const segments = [
    {
      label: 'Matched',
      value: entry.summary.matched,
      color: [36, 138, 61] as [number, number, number],
    },
    {
      label: 'Differences',
      value: entry.summary.differences,
      color: [229, 138, 34] as [number, number, number],
    },
    {
      label: 'Only ERP',
      value: entry.summary.onlyERP,
      color: [0, 113, 227] as [number, number, number],
    },
    {
      label: 'Only CRM',
      value: entry.summary.onlyCRM,
      color: [124, 92, 255] as [number, number, number],
    },
  ];

  const total = Math.max(1, entry.summary.totalUnique);
  const barX = x + 5;
  const barY = y + 16;
  const barWidth = width - 10;
  const barHeight = 6;
  let cursorX = barX;

  doc.setFillColor(238, 238, 242);
  doc.roundedRect(barX, barY, barWidth, barHeight, 3, 3, 'F');

  segments.forEach((segment) => {
    if (segment.value <= 0) {
      return;
    }

    const segmentWidth =
      (segment.value / total) * barWidth;

    doc.setFillColor(...segment.color);
    doc.rect(
      cursorX,
      barY,
      Math.max(0.8, segmentWidth),
      barHeight,
      'F'
    );
    cursorX += segmentWidth;
  });

  const itemWidth = (width - 10) / segments.length;

  segments.forEach((segment, index) => {
    const itemX = x + 5 + itemWidth * index;

    doc.setFillColor(...segment.color);
    doc.circle(itemX + 1.2, y + 29, 1.1, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(110, 110, 117);
    doc.text(segment.label, itemX + 4, y + 29.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(30, 30, 34);
    doc.text(String(segment.value), itemX + 4, y + 35.5);
  });
}

function drawPdfQualityCard(
  doc: jsPDF,
  entry: ReconciliationHistoryEntry,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, height, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 29);
  doc.text('Data Quality', x + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.1);
  doc.setTextColor(115, 115, 122);
  doc.text('Application-defined quality score V2', x + 5, y + 11);

  drawPdfQualityRow(
    doc,
    x + 5,
    y + 16,
    width - 10,
    'ERP',
    entry.erpDataset.qualityScore,
    entry.erpDataset.blockingIssues,
    entry.erpDataset.warnings
  );

  drawPdfQualityRow(
    doc,
    x + 5,
    y + 28,
    width - 10,
    'CRM',
    entry.crmDataset.qualityScore,
    entry.crmDataset.blockingIssues,
    entry.crmDataset.warnings
  );
}

function drawPdfQualityRow(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  score: number,
  blocking: number,
  warnings: number
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(42, 42, 47);
  doc.text(label, x, y);

  doc.setTextColor(0, 113, 227);
  doc.text(`${score.toFixed(1)}%`, x + width, y, {
    align: 'right',
  });

  const barY = y + 2.5;
  doc.setFillColor(235, 235, 239);
  doc.roundedRect(x, barY, width, 3.2, 1.6, 1.6, 'F');

  const scoreWidth = Math.max(
    0,
    Math.min(width, (score / 100) * width)
  );

  if (scoreWidth > 0) {
    doc.setFillColor(0, 113, 227);
    doc.roundedRect(
      x,
      barY,
      scoreWidth,
      3.2,
      1.6,
      1.6,
      'F'
    );
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  doc.setTextColor(125, 125, 132);
  doc.text(
    `Blocking ${blocking}  •  Warnings ${warnings}`,
    x,
    barY + 6.3
  );
}

function drawPdfTrendChart(
  doc: jsPDF,
  history: ReconciliationHistoryEntry[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  const chronological = [...history].reverse();
  const leftPadding = 12;
  const rightPadding = 5;
  const topPadding = 14;
  const bottomPadding = 8;
  const plotX = x + leftPadding;
  const plotY = y + topPadding;
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;

  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, height, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 29);
  doc.text('Match Rate & Data Quality Trend', x + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(115, 115, 122);
  doc.text('Oldest to newest reconciliation run', x + 5, y + 10.5);

  for (let percentage = 0; percentage <= 100; percentage += 25) {
    const lineY =
      plotY + plotHeight - (percentage / 100) * plotHeight;

    doc.setDrawColor(236, 236, 240);
    doc.line(plotX, lineY, plotX + plotWidth, lineY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.1);
    doc.setTextColor(135, 135, 142);
    doc.text(`${percentage}%`, x + 1.5, lineY + 1.4);
  }

  const pointGap =
    chronological.length <= 1
      ? 0
      : plotWidth / (chronological.length - 1);

  const getPoint = (
    index: number,
    value: number
  ) => ({
    px:
      chronological.length <= 1
        ? plotX + plotWidth / 2
        : plotX + pointGap * index,
    py:
      plotY +
      plotHeight -
      (Math.max(0, Math.min(100, value)) / 100) * plotHeight,
  });

  drawPdfSeries(
    doc,
    chronological.map((entry, index) =>
      getPoint(index, entry.summary.matchRate)
    ),
    [0, 113, 227]
  );

  drawPdfSeries(
    doc,
    chronological.map((entry, index) =>
      getPoint(
        index,
        getHistoryEntryAverageQuality(entry)
      )
    ),
    [36, 138, 61]
  );

  chronological.forEach((_, index) => {
    const point = getPoint(index, 0);
    const shouldLabel =
      chronological.length <= 8 ||
      index === 0 ||
      index === chronological.length - 1 ||
      index % 2 === 0;

    if (!shouldLabel) {
      return;
    }

    doc.setFontSize(5);
    doc.setTextColor(135, 135, 142);
    doc.text(
      String(index + 1),
      point.px,
      y + height - 2.2,
      { align: 'center' }
    );
  });

  drawPdfLegendDot(
    doc,
    x + width - 56,
    y + 5.2,
    [0, 113, 227],
    'Match Rate'
  );
  drawPdfLegendDot(
    doc,
    x + width - 28,
    y + 5.2,
    [36, 138, 61],
    'Quality'
  );
}

function drawPdfExceptionChart(
  doc: jsPDF,
  history: ReconciliationHistoryEntry[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  const chronological = [...history].reverse();
  const maxCount = Math.max(
    1,
    ...chronological.flatMap((entry) => [
      entry.exceptionCount,
      entry.summary.toleranceMatched,
    ])
  );

  doc.setFillColor(252, 252, 253);
  doc.setDrawColor(228, 228, 233);
  doc.roundedRect(x, y, width, height, 2.8, 2.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(25, 25, 29);
  doc.text('Exceptions & Tolerance Matches', x + 5, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(115, 115, 122);
  doc.text('Operational exceptions compared with rule-accepted amount matches', x + 5, y + 10.5);

  const chartX = x + 6;
  const chartY = y + 15;
  const chartWidth = width - 12;
  const chartHeight = height - 22;
  const slotWidth = chartWidth / chronological.length;
  const barWidth = Math.max(1.2, Math.min(3.2, slotWidth * 0.28));

  doc.setDrawColor(236, 236, 240);
  doc.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);

  chronological.forEach((entry, index) => {
    const centerX = chartX + slotWidth * index + slotWidth / 2;

    const exceptionHeight =
      (entry.exceptionCount / maxCount) * chartHeight;
    const toleranceHeight =
      (entry.summary.toleranceMatched / maxCount) * chartHeight;

    if (entry.exceptionCount > 0) {
      doc.setFillColor(229, 138, 34);
      doc.roundedRect(
        centerX - barWidth - 0.5,
        chartY + chartHeight - exceptionHeight,
        barWidth,
        Math.max(1, exceptionHeight),
        0.7,
        0.7,
        'F'
      );
    }

    if (entry.summary.toleranceMatched > 0) {
      doc.setFillColor(0, 113, 227);
      doc.roundedRect(
        centerX + 0.5,
        chartY + chartHeight - toleranceHeight,
        barWidth,
        Math.max(1, toleranceHeight),
        0.7,
        0.7,
        'F'
      );
    }

    if (
      chronological.length <= 8 ||
      index === 0 ||
      index === chronological.length - 1
    ) {
      doc.setFontSize(4.8);
      doc.setTextColor(135, 135, 142);
      doc.text(
        String(index + 1),
        centerX,
        y + height - 2.1,
        { align: 'center' }
      );
    }
  });

  drawPdfLegendDot(
    doc,
    x + width - 58,
    y + 5.2,
    [229, 138, 34],
    'Exceptions'
  );

  drawPdfLegendDot(
    doc,
    x + width - 28,
    y + 5.2,
    [0, 113, 227],
    'Tolerance'
  );
}

function drawPdfLegendDot(
  doc: jsPDF,
  x: number,
  y: number,
  color: [number, number, number],
  label: string
) {
  doc.setFillColor(...color);
  doc.circle(x, y, 1, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(95, 95, 102);
  doc.text(label, x + 2.8, y + 1.3);
}

function drawPdfSeries(
  doc: jsPDF,
  points: Array<{ px: number; py: number }>,
  color: [number, number, number]
) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.6);

  points.forEach((point, index) => {
    if (index > 0) {
      const previous = points[index - 1];
      doc.line(previous.px, previous.py, point.px, point.py);
    }

    doc.setFillColor(...color);
    doc.circle(point.px, point.py, 0.85, 'F');
  });
}

function drawPdfSectionTitle(
  doc: jsPDF,
  title: string,
  subtitle: string,
  x: number,
  y: number
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(28, 28, 32);
  doc.text(title, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.9);
  doc.setTextColor(120, 120, 127);
  doc.text(subtitle, x, y + 4);
}

function getPdfHealth(
  entry: ReconciliationHistoryEntry
): {
  label: string;
  tone: 'success' | 'warning' | 'danger';
} {
  if (
    entry.summary.matchRate >= 95 &&
    entry.exceptionCount === 0
  ) {
    return {
      label: 'Excellent',
      tone: 'success',
    };
  }

  if (entry.summary.matchRate >= 80) {
    return {
      label: 'Healthy',
      tone: 'success',
    };
  }

  if (entry.summary.matchRate >= 60) {
    return {
      label: 'Review',
      tone: 'warning',
    };
  }

  return {
    label: 'Needs Attention',
    tone: 'danger',
  };
}

function truncatePdfText(
  doc: jsPDF,
  value: string,
  maxWidth: number
): string {
  if (doc.getTextWidth(value) <= maxWidth) {
    return value;
  }

  let result = value;

  while (
    result.length > 4 &&
    doc.getTextWidth(`${result}...`) > maxWidth
  ) {
    result = result.slice(0, -1);
  }

  return `${result}...`;
}


function formatRulesForPdf(
  entry: ReconciliationHistoryEntry
): string {
  const rules = entry.reconciliationRules;

  return [
    `Customer normalization: ${rules.normalizeCustomerNames ? 'On' : 'Strict'}`,
    `Status normalization: ${rules.normalizeStatuses ? 'On' : 'Strict'}`,
    `Amount: ${rules.amountToleranceEnabled ? `±${rules.amountTolerance}` : 'Strict'}`,
    'ID: Exact',
  ].join(' | ');
}

function addPdfFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(232, 232, 236);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(130, 130, 137);
    doc.text(
      'Enterprise Data Reconciliation Platform  •  Application-defined metrics  •  Local report export',
      14,
      pageHeight - 5.8
    );
    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 5.8,
      { align: 'right' }
    );
  }
}

function getAutoTableFinalY(doc: jsPDF): number {
  const documentWithAutoTable = doc as jsPDF & {
    lastAutoTable?: {
      finalY?: number;
    };
  };

  return documentWithAutoTable.lastAutoTable?.finalY ?? 148;
}

function formatMappingForPdf(mapping: FieldMapping): string {
  const isCanonical = CANONICAL_FIELDS.every(
    (field) => mapping[field] === field
  );

  if (isCanonical) {
    return 'Canonical schema';
  }

  return CANONICAL_FIELDS.map(
    (field) => `${mapping[field]} -> ${field}`
  ).join('  |  ');
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

function buildChartLabel(
  value: string,
  runNumber: number
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return `Run ${runNumber}`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
