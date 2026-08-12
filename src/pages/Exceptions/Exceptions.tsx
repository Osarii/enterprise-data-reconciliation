import {
  useMemo,
  useState,
} from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Filter,
  Search,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useReconciliation } from '../../context/ReconciliationContext';

import type { ReconciliationResult } from '../../types/ReconciliationResult';

type ExceptionType =
  | 'Difference'
  | 'Only ERP'
  | 'Only CRM';

type ExceptionFilter =
  | 'All'
  | ExceptionType;

type ReviewFilter =
  | 'All'
  | 'Pending'
  | 'Reviewed';

interface ExceptionRow {
  key: string;

  id: string;

  field: string;

  erpValue: string;

  crmValue: string;

  status: ExceptionType;
}

export default function Exceptions() {
  const navigate = useNavigate();

  const {
    erpData,
    crmData,
    reconciliationResult,

    reviewedExceptionKeys,

    setExceptionReviewed,
    setExceptionsReviewed,
  } = useReconciliation();

  const [search, setSearch] =
    useState('');

  const [
    exceptionFilter,
    setExceptionFilter,
  ] =
    useState<ExceptionFilter>(
      'All'
    );

  const [
    reviewFilter,
    setReviewFilter,
  ] =
    useState<ReviewFilter>('All');

  const reviewedSet = useMemo(
    () =>
      new Set(
        reviewedExceptionKeys
      ),
    [reviewedExceptionKeys]
  );

  const exceptionRows =
    useMemo(() => {
      if (
        !reconciliationResult
      ) {
        return [];
      }

      return buildExceptionRows(
        reconciliationResult
      );
    }, [reconciliationResult]);

  const filteredRows =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return exceptionRows.filter(
        (row) => {
          const reviewed =
            reviewedSet.has(
              row.key
            );

          const matchesType =
            exceptionFilter ===
              'All' ||
            row.status ===
              exceptionFilter;

          const matchesReview =
            reviewFilter ===
              'All' ||
            (reviewFilter ===
              'Reviewed' &&
              reviewed) ||
            (reviewFilter ===
              'Pending' &&
              !reviewed);

          const searchableText = [
            row.id,
            row.field,
            row.erpValue,
            row.crmValue,
            row.status,
          ]
            .join(' ')
            .toLowerCase();

          const matchesSearch =
            normalizedSearch ===
              '' ||
            searchableText.includes(
              normalizedSearch
            );

          return (
            matchesType &&
            matchesReview &&
            matchesSearch
          );
        }
      );
    }, [
      exceptionRows,
      reviewedSet,
      exceptionFilter,
      reviewFilter,
      search,
    ]);

  const reviewedCount =
    exceptionRows.filter(
      (row) =>
        reviewedSet.has(
          row.key
        )
    ).length;

  const pendingCount =
    exceptionRows.length -
    reviewedCount;

  const datasetsReady =
    erpData !== null &&
    crmData !== null &&
    erpData.errors.length ===
      0 &&
    crmData.errors.length ===
      0;

  if (
    !reconciliationResult
  ) {
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

                  color: '#0071E3',

                  backgroundColor:
                    'var(--primary-soft)',

                  mb: 2,
                }}
              >
                <CircleAlert
                  size={24}
                />
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                No reconciliation
                results available
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
                before reviewing
                exceptions.
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

  return (
    <Box>
      <PageHeader />

      {/* KPI cards */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },

          gap: 2,
          mb: 3,
        }}
      >
        <SummaryCard
          title="Total Exceptions"
          value={
            exceptionRows.length
          }
          subtitle="Detected issues"
          type="total"
        />

        <SummaryCard
          title="Pending Review"
          value={pendingCount}
          subtitle="Require attention"
          type="pending"
        />

        <SummaryCard
          title="Reviewed"
          value={reviewedCount}
          subtitle="Completed reviews"
          type="reviewed"
        />
      </Box>

      {exceptionRows.length ===
        0 && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius:
              '14px',
          }}
        >
          No exceptions were
          detected. All compared
          records match.
        </Alert>
      )}

      {exceptionRows.length >
        0 && (
        <>
          {/* Filters */}
          <Card
            sx={{
              mb: 3,
            }}
          >
            <CardContent
              sx={{
                p: '22px !important',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Filter size={17} />

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize:
                      '0.86rem',
                  }}
                >
                  Filters
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns:
                    {
                      xs: '1fr',
                      md: '2fr 1fr 1fr',
                    },

                  gap: 2,
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  label="Search"
                  placeholder="Search ID, field or value..."
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                />

                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>
                    Exception Type
                  </InputLabel>

                  <Select
                    value={
                      exceptionFilter
                    }
                    label="Exception Type"
                    onChange={(
                      event
                    ) =>
                      setExceptionFilter(
                        event.target
                          .value as ExceptionFilter
                      )
                    }
                  >
                    <MenuItem value="All">
                      All
                    </MenuItem>

                    <MenuItem value="Difference">
                      Differences
                    </MenuItem>

                    <MenuItem value="Only ERP">
                      Only ERP
                    </MenuItem>

                    <MenuItem value="Only CRM">
                      Only CRM
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl
                  size="small"
                  fullWidth
                >
                  <InputLabel>
                    Review Status
                  </InputLabel>

                  <Select
                    value={
                      reviewFilter
                    }
                    label="Review Status"
                    onChange={(
                      event
                    ) =>
                      setReviewFilter(
                        event.target
                          .value as ReviewFilter
                      )
                    }
                  >
                    <MenuItem value="All">
                      All
                    </MenuItem>

                    <MenuItem value="Pending">
                      Pending
                    </MenuItem>

                    <MenuItem value="Reviewed">
                      Reviewed
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Results */}
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

                  alignItems:
                    'center',

                  flexWrap: 'wrap',

                  gap: 2,

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
                    Exception Review
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
                    {
                      filteredRows.length
                    }{' '}
                    exception
                    {filteredRows.length !==
                    1
                      ? 's'
                      : ''}{' '}
                    displayed
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap:
                      'wrap',
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={
                      filteredRows.length ===
                      0
                    }
                    onClick={() =>
                      setExceptionsReviewed(
                        filteredRows.map(
                          (row) =>
                            row.key
                        ),
                        true
                      )
                    }
                  >
                    Mark visible as
                    reviewed
                  </Button>

                  <Button
                    size="small"
                    variant="text"
                    disabled={
                      filteredRows.length ===
                      0
                    }
                    onClick={() =>
                      setExceptionsReviewed(
                        filteredRows.map(
                          (row) =>
                            row.key
                        ),
                        false
                      )
                    }
                  >
                    Mark visible as
                    pending
                  </Button>
                </Box>
              </Box>

              {filteredRows.length ===
              0 ? (
                <Box
                  sx={{
                    py: 7,
                    textAlign:
                      'center',
                  }}
                >
                  <Search
                    size={30}
                    color="var(--neutral-fg)"
                  />

                  <Typography
                    sx={{
                      fontWeight:
                        600,
                      mt: 1.5,
                    }}
                  >
                    No exceptions
                    found
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
                    Try changing the
                    search or filter
                    criteria.
                  </Typography>
                </Box>
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
                        <TableCell
                          sx={{
                            width: 55,
                          }}
                        >
                          Reviewed
                        </TableCell>

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
                      {filteredRows.map(
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
                              sx={{
                                backgroundColor:
                                  reviewed
                                    ? 'rgba(36,138,61,0.025)'
                                    : 'transparent',
                              }}
                            >
                              <TableCell>
                                <Checkbox
                                  size="small"
                                  checked={
                                    reviewed
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setExceptionReviewed(
                                      row.key,
                                      event
                                        .target
                                        .checked
                                    )
                                  }
                                />
                              </TableCell>

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
                                <ReviewChip
                                  reviewed={
                                    reviewed
                                  }
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
        </>
      )}
    </Box>
  );
}

function PageHeader() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          letterSpacing:
            '-0.03em',
        }}
      >
        Exceptions
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
        Review and manage
        discrepancies detected
        between ERP and CRM
        datasets.
      </Typography>
    </Box>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle: string;

  type:
    | 'total'
    | 'pending'
    | 'reviewed';
}

