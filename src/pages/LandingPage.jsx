import { Link } from 'react-router-dom'
import {
  Calendar, Users, Repeat2, BarChart3, Clock, Shield,
  ChevronRight, ShoppingCart, CheckCircle, Zap, TrendingUp, ArrowRight
} from 'lucide-react'

const FEATURES = [
  { icon: Calendar, title: 'Horaires intelligents', desc: 'Planifiez la semaine en un coup d\'œil. Vue hebdomadaire claire avec drag & drop.' },
  { icon: Users, title: 'Gestion des employés', desc: 'Fiches employés complètes, disponibilités, rôles et coordonnées centralisés.' },
  { icon: Repeat2, title: 'Remplacements rapides', desc: 'Identifiez instantanément les absences et assignez les remplaçants disponibles.' },
  { icon: BarChart3, title: 'Rapports automatiques', desc: 'Rapport de fin de journée généré automatiquement, exportable en un clic.' },
  { icon: Clock, title: 'Disponibilités en temps réel', desc: 'Chaque employé renseigne ses disponibilités, visible par tous les managers.' },
  { icon: Shield, title: 'Accès sécurisé par rôle', desc: 'Directeur, adjoint, employé — chacun voit uniquement ce qui le concerne.' },
]

const STATS = [
  { value: '40%', label: 'de temps économisé sur la planification' },
  { value: '0', label: 'conflit d\'horaire non détecté' },
  { value: '100%', label: 'des absences suivies en temps réel' },
  { value: '8', label: 'départements gérés simultanément' },
]

const ADVANTAGES = [
  'Détection automatique des conflits d\'horaires',
  'Alertes urgentes en temps réel pour les managers',
  'Vue calendrier semaine intuitive et claire',
  'Filtres par département pour chaque vue',
  'Export PDF des rapports journaliers',
  'Interface responsive mobile, tablette et desktop',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartShift<span className="text-red-500"> Board</span></span>
          </div>
          <Link to="/login" className="btn-primary text-sm">
            Connexion <ChevronRight size={15} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 pt-20 pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-96 h-48 bg-red-500/4 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-600 text-sm font-semibold mb-8">
            <Zap size={14} /> Solution de gestion pour directeurs de magasin
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 text-balance">
            Gérez les horaires du magasin{' '}
            <span className="text-red-500">plus vite</span>,{' '}
            <span className="text-red-500">plus clairement</span>,{' '}
            plus intelligemment.
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            SmartShift Board aide les directeurs à suivre les horaires, absences, remplacements et disponibilités des employés en temps réel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-base px-8 py-3.5 shadow-red">
              Accéder au dashboard <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5">
              Découvrir les fonctionnalités
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-6">Aucune carte bancaire requise · 100% gratuit · Prêt en 30 secondes</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-extrabold text-red-500 mb-2">{s.value}</p>
                <p className="text-sm text-gray-500 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">
              Tout ce dont vous avez besoin, rien de plus.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Conçu spécifiquement pour les directeurs de supermarché, SmartShift couvre chaque aspect de la gestion d'équipe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="card-hover p-6 group cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors duration-200">
                  <f.icon size={22} className="text-red-500 group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-6">
                Pensé pour le terrain, pas pour les réunions.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                SmartShift Board est conçu pour fonctionner rapidement dans un environnement exigeant. Chaque fonctionnalité répond à un vrai problème quotidien.
              </p>
              <ul className="space-y-3">
                {ADVANTAGES.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700 text-sm">{a}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link to="/login" className="btn-primary text-base px-7 py-3">
                  Commencer maintenant <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="gradient-red rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold">Rapport du jour</p>
                    <p className="text-white/60 text-sm">Mis à jour automatiquement</p>
                  </div>
                </div>
                {[
                  { label: 'Employés présents', value: '18/20', ok: true },
                  { label: 'Absences signalées', value: '2', ok: false },
                  { label: 'Remplacements couverts', value: '1/2', ok: null },
                  { label: 'Heures totales planifiées', value: '142h', ok: true },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/10 last:border-0">
                    <span className="text-white/70 text-sm">{row.label}</span>
                    <span className={`font-bold text-sm ${row.ok === true ? 'text-green-300' : row.ok === false ? 'text-red-300' : 'text-amber-300'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-700 rounded-3xl -z-10" />
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-red-200 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-red">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4">
            Prêt à prendre le contrôle de vos horaires ?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Rejoignez des directeurs qui gèrent leur équipe plus efficacement chaque jour.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-red-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-lg text-base">
            Accéder au dashboard <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-red rounded-lg flex items-center justify-center">
              <ShoppingCart size={14} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">SmartShift Board</span>
          </div>
          <p className="text-xs">© 2026 SmartShift Board. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
