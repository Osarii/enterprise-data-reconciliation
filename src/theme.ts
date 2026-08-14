import {
  createTheme,
} from '@mui/material/styles';

import type {
  PaletteMode,
} from '@mui/material';

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,

      primary: {
        main: isDark ? '#0A84FF' : '#0071E3',
      },

      background: {
        default: isDark ? '#0B0B0F' : '#F5F5F7',
        paper: isDark ? '#16161C' : '#FFFFFF',
      },

      text: {
        primary: isDark ? '#F5F5F7' : '#1D1D1F',
        secondary: isDark ? '#A1A1A6' : '#6E6E73',
      },

      divider: isDark
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(0,0,0,0.06)',

      success: {
        main: isDark ? '#30D158' : '#248A3D',
      },

      warning: {
        main: isDark ? '#FF9F0A' : '#B26A00',
      },

      error: {
        main: isDark ? '#FF453A' : '#D70015',
      },

      action: {
        hover: isDark
          ? 'rgba(255,255,255,0.055)'
          : 'rgba(0,0,0,0.035)',
        selected: isDark
          ? 'rgba(10,132,255,0.16)'
          : 'rgba(0,113,227,0.08)',
      },
    },

    typography: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

      h4: {
        fontWeight: 700,
        letterSpacing: '-0.03em',
      },

      h6: {
        fontWeight: 600,
      },

      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },

    shape: {
      borderRadius: 16,
    },

    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(0,0,0,0.06)',
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.22), 0 12px 30px rgba(0,0,0,0.22)'
              : '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)',
            backgroundImage: 'none',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
          },
        },
      },

      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `3px solid ${
                isDark
                  ? 'rgba(100,168,255,0.55)'
                  : 'rgba(0,113,227,0.30)'
              }`,
              outlineOffset: 2,
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)',
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 10,
            fontSize: '0.76rem',
          },
        },
      },
    },
  });
}

export default createAppTheme('light');
