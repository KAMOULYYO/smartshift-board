import { useState, useRef } from 'react'
import { Plus, GripVertical } from 'lucide-react'
import ShiftCard from './ShiftCard'

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function WeeklyCalendar({ weekDates, shifts, employees, onAddShift, onEditShift, onDeleteShift, onMoveShift, canManage, today }) {
  const getEmployee = (id) => employees.find(e => e.id === id)

  const [draggingId, setDraggingId]   = useState(null)
  const [overDate, setOverDate]       = useState(null)
  const dragShiftRef                  = useRef(null)

  const handleDragStart = (e, shift) => {
    dragShiftRef.current = shift
    setDraggingId(shift.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', shift.id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setOverDate(null)
    dragShiftRef.current = null
  }

  const handleDragOver = (e, date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverDate(date)
  }

  const handleDragLeave = () => {
    setOverDate(null)
  }

  const handleDrop = (e, targetDate) => {
    e.preventDefault()
    const shift = dragShiftRef.current
    if (shift && shift.date !== targetDate && onMoveShift) {
      onMoveShift(shift, targetDate)
    }
    setDraggingId(null)
    setOverDate(null)
    dragShiftRef.current = null
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDates.map((date, i) => {
            const isToday = date === today
            return (
              <div key={date} className={"text-center p-2 rounded-xl " + (isToday ? 'gradient-red' : 'bg-white border border-gray-100')}>
                <p className={"text-xs font-semibold " + (isToday ? 'text-white/70' : 'text-gray-400')}>{DAY_NAMES[i]}</p>
                <p className={"text-base font-bold mt-0.5 " + (isToday ? 'text-white' : 'text-gray-900')}>
                  {new Date(date + 'T12:00:00').getDate()}
                </p>
                <p className={"text-xs mt-0.5 " + (isToday ? 'text-white/60' : 'text-gray-400')}>
                  {shifts.filter(s => s.date === date).length} shift{shifts.filter(s => s.date === date).length !== 1 ? 's' : ''}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dayShifts = shifts.filter(s => s.date === date)
            const isDragOver = overDate === date && draggingId !== null
            const isDraggingFromThisDay = dragShiftRef.current?.date === date

            return (
              <div
                key={date}
                onDragOver={canManage ? (e) => handleDragOver(e, date) : undefined}
                onDragLeave={canManage ? handleDragLeave : undefined}
                onDrop={canManage ? (e) => handleDrop(e, date) : undefined}
                className={"rounded-2xl border p-2 min-h-[200px] transition-all duration-150 " +
                  (isDragOver && !isDraggingFromThisDay
                    ? 'bg-red-50 border-red-300 border-2 shadow-md scale-[1.01]'
                    : 'bg-white border-gray-100')
                }
              >
                {isDragOver && !isDraggingFromThisDay && (
                  <div className="mb-2 text-center text-xs text-red-500 font-semibold py-1 bg-red-50 rounded-lg border border-red-200">
                    Deposer ici
                  </div>
                )}

                <div className="space-y-1.5">
                  {dayShifts.map(shift => {
                    const emp = getEmployee(shift.employeeId)
                    const isDraggingThis = draggingId === shift.id
                    return (
                      <div
                        key={shift.id}
                        draggable={canManage ? true : false}
                        onDragStart={canManage ? (e) => handleDragStart(e, shift) : undefined}
                        onDragEnd={canManage ? handleDragEnd : undefined}
                        className={"group/drag transition-all duration-150 " +
                          (canManage ? 'cursor-grab active:cursor-grabbing ' : '') +
                          (isDraggingThis ? 'opacity-40 scale-95' : '')
                        }
                      >
                        {canManage && (
                          <div className="flex items-center gap-1 mb-0.5 opacity-0 group-hover/drag:opacity-100 transition-opacity">
                            <GripVertical size={10} className="text-gray-300" />
                            <span className="text-[9px] text-gray-300 font-medium">Glisser</span>
                          </div>
                        )}
                        <ShiftCard
                          shift={shift}
                          employeeName={emp?.name ?? 'Inconnu'}
                          compact
                          onEdit={canManage ? () => onEditShift(shift) : null}
                          onDelete={canManage ? () => onDeleteShift(shift) : null}
                        />
                      </div>
                    )
                  })}
                  {dayShifts.length === 0 && !isDragOver && (
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

        {canManage && draggingId && (
          <p className="text-center text-xs text-gray-400 mt-3 animate-pulse">
            Glissez le shift vers un autre jour pour le deplacer
          </p>
        )}
      </div>
    </div>
  )
}
