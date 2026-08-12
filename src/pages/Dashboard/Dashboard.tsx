import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import {
  ArrowLeftRight,
  CircleCheck,
  Database,
  FileSearch,
  Layers,
  TriangleAlert,
  Upload,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useReconciliation } from '../../context/ReconciliationContext';

interface RecentResult {
  id: string;
  field: string;
  erpValue: string;
  crmValue: string;
  status:
    | 'Match'
    | 'Difference'
    | 'Only ERP'
    | 'Only CRM';
}

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    erpData,
    crmData,
    reconciliationResult,
  } = useReconciliation();

  const datasetsLoaded =
    erpData !== null &&
    crmData !== null &&
    erpData.errors.length === 0 &&
    crmData.errors.length === 0;

  const hasResults =
    reconciliationResult !== null;

  const recentResults =
    reconciliationResult
      ? buildRecentResults(
          reconciliationResult
        )
      : [];

  const kpis = hasResults
    ? [
        {
          title: 'Total Records',
          value:
            reconciliationResult.summary
              .totalUnique,
          subtitle:
            'Unique records compared',
          icon: Database,
        },
        {
          title: 'Matched',
          value:
            reconciliationResult.summary
              .matched,
          subtitle: `${reconciliationResult.summary.matchRate.toFixed(
            1
          )}% match rate`,
          icon: CircleCheck,
        },
        {
          title: 'Differences',
          value:
            reconciliationResult.summary
              .differences,
          subtitle: 'Require review',
          icon: TriangleAlert,
        },
        {
          title: 'Only ERP',
          value:
            reconciliationResult.summary
              .onlyERP,
          subtitle: 'Missing from CRM',
          icon: Layers,
        },
        {
          title: 'Only CRM',
          value:
            reconciliationResult.summary
              .onlyCRM,
          subtitle: 'Missing from ERP',
          icon: ArrowLeftRight,
        },
      ]
    : [
        {
          title: 'Total Records',
          value: 0,
          subtitle: 'No reconciliation yet',
          icon: Database,
        },
        {
          title: 'Matched',
          value: 0,
          subtitle: 'No reconciliation yet',
          icon: CircleCheck,
        },
        {
          title: 'Differences',
          value: 0,
          subtitle: 'No reconciliation yet',
          icon: TriangleAlert,
        },
        {
          title: 'Only ERP',
          value: 0,
          subtitle: 'No reconciliation yet',
          icon: Layers,
        },
        {
          title: 'Only CRM',
          value: 0,
          subtitle: 'No reconciliation yet',
          icon: ArrowLeftRight,
        },
      ];

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 3,
          flexWrap: 'wrap',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Data Reconciliation Overview
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              mt: 1,
              fontSize: '0.95rem',
            }}
          >
            Monitor data consistency,
            imports and discrepancies
            across enterprise systems.
          </Typography>
        </Box>

        {!erpData || !crmData ? (
          <Button
            variant="contained"
            startIcon={<Upload size={18} />}
            onClick={() =>
              navigate('/imports')
            }
            sx={{
              alignSelf: 'flex-start',
              px: 2.5,
              py: 1.2,
            }}
          >
            Import Data
          </Button>
        ) : !hasResults ? (
          <Button
            variant="contained"
            startIcon={
              <FileSearch size={18} />
            }
            onClick={() =>
              navigate('/reconciliation')
            }
            sx={{
              alignSelf: 'flex-start',
              px: 2.5,
              py: 1.2,
            }}
          >
            Reconcile Data
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={
              <FileSearch size={18} />
            }
            onClick={() =>
              navigate('/reconciliation')
            }
            sx={{
              alignSelf: 'flex-start',
              px: 2.5,
              py: 1.2,
            }}
          >
            View Reconciliation
          </Button>
        )}
      </Box>

      {/* Dataset Status */}
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
        <DatasetStatusCard
          title="ERP Dataset"
          fileName={erpData?.fileName}
          records={
            erpData?.records.length ?? 0
          }
          valid={
            erpData !== null &&
            erpData.errors.length === 0
          }
        />

        <DatasetStatusCard
          title="CRM Dataset"
          fileName={crmData?.fileName}
          records={
            crmData?.records.length ?? 0
          }
          valid={
            crmData !== null &&
            crmData.errors.length === 0
          }
        />
      </Box>

      {/* Status Message */}
      {!datasetsLoaded && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: '14px',
          }}
        >
          Upload valid ERP and CRM
          datasets to begin the
          reconciliation process.
        </Alert>
      )}

      {datasetsLoaded &&
        !hasResults && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: '14px',
            }}
          >
            Both datasets are ready.
            Run a reconciliation to
            generate real dashboard
            metrics.
          </Alert>
        )}

      {hasResults && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: '14px',
          }}
        >
          Latest reconciliation
          completed successfully.
          Dashboard metrics are based
          on the current ERP and CRM
          datasets.
        </Alert>
      )}

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 2,
          mb: 4,
        }}
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.title}>
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
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        'text.secondary',
                      fontSize:
                        '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {kpi.title}
                  </Typography>

                  <Icon
                    size={18}
                    strokeWidth={1.7}
                    color="#6E6E73"
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: '1.9rem',
                    fontWeight: 700,
                    letterSpacing:
                      '-0.04em',
                    lineHeight: 1.1,
                  }}
                >
                  {kpi.value.toLocaleString()}
                </Typography>

                <Typography
                  sx={{
                    color:
                      'text.secondary',
                    fontSize:
                      '0.72rem',
                    mt: 0.75,
                  }}
                >
                  {kpi.subtitle}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Recent Results */}
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
              alignItems: 'flex-start',
              gap: 2,
              flexWrap: 'wrap',
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Recent Reconciliation
                Results
              </Typography>

              <Typography
                sx={{
                  color:
                    'text.secondary',
                  fontSize:
                    '0.83rem',
                  mt: 0.5,
                }}
              >
                Latest results
                detected between ERP
                and CRM datasets.
              </Typography>
            </Box>

            {hasResults && (
              <Typography
                sx={{
                  color:
                    'text.secondary',
                  fontSize:
                    '0.72rem',
                }}
              >
                {formatDate(
                  reconciliationResult.executedAt
                )}
              </Typography>
            )}
          </Box>

          {!hasResults ? (
            <EmptyResults
              datasetsLoaded={
                datasetsLoaded
              }
              onImports={() =>
                navigate('/imports')
              }
              onReconciliation={() =>
                navigate(
                  '/reconciliation'
                )
              }
            />
          ) : recentResults.length ===
            0 ? (
            <Alert
              severity="success"
              sx={{
                borderRadius: '12px',
              }}
            >
              No records are available
              to display.
            </Alert>
          ) : (
            <>
              {/* Table Header */}
              <Box
                sx={{
                  display: {
                    xs: 'none',
                    md: 'grid',
                  },

                  gridTemplateColumns:
                    '120px 1fr 1fr 1fr 120px',

                  gap: 2,
                  px: 2,
                  pb: 1.5,

                  borderBottom:
                    '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {[
                  'Record ID',
                  'Field',
                  'ERP Value',
                  'CRM Value',
                  'Status',
                ].map((header) => (
                  <Typography
                    key={header}
                    sx={{
                      color:
                        'text.secondary',
                      fontSize:
                        '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {header}
                  </Typography>
                ))}
              </Box>

              {/* Rows */}
              <Stack
                spacing={0.5}
                sx={{
                  mt: 1,
                }}
              >
                {recentResults.map(
                  (
                    record,
                    index
                  ) => {
                    const statusStyles =
                      getStatusStyles(
                        record.status
                      );

                    return (
                      <Box
                        key={`${record.id}-${record.field}-${index}`}
                        sx={{
                          display:
                            'grid',

                          gridTemplateColumns:
                            {
                              xs: '1fr',
                              md: '120px 1fr 1fr 1fr 120px',
                            },

                          alignItems:
                            'center',

                          gap: {
                            xs: 1,
                            md: 2,
                          },

                          px: 2,
                          py: 1.8,

                          borderRadius:
                            '12px',

                          transition:
                            'background-color 0.2s ease',

                          '&:hover': {
                            backgroundColor:
                              '#F8F8FA',
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize:
                              '0.82rem',
                            fontWeight:
                              600,
                          }}
                        >
                          {record.id}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize:
                              '0.82rem',
                          }}
                        >
                          {record.field}
                        </Typography>

                        <Typography
                          sx={{
                            fontSize:
                              '0.82rem',
                            color:
                              'text.secondary',
                          }}
                        >
                          {
                            record.erpValue
                          }
                        </Typography>

                        <Typography
                          sx={{
                            fontSize:
                              '0.82rem',
                            color:
                              'text.secondary',
                          }}
                        >
                          {
                            record.crmValue
                          }
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            record.status
                          }
                          sx={{
                            ...statusStyles,

                            fontSize:
                              '0.7rem',

                            fontWeight:
                              600,

                            borderRadius:
                              '999px',

                            minWidth: 92,

                            justifySelf: {
                              xs: 'start',
                              md: 'stretch',
                            },

                            '& .MuiChip-label':
                              {
                                px: 1.5,
                              },
                          }}
                        />
                      </Box>
                    );
                  }
                )}
              </Stack>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  mt: 3,
                }}
              >
                <Button
                  variant="text"
                  onClick={() =>
                    navigate(
                      '/reconciliation'
                    )
                  }
                >
                  View all results
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

