import api from './axios'

export const getAvailabilities = (employeeId) =>
  api.get('/availabilities', { params: employeeId ? { employee_id: employeeId } : {} }).then(r => r.data)
export const setAvailability = data => api.put('/availabilities', data).then(r => r.data)
