const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_REGEX = /^[\d\s\+\-\(\)\.]{6,20}$/

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email requis'
  if (!EMAIL_REGEX.test(email)) return 'Email invalide'
  return null
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return null
  if (!PHONE_REGEX.test(phone)) return 'Téléphone invalide'
  return null
}

export function validateRequired(value, label = 'Ce champ') {
  if (!value || (typeof value === 'string' && !value.trim())) return `${label} est requis`
  return null
}

export function validateTime(time) {
  if (!time) return 'Heure requise'
  if (!/^\d{2}:\d{2}$/.test(time)) return 'Format invalide (HH:mm)'
  const [h, m] = time.split(':').map(Number)
  if (h < 0 || h > 23 || m < 0 || m > 59) return 'Heure invalide'
  return null
}

export function validateTimeRange(start, end) {
  const startErr = validateTime(start)
  if (startErr) return startErr
  const endErr = validateTime(end)
  if (endErr) return endErr
  if (start >= end) return "L'heure de fin doit être après l'heure de début"
  return null
}

export function validateDate(date) {
  if (!date) return 'Date requise'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Format de date invalide'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Date invalide'
  return null
}

export function validateEmployee(data) {
  const errors = {}
  const nameErr = validateRequired(data.name, 'Le nom')
  if (nameErr) errors.name = nameErr
  const emailErr = validateEmail(data.email)
  if (emailErr) errors.email = emailErr
  const phoneErr = validatePhone(data.phone)
  if (phoneErr) errors.phone = phoneErr
  const deptErr = validateRequired(data.department, 'Le département')
  if (deptErr) errors.department = deptErr
  const roleErr = validateRequired(data.role, 'Le rôle')
  if (roleErr) errors.role = roleErr
  return errors
}

export function validateShift(data) {
  const errors = {}
  const empErr = validateRequired(data.employeeId, "L'employé")
  if (empErr) errors.employeeId = empErr
  const dateErr = validateDate(data.date)
  if (dateErr) errors.date = dateErr
  const timeErr = validateTimeRange(data.startTime, data.endTime)
  if (timeErr) errors.time = timeErr
  const deptErr = validateRequired(data.department, 'Le département')
  if (deptErr) errors.department = deptErr
  return errors
}

export function validateAbsence(data) {
  const errors = {}
  const empErr = validateRequired(data.employeeId, "L'employé")
  if (empErr) errors.employeeId = empErr
  const dateErr = validateDate(data.date)
  if (dateErr) errors.date = dateErr
  const reasonErr = validateRequired(data.reason, 'La raison')
  if (reasonErr) errors.reason = reasonErr
  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
