import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import { useApp } from '../../context/AppContext'
import { DashboardSkeleton, ListSkeleton } from '../ui/Skeleton'

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/schedule':     'Horaires de la semaine',
  '/my-schedule':  'Mon horaire',
  '/availability': 'Disponibilités',
  '/absences':     'Absences',
  '/replacements': 'Remplacements',
  '/employees':    'Employés',
  '/departments':  'Départements',
  '/my-profile':   'Mon profil',
}

/* Quel skeleton afficher selon la page */
function PageSkeleton({ pathname }) {
  if (pathname === '/dashboard') return <DashboardSkeleton />
  return <ListSkeleton rows={6} />
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'SmartShift Board'
  const { dataLoading } = useApp()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} title={title} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto page-transition">
            {dataLoading ? <PageSkeleton pathname={pathname} /> : children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <BottomNav />
    </div>
  )
}
