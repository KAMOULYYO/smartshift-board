import { useMemo } from 'react'
import { Download, FileText, CheckCircle, AlertTriangle, Clock, Users, Repeat2, UserX } from 'lucide-react'
import AccessDenied from '../components/ui/AccessDenied'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { UrgencyBadge } from '../components/ui/StatusBadge'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { DEPARTMENTS, getTodayDate, getWeekDates, formatDate, calcShiftHours } from '../utils/helpers'
import { canViewReport } from '../utils/permissions'

export default function ReportPage() {
  const { user } = useAuth()
  const { employees, shifts, absences, replacements, alerts, getEmployee } = useApp()

  // Hard gate — only director
  if (!canViewReport(user)) {
    return (
      <AccessDenied message="Le rapport confidentiel est réservé à la direction. Si vous avez besoin d'informations sur votre département, contactez votre responsable." />
    )
  }

  const today     = getTodayDate()
  const weekDates = useMemo(() => getWeekDates(new Date(today)), [today])

  const report = useMemo(() => {
    const todayShifts       = shifts.filter(s => s.date === today)
    const todayAbsences     = absences.filter(a => a.date === today && a.status === 'accepted')
    const pendingAbsences   = absences.filter(a => a.status === 'pending')
    const openReplacements  = replacements.filter(r => r.status === 'open')
    const assignedReplacements = replacements.filter(r => r.status === 'assigned')
    const weekHours = shifts
      .filter(s => weekDates.includes(s.date))
      .reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)

    const deptSummary = DEPARTMENTS.map(dept => {
      const deptShifts  = todayShifts.filter(s => s.department === dept)
      const deptAbs     = todayAbsences.filter(a => a.department === dept)
      const deptReps    = openReplacements.filter(r => r.department === dept)
      const deptEmps    = employees.filter(e => e.department === dept)
      const shortage    = deptShifts.length < deptEmps.length * 0.5 && deptEmps.length > 0 && deptReps.length > 0
      return { dept, shifts: deptShifts.length, absences: deptAbs.length, openReps: deptReps.length, totalEmps: deptEmps.length, shortage }
    }).filter(d => d.totalEmps > 0)

    const coverageRate = todayShifts.length > 0
      ? Math.round(((todayShifts.length - todayAbsences.length) / todayShifts.length) * 100)
      : 100

    return { todayShifts, todayAbsences, pendingAbsences, openReplacements, assignedReplacements, weekHours, deptSummary, coverageRate }
  }, [shifts, absences, replacements, employees, today, weekDates])

  const handleExport = () => {
    const lines = [
      'RAPPORT JOURNALIER CONFIDENTIEL — SmartShift Board',
      `Date : ${formatDate(today)}`,
      `Généré le : ${new Date().toLocaleString('fr-FR')}`,
      `Généré par : ${user.name} (${user.role})`,
      '',
      '=== RÉSUMÉ EXÉCUTIF ===',
      `Shifts planifiés aujourd'hui : ${report.todayShifts.length}`,
      `Absences acceptées : ${report.todayAbsences.length}`,
      `Remplacements ouverts : ${report.openReplacements.length}`,
      `Remplacements assignés : ${report.assignedReplacements.length}`,
      `Demandes en attente : ${report.pendingAbsences.length}`,
      `Taux de couverture : ${report.coverageRate}%`,
      `Heures totales semaine : ${Math.round(report.weekHours)}h`,
      '',
      '=== PAR DÉPARTEMENT ===',
      ...report.deptSummary.map(d =>
        `${d.dept}: ${d.shifts} shift(s) · ${d.absences} absence(s) · ${d.openReps} remplacement(s) ouvert(s)${d.shortage ? ' [SOUS-EFFECTIF]' : ''}`
      ),
      '',
      '=== ALERTES ACTIVES ===',
      ...(alerts.length > 0
        ? alerts.map(a => `[${a.priority.toUpperCase()}] ${a.department}: ${a.message}`)
        : ['Aucune alerte active']),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `rapport-confidentiel-${today}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scoreColor = report.coverageRate >= 90 ? 'text-green-500' : report.coverageRate >= 70 ? 'text-amber-500' : 'text-red-500'
  const scoreRing  = report.coverageRate >= 90 ? 'border-green-400' : report.coverageRate >= 70 ? 'border-amber-400' : 'border-red-400'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="page-title">Rapport journalier</h2>
            <span className="badge bg-red-50 text-red-600 border border-red-200 text-xs">Confidentiel</span>
          </div>
          <p className="text-sm text-gray-400">{formatDate(today)} · Réservé à la direction</p>
        </div>
        <button onClick={handleExport} className="btn-primary text-sm">
          <Download size={16} /> Exporter .txt
        </button>
      </div>

      {/* Score */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className={`w-28 h-28 rounded-full border-8 ${scoreRing} flex items-center justify-center shrink-0`}>
            <div className="text-center">
              <p className={`text-3xl font-extrabold ${scoreColor}`}>{report.coverageRate}%</p>
              <p className="text-xs text-gray-400">couverture</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 flex-1">
            {[
              { icon: Users,   label: 'Shifts planifiés',      value: report.todayShifts.length,        color: 'text-blue-500' },
              { icon: UserX,   label: 'Absences',               value: report.todayAbsences.length,      color: report.todayAbsences.length > 0 ? 'text-red-500' : 'text-green-500' },
              { icon: Repeat2, label: 'Remplacements ouverts',  value: report.openReplacements.length,   color: report.openReplacements.length > 0 ? 'text-amber-500' : 'text-green-500' },
              { icon: Clock,   label: 'Heures semaine',         value: `${Math.round(report.weekHours)}h`, color: 'text-purple-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dept summary */}
        <div className="card p-5">
          <h3 className="section-title mb-4">État par département</h3>
          <div className="space-y-2">
            {report.deptSummary.map(d => (
              <div key={d.dept} className={`flex items-center justify-between p-3 rounded-xl ${d.shortage ? 'bg-red-50 border border-red-200' : d.absences > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  {d.shortage && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
                  <DepartmentBadge department={d.dept} size="xs" />
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div><p className="text-sm font-bold text-gray-900">{d.shifts}</p><p className="text-xs text-gray-400">shifts</p></div>
                  {d.absences > 0 && <div><p className="text-sm font-bold text-red-500">{d.absences}</p><p className="text-xs text-gray-400">absents</p></div>}
                  {d.openReps > 0 && <div><p className="text-sm font-bold text-amber-500">{d.openReps}</p><p className="text-xs text-gray-400">rempl.</p></div>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${d.shortage ? 'bg-red-100 text-red-600' : d.absences > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    {d.shortage ? 'Alerte' : d.absences > 0 ? 'Attention' : 'OK'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="section-title mb-3">Absences du jour</h3>
            {report.todayAbsences.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                <CheckCircle size={16} /> <p className="text-sm font-medium">Aucune absence enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {report.todayAbsences.map(abs => {
                  const emp = getEmployee(abs.employeeId)
                  return (
                    <div key={abs.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-xl border border-red-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp?.name ?? 'Inconnu'}</p>
                        <DepartmentBadge department={abs.department} size="xs" />
                      </div>
                      <UrgencyBadge urgency={abs.urgency} size="xs" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">Remplacements ouverts</h3>
            {report.openReplacements.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                <CheckCircle size={16} /> <p className="text-sm font-medium">Tous les remplacements sont couverts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {report.openReplacements.map(rep => {
                  const original = getEmployee(rep.originalEmployeeId)
                  return (
                    <div key={rep.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{original?.name ?? 'Inconnu'}</p>
                        <DepartmentBadge department={rep.department} size="xs" />
                      </div>
                      <p className="text-xs text-gray-500">{rep.startTime}–{rep.endTime}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Alertes actives</h3>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-3.5 rounded-xl ${a.priority === 'high' ? 'bg-red-50 border border-red-200' : a.priority === 'medium' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                <AlertTriangle size={15} className={a.priority === 'high' ? 'text-red-500' : a.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'} />
                <div>
                  <p className="text-xs font-bold text-gray-600">{a.department}</p>
                  <p className="text-sm text-gray-700">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <FileText size={15} className="text-gray-400 shrink-0" />
        <p className="text-xs text-gray-400">
          Ce rapport confidentiel est généré automatiquement et réservé à la direction. Ne pas transmettre à des tiers non autorisés.
        </p>
      </div>
    </div>
  )
}
