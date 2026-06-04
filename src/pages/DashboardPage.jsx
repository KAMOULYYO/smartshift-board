import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserX, Repeat2, Clock, AlertTriangle, ChevronRight,
  TrendingUp, TrendingDown, CheckCircle2, ShieldAlert, Tv2, Building2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import AlertCard from '../components/dashboard/AlertCard'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  getTodayDate, getWeekDates, formatDate, calcShiftHours, DEPARTMENTS,
} from '../utils/helpers'
import {
  isDirector, isDepartmentManager,
  filterShiftsByRole, filterAbsencesByRole, filterReplacementsByRole,
} from '../utils/permissions'

const DEPT_COLORS = {
  'Caisse': '#3B82F6', 'Fruits et légumes': '#22C55E', 'Viande': '#EF4444',
  'Boulangerie': '#F59E0B', 'Épicerie': '#A855F7', 'Produits laitiers': '#06B6D4',
  'Réception': '#6366F1', 'Administration': '#6B7280',
}

/* ── KPI card ──────────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, trend, color, bg, border }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${border} ${bg} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-white/60`}>
          <Icon size={20} />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Coverage ring ─────────────────────────────────────────────────────────── */
function CoverageRing({ rate }) {
  const color = rate >= 90 ? '#22C55E' : rate >= 70 ? '#F59E0B' : '#EF4444'
  const label = rate >= 90 ? 'Excellent' : rate >= 70 ? 'Correct' : 'Critique'
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#F3F4F6" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${rate * 2.51} 251`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-extrabold text-gray-900">{rate}%</p>
          <p className="text-xs text-gray-400">couverture</p>
        </div>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${rate >= 90 ? 'bg-green-100 text-green-600' : rate >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
        {label}
      </span>
    </div>
  )
}

