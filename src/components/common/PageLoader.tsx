import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';

export default function PageLoader() {
  return (
    <Box
      sx={{
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress size={28} thickness={4} />

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: '0.78rem',
        }}
      >
        Loading workspace module…
      </Typography>
    </Box>
  );
}
