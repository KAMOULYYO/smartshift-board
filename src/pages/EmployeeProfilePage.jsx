import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Building2, Shield, Calendar,
  Clock, UserX, TrendingUp, CheckCircle2, AlertTriangle, Edit2,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { StatusBadge } from '../components/ui/StatusBadge'
import { getRoleLabel, canManageEmployee } from '../utils/permissions'
import { formatDate, calcShiftHours, getTodayDate, getWeekDates } from '../utils/helpers'
import AccessDenied from '../components/ui/AccessDenied'

function StatBox({ icon: Icon, label, value, color = 'text-gray-900', bg = 'bg-gray-50' }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex flex-col gap-2`}>
      <Icon size={16} className="text-gray-400" />
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

export default function EmployeeProfilePage() {
  const { empId } = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { employees, shifts, absences } = useApp()

  const emp = employees.find(e => e.id === empId)

  if (!emp) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-gray-400 text-sm">Employé introuvable.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary text-sm"><ArrowLeft size={15} /> Retour</button>
    </div>
  )

  if (!canManageEmployee(user, emp) && user.id !== emp.id) {
    return <AccessDenied message="Vous n'avez pas accès à ce profil." />
  }

  const today = getTodayDate()
  const thisMonth = today.slice(0, 7)
  const weekDates = getWeekDates(new Date(today))

  const empShifts   = shifts.filter(s => s.employeeId === emp.id)
  const empAbsences = absences.filter(a => a.employeeId === emp.id)

  const monthShifts   = empShifts.filter(s => s.date.startsWith(thisMonth))
  const monthAbsences = empAbsences.filter(a => a.date.startsWith(thisMonth) && a.status === 'accepted')
  const weekShifts    = empShifts.filter(s => weekDates.includes(s.date))

  const monthHours = monthShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
  const totalHours = empShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)

  const presenceRate = empShifts.length > 0
    ? Math.round(((empShifts.length - empAbsences.filter(a => a.status === 'accepted').length) / empShifts.length) * 100)
    : 100

  const recentAbsences = [...empAbsences].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const upcomingShifts = empShifts.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)

  const canManage = canManageEmployee(user, emp)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-7">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-red-600/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 gradient-red rounded-2xl flex items-center justify-center shrink-0 shadow-red">
            <span className="text-white font-black text-3xl">{emp.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-white">{emp.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-bold bg-white/10 text-white px-2.5 py-1 rounded-lg">{getRoleLabel(emp.role)}</span>
              <DepartmentBadge department={emp.department} size="xs" />
            </div>
          </div>
          {canManage && (
            <Link to="/employees" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
              <Edit2 size={14} /> Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={Clock}       label="Heures ce mois"    value={`${Math.round(monthHours)}h`} color="text-blue-600"   bg="bg-blue-50" />
        <StatBox icon={Calendar}    label="Shifts ce mois"    value={monthShifts.length}             color="text-purple-600" bg="bg-purple-50" />
        <StatBox icon={UserX}       label="Absences ce mois"  value={monthAbsences.length}           color={monthAbsences.length > 0 ? 'text-red-600' : 'text-green-600'} bg={monthAbsences.length > 0 ? 'bg-red-50' : 'bg-green-50'} />
        <StatBox icon={TrendingUp}  label="Taux de présence"  value={`${presenceRate}%`}             color={presenceRate >= 90 ? 'text-green-600' : presenceRate >= 70 ? 'text-amber-600' : 'text-red-600'} bg={presenceRate >= 90 ? 'bg-green-50' : presenceRate >= 70 ? 'bg-amber-50' : 'bg-red-50'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Infos */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">Informations</h3>
          <div className="space-y-3">
            {[
              { icon: Mail,      label: 'Email',       value: emp.email },
              { icon: Phone,     label: 'Téléphone',   value: emp.phone || '—' },
              { icon: Building2, label: 'Département', value: emp.department },
              { icon: Shield,    label: 'Rôle',        value: getRoleLabel(emp.role) },
              { icon: Clock,     label: 'Total heures', value: `${Math.round(totalHours)}h planifiées` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Icon size={15} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate ml-2">{value}</p>
                </div>
              </div>
            ))}
            {emp.note && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs text-amber-600 font-semibold mb-0.5">Note</p>
                <p className="text-sm text-gray-700">{emp.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prochains shifts */}
        <div className="card p-5 space-y-4">
          <h3 className="section-title">Prochains shifts</h3>
          {upcomingShifts.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <Calendar size={18} className="text-gray-300" />
              <p className="text-sm text-gray-400">Aucun shift à venir</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingShifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatDate(shift.date)}</p>
                    <p className="text-xs text-gray-400">{shift.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-500">{shift.startTime} – {shift.endTime}</p>
                    <p className="text-xs text-gray-400">{calcShiftHours(shift.startTime, shift.endTime)}h</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Absences récentes */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Absences récentes</h3>
        {recentAbsences.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <CheckCircle2 size={18} className="text-green-500 shrink-0" />
            <p className="text-sm font-semibold text-green-800">Aucune absence enregistrée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAbsences.map(abs => (
              <div key={abs.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={14} className={abs.urgency === 'high' ? 'text-red-500' : 'text-amber-500'} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(abs.date)}</p>
                    <p className="text-xs text-gray-400">{abs.reason}</p>
                  </div>
                </div>
                <StatusBadge status={abs.status} size="xs" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