/* ── Director dashboard ────────────────────────────────────────────────────── */
function DirectorDashboard({ user, employees, shifts, absences, replacements, alerts, weekDates, today }) {
  const todayShifts      = shifts.filter(s => s.date === today)
  const todayAbsences    = absences.filter(a => a.date === today && a.status === 'accepted')
  const openReplacements = replacements.filter(r => r.status === 'open')
  const pendingAbsences  = absences.filter(a => a.status === 'pending')

  const weekHours = shifts
    .filter(s => weekDates.includes(s.date))
    .reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)

  const coverageRate = todayShifts.length > 0
    ? Math.round(((todayShifts.length - todayAbsences.length) / todayShifts.length) * 100)
    : 100

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

  const pieData = useMemo(() =>
    deptStats.map(d => ({ name: d.dept.split(' ')[0], value: d.hours, fill: DEPT_COLORS[d.dept] ?? '#D90429' })),
  [deptStats])

  const getEmployee = (id) => employees.find(e => e.id === id)

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 p-7 text-white">
        {/* Decoration circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-red-600/20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-red-500/10 blur-xl pointer-events-none" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-red-300 text-sm font-semibold uppercase tracking-widest mb-1">{formatDate(today)}</p>
            <h2 className="text-3xl font-extrabold leading-tight">
              Bonjour, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-gray-300 mt-1 text-sm">Vue complète du magasin · Direction</p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <Link to="/tv" target="_blank" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0">
              <Tv2 size={16} /> Mode TV
            </Link>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-white">{employees.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Employés</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-black text-red-300">{alerts.filter(a => a.priority === 'high').length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Alertes critiques</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-black text-green-300">{Math.round(weekHours)}h</p>
              <p className="text-xs text-gray-400 mt-0.5">Cette semaine</p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users} label="Shifts planifiés" value={todayShifts.length}
          sub="aujourd'hui"
          color="text-blue-600" bg="bg-blue-50/60" border="border-blue-100"
          trend={null}
        />
        <KpiCard
          icon={UserX} label="Absences acceptées" value={todayAbsences.length}
          sub="aujourd'hui"
          color={todayAbsences.length > 0 ? 'text-red-600' : 'text-green-600'}
          bg={todayAbsences.length > 0 ? 'bg-red-50/60' : 'bg-green-50/60'}
          border={todayAbsences.length > 0 ? 'border-red-100' : 'border-green-100'}
          trend={todayAbsences.length > 0 ? todayAbsences.length : null}
        />
        <KpiCard
          icon={Repeat2} label="Remplacements ouverts" value={openReplacements.length}
          sub="à pourvoir"
          color={openReplacements.length > 0 ? 'text-amber-600' : 'text-green-600'}
          bg={openReplacements.length > 0 ? 'bg-amber-50/60' : 'bg-green-50/60'}
          border={openReplacements.length > 0 ? 'border-amber-100' : 'border-green-100'}
          trend={openReplacements.length > 0 ? openReplacements.length : null}
        />
        <KpiCard
          icon={Clock} label="Heures semaine" value={`${Math.round(weekHours)}h`}
          sub="planifiées"
          color="text-purple-600" bg="bg-purple-50/60" border="border-purple-100"
          trend={null}
        />
      </div>

      {/* ── Coverage + Alerts ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Coverage ring */}
        <div className="card p-6 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h3 className="section-title">Taux de couverture</h3>
            <p className="text-xs text-gray-400 mt-0.5">Aujourd'hui</p>
          </div>
          <CoverageRing rate={coverageRate} />
          <div className="w-full grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 border border-green-100">
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">{todayShifts.length - todayAbsences.length}</p>
                <p className="text-xs text-gray-400">Présents</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
              <ShieldAlert size={14} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-900">{todayAbsences.length}</p>
                <p className="text-xs text-gray-400">Absents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-2 card p-5">
          <div className="section-header mb-4">
            <div>
              <h3 className="section-title">Alertes urgentes</h3>
              <p className="text-xs text-gray-400 mt-0.5">{alerts.length} active{alerts.length > 1 ? 's' : ''}</p>
            </div>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 size={20} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">Aucune alerte active</p>
                <p className="text-xs text-green-600">Le magasin fonctionne correctement</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 5).map(a => <AlertCard key={a.id} alert={a} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Bar chart */}
        <div className="lg:col-span-3 card p-5">
          <div className="section-header mb-1">
            <div>
              <h3 className="section-title">Heures planifiées par département</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
            </div>
          </div>
          {deptStats.length === 0 ? (
            <EmptyState icon={BarChart} title="Aucune donnée" description="Aucun shift planifié cette semaine" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptStats} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => v.split(' ')[0]} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [`${v}h`, 'Heures']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]} maxBarSize={40}>
                  {deptStats.map(d => (
                    <Cell key={d.dept} fill={d.shortage ? '#EF4444' : (DEPT_COLORS[d.dept] ?? '#D90429')} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 card p-5 flex flex-col">
          <div className="section-header mb-1">
            <div>
              <h3 className="section-title">Répartition des heures</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
            </div>
          </div>
          {pieData.length === 0 ? (
            <EmptyState icon={Users} title="Aucune donnée" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                  {pieData.map(d => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip formatter={v => [`${v}h`, 'Heures']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Dept status + Pending absences ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Dept status */}
        <div className="card p-5">
          <div className="section-header mb-4">
            <div>
              <h3 className="section-title">État des départements</h3>
              <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
            </div>
            <Link to="/departments" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
              Voir <ChevronRight size={12} />
            </Link>
          </div>
          {deptStats.length === 0 ? (
            <EmptyState icon={Building2} title="Aucune donnée" />
          ) : (
            <div className="space-y-2">
              {deptStats.map(({ dept, hours, count, shortage }) => (
                <div key={dept} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${shortage ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>
                  <div className="flex items-center gap-2.5">
                    {shortage && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                    <DepartmentBadge department={dept} size="xs" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{hours}h</p>
                      <p className="text-xs text-gray-400">{count} shift{count > 1 ? 's' : ''}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${shortage ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {shortage ? 'Alerte' : 'OK'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending absences */}
        <div className="card p-5">
          <div className="section-header mb-4">
            <div>
              <h3 className="section-title">Demandes en attente</h3>
              <p className="text-xs text-gray-400 mt-0.5">{pendingAbsences.length} à traiter</p>
            </div>
            <Link to="/absences" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          {pendingAbsences.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-800">Toutes les demandes ont été traitées</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingAbsences.slice(0, 5).map(abs => {
                const emp = getEmployee(abs.employeeId)
                return (
                  <div key={abs.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 gradient-red rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white font-extrabold text-sm">{emp?.name?.charAt(0) ?? '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{emp?.name ?? 'Inconnu'}</p>
                      <p className="text-xs text-gray-400">{abs.reason} · {formatDate(abs.date)}</p>
                    </div>
                    <StatusBadge status={abs.status} size="xs" />
                  </div>
                )
              })}
              {pendingAbsences.length > 5 && (
                <Link to="/absences" className="block text-center text-xs text-red-500 font-semibold py-2 hover:text-red-600">
                  +{pendingAbsences.length - 5} autres demandes →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Manager dashboard ─────────────────────────────────────────────────────── */
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

  const coverageRate = todayShifts.length > 0
    ? Math.round(((todayShifts.length - todayAbsences.length) / todayShifts.length) * 100)
    : 100

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 p-7 text-white">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-1">{formatDate(today)}</p>
            <h2 className="text-3xl font-extrabold leading-tight">Dashboard — {dept}</h2>
            <p className="text-gray-300 mt-1 text-sm">Vue de votre département</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-white">{employees.filter(e => e.department === dept).length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Membres</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-4xl font-black text-blue-300">{Math.round(weekHours)}h</p>
              <p className="text-xs text-gray-400 mt-0.5">Cette semaine</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users}   label="Shifts aujourd'hui"    value={todayShifts.length}   color="text-blue-600"   bg="bg-blue-50/60"   border="border-blue-100" />
        <KpiCard icon={UserX}   label="Absences"              value={todayAbsences.length} color={todayAbsences.length > 0 ? 'text-red-600' : 'text-green-600'} bg={todayAbsences.length > 0 ? 'bg-red-50/60' : 'bg-green-50/60'} border={todayAbsences.length > 0 ? 'border-red-100' : 'border-green-100'} trend={todayAbsences.length > 0 ? todayAbsences.length : null} />
        <KpiCard icon={Repeat2} label="Remplacements ouverts" value={openReps.length}      color={openReps.length > 0 ? 'text-amber-600' : 'text-green-600'} bg={openReps.length > 0 ? 'bg-amber-50/60' : 'bg-green-50/60'} border={openReps.length > 0 ? 'border-amber-100' : 'border-green-100'} trend={openReps.length > 0 ? openReps.length : null} />
        <KpiCard icon={Clock}   label="Heures semaine"        value={`${Math.round(weekHours)}h`} color="text-purple-600" bg="bg-purple-50/60" border="border-purple-100" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="section-header mb-3">
            <div>
              <h3 className="section-title">Taux de couverture</h3>
              <p className="text-xs text-gray-400">Aujourd'hui</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <CoverageRing rate={coverageRate} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <CheckCircle2 size={14} className="text-green-500" />
                <div>
                  <p className="text-sm font-bold">{todayShifts.length - todayAbsences.length}</p>
                  <p className="text-xs text-gray-400">Présents</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <ShieldAlert size={14} className="text-red-500" />
                <div>
                  <p className="text-sm font-bold">{todayAbsences.length}</p>
                  <p className="text-xs text-gray-400">Absents</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="section-header mb-3">
            <h3 className="section-title">Alertes — {dept}</h3>
          </div>
          {deptAlerts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-800">Votre département fonctionne correctement</p>
            </div>
          ) : (
            <div className="space-y-2">{deptAlerts.map(a => <AlertCard key={a.id} alert={a} />)}</div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="section-header mb-4">
          <div>
            <h3 className="section-title">Absences en attente</h3>
            <p className="text-xs text-gray-400">{pendingAbs.length} à traiter</p>
          </div>
          <Link to="/absences" className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
            Voir tout <ChevronRight size={12} />
          </Link>
        </div>
        {pendingAbs.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <p className="text-sm font-semibold text-green-800">Toutes les demandes ont été traitées</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingAbs.slice(0, 5).map(abs => {
              const emp = getEmployee(abs.employeeId)
              return (
                <div key={abs.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 gradient-red rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-white font-extrabold text-sm">{emp?.name?.charAt(0) ?? '?'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{emp?.name ?? 'Inconnu'}</p>
                    <p className="text-xs text-gray-400">{abs.reason} · {formatDate(abs.date)}</p>
                  </div>
                  <StatusBadge status={abs.status} size="xs" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Root ──────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth()
  const { employees, shifts, absences, replacements, alerts } = useApp()
  const today     = getTodayDate()
  const weekDates = useMemo(() => getWeekDates(new Date(today)), [today])

  const common = { user, employees, shifts, absences, replacements, alerts, weekDates, today }

  if (isDirector(user))        return <DirectorDashboard {...common} />
  if (isDepartmentManager(user)) return <ManagerDashboard {...common} />

  return null
}
