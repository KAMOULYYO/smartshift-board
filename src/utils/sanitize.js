const MAX_TEXT_LENGTH = 500
const MAX_SHORT_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_PHONE_LENGTH = 20

export function sanitizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return ''
  return value
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .trim()
}

export function sanitizeShort(value) {
  return sanitizeText(value, MAX_SHORT_LENGTH)
}

export function sanitizeEmail(value) {
  if (typeof value !== 'string') return ''
  return value.slice(0, MAX_EMAIL_LENGTH).toLowerCase().trim()
}

export function sanitizePhone(value) {
  if (typeof value !== 'string') return ''
  return value.slice(0, MAX_PHONE_LENGTH).replace(/[^\d\s\+\-\(\)\.]/g, '').trim()
}

export function sanitizeId(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 64)
}

export function sanitizeDate(value) {
  if (typeof value !== 'string') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return ''
}

export function sanitizeTime(value) {
  if (typeof value !== 'string') return ''
  if (/^\d{2}:\d{2}$/.test(value)) return value
  return ''
}

export function sanitizeSelect(value, allowed) {
  if (!allowed.includes(value)) return allowed[0] ?? ''
  return value
}

export function sanitizeNumber(value, min = 0, max = 9999) {
  const n = Number(value)
  if (isNaN(n)) return min
  return Math.min(max, Math.max(min, Math.floor(n)))
}

export function sanitizeEmployee(data) {
  return {
    name: sanitizeShort(data.name),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone),
    department: sanitizeShort(data.department),
    role: sanitizeSelect(data.role, ['director', 'assistant_manager', 'manager', 'employee']),
    note: sanitizeText(data.note ?? '', 200),
  }
}

export function sanitizeShift(data) {
  return {
    employeeId: sanitizeId(data.employeeId),
    department: sanitizeShort(data.department),
    date: sanitizeDate(data.date),
    startTime: sanitizeTime(data.startTime),
    endTime: sanitizeTime(data.endTime),
    status: sanitizeSelect(data.status, ['planned', 'completed', 'absent', 'replaced']),
    note: sanitizeText(data.note ?? '', 200),
  }
}

export function sanitizeAbsence(data) {
  return {
    employeeId: sanitizeId(data.employeeId),
    department: sanitizeShort(data.department),
    date: sanitizeDate(data.date),
    reason: sanitizeShort(data.reason),
    urgency: sanitizeSelect(data.urgency, ['low', 'medium', 'high']),
    comment: sanitizeText(data.comment ?? '', 300),
    status: sanitizeSelect(data.status, ['pending', 'accepted', 'refused']),
  }
}
