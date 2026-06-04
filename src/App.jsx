import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'
import ToastContainer from './components/ui/Toast'
import { ROLES } from './utils/permissions'

import LandingPage       from './pages/LandingPage'
import LoginPage         from './pages/LoginPage'
import DashboardPage     from './pages/DashboardPage'
import SchedulePage      from './pages/SchedulePage'
import MySchedulePage    from './pages/MySchedulePage'
import AvailabilityPage  from './pages/AvailabilityPage'
import AbsencesPage      from './pages/AbsencesPage'
import ReplacementsPage  from './pages/ReplacementsPage'
import EmployeesPage     from './pages/EmployeesPage'
import DepartmentsPage   from './pages/DepartmentsPage'
import MyProfilePage     from './pages/MyProfilePage'
import NotFoundPage      from './pages/NotFoundPage'
import SharePage         from './pages/SharePage'
import TvDashboardPage   from './pages/TvDashboardPage'
import SettingsPage      from './pages/SettingsPage'
import SplashScreen      from './components/ui/SplashScreen'

const MANAGER_ROLES = [ROLES.DIRECTOR, ROLES.ASSISTANT_MANAGER, ROLES.MANAGER]

/* Wrapper d'animation de transition entre pages */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Planning partagé — public, sans auth */}
      <Route path="/share" element={<SharePage />} />

      {/* Mode TV — plein écran, sans sidebar */}
      <Route path="/tv" element={<TvDashboardPage />} />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><SchedulePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-schedule" element={
        <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
          <Layout><MySchedulePage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/availability" element={
        <ProtectedRoute>
          <Layout><AvailabilityPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/absences" element={
        <ProtectedRoute>
          <Layout><AbsencesPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/replacements" element={
        <ProtectedRoute>
          <Layout><ReplacementsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout><EmployeesPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><DepartmentsPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-profile" element={
        <ProtectedRoute>
          <Layout><MyProfilePage /></Layout>
        </ProtectedRoute>
      } />

      {/* Paramètres — directeur uniquement */}
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={[ROLES.DIRECTOR]}>
          <Layout><SettingsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AppWithSplash() {
  const [splashDone, setSplashDone] = useState(false)
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AnimatedRoutes />
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppWithSplash />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
