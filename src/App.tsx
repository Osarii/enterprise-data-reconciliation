import {
  lazy,
} from 'react';

import {
  Route,
  Routes,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

const Dashboard = lazy(
  () => import('./pages/Dashboard/Dashboard')
);

const Imports = lazy(
  () => import('./pages/Imports/Imports')
);

const Reconciliation = lazy(
  () => import('./pages/Reconciliation/Reconciliation')
);

const Exceptions = lazy(
  () => import('./pages/Exceptions/Exceptions')
);

const Reports = lazy(
  () => import('./pages/Reports/Reports')
);

const History = lazy(
  () => import('./pages/History/History')
);

const Settings = lazy(
  () => import('./pages/Settings/Settings')
);

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/imports" element={<Imports />} />
        <Route
          path="/reconciliation"
          element={<Reconciliation />}
        />
        <Route path="/exceptions" element={<Exceptions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
