import { useState, type DragEvent } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  XCircle,
} from 'lucide-react';

import { parseCsv } from '../../utils/parseCsv';

import {
  useReconciliation,
  type ImportedDataset,
} from '../../context/ReconciliationContext';

type SourceType = 'ERP' | 'CRM';

export default function Imports() {
  const {
    erpData,
    crmData,
    setErpData,
    setCrmData,
  } = useReconciliation();

  const handleFile = async (
    file: File,
    source: SourceType
  ) => {
    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    // Validate file extension
    if (extension !== 'csv') {
      const invalidFile: ImportedDataset = {
        fileName: file.name,
        fileSize: file.size,
        records: [],
        errors: ['Only CSV files are currently supported.'],
        totalRows: 0,
      };

      if (source === 'ERP') {
        setErpData(invalidFile);
      } else {
        setCrmData(invalidFile);
      }

      return;
    }

    // Maximum file size: 10 MB
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      const invalidFile: ImportedDataset = {
        fileName: file.name,
        fileSize: file.size,
        records: [],
        errors: ['The file exceeds the 10 MB size limit.'],
        totalRows: 0,
      };

      if (source === 'ERP') {
        setErpData(invalidFile);
      } else {
        setCrmData(invalidFile);
      }

      return;
    }

    // Parse and validate CSV
    const result = await parseCsv(file);

    const information: ImportedDataset = {
      fileName: file.name,
      fileSize: file.size,
      records: result.records,
      errors: result.errors,
      totalRows: result.totalRows,
    };

    if (source === 'ERP') {
      setErpData(information);
    } else {
      setCrmData(information);
    }
  };

  const bothDatasetsReady =
    erpData !== null &&
    crmData !== null &&
    erpData.errors.length === 0 &&
    crmData.errors.length === 0 &&
    erpData.records.length > 0 &&
    crmData.records.length > 0;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          Data Imports
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
            mt: 1,
            fontSize: '0.95rem',
          }}
        >
          Import and validate ERP and CRM datasets before running a
          reconciliation.
        </Typography>
      </Box>

      {/* Import Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 1fr',
          },
          gap: 3,
        }}
      >
        <ImportCard
          title="ERP Data"
          description="Upload the dataset exported from the ERP system."
          source="ERP"
          data={erpData}
          onFile={handleFile}
          onRemove={() => setErpData(null)}
        />

        <ImportCard
          title="CRM Data"
          description="Upload the dataset exported from the CRM system."
          source="CRM"
          data={crmData}
          onFile={handleFile}
          onRemove={() => setCrmData(null)}
        />
      </Box>

      {/* Ready Status */}
      {bothDatasetsReady && (
        <Alert
          severity="success"
          sx={{
            mt: 3,
            borderRadius: '14px',
          }}
        >
          ERP and CRM datasets are valid and ready for reconciliation.
        </Alert>
      )}
    </Box>
  );
}

interface ImportCardProps {
  title: string;
  description: string;
  source: SourceType;
  data: ImportedDataset | null;
  onFile: (
    file: File,
    source: SourceType
  ) => void;
  onRemove: () => void;
}

