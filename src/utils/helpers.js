import { format, startOfWeek, addDays, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

export const DEPARTMENTS = [
  'Caisse',
  'Fruits et légumes',
  'Viande',
  'Boulangerie',
  'Épicerie',
  'Produits laitiers',
  'Réception',
  'Administration',
]


export const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

export const AVAILABILITY_TYPES = [
  { value: 'available', label: 'Disponible' },
  { value: 'partial', label: 'Partiel' },
  { value: 'unavailable', label: 'Non disponible' },
]

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
]

export const ABSENCE_REASONS = [
  'Maladie',
  'Congé personnel',
  'Urgence familiale',
  'Rendez-vous médical',
  'Congé payé',
  'Formation',
  'Autre',
]

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'dd MMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'dd/MM', { locale: fr })
  } catch {
    return dateStr
  }
}

export function formatDayName(dateStr) {
  if (!dateStr) return ''
  try {
    const d = parseISO(dateStr)
    if (!isValid(d)) return dateStr
    return format(d, 'EEEE', { locale: fr })
  } catch {
    return dateStr
  }
}

export function getWeekDates(referenceDate = new Date()) {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i)
    return format(d, 'yyyy-MM-dd')
  })
}

export function getTodayDate() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function calcShiftHours(startTime, endTime) {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, diff / 60)
}

export function getDepartmentColor(department) {
  const colors = {
    'Caisse': 'blue',
    'Fruits et légumes': 'green',
    'Viande': 'red',
    'Boulangerie': 'amber',
    'Épicerie': 'purple',
    'Produits laitiers': 'cyan',
    'Réception': 'indigo',
    'Administration': 'gray',
  }
  return colors[department] ?? 'gray'
}

export function getDepartmentColorClasses(department) {
  const map = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    cyan:   { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    gray:   { bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200',   dot: 'bg-gray-500' },
  }
  const color = getDepartmentColor(department)
  return map[color] ?? map.gray
}

export function getStatusClasses(status) {
  const map = {
    planned:   { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Planifié' },
    completed: { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Terminé' },
    absent:    { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Absent' },
    replaced:  { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Remplacé' },
    pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'En attente' },
    accepted:  { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Acceptée' },
    refused:   { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Refusée' },
    open:      { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Ouvert' },
    assigned:  { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Assigné' },
    available:     { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Disponible' },
    partial:       { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Partiel' },
    unavailable:   { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Non disponible' },
  }
  return map[status] ?? { bg: 'bg-gray-50', text: 'text-gray-700', label: status }
}

export function getUrgencyClasses(urgency) {
  const map = {
    low:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Faible' },
    medium: { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Moyen' },
    high:   { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Élevé' },
  }
  return map[urgency] ?? map.low
}


export function filterBySearch(items, query, fields) {
  if (!query?.trim()) return items
  const q = query.toLowerCase().trim()
  return items.filter(item =>
    fields.some(f => String(item[f] ?? '').toLowerCase().includes(q))
  )
}

export function sortBy(items, key, dir = 'asc') {
  return [...items].sort((a, b) => {
    const av = a[key] ?? ''
    const bv = b[key] ?? ''
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'desc' ? -cmp : cmp
  })
}
