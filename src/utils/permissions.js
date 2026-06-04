// Role hierarchy
// director > assistant_manager = manager > employee

export const ROLES = {
  DIRECTOR: 'director',
  ASSISTANT_MANAGER: 'assistant_manager',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
}

export function isDirector(user) {
  return user?.role === ROLES.DIRECTOR
}

export function isManagerLevel(user) {
  return [ROLES.DIRECTOR, ROLES.ASSISTANT_MANAGER, ROLES.MANAGER].includes(user?.role)
}

export function isDepartmentManager(user) {
  return [ROLES.ASSISTANT_MANAGER, ROLES.MANAGER].includes(user?.role)
}

export function isEmployee(user) {
  return user?.role === ROLES.EMPLOYEE
}

// A user can view/manage data for a given department
export function canAccessDepartment(user, department) {
  if (!user) return false
  if (isDirector(user)) return true
  return user.department === department
}

// Can view global store reports
export function canViewGlobalReports(user) {
  return isDirector(user)
}

// Can view all employees or only own department
export function canViewEmployee(user, employee) {
  if (!user || !employee) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === employee.department
  // Employee can only see themselves
  return user.id === employee.id
}

// Can manage (add/edit/delete) an employee record
export function canManageEmployee(user, employee) {
  if (!user || !employee) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) {
    // Cannot promote to director
    if (employee.role === ROLES.DIRECTOR) return false
    return user.department === employee.department
  }
  return false
}

// Can view a shift
export function canViewShift(user, shift) {
  if (!user || !shift) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === shift.department
  // Employee sees only their own shifts
  return user.id === shift.employeeId
}

// Can create/edit/delete a shift
export function canManageShift(user, shift) {
  if (!user || !shift) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === shift.department
  return false
}

// Can view an absence
export function canViewAbsence(user, absence) {
  if (!user || !absence) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === absence.department
  return user.id === absence.employeeId
}

// Can accept/refuse an absence
export function canManageAbsence(user, absence) {
  if (!user || !absence) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === absence.department
  return false
}

// Can view a replacement
export function canViewReplacement(user, replacement) {
  if (!user || !replacement) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === replacement.department
  return (
    user.id === replacement.originalEmployeeId ||
    user.id === replacement.replacementEmployeeId
  )
}

// Can assign a replacement
export function canManageReplacement(user, replacement) {
  if (!user || !replacement) return false
  if (isDirector(user)) return true
  if (isDepartmentManager(user)) return user.department === replacement.department
  return false
}

// Can view department overview page
export function canViewDepartments(user) {
  return isDirector(user) || isDepartmentManager(user)
}

// Can view the confidential global report
export function canViewReport(user) {
  return isDirector(user)
}

// Filter a list of shifts for a user
export function filterShiftsByRole(user, shifts) {
  if (!user) return []
  return shifts.filter(s => canViewShift(user, s))
}

// Filter a list of absences for a user
export function filterAbsencesByRole(user, absences) {
  if (!user) return []
  return absences.filter(a => canViewAbsence(user, a))
}

// Filter a list of replacements for a user
export function filterReplacementsByRole(user, replacements) {
  if (!user) return []
  return replacements.filter(r => canViewReplacement(user, r))
}

// Filter a list of employees for a user
export function filterEmployeesByRole(user, employees) {
  if (!user) return []
  return employees.filter(e => canViewEmployee(user, e))
}

// Get the default landing page after login
export function getDefaultRoute(user) {
  if (!user) return '/login'
  if (isEmployee(user)) return '/my-schedule'
  return '/dashboard'
}

// Role display labels
export const ROLE_LABELS = {
  [ROLES.DIRECTOR]: 'Directeur',
  [ROLES.ASSISTANT_MANAGER]: 'Adjoint',
  [ROLES.MANAGER]: 'Gérant',
  [ROLES.EMPLOYEE]: 'Employé',
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role
}
