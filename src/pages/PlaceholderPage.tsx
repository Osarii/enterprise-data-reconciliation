import { Box, Typography } from '@mui/material';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({
  title,
}: PlaceholderPageProps) {
  return (
    <Box>
      <Typography variant="h4">
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 1,
          color: 'text.secondary',
        }}
      >
        This module will be implemented in a future version.
      </Typography>
    </Box>
  );
}