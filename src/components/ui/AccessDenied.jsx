import { Link } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getDefaultRoute } from '../../utils/permissions'

export default function AccessDenied({ message, backTo }) {
  const { user } = useAuth()
  const home = backTo ?? getDefaultRoute(user)

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6">
          <Lock size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          {message ?? "Cette section est réservée à la direction. Vous n'avez pas les permissions nécessaires pour y accéder."}
        </p>
        <Link to={home} className="btn-primary inline-flex">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
