import { useState, useMemo } from 'react'
import { Plus, Filter, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { StatusBadge } from '../components/ui/StatusBadge'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { FormField } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import { DAYS_OF_WEEK, DEPARTMENTS, AVAILABILITY_TYPES, getStatusClasses } from '../utils/helpers'
import { sanitizeId, sanitizeSelect, sanitizeTime, sanitizeText } from '../utils/sanitize'
import { isDirector, isDepartmentManager, isEmployee, filterEmployeesByRole } from '../utils/permissions'

const EMPTY_FORM = { employeeId: '', day: 'monday', type: 'available', startTime: '08:00', endTime: '16:00', note: '' }

export default function AvailabilityPage() {
  const { user } = useAuth()
  const { employees, availabilities, setAvailability, deleteAvailability } = useApp()
  const { toast } = useToast()

  const [filterDept, setFilterDept] = useState('')
  const [filterDay, setFilterDay]   = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [form, setForm]             = useState({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Which employees are shown
  const visibleEmployees = useMemo(() => {
    const base = filterEmployeesByRole(user, employees)
    // Employees only see their own row — filterEmployeesByRole already handles this
    return base
  }, [user, employees])

  const filteredEmployees = useMemo(() =>
    visibleEmployees.filter(e => !filterDept || e.department === filterDept),
  [visibleEmployees, filterDept])

  const getEmpAvailabilities = (empId) =>
    availabilities.filter(a => a.employeeId === empId && (!filterDay || a.day === filterDay))

  const availableDepts = useMemo(() => {
    if (isDirector(user)) return DEPARTMENTS
    if (isDepartmentManager(user)) return [user.department]
    return []
  }, [user])

  const canEditFor = (empId) => {
    if (isDirector(user)) return true
    if (isDepartmentManager(user)) {
      const emp = employees.find(e => e.id === empId)
      return emp?.department === user.department
    }
    return empId === user.id
  }

  const openModal = (empId = '') => {
    const defaultEmpId = isEmployee(user) ? user.id : empId
    setForm({ ...EMPTY_FORM, employeeId: defaultEmpId })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSave = () => {
    const errs = {}
    if (!form.employeeId) errs.employeeId = "L'employé est requis"
    if (!form.day) errs.day = 'Le jour est requis'
    if (!canEditFor(form.employeeId)) errs.employeeId = 'Action non autorisée'
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }

    setAvailability({
      employeeId: sanitizeId(form.employeeId),
      day: sanitizeSelect(form.day, DAYS_OF_WEEK.map(d => d.key)),
      type: sanitizeSelect(form.type, ['available', 'partial', 'unavailable']),
      startTime: form.type !== 'unavailable' ? sanitizeTime(form.startTime) : '',
      endTime:   form.type !== 'unavailable' ? sanitizeTime(form.endTime)   : '',
      note: sanitizeText(form.note, 200),
    })
    toast.success('Disponibilité enregistrée')
    setModalOpen(false)
  }

  const field = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setForm(p => ({ ...p, [key]: e.target.value })),
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            {isEmployee(user) ? 'Mes disponibilités' : 'Disponibilités'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{availabilities.length} disponibilité{availabilities.length > 1 ? 's' : ''} enregistrée{availabilities.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Filters — only for managers/directors */}
      {!isEmployee(user) && (
        <div className="card p-3 flex flex-wrap items-center gap-3">
          <Filter size={15} className="text-gray-400 shrink-0" />
          {availableDepts.length > 1 && (
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="select-field text-sm max-w-[200px]">
              <option value="">Tous les départements</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="select-field text-sm max-w-[160px]">
            <option value="">Tous les jours</option>
            {DAYS_OF_WEEK.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
      )}

      {/* Grid per employee */}
      <div className="space-y-4">
        {filteredEmployees.length === 0 ? (
          <div className="card"><EmptyState icon={Clock} title="Aucun employé" description="Aucun employé dans ce département." /></div>
        ) : (
          filteredEmployees.map(emp => {
            const empAvail = getEmpAvailabilities(emp.id)
            const canEdit  = canEditFor(emp.id)
            return (
              <div key={emp.id} className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-red rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-bold">{emp.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{emp.name}</p>
                      <DepartmentBadge department={emp.department} size="xs" />
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => openModal(emp.id)} className="btn-ghost text-xs py-1.5 px-3">
                      <Plus size={13} /> Ajouter
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map(day => {
                    const av  = empAvail.find(a => a.day === day.key)
                    const cfg = av ? getStatusClasses(av.type) : null
                    return (
                      <div key={day.key} className={`rounded-xl p-2.5 border text-center ${av ? `${cfg.bg} border-transparent` : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-xs font-bold text-gray-500 mb-1">{day.label.slice(0, 3)}</p>
                        {av ? (
                          <>
                            <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
                            {av.type !== 'unavailable' && av.startTime && (
                              <p className="text-xs text-gray-400 mt-0.5">{av.startTime}–{av.endTime}</p>
                            )}
                            {av.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{av.note}</p>}
                            {canEdit && (
                              <button onClick={() => setConfirmDelete(av)} className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors">Retirer</button>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-300">—</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Définir une disponibilité" size="md">
        <div className="space-y-4">
          {!isEmployee(user) && (
            <FormField label="Employé" required error={formErrors.employeeId}>
              <select className="select-field" {...field('employeeId')}>
                <option value="">Sélectionner un employé</option>
                {visibleEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Jour" required error={formErrors.day}>
            <select className="select-field" {...field('day')}>
              {DAYS_OF_WEEK.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </FormField>
          <FormField label="Type de disponibilité" required>
            <select className="select-field" {...field('type')}>
              {AVAILABILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </FormField>
          {form.type !== 'unavailable' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Début"><input type="time" className="input-field" {...field('startTime')} /></FormField>
              <FormField label="Fin"><input type="time" className="input-field" {...field('endTime')} /></FormField>
            </div>
          )}
          <FormField label="Note" hint="Optionnel">
            <textarea className="input-field resize-none" rows={2} maxLength={200} {...field('note')} placeholder="Ex: Retour prévu à 14h…" />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleSave} className="btn-primary text-sm">Enregistrer</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Retirer la disponibilité"
        message="Cette disponibilité sera supprimée pour ce jour."
        confirmLabel="Retirer"
        onConfirm={() => { deleteAvailability(confirmDelete.id); toast.success('Disponibilité retirée'); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
