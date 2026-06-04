import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'red', trend, trendLabel }) {
  const colors = {
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    iconBg: 'bg-red-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  iconBg: 'bg-green-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  iconBg: 'bg-amber-100' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', iconBg: 'bg-purple-100' },
  }
  const c = colors[color] ?? colors.red

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl ${c.iconBg} flex items-center justify-center shrink-0`}>
          {Icon && <Icon size={20} className={c.icon} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">{value}</p>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trendLabel && <p className="text-xs text-gray-400 mt-0.5">{trendLabel}</p>}
      </div>
    </div>
  )
}
