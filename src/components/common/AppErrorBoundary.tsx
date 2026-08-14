import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

import {
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error', error, info);
  }

  private reloadApplication = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        <Card sx={{ width: 'min(100%, 620px)' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                color: 'error.main',
                backgroundColor: 'var(--danger-soft)',
                mb: 2.5,
              }}
            >
              <TriangleAlert size={24} />
            </Box>

            <Typography variant="h4" sx={{ mb: 1 }}>
              The workspace hit an unexpected error
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Your browser-stored workspace has not been intentionally cleared. Reload the application to recover the latest persisted state.
            </Typography>

            {this.state.message && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {this.state.message}
              </Alert>
            )}

            <Button
              variant="contained"
              startIcon={<RefreshCw size={17} />}
              onClick={this.reloadApplication}
            >
              Reload application
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }
}