function SummaryCard({
  title,
  value,
  subtitle,
  type,
}: SummaryCardProps) {
  const icon =
    type === 'reviewed' ? (
      <CheckCircle2
        size={18}
      />
    ) : type ===
      'pending' ? (
      <CircleAlert
        size={18}
      />
    ) : (
      <ClipboardCheck
        size={18}
      />
    );

  const iconStyle =
    type === 'reviewed'
      ? {
          backgroundColor:
            'var(--success-soft)',

          color: 'var(--success-fg)',
        }
      : type ===
          'pending'
        ? {
            backgroundColor:
              'var(--warning-soft)',

            color: 'var(--warning-fg)',
          }
        : {
            backgroundColor:
              'var(--info-soft)',

            color: 'var(--info-fg)',
          };

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

            gap: 2,

            mb: 2,
          }}
        >
          <Typography
            sx={{
              color:
                'text.secondary',

              fontSize:
                '0.76rem',

              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 32,
              height: 32,

              borderRadius:
                '10px',

              display: 'flex',

              justifyContent:
                'center',

              alignItems:
                'center',

              ...iconStyle,
            }}
          >
            {icon}
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: '1.9rem',

            fontWeight: 700,

            letterSpacing:
              '-0.04em',

            lineHeight: 1,
          }}
        >
          {value.toLocaleString()}
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

interface ExceptionChipProps {
  status: ExceptionType;
}

function ExceptionChip({
  status,
}: ExceptionChipProps) {
  const styles =
    status === 'Difference'
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
        ...styles,

        fontSize:
          '0.7rem',

        fontWeight: 600,
      }}
    />
  );
}

interface ReviewChipProps {
  reviewed: boolean;
}

function ReviewChip({
  reviewed,
}: ReviewChipProps) {
  return (
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
            ? 'var(--success-fg)'
            : 'var(--neutral-fg)',

        fontSize:
          '0.7rem',

        fontWeight: 600,
      }}
    />
  );
}

function buildExceptionRows(
  result: ReconciliationResult
): ExceptionRow[] {
  const rows: ExceptionRow[] =
    [];

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
        key: `${record.id}:only-crm`,

        id: record.id,

        field: 'Entire Record',

        erpValue: '—',

        crmValue: 'Present',

        status: 'Only CRM',
      });
    }
  );

  return rows;
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