import { getDepartmentColorClasses } from '../../utils/helpers'

export default function DepartmentBadge({ department, size = 'sm' }) {
  const c = getDepartmentColorClasses(department)
  const sizes = { xs: 'text-xs px-2 py-0.5', sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1.5' }
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-lg border ${c.bg} ${c.text} ${c.border} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
      {department}
    </span>
  )
}
