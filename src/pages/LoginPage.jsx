import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ShoppingCart, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sanitizeEmail, sanitizeText } from '../utils/sanitize'
import { validateEmail } from '../utils/validation'

const DEMO_CREDENTIALS = [
  { role: 'Directeur',       email: 'directeur@smartshift.fr', password: 'directeur123', color: 'red' },
  { role: 'Adjoint – Caisse',      email: 'adjoint@smartshift.fr',  password: 'adjoint123',   color: 'blue' },
  { role: 'Gérant – F&L',   email: 'gerant@smartshift.fr',   password: 'gerant123',    color: 'green' },
  { role: 'Employé',         email: 'employe@smartshift.fr',  password: 'employe123',   color: 'purple' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = {}
    const emailErr = validateEmail(email)
    if (emailErr) errs.email = emailErr
    if (!password) errs.password = 'Mot de passe requis'
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 350))
    const result = await login(sanitizeEmail(email), sanitizeText(password, 128))
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    navigate(result.redirectTo ?? '/dashboard')
  }

  const fillDemo = (cred) => {
    setEmail(cred.email)
    setPassword(cred.password)
    setError('')
    setFieldErrors({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 gradient-red rounded-3xl flex items-center justify-center shadow-red">
              <ShoppingCart size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">SmartShift Board</h1>
              <p className="text-sm text-gray-400 mt-0.5">Gestion des horaires de magasin</p>
            </div>
          </Link>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-400 mb-6">Accédez à votre espace de gestion</p>

          {error && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                maxLength={254}
                className={`input-field ${fieldErrors.email ? 'ring-2 ring-red-400 border-transparent' : ''}`}
                disabled={loading}
              />
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  maxLength={128}
                  className={`input-field pr-10 ${fieldErrors.password ? 'ring-2 ring-red-400 border-transparent' : ''}`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion…
                </span>
              ) : (
                <span className="flex items-center gap-2"><LogIn size={18} /> Se connecter</span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comptes de démonstration</p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map(cred => (
                <button
                  key={cred.role}
                  onClick={() => fillDemo(cred)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-all duration-150 group"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{cred.role}</p>
                    <p className="text-xs text-gray-400">{cred.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Utiliser →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-red-500 transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  )
}
