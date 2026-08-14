import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import AppErrorBoundary from './components/common/AppErrorBoundary';
import { ReconciliationProvider } from './context/ReconciliationContext';
import { ThemeModeProvider } from './context/ThemeModeContext';

import App from './App';

import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Application root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <ReconciliationProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
        </ReconciliationProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </StrictMode>
);
