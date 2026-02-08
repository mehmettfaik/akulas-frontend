import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { HakedisPage } from './pages/HakedisPage';
import { BayiDolumPage } from './pages/BayiDolumPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { DeskPage } from './pages/DeskPage';
import { DeskSubmittedPage } from './pages/DeskSubmittedPage';
import { WeeklyHakedisSummaryPage } from './pages/WeeklyHakedisSummaryPage';
import { BankayaGonderilenPage } from './pages/BankayaGonderilenPage';
import { LeavePage } from './pages/LeavePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'responsible', 'desk']}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/hakedis"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <HakedisPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/hakedis/weekly-summary"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WeeklyHakedisSummaryPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/desk"
            element={
              <ProtectedRoute allowedRoles={['desk']}>
                <DeskPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/bayi-dolum"
            element={
              <ProtectedRoute allowedRoles={['desk']}>
                <BayiDolumPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/desk-submitted"
            element={
              <ProtectedRoute allowedRoles={['desk', 'responsible', 'admin']}>
                <DeskSubmittedPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bankaya-gonderilen"
            element={
              <ProtectedRoute allowedRoles={['desk', 'responsible', 'admin']}>
                <BankayaGonderilenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LeavePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

