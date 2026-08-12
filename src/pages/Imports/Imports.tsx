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
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Database,
  FileSpreadsheet,
  GitMerge,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  CANONICAL_FIELDS,
  FIELD_DESCRIPTIONS,
  FIELD_LABELS,
} from '../../config/fieldMappingConfig';

import {
  parseCsv,
} from '../../utils/parseCsv';

import {
  hasBlockingIssues,
} from '../../utils/dataQuality';

import {
  inspectCsvHeaders,
  validateFieldMapping,
} from '../../utils/fieldMapping';

import {
  useReconciliation,
  type DatasetTarget,
  type ImportedDataset,
} from '../../context/ReconciliationContext';

import type {
  CanonicalField,
  FieldMapping,
} from '../../types/FieldMapping';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PendingImport {
  file: File;
  headers: string[];
  mapping: FieldMapping;
}

interface PendingImports {
  erp: PendingImport | null;
  crm: PendingImport | null;
}

export default function Imports() {
  const {
    erpData,
    crmData,
    fieldMappings,
    setErpData,
    setCrmData,
    setFieldMapping,
  } = useReconciliation();

  const [erpUploadError, setErpUploadError] = useState('');
  const [crmUploadError, setCrmUploadError] = useState('');

  const [pendingImports, setPendingImports] =
    useState<PendingImports>({
      erp: null,
      crm: null,
    });

  const getUploadErrorSetter = (target: DatasetTarget) =>
    target === 'erp'
      ? setErpUploadError
      : setCrmUploadError;

  const saveDataset = (
    target: DatasetTarget,
    dataset: ImportedDataset
  ) => {
    if (target === 'erp') {
      setErpData(dataset);
    } else {
      setCrmData(dataset);
    }
  };

  const importWithMapping = async (
    file: File,
    target: DatasetTarget,
    mapping: FieldMapping
  ) => {
    const setUploadError = getUploadErrorSetter(target);

    try {
      const result = await parseCsv(file, mapping);

      const dataset: ImportedDataset = {
        fileName: file.name,
        fileSize: file.size,
        headers: result.headers,
        fieldMapping: result.fieldMapping,
        records: result.records,
        errors: result.errors,
        warnings: result.warnings,
        issues: result.issues,
        qualitySummary: result.qualitySummary,
        duplicateIds: result.duplicateIds,
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        cleanRows: result.cleanRows,
        rowsWithIssues: result.rowsWithIssues,
        qualityScore: result.qualityScore,
      };

      setFieldMapping(target, result.fieldMapping);
      saveDataset(target, dataset);

      setPendingImports((current) => ({
        ...current,
        [target]: null,
      }));
    } catch {
      setUploadError(
        'The CSV file could not be processed.'
      );
    }
  };

  const processFile = async (
    file: File,
    target: DatasetTarget
  ) => {
    const setUploadError = getUploadErrorSetter(target);
    setUploadError('');

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Only CSV files are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('The file exceeds the 10 MB limit.');
      return;
    }

    try {
      const inspection = await inspectCsvHeaders(file);

      if (inspection.headers.length === 0) {
        await importWithMapping(
          file,
          target,
          fieldMappings[target]
        );
        return;
      }

      if (inspection.exactCanonicalMapping) {
        await importWithMapping(
          file,
          target,
          inspection.suggestedMapping
        );
        return;
      }

      const mapping = buildPreferredMapping(
        inspection.headers,
        fieldMappings[target],
        inspection.suggestedMapping
      );

      setPendingImports((current) => ({
        ...current,
        [target]: {
          file,
          headers: inspection.headers,
          mapping,
        },
      }));
    } catch {
      setUploadError(
        'The CSV headers could not be inspected.'
      );
    }
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    target: DatasetTarget
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      void processFile(file, target);
    }

    event.target.value = '';
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    target: DatasetTarget
  ) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void processFile(file, target);
    }
  };

  const updatePendingMapping = (
    target: DatasetTarget,
    field: CanonicalField,
    sourceHeader: string
  ) => {
    setPendingImports((current) => {
      const pending = current[target];

      if (!pending) {
        return current;
      }

      return {
        ...current,
        [target]: {
          ...pending,
          mapping: {
            ...pending.mapping,
            [field]: sourceHeader,
          },
        },
      };
    });
  };

  const applyPendingMapping = (
    target: DatasetTarget
  ) => {
    const pending = pendingImports[target];

    if (!pending) {
      return;
    }

    const validation = validateFieldMapping(
      pending.headers,
      pending.mapping
    );

    if (!validation.valid) {
      getUploadErrorSetter(target)(validation.errors.join(' '));
      return;
    }

    void importWithMapping(
      pending.file,
      target,
      pending.mapping
    );
  };

  const cancelPendingMapping = (
    target: DatasetTarget
  ) => {
    setPendingImports((current) => ({
      ...current,
      [target]: null,
    }));

    getUploadErrorSetter(target)('');
  };

  const removeDataset = (
    target: DatasetTarget
  ) => {
    if (target === 'erp') {
      setErpData(null);
      setErpUploadError('');
    } else {
      setCrmData(null);
      setCrmUploadError('');
    }

    setPendingImports((current) => ({
      ...current,
      [target]: null,
    }));
  };

  const bothLoaded = erpData !== null && crmData !== null;

  const bothValid =
    bothLoaded &&
    !hasBlockingIssues(erpData.issues) &&
    !hasBlockingIssues(crmData.issues);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          Imports
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
            mt: 1,
            fontSize: '0.95rem',
          }}
        >
          Upload, map and validate ERP and CRM datasets before reconciliation.
        </Typography>
      </Box>

      <Alert
        severity="info"
        icon={<GitMerge size={19} />}
        sx={{
          mb: 3,
          borderRadius: '14px',
        }}
      >
        V0.1.6 uses a canonical reconciliation schema: <strong>id, cliente, monto, estado</strong>. Your source CSV columns can now use different names and be mapped before validation.
      </Alert>

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
          target="erp"
          title="ERP Dataset"
          description="Upload the source dataset exported from the ERP system."
          dataset={erpData}
          pendingImport={pendingImports.erp}
          uploadError={erpUploadError}
          onFileChange={(event) =>
            handleFileChange(event, 'erp')
          }
          onDrop={(event) => handleDrop(event, 'erp')}
          onRemove={() => removeDataset('erp')}
          onMappingChange={(field, value) =>
            updatePendingMapping('erp', field, value)
          }
          onApplyMapping={() => applyPendingMapping('erp')}
          onCancelMapping={() => cancelPendingMapping('erp')}
        />

        <ImportCard
          target="crm"
          title="CRM Dataset"
          description="Upload the comparison dataset exported from the CRM system."
          dataset={crmData}
          pendingImport={pendingImports.crm}
          uploadError={crmUploadError}
          onFileChange={(event) =>
            handleFileChange(event, 'crm')
          }
          onDrop={(event) => handleDrop(event, 'crm')}
          onRemove={() => removeDataset('crm')}
          onMappingChange={(field, value) =>
            updatePendingMapping('crm', field, value)
          }
          onApplyMapping={() => applyPendingMapping('crm')}
          onCancelMapping={() => cancelPendingMapping('crm')}
        />
      </Box>

      {bothValid && (
        <Alert
          severity="success"
          sx={{ mt: 3, borderRadius: '14px' }}
        >
          ERP and CRM datasets passed mapped validation and are ready for reconciliation.
        </Alert>
      )}

      {bothLoaded && !bothValid && (
        <Alert
          severity="warning"
          sx={{ mt: 3, borderRadius: '14px' }}
        >
          Reconciliation is currently blocked. Resolve all blocking validation issues before continuing.
        </Alert>
      )}
    </Box>
  );
}

