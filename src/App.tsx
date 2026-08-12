import {
  Route,
  Routes,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

import Dashboard from './pages/Dashboard/Dashboard';
import Imports from './pages/Imports/Imports';
import Reconciliation from './pages/Reconciliation/Reconciliation';
import Exceptions from './pages/Exceptions/Exceptions';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';

function App() {
  return (
    <Routes>
      <Route
        element={<MainLayout />}
      >
        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="/imports"
          element={<Imports />}
        />

        <Route
          path="/reconciliation"
          element={
            <Reconciliation />
          }
        />

        <Route
          path="/exceptions"
          element={<Exceptions />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  );
}

export default App;
