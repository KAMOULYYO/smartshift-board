import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/schedule':     'Horaires de la semaine',
  '/my-schedule':  'Mon horaire',
  '/availability': 'Disponibilités',
  '/absences':     'Absences',
  '/replacements': 'Remplacements',
  '/employees':    'Employés',
  '/departments':  'Départements',
  '/report':       'Rapport journalier',
  '/my-profile':   'Mon profil',
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'SmartShift Board'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
