import api from './axios'

export const getAppSettings = () => api.get('/settings').then(r => r.data)
export const saveAppSettings = (data) => api.post('/settings', data).then(r => r.data)
