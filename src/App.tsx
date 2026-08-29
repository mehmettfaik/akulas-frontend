import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy loaded pages for Code-Splitting
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const HomePage = React.lazy(() => import('./pages/HomePage').then(module => ({ default: module.HomePage })));
const HakedisPage = React.lazy(() => import('./pages/HakedisPage').then(module => ({ default: module.HakedisPage })));
const BayiDolumPage = React.lazy(() => import('./pages/BayiDolumPage').then(module => ({ default: module.BayiDolumPage })));
const VehiclesPage = React.lazy(() => import('./pages/VehiclesPage').then(module => ({ default: module.VehiclesPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage })));
const UsersPage = React.lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const DeskPage = React.lazy(() => import('./pages/DeskPage').then(module => ({ default: module.DeskPage })));
const DeskSubmittedPage = React.lazy(() => import('./pages/DeskSubmittedPage').then(module => ({ default: module.DeskSubmittedPage })));
const WeeklyHakedisSummaryPage = React.lazy(() => import('./pages/WeeklyHakedisSummaryPage').then(module => ({ default: module.WeeklyHakedisSummaryPage })));
const BankayaGonderilenPage = React.lazy(() => import('./pages/BankayaGonderilenPage').then(module => ({ default: module.BankayaGonderilenPage })));
const LeavePage = React.lazy(() => import('./pages/LeavePage').then(module => ({ default: module.LeavePage })));
const KioskDolumPage = React.lazy(() => import('./pages/KioskDolumPage').then(module => ({ default: module.KioskDolumPage })));
const AdminIsletimFormlariPage = React.lazy(() => import('./pages/AdminIsletimFormlariPage').then(module => ({ default: module.AdminIsletimFormlariPage })));
const PublicHakedisSorgulamaPage = React.lazy(() => import('./pages/PublicHakedisSorgulamaPage').then(module => ({ default: module.PublicHakedisSorgulamaPage })));

const SuspenseFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-gray-600 text-sm font-medium">Yükleniyor...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sorgulama" element={<PublicHakedisSorgulamaPage />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['admin', 'responsible', 'desk']}>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin-isletim-formlari"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminIsletimFormlariPage />
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

            <Route
              path="/kiosk-dolum"
              element={
                <ProtectedRoute allowedRoles={['admin', 'responsible', 'desk']}>
                  <KioskDolumPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;

