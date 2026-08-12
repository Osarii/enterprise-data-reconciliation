import { useMemo } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { useReconciliation } from '../../context/ReconciliationContext';

import {
  hasBlockingIssues,
} from '../../utils/dataQuality';

import type { ReconciliationResult } from '../../types/ReconciliationResult';

type ReportStatus =
  | 'Difference'
  | 'Only ERP'
  | 'Only CRM';

type HealthStatus =
  | 'Excellent'
  | 'Good'
  | 'Needs Review'
  | 'Needs Attention';

interface ReportRow {
  key: string;
  id: string;
  field: string;
  erpValue: string;
  crmValue: string;
  status: ReportStatus;
}

interface FieldMetric {
  name: string;
  value: number;
}

interface PdfReportOptions {
  result: ReconciliationResult;
  rows: ReportRow[];
  reviewedSet: Set<string>;
  erpFileName: string;
  crmFileName: string;
  reviewedCount: number;
  pendingCount: number;
  exceptionRecordCount: number;
  exceptionRate: number;
  fieldMetrics: FieldMetric[];
  healthStatus: HealthStatus;
}

interface CsvReportOptions {
  result: ReconciliationResult;
  rows: ReportRow[];
  reviewedSet: Set<string>;
  erpFileName: string;
  crmFileName: string;
  exceptionRecordCount: number;
  exceptionRate: number;
  healthStatus: HealthStatus;
}

const CHART_COLORS = {
  matched: '#248A3D',
  difference: '#E58A22',
  onlyERP: '#0071E3',
  onlyCRM: '#7C3AED',
};

