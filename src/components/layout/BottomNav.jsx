import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, UserX, Repeat2, User, Clock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import {
  isDirector, isDepartmentManager,
  filterReplacementsByRole, filterAbsencesByRole,
} from '../../utils/permissions'

export default function BottomNav() {
  const { user } = useAuth()
  const { replacements, absences } = useApp()

  const openReplacements = filterReplacementsByRole(user, replacements).filter(r => r.status === 'open').length
  const pendingAbsences  = filterAbsencesByRole(user, absences).filter(a => a.status === 'pending').length

  let items = []

  if (isDirector(user) || isDepartmentManager(user)) {
    items = [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Accueil' },
      { to: '/schedule',     icon: Calendar,        label: 'Horaires' },
      { to: '/absences',     icon: UserX,           label: 'Absences',  badge: pendingAbsences },
      { to: '/replacements', icon: Repeat2,         label: 'Rempl.',    badge: openReplacements },
      { to: '/employees',    icon: User,            label: 'Équipe' },
    ]
  } else {
    items = [
      { to: '/my-schedule',  icon: Calendar, label: 'Mon horaire' },
      { to: '/availability', icon: Clock,    label: 'Dispo' },
      { to: '/absences',     icon: UserX,    label: 'Absences' },
      { to: '/my-profile',   icon: User,     label: 'Profil' },
    ]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors relative
               ${isActive ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full" />
                )}
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
