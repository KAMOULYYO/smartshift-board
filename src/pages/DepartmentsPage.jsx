import { useMemo } from 'react'
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { useApp } from '../context/AppContext'
import { DEPARTMENTS, getTodayDate, getWeekDates, calcShiftHours, formatDate } from '../utils/helpers'

export default function DepartmentsPage() {
  const { employees, shifts, absences, replacements } = useApp()
  const today = getTodayDate()
  const weekDates = useMemo(() => getWeekDates(new Date(today)), [today])

  const deptData = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const deptEmps = employees.filter(e => e.department === dept)
      const weekShifts = shifts.filter(s => weekDates.includes(s.date) && s.department === dept)
      const todayShifts = shifts.filter(s => s.date === today && s.department === dept)
      const weekHours = weekShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
      const weekAbsences = absences.filter(a => weekDates.includes(a.date) && a.department === dept && a.status === 'accepted')
      const openReps = replacements.filter(r => r.department === dept && r.status === 'open')
      const shortage = deptEmps.length > 0 && (openReps.length > 0 || weekAbsences.length >= Math.max(1, deptEmps.length * 0.4))

      const statusByDay = weekDates.map(date => {
        const dayShifts = shifts.filter(s => s.date === date && s.department === dept)
        const dayAbsences = absences.filter(a => a.date === date && a.department === dept && a.status === 'accepted')
        return { date, count: dayShifts.length, absences: dayAbsences.length }
      })

      return { dept, deptEmps, weekShifts, todayShifts, weekHours, weekAbsences, openReps, shortage, statusByDay }
    })
  }, [employees, shifts, absences, replacements, today, weekDates])

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="page-title">Départements</h2>
        <p className="text-sm text-gray-400 mt-0.5">{DEPARTMENTS.length} départements · semaine du {formatDate(weekDates[0])}</p>
      </div>

      <div className="grid gap-5">
        {deptData.map(({ dept, deptEmps, weekShifts, todayShifts, weekHours, weekAbsences, openReps, shortage, statusByDay }) => (
          <div key={dept} className={`card p-5 border-l-4 ${shortage ? 'border-l-red-500' : 'border-l-green-400'}`}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <DepartmentBadge department={dept} size="md" />
                {shortage && (
                  <span className="badge bg-red-50 text-red-600 border border-red-200 text-xs">
                    <AlertTriangle size={12} /> Sous-effectif
                  </span>
                )}
                {!shortage && openReps.length === 0 && (
                  <span className="badge bg-green-50 text-green-600 border border-green-200 text-xs">
                    Effectif OK
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xl font-extrabold text-gray-900">{deptEmps.length}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Users size={10} /> Employés</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900">{todayShifts.length}</p>
                  <p className="text-xs text-gray-400">Présents</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900">{Math.round(weekHours)}h</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} /> Semaine</p>
                </div>
                {weekAbsences.length > 0 && (
                  <div>
                    <p className="text-xl font-extrabold text-red-500">{weekAbsences.length}</p>
                    <p className="text-xs text-gray-400">Absences</p>
                  </div>
                )}
                {openReps.length > 0 && (
                  <div>
                    <p className="text-xl font-extrabold text-amber-500">{openReps.length}</p>
                    <p className="text-xs text-gray-400">Rempl.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly view */}
            <div className="grid grid-cols-7 gap-1.5">
              {statusByDay.map(({ date, count, absences: abs }, i) => {
                const isToday = date === today
                const hasIssue = abs > 0
                return (
                  <div key={date} className={`rounded-xl p-2 text-center text-xs ${isToday ? 'gradient-red text-white' : hasIssue ? 'bg-red-50 border border-red-200' : count > 0 ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
                    <p className={`font-semibold ${isToday ? 'text-white/70' : 'text-gray-400'}`}>{DAY_NAMES[i]}</p>
                    <p className={`font-extrabold text-base mt-0.5 ${isToday ? 'text-white' : hasIssue ? 'text-red-600' : count > 0 ? 'text-green-700' : 'text-gray-300'}`}>{count}</p>
                    {abs > 0 && <p className={`text-red-500 font-semibold ${isToday ? 'text-red-200' : ''}`}>-{abs}</p>}
                  </div>
                )
              })}
            </div>

            {/* Employees list */}
            {deptEmps.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Équipe</p>
                <div className="flex flex-wrap gap-2">
                  {deptEmps.map(emp => (
                    <div key={emp.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="w-5 h-5 gradient-red rounded-md flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{emp.name.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{emp.name.split(' ')[0]}</span>
                      <span className="text-xs text-gray-400 capitalize">{emp.role === 'employe' ? '' : `· ${emp.role}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