export default function Reports() {
  const navigate = useNavigate();

  const {
    erpData,
    crmData,
    reconciliationResult,
    reviewedExceptionKeys,
  } = useReconciliation();

  const rows = useMemo(() => {
    if (!reconciliationResult) {
      return [];
    }

    return buildReportRows(
      reconciliationResult
    );
  }, [reconciliationResult]);

  const reviewedSet = useMemo(
    () =>
      new Set(
        reviewedExceptionKeys
      ),
    [reviewedExceptionKeys]
  );

  const reviewedCount =
    rows.filter((row) =>
      reviewedSet.has(row.key)
    ).length;

  const pendingCount =
    rows.length -
    reviewedCount;

  const datasetsReady =
    erpData !== null &&
    crmData !== null &&
    !hasBlockingIssues(erpData.issues) &&
    !hasBlockingIssues(crmData.issues);

  const exceptionRecordCount =
    useMemo(() => {
      if (!reconciliationResult) {
        return 0;
      }

      const ids =
        new Set<string>();

      reconciliationResult
        .differences
        .forEach((record) => {
          ids.add(record.id);
        });

      reconciliationResult
        .onlyERP
        .forEach((record) => {
          ids.add(record.id);
        });

      reconciliationResult
        .onlyCRM
        .forEach((record) => {
          ids.add(record.id);
        });

      return ids.size;
    }, [reconciliationResult]);

  const fieldMetrics =
    useMemo<FieldMetric[]>(
      () => {
        if (
          !reconciliationResult
        ) {
          return [];
        }

        const counts =
          new Map<
            string,
            number
          >();

        reconciliationResult
          .differences
          .forEach((record) => {
            record.differences.forEach(
              (difference) => {
                const field =
                  formatFieldName(
                    difference.field
                  );

                counts.set(
                  field,
                  (counts.get(
                    field
                  ) ?? 0) + 1
                );
              }
            );
          });

        return Array.from(
          counts.entries()
        )
          .map(
            ([name, value]) => ({
              name,
              value,
            })
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );
      },
      [reconciliationResult]
    );

  if (!reconciliationResult) {
    return (
      <Box>
        <PageHeader />

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
                  borderRadius:
                    '15px',

                  display: 'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  backgroundColor:
                    'rgba(0,113,227,0.08)',

                  color: '#0071E3',

                  mb: 2,
                }}
              >
                <FileBarChart2
                  size={24}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                No report available
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.88rem',

                  mt: 1,
                  mb: 3,
                }}
              >
                Run a reconciliation
                before generating an
                executive report.
              </Typography>

              <Button
                variant="contained"
                onClick={() =>
                  navigate(
                    datasetsReady
                      ? '/reconciliation'
                      : '/imports'
                  )
                }
              >
                {datasetsReady
                  ? 'Go to Reconciliation'
                  : 'Import Data'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const summary =
    reconciliationResult.summary;

  const reviewProgress =
    rows.length === 0
      ? 100
      : (reviewedCount /
          rows.length) *
        100;

  const exceptionRate =
    summary.totalUnique === 0
      ? 0
      : (exceptionRecordCount /
          summary.totalUnique) *
        100;

  const healthStatus =
    getHealthStatus(
      summary.matchRate
    );

  const pieData = [
    {
      name: 'Matched',
      value:
        summary.matched,
      color:
        CHART_COLORS.matched,
    },
    {
      name: 'Differences',
      value:
        summary.differences,
      color:
        CHART_COLORS.difference,
    },
    {
      name: 'Only ERP',
      value:
        summary.onlyERP,
      color:
        CHART_COLORS.onlyERP,
    },
    {
      name: 'Only CRM',
      value:
        summary.onlyCRM,
      color:
        CHART_COLORS.onlyCRM,
    },
  ].filter(
    (item) =>
      item.value > 0
  );

  return (
    <Box>
      {/* HEADER */}
      <Box
        sx={{
          display: 'flex',

          justifyContent:
            'space-between',

          gap: 3,

          flexWrap: 'wrap',

          mb: 4,
        }}
      >
        <PageHeader />

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems:
              'flex-start',
          }}
        >
          <Button
            variant="outlined"
            startIcon={
              <Download size={18} />
            }
            onClick={() =>
              downloadCsvReport({
                result:
                  reconciliationResult,

                rows,

                reviewedSet,

                erpFileName:
                  erpData?.fileName ??
                  'Unknown',

                crmFileName:
                  crmData?.fileName ??
                  'Unknown',

                exceptionRecordCount,

                exceptionRate,

                healthStatus,
              })
            }
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            startIcon={
              <FileText size={18} />
            }
            onClick={() =>
              downloadPdfReport({
                result:
                  reconciliationResult,

                rows,

                reviewedSet,

                erpFileName:
                  erpData?.fileName ??
                  'Unknown',

                crmFileName:
                  crmData?.fileName ??
                  'Unknown',

                reviewedCount,

                pendingCount,

                exceptionRecordCount,

                exceptionRate,

                fieldMetrics,

                healthStatus,
              })
            }
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {/* DATASET METADATA */}
      <Card
        sx={{
          mb: 3,
        }}
      >
        <CardContent
          sx={{
            p: '24px !important',
          }}
        >
          <Box
            sx={{
              display: 'grid',

              gridTemplateColumns:
                {
                  xs: '1fr',
                  md: 'repeat(3, 1fr)',
                },

              gap: 3,
            }}
          >
            <MetadataItem
              label="ERP Dataset"
              value={
                erpData?.fileName ??
                'Unknown'
              }
              secondary={`${
                erpData?.records
                  .length ?? 0
              } records`}
              icon="file"
            />

            <MetadataItem
              label="CRM Dataset"
              value={
                crmData?.fileName ??
                'Unknown'
              }
              secondary={`${
                crmData?.records
                  .length ?? 0
              } records`}
              icon="file"
            />

            <MetadataItem
              label="Last Reconciliation"
              value={formatDate(
                reconciliationResult
                  .executedAt
              )}
              secondary="Current report"
              icon="report"
            />
          </Box>
        </CardContent>
      </Card>

      {/* DATA QUALITY */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },

          gap: 2,

          mb: 3,
        }}
      >
        <DatasetQualityCard
          title="ERP Data Quality"
          score={
            erpData?.qualityScore ??
            0
          }
          blocking={
            erpData
              ?.qualitySummary
              .blockingIssues ?? 0
          }
          warnings={
            erpData
              ?.qualitySummary
              .warnings ?? 0
          }
          rowsWithIssues={
            erpData
              ?.rowsWithIssues ?? 0
          }
        />

        <DatasetQualityCard
          title="CRM Data Quality"
          score={
            crmData?.qualityScore ??
            0
          }
          blocking={
            crmData
              ?.qualitySummary
              .blockingIssues ?? 0
          }
          warnings={
            crmData
              ?.qualitySummary
              .warnings ?? 0
          }
          rowsWithIssues={
            crmData
              ?.rowsWithIssues ?? 0
          }
        />
      </Box>

      {/* HEALTH */}
      <Card
        sx={{
          mb: 3,
        }}
      >
        <CardContent
          sx={{
            p: '24px !important',
          }}
        >
          <Box
            sx={{
              display: 'flex',

              justifyContent:
                'space-between',

              alignItems: 'center',

              gap: 3,

              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.72rem',

                  fontWeight: 600,

                  textTransform:
                    'uppercase',

                  letterSpacing:
                    '0.05em',
                }}
              >
                Reconciliation Health
              </Typography>

              <Typography
                sx={{
                  fontSize: '1.3rem',

                  fontWeight: 700,

                  mt: 0.5,
                }}
              >
                {healthStatus}
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.76rem',

                  mt: 0.4,
                }}
              >
                Based on an
                application-defined
                match-rate threshold.
              </Typography>
            </Box>

            <HealthChip
              status={
                healthStatus
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* METRICS */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },

          gap: 2,

          mb: 3,
        }}
      >
        <MetricCard
          title="Match Rate"
          value={`${summary.matchRate.toFixed(
            1
          )}%`}
          subtitle="Records matching"
          type="success"
        />

        <MetricCard
          title="Exception Rate"
          value={`${exceptionRate.toFixed(
            1
          )}%`}
          subtitle={`${exceptionRecordCount} affected records`}
          type="warning"
        />

        <MetricCard
          title="Review Completion"
          value={`${reviewProgress.toFixed(
            0
          )}%`}
          subtitle={`${reviewedCount} of ${rows.length} reviewed`}
          type="info"
        />

        <MetricCard
          title="Unique Records"
          value={summary.totalUnique.toLocaleString()}
          subtitle="Across both systems"
          type="neutral"
        />
      </Box>

      {/* SECONDARY METRICS */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(5, 1fr)',
          },

          gap: 2,

          mb: 3,
        }}
      >
        <SmallMetricCard
          title="Matched"
          value={
            summary.matched
          }
          color="var(--success-fg)"
        />

        <SmallMetricCard
          title="Differences"
          value={
            summary.differences
          }
          color="var(--warning-fg)"
        />

        <SmallMetricCard
          title="Only ERP"
          value={
            summary.onlyERP
          }
          color="var(--info-fg)"
        />

        <SmallMetricCard
          title="Only CRM"
          value={
            summary.onlyCRM
          }
          color="var(--purple-fg)"
        />

        <SmallMetricCard
          title="Exceptions"
          value={rows.length}
          color="var(--danger-fg)"
        />
      </Box>

      {/* CHARTS */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 1fr',
          },

          gap: 3,

          mb: 3,
        }}
      >
        {/* PIE */}
        <Card>
          <CardContent
            sx={{
              p: '28px !important',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Reconciliation
              Distribution
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.8rem',

                mt: 0.5,

                mb: 2,
              }}
            >
              Distribution of records
              across reconciliation
              outcomes.
            </Typography>

            <Box
              sx={{
                width: '100%',
                height: 300,
              }}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {pieData.map(
                      (entry) => (
                        <Cell
                          key={
                            entry.name
                          }
                          fill={
                            entry.color
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent:
                  'center',
                gap: 2,
                mt: 1,
              }}
            >
              {pieData.map(
                (item) => (
                  <LegendItem
                    key={
                      item.name
                    }
                    label={
                      item.name
                    }
                    value={
                      item.value
                    }
                    color={
                      item.color
                    }
                  />
                )
              )}
            </Box>
          </CardContent>
        </Card>

        {/* BAR */}
        <Card>
          <CardContent
            sx={{
              p: '28px !important',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Differences by Field
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.8rem',

                mt: 0.5,

                mb: 2,
              }}
            >
              Fields generating the
              highest number of
              mismatches.
            </Typography>

            {fieldMetrics.length ===
            0 ? (
              <Box
                sx={{
                  height: 300,

                  display: 'flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',
                }}
              >
                <Typography
                  sx={{
                    color:
                      'text.secondary',

                    fontSize:
                      '0.8rem',
                  }}
                >
                  No field-level
                  differences detected.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 300,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      fieldMetrics
                    }
                    layout="vertical"
                    margin={{
                      top: 10,
                      right: 20,
                      left: 20,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={
                        false
                      }
                      stroke="var(--surface-strong)"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={
                        false
                      }
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      fill="#0071E3"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* EXECUTIVE + REVIEW */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            lg: '1.5fr 1fr',
          },

          gap: 3,

          mb: 3,
        }}
      >
        <Card>
          <CardContent
            sx={{
              p: '28px !important',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Executive Summary
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.82rem',

                mt: 0.5,

                mb: 3,
              }}
            >
              High-level assessment
              of the current
              reconciliation.
            </Typography>

            <Divider
              sx={{
                mb: 3,
              }}
            />

            <Box
              sx={{
                display: 'grid',
                gap: 2.2,
              }}
            >
              <SummaryLine
                title="Data consistency"
                text={
                  getConsistencySummary(
                    summary.matchRate
                  )
                }
              />

              <SummaryLine
                title="Exception exposure"
                text={`${exceptionRecordCount} of ${summary.totalUnique} unique records contain at least one discrepancy, representing an exception rate of ${exceptionRate.toFixed(
                  1
                )}%.`}
              />

              <SummaryLine
                title="Detected discrepancies"
                text={`${rows.length} individual exception${
                  rows.length !== 1
                    ? 's were'
                    : ' was'
                } identified in the current reconciliation.`}
              />

              <SummaryLine
                title="Review status"
                text={`${reviewedCount} exception${
                  reviewedCount !== 1
                    ? 's have'
                    : ' has'
                } been reviewed and ${pendingCount} remain pending.`}
              />

              <SummaryLine
                title="Missing records"
                text={`${summary.onlyERP} record${
                  summary.onlyERP !== 1
                    ? 's exist'
                    : ' exists'
                } only in ERP and ${summary.onlyCRM} record${
                  summary.onlyCRM !== 1
                    ? 's exist'
                    : ' exists'
                } only in CRM.`}
              />

              {fieldMetrics.length >
                0 && (
                <SummaryLine
                  title="Most affected field"
                  text={`${fieldMetrics[0].name} is currently the most frequently mismatched field with ${fieldMetrics[0].value} detected difference${
                    fieldMetrics[0]
                      .value !== 1
                      ? 's'
                      : ''
                  }.`}
                />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* REVIEW PROGRESS */}
        <Card>
          <CardContent
            sx={{
              p: '28px !important',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Exception Review
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.82rem',

                mt: 0.5,
              }}
            >
              Current analyst review
              progress.
            </Typography>

            <Box
              sx={{
                mt: 4,
              }}
            >
              <Typography
                sx={{
                  fontSize: '2.5rem',

                  fontWeight: 700,

                  letterSpacing:
                    '-0.05em',
                }}
              >
                {reviewProgress.toFixed(
                  0
                )}
                %
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.75rem',

                  mt: 0.5,

                  mb: 2,
                }}
              >
                {reviewedCount} of{' '}
                {rows.length} exceptions
                reviewed
              </Typography>

              <LinearProgress
                variant="determinate"
                value={
                  reviewProgress
                }
                sx={{
                  height: 10,

                  borderRadius:
                    '999px',

                  backgroundColor:
                    'var(--surface-strong)',

                  '& .MuiLinearProgress-bar':
                    {
                      borderRadius:
                        '999px',

                      backgroundColor:
                        '#248A3D',
                    },
                }}
              />

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns:
                    '1fr 1fr',

                  gap: 2,

                  mt: 3,
                }}
              >
                <ReviewMetric
                  label="Reviewed"
                  value={
                    reviewedCount
                  }
                  color="var(--success-fg)"
                />

                <ReviewMetric
                  label="Pending"
                  value={
                    pendingCount
                  }
                  color="var(--warning-fg)"
                />
              </Box>

              {rows.length > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() =>
                    navigate(
                      '/exceptions'
                    )
                  }
                  sx={{
                    mt: 3,
                  }}
                >
                  Review Exceptions
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* EXCEPTION DETAILS */}
      <Card>
        <CardContent
          sx={{
            p: '28px !important',
          }}
        >
          <Box
            sx={{
              display: 'flex',

              justifyContent:
                'space-between',

              gap: 2,

              flexWrap: 'wrap',

              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Exception Details
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.8rem',

                  mt: 0.4,
                }}
              >
                Detailed discrepancies
                detected during the
                latest reconciliation.
              </Typography>
            </Box>

            <Chip
              label={`${rows.length} exceptions`}
              size="small"
              sx={{
                backgroundColor:
                  'var(--surface-muted)',

                color:
                  'var(--neutral-fg)',

                fontWeight: 600,
              }}
            />
          </Box>

          <Divider
            sx={{
              mb: 2,
            }}
          />

          {rows.length === 0 ? (
            <Alert
              severity="success"
              sx={{
                borderRadius:
                  '12px',
              }}
            >
              No exceptions were
              detected. All compared
              records match.
            </Alert>
          ) : (
            <Box
              sx={{
                overflowX: 'auto',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      ID
                    </TableCell>

                    <TableCell>
                      Field
                    </TableCell>

                    <TableCell>
                      ERP Value
                    </TableCell>

                    <TableCell>
                      CRM Value
                    </TableCell>

                    <TableCell>
                      Exception
                    </TableCell>

                    <TableCell>
                      Review Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map(
                    (row) => {
                      const reviewed =
                        reviewedSet.has(
                          row.key
                        );

                      return (
                        <TableRow
                          key={
                            row.key
                          }
                        >
                          <TableCell>
                            <Typography
                              sx={{
                                fontSize:
                                  '0.8rem',

                                fontWeight:
                                  600,
                              }}
                            >
                              {row.id}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontSize:
                                  '0.8rem',
                              }}
                            >
                              {
                                row.field
                              }
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontSize:
                                  '0.8rem',

                                color:
                                  'text.secondary',
                              }}
                            >
                              {
                                row.erpValue
                              }
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                fontSize:
                                  '0.8rem',

                                color:
                                  'text.secondary',
                              }}
                            >
                              {
                                row.crmValue
                              }
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <ExceptionChip
                              status={
                                row.status
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                reviewed
                                  ? 'Reviewed'
                                  : 'Pending'
                              }
                              sx={{
                                backgroundColor:
                                  reviewed
                                    ? 'var(--success-soft)'
                                    : 'var(--surface-muted)',

                                color:
                                  reviewed
                                    ? '#248A3D'
                                    : 'var(--neutral-fg)',

                                fontSize:
                                  '0.7rem',

                                fontWeight:
                                  600,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

/* =========================================================
   PAGE COMPONENTS
========================================================= */

function PageHeader() {
  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,

          letterSpacing:
            '-0.03em',
        }}
      >
        Reports
      </Typography>

      <Typography
        sx={{
          color:
            'text.secondary',

          mt: 1,

          fontSize:
            '0.95rem',
        }}
      >
        Executive metrics,
        reconciliation analytics,
        exception review and
        exportable reports.
      </Typography>
    </Box>
  );
}

