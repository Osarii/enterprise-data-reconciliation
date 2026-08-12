import {
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

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
  AlertTriangle,
  CheckCircle2,
  Copy,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import {
  parseCsv,
} from '../../utils/parseCsv';

import {
  hasBlockingIssues,
} from '../../utils/dataQuality';

import {
  useReconciliation,
  type ImportedDataset,
} from '../../context/ReconciliationContext';

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

type DatasetTarget =
  | 'erp'
  | 'crm';

export default function Imports() {
  const {
    erpData,
    crmData,

    setErpData,
    setCrmData,
  } = useReconciliation();

  const [
    erpUploadError,
    setErpUploadError,
  ] = useState('');

  const [
    crmUploadError,
    setCrmUploadError,
  ] = useState('');

  const processFile = async (
    file: File,
    target: DatasetTarget
  ) => {
    const setUploadError =
      target === 'erp'
        ? setErpUploadError
        : setCrmUploadError;

    setUploadError('');

    if (
      !file.name
        .toLowerCase()
        .endsWith('.csv')
    ) {
      setUploadError(
        'Only CSV files are supported.'
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setUploadError(
        'The file exceeds the 10 MB limit.'
      );

      return;
    }

    try {
      const result =
        await parseCsv(file);

      const dataset:
        ImportedDataset = {
          fileName:
            file.name,

          fileSize:
            file.size,

          records:
            result.records,

          errors:
            result.errors,

          warnings:
            result.warnings,

          issues:
            result.issues,

          qualitySummary:
            result.qualitySummary,

          duplicateIds:
            result.duplicateIds,

          totalRows:
            result.totalRows,

          validRows:
            result.validRows,

          invalidRows:
            result.invalidRows,

          cleanRows:
            result.cleanRows,

          rowsWithIssues:
            result.rowsWithIssues,

          qualityScore:
            result.qualityScore,
        };

      if (target === 'erp') {
        setErpData(dataset);
      } else {
        setCrmData(dataset);
      }
    } catch {
      setUploadError(
        'The CSV file could not be processed.'
      );
    }
  };

  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>,
    target: DatasetTarget
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      void processFile(
        file,
        target
      );
    }

    event.target.value = '';
  };

  const handleDrop = (
    event:
      DragEvent<HTMLDivElement>,
    target: DatasetTarget
  ) => {
    event.preventDefault();

    const file =
      event.dataTransfer
        .files?.[0];

    if (file) {
      void processFile(
        file,
        target
      );
    }
  };

  const removeDataset = (
    target: DatasetTarget
  ) => {
    if (target === 'erp') {
      setErpData(null);

      setErpUploadError('');

      return;
    }

    setCrmData(null);

    setCrmUploadError('');
  };

  const bothLoaded =
    erpData !== null &&
    crmData !== null;

  const bothValid =
    bothLoaded &&
    !hasBlockingIssues(
      erpData.issues
    ) &&
    !hasBlockingIssues(
      crmData.issues
    );

  return (
    <Box>
      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,

            letterSpacing:
              '-0.03em',
          }}
        >
          Imports
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
          Upload and validate ERP
          and CRM datasets before
          reconciliation.
        </Typography>
      </Box>

      {/* GENERAL INFO */}
      <Alert
        severity="info"
        sx={{
          mb: 3,

          borderRadius:
            '14px',
        }}
      >
        Required columns:
        <strong>
          {' '}
          id, cliente, monto,
          estado
        </strong>
        . Duplicate IDs and invalid
        rows will block
        reconciliation.
      </Alert>

      {/* IMPORT CARDS */}
      <Box
        sx={{
          display: 'grid',

          gridTemplateColumns: {
            xs: '1fr',
            xl: '1fr 1fr',
          },

          gap: 3,
        }}
      >
        <ImportCard
          title="ERP Dataset"
          description="Upload the source dataset exported from the ERP system."
          dataset={erpData}
          uploadError={
            erpUploadError
          }
          onFileChange={(
            event
          ) =>
            handleFileChange(
              event,
              'erp'
            )
          }
          onDrop={(event) =>
            handleDrop(
              event,
              'erp'
            )
          }
          onRemove={() =>
            removeDataset(
              'erp'
            )
          }
        />

        <ImportCard
          title="CRM Dataset"
          description="Upload the comparison dataset exported from the CRM system."
          dataset={crmData}
          uploadError={
            crmUploadError
          }
          onFileChange={(
            event
          ) =>
            handleFileChange(
              event,
              'crm'
            )
          }
          onDrop={(event) =>
            handleDrop(
              event,
              'crm'
            )
          }
          onRemove={() =>
            removeDataset(
              'crm'
            )
          }
        />
      </Box>

      {/* GLOBAL RESULT */}
      {bothValid && (
        <Alert
          severity="success"
          sx={{
            mt: 3,

            borderRadius:
              '14px',
          }}
        >
          ERP and CRM datasets
          passed validation and are
          ready for reconciliation.
        </Alert>
      )}

      {bothLoaded &&
        !bothValid && (
          <Alert
            severity="warning"
            sx={{
              mt: 3,

              borderRadius:
                '14px',
            }}
          >
            Reconciliation is
            currently blocked.
            Resolve all blocking
            validation issues before
            continuing.
          </Alert>
        )}
    </Box>
  );
}

