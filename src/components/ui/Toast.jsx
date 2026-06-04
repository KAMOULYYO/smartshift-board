import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const CONFIG = {
  success: { icon: CheckCircle, bg: 'bg-white border-green-200', icon_color: 'text-green-500', bar: 'bg-green-500' },
  error:   { icon: XCircle,      bg: 'bg-white border-red-200',   icon_color: 'text-red-500',   bar: 'bg-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-white border-amber-200', icon_color: 'text-amber-500', bar: 'bg-amber-500' },
  info:    { icon: Info,          bg: 'bg-white border-blue-200',  icon_color: 'text-blue-500',  bar: 'bg-blue-500' },
}

function ToastItem({ toast, onRemove }) {
  const cfg = CONFIG[toast.type] ?? CONFIG.info
  const Icon = cfg.icon
  return (
    <div className={`flex items-start gap-3 w-80 rounded-2xl border shadow-card-hover p-4 relative overflow-hidden ${cfg.bg} toast-enter`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.bar}`} />
      <Icon size={18} className={`mt-0.5 shrink-0 ${cfg.icon_color}`} />
      <p className="text-sm text-gray-800 font-medium flex-1 leading-snug">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto animate-slide-up">
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
