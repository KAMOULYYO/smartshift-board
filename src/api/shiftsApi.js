import api from './axios'

export const getShifts = (weekStart) =>
  api.get('/shifts', { params: weekStart ? { week_start: weekStart } : {} }).then(r => r.data)
export const createShift = data => api.post('/shifts', data).then(r => r.data)
export const updateShift = (id, data) => api.put(`/shifts/${id}`, data).then(r => r.data)
export const deleteShift = id => api.delete(`/shifts/${id}`)