function ImportCard({
  title,
  description,
  source,
  data,
  onFile,
  onRemove,
}: ImportCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      onFile(file, source);
    }
  };

  return (
    <Card>
      <CardContent
        sx={{
          p: '28px !important',
        }}
      >
        {/* Card Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,113,227,0.08)',
              color: '#0071E3',
            }}
          >
            <FileSpreadsheet size={20} />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.85rem',
            mb: 3,
          }}
        >
          {description}
        </Typography>

        {/* Drag & Drop Area */}
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => {
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          sx={{
            border: isDragging
              ? '1.5px dashed #0071E3'
              : '1.5px dashed rgba(0,0,0,0.14)',

            borderRadius: '16px',
            p: 4,
            textAlign: 'center',

            backgroundColor: isDragging
              ? 'rgba(0,113,227,0.05)'
              : '#FAFAFC',

            transition: 'all 0.2s ease',
          }}
        >
          <Upload
            size={30}
            strokeWidth={1.5}
            color={
              isDragging
                ? '#0071E3'
                : '#6E6E73'
            }
          />

          <Typography
            sx={{
              mt: 1.5,
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Upload {source} dataset
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.78rem',
              mt: 0.5,
            }}
          >
            Drag and drop your CSV file here
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.72rem',
              my: 1.5,
            }}
          >
            or
          </Typography>

          <Button
            component="label"
            variant="contained"
            sx={{
              px: 2.5,
            }}
          >
            Select File

            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file =
                  event.target.files?.[0];

                if (file) {
                  onFile(file, source);
                }

                event.target.value = '';
              }}
            />
          </Button>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.68rem',
              mt: 1.5,
            }}
          >
            CSV • Maximum 10 MB
          </Typography>
        </Box>

        {/* Uploaded File Information */}
        {data && (
          <>
            <Divider sx={{ my: 3 }} />

            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    {data.fileName}
                  </Typography>

                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      mt: 0.3,
                    }}
                  >
                    {formatFileSize(
                      data.fileSize
                    )}
                    {' • '}
                    {data.totalRows} rows
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                  }}
                >
                  {data.errors.length === 0 ? (
                    <Chip
                      icon={
                        <CheckCircle2
                          size={14}
                        />
                      }
                      label="Valid"
                      size="small"
                      sx={{
                        backgroundColor:
                          '#EAF7EE',
                        color: '#248A3D',

                        '& .MuiChip-icon': {
                          color: '#248A3D',
                        },
                      }}
                    />
                  ) : (
                    <Chip
                      icon={
                        <XCircle size={14} />
                      }
                      label="Invalid"
                      size="small"
                      sx={{
                        backgroundColor:
                          '#FFECEF',
                        color: '#D70015',

                        '& .MuiChip-icon': {
                          color: '#D70015',
                        },
                      }}
                    />
                  )}

                  <Button
                    size="small"
                    onClick={onRemove}
                    sx={{
                      color: 'text.secondary',
                      minWidth: 0,
                    }}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>

              {/* Validation Errors */}
              {data.errors.length > 0 && (
                <>
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: '12px',
                    }}
                  >
                    {data.errors.length}{' '}
                    validation error
                    {data.errors.length !== 1
                      ? 's'
                      : ''}{' '}
                    detected.
                  </Alert>

                  <Box>
                    {data.errors
                      .slice(0, 5)
                      .map(
                        (
                          error,
                          index
                        ) => (
                          <Typography
                            key={`${error}-${index}`}
                            sx={{
                              color:
                                'error.main',
                              fontSize:
                                '0.75rem',
                              mb: 0.7,
                            }}
                          >
                            • {error}
                          </Typography>
                        )
                      )}

                    {data.errors.length >
                      5 && (
                      <Typography
                        sx={{
                          color:
                            'text.secondary',
                          fontSize:
                            '0.72rem',
                        }}
                      >
                        +{' '}
                        {data.errors.length -
                          5}{' '}
                        additional errors
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Data Preview */}
              {data.errors.length === 0 &&
                data.records.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Data Preview
                    </Typography>

                    <Box
                      sx={{
                        overflowX: 'auto',
                        border:
                          '1px solid rgba(0,0,0,0.06)',
                        borderRadius:
                          '12px',
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              ID
                            </TableCell>

                            <TableCell>
                              Customer
                            </TableCell>

                            <TableCell align="right">
                              Amount
                            </TableCell>

                            <TableCell>
                              Status
                            </TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {data.records
                            .slice(0, 5)
                            .map(
                              (record) => (
                                <TableRow
                                  key={
                                    record.id
                                  }
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

                                  <TableCell align="right">
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

                    {data.records.length >
                      5 && (
                      <Typography
                        sx={{
                          color:
                            'text.secondary',
                          fontSize:
                            '0.7rem',
                          mt: 1,
                        }}
                      >
                        Showing first 5 of{' '}
                        {data.records.length}{' '}
                        valid records.
                      </Typography>
                    )}
                  </Box>
                )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(
  bytes: number
): string {
  if (bytes === 0) {
    return '0 KB';
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(
      1
    )} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(
    1
  )} MB`;
}