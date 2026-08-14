import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
} from '@mui/material';

import {
  ArrowLeft,
  FileQuestion,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Card sx={{ width: 'min(100%, 620px)' }}>
        <CardContent
          sx={{
            p: { xs: 3, md: 4 },
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              mx: 'auto',
              mb: 2.5,
              color: 'primary.main',
              backgroundColor: 'var(--primary-soft)',
            }}
          >
            <FileQuestion size={27} />
          </Box>

          <Typography variant="h4" sx={{ mb: 1 }}>
            Page not found
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The requested workspace route does not exist or may have been moved.
          </Typography>

          <Button
            variant="contained"
            startIcon={<ArrowLeft size={17} />}
            onClick={() => navigate('/')}
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
