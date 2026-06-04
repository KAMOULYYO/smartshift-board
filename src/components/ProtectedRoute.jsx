import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDefaultRoute } from '../utils/permissions'
import AccessDenied from './ui/AccessDenied'

/**
 * allowedRoles  — array of role strings; omit to allow any authenticated user
 * deniedRoles   — array of role strings explicitly blocked
 * accessDeniedMessage — custom message shown on the access-denied screen
 * redirectTo    — redirect instead of showing the denied screen
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  deniedRoles,
  accessDeniedMessage,
  redirectTo,
}) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 gradient-red rounded-2xl flex items-center justify-center animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </div>
        <p className="text-sm text-gray-400 font-medium">Chargement…</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  const roleDenied = deniedRoles?.includes(user.role)
  const roleAllowed = !allowedRoles || allowedRoles.includes(user.role)

  if (roleDenied || !roleAllowed) {
    if (redirectTo) return <Navigate to={redirectTo} replace />
    return <AccessDenied message={accessDeniedMessage} />
  }

  return children
}