interface MetadataItemProps {
  label: string;
  value: string;
  secondary: string;
  icon: 'file' | 'report';
}

function MetadataItem({
  label,
  value,
  secondary,
  icon,
}: MetadataItemProps) {
  return (
    <Box
      sx={{
        display: 'flex',

        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,

          borderRadius:
            '13px',

          flexShrink: 0,

          display: 'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          color: '#0071E3',

          backgroundColor:
            'rgba(0,113,227,0.08)',
        }}
      >
        {icon === 'file' ? (
          <FileSpreadsheet
            size={20}
          />
        ) : (
          <FileBarChart2
            size={20}
          />
        )}
      </Box>

      <Box>
        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.68rem',

            fontWeight: 600,

            textTransform:
              'uppercase',

            letterSpacing:
              '0.05em',
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            fontWeight: 600,

            fontSize:
              '0.88rem',

            mt: 0.35,
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.7rem',

            mt: 0.2,
          }}
        >
          {secondary}
        </Typography>
      </Box>
    </Box>
  );
}

interface DatasetQualityCardProps {
  title: string;
  score: number;
  blocking: number;
  warnings: number;
  rowsWithIssues: number;
}

function DatasetQualityCard({
  title,
  score,
  blocking,
  warnings,
  rowsWithIssues,
}: DatasetQualityCardProps) {
  return (
    <Card>
      <CardContent
        sx={{
          p: '22px !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.7rem',

                fontWeight: 600,

                textTransform:
                  'uppercase',

                letterSpacing:
                  '0.05em',
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize:
                  '1.65rem',

                fontWeight: 700,

                letterSpacing:
                  '-0.03em',

                mt: 0.5,
              }}
            >
              {score.toFixed(1)}%
            </Typography>
          </Box>

          <Box
            sx={{
              width: 38,
              height: 38,

              borderRadius:
                '12px',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              color: '#0071E3',

              backgroundColor:
                'rgba(0,113,227,0.08)',
            }}
          >
            <ShieldCheck
              size={19}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',

            gridTemplateColumns:
              'repeat(3, 1fr)',

            gap: 1.5,

            mt: 2,
          }}
        >
          <QualityMiniMetric
            label="Blocking"
            value={blocking}
          />

          <QualityMiniMetric
            label="Warnings"
            value={warnings}
          />

          <QualityMiniMetric
            label="Rows affected"
            value={rowsWithIssues}
          />
        </Box>

        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.65rem',

            lineHeight: 1.45,

            mt: 1.75,
          }}
        >
          Application-defined
          Data Quality Score V2.
        </Typography>
      </CardContent>
    </Card>
  );
}