interface DatasetStatusCardProps {
  title: string;
  fileName?: string;
  records: number;
  valid: boolean;
}

function DatasetStatusCard({
  title,
  fileName,
  records,
  valid,
}: DatasetStatusCardProps) {
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
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color:
                  'text.secondary',
                fontSize: '0.7rem',
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
                fontSize: '0.9rem',
                fontWeight: 600,
                mt: 0.5,
              }}
            >
              {fileName ??
                'No file uploaded'}
            </Typography>

            <Typography
              sx={{
                color:
                  'text.secondary',
                fontSize: '0.72rem',
                mt: 0.3,
              }}
            >
              {fileName
                ? `${records.toLocaleString()} records`
                : 'Waiting for data'}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={
              valid
                ? 'Ready'
                : 'Not loaded'
            }
            sx={{
              backgroundColor: valid
                ? '#EAF7EE'
                : '#F2F2F7',

              color: valid
                ? '#248A3D'
                : '#6E6E73',

              fontSize: '0.7rem',
              fontWeight: 600,
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

interface EmptyResultsProps {
  datasetsLoaded: boolean;
  onImports: () => void;
  onReconciliation: () => void;
}

function EmptyResults({
  datasetsLoaded,
  onImports,
  onReconciliation,
}: EmptyResultsProps) {
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        borderRadius: '16px',
        backgroundColor: '#FAFAFC',
        border:
          '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          mx: 'auto',
          mb: 2,

          borderRadius: '14px',

          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',

          backgroundColor:
            'rgba(0,113,227,0.08)',

          color: '#0071E3',
        }}
      >
        <FileSearch size={23} />
      </Box>

      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        No reconciliation results yet
      </Typography>

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.8rem',
          mt: 0.75,
          maxWidth: 430,
          mx: 'auto',
        }}
      >
        {datasetsLoaded
          ? 'Your ERP and CRM datasets are ready. Run a reconciliation to generate dashboard metrics.'
          : 'Upload ERP and CRM datasets before running your first reconciliation.'}
      </Typography>

      <Button
        variant="contained"
        onClick={
          datasetsLoaded
            ? onReconciliation
            : onImports
        }
        sx={{
          mt: 2.5,
        }}
      >
        {datasetsLoaded
          ? 'Run Reconciliation'
          : 'Import Data'}
      </Button>
    </Box>
  );
}

