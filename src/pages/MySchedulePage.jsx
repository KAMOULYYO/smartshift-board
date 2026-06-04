import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import ShiftCard from '../components/schedule/ShiftCard'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getWeekDates, getTodayDate, formatDate, calcShiftHours } from '../utils/helpers'

export default function MySchedulePage() {
  const { user } = useAuth()
  const { shifts } = useApp()
  const today = getTodayDate()

  const [weekRef, setWeekRef] = useState(new Date(today))
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef])

  const myShifts = useMemo(() =>
    shifts.filter(s => s.employeeId === user?.id && weekDates.includes(s.date)),
  [shifts, user, weekDates])

  const totalHours = useMemo(() =>
    myShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0),
  [myShifts])

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Mon horaire</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(weekDates[0])} – {formatDate(weekDates[6])} · {Math.round(totalHours)}h planifiées
          </p>
        </div>
      </div>

      {/* Week nav */}
      <div className="card p-3 flex items-center gap-3">
        <button onClick={() => setWeekRef(d => subDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronLeft size={18} /></button>
        <button onClick={() => setWeekRef(new Date(today))} className="btn-ghost text-sm px-3 py-1.5">Cette semaine</button>
        <button onClick={() => setWeekRef(d => addDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronRight size={18} /></button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayShifts = myShifts.filter(s => s.date === date)
          const isToday   = date === today
          return (
            <div key={date} className={`rounded-2xl p-3 text-center ${isToday ? 'gradient-red text-white' : dayShifts.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-white border border-gray-100'}`}>
              <p className={`text-xs font-semibold ${isToday ? 'text-white/70' : 'text-gray-400'}`}>{DAY_NAMES[i]}</p>
              <p className={`text-lg font-extrabold mt-0.5 ${isToday ? 'text-white' : dayShifts.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                {dayShifts.length > 0 ? `${dayShifts.length}` : '—'}
              </p>
              {dayShifts.length > 0 && (
                <p className={`text-xs mt-0.5 ${isToday ? 'text-white/60' : 'text-gray-400'}`}>
                  {dayShifts.map(s => `${s.startTime}`).join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Shift cards */}
      {myShifts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Calendar}
            title="Aucun shift cette semaine"
            description="Vous n'avez pas de shifts planifiés pour cette semaine. Naviguez vers une autre semaine ou contactez votre responsable."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {weekDates.map(date => {
            const dayShifts = myShifts.filter(s => s.date === date)
            if (dayShifts.length === 0) return null
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${date === today ? 'bg-red-500' : 'bg-gray-300'}`} />
                  <p className="text-sm font-bold text-gray-700 capitalize">{formatDate(date)}</p>
                  {date === today && <span className="text-xs bg-red-50 text-red-500 font-semibold px-2 py-0.5 rounded-lg">Aujourd'hui</span>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dayShifts.map(shift => (
                    <ShiftCard key={shift.id} shift={shift} employeeName="Moi" />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
