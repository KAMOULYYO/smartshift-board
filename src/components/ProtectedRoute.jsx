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

  if (loading) return null   // wait for token verification before redirecting
  if (!user) return <Navigate to="/login" replace />

  const roleDenied = deniedRoles?.includes(user.role)
  const roleAllowed = !allowedRoles || allowedRoles.includes(user.role)

  if (roleDenied || !roleAllowed) {
    if (redirectTo) return <Navigate to={redirectTo} replace />
    return <AccessDenied message={accessDeniedMessage} />
  }

  return children
}