interface ImportCardProps {
  target: DatasetTarget;
  title: string;
  description: string;
  dataset: ImportedDataset | null;
  pendingImport: PendingImport | null;
  uploadError: string;
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onDrop: (
    event: DragEvent<HTMLDivElement>
  ) => void;
  onRemove: () => void;
  onMappingChange: (
    field: CanonicalField,
    value: string
  ) => void;
  onApplyMapping: () => void;
  onCancelMapping: () => void;
}

function ImportCard({
  target,
  title,
  description,
  dataset,
  pendingImport,
  uploadError,
  onFileChange,
  onDrop,
  onRemove,
  onMappingChange,
  onApplyMapping,
  onCancelMapping,
}: ImportCardProps) {
  const [dragging, setDragging] = useState(false);

  const isValid =
    dataset !== null &&
    !hasBlockingIssues(dataset.issues);

  return (
    <Card>
      <CardContent sx={{ p: '26px !important' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '13px',
                backgroundColor: 'var(--primary-soft)',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={20} />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.77rem',
                  mt: 0.35,
                  lineHeight: 1.45,
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
              startIcon={<Trash2 size={15} />}
              onClick={onRemove}
            >
              Remove
            </Button>
          )}
        </Box>

        <Box
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            setDragging(false);
            onDrop(event);
          }}
          sx={{
            border: dragging
              ? '2px dashed #0071E3'
              : '1px dashed var(--border-dashed)',
            borderRadius: '16px',
            px: 3,
            py: 4,
            textAlign: 'center',
            backgroundColor: dragging
              ? 'var(--primary-soft)'
              : 'var(--surface-subtle)',
            transition: 'all 0.2s ease',
          }}
        >
          <UploadCloud size={30} color="#0071E3" />

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.88rem',
              mt: 1,
            }}
          >
            Drop your CSV here
          </Typography>

          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.72rem',
              mt: 0.4,
            }}
          >
            CSV only · maximum size 10 MB
          </Typography>

          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{ mt: 2 }}
          >
            Select CSV

            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
            />
          </Button>
        </Box>

        {pendingImport && (
          <FieldMappingPanel
            target={target}
            pendingImport={pendingImport}
            onMappingChange={onMappingChange}
            onApply={onApplyMapping}
            onCancel={onCancelMapping}
          />
        )}

        {uploadError && (
          <Alert
            severity="error"
            sx={{ mt: 2, borderRadius: '12px' }}
          >
            {uploadError}
          </Alert>
        )}

        {dataset && (
          <>
            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.2,
                  alignItems: 'center',
                }}
              >
                <FileSpreadsheet
                  size={19}
                  color="var(--neutral-fg)"
                />

                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {dataset.fileName}
                  </Typography>

                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.68rem',
                      mt: 0.2,
                    }}
                  >
                    {formatFileSize(dataset.fileSize)}
                  </Typography>
                </Box>
              </Box>

              <Chip
                size="small"
                icon={
                  isValid ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertTriangle size={14} />
                  )
                }
                label={isValid ? 'Valid' : 'Issues Found'}
                sx={{
                  backgroundColor: isValid
                    ? 'var(--success-soft)'
                    : 'var(--warning-soft)',
                  color: isValid
                    ? 'var(--success-fg)'
                    : 'var(--warning-fg)',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
            </Box>

            <AppliedMappingCard dataset={dataset} />
            <DataQualityPanel dataset={dataset} />

            {dataset.duplicateIds.length > 0 && (
              <DuplicatePanel dataset={dataset} />
            )}

            {dataset.errors.length > 0 && (
              <IssueMessages
                title={`Blocking Issues (${dataset.errors.length})`}
                messages={dataset.errors}
                severity="error"
              />
            )}

            {dataset.warnings.length > 0 && (
              <IssueMessages
                title={`Warnings (${dataset.warnings.length})`}
                messages={dataset.warnings}
                severity="warning"
              />
            )}

            {dataset.records.length > 0 && (
              <DataPreview dataset={dataset} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface FieldMappingPanelProps {
  target: DatasetTarget;
  pendingImport: PendingImport;
  onMappingChange: (
    field: CanonicalField,
    value: string
  ) => void;
  onApply: () => void;
  onCancel: () => void;
}

function FieldMappingPanel({
  target,
  pendingImport,
  onMappingChange,
  onApply,
  onCancel,
}: FieldMappingPanelProps) {
  const validation = validateFieldMapping(
    pendingImport.headers,
    pendingImport.mapping
  );

  return (
    <Box
      sx={{
        mt: 2.5,
        p: 2.5,
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'primary.main',
        backgroundColor: 'var(--primary-soft)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            Field Mapping Required
          </Typography>

          <Typography
            sx={{
              mt: 0.45,
              color: 'text.secondary',
              fontSize: '0.74rem',
              lineHeight: 1.5,
            }}
          >
            {pendingImport.file.name} does not use the canonical column names. Confirm how this {target.toUpperCase()} file maps into the reconciliation model.
          </Typography>
        </Box>

        <Button
          size="small"
          onClick={onCancel}
          sx={{ minWidth: 36, px: 1 }}
        >
          <X size={16} />
        </Button>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 1.5,
        }}
      >
        {CANONICAL_FIELDS.map((field) => (
          <Box key={field}>
            <FormControl fullWidth size="small">
              <InputLabel id={`${target}-${field}-mapping-label`}>
                {FIELD_LABELS[field]}
              </InputLabel>

              <Select
                labelId={`${target}-${field}-mapping-label`}
                label={FIELD_LABELS[field]}
                value={pendingImport.mapping[field]}
                onChange={(event) =>
                  onMappingChange(
                    field,
                    String(event.target.value)
                  )
                }
              >
                <MenuItem value="">
                  <em>Select source column</em>
                </MenuItem>

                {pendingImport.headers.map((header) => (
                  <MenuItem key={header} value={header}>
                    {header}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography
              sx={{
                mt: 0.55,
                px: 0.3,
                color: 'text.secondary',
                fontSize: '0.65rem',
                lineHeight: 1.4,
              }}
            >
              {FIELD_DESCRIPTIONS[field]}
            </Typography>
          </Box>
        ))}
      </Box>

      {!validation.valid && (
        <Alert
          severity="warning"
          sx={{ mt: 2, borderRadius: '12px' }}
        >
          {validation.errors[0]}
        </Alert>
      )}

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="text"
          size="small"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          size="small"
          startIcon={<GitMerge size={16} />}
          disabled={!validation.valid}
          onClick={onApply}
        >
          Apply Mapping & Validate
        </Button>
      </Box>
    </Box>
  );
}

function AppliedMappingCard({
  dataset,
}: {
  dataset: ImportedDataset;
}) {
  return (
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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          mb: 1.4,
        }}
      >
        <GitMerge size={16} />
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.76rem',
          }}
        >
          Applied Field Mapping
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 0.8,
        }}
      >
        {CANONICAL_FIELDS.map((field) => (
          <Box
            key={field}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              minWidth: 0,
            }}
          >
            <Typography
              title={dataset.fieldMapping[field]}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 650,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {dataset.fieldMapping[field]}
            </Typography>

            <ArrowRight
              size={13}
              color="var(--neutral-fg)"
            />

            <Typography
              sx={{
                color: 'primary.main',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {field}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DataQualityPanel({
  dataset,
}: {
  dataset: ImportedDataset;
}) {
  return (
    <Box
      sx={{
        mt: 2.5,
        p: 2.5,
        borderRadius: '16px',
        backgroundColor: 'var(--surface-subtle)',
        border: '1px solid var(--border-faint)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <ShieldCheck size={17} />
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Data Quality Score
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: getQualityColor(dataset.qualityScore),
          }}
        >
          {dataset.qualityScore}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={dataset.qualityScore}
        sx={{
          height: 8,
          borderRadius: '999px',
          backgroundColor: 'var(--surface-strong)',
          '& .MuiLinearProgress-bar': {
            borderRadius: '999px',
            backgroundColor: getQualityColor(dataset.qualityScore),
          },
        }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 1.5,
          mt: 2.5,
        }}
      >
        <QualityMetric
          label="Blocking Issues"
          value={dataset.qualitySummary.blockingIssues}
        />
        <QualityMetric
          label="Warnings"
          value={dataset.qualitySummary.warnings}
        />
        <QualityMetric
          label="Duplicate IDs"
          value={dataset.qualitySummary.duplicateIds}
        />
        <QualityMetric
          label="Invalid Values"
          value={dataset.qualitySummary.invalidValues}
        />
      </Box>

      <Divider sx={{ my: 2.25 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            md: 'repeat(3, 1fr)',
          },
          gap: 1.5,
        }}
      >
        <QualityMetric label="Total Rows" value={dataset.totalRows} />
        <QualityMetric label="Clean Rows" value={dataset.cleanRows} />
        <QualityMetric
          label="Rows With Issues"
          value={dataset.rowsWithIssues}
        />
      </Box>

      {dataset.qualitySummary.issueBreakdown.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              mb: 1,
            }}
          >
            Issue Breakdown
          </Typography>

          <Box sx={{ display: 'grid', gap: 0.65 }}>
            {dataset.qualitySummary.issueBreakdown.map((item) => (
              <Box
                key={item.type}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  py: 0.55,
                  borderBottom: '1px solid var(--border-soft)',
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {item.type}
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      item.blockingCount > 0
                        ? 'Blocking'
                        : 'Warning'
                    }
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 600,
                      color:
                        item.blockingCount > 0
                          ? 'var(--danger-fg)'
                          : 'var(--warning-fg)',
                      backgroundColor:
                        item.blockingCount > 0
                          ? 'var(--danger-soft)'
                          : 'var(--warning-yellow-soft)',
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {item.count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.66rem',
          lineHeight: 1.45,
          mt: 2,
        }}
      >
        Score V2 is an application-defined weighted model. Field mapping happens before validation, so data-quality rules continue to operate on one canonical schema.
      </Typography>
    </Box>
  );
}

function DuplicatePanel({
  dataset,
}: {
  dataset: ImportedDataset;
}) {
  return (
    <Box
      sx={{
        mt: 2.5,
        border: '1px solid rgba(166,75,0,0.18)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          backgroundColor: 'var(--warning-soft-alt)',
        }}
      >
        <Copy size={17} color="var(--warning-fg)" />
        <Box>
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--warning-fg)',
            }}
          >
            Duplicate IDs detected
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.7rem',
              mt: 0.2,
            }}
          >
            Reconciliation is blocked until these duplicate identifiers are resolved.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {dataset.duplicateIds.map((duplicate) => (
          <Box
            key={duplicate.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              py: 0.75,
              borderBottom: '1px solid var(--border-faint)',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              ID {duplicate.id}
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              Rows {duplicate.rows.join(', ')}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

interface IssueMessagesProps {
  title: string;
  messages: string[];
  severity: 'error' | 'warning';
}

function IssueMessages({
  title,
  messages,
  severity,
}: IssueMessagesProps) {
  const visibleMessages =
    severity === 'error'
      ? messages.slice(0, 8)
      : messages;

  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.78rem',
          color:
            severity === 'error'
              ? 'var(--danger-fg)'
              : 'var(--warning-fg)',
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Alert
        severity={severity}
        sx={{ borderRadius: '12px' }}
      >
        <Box sx={{ display: 'grid', gap: 0.7 }}>
          {visibleMessages.map((message, index) => (
            <Typography
              key={`${message}-${index}`}
              sx={{ fontSize: '0.74rem' }}
            >
              • {message}
            </Typography>
          ))}

          {severity === 'error' && messages.length > 8 && (
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              +{messages.length - 8} additional issues
            </Typography>
          )}
        </Box>
      </Alert>
    </Box>
  );
}

function DataPreview({
  dataset,
}: {
  dataset: ImportedDataset;
}) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.8rem',
          mb: 1,
        }}
      >
        Canonical Data Preview
      </Typography>

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.68rem',
          mb: 1.5,
        }}
      >
        First 5 rows after source-field mapping and field-level validation.
      </Typography>

      <Box
        sx={{
          overflowX: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {dataset.records.slice(0, 5).map((record, index) => (
              <TableRow key={`${record.id}-${index}`}>
                <TableCell>{record.id}</TableCell>
                <TableCell>{record.cliente}</TableCell>
                <TableCell>
                  {record.monto.toLocaleString('es-CR')}
                </TableCell>
                <TableCell>{record.estado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
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
          color: 'text.secondary',
          fontSize: '0.65rem',
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: '1.05rem',
          fontWeight: 700,
          mt: 0.4,
        }}
      >
        {value.toLocaleString()}
      </Typography>
    </Box>
  );
}

function buildPreferredMapping(
  headers: string[],
  savedMapping: FieldMapping,
  suggestedMapping: FieldMapping
): FieldMapping {
  const headerSet = new Set(headers);

  return CANONICAL_FIELDS.reduce<FieldMapping>(
    (mapping, field) => {
      const savedValue = savedMapping[field];

      mapping[field] = headerSet.has(savedValue)
        ? savedValue
        : suggestedMapping[field];

      return mapping;
    },
    {
      id: '',
      cliente: '',
      monto: '',
      estado: '',
    }
  );
}

function getQualityColor(score: number): string {
  if (score >= 95) {
    return 'var(--success-fg)';
  }

  if (score >= 80) {
    return 'var(--warning-fg)';
  }

  return 'var(--danger-fg)';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const units = ['Bytes', 'KB', 'MB'];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}