interface QualityMiniMetricProps {
  label: string;
  value: number;
}

function QualityMiniMetric({
  label,
  value,
}: QualityMiniMetricProps) {
  return (
    <Box>
      <Typography
        sx={{
          color:
            'text.secondary',

          fontSize:
            '0.64rem',

          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize:
            '0.95rem',

          fontWeight: 700,

          mt: 0.3,
        }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;

  type:
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral';
}

function MetricCard({
  title,
  value,
  subtitle,
  type,
}: MetricCardProps) {
  const styles =
    getMetricStyle(type);

  return (
    <Card>
      <CardContent
        sx={{
          p: '22px !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: 2,

            mb: 2,
          }}
        >
          <Typography
            sx={{
              color:
                'text.secondary',

              fontSize:
                '0.74rem',

              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 30,
              height: 30,

              borderRadius:
                '9px',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              backgroundColor:
                styles.backgroundColor,

              color:
                styles.color,
            }}
          >
            {type ===
            'success' ? (
              <CheckCircle2
                size={15}
              />
            ) : type ===
              'warning' ? (
              <TriangleAlert
                size={15}
              />
            ) : type ===
              'info' ? (
              <ClipboardCheck
                size={15}
              />
            ) : (
              <Database
                size={15}
              />
            )}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: '1.85rem',

            fontWeight: 700,

            letterSpacing:
              '-0.04em',

            lineHeight: 1,
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.7rem',

            mt: 0.8,
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface SmallMetricCardProps {
  title: string;
  value: number;
  color: string;
}

function SmallMetricCard({
  title,
  value,
  color,
}: SmallMetricCardProps) {
  return (
    <Card>
      <CardContent
        sx={{
          p: '18px !important',
        }}
      >
        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.7rem',

            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 1,

            fontSize:
              '1.45rem',

            fontWeight: 700,

            color,

            letterSpacing:
              '-0.03em',
          }}
        >
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface SummaryLineProps {
  title: string;
  text: string;
}

function SummaryLine({
  title,
  text,
}: SummaryLineProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize:
            '0.78rem',

          fontWeight: 600,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          color:
            'text.secondary',

          fontSize:
            '0.8rem',

          mt: 0.35,

          lineHeight: 1.55,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

interface ReviewMetricProps {
  label: string;
  value: number;
  color: string;
}

function ReviewMetric({
  label,
  value,
  color,
}: ReviewMetricProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize:
            '1.25rem',

          fontWeight: 700,

          color,
        }}
      >
        {value}
      </Typography>

      <Typography
        sx={{
          color:
            'text.secondary',

          fontSize:
            '0.7rem',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

interface LegendItemProps {
  label: string;
  value: number;
  color: string;
}

function LegendItem({
  label,
  value,
  color,
}: LegendItemProps) {
  return (
    <Box
      sx={{
        display: 'flex',

        alignItems: 'center',

        gap: 0.8,
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,

          borderRadius: '50%',

          backgroundColor:
            color,
        }}
      />

      <Typography
        sx={{
          fontSize:
            '0.72rem',

          color:
            'text.secondary',
        }}
      >
        {label}: {value}
      </Typography>
    </Box>
  );
}

/* =========================================================
   CHIPS
========================================================= */

interface ExceptionChipProps {
  status: ReportStatus;
}

function ExceptionChip({
  status,
}: ExceptionChipProps) {
  const style =
    status === 'Difference'
      ? {
          backgroundColor:
            'var(--warning-soft)',

          color:
            '#A64B00',
        }
      : status ===
          'Only ERP'
        ? {
            backgroundColor:
              'var(--info-soft)',

            color:
              '#0066CC',
          }
        : {
            backgroundColor:
              'var(--purple-soft)',

            color:
              '#7C3AED',
          };

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        ...style,

        fontSize:
          '0.7rem',

        fontWeight: 600,
      }}
    />
  );
}

interface HealthChipProps {
  status: HealthStatus;
}

function HealthChip({
  status,
}: HealthChipProps) {
  const styles =
    status === 'Excellent'
      ? {
          backgroundColor:
            'var(--success-soft)',

          color:
            '#248A3D',
        }
      : status === 'Good'
        ? {
            backgroundColor:
              'var(--info-soft)',

            color:
              '#0066CC',
          }
        : status ===
            'Needs Review'
          ? {
              backgroundColor:
                'var(--warning-yellow-soft)',

              color:
                '#9A6700',
            }
          : {
              backgroundColor:
                'var(--danger-soft)',

              color:
                '#D70015',
            };

  return (
    <Chip
      icon={
        <ShieldCheck
          size={15}
        />
      }
      label={status}
      sx={{
        ...styles,

        fontWeight: 600,

        '& .MuiChip-icon': {
          color: styles.color,
        },
      }}
    />
  );
}

/* =========================================================
   REPORT DATA
========================================================= */

function buildReportRows(
  result: ReconciliationResult
): ReportRow[] {
  const rows: ReportRow[] = [];

  result.differences.forEach(
    (record) => {
      record.differences.forEach(
        (difference) => {
          rows.push({
            key: `${record.id}:difference:${difference.field}`,

            id: record.id,

            field:
              formatFieldName(
                difference.field
              ),

            erpValue:
              formatValue(
                difference.erpValue
              ),

            crmValue:
              formatValue(
                difference.crmValue
              ),

            status:
              'Difference',
          });
        }
      );
    }
  );

  result.onlyERP.forEach(
    (record) => {
      rows.push({
        key: `${record.id}:only-erp`,

        id: record.id,

        field:
          'Entire Record',

        erpValue:
          'Present',

        crmValue: '-',

        status:
          'Only ERP',
      });
    }
  );

  result.onlyCRM.forEach(
    (record) => {
      rows.push({
        key: `${record.id}:only-crm`,

        id: record.id,

        field:
          'Entire Record',

        erpValue: '-',

        crmValue:
          'Present',

        status:
          'Only CRM',
      });
    }
  );

  return rows;
}

/* =========================================================
   CSV EXPORT
========================================================= */

function downloadCsvReport({
  result,
  rows,
  reviewedSet,
  erpFileName,
  crmFileName,
  exceptionRecordCount,
  exceptionRate,
  healthStatus,
}: CsvReportOptions) {
  const lines: string[] = [];

  lines.push(
    'Enterprise Data Reconciliation Report'
  );

  lines.push('');

  lines.push(
    `Generated,${escapeCsv(
      formatDate(
        result.executedAt
      )
    )}`
  );

  lines.push(
    `ERP Dataset,${escapeCsv(
      erpFileName
    )}`
  );

  lines.push(
    `CRM Dataset,${escapeCsv(
      crmFileName
    )}`
  );

  lines.push(
    `Health Status,${escapeCsv(
      healthStatus
    )}`
  );

  lines.push('');

  lines.push(
    'Metric,Value'
  );

  lines.push(
    `Total Unique Records,${result.summary.totalUnique}`
  );

  lines.push(
    `Matched,${result.summary.matched}`
  );

  lines.push(
    `Match Rate,${result.summary.matchRate.toFixed(
      1
    )}%`
  );

  lines.push(
    `Affected Records,${exceptionRecordCount}`
  );

  lines.push(
    `Exception Rate,${exceptionRate.toFixed(
      1
    )}%`
  );

  lines.push(
    `Differences,${result.summary.differences}`
  );

  lines.push(
    `Only ERP,${result.summary.onlyERP}`
  );

  lines.push(
    `Only CRM,${result.summary.onlyCRM}`
  );

  lines.push(
    `Total Exceptions,${rows.length}`
  );

  const reviewedCount =
    rows.filter((row) =>
      reviewedSet.has(row.key)
    ).length;

  lines.push(
    `Reviewed Exceptions,${reviewedCount}`
  );

  lines.push(
    `Pending Exceptions,${
      rows.length -
      reviewedCount
    }`
  );

  lines.push('');

  lines.push(
    [
      'Record ID',
      'Field',
      'ERP Value',
      'CRM Value',
      'Exception Type',
      'Review Status',
    ]
      .map(escapeCsv)
      .join(',')
  );

  rows.forEach((row) => {
    lines.push(
      [
        row.id,
        row.field,
        row.erpValue,
        row.crmValue,
        row.status,

        reviewedSet.has(
          row.key
        )
          ? 'Reviewed'
          : 'Pending',
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  const csvContent =
    `\uFEFF${lines.join(
      '\r\n'
    )}`;

  const blob = new Blob(
    [csvContent],
    {
      type:
        'text/csv;charset=utf-8;',
    }
  );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      'a'
    );

  const timestamp =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.href = url;

  link.download =
    `reconciliation-report-${timestamp}.csv`;

  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );

  URL.revokeObjectURL(url);
}

/* =========================================================
   PDF EXPORT
========================================================= */

function downloadPdfReport({
  result,
  rows,
  reviewedSet,
  erpFileName,
  crmFileName,
  reviewedCount,
  pendingCount,
  exceptionRecordCount,
  exceptionRate,
  fieldMetrics,
  healthStatus,
}: PdfReportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const margin = 16;

  /* HEADER */

  doc.setFillColor(
    17,
    19,
    24
  );

  doc.rect(
    0,
    0,
    pageWidth,
    36,
    'F'
  );

  doc.setTextColor(
    255,
    255,
    255
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(18);

  doc.text(
    'Enterprise Data Reconciliation',
    margin,
    16
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(10);

  doc.setTextColor(
    205,
    209,
    217
  );

  doc.text(
    'Executive Reconciliation Report',
    margin,
    24
  );

  doc.setTextColor(
    29,
    29,
    31
  );

  /* METADATA */

  let y = 47;

  doc.setFontSize(9);

  doc.setTextColor(
    110,
    110,
    115
  );

  doc.text(
    'Generated',
    margin,
    y
  );

  doc.text(
    'ERP Dataset',
    76,
    y
  );

  doc.text(
    'CRM Dataset',
    137,
    y
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.text(
    safePdfText(
      formatDate(
        result.executedAt
      )
    ),
    margin,
    y + 6
  );

  doc.text(
    safePdfText(
      truncateText(
        erpFileName,
        28
      )
    ),
    76,
    y + 6
  );

  doc.text(
    safePdfText(
      truncateText(
        crmFileName,
        28
      )
    ),
    137,
    y + 6
  );

  y += 18;

  /* HEALTH */

  doc.setFillColor(
    245,
    245,
    247
  );

  doc.roundedRect(
    margin,
    y,
    pageWidth -
      margin * 2,
    22,
    4,
    4,
    'F'
  );

  doc.setFontSize(9);

  doc.setTextColor(
    110,
    110,
    115
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.text(
    'RECONCILIATION HEALTH',
    margin + 6,
    y + 8
  );

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(14);

  doc.setTextColor(
    ...getPdfHealthColor(
      healthStatus
    )
  );

  doc.text(
    healthStatus,
    margin + 6,
    y + 16
  );

  y += 31;

  /* METRICS */

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.setFontSize(13);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.text(
    'Key Metrics',
    margin,
    y
  );

  y += 5;

  const metricCards = [
    {
      label:
        'Match Rate',
      value: `${result.summary.matchRate.toFixed(
        1
      )}%`,
    },
    {
      label:
        'Exception Rate',
      value: `${exceptionRate.toFixed(
        1
      )}%`,
    },
    {
      label:
        'Unique Records',
      value:
        result.summary.totalUnique.toString(),
    },
    {
      label:
        'Exceptions',
      value:
        rows.length.toString(),
    },
  ];

  const cardGap = 3;

  const cardWidth =
    (pageWidth -
      margin * 2 -
      cardGap * 3) /
    4;

  metricCards.forEach(
    (metric, index) => {
      const x =
        margin +
        index *
          (cardWidth +
            cardGap);

      doc.setFillColor(
        250,
        250,
        252
      );

      doc.setDrawColor(
        232,
        232,
        237
      );

      doc.roundedRect(
        x,
        y,
        cardWidth,
        25,
        3,
        3,
        'FD'
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(7.5);

      doc.setTextColor(
        110,
        110,
        115
      );

      doc.text(
        metric.label,
        x + 4,
        y + 7
      );

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(14);

      doc.setTextColor(
        29,
        29,
        31
      );

      doc.text(
        metric.value,
        x + 4,
        y + 18
      );
    }
  );

  y += 35;

  /* BREAKDOWN */

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(13);

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.text(
    'Reconciliation Breakdown',
    margin,
    y
  );

  y += 8;

  const breakdown = [
    {
      label: 'Matched',
      value:
        result.summary.matched,
      total:
        result.summary.totalUnique,
      color:
        [36, 138, 61] as [
          number,
          number,
          number,
        ],
    },
    {
      label:
        'Differences',
      value:
        result.summary.differences,
      total:
        result.summary.totalUnique,
      color:
        [229, 138, 34] as [
          number,
          number,
          number,
        ],
    },
    {
      label:
        'Only ERP',
      value:
        result.summary.onlyERP,
      total:
        result.summary.totalUnique,
      color:
        [0, 113, 227] as [
          number,
          number,
          number,
        ],
    },
    {
      label:
        'Only CRM',
      value:
        result.summary.onlyCRM,
      total:
        result.summary.totalUnique,
      color:
        [124, 58, 237] as [
          number,
          number,
          number,
        ],
    },
  ];

  breakdown.forEach(
    (item) => {
      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(8);

      doc.setTextColor(
        70,
        70,
        74
      );

      doc.text(
        item.label,
        margin,
        y
      );

      doc.text(
        item.value.toString(),
        pageWidth -
          margin -
          5,
        y,
        {
          align: 'right',
        }
      );

      const percentage =
        item.total === 0
          ? 0
          : item.value /
            item.total;

      const barWidth =
        pageWidth -
        margin * 2 -
        35;

      doc.setFillColor(
        232,
        232,
        237
      );

      doc.roundedRect(
        margin + 30,
        y - 3,
        barWidth,
        3,
        1.5,
        1.5,
        'F'
      );

      doc.setFillColor(
        item.color[0],
        item.color[1],
        item.color[2]
      );

      doc.roundedRect(
        margin + 30,
        y - 3,
        barWidth *
          percentage,
        3,
        1.5,
        1.5,
        'F'
      );

      y += 9;
    }
  );

  y += 3;

  /* EXECUTIVE SUMMARY */

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(13);

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.text(
    'Executive Summary',
    margin,
    y
  );

  y += 7;

  const summaryText = [
    getConsistencySummary(
      result.summary.matchRate
    ),

    `${exceptionRecordCount} of ${result.summary.totalUnique} unique records contain at least one discrepancy, producing an exception rate of ${exceptionRate.toFixed(
      1
    )}%.`,

    `${rows.length} individual exceptions were identified. ${reviewedCount} have been reviewed and ${pendingCount} remain pending.`,

    `${result.summary.onlyERP} records exist only in ERP and ${result.summary.onlyCRM} records exist only in CRM.`,
  ];

  if (
    fieldMetrics.length > 0
  ) {
    summaryText.push(
      `${fieldMetrics[0].name} is the most frequently mismatched field with ${fieldMetrics[0].value} detected differences.`
    );
  }

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(9);

  doc.setTextColor(
    75,
    75,
    80
  );

  summaryText.forEach(
    (paragraph) => {
      const lines =
        doc.splitTextToSize(
          safePdfText(
            paragraph
          ),
          pageWidth -
            margin * 2
        );

      doc.text(
        lines,
        margin,
        y
      );

      y +=
        lines.length * 4.5 +
        3;
    }
  );

  /* PAGE 2 */

  doc.addPage();

  let pageTwoY = 20;

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(16);

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.text(
    'Exception Analysis',
    margin,
    pageTwoY
  );

  pageTwoY += 10;

  /* FIELD METRICS */

  if (
    fieldMetrics.length > 0
  ) {
    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(11);

    doc.text(
      'Differences by Field',
      margin,
      pageTwoY
    );

    pageTwoY += 5;

    autoTable(doc, {
      startY: pageTwoY,

      head: [
        [
          'Field',
          'Differences',
        ],
      ],

      body:
        fieldMetrics.map(
          (item) => [
            safePdfText(
              item.name
            ),

            item.value.toString(),
          ]
        ),

      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        textColor: [
          50,
          50,
          55,
        ],
      },

      headStyles: {
        fillColor: [
          17,
          19,
          24,
        ],

        textColor: [
          255,
          255,
          255,
        ],

        fontStyle:
          'bold',
      },

      margin: {
        left: margin,
        right: margin,
      },
    });

    pageTwoY +=
      fieldMetrics.length *
        8 +
      20;
  }

  /* REVIEW METRICS */

  if (pageTwoY > 210) {
    doc.addPage();
    pageTwoY = 20;
  }

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(11);

  doc.text(
    'Review Progress',
    margin,
    pageTwoY
  );

  pageTwoY += 8;

  const reviewProgress =
    rows.length === 0
      ? 100
      : (reviewedCount /
          rows.length) *
        100;

  doc.setFillColor(
    232,
    232,
    237
  );

  doc.roundedRect(
    margin,
    pageTwoY,
    pageWidth -
      margin * 2,
    5,
    2.5,
    2.5,
    'F'
  );

  doc.setFillColor(
    36,
    138,
    61
  );

  doc.roundedRect(
    margin,
    pageTwoY,
    (pageWidth -
      margin * 2) *
      (reviewProgress /
        100),
    5,
    2.5,
    2.5,
    'F'
  );

  pageTwoY += 12;

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(9);

  doc.setTextColor(
    75,
    75,
    80
  );

  doc.text(
    `Reviewed: ${reviewedCount}`,
    margin,
    pageTwoY
  );

  doc.text(
    `Pending: ${pendingCount}`,
    margin + 50,
    pageTwoY
  );

  doc.text(
    `Completion: ${reviewProgress.toFixed(
      0
    )}%`,
    margin + 100,
    pageTwoY
  );

  pageTwoY += 14;

  /* EXCEPTION TABLE */

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(11);

  doc.setTextColor(
    29,
    29,
    31
  );

  doc.text(
    'Exception Details',
    margin,
    pageTwoY
  );

  pageTwoY += 5;

  autoTable(doc, {
    startY: pageTwoY,

    head: [
      [
        'ID',
        'Field',
        'ERP Value',
        'CRM Value',
        'Type',
        'Review',
      ],
    ],

    body: rows.map(
      (row) => [
        safePdfText(
          row.id
        ),

        safePdfText(
          row.field
        ),

        safePdfText(
          row.erpValue
        ),

        safePdfText(
          row.crmValue
        ),

        safePdfText(
          row.status
        ),

        reviewedSet.has(
          row.key
        )
          ? 'Reviewed'
          : 'Pending',
      ]
    ),

    theme: 'striped',

    styles: {
      font: 'helvetica',

      fontSize: 7,

      cellPadding: 2.2,

      textColor: [
        50,
        50,
        55,
      ],

      overflow:
        'linebreak',
    },

    headStyles: {
      fillColor: [
        17,
        19,
        24,
      ],

      textColor: [
        255,
        255,
        255,
      ],

      fontStyle:
        'bold',
    },

    alternateRowStyles: {
      fillColor: [
        248,
        248,
        250,
      ],
    },

    margin: {
      left: margin,
      right: margin,
      top: 18,
      bottom: 18,
    },
  });

  /* FOOTERS */

  const pageCount =
    doc.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= pageCount;
    pageNumber += 1
  ) {
    doc.setPage(
      pageNumber
    );

    const pageHeight =
      doc.internal.pageSize.getHeight();

    doc.setDrawColor(
      225,
      225,
      230
    );

    doc.line(
      margin,
      pageHeight - 13,
      pageWidth - margin,
      pageHeight - 13
    );

    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(7);

    doc.setTextColor(
      120,
      120,
      125
    );

    doc.text(
      'Enterprise Data Reconciliation Platform',
      margin,
      pageHeight - 7
    );

    doc.text(
      `Page ${pageNumber} of ${pageCount}`,
      pageWidth -
        margin,
      pageHeight - 7,
      {
        align: 'right',
      }
    );
  }

  const timestamp =
    new Date()
      .toISOString()
      .slice(0, 10);

  doc.save(
    `reconciliation-report-${timestamp}.pdf`
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getHealthStatus(
  matchRate: number
): HealthStatus {
  if (matchRate >= 95) {
    return 'Excellent';
  }

  if (matchRate >= 85) {
    return 'Good';
  }

  if (matchRate >= 70) {
    return 'Needs Review';
  }

  return 'Needs Attention';
}

function getConsistencySummary(
  matchRate: number
): string {
  if (matchRate >= 95) {
    return `The reconciliation shows excellent consistency between the compared systems with a ${matchRate.toFixed(
      1
    )}% match rate.`;
  }

  if (matchRate >= 85) {
    return `The reconciliation shows good consistency between the compared systems with a ${matchRate.toFixed(
      1
    )}% match rate.`;
  }

  if (matchRate >= 70) {
    return `The reconciliation shows moderate consistency with a ${matchRate.toFixed(
      1
    )}% match rate. Additional review is recommended.`;
  }

  return `The reconciliation shows low consistency with a ${matchRate.toFixed(
    1
  )}% match rate. The detected discrepancies require attention.`;
}

function getMetricStyle(
  type:
    | 'success'
    | 'warning'
    | 'info'
    | 'neutral'
) {
  switch (type) {
    case 'success':
      return {
        backgroundColor:
          'var(--success-soft)',

        color:
          '#248A3D',
      };

    case 'warning':
      return {
        backgroundColor:
          'var(--warning-soft)',

        color:
          '#A64B00',
      };

    case 'info':
      return {
        backgroundColor:
          'var(--info-soft)',

        color:
          '#0066CC',
      };

    default:
      return {
        backgroundColor:
          'var(--surface-muted)',

        color:
          'var(--neutral-fg)',
      };
  }
}

function getPdfHealthColor(
  status: HealthStatus
): [
  number,
  number,
  number,
] {
  switch (status) {
    case 'Excellent':
      return [
        36,
        138,
        61,
      ];

    case 'Good':
      return [
        0,
        102,
        204,
      ];

    case 'Needs Review':
      return [
        154,
        103,
        0,
      ];

    default:
      return [
        215,
        0,
        21,
      ];
  }
}

function formatFieldName(
  field: string
): string {
  switch (field) {
    case 'cliente':
      return 'Customer';

    case 'monto':
      return 'Amount';

    case 'estado':
      return 'Status';

    default:
      return field;
  }
}

function formatValue(
  value: string | number
): string {
  if (
    typeof value ===
    'number'
  ) {
    return value.toLocaleString(
      'es-CR'
    );
  }

  return value;
}

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  return new Intl.DateTimeFormat(
    'es-CR',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    }
  ).format(date);
}

function escapeCsv(
  value: string
): string {
  const escaped =
    value.replace(
      /"/g,
      '""'
    );

  return `"${escaped}"`;
}

function truncateText(
  value: string,
  maximumLength: number
): string {
  if (
    value.length <=
    maximumLength
  ) {
    return value;
  }

  return `${value.slice(
    0,
    maximumLength - 3
  )}...`;
}

function safePdfText(
  value: string
): string {
  return value
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/•/g, '-');
}