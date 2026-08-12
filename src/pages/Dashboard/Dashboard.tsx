import {
  Box,
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
  Layers,
  TriangleAlert,
} from 'lucide-react';

const kpis = [
  {
    title: 'Total Records',
    value: '1,248',
    subtitle: 'Across both systems',
    icon: Database,
  },
  {
    title: 'Matched',
    value: '1,172',
    subtitle: '93.9% match rate',
    icon: CircleCheck,
  },
  {
    title: 'Differences',
    value: '35',
    subtitle: 'Require review',
    icon: TriangleAlert,
  },
  {
    title: 'Only ERP',
    value: '24',
    subtitle: 'Missing from CRM',
    icon: Layers,
  },
  {
    title: 'Only CRM',
    value: '17',
    subtitle: 'Missing from ERP',
    icon: ArrowLeftRight,
  },
];

const recentResults = [
  {
    id: 'REC-1001',
    field: 'Customer Name',
    erp: 'Medical Solutions CR',
    crm: 'Medical Solutions CR',
    status: 'Match',
  },
  {
    id: 'REC-1002',
    field: 'Amount',
    erp: '₡380,000',
    crm: '₡410,000',
    status: 'Difference',
  },
  {
    id: 'REC-1003',
    field: 'Status',
    erp: 'Active',
    crm: '—',
    status: 'Only ERP',
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case 'Match':
      return {
        backgroundColor: '#EAF7EE',
        color: '#248A3D',
      };

    case 'Difference':
      return {
        backgroundColor: '#FFF1E8',
        color: '#A64B00',
      };

    case 'Only ERP':
      return {
        backgroundColor: '#EAF2FF',
        color: '#0066CC',
      };

    case 'Only CRM':
      return {
        backgroundColor: '#F2EBFF',
        color: '#7C3AED',
      };

    default:
      return {
        backgroundColor: '#F5F5F7',
        color: '#6E6E73',
      };
  }
}

export default function Dashboard() {
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
          Data Reconciliation Overview
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
            mt: 1,
            fontSize: '0.95rem',
          }}
        >
          Monitor data consistency, imports and discrepancies across enterprise
          systems.
        </Typography>
      </Box>

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
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.78rem',
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
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                  }}
                >
                  {kpi.value}
                </Typography>

                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.72rem',
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
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
              }}
            >
              Recent Reconciliation Results
            </Typography>

            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: '0.83rem',
                mt: 0.5,
              }}
            >
              Latest differences detected between ERP and CRM datasets.
            </Typography>
          </Box>

          {/* Table Header */}
          <Box
            sx={{
              display: {
                xs: 'none',
                md: 'grid',
              },
              gridTemplateColumns: '120px 1fr 1fr 1fr 120px',
              gap: 2,
              px: 2,
              pb: 1.5,
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {['Record ID', 'Field', 'ERP Value', 'CRM Value', 'Status'].map(
              (header) => (
                <Typography
                  key={header}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  {header}
                </Typography>
              )
            )}
          </Box>

          {/* Table Rows */}
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {recentResults.map((record) => {
              const statusStyles = getStatusStyles(record.status);

              return (
                <Box
                  key={record.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '120px 1fr 1fr 1fr 120px',
                    },
                    alignItems: 'center',
                    gap: {
                      xs: 1,
                      md: 2,
                    },
                    px: 2,
                    py: 1.8,
                    borderRadius: '12px',
                    transition: 'background-color 0.2s ease',

                    '&:hover': {
                      backgroundColor: '#F8F8FA',
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {record.id}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                    }}
                  >
                    {record.field}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: 'text.secondary',
                    }}
                  >
                    {record.erp}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      color: 'text.secondary',
                    }}
                  >
                    {record.crm}
                  </Typography>

                  <Chip
                    size="small"
                    label={record.status}
                    sx={{
                      ...statusStyles,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      borderRadius: '999px',
                      minWidth: 92,
                      justifySelf: {
                        xs: 'start',
                        md: 'stretch',
                      },

                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}