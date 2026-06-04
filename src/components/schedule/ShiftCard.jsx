import { Clock, Edit2, Trash2 } from 'lucide-react'
import { getDepartmentColorClasses, getStatusClasses, calcShiftHours } from '../../utils/helpers'

export default function ShiftCard({ shift, employeeName, onEdit, onDelete, compact = false }) {
  const dept = getDepartmentColorClasses(shift.department)
  const status = getStatusClasses(shift.status)
  const hours = calcShiftHours(shift.startTime, shift.endTime)

  if (compact) {
    return (
      <div className={`rounded-xl p-2 border ${dept.bg} ${dept.border} group relative`}>
        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs font-semibold truncate ${dept.text}`}>{employeeName}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
            {onEdit && (
              <button onClick={onEdit} className="p-0.5 rounded hover:bg-white/60 transition-colors">
                <Edit2 size={10} className={dept.text} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-0.5 rounded hover:bg-red-100 transition-colors">
                <Trash2 size={10} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{shift.startTime}–{shift.endTime}</p>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${status.bg} ${status.text} mt-1 inline-block`}>
          {status.label}
        </span>
      </div>
    )
  }

  return (
    <div className={`card p-4 border-l-4 hover:shadow-card-hover transition-shadow duration-200 ${dept.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{employeeName}</p>
          <p className={`text-xs font-medium ${dept.text} mt-0.5`}>{shift.department}</p>
          <div className="flex items-center gap-1.5 mt-2 text-gray-500">
            <Clock size={13} />
            <span className="text-xs">{shift.startTime} – {shift.endTime}</span>
            <span className="text-xs text-gray-400">({hours}h)</span>
          </div>
          {shift.note && <p className="text-xs text-gray-400 mt-1 truncate">{shift.note}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <div className="flex gap-1">
            {onEdit && (
              <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
