import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as employeesApi from '../api/employeesApi'
import * as shiftsApi from '../api/shiftsApi'
import * as absencesApi from '../api/absencesApi'
import * as replacementsApi from '../api/replacementsApi'
import * as availabilitiesApi from '../api/availabilitiesApi'
import { calcShiftHours } from '../utils/helpers'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

// ── snake_case ↔ camelCase helpers ─────────────────────────────────────────

function shiftFromApi(s) {
  return {
    id: s.id,
    employeeId: s.employee_id,
    department: s.department,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    status: s.status,
    note: s.note ?? '',
  }
}

function shiftToApi(data) {
  return {
    employee_id: data.employeeId,
    department: data.department,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    status: data.status ?? 'planned',
    note: data.note ?? '',
  }
}

function absenceFromApi(a) {
  return {
    id: a.id,
    employeeId: a.employee_id,
    department: a.department,
    date: a.date,
    reason: a.reason,
    urgency: a.urgency,
    comment: a.comment ?? '',
    status: a.status,
  }
}

function absenceToApi(data) {
  return {
    employee_id: data.employeeId,
    department: data.department,
    date: data.date,
    reason: data.reason,
    urgency: data.urgency ?? 'low',
    comment: data.comment ?? '',
  }
}

function replacementFromApi(r) {
  return {
    id: r.id,
    absenceId: r.absence_id,
    originalEmployeeId: r.original_employee_id,
    replacementEmployeeId: r.replacement_employee_id ?? null,
    department: r.department,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
  }
}

function replacementToApi(data) {
  return {
    absence_id: data.absenceId,
    original_employee_id: data.originalEmployeeId,
    department: data.department,
    date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
  }
}

function availabilityFromApi(a) {
  return {
    id: a.id,
    employeeId: a.employee_id,
    day: a.day,
    type: a.type,
    note: a.note ?? '',
  }
}