function buildRecentResults(
  result: NonNullable<
    ReturnType<
      typeof useReconciliation
    >['reconciliationResult']
  >
): RecentResult[] {
  const rows: RecentResult[] = [];

  result.differences.forEach(
    (record) => {
      record.differences.forEach(
        (difference) => {
          rows.push({
            id: record.id,

            field: formatFieldName(
              difference.field
            ),

            erpValue: formatValue(
              difference.erpValue
            ),

            crmValue: formatValue(
              difference.crmValue
            ),

            status: 'Difference',
          });
        }
      );
    }
  );

  result.onlyERP.forEach(
    (record) => {
      rows.push({
        id: record.id,
        field: 'Entire Record',
        erpValue: 'Present',
        crmValue: '—',
        status: 'Only ERP',
      });
    }
  );

  result.onlyCRM.forEach(
    (record) => {
      rows.push({
        id: record.id,
        field: 'Entire Record',
        erpValue: '—',
        crmValue: 'Present',
        status: 'Only CRM',
      });
    }
  );

  result.matched.forEach(
    (record) => {
      rows.push({
        id: record.id,
        field: 'Entire Record',
        erpValue: 'Matched',
        crmValue: 'Matched',
        status: 'Match',
      });
    }
  );

  return rows.slice(0, 8);
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
  if (typeof value === 'number') {
    return value.toLocaleString(
      'es-CR'
    );
  }

  return value;
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(
    'es-CR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    }
  ).format(date);
}

function getStatusStyles(
  status: RecentResult['status']
) {
  switch (status) {
    case 'Match':
      return {
        backgroundColor:
          '#EAF7EE',
        color: '#248A3D',
      };

    case 'Difference':
      return {
        backgroundColor:
          '#FFF1E8',
        color: '#A64B00',
      };

    case 'Only ERP':
      return {
        backgroundColor:
          '#EAF2FF',
        color: '#0066CC',
      };

    case 'Only CRM':
      return {
        backgroundColor:
          '#F2EBFF',
        color: '#7C3AED',
      };

    default:
      return {
        backgroundColor:
          '#F5F5F7',
        color: '#6E6E73',
      };
  }
}