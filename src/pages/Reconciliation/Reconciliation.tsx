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
  ArrowLeftRight,
  CheckCircle2,
  Database,
  GitCompareArrows,
  TriangleAlert,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useReconciliation } from '../../context/ReconciliationContext';

export default function Reconciliation() {
  const navigate = useNavigate();

  const {
    erpData,
    crmData,
    reconciliationResult,
    runReconciliation,
  } = useReconciliation();

  const datasetsReady =
    erpData !== null &&
    crmData !== null &&
    erpData.errors.length === 0 &&
    crmData.errors.length === 0 &&
    erpData.records.length > 0 &&
    crmData.records.length > 0;

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 3,
          mb: 4,
          flexWrap: 'wrap',
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
            Reconciliation
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              mt: 1,
              fontSize: '0.95rem',
            }}
          >
            Compare ERP and CRM datasets and identify
            inconsistencies across enterprise systems.
          </Typography>
        </Box>

        {datasetsReady && (
          <Button
            variant="contained"
            startIcon={
              <GitCompareArrows size={18} />
            }
            onClick={runReconciliation}
            sx={{
              alignSelf: 'flex-start',
              px: 2.5,
              py: 1.2,
            }}
          >
            Run Reconciliation
          </Button>
        )}
      </Box>

      {/* Missing datasets */}
      {!datasetsReady && (
        <Card>
          <CardContent
            sx={{
              p: '32px !important',
            }}
          >
            <Box
              sx={{
                maxWidth: 620,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  backgroundColor:
                    'rgba(0,113,227,0.08)',
                  color: '#0071E3',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Database size={24} />
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
                  color: 'text.secondary',
                  fontSize: '0.88rem',
                  mt: 1,
                  mb: 3,
                }}
              >
                Upload valid ERP and CRM datasets before
                running a reconciliation.
              </Typography>

              <Button
                variant="contained"
                onClick={() =>
                  navigate('/imports')
                }
              >
                Go to Imports
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dataset information */}
      {datasetsReady && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr',
              },
              gap: 3,
              mb: 3,
            }}
          >
            <DatasetCard
              title="ERP Dataset"
              fileName={erpData.fileName}
              records={erpData.records.length}
            />

            <DatasetCard
              title="CRM Dataset"
              fileName={crmData.fileName}
              records={crmData.records.length}
            />
          </Box>

          {!reconciliationResult && (
            <Alert
              severity="info"
              sx={{
                borderRadius: '14px',
              }}
            >
              Both datasets are valid. Run the
              reconciliation to compare their records.
            </Alert>
          )}
        </>
      )}

      {/* Reconciliation results */}
      {reconciliationResult && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 650,
                letterSpacing: '-0.02em',
              }}
            >
              Reconciliation Results
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.82rem',
                mt: 0.5,
              }}
            >
              Last run:{' '}
              {formatDate(
                reconciliationResult.executedAt
              )}
            </Typography>
          </Box>

          {/* KPI Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 2,
              mb: 4,
            }}
          >
            <ResultCard
              title="Matched"
              value={
                reconciliationResult.summary
                  .matched
              }
              subtitle={`${reconciliationResult.summary.matchRate.toFixed(
                1
              )}% match rate`}
              type="success"
            />

            <ResultCard
              title="Differences"
              value={
                reconciliationResult.summary
                  .differences
              }
              subtitle="Same ID, different data"
              type="warning"
            />

            <ResultCard
              title="Only ERP"
              value={
                reconciliationResult.summary
                  .onlyERP
              }
              subtitle="Missing from CRM"
              type="info"
            />

            <ResultCard
              title="Only CRM"
              value={
                reconciliationResult.summary
                  .onlyCRM
              }
              subtitle="Missing from ERP"
              type="purple"
            />

            <ResultCard
              title="Unique Records"
              value={
                reconciliationResult.summary
                  .totalUnique
              }
              subtitle="Across both systems"
              type="neutral"
            />
          </Box>

          {/* Exceptions Table */}
          <Card>
            <CardContent
              sx={{
                p: '28px !important',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  Exceptions
                </Typography>

                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.82rem',
                    mt: 0.5,
                  }}
                >
                  Records requiring review after
                  reconciliation.
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <ExceptionsTable />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

interface DatasetCardProps {
  title: string;
  fileName: string;
  records: number;
}

function DatasetCard({
  title,
  fileName,
  records,
}: DatasetCardProps) {
  return (
    <Card>
      <CardContent
        sx={{
          p: '24px !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                mt: 0.8,
              }}
            >
              {fileName}
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.76rem',
                mt: 0.4,
              }}
            >
              {records.toLocaleString()} records
            </Typography>
          </Box>

          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '13px',
              backgroundColor:
                'rgba(0,113,227,0.08)',
              color: '#0071E3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Database size={20} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface ResultCardProps {
  title: string;
  value: number;
  subtitle: string;

  type:
    | 'success'
    | 'warning'
    | 'info'
    | 'purple'
    | 'neutral';
}

