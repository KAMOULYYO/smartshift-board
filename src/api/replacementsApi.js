import api from './axios'

export const getReplacements = () => api.get('/replacements').then(r => r.data)
export const createReplacement = data => api.post('/replacements', data).then(r => r.data)
export const assignReplacement = (id, replacement_employee_id) =>
  api.put(`/replacements/${id}/assign`, { replacement_employee_id }).then(r => r.data)
export const deleteReplacement = id => api.delete(`/replacements/${id}`)