interface ImportCardProps {
  title: string;

  description: string;

  dataset:
    | ImportedDataset
    | null;

  uploadError: string;

  onFileChange: (
    event:
      ChangeEvent<HTMLInputElement>
  ) => void;

  onDrop: (
    event:
      DragEvent<HTMLDivElement>
  ) => void;

  onRemove: () => void;
}

function ImportCard({
  title,
  description,
  dataset,
  uploadError,
  onFileChange,
  onDrop,
  onRemove,
}: ImportCardProps) {
  const [
    dragging,
    setDragging,
  ] = useState(false);

  const isValid =
    dataset !== null &&
    !hasBlockingIssues(
      dataset.issues
    );

  return (
    <Card>
      <CardContent
        sx={{
          p: '26px !important',
        }}
      >
        {/* CARD HEADER */}
        <Box
          sx={{
            display: 'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            gap: 2,

            mb: 2.5,
          }}
        >
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

                backgroundColor:
                  'rgba(0,113,227,0.08)',

                color:
                  '#0071E3',

                display: 'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                flexShrink: 0,
              }}
            >
              <Database
                size={20}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize:
                    '1rem',

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
                    '0.77rem',

                  mt: 0.35,

                  lineHeight:
                    1.45,
                }}
              >
                {description}
              </Typography>
            </Box>
          </Box>

          {dataset && (
            <Button
              size="small"
              color="error"
              startIcon={
                <Trash2
                  size={15}
                />
              }
              onClick={
                onRemove
              }
            >
              Remove
            </Button>
          )}
        </Box>

        {/* DROP AREA */}
        <Box
          onDragOver={(
            event
          ) => {
            event.preventDefault();

            setDragging(true);
          }}
          onDragLeave={() =>
            setDragging(false)
          }
          onDrop={(event) => {
            setDragging(false);

            onDrop(event);
          }}
          sx={{
            border:
              dragging
                ? '2px dashed #0071E3'
                : '1px dashed rgba(0,0,0,0.18)',

            borderRadius:
              '16px',

            px: 3,

            py: 4,

            textAlign:
              'center',

            backgroundColor:
              dragging
                ? 'rgba(0,113,227,0.035)'
                : '#FAFAFC',

            transition:
              'all 0.2s ease',
          }}
        >
          <UploadCloud
            size={30}
            color="#0071E3"
          />

          <Typography
            sx={{
              fontWeight: 600,

              fontSize:
                '0.88rem',

              mt: 1,
            }}
          >
            Drop your CSV here
          </Typography>

          <Typography
            sx={{
              color:
                'text.secondary',

              fontSize:
                '0.72rem',

              mt: 0.4,
            }}
          >
            CSV only · maximum
            size 10 MB
          </Typography>

          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{
              mt: 2,
            }}
          >
            Select CSV

            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={
                onFileChange
              }
            />
          </Button>
        </Box>

        {uploadError && (
          <Alert
            severity="error"
            sx={{
              mt: 2,

              borderRadius:
                '12px',
            }}
          >
            {uploadError}
          </Alert>
        )}

        {dataset && (
          <>
            <Divider
              sx={{
                my: 3,
              }}
            />

            {/* FILE STATUS */}
            <Box
              sx={{
                display: 'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                flexWrap:
                  'wrap',

                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',

                  gap: 1.2,

                  alignItems:
                    'center',
                }}
              >
                <FileSpreadsheet
                  size={19}
                  color="#6E6E73"
                />

                <Box>
                  <Typography
                    sx={{
                      fontSize:
                        '0.82rem',

                      fontWeight:
                        600,
                    }}
                  >
                    {
                      dataset.fileName
                    }
                  </Typography>

                  <Typography
                    sx={{
                      color:
                        'text.secondary',

                      fontSize:
                        '0.68rem',

                      mt: 0.2,
                    }}
                  >
                    {formatFileSize(
                      dataset.fileSize
                    )}
                  </Typography>
                </Box>
              </Box>

              <Chip
                size="small"
                icon={
                  isValid ? (
                    <CheckCircle2
                      size={14}
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                    />
                  )
                }
                label={
                  isValid
                    ? 'Valid'
                    : 'Issues Found'
                }
                sx={{
                  backgroundColor:
                    isValid
                      ? '#EAF7EE'
                      : '#FFF1E8',

                  color:
                    isValid
                      ? '#248A3D'
                      : '#A64B00',

                  fontWeight: 600,

                  '& .MuiChip-icon':
                    {
                      color:
                        'inherit',
                    },
                }}
              />
            </Box>

            {/* DATA QUALITY */}
            <Box
              sx={{
                mt: 3,

                p: 2.5,

                borderRadius:
                  '16px',

                backgroundColor:
                  '#FAFAFC',

                border:
                  '1px solid rgba(0,0,0,0.05)',
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

                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',

                    alignItems:
                      'center',

                    gap: 1,
                  }}
                >
                  <ShieldCheck
                    size={17}
                  />

                  <Typography
                    sx={{
                      fontSize:
                        '0.8rem',

                      fontWeight:
                        600,
                    }}
                  >
                    Data Quality Score
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    fontSize:
                      '1.3rem',

                    fontWeight:
                      700,

                    color:
                      getQualityColor(
                        dataset.qualityScore
                      ),
                  }}
                >
                  {
                    dataset.qualityScore
                  }
                  %
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={
                  dataset.qualityScore
                }
                sx={{
                  height: 8,

                  borderRadius:
                    '999px',

                  backgroundColor:
                    '#E8E8ED',

                  '& .MuiLinearProgress-bar':
                    {
                      borderRadius:
                        '999px',

                      backgroundColor:
                        getQualityColor(
                          dataset.qualityScore
                        ),
                    },
                }}
              />

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns:
                    {
                      xs: '1fr 1fr',
                      md: 'repeat(4, 1fr)',
                    },

                  gap: 1.5,

                  mt: 2.5,
                }}
              >
                <QualityMetric
                  label="Blocking Issues"
                  value={
                    dataset
                      .qualitySummary
                      .blockingIssues
                  }
                />

                <QualityMetric
                  label="Warnings"
                  value={
                    dataset
                      .qualitySummary
                      .warnings
                  }
                />

                <QualityMetric
                  label="Duplicate IDs"
                  value={
                    dataset
                      .qualitySummary
                      .duplicateIds
                  }
                />

                <QualityMetric
                  label="Invalid Values"
                  value={
                    dataset
                      .qualitySummary
                      .invalidValues
                  }
                />
              </Box>

              <Divider
                sx={{
                  my: 2.25,
                }}
              />

              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns:
                    {
                      xs: '1fr 1fr',
                      md: 'repeat(3, 1fr)',
                    },

                  gap: 1.5,
                }}
              >
                <QualityMetric
                  label="Total Rows"
                  value={
                    dataset.totalRows
                  }
                />

                <QualityMetric
                  label="Clean Rows"
                  value={
                    dataset.cleanRows
                  }
                />

                <QualityMetric
                  label="Rows With Issues"
                  value={
                    dataset.rowsWithIssues
                  }
                />
              </Box>

              {dataset
                .qualitySummary
                .issueBreakdown
                .length > 0 && (
                <Box
                  sx={{
                    mt: 2.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize:
                        '0.72rem',

                      fontWeight:
                        700,

                      mb: 1,
                    }}
                  >
                    Issue Breakdown
                  </Typography>

                  <Box
                    sx={{
                      display:
                        'grid',

                      gap: 0.65,
                    }}
                  >
                    {dataset.qualitySummary.issueBreakdown.map(
                      (item) => (
                        <Box
                          key={
                            item.type
                          }
                          sx={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            alignItems:
                              'center',

                            gap: 2,

                            py: 0.55,

                            borderBottom:
                              '1px solid rgba(0,0,0,0.045)',

                            '&:last-child':
                              {
                                borderBottom:
                                  'none',
                              },
                          }}
                        >
                          <Box
                            sx={{
                              display:
                                'flex',

                              alignItems:
                                'center',

                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  '0.72rem',

                                fontWeight:
                                  600,
                              }}
                            >
                              {
                                item.type
                              }
                            </Typography>

                            <Chip
                              size="small"
                              label={
                                item.blockingCount >
                                0
                                  ? 'Blocking'
                                  : 'Warning'
                              }
                              sx={{
                                height: 20,

                                fontSize:
                                  '0.6rem',

                                fontWeight:
                                  600,

                                color:
                                  item.blockingCount >
                                  0
                                    ? '#D70015'
                                    : '#9A6700',

                                backgroundColor:
                                  item.blockingCount >
                                  0
                                    ? 'rgba(215,0,21,0.07)'
                                    : 'rgba(154,103,0,0.08)',
                              }}
                            />
                          </Box>

                          <Typography
                            sx={{
                              fontSize:
                                '0.76rem',

                              fontWeight:
                                700,
                            }}
                          >
                            {
                              item.count
                            }
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </Box>
              )}

              <Typography
                sx={{
                  color:
                    'text.secondary',

                  fontSize:
                    '0.66rem',

                  lineHeight:
                    1.45,

                  mt: 2,
                }}
              >
                Score V2 is an
                application-defined
                weighted model:
                blocking row issues
                have the strongest
                impact, warnings have
                a smaller impact, and
                duplicate rows receive
                an additional penalty.
              </Typography>
            </Box>

            {/* DUPLICATES */}
            {dataset
              .duplicateIds
              .length > 0 && (
              <Box
                sx={{
                  mt: 2.5,

                  border:
                    '1px solid rgba(166,75,0,0.18)',

                  borderRadius:
                    '14px',

                  overflow:
                    'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',

                    alignItems:
                      'center',

                    gap: 1,

                    p: 2,

                    backgroundColor:
                      '#FFF8F2',
                  }}
                >
                  <Copy
                    size={17}
                    color="#A64B00"
                  />

                  <Box>
                    <Typography
                      sx={{
                        fontSize:
                          '0.8rem',

                        fontWeight:
                          600,

                        color:
                          '#A64B00',
                      }}
                    >
                      Duplicate IDs
                      detected
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
                      Reconciliation
                      is blocked until
                      these duplicate
                      identifiers are
                      resolved.
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 2,
                  }}
                >
                  {dataset.duplicateIds.map(
                    (
                      duplicate
                    ) => (
                      <Box
                        key={
                          duplicate.id
                        }
                        sx={{
                          display:
                            'flex',

                          justifyContent:
                            'space-between',

                          gap: 2,

                          py: 0.75,

                          borderBottom:
                            '1px solid rgba(0,0,0,0.05)',

                          '&:last-child':
                            {
                              borderBottom:
                                'none',
                            },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize:
                              '0.76rem',

                            fontWeight:
                              600,
                          }}
                        >
                          ID{' '}
                          {
                            duplicate.id
                          }
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              'text.secondary',

                            fontSize:
                              '0.72rem',
                          }}
                        >
                          Rows{' '}
                          {duplicate.rows.join(
                            ', '
                          )}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>
              </Box>
            )}

            {/* ERRORS */}
            {dataset.errors
              .length > 0 && (
              <Box
                sx={{
                  mt: 2.5,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,

                    fontSize:
                      '0.78rem',

                    color:
                      '#D70015',

                    mb: 1,
                  }}
                >
                  Blocking Issues (
                  {
                    dataset
                      .errors
                      .length
                  }
                  )
                </Typography>

                <Alert
                  severity="error"
                  sx={{
                    borderRadius:
                      '12px',
                  }}
                >
                  <Box
                    sx={{
                      display:
                        'grid',

                      gap: 0.7,
                    }}
                  >
                    {dataset.errors
                      .slice(0, 8)
                      .map(
                        (
                          error,
                          index
                        ) => (
                          <Typography
                            key={`${error}-${index}`}
                            sx={{
                              fontSize:
                                '0.74rem',
                            }}
                          >
                            • {error}
                          </Typography>
                        )
                      )}

                    {dataset.errors
                      .length >
                      8 && (
                      <Typography
                        sx={{
                          fontSize:
                            '0.72rem',

                          fontWeight:
                            600,
                        }}
                      >
                        +
                        {dataset
                          .errors
                          .length -
                          8}{' '}
                        additional
                        issues
                      </Typography>
                    )}
                  </Box>
                </Alert>
              </Box>
            )}

            {/* WARNINGS */}
            {dataset.warnings
              .length > 0 && (
              <Box
                sx={{
                  mt: 2,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,

                    fontSize:
                      '0.78rem',

                    color:
                      '#9A6700',

                    mb: 1,
                  }}
                >
                  Warnings
                </Typography>

                <Alert
                  severity="warning"
                  sx={{
                    borderRadius:
                      '12px',
                  }}
                >
                  {dataset.warnings.map(
                    (
                      warning,
                      index
                    ) => (
                      <Typography
                        key={`${warning}-${index}`}
                        sx={{
                          fontSize:
                            '0.74rem',
                        }}
                      >
                        • {warning}
                      </Typography>
                    )
                  )}
                </Alert>
              </Box>
            )}

            {/* PREVIEW */}
            {dataset.records
              .length > 0 && (
              <Box
                sx={{
                  mt: 3,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,

                    fontSize:
                      '0.8rem',

                    mb: 1,
                  }}
                >
                  Data Preview
                </Typography>

                <Typography
                  sx={{
                    color:
                      'text.secondary',

                    fontSize:
                      '0.68rem',

                    mb: 1.5,
                  }}
                >
                  First 5 rows that
                  passed field-level
                  validation.
                </Typography>

                <Box
                  sx={{
                    overflowX:
                      'auto',

                    border:
                      '1px solid rgba(0,0,0,0.06)',

                    borderRadius:
                      '12px',
                  }}
                >
                  <Table
                    size="small"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          ID
                        </TableCell>

                        <TableCell>
                          Customer
                        </TableCell>

                        <TableCell>
                          Amount
                        </TableCell>

                        <TableCell>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {dataset.records
                        .slice(
                          0,
                          5
                        )
                        .map(
                          (
                            record,
                            index
                          ) => (
                            <TableRow
                              key={`${record.id}-${index}`}
                            >
                              <TableCell>
                                {
                                  record.id
                                }
                              </TableCell>

                              <TableCell>
                                {
                                  record.cliente
                                }
                              </TableCell>

                              <TableCell>
                                {record.monto.toLocaleString(
                                  'es-CR'
                                )}
                              </TableCell>

                              <TableCell>
                                {
                                  record.estado
                                }
                              </TableCell>
                            </TableRow>
                          )
                        )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface QualityMetricProps {
  label: string;
  value: number;
}

function QualityMetric({
  label,
  value,
}: QualityMetricProps) {
  return (
    <Box>
      <Typography
        sx={{
          color:
            'text.secondary',

          fontSize:
            '0.65rem',

          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize:
            '1.05rem',

          fontWeight: 700,

          mt: 0.4,
        }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

function getQualityColor(
  score: number
): string {
  if (score >= 95) {
    return '#248A3D';
  }

  if (score >= 80) {
    return '#9A6700';
  }

  return '#D70015';
}

function formatFileSize(
  bytes: number
): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const units = [
    'Bytes',
    'KB',
    'MB',
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(bytes) /
          Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    bytes /
    1024 ** index;

  return `${value.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}