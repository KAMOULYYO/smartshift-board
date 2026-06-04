import api from './axios'

export const publishPlanning   = (week, department = '') => api.post('/planning/publish', { week, department })
export const getPlanningStatus = (week) => api.get(`/planning/status/${week}`)
export const confirmPlanning   = (week) => api.post('/planning/confirm', { week })
export const checkinShift      = (shift_id, action) => api.post('/planning/checkin', { shift_id, action })
export const getPresence       = (date) => api.get(`/planning/presence/${date}`)