function ResultCard({
  title,
  value,
  subtitle,
  type,
}: ResultCardProps) {
  const styles = getResultCardStyles(type);

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
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.76rem',
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                styles.backgroundColor,
              color: styles.color,
            }}
          >
            {type === 'success' && (
              <CheckCircle2 size={15} />
            )}

            {type === 'warning' && (
              <TriangleAlert size={15} />
            )}

            {(type === 'info' ||
              type === 'purple') && (
              <ArrowLeftRight size={15} />
            )}

            {type === 'neutral' && (
              <Database size={15} />
            )}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: '1.9rem',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {value.toLocaleString()}
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem',
            mt: 0.8,
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ExceptionsTable() {
  const { reconciliationResult } =
    useReconciliation();

  if (!reconciliationResult) {
    return null;
  }

  const hasExceptions =
    reconciliationResult.differences.length >
      0 ||
    reconciliationResult.onlyERP.length > 0 ||
    reconciliationResult.onlyCRM.length > 0;

  if (!hasExceptions) {
    return (
      <Alert
        severity="success"
        sx={{
          borderRadius: '12px',
        }}
      >
        No exceptions were detected. All records
        match.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        overflowX: 'auto',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Field</TableCell>
            <TableCell>ERP Value</TableCell>
            <TableCell>CRM Value</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {reconciliationResult.differences.flatMap(
            (record) =>
              record.differences.map(
                (difference) => (
                  <TableRow
                    key={`${record.id}-${difference.field}`}
                  >
                    <TableCell>
                      {record.id}
                    </TableCell>

                    <TableCell>
                      {formatFieldName(
                        difference.field
                      )}
                    </TableCell>

                    <TableCell>
                      {formatValue(
                        difference.erpValue
                      )}
                    </TableCell>

                    <TableCell>
                      {formatValue(
                        difference.crmValue
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusChip
                        status="Difference"
                      />
                    </TableCell>
                  </TableRow>
                )
              )
          )}

          {reconciliationResult.onlyERP.map(
            (record) => (
              <TableRow
                key={`erp-${record.id}`}
              >
                <TableCell>
                  {record.id}
                </TableCell>

                <TableCell>
                  Entire Record
                </TableCell>

                <TableCell>
                  Present
                </TableCell>

                <TableCell>
                  —
                </TableCell>

                <TableCell>
                  <StatusChip
                    status="Only ERP"
                  />
                </TableCell>
              </TableRow>
            )
          )}

          {reconciliationResult.onlyCRM.map(
            (record) => (
              <TableRow
                key={`crm-${record.id}`}
              >
                <TableCell>
                  {record.id}
                </TableCell>

                <TableCell>
                  Entire Record
                </TableCell>

                <TableCell>
                  —
                </TableCell>

                <TableCell>
                  Present
                </TableCell>

                <TableCell>
                  <StatusChip
                    status="Only CRM"
                  />
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

type StatusType =
  | 'Difference'
  | 'Only ERP'
  | 'Only CRM';

interface StatusChipProps {
  status: StatusType;
}

function StatusChip({
  status,
}: StatusChipProps) {
  const styles =
    status === 'Difference'
      ? {
          backgroundColor: '#FFF1E8',
          color: '#A64B00',
        }
      : status === 'Only ERP'
      ? {
          backgroundColor: '#EAF2FF',
          color: '#0066CC',
        }
      : {
          backgroundColor: '#F2EBFF',
          color: '#7C3AED',
        };

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor:
          styles.backgroundColor,
        color: styles.color,
        fontWeight: 600,
        fontSize: '0.7rem',
      }}
    />
  );
}

function getResultCardStyles(
  type: ResultCardProps['type']
) {
  switch (type) {
    case 'success':
      return {
        backgroundColor: '#EAF7EE',
        color: '#248A3D',
      };

    case 'warning':
      return {
        backgroundColor: '#FFF1E8',
        color: '#A64B00',
      };

    case 'info':
      return {
        backgroundColor: '#EAF2FF',
        color: '#0066CC',
      };

    case 'purple':
      return {
        backgroundColor: '#F2EBFF',
        color: '#7C3AED',
      };

    default:
      return {
        backgroundColor: '#F2F2F7',
        color: '#6E6E73',
      };
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
  if (typeof value === 'number') {
    return value.toLocaleString('es-CR');
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