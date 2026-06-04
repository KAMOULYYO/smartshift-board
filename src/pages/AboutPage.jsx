import { Link } from 'react-router-dom'
import {
  ShoppingCart, Users, Calendar, UserX, Repeat2, Clock,
  Building2, BarChart2, Shield, Smartphone, Globe, Zap,
  CheckCircle2, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDefaultRoute } from '../utils/permissions'

const FEATURES = [
  { icon: Calendar,   title: 'Planning hebdomadaire',     desc: 'Vue calendrier et liste, navigation semaine par semaine, export PDF' },
  { icon: Users,      title: 'Gestion des équipes',       desc: 'CRUD employés, rôles (directeur, gérant, adjoint, employé), départements' },
  { icon: UserX,      title: 'Gestion des absences',      desc: 'Soumission, validation, urgences, historique complet' },
  { icon: Repeat2,    title: 'Remplacements',             desc: 'Système de remplacement avec assignation et suivi' },
  { icon: Clock,      title: 'Check-in / Check-out',      desc: 'Pointage digital des arrivées et départs' },
  { icon: Building2,  title: 'Multi-départements',        desc: 'Caisse, F&L, Viande, Boulangerie, Épicerie et plus' },
  { icon: BarChart2,  title: 'Analytique',                desc: 'Dashboard avec graphiques, taux de couverture, alertes temps réel' },
  { icon: Shield,     title: 'Sécurité & RBAC',           desc: 'JWT, 4 niveaux de rôles, logs d\'audit, rate limiting' },
  { icon: Smartphone, title: 'PWA installable',           desc: 'Fonctionne sur téléphone comme une vraie app native' },
  { icon: Globe,      title: 'Partage public',            desc: 'Lien de partage du planning en lecture seule' },
]

const ROLES = [
  { role: 'Directeur',        color: 'bg-red-100 text-red-600',    desc: 'Accès complet — tous les employés, tous les départements, paramètres' },
  { role: 'Adjoint Manager',  color: 'bg-blue-100 text-blue-600',  desc: 'Gestion de son département + employés de son équipe' },
  { role: 'Gérant',           color: 'bg-green-100 text-green-600',desc: 'Gestion de son département uniquement' },
  { role: 'Employé',          color: 'bg-gray-100 text-gray-600',  desc: 'Consultation de ses propres shifts, absences et disponibilités' },
]

export default function AboutPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/20">

      {/* Nav */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">SmartShift Board</span>
          </Link>
          {user ? (
            <Link to={getDefaultRoute(user)} className="btn-primary text-sm">
              Accéder à l'app <ArrowRight size={15} />
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              Se connecter <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-full border border-red-100">
            <Zap size={12} /> Version 2.0 · Juin 2025
          </div>
          <h1 className="text-5xl font-black text-gray-900 leading-tight">
            SmartShift<span className="text-red-500"> Board</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            La solution complète de gestion des horaires pour les magasins. Planifiez, gérez, analysez — tout en un seul endroit.
          </p>
        </div>

        {/* Features grid */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Toutes les fonctionnalités</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5 hover:shadow-card-hover transition-shadow">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon size={18} className="text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rôles */}
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Les 4 niveaux d'accès</h2>
          <div className="space-y-3">
            {ROLES.map(({ role, color, desc }) => (
              <div key={role} className="card p-4 flex items-center gap-4">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 ${color}`}>{role}</span>
                <p className="text-sm text-gray-600">{desc}</p>
                <CheckCircle2 size={16} className="text-green-400 shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Stack technique */}
        <div className="card p-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">Stack technique</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { label: 'Frontend', tech: 'React 18 + Vite', sub: 'Tailwind CSS · React Router · Recharts' },
              { label: 'Backend',  tech: 'FastAPI (Python)', sub: 'Motor · PyJWT · Passlib · SlowAPI' },
              { label: 'Base de données', tech: 'MongoDB Atlas', sub: 'Collections indexées · Motor async' },
            ].map(({ label, tech, sub }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{label}</p>
                <p className="text-lg font-extrabold text-gray-900">{tech}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          {user ? (
            <Link to={getDefaultRoute(user)} className="btn-primary text-base px-8 py-3">
              Retour au dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/login" className="btn-primary text-base px-8 py-3">
              Commencer maintenant <ArrowRight size={18} />
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-gray-300">SmartShift Board v2.0 · Développé avec ❤️ · 2025</p>
      </div>
    </div>
  )
}
