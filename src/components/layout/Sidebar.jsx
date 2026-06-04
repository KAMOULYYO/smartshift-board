import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, UserX, Repeat2,
  Building2, Clock, LogOut, ChevronRight,
  ShoppingCart, User,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import {
  isDirector, isManagerLevel, isDepartmentManager, isEmployee,
  filterReplacementsByRole, filterAbsencesByRole, getRoleLabel, ROLES,
} from '../../utils/permissions'

function buildNav(user, openReplacements, pendingAbsences) {
  if (!user) return []

  const badges = {
    replacements: openReplacements > 0 ? openReplacements : null,
    absences: pendingAbsences > 0 ? pendingAbsences : null,
  }

  if (isDirector(user)) {
    return [
      { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/schedule',      icon: Calendar,        label: 'Horaires' },
      { to: '/availability',  icon: Clock,           label: 'Disponibilités' },
      { to: '/absences',      icon: UserX,           label: 'Absences',      badge: badges.absences },
      { to: '/replacements',  icon: Repeat2,         label: 'Remplacements', badge: badges.replacements },
      { to: '/employees',     icon: Users,           label: 'Employés' },
      { to: '/departments',   icon: Building2,       label: 'Départements' },
    ]
  }

  if (isDepartmentManager(user)) {
    return [
      { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard département' },
      { to: '/schedule',      icon: Calendar,        label: 'Horaires' },
      { to: '/availability',  icon: Clock,           label: 'Disponibilités' },
      { to: '/absences',      icon: UserX,           label: 'Absences',      badge: badges.absences },
      { to: '/replacements',  icon: Repeat2,         label: 'Remplacements', badge: badges.replacements },
      { to: '/employees',     icon: Users,           label: 'Mon équipe' },
    ]
  }

  // Employee
  return [
    { to: '/my-schedule',     icon: Calendar,  label: 'Mon horaire' },
    { to: '/availability',    icon: Clock,     label: 'Mes disponibilités' },
    { to: '/absences',        icon: UserX,     label: 'Mes absences' },
    { to: '/my-profile',      icon: User,      label: 'Mon profil' },
  ]
}

export default function Sidebar({ collapsed, onClose }) {
  const { user, logout } = useAuth()
  const { replacements, absences } = useApp()

  const openReplacements = filterReplacementsByRole(user, replacements).filter(r => r.status === 'open').length
  const pendingAbsences  = filterAbsencesByRole(user, absences).filter(a => a.status === 'pending').length

  const navItems = buildNav(user, openReplacements, pendingAbsences)

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-300 w-64
          ${collapsed ? '-translate-x-full' : 'translate-x-0'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">SmartShift</p>
              <p className="text-xs text-gray-400 mt-0.5">Board</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 mt-1">
            Navigation
          </p>
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-sm">{label}</span>
                  {badge && (
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center ${
                        isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  {!badge && isActive && <ChevronRight size={14} className="opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-2">
            <div className="w-8 h-8 gradient-red rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">{user?.name?.charAt(0) ?? 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">{getRoleLabel(user?.role)}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
