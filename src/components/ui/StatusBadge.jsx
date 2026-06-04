import { getStatusClasses, getUrgencyClasses } from '../../utils/helpers'

export function StatusBadge({ status, size = 'sm' }) {
  const c = getStatusClasses(status)
  const sizes = { xs: 'text-xs px-2 py-0.5', sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1.5' }
  return (
    <span className={`inline-flex items-center font-semibold rounded-lg ${c.bg} ${c.text} ${sizes[size]}`}>
      {c.label}
    </span>
  )
}

export function UrgencyBadge({ urgency, size = 'sm' }) {
  const c = getUrgencyClasses(urgency)
  const sizes = { xs: 'text-xs px-2 py-0.5', sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1.5' }
  return (
    <span className={`inline-flex items-center font-semibold rounded-lg ${c.bg} ${c.text} ${sizes[size]}`}>
      {c.label}
    </span>
  )
}
