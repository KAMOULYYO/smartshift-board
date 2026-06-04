import api from './axios'

export const getAbsences = () => api.get('/absences').then(r => r.data)
export const createAbsence = data => api.post('/absences', data).then(r => r.data)
export const updateAbsence = (id, data) => api.put(`/absences/${id}`, data).then(r => r.data)
export const deleteAbsence = id => api.delete(`/absences/${id}`)
