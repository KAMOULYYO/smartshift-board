import { useState, useMemo } from 'react'
import { Plus, Search, UserX, Check, X, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { StatusBadge, UrgencyBadge } from '../components/ui/StatusBadge'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { FormField } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import { DEPARTMENTS, ABSENCE_REASONS, URGENCY_LEVELS, formatDate, filterBySearch } from '../utils/helpers'
import { validateAbsence, hasErrors } from '../utils/validation'
import { sanitizeAbsence } from '../utils/sanitize'
import {
  isDirector, isDepartmentManager, isEmployee,
  canManageAbsence, filterAbsencesByRole, filterEmployeesByRole,
} from '../utils/permissions'

const EMPTY_FORM = { employeeId: '', department: '', date: '', reason: '', urgency: 'medium', comment: '', status: 'pending' }

export default function AbsencesPage() {
  const { user, canManage } = useAuth()
  const { employees, absences, addAbsence, updateAbsenceStatus, deleteAbsence, getEmployee } = useApp()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Only show absences this user is allowed to see
  const visibleAbsences = useMemo(() => filterAbsencesByRole(user, absences), [user, absences])
  const visibleEmployees = useMemo(() => filterEmployeesByRole(user, employees), [user, employees])

  const filtered = useMemo(() => {
    let list = visibleAbsences.map(a => ({ ...a, _emp: getEmployee(a.employeeId) }))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a._emp?.name?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q) ||
        a.comment?.toLowerCase().includes(q)
      )
    }
    if (filterStatus) list = list.filter(a => a.status === filterStatus)
    if (filterDept) list = list.filter(a => a.department === filterDept)
    return list
  }, [visibleAbsences, search, filterStatus, filterDept, getEmployee])

  const availableDepts = useMemo(() => {
    if (isDirector(user)) return DEPARTMENTS
    if (isDepartmentManager(user)) return [user.department]
    return [user.department]
  }, [user])

  const openModal = () => {
    const dept = isEmployee(user) ? user.department : isDepartmentManager(user) ? user.department : ''
    const empId = isEmployee(user) ? user.id : ''
    setForm({ ...EMPTY_FORM, employeeId: empId, department: dept })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSave = () => {
    const clean = sanitizeAbsence({ ...form, status: 'pending' })

    // Employees can only declare their own absence
    if (isEmployee(user)) {
      clean.employeeId = user.id
      clean.department = user.department
    }
    // Managers restricted to their dept
    if (isDepartmentManager(user)) {
      clean.department = user.department
    }

    const errs = validateAbsence(clean)
    if (hasErrors(errs)) { setFormErrors(errs); return }
    addAbsence(clean)
    toast.success('Demande d\'absence soumise')
    setModalOpen(false)
  }

  const handleAccept = (id, absence) => {
    if (!canManageAbsence(user, absence)) { toast.error('Action non autorisée'); return }
    updateAbsenceStatus(id, 'accepted')
    toast.success('Absence acceptée — remplacement ouvert automatiquement')
  }

  const handleRefuse = (id, absence) => {
    if (!canManageAbsence(user, absence)) { toast.error('Action non autorisée'); return }
    updateAbsenceStatus(id, 'refused')
    toast.warning('Absence refusée')
  }

  const field = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [key]: e.target.value })); setFormErrors(p => ({ ...p, [key]: undefined })) },
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            {isEmployee(user) ? 'Mes absences' : isDepartmentManager(user) ? `Absences — ${user.department}` : 'Absences'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{visibleAbsences.length} absence{visibleAbsences.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openModal} className="btn-primary text-sm">
          <Plus size={16} /> Déclarer absence
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="input-field pl-9 text-sm" maxLength={100} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm w-auto">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="accepted">Acceptée</option>
          <option value="refused">Refusée</option>
        </select>
        {!isEmployee(user) && availableDepts.length > 1 && (
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="select-field text-sm w-auto">
            <option value="">Tous les dép.</option>
            {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={UserX} title="Aucune absence" description="Aucune absence ne correspond à vos critères."
            action={<button onClick={openModal} className="btn-primary text-sm"><Plus size={15} /> Déclarer</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Employé</th>
                  <th className="table-header hidden sm:table-cell">Date</th>
                  <th className="table-header">Raison</th>
                  <th className="table-header hidden md:table-cell">Urgence</th>
                  <th className="table-header">Statut</th>
                  {canManage && <th className="table-header text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(abs => {
                  const emp = abs._emp
                  const canAct = canManageAbsence(user, abs)
                  return (
                    <tr key={abs.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="table-cell">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 gradient-red rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xs">{emp?.name?.charAt(0) ?? '?'}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{emp?.name ?? 'Inconnu'}</p>
                            <DepartmentBadge department={abs.department} size="xs" />
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-sm text-gray-600">{formatDate(abs.date)}</td>
                      <td className="table-cell">
                        <p className="text-sm text-gray-700 font-medium">{abs.reason}</p>
                        {abs.comment && <p className="text-xs text-gray-400 truncate max-w-[180px]">{abs.comment}</p>}
                      </td>
                      <td className="table-cell hidden md:table-cell"><UrgencyBadge urgency={abs.urgency} size="xs" /></td>
                      <td className="table-cell"><StatusBadge status={abs.status} size="xs" /></td>
                      {canManage && (
                        <td className="table-cell text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {abs.status === 'pending' && canAct && (
                              <>
                                <button onClick={() => handleAccept(abs.id, abs)} title="Accepter" className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"><Check size={15} /></button>
                                <button onClick={() => handleRefuse(abs.id, abs)} title="Refuser" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><X size={15} /></button>
                              </>
                            )}
                            {canAct && (
                              <button onClick={() => setConfirmDelete(abs)} title="Supprimer" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Déclarer une absence" size="md">
        <div className="space-y-4">
          {!isEmployee(user) && (
            <FormField label="Employé" required error={formErrors.employeeId}>
              <select className="select-field" {...field('employeeId')}>
                <option value="">Sélectionner un employé</option>
                {visibleEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Département" required error={formErrors.department}>
            <select className="select-field" {...field('department')} disabled={!isDirector(user)}>
              <option value="">Sélectionner</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Date d'absence" required error={formErrors.date}>
            <input type="date" className="input-field" {...field('date')} />
          </FormField>
          <FormField label="Raison" required error={formErrors.reason}>
            <select className="select-field" {...field('reason')}>
              <option value="">Sélectionner une raison</option>
              {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Niveau d'urgence">
            <select className="select-field" {...field('urgency')}>
              {URGENCY_LEVELS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </FormField>
          <FormField label="Commentaire" hint="Optionnel">
            <textarea className="input-field resize-none" rows={3} maxLength={300} {...field('comment')} placeholder="Informations complémentaires…" />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleSave} className="btn-primary text-sm">Soumettre</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer l'absence"
        message="Cette absence sera définitivement supprimée."
        confirmLabel="Supprimer"
        onConfirm={() => { deleteAbsence(confirmDelete.id); toast.success('Absence supprimée'); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
