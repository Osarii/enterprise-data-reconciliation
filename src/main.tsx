import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReconciliationProvider } from './context/ReconciliationContext';
import { CssBaseline, ThemeProvider } from '@mui/material';

import App from './App';
import theme from './theme';

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <ReconciliationProvider>
          <App />
        </ReconciliationProvider>

      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);