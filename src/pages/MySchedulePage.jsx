import { useState, useMemo, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, Clock, LogIn, LogOut, Bell } from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import ShiftCard from '../components/schedule/ShiftCard'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getWeekDates, getTodayDate, formatDate, calcShiftHours } from '../utils/helpers'
import { getPlanningStatus, confirmPlanning, checkinShift } from '../api/planningApi'

export default function MySchedulePage() {
  const { user } = useAuth()
  const { shifts } = useApp()
  const { toast } = useToast()
  const today = getTodayDate()

  const [weekRef, setWeekRef]     = useState(new Date(today))
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef])
  const weekStart = weekDates[0]

  const [status, setStatus]       = useState(null)   // planning status
  const [confirming, setConfirming] = useState(false)
  const [checkinLoading, setCheckinLoading] = useState({})

  const myShifts = useMemo(() =>
    shifts.filter(s => s.employeeId === user?.id && weekDates.includes(s.date)),
  [shifts, user, weekDates])

  const totalHours = useMemo(() =>
    myShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0),
  [myShifts])

  const todayShifts = myShifts.filter(s => s.date === today)

  // Charger statut planning
  const loadStatus = useCallback(async () => {
    try {
      const res = await getPlanningStatus(weekStart)
      setStatus(res.data)
    } catch { setStatus(null) }
  }, [weekStart])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmPlanning(weekStart)
      toast.success('Planning confirmé ✅ Votre responsable a été notifié')
      await loadStatus()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Erreur lors de la confirmation')
    } finally { setConfirming(false) }
  }

  const handleCheckin = async (shift, action) => {
    setCheckinLoading(p => ({ ...p, [shift.id + action]: true }))
    try {
      await checkinShift(shift.id, action)
      toast.success(action === 'checkin' ? '✅ Arrivée pointée !' : '👋 Départ enregistré !')
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Erreur de pointage')
    } finally {
      setCheckinLoading(p => ({ ...p, [shift.id + action]: false }))
    }
  }

  const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">Mon horaire</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatDate(weekDates[0])} – {formatDate(weekDates[6])} · {Math.round(totalHours)}h planifiées
          </p>
        </div>
      </div>

      {/* Bannière signature */}
      {status?.published && !status?.my_confirmed && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between gap-4">
          <div className="absolute inset-0 bg-white/5" />
          <div className="relative flex items-center gap-3">
            <Bell size={20} className="text-white shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Planning publié !</p>
              <p className="text-xs text-blue-100">Votre responsable a publié le planning de cette semaine. Confirmez que vous l'avez vu.</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="relative shrink-0 bg-white text-blue-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {confirming ? 'Envoi…' : '✅ Je confirme'}
          </button>
        </div>
      )}

      {status?.my_confirmed && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Planning confirmé ✓</p>
            <p className="text-xs text-green-600">Votre responsable sait que vous avez vu votre planning.</p>
          </div>
        </div>
      )}

      {/* Pointage du jour */}
      {todayShifts.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-red-500" />
            <p className="text-sm font-bold text-gray-900">Pointage — Aujourd'hui</p>
          </div>
          <div className="space-y-2">
            {todayShifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">{shift.startTime} – {shift.endTime}</p>
                  <p className="text-xs text-gray-400">{shift.department}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckin(shift, 'checkin')}
                    disabled={checkinLoading[shift.id + 'checkin']}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <LogIn size={13} /> Arrivée
                  </button>
                  <button
                    onClick={() => handleCheckin(shift, 'checkout')}
                    disabled={checkinLoading[shift.id + 'checkout']}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <LogOut size={13} /> Départ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week nav */}
      <div className="card p-3 flex items-center gap-3">
        <button onClick={() => setWeekRef(d => subDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronLeft size={18} /></button>
        <button onClick={() => setWeekRef(new Date(today))} className="btn-ghost text-sm px-3 py-1.5">Cette semaine</button>
        <button onClick={() => setWeekRef(d => addDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronRight size={18} /></button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayShifts = myShifts.filter(s => s.date === date)
          const isToday   = date === today
          return (
            <div key={date} className={`rounded-2xl p-3 text-center ${isToday ? 'gradient-red text-white' : dayShifts.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-white border border-gray-100'}`}>
              <p className={`text-xs font-semibold ${isToday ? 'text-white/70' : 'text-gray-400'}`}>{DAY_NAMES[i]}</p>
              <p className={`text-lg font-extrabold mt-0.5 ${isToday ? 'text-white' : dayShifts.length > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                {dayShifts.length > 0 ? dayShifts.length : '—'}
              </p>
              {dayShifts.length > 0 && (
                <p className={`text-xs mt-0.5 ${isToday ? 'text-white/60' : 'text-gray-400'}`}>
                  {dayShifts.map(s => s.startTime).join(', ')}
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
