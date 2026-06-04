import { Link } from 'react-router-dom'
import { ShoppingCart, Home, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function NotFoundPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 flex items-center justify-center p-6">
      <div className="text-center max-w-md">

        {/* Illustration */}
        <div className="relative mb-8 flex justify-center">
          <div className="w-32 h-32 gradient-red rounded-4xl rounded-[2rem] flex items-center justify-center shadow-red opacity-10 absolute top-0" />
          <div className="w-28 h-28 gradient-red rounded-[1.75rem] flex items-center justify-center shadow-red relative z-10">
            <ShoppingCart size={44} className="text-white" />
          </div>
        </div>

        {/* 404 */}
        <div className="mb-6">
          <p className="text-8xl font-black text-gray-900 leading-none tracking-tighter">
            4<span className="text-red-500">0</span>4
          </p>
          <h1 className="text-xl font-bold text-gray-700 mt-3">Page introuvable</h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée.
            Vérifiez l'URL ou retournez à l'accueil.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? '/dashboard' : '/'}
            className="btn-primary text-sm"
          >
            <Home size={16} />
            {user ? 'Retour au Dashboard' : 'Retour à l\'accueil'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary text-sm"
          >
            <ArrowLeft size={16} />
            Page précédente
          </button>
        </div>

        {/* Décoration */}
        <p className="text-xs text-gray-300 mt-10">SmartShift Board</p>
      </div>
    </div>
  )
}
