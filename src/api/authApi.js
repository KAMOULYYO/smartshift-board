import api from './axios'

export async function apiLogin(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function apiMe() {
  const { data } = await api.get('/auth/me')
  return data
}
