import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserX, Repeat2, Clock, AlertTriangle, ChevronRight, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import AlertCard from '../components/dashboard/AlertCard'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  getTodayDate, getWeekDates, formatDate, calcShiftHours, DEPARTMENTS,
  getDepartmentColor,
} from '../utils/helpers'
import {
  isDirector, isDepartmentManager, canAccessDepartment,
  filterShiftsByRole, filterAbsencesByRole, filterReplacementsByRole,
} from '../utils/permissions'

const CHART_COLORS = {
  'Caisse': '#3B82F6', 'Fruits et légumes': '#22C55E', 'Viande': '#EF4444',
  'Boulangerie': '#F59E0B', 'Épicerie': '#A855F7', 'Produits laitiers': '#06B6D4',
  'Réception': '#6366F1', 'Administration': '#6B7280',
}

/* ── Director banner ─────────────────────────────────────────────────────── */
function DirectorDashboard({ user, employees, shifts, absences, replacements, alerts, weekDates, today }) {
  const todayShifts      = shifts.filter(s => s.date === today)
  const todayAbsences    = absences.filter(a => a.date === today && a.status === 'accepted')
  const openReplacements = replacements.filter(r => r.status === 'open')
  const pendingAbsences  = absences.filter(a => a.status === 'pending')
  const weekHours = shifts.filter(s => weekDates.includes(s.date))
    .reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)

  const deptStats = useMemo(() =>
    DEPARTMENTS.map(dept => {
      const ds = shifts.filter(s => weekDates.includes(s.date) && s.department === dept)
      const hours = ds.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
      const deptEmps = employees.filter(e => e.department === dept)
      const deptAbs = absences.filter(a => weekDates.includes(a.date) && a.department === dept && a.status === 'accepted')
      const shortage = deptEmps.length > 0 && deptAbs.length >= deptEmps.length * 0.5
      return { dept, hours: Math.round(hours), count: ds.length, shortage }
    }).filter(d => d.count > 0),
  [shifts, absences, employees, weekDates])

  const getEmployee = (id) => employees.find(e => e.id === id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Bonjour, {user?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(today)} · Vue complète du magasin</p>
        </div>
        <Link to="/report" className="btn-secondary text-sm hidden sm:flex">
          <Download size={15} /> Rapport
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Shifts planifiés" value={todayShifts.length}   subtitle="aujourd'hui" icon={Users}   color="blue" />
        <StatCard title="Absences"          value={todayAbsences.length} subtitle="acceptées"   icon={UserX}   color={todayAbsences.length > 0 ? 'red' : 'green'} />
        <StatCard title="Remplacements"     value={openReplacements.length} subtitle="ouverts" icon={Repeat2} color={openReplacements.length > 0 ? 'amber' : 'green'} />
        <StatCard title="Heures semaine"    value={`${Math.round(weekHours)}h`} subtitle="planifiées" icon={Clock} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="section-header">
            <div>
              <h3 className="section-title">Heures par département</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
            </div>
          </div>
          {deptStats.length === 0 ? (
            <EmptyState icon={BarChart} title="Aucune donnée" description="Aucun shift planifié" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => v.split(' ')[0]} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [`${v}h`, 'Heures']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {deptStats.map(d => (
                    <Cell key={d.dept} fill={CHART_COLORS[d.dept] ?? '#D90429'} opacity={d.shortage ? 1 : 0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="section-header">
            <div>
              <h3 className="section-title">Alertes urgentes</h3>
              <p className="text-xs text-gray-400 mt-0.5">{alerts.length} active{alerts.length > 1 ? 's' : ''}</p>
            </div>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            {alerts.length === 0
              ? <EmptyState icon={AlertTriangle} title="Aucune alerte" description="Tout fonctionne correctement" />
              : alerts.slice(0, 4).map(a => <AlertCard key={a.id} alert={a} />)
            }
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="section-header">
            <div>
              <h3 className="section-title">État des départements</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
            </div>
            <Link to="/departments" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {deptStats.map(({ dept, hours, count, shortage }) => (
              <div key={dept} className={`flex items-center justify-between p-3 rounded-xl ${shortage ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2.5">
                  {shortage && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                  <DepartmentBadge department={dept} size="xs" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{hours}h</p>
                  <p className="text-xs text-gray-400">{count} shift{count > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="section-header">
            <div>
              <h3 className="section-title">Demandes en attente</h3>
              <p className="text-xs text-gray-400 mt-0.5">{pendingAbsences.length} à traiter</p>
            </div>
            <Link to="/absences" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingAbsences.length === 0
              ? <EmptyState icon={UserX} title="Aucune demande en attente" description="Toutes les absences ont été traitées" />
              : pendingAbsences.slice(0, 5).map(abs => {
                  const emp = getEmployee(abs.employeeId)
                  return (
                    <div key={abs.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{emp?.name?.charAt(0) ?? '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{emp?.name ?? 'Inconnu'}</p>
                        <p className="text-xs text-gray-400">{abs.reason} · {formatDate(abs.date)}</p>
                      </div>
                      <StatusBadge status={abs.status} size="xs" />
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Department-manager banner ───────────────────────────────────────────── */
function ManagerDashboard({ user, employees, shifts, absences, replacements, alerts, weekDates, today }) {
  const dept = user.department
  const myShifts      = shifts.filter(s => s.department === dept)
  const todayShifts   = myShifts.filter(s => s.date === today)
  const todayAbsences = absences.filter(a => a.date === today && a.department === dept && a.status === 'accepted')
  const openReps      = replacements.filter(r => r.department === dept && r.status === 'open')
  const weekHours     = myShifts.filter(s => weekDates.includes(s.date))
    .reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
  const pendingAbs    = absences.filter(a => a.department === dept && a.status === 'pending')
  const deptAlerts    = alerts.filter(a => a.department === dept)
  const getEmployee   = (id) => employees.find(e => e.id === id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Dashboard — {dept}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{formatDate(today)} · Vue de votre département</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Shifts aujourd'hui"  value={todayShifts.length}   icon={Users}   color="blue" />
        <StatCard title="Absences"             value={todayAbsences.length} icon={UserX}   color={todayAbsences.length > 0 ? 'red' : 'green'} />
        <StatCard title="Remplacements ouverts" value={openReps.length}    icon={Repeat2} color={openReps.length > 0 ? 'amber' : 'green'} />
        <StatCard title="Heures semaine"       value={`${Math.round(weekHours)}h`} icon={Clock} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Alertes — {dept}</h3>
          </div>
          <div className="space-y-3">
            {deptAlerts.length === 0
              ? <EmptyState icon={AlertTriangle} title="Aucune alerte" description="Votre département fonctionne correctement" />
              : deptAlerts.map(a => <AlertCard key={a.id} alert={a} />)
            }
          </div>
        </div>

        <div className="card p-5">
          <div className="section-header">
            <h3 className="section-title">Absences en attente</h3>
            <Link to="/absences" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingAbs.length === 0
              ? <EmptyState icon={UserX} title="Aucune demande en attente" />
              : pendingAbs.slice(0, 5).map(abs => {
                  const emp = getEmployee(abs.employeeId)
                  return (
                    <div key={abs.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-sm">{emp?.name?.charAt(0) ?? '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{emp?.name ?? 'Inconnu'}</p>
                        <p className="text-xs text-gray-400">{abs.reason} · {formatDate(abs.date)}</p>
                      </div>
                      <StatusBadge status={abs.status} size="xs" />
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Root ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth()
  const { employees, shifts, absences, replacements, alerts } = useApp()
  const today     = getTodayDate()
  const weekDates = useMemo(() => getWeekDates(new Date(today)), [today])

  const common = { user, employees, shifts, absences, replacements, alerts, weekDates, today }

  if (isDirector(user)) return <DirectorDashboard {...common} />
  if (isDepartmentManager(user)) return <ManagerDashboard {...common} />

  // Should not reach here — employees are redirected to /my-schedule
  return null
}
