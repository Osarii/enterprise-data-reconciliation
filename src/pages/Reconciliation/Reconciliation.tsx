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
  ArrowLeftRight,
  CheckCircle2,
  Database,
  GitCompareArrows,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useReconciliation,
} from '../../context/ReconciliationContext';

import {
  hasBlockingIssues,
} from '../../utils/dataQuality';

import {
  formatDuration,
  formatThroughput,
  getObservedPipelineMs,
} from '../../utils/performanceMetrics';

import type {
  ComparableField,
  MatchType,
} from '../../types/ReconciliationResult';

type ExceptionType =
  | 'Difference'
  | 'Only ERP'
  | 'Only CRM';

interface ExceptionRow {
  key: string;

  id: string;

  field: string;

  erpValue: string;

  crmValue: string;

  status:
    ExceptionType;
}

export default function Reconciliation() {
  const navigate =
    useNavigate();

  const {
    erpData,
    crmData,

    reconciliationResult,
    reconciliationRules,
    isReconciling,
    reconciliationError,

    runReconciliation,
  } =
    useReconciliation();

  const datasetsReady =
    erpData !== null &&
    crmData !== null &&
    !hasBlockingIssues(
      erpData.issues
    ) &&
    !hasBlockingIssues(
      crmData.issues
    ) &&
    erpData.records.length >
      0 &&
    crmData.records.length >
      0;

  const handleReconciliation = () => {
    void runReconciliation();
  };

  if (!datasetsReady) {
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
                maxWidth: 600,
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
                    'var(--primary-soft)',

                  color:
                    '#0071E3',

                  mb: 2,
                }}
              >
                <Database
                  size={24}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Datasets required
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
                Upload valid ERP and
                CRM datasets before
                running a
                reconciliation.
              </Typography>

              <Button
                variant="contained"
                onClick={() =>
                  navigate(
                    '/imports'
                  )
                }
              >
                Go to Imports
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const exceptionRows =
    reconciliationResult
      ? buildExceptionRows(
          reconciliationResult
        )
      : [];

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

        <Button
          variant="contained"
          startIcon={
            <GitCompareArrows
              size={18}
            />
          }
          onClick={
            handleReconciliation
          }
          disabled={isReconciling}
          sx={{
            alignSelf:
              'flex-start',

            px: 2.5,

            py: 1.2,
          }}
        >
          {isReconciling
            ? 'Reconciling...'
            : reconciliationResult
              ? 'Run Again'
              : 'Run Reconciliation'}
        </Button>
      </Box>

      {/* DATASETS */}
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
        <DatasetCard
          title="ERP Dataset"
          fileName={
            erpData.fileName
          }
          records={
            erpData.records
              .length
          }
          qualityScore={
            erpData.qualityScore
          }
        />

        <DatasetCard
          title="CRM Dataset"
          fileName={
            crmData.fileName
          }
          records={
            crmData.records
              .length
          }
          qualityScore={
            crmData.qualityScore
          }
        />
      </Box>

      {/* ACTIVE RECONCILIATION RULES */}
      <Alert
        severity="info"
        icon={
          <Sparkles
            size={20}
          />
        }
        sx={{
          mb: 3,
          borderRadius: '14px',
        }}
      >
        Active rules: customer normalization {reconciliationRules.normalizeCustomerNames ? 'on' : 'off'}, status normalization {reconciliationRules.normalizeStatuses ? 'on' : 'off'}, amount tolerance {reconciliationRules.amountToleranceEnabled ? `±${reconciliationRules.amountTolerance}` : 'strict'}. ID matching remains exact.
      </Alert>

      {reconciliationError && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '14px' }}
        >
          {reconciliationError}
        </Alert>
      )}

      {isReconciling && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: '26px !important' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                mb: 1.5,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 650 }}
                >
                  Reconciling in background
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    color: 'text.secondary',
                    fontSize: '0.84rem',
                  }}
                >
                  Processing {(erpData.records.length + crmData.records.length).toLocaleString()} records in a Web Worker so the interface remains responsive.
                </Typography>
              </Box>

              <Chip
                size="small"
                label="Background worker"
                sx={{
                  fontWeight: 650,
                  backgroundColor: 'var(--primary-soft)',
                  color: 'primary.main',
                }}
              />
            </Box>

            <LinearProgress />
          </CardContent>
        </Card>
      )}

      {reconciliationResult === null ? (
        isReconciling ? null : (
          <Card>
          <CardContent
            sx={{
              p: '30px !important',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Ready for
              reconciliation
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.85rem',

                mt: 0.8,
              }}
            >
              Both datasets passed
              validation. Run the
              reconciliation engine to
              compare the ERP and CRM
              records.
            </Typography>
          </CardContent>
          </Card>
        )
      ) : (
        <>
          {/* RESULT SUMMARY */}
          <Box
            sx={{
              display: 'flex',

              justifyContent:
                'space-between',

              alignItems:
                'flex-end',

              gap: 2,

              flexWrap: 'wrap',

              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,

                  letterSpacing:
                    '-0.02em',
                }}
              >
                Reconciliation
                Results
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.8rem',

                  mt: 0.5,
                }}
              >
                Last run:{' '}
                {formatDate(
                  reconciliationResult
                    .executedAt
                )}
              </Typography>
            </Box>

            <Chip
              label={`${reconciliationResult.summary.matchRate.toFixed(
                1
              )}% match rate`}
              sx={{
                backgroundColor:
                  'var(--success-soft)',

                color:
                  'var(--success-fg)',

                fontWeight: 600,
              }}
            />
          </Box>

          {/* KPI */}
          <Box
            sx={{
              display: 'grid',

              gridTemplateColumns:
                {
                  xs: '1fr',

                  sm: 'repeat(2, 1fr)',

                  lg: 'repeat(auto-fit, minmax(135px, 1fr))',
                },

              gap: 2,

              mb: 3,
            }}
          >
            <ResultCard
              title="Exact Matches"
              value={
                reconciliationResult
                  .summary
                  .exactMatched
              }
              subtitle="Raw values equal"
              type="exact"
            />

            <ResultCard
              title="Normalized"
              value={
                reconciliationResult
                  .summary
                  .normalizedMatched
              }
              subtitle="Formatting adjusted"
              type="normalized"
            />

            <ResultCard
              title="Tolerance"
              value={
                reconciliationResult
                  .summary
                  .toleranceMatched
              }
              subtitle="Accepted by rule"
              type="normalized"
            />

            <ResultCard
              title="Differences"
              value={
                reconciliationResult
                  .summary
                  .differences
              }
              subtitle="Real mismatches"
              type="difference"
            />

            <ResultCard
              title="Only ERP"
              value={
                reconciliationResult
                  .summary.onlyERP
              }
              subtitle="Missing CRM"
              type="erp"
            />

            <ResultCard
              title="Only CRM"
              value={
                reconciliationResult
                  .summary.onlyCRM
              }
              subtitle="Missing ERP"
              type="crm"
            />

            <ResultCard
              title="Unique Records"
              value={
                reconciliationResult
                  .summary
                  .totalUnique
              }
              subtitle="Across systems"
              type="total"
            />
          </Box>

          <ProcessingPerformanceCard
            reconciliationMs={
              reconciliationResult.processing.durationMs
            }
            totalRows={
              reconciliationResult.processing.totalRowsProcessed
            }
            throughput={
              reconciliationResult.processing.throughputRowsPerSecond
            }
            workloadTier={
              reconciliationResult.processing.workloadTier
            }
            observedPipelineMs={getObservedPipelineMs(
              erpData,
              crmData,
              reconciliationResult.processing
            )}
          />

          {/* MATCH ANALYSIS */}
          <Card
            sx={{
              mb: 3,
            }}
          >
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

                  alignItems:
                    'center',

                  gap: 2,

                  flexWrap:
                    'wrap',

                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight:
                        600,
                    }}
                  >
                    Match Analysis
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        'text.secondary',

                      fontSize:
                        '0.78rem',

                      mt: 0.4,
                    }}
                  >
                    Distinguishes exact matches from records accepted after normalization or configured tolerance rules.
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={`${reconciliationResult.matched.length} matched`}
                  sx={{
                    backgroundColor:
                      'var(--surface-muted)',

                    color:
                      'var(--neutral-fg)',

                    fontWeight:
                      600,
                  }}
                />
              </Box>

              <Divider
                sx={{
                  mb: 2,
                }}
              />

              {reconciliationResult
                .matched.length ===
              0 ? (
                <Alert
                  severity="warning"
                  sx={{
                    borderRadius:
                      '12px',
                  }}
                >
                  No matched records
                  were found.
                </Alert>
              ) : (
                <Box
                  sx={{
                    overflowX:
                      'auto',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          ID
                        </TableCell>

                        <TableCell>
                          Customer
                        </TableCell>

                        <TableCell>
                          Match Type
                        </TableCell>

                        <TableCell>
                          Normalized Fields
                        </TableCell>

                        <TableCell>
                          Tolerance Fields
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {reconciliationResult
                        .matched.map(
                          (
                            record
                          ) => (
                            <TableRow
                              key={
                                record.id
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
                                  {
                                    record.id
                                  }
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
                                    record
                                      .erpRecord
                                      .cliente
                                  }
                                </Typography>
                              </TableCell>

                              <TableCell>
                                <MatchChip
                                  matchType={
                                    record.matchType
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                {record
                                  .normalizedFields
                                  .length ===
                                0 ? (
                                  <Typography
                                    sx={{
                                      color:
                                        'text.secondary',

                                      fontSize:
                                        '0.78rem',
                                    }}
                                  >
                                    —
                                  </Typography>
                                ) : (
                                  <Box
                                    sx={{
                                      display:
                                        'flex',

                                      gap: 0.7,

                                      flexWrap:
                                        'wrap',
                                    }}
                                  >
                                    {record.normalizedFields.map(
                                      (
                                        field
                                      ) => (
                                        <Chip
                                          key={
                                            field
                                          }
                                          size="small"
                                          label={formatFieldName(
                                            field
                                          )}
                                          sx={{
                                            backgroundColor:
                                              'var(--info-soft-alt)',

                                            color:
                                              'var(--info-fg)',

                                            fontSize:
                                              '0.67rem',

                                            fontWeight:
                                              600,
                                          }}
                                        />
                                      )
                                    )}
                                  </Box>
                                )}
                              </TableCell>

                              <TableCell>
                                {record.toleranceFields.length === 0 ? (
                                  <Typography
                                    sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.78rem',
                                    }}
                                  >
                                    —
                                  </Typography>
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 0.7,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    {record.toleranceFields.map((field) => (
                                      <Chip
                                        key={field}
                                        size="small"
                                        label={formatFieldName(field)}
                                        sx={{
                                          backgroundColor: 'var(--warning-soft)',
                                          color: 'var(--warning-fg)',
                                          fontSize: '0.67rem',
                                          fontWeight: 600,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* EXCEPTIONS */}
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

                  flexWrap:
                    'wrap',

                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight:
                        600,
                    }}
                  >
                    Exceptions
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        'text.secondary',

                      fontSize:
                        '0.78rem',

                      mt: 0.4,
                    }}
                  >
                    Only real
                    differences and
                    missing records
                    appear here.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  disabled={
                    exceptionRows.length ===
                    0
                  }
                  onClick={() =>
                    navigate(
                      '/exceptions'
                    )
                  }
                >
                  Review Exceptions
                </Button>
              </Box>

              <Divider
                sx={{
                  mb: 2,
                }}
              />

              {exceptionRows.length ===
              0 ? (
                <Alert
                  severity="success"
                  sx={{
                    borderRadius:
                      '12px',
                  }}
                >
                  No real discrepancies
                  were detected.
                </Alert>
              ) : (
                <Box
                  sx={{
                    overflowX:
                      'auto',
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
                          Type
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {exceptionRows.map(
                        (row) => (
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
                                {
                                  row.id
                                }
                              </Typography>
                            </TableCell>

                            <TableCell>
                              {
                                row.field
                              }
                            </TableCell>

                            <TableCell>
                              {
                                row.erpValue
                              }
                            </TableCell>

                            <TableCell>
                              {
                                row.crmValue
                              }
                            </TableCell>

                            <TableCell>
                              <ExceptionChip
                                status={
                                  row.status
                                }
                              />
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

function ProcessingPerformanceCard({
  reconciliationMs,
  totalRows,
  throughput,
  workloadTier,
  observedPipelineMs,
}: {
  reconciliationMs: number;
  totalRows: number;
  throughput: number;
  workloadTier: string;
  observedPipelineMs: number;
}) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: '22px !important' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            flexWrap: 'wrap',
            mb: 1.75,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              Processing Performance
            </Typography>

            <Typography
              sx={{
                mt: 0.35,
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              Browser-observed execution metrics for the current reconciliation pipeline.
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${workloadTier} workload`}
            sx={{
              backgroundColor: 'var(--primary-soft)',
              color: 'primary.main',
              fontWeight: 700,
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1.25,
          }}
        >
          <PerformanceMetric
            label="Rows Processed"
            value={totalRows.toLocaleString()}
          />
          <PerformanceMetric
            label="Reconciliation Time"
            value={formatDuration(reconciliationMs)}
          />
          <PerformanceMetric
            label="Throughput"
            value={formatThroughput(throughput)}
          />
          <PerformanceMetric
            label="Observed Pipeline"
            value={formatDuration(observedPipelineMs)}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

function PerformanceMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
          fontSize: '0.92rem',
          fontWeight: 750,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

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
        Reconciliation
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
        Compare validated ERP and
        CRM records using exact and
        normalized matching.
      </Typography>
    </Box>
  );
}

interface DatasetCardProps {
  title: string;

  fileName: string;

  records: number;

  qualityScore: number;
}

function DatasetCard({
  title,
  fileName,
  records,
  qualityScore,
}: DatasetCardProps) {
  return (
    <Card>
      <CardContent
        sx={{
          p: '20px !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            gap: 2,
          }}
        >
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
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize:
                  '0.88rem',

                fontWeight: 600,

                mt: 0.5,
              }}
            >
              {fileName}
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',

                fontSize:
                  '0.7rem',

                mt: 0.3,
              }}
            >
              {records.toLocaleString()}{' '}
              records · Quality{' '}
              {qualityScore}%
            </Typography>
          </Box>

          <Chip
            size="small"
            icon={
              <CheckCircle2
                size={14}
              />
            }
            label="Ready"
            sx={{
              backgroundColor:
                'var(--success-soft)',

              color:
                'var(--success-fg)',

              fontWeight: 600,

              '& .MuiChip-icon':
                {
                  color:
                    'inherit',
                },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

type ResultType =
  | 'exact'
  | 'normalized'
  | 'difference'
  | 'erp'
  | 'crm'
  | 'total';

interface ResultCardProps {
  title: string;

  value: number;

  subtitle: string;

  type: ResultType;
}

function ResultCard({
  title,
  value,
  subtitle,
  type,
}: ResultCardProps) {
  const style =
    getResultCardStyle(
      type
    );

  return (
    <Card>
      <CardContent
        sx={{
          p: '19px !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',

            justifyContent:
              'space-between',

            gap: 1,

            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              color:
                'text.secondary',

              fontSize:
                '0.69rem',

              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 27,

              height: 27,

              borderRadius:
                '8px',

              display: 'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              backgroundColor:
                style.backgroundColor,

              color:
                style.color,
            }}
          >
            {type ===
            'exact' ? (
              <CheckCircle2
                size={14}
              />
            ) : type ===
              'normalized' ? (
              <Sparkles
                size={14}
              />
            ) : type ===
              'difference' ? (
              <TriangleAlert
                size={14}
              />
            ) : type ===
              'total' ? (
              <Database
                size={14}
              />
            ) : (
              <ArrowLeftRight
                size={14}
              />
            )}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize:
              '1.65rem',

            fontWeight: 700,

            letterSpacing:
              '-0.04em',
          }}
        >
          {value.toLocaleString()}
        </Typography>

        <Typography
          sx={{
            color:
              'text.secondary',

            fontSize:
              '0.66rem',

            mt: 0.5,
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

function MatchChip({
  matchType,
}: {
  matchType: MatchType;
}) {
  const normalized =
    matchType ===
    'Normalized Match';

  const tolerance =
    matchType ===
    'Tolerance Match';

  return (
    <Chip
      size="small"
      icon={
        normalized ? (
          <Sparkles
            size={13}
          />
        ) : (
          <CheckCircle2
            size={13}
          />
        )
      }
      label={matchType}
      sx={{
        backgroundColor:
          tolerance
            ? 'var(--warning-soft)'
            : normalized
              ? 'var(--info-soft-alt)'
              : 'var(--success-soft)',

        color:
          tolerance
            ? 'var(--warning-fg)'
            : normalized
              ? 'var(--info-fg)'
              : 'var(--success-fg)',

        fontSize:
          '0.68rem',

        fontWeight: 600,

        '& .MuiChip-icon':
          {
            color: 'inherit',
          },
      }}
    />
  );
}

function ExceptionChip({
  status,
}: {
  status:
    ExceptionType;
}) {
  const style =
    status ===
    'Difference'
      ? {
          backgroundColor:
            'var(--warning-soft)',

          color:
            'var(--warning-fg)',
        }
      : status ===
          'Only ERP'
        ? {
            backgroundColor:
              'var(--info-soft)',

            color:
              'var(--info-fg)',
          }
        : {
            backgroundColor:
              'var(--purple-soft)',

            color:
              'var(--purple-fg)',
          };

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        ...style,

        fontSize:
          '0.68rem',

        fontWeight: 600,
      }}
    />
  );
}

function getResultCardStyle(
  type: ResultType
) {
  switch (type) {
    case 'exact':
      return {
        backgroundColor:
          'var(--success-soft)',

        color:
          'var(--success-fg)',
      };

    case 'normalized':
      return {
        backgroundColor:
          'var(--info-soft-alt)',

        color:
          'var(--info-fg)',
      };

    case 'difference':
      return {
        backgroundColor:
          'var(--warning-soft)',

        color:
          'var(--warning-fg)',
      };

    case 'erp':
      return {
        backgroundColor:
          'var(--info-soft)',

        color:
          'var(--info-fg)',
      };

    case 'crm':
      return {
        backgroundColor:
          'var(--purple-soft)',

        color:
          'var(--purple-fg)',
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

function buildExceptionRows(
  result:
    NonNullable<
      ReturnType<
        typeof useReconciliation
      >['reconciliationResult']
    >
): ExceptionRow[] {
  const rows:
    ExceptionRow[] = [];

  result.differences.forEach(
    (record) => {
      record.differences.forEach(
        (difference) => {
          rows.push({
            key: `${record.id}:difference:${difference.field}`,

            id:
              record.id,

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

        id:
          record.id,

        field:
          'Entire Record',

        erpValue:
          'Present',

        crmValue:
          '—',

        status:
          'Only ERP',
      });
    }
  );

  result.onlyCRM.forEach(
    (record) => {
      rows.push({
        key: `${record.id}:only-crm`,

        id:
          record.id,

        field:
          'Entire Record',

        erpValue:
          '—',

        crmValue:
          'Present',

        status:
          'Only CRM',
      });
    }
  );

  return rows;
}

function formatFieldName(
  field:
    ComparableField
): string {
  switch (field) {
    case 'cliente':
      return 'Customer';

    case 'monto':
      return 'Amount';

    case 'estado':
      return 'Status';
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
  return new Intl.DateTimeFormat(
    'es-CR',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    }
  ).format(
    new Date(value)
  );
}