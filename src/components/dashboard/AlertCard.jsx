import { AlertTriangle, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatDate } from '../../utils/helpers'

const PRIORITY_CONFIG = {
  high:   { icon: AlertTriangle, bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-200',   badge: 'bg-red-100 text-red-600',   dot: 'bg-red-500' },
  medium: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  low:    { icon: Info,          bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-600',  dot: 'bg-blue-500' },
}

export default function AlertCard({ alert }) {
  const { dismissAlert } = useApp()
  const cfg = PRIORITY_CONFIG[alert.priority] ?? PRIORITY_CONFIG.low
  const Icon = cfg.icon

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-2xl border ${cfg.bg} ${cfg.border} group`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.badge}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold ${cfg.text}`}>{alert.department}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${cfg.badge}`}>
            {alert.priority === 'high' ? 'Urgent' : alert.priority === 'medium' ? 'Moyen' : 'Info'}
          </span>
        </div>
        <p className={`text-sm ${cfg.text} leading-snug`}>{alert.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(alert.date)}</p>
      </div>
      <button
        onClick={() => dismissAlert(alert.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 shrink-0"
        aria-label="Ignorer l'alerte"
      >
        <X size={14} />
      </button>
    </div>
  )
}
