import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'

/**
 * Splash screen brandé — affiché pendant le chargement initial de l'app.
 * Se retire avec un fade-out après `minDuration` ms.
 */
export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Minimum 1.4s pour que l'animation soit visible
    const t = setTimeout(() => {
      setFading(true)
      setTimeout(onDone, 400) // laisser le fade-out se terminer
    }, 1400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-br from-gray-900 via-gray-900 to-red-950
        transition-opacity duration-400
        ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Cercles décoratifs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-red-600/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-red-500/10 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Logo animé */}
      <div className="relative flex flex-col items-center gap-6 z-10">
        <div className="splash-logo w-24 h-24 gradient-red rounded-3xl flex items-center justify-center shadow-2xl">
          <ShoppingCart size={44} className="text-white" />
        </div>

        <div className="text-center splash-text">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SmartShift Board</h1>
          <p className="text-red-300 text-sm mt-1 font-medium">Gestion intelligente des horaires</p>
        </div>

        {/* Barre de chargement */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden splash-bar">
          <div className="h-full bg-red-500 rounded-full loading-bar" />
        </div>
      </div>

      {/* Version */}
      <p className="absolute bottom-8 text-xs text-gray-600 font-medium">v2.0 · SmartShift Board</p>
    </div>
  )
}
