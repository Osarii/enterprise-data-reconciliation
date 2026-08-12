import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#0071E3',
    },

    background: {
      default: '#F5F5F7',
      paper: '#FFFFFF',
    },

    text: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
    },

    success: {
      main: '#248A3D',
    },

    warning: {
      main: '#B26A00',
    },

    error: {
      main: '#D70015',
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
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow:
            '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)',
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
  },
});

export default theme;