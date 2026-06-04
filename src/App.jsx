import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

const MANAGER_ROLES = [ROLES.DIRECTOR, ROLES.ASSISTANT_MANAGER, ROLES.MANAGER]

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"       element={<LandingPage />} />
      <Route path="/login"  element={<LoginPage />} />

      {/* Dashboard — employees are redirected to /my-schedule */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Full schedule — managers/directors only */}
      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><SchedulePage /></Layout>
        </ProtectedRoute>
      } />

      {/* Employee personal schedule */}
      <Route path="/my-schedule" element={
        <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
          <Layout><MySchedulePage /></Layout>
        </ProtectedRoute>
      } />

      {/* Availability — all roles, filtered by role inside the page */}
      <Route path="/availability" element={
        <ProtectedRoute>
          <Layout><AvailabilityPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Absences — all roles, filtered inside */}
      <Route path="/absences" element={
        <ProtectedRoute>
          <Layout><AbsencesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Replacements — all roles, filtered inside */}
      <Route path="/replacements" element={
        <ProtectedRoute>
          <Layout><ReplacementsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Employees list — managers+, further guarded inside the page */}
      <Route path="/employees" element={
        <ProtectedRoute>
          <Layout><EmployeesPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Departments — managers+ only */}
      <Route path="/departments" element={
        <ProtectedRoute allowedRoles={MANAGER_ROLES}>
          <Layout><DepartmentsPage /></Layout>
        </ProtectedRoute>
      } />

      {/* Employee profile */}
      <Route path="/my-profile" element={
        <ProtectedRoute>
          <Layout><MyProfilePage /></Layout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppRoutes />
            <ToastContainer />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
