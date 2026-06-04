import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiLogin, apiMe } from '../api/authApi'
import {
  isDirector, isManagerLevel, isDepartmentManager, isEmployee,
  canViewGlobalReports, getDefaultRoute, ROLES,
} from '../utils/permissions'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ssb_token'

function getSavedToken() {
  return localStorage.getItem(TOKEN_KEY) ?? null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = getSavedToken()
    if (!token) {
      setLoading(false)
      return
    }
    apiMe()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await apiLogin(email, password)
      localStorage.setItem(TOKEN_KEY, data.access_token)
      setUser(data.user)
      return { success: true, redirectTo: getDefaultRoute(data.user) }
    } catch (err) {
      // Timeout = Render free tier waking up
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || !err.response) {
        return {
          success: false,
          error: '⏳ Le serveur démarre… Réessayez dans 10 secondes.',
          isWakeUp: true,
        }
      }
      const msg = err.response?.data?.detail ?? 'Email ou mot de passe incorrect'
      return { success: false, error: msg }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isDirector: isDirector(user),
        isManagerLevel: isManagerLevel(user),
        isDepartmentManager: isDepartmentManager(user),
        isEmployee: isEmployee(user),
        canViewGlobalReports: canViewGlobalReports(user),
        canManage: isManagerLevel(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
