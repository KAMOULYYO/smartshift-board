/* Composant Skeleton — effet shimmer pendant le chargement */

function SkeletonBase({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  )
}

/* Carte stat skeleton */
export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBase className="w-11 h-11 rounded-xl" />
        <SkeletonBase className="w-12 h-5 rounded-lg" />
      </div>
      <SkeletonBase className="w-16 h-8 rounded-lg" />
      <SkeletonBase className="w-24 h-3 rounded" />
    </div>
  )
}

/* Ligne de tableau skeleton */
export function TableRowSkeleton({ cols = 4 }) {
  const widths = ['w-32', 'w-24', 'w-20', 'w-16', 'w-28']
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
      <SkeletonBase className="w-9 h-9 rounded-xl shrink-0" />
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBase key={i} className={`h-3.5 rounded ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

/* Carte employé skeleton */
export function EmployeeCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBase className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-3/4 rounded" />
          <SkeletonBase className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <SkeletonBase className="h-3 w-full rounded" />
      <SkeletonBase className="h-3 w-2/3 rounded" />
    </div>
  )
}

/* Page skeleton générique — hero + 4 stats + 2 cards */
export function DashboardSkeleton() {
  return (
    <div className="space-y-7 animate-fade-in">
      {/* Hero */}
      <SkeletonBase className="h-28 rounded-3xl" />
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <SkeletonBase className="h-52 rounded-2xl" />
        <SkeletonBase className="lg:col-span-2 h-52 rounded-2xl" />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonBase className="h-40 rounded-2xl" />
        <SkeletonBase className="h-40 rounded-2xl" />
      </div>
    </div>
  )
}

/* Liste skeleton */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      {[...Array(rows)].map((_, i) => <TableRowSkeleton key={i} />)}
    </div>
  )
}
