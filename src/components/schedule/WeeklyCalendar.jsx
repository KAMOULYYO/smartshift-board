import { Plus } from 'lucide-react'
import { formatDateShort, formatDayName, DAYS_OF_WEEK } from '../../utils/helpers'
import ShiftCard from './ShiftCard'

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function WeeklyCalendar({ weekDates, shifts, employees, onAddShift, onEditShift, onDeleteShift, canManage, today }) {
  const getEmployee = (id) => employees.find(e => e.id === id)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDates.map((date, i) => {
            const isToday = date === today
            return (
              <div key={date} className={`text-center p-2 rounded-xl ${isToday ? 'gradient-red' : 'bg-white border border-gray-100'}`}>
                <p className={`text-xs font-semibold ${isToday ? 'text-white/70' : 'text-gray-400'}`}>{DAY_NAMES[i]}</p>
                <p className={`text-base font-bold mt-0.5 ${isToday ? 'text-white' : 'text-gray-900'}`}>{formatDateShort(date)}</p>
                <p className={`text-xs mt-0.5 ${isToday ? 'text-white/60' : 'text-gray-400'}`}>
                  {shifts.filter(s => s.date === date).length} shift{shifts.filter(s => s.date === date).length !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dayShifts = shifts.filter(s => s.date === date)
            return (
              <div key={date} className="bg-white rounded-2xl border border-gray-100 p-2 min-h-[200px]">
                <div className="space-y-1.5">
                  {dayShifts.map(shift => {
                    const emp = getEmployee(shift.employeeId)
                    return (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        employeeName={emp?.name ?? 'Inconnu'}
                        compact
                        onEdit={canManage ? () => onEditShift(shift) : null}
                        onDelete={canManage ? () => onDeleteShift(shift) : null}
                      />
                    )
                  })}
                  {dayShifts.length === 0 && (
                    <p className="text-xs text-gray-300 text-center py-4">Aucun shift</p>
                  )}
                </div>
                {canManage && (
                  <button
                    onClick={() => onAddShift(date)}
                    className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors border border-dashed border-gray-200 hover:border-red-300"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
