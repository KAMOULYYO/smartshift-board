import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'danger', onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onCancel])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-card-hover w-full max-w-md p-6 animate-slide-up">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
          <X size={20} />
        </button>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle size={22} className={variant === 'danger' ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={variant === 'danger' ? 'btn-danger text-sm px-4 py-2 bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600' : 'btn-primary text-sm px-4 py-2'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
