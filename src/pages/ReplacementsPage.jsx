import { useState, useMemo } from 'react'
import { Repeat2, UserCheck, AlertTriangle, Clock, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { StatusBadge } from '../components/ui/StatusBadge'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import { DEPARTMENTS, formatDate, calcShiftHours } from '../utils/helpers'
import { sanitizeId } from '../utils/sanitize'
import {
  isDirector, isDepartmentManager, isEmployee,
  canManageReplacement, filterReplacementsByRole,
} from '../utils/permissions'

export default function ReplacementsPage() {
  const { user } = useAuth()
  const { employees, replacements, availabilities, assignReplacement, deleteReplacement, getEmployee } = useApp()
  const { toast } = useToast()

  const [filterStatus, setFilterStatus] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Only show what this user is allowed to see
  const visibleReplacements = useMemo(() => filterReplacementsByRole(user, replacements), [user, replacements])

  const filtered = useMemo(() =>
    visibleReplacements.filter(r => {
      const statusOk = !filterStatus || r.status === filterStatus
      const deptOk   = !filterDept   || r.department === filterDept
      return statusOk && deptOk
    }),
  [visibleReplacements, filterStatus, filterDept])

  const availableDepts = useMemo(() => {
    if (isDirector(user)) return DEPARTMENTS
    if (isDepartmentManager(user)) return [user.department]
    return []
  }, [user])

  const getAvailableForReplacement = (rep) => {
    const dayMap = { 1:'monday', 2:'tuesday', 3:'wednesday', 4:'thursday', 5:'friday', 6:'saturday', 0:'sunday' }
    const dayOfWeek = dayMap[new Date(rep.date).getDay()] ?? 'monday'

    // Managers can only assign within their department
    const pool = isDirector(user)
      ? employees
      : employees.filter(e => e.department === user.department)

    return pool.filter(emp => {
      if (emp.id === rep.originalEmployeeId) return false
      const alreadyAssigned = replacements.some(r => r.replacementEmployeeId === emp.id && r.date === rep.date)
      if (alreadyAssigned) return false
      const avail = availabilities.find(a => a.employeeId === emp.id && a.day === dayOfWeek)
      if (avail?.type === 'unavailable') return false
      return true
    })
  }

  const handleAssign = () => {
    if (!selectedEmployee) { toast.error('Sélectionnez un employé'); return }
    if (!canManageReplacement(user, assignModal)) { toast.error('Action non autorisée'); return }
    assignReplacement(assignModal.id, sanitizeId(selectedEmployee))
    toast.success(`Remplacement assigné à ${getEmployee(selectedEmployee)?.name}`)
    setAssignModal(null)
    setSelectedEmployee('')
  }

  const openAssign = (rep) => {
    if (!canManageReplacement(user, rep)) return
    setAssignModal(rep)
    setSelectedEmployee('')
  }

  const handleDelete = () => {
    if (!canManageReplacement(user, confirmDelete)) { toast.error('Action non autorisée'); return }
    deleteReplacement(confirmDelete.id)
    toast.success('Remplacement supprimé')
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            {isEmployee(user) ? 'Mes remplacements'
              : isDepartmentManager(user) ? `Remplacements — ${user.department}`
              : 'Remplacements'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {visibleReplacements.filter(r => r.status === 'open').length} ouvert(s) ·{' '}
            {visibleReplacements.filter(r => r.status === 'assigned').length} assigné(s)
          </p>
        </div>
      </div>

      {/* Filters — hide for plain employees */}
      {!isEmployee(user) && (
        <div className="card p-3 flex flex-wrap items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm w-auto">
            <option value="">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="assigned">Assigné</option>
            <option value="completed">Terminé</option>
          </select>
          {availableDepts.length > 1 && (
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="select-field text-sm w-auto">
              <option value="">Tous les départements</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState icon={Repeat2} title="Aucun remplacement" description="Aucun remplacement en cours." />
          </div>
        ) : (
          filtered.map(rep => {
            const original  = getEmployee(rep.originalEmployeeId)
            const replacer  = rep.replacementEmployeeId ? getEmployee(rep.replacementEmployeeId) : null
            const hours     = calcShiftHours(rep.startTime, rep.endTime)
            const canAct    = canManageReplacement(user, rep)
            const available = getAvailableForReplacement(rep)

            return (
              <div
                key={rep.id}
                className={`card p-5 border-l-4 ${
                  rep.status === 'open'     ? 'border-l-red-500'
                  : rep.status === 'assigned' ? 'border-l-blue-500'
                  : 'border-l-green-500'
                }`}
              >
                <div className="flex flex-wrap items-start gap-4 justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={rep.status} />
                      <DepartmentBadge department={rep.department} size="xs" />
                      {rep.status === 'open' && (
                        <span className="badge bg-amber-50 text-amber-600 border border-amber-200">
                          <AlertTriangle size={11} /> Urgent
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Employé absent</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 gradient-red rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{original?.name?.charAt(0) ?? '?'}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{original?.name ?? 'Inconnu'}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Créneau</p>
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Clock size={13} className="text-gray-400" />
                          {formatDate(rep.date)} · {rep.startTime}–{rep.endTime} ({hours}h)
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Remplaçant</p>
                        {replacer ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                              <span className="text-green-700 text-xs font-bold">{replacer.name.charAt(0)}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{replacer.name}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-red-500 font-medium">Non assigné</span>
                            {available.length > 0 && (
                              <span className="text-xs text-gray-400">({available.length} dispo)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {canAct && (
                    <div className="flex items-center gap-2 shrink-0">
                      {rep.status === 'open' && (
                        <button onClick={() => openAssign(rep)} className="btn-primary text-sm">
                          <UserCheck size={15} /> Assigner
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(rep)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Assign Modal */}
      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title="Assigner un remplaçant" size="md">
        {assignModal && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-xs text-gray-500 font-semibold mb-1">Shift à remplacer</p>
              <p className="text-sm font-bold text-gray-900">{assignModal.department} · {formatDate(assignModal.date)}</p>
              <p className="text-sm text-gray-500">{assignModal.startTime} – {assignModal.endTime}</p>
            </div>

            <div>
              <label className="label">Sélectionner un remplaçant</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getAvailableForReplacement(assignModal).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun employé disponible pour ce créneau</p>
                ) : (
                  getAvailableForReplacement(assignModal).map(emp => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedEmployee === emp.id ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input type="radio" name="replacer" value={emp.id} checked={selectedEmployee === emp.id} onChange={e => setSelectedEmployee(e.target.value)} className="accent-red-500" />
                      <div className="w-8 h-8 gradient-red rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{emp.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                        <DepartmentBadge department={emp.department} size="xs" />
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setAssignModal(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleAssign} disabled={!selectedEmployee} className="btn-primary text-sm">
                <UserCheck size={15} /> Confirmer
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer le remplacement"
        message="Ce remplacement sera définitivement supprimé."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
