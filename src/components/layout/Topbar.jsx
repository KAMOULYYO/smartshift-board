import { Menu, Bell, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatDate, getTodayDate } from '../../utils/helpers'
import { useState } from 'react'

export default function Topbar({ onMenuToggle, title }) {
  const { alerts } = useApp()
  const [showAlerts, setShowAlerts] = useState(false)
  const unread = alerts.filter(a => a.priority === 'high').length

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-4 shrink-0 sticky top-0 z-10">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <h1 className="text-base font-bold text-gray-900 hidden sm:block">{title}</h1>
        <p className="text-xs text-gray-400 hidden sm:block">{formatDate(getTodayDate())}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowAlerts(v => !v)}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Alertes"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        {showAlerts && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowAlerts(false)} />
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card-hover border border-gray-100 z-20 overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-gray-100">
                <p className="font-bold text-sm text-gray-900">Alertes urgentes</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Aucune alerte</p>
                ) : (
                  alerts.slice(0, 8).map(a => (
                    <div key={a.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.priority === 'high' ? 'bg-red-500' : a.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{a.department}</p>
                          <p className="text-xs text-gray-500 leading-snug mt-0.5">{a.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