// ── Provider ────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const { user } = useAuth()

  const [employees, setEmployees] = useState([])
  const [shifts, setShifts] = useState([])
  const [absences, setAbsences] = useState([])
  const [replacements, setReplacements] = useState([])
  const [availabilities, setAvailabilities] = useState([])
  const [alerts, setAlerts] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // Fetch all data once user is authenticated
  useEffect(() => {
    if (!user) {
      setEmployees([])
      setShifts([])
      setAbsences([])
      setReplacements([])
      setAvailabilities([])
      setAlerts([])
      return
    }
    setDataLoading(true)
    Promise.all([
      employeesApi.getEmployees(),
      shiftsApi.getShifts(),
      absencesApi.getAbsences(),
      replacementsApi.getReplacements(),
      availabilitiesApi.getAvailabilities(),
    ])
      .then(([emps, sh, abs, reps, avails]) => {
        setEmployees(emps)
        setShifts(sh.map(shiftFromApi))
        setAbsences(abs.map(absenceFromApi))
        setReplacements(reps.map(replacementFromApi))
        setAvailabilities(avails.map(availabilityFromApi))
        // Derive alerts from open replacements + pending absences
        const derived = []
        reps.filter(r => r.status === 'open').forEach(r => {
          derived.push({
            id: `al-rep-${r.id}`,
            type: 'replacement',
            department: r.department,
            message: `Remplacement ouvert le ${r.date}`,
            priority: 'medium',
            date: r.date,
          })
        })
        abs.filter(a => a.status === 'pending' && a.urgency === 'high').forEach(a => {
          derived.push({
            id: `al-abs-${a.id}`,
            type: 'absence',
            department: a.department,
            message: `Absence urgente en attente le ${a.date}`,
            priority: 'high',
            date: a.date,
          })
        })
        setAlerts(derived)
      })
      .catch(() => {})
      .finally(() => setDataLoading(false))
  }, [user])

  const getEmployee = useCallback((id) => employees.find(e => e.id === id), [employees])

  // ── Employees ──────────────────────────────────────────────────────────
  const addEmployee = useCallback(async (data) => {
    const created = await employeesApi.createEmployee(data)
    setEmployees(prev => [...prev, created])
    return created
  }, [])

  const updateEmployee = useCallback(async (id, data) => {
    const updated = await employeesApi.updateEmployee(id, data)
    setEmployees(prev => prev.map(e => e.id === id ? updated : e))
    return updated
  }, [])

  const deleteEmployee = useCallback(async (id) => {
    await employeesApi.deleteEmployee(id)
    setEmployees(prev => prev.filter(e => e.id !== id))
    setShifts(prev => prev.filter(s => s.employeeId !== id))
    setAbsences(prev => prev.filter(a => a.employeeId !== id))
    setAvailabilities(prev => prev.filter(a => a.employeeId !== id))
  }, [])

  // ── Shifts ─────────────────────────────────────────────────────────────
  const addShift = useCallback(async (data) => {
    const created = await shiftsApi.createShift(shiftToApi(data))
    const mapped = shiftFromApi(created)
    setShifts(prev => [...prev, mapped])
    return mapped
  }, [])

  const updateShift = useCallback(async (id, data) => {
    const body = {}
    if (data.department !== undefined) body.department = data.department
    if (data.date !== undefined) body.date = data.date
    if (data.startTime !== undefined) body.start_time = data.startTime
    if (data.endTime !== undefined) body.end_time = data.endTime
    if (data.status !== undefined) body.status = data.status
    if (data.note !== undefined) body.note = data.note
    const updated = await shiftsApi.updateShift(id, body)
    const mapped = shiftFromApi(updated)
    setShifts(prev => prev.map(s => s.id === id ? mapped : s))
    return mapped
  }, [])

  const deleteShift = useCallback(async (id) => {
    await shiftsApi.deleteShift(id)
    setShifts(prev => prev.filter(s => s.id !== id))
  }, [])

  const hasShiftConflict = useCallback((employeeId, date, startTime, endTime, excludeId = null) => {
    return shifts.some(s => {
      if (s.id === excludeId) return false
      if (s.employeeId !== employeeId || s.date !== date) return false
      return startTime < s.endTime && endTime > s.startTime
    })
  }, [shifts])

  // ── Absences ───────────────────────────────────────────────────────────
  const addAbsence = useCallback(async (data) => {
    const created = await absencesApi.createAbsence(absenceToApi(data))
    const mapped = absenceFromApi(created)
    setAbsences(prev => [...prev, mapped])
    return mapped
  }, [])

  const updateAbsenceStatus = useCallback(async (id, status) => {
    const updated = await absencesApi.updateAbsence(id, { status })
    const mapped = absenceFromApi(updated)
    setAbsences(prev => prev.map(a => a.id === id ? mapped : a))
    // Refresh shifts (backend auto-sets shift to absent when accepted)
    if (status === 'accepted') {
      const freshShifts = await shiftsApi.getShifts()
      setShifts(freshShifts.map(shiftFromApi))
      // Add alert
      setAlerts(prev => [
        ...prev,
        {
          id: `al-rep-${id}`,
          type: 'replacement',
          department: mapped.department,
          message: `Remplacement ouvert suite à l'absence acceptée`,
          priority: mapped.urgency === 'high' ? 'high' : 'medium',
          date: mapped.date,
        },
      ])
    }
    return mapped
  }, [])

  const deleteAbsence = useCallback(async (id) => {
    await absencesApi.deleteAbsence(id)
    setAbsences(prev => prev.filter(a => a.id !== id))
  }, [])

  // ── Replacements ───────────────────────────────────────────────────────
  const addReplacement = useCallback(async (data) => {
    const created = await replacementsApi.createReplacement(replacementToApi(data))
    const mapped = replacementFromApi(created)
    setReplacements(prev => [...prev, mapped])
    return mapped
  }, [])

  const assignReplacement = useCallback(async (repId, employeeId) => {
    const updated = await replacementsApi.assignReplacement(repId, employeeId)
    const mapped = replacementFromApi(updated)
    setReplacements(prev => prev.map(r => r.id === repId ? mapped : r))
    return mapped
  }, [])

  const deleteReplacement = useCallback(async (id) => {
    await replacementsApi.deleteReplacement(id)
    setReplacements(prev => prev.filter(r => r.id !== id))
  }, [])

  // ── Availabilities ─────────────────────────────────────────────────────
  const setAvailability = useCallback(async (data) => {
    const created = await availabilitiesApi.setAvailability({
      employee_id: data.employeeId,
      day: data.day,
      type: data.type,
      note: data.note ?? null,
    })
    const mapped = availabilityFromApi(created)
    setAvailabilities(prev => {
      const exists = prev.find(a => a.employeeId === data.employeeId && a.day === data.day)
      if (exists) return prev.map(a => a.employeeId === data.employeeId && a.day === data.day ? mapped : a)
      return [...prev, mapped]
    })
    return mapped
  }, [])

  const deleteAvailability = useCallback((id) => {
    setAvailabilities(prev => prev.filter(a => a.id !== id))
  }, [])

  // ── Stats ──────────────────────────────────────────────────────────────
  const getStats = useCallback((date) => {
    const todayShifts = shifts.filter(s => s.date === date)
    const todayAbsences = absences.filter(a => a.date === date && a.status === 'accepted')
    const openReplacements = replacements.filter(r => r.date === date && r.status === 'open')
    const totalHours = todayShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
    return { todayShifts, todayAbsences, openReplacements, totalHours }
  }, [shifts, absences, replacements])

  const getWeekStats = useCallback((dates) => {
    const weekShifts = shifts.filter(s => dates.includes(s.date))
    return weekShifts.reduce((acc, s) => acc + calcShiftHours(s.startTime, s.endTime), 0)
  }, [shifts])

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{
      dataLoading,
      employees, getEmployee, addEmployee, updateEmployee, deleteEmployee,
      shifts, addShift, updateShift, deleteShift, hasShiftConflict,
      absences, addAbsence, updateAbsenceStatus, deleteAbsence,
      replacements, addReplacement, assignReplacement, deleteReplacement,
      availabilities, setAvailability, deleteAvailability,
      alerts, dismissAlert,
      getStats, getWeekStats,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
