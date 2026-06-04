import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/':             'SmartShift Board',
  '/login':        'Connexion — SmartShift Board',
  '/dashboard':    'Dashboard — SmartShift Board',
  '/schedule':     'Horaires — SmartShift Board',
  '/my-schedule':  'Mon horaire — SmartShift Board',
  '/availability': 'Disponibilités — SmartShift Board',
  '/absences':     'Absences — SmartShift Board',
  '/replacements': 'Remplacements — SmartShift Board',
  '/employees':    'Employés — SmartShift Board',
  '/departments':  'Départements — SmartShift Board',
  '/my-profile':   'Mon profil — SmartShift Board',
  '/settings':     'Paramètres — SmartShift Board',
  '/share':        'Planning partagé — SmartShift Board',
  '/tv':           'Mode TV — SmartShift Board',
  '/about':        'À propos — SmartShift Board',
}

export function usePageTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Correspondance exacte ou préfixe (ex: /employees/123)
    const title = TITLES[pathname]
      ?? (pathname.startsWith('/employees/') ? 'Profil employé — SmartShift Board' : 'SmartShift Board')
    document.title = title
  }, [pathname])
}
