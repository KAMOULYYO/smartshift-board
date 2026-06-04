import api from './axios'

export const getReportSummary = (weekStart) =>
  api.get('/reports/summary', { params: weekStart ? { week_start: weekStart } : {} }).then(r => r.data)
