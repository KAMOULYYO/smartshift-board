/**
 * Mode TV — Page plein écran pour affichage mural.
 * Accessible via /tv — se rafraîchit toutes les 60s.
 * Aucune sidebar, aucun header — conçu pour grand écran.
 */
import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Users, UserX, Repeat2, AlertTriangle, Clock, CheckCircle2, Wifi } from 'lucide-react'
import api from '../api/axios'
import { getPresence } from '../api/planningApi'
import { getTodayDate, formatDate, DEPARTMENTS } from '../utils/helpers'

const DEPT_COLORS = {
  'Caisse':            'bg-blue-500',
  'Fruits et légumes': 'bg-green-500',
  'Viande':            'bg-red-400',
  'Boulangerie':        'bg-amber-500',
  'Épicerie':          'bg-purple-500',
  'Produits laitiers': 'bg-cyan-500',
  'Réception':         'bg-indigo-500',
  'Administration':    'bg-gray-500',
}

function useAutoRefresh(fn, ms = 60000) {
  useEffect(() => {
    fn()
    const t = setInterval(fn, ms)
    return () => clearInterval(t)
  }, [])
}

function Clock24() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <p className="text-5xl font-black text-white tabular-nums leading-none">
        {time.getHours().toString().padStart(2, '0')}
        <span className="animate-pulse">:</span>
        {time.getMinutes().toString().padStart(2, '0')}
      </p>
      <p className="text-sm text-gray-400 mt-1">{formatDate(getTodayDate())}</p>
    </div>
  )
}

export default function TvDashboardPage() {
  const today = getTodayDate()
  const [data, setData] = useState({ shifts: [], absences: [], replacements: [], employees: [], alerts: [] })
  const [presence, setPresence] = useState([])
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [online, setOnline] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, a, r, e, p] = await Promise.all([
        api.get('/shifts').catch(() => ({ data: [] })),
        api.get('/absences').catch(() => ({ data: [] })),
        api.get('/replacements').catch(() => ({ data: [] })),
        api.get('/employees').catch(() => ({ data: [] })),
        getPresence(today).catch(() => ({ data: [] })),
      ])
      const todayShifts    = s.data.filter(x => x.date === today)
      const todayAbsences  = a.data.filter(x => x.date === today && x.status === 'accepted')
      const openReps       = r.data.filter(x => x.status === 'open')
      const highAlerts     = a.data.filter(x => x.status === 'pending' && x.urgency === 'high')

      setData({ shifts: todayShifts, absences: todayAbsences, replacements: openReps, employees: e.data, alerts: highAlerts })
      setPresence(p.data)
      setLastRefresh(new Date())
      setOnline(true)
    } catch {
      setOnline(false)
    }
  }, [today])

  useAutoRefresh(load, 60000)

  const { shifts, absences, replacements, employees, alerts } = data
  const presentNow = presence.filter(p => p.present).length
  const totalShifts = shifts.length
  const coverageRate = totalShifts > 0 ? Math.round(((totalShifts - absences.length) / totalShifts) * 100) : 100

  // Shifts par département
  const deptShifts = DEPARTMENTS.map(dept => ({
    dept,
    shifts: shifts.filter(s => s.department === dept),
    present: presence.filter(p => p.department === dept && p.present).length,
  })).filter(d => d.shifts.length > 0)

  const getEmp = id => employees.find(e => e.id === id)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col gap-6 select-none">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 gradient-red rounded-2xl flex items-center justify-center shadow-red">
            <ShoppingCart size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">SmartShift Board</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <p className="text-xs text-gray-400">
                {online ? `Mis à jour à ${lastRefresh.getHours()}:${lastRefresh.getMinutes().toString().padStart(2,'0')}` : 'Hors ligne'}
              </p>
            </div>
          </div>
        </div>
        <Clock24 />
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users,        label: 'Shifts planifiés',  value: totalShifts,         color: 'text-blue-400',   bg: 'bg-blue-950/60 border-blue-800' },
          { icon: CheckCircle2, label: 'Présents maintenant', value: presentNow,         color: 'text-green-400',  bg: 'bg-green-950/60 border-green-800' },
          { icon: UserX,        label: 'Absences du jour',  value: absences.length,      color: absences.length > 0 ? 'text-red-400' : 'text-green-400', bg: absences.length > 0 ? 'bg-red-950/60 border-red-800' : 'bg-green-950/60 border-green-800' },
          { icon: Repeat2,      label: 'Remplacements ouverts', value: replacements.length, color: replacements.length > 0 ? 'text-amber-400' : 'text-green-400', bg: replacements.length > 0 ? 'bg-amber-950/60 border-amber-800' : 'bg-green-950/60 border-green-800' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl border p-5 flex items-center gap-4 ${k.bg}`}>
            <k.icon size={28} className={k.color} />
            <div>
              <p className="text-4xl font-black text-white">{k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">

        {/* Présents par département */}
        <div className="col-span-2 bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Planning du jour</h2>
            <div className={`text-sm font-bold px-3 py-1 rounded-xl ${coverageRate >= 90 ? 'bg-green-900 text-green-300' : coverageRate >= 70 ? 'bg-amber-900 text-amber-300' : 'bg-red-900 text-red-300'}`}>
              Couverture {coverageRate}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1">
            {deptShifts.map(({ dept, shifts: ds, present }) => (
              <div key={dept} className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${DEPT_COLORS[dept] ?? 'bg-red-500'}`} />
                    <p className="text-sm font-bold text-white truncate">{dept}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-950 px-2 py-0.5 rounded-lg">
                    {present}/{ds.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {ds.slice(0, 4).map(shift => {
                    const emp = getEmp(shift.employee_id ?? shift.employeeId)
                    const isPresent = presence.find(p => p.shift_id === shift.id && p.present)
                    return (
                      <div key={shift.id} className="flex items-center justify-between">
                        <p className="text-xs text-gray-300 truncate flex-1">{emp?.name ?? 'Employé'}</p>
                        <div className="flex items-center gap-1 ml-2">
                          <p className="text-xs text-gray-500">{shift.start_time ?? shift.startTime}–{shift.end_time ?? shift.endTime}</p>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-green-400' : 'bg-gray-600'}`} />
                        </div>
                      </div>
                    )
                  })}
                  {ds.length > 4 && <p className="text-xs text-gray-500">+{ds.length - 4} autres</p>}
                </div>
              </div>
            ))}
            {deptShifts.length === 0 && (
              <div className="col-span-2 flex items-center justify-center py-12">
                <p className="text-gray-500 text-sm">Aucun shift planifié aujourd'hui</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertes + infos */}
        <div className="flex flex-col gap-4">

          {/* Alertes */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-400" />
              <h2 className="text-lg font-bold text-white">Alertes</h2>
              {alerts.length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{alerts.length}</span>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <CheckCircle2 size={32} className="text-green-400" />
                <p className="text-sm text-green-400 font-semibold">Aucune alerte</p>
                <p className="text-xs text-gray-500">Tout fonctionne</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-red-950/60 border border-red-800 rounded-xl">
                    <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-300">{a.department}</p>
                      <p className="text-xs text-gray-400 leading-snug">{a.reason ?? 'Absence urgente en attente'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer refresh */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex items-center gap-3">
            <Wifi size={16} className={online ? 'text-green-400' : 'text-red-400'} />
            <div>
              <p className="text-xs font-semibold text-gray-300">Actualisation automatique</p>
              <p className="text-xs text-gray-500">Toutes les 60 secondes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
