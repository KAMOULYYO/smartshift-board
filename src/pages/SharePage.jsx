/**
 * Page publique de partage du planning — aucune auth requise.
 * URL : /share?week=YYYY-MM-DD&dept=Caisse
 */
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ShoppingCart, Calendar, Clock, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import api from '../api/axios'
import { getWeekDates, formatDate, calcShiftHours } from '../utils/helpers'
import DepartmentBadge from '../components/ui/DepartmentBadge'

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const DEPT_COLORS = {
  'Caisse':            'bg-blue-50 border-blue-200 text-blue-700',
  'Fruits et légumes': 'bg-green-50 border-green-200 text-green-700',
  'Viande':            'bg-red-50 border-red-200 text-red-700',
  'Boulangerie':       'bg-amber-50 border-amber-200 text-amber-700',
  'Épicerie':          'bg-purple-50 border-purple-200 text-purple-700',
  'Produits laitiers': 'bg-cyan-50 border-cyan-200 text-cyan-700',
  'Réception':         'bg-indigo-50 border-indigo-200 text-indigo-700',
  'Administration':    'bg-gray-50 border-gray-200 text-gray-700',
}

function deptClass(dept) {
  return DEPT_COLORS[dept] ?? 'bg-red-50 border-red-200 text-red-700'
}

export default function SharePage() {
  const [params, setParams] = useSearchParams()
  const [shifts, setShifts]       = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const weekParam = params.get('week')
  const deptParam = params.get('dept') ?? ''

  // Resolve weekRef : default to current Monday
  const weekRef = useMemo(() => {
    if (weekParam) return new Date(weekParam + 'T00:00:00')
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d
  }, [weekParam])

  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef])

  function navigate(delta) {
    const d = new Date(weekRef)
    d.setDate(d.getDate() + delta * 7)
    setParams({ week: d.toISOString().slice(0, 10), ...(deptParam ? { dept: deptParam } : {}) })
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/shifts').catch(() => ({ data: [] })),
      api.get('/employees').catch(() => ({ data: [] })),
    ]).then(([s, e]) => {
      setShifts(s.data)
      setEmployees(e.data)
    }).catch(() => setError('Impossible de charger le planning.'))
      .finally(() => setLoading(false))
  }, [])

  const weekShifts = useMemo(() =>
    shifts.filter(s => {
      const inWeek = weekDates.includes(s.date)
      const deptOk = !deptParam || s.department === deptParam
      return inWeek && deptOk
    }),
  [shifts, weekDates, deptParam])

  const shiftsByDate = useMemo(() => {
    const map = {}
    weekDates.forEach(d => { map[d] = [] })
    weekShifts.forEach(s => { if (map[s.date]) map[s.date].push(s) })
    return map
  }, [weekShifts, weekDates])

  const totalHours = weekShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime ?? s.start_time, s.endTime ?? s.end_time), 0)
  const getEmp = (id) => employees.find(e => e.id === id)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-red rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">SmartShift Board</p>
              <p className="text-xs text-gray-400">Planning partagé · Lecture seule</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
            <Lock size={12} />
            Lecture seule
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Week nav */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-red-500" />
              Planning de la semaine
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
              {deptParam && ` · ${deptParam}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigate(0)} className="btn-ghost text-sm px-3 py-1.5 border border-gray-200">
              Cette semaine
            </button>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Shifts', value: weekShifts.length, color: 'text-blue-600' },
            { label: 'Employés', value: new Set(weekShifts.map(s => s.employee_id ?? s.employeeId)).size, color: 'text-purple-600' },
            { label: 'Heures', value: `${Math.round(totalHours)}h`, color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Planning grid */}
        {loading ? (
          <div className="card p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Chargement du planning…</p>
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Vous devez être connecté pour voir ce planning.</p>
            <Link to="/login" className="btn-primary text-sm mt-4 inline-flex">Se connecter</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
            {weekDates.map(date => {
              const d = new Date(date + 'T00:00:00')
              const dayShifts = (shiftsByDate[date] ?? []).sort((a, b) =>
                (a.start_time ?? a.startTime).localeCompare(b.start_time ?? b.startTime)
              )
              const isToday = date === today

              return (
                <div key={date} className={`card overflow-hidden ${isToday ? 'ring-2 ring-red-400' : ''}`}>
                  {/* Day header */}
                  <div className={`px-3 py-2 text-center ${isToday ? 'gradient-red' : 'bg-gray-900'}`}>
                    <p className="text-xs font-bold text-white">{DAY_FR[d.getDay()]}</p>
                    <p className={`text-lg font-extrabold leading-none ${isToday ? 'text-white' : 'text-white'}`}>
                      {String(d.getDate()).padStart(2, '0')}
                    </p>
                  </div>

                  {/* Shifts */}
                  <div className="p-2 space-y-1.5 min-h-[60px]">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-gray-300 text-center py-3">—</p>
                    ) : (
                      dayShifts.map(shift => {
                        const emp = getEmp(shift.employee_id ?? shift.employeeId)
                        const cls = deptClass(shift.department)
                        const start = shift.start_time ?? shift.startTime
                        const end   = shift.end_time ?? shift.endTime
                        return (
                          <div key={shift.id} className={`rounded-lg border px-2 py-1.5 ${cls}`}>
                            <p className="text-xs font-bold truncate leading-tight">{emp?.name ?? 'Employé'}</p>
                            <p className="text-[10px] opacity-70 flex items-center gap-0.5 mt-0.5">
                              <Clock size={9} />{start}–{end}
                            </p>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 pt-4">
          Planning généré par SmartShift Board · Lecture seule ·{' '}
          <Link to="/login" className="text-red-400 hover:text-red-500">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
