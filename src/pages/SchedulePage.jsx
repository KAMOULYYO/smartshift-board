import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { addDays, subDays } from 'date-fns'
import WeeklyCalendar from '../components/schedule/WeeklyCalendar'
import ShiftCard from '../components/schedule/ShiftCard'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { FormField } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getWeekDates, getTodayDate, formatDate, DEPARTMENTS } from '../utils/helpers'
import { validateShift, hasErrors } from '../utils/validation'
import { sanitizeShift } from '../utils/sanitize'
import {
  isDirector, isDepartmentManager, canManageShift,
  filterShiftsByRole, filterEmployeesByRole,
} from '../utils/permissions'

const EMPTY_SHIFT = { employeeId: '', department: '', date: '', startTime: '08:00', endTime: '16:00', status: 'planned', note: '' }

export default function SchedulePage() {
  const { user, canManage } = useAuth()
  const { employees, shifts, addShift, updateShift, deleteShift, hasShiftConflict, getEmployee } = useApp()
  const { toast } = useToast()
  const today = getTodayDate()

  const [weekRef, setWeekRef] = useState(new Date(today))
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef])

  const [filterDept, setFilterDept] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editShift, setEditShift] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_SHIFT })
  const [formErrors, setFormErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [view, setView] = useState('calendar')

  // Respect RBAC — only show shifts the user is allowed to see
  const visibleShifts = useMemo(() => filterShiftsByRole(user, shifts), [user, shifts])

  const filteredShifts = useMemo(() =>
    visibleShifts.filter(s => {
      const inWeek = weekDates.includes(s.date)
      const deptOk = !filterDept || s.department === filterDept
      return inWeek && deptOk
    }),
  [visibleShifts, weekDates, filterDept])

  // Employees the current user is allowed to assign shifts to
  const assignableEmployees = useMemo(() => filterEmployeesByRole(user, employees), [user, employees])

  // Departments the user can filter on
  const availableDepts = useMemo(() => {
    if (isDirector(user)) return DEPARTMENTS
    if (isDepartmentManager(user)) return [user.department]
    return []
  }, [user])

  const openAdd = (date = today) => {
    const defaultDept = isDepartmentManager(user) ? user.department : ''
    setEditShift(null)
    setForm({ ...EMPTY_SHIFT, date, department: defaultDept })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (shift) => {
    if (!canManageShift(user, shift)) return
    setEditShift(shift)
    setForm({ ...shift })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSave = () => {
    const clean = sanitizeShift(form)
    const errs = validateShift(clean)
    if (hasErrors(errs)) { setFormErrors(errs); return }

    // Enforce department restriction for managers
    if (isDepartmentManager(user) && clean.department !== user.department) {
      setFormErrors({ department: 'Vous ne pouvez gérer que votre département.' })
      return
    }

    const conflict = hasShiftConflict(clean.employeeId, clean.date, clean.startTime, clean.endTime, editShift?.id)
    if (conflict) { setFormErrors({ time: 'Cet employé a déjà un shift à ce créneau.' }); return }

    if (editShift) {
      updateShift(editShift.id, clean)
      toast.success('Shift mis à jour')
    } else {
      addShift(clean)
      toast.success('Shift ajouté')
    }
    setModalOpen(false)
  }

  const handleDelete = () => {
    if (!canManageShift(user, confirmDelete)) { toast.error('Action non autorisée'); return }
    deleteShift(confirmDelete.id)
    toast.success('Shift supprimé')
    setConfirmDelete(null)
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
            {isDepartmentManager(user) ? `Horaires — ${user.department}` : 'Horaires de la semaine'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(weekDates[0])} – {formatDate(weekDates[6])}</p>
        </div>
        {canManage && (
          <button onClick={() => openAdd()} className="btn-primary text-sm">
            <Plus size={16} /> Ajouter shift
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekRef(d => subDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronLeft size={18} /></button>
          <button onClick={() => setWeekRef(new Date(today))} className="btn-ghost text-sm px-3 py-1.5">Aujourd'hui</button>
          <button onClick={() => setWeekRef(d => addDays(d, 7))} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"><ChevronRight size={18} /></button>
        </div>
        {availableDepts.length > 1 && (
          <div className="flex items-center gap-2 flex-1">
            <Filter size={15} className="text-gray-400 shrink-0" />
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="select-field text-sm max-w-[200px]">
              <option value="">Tous les départements</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setView('calendar')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Calendrier</button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>Liste</button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="card p-4">
          <WeeklyCalendar
            weekDates={weekDates}
            shifts={filteredShifts}
            employees={employees}
            onAddShift={canManage ? openAdd : null}
            onEditShift={canManage ? openEdit : null}
            onDeleteShift={canManage ? setConfirmDelete : null}
            canManage={canManage}
            today={today}
          />
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-3">
          {filteredShifts.length === 0 ? (
            <div className="card">
              <EmptyState icon={Plus} title="Aucun shift" description="Aucun shift planifié pour cette période."
                action={canManage && <button onClick={() => openAdd()} className="btn-primary text-sm"><Plus size={15} /> Ajouter</button>}
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShifts.map(shift => {
                const emp = getEmployee(shift.employeeId)
                return (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    employeeName={emp?.name ?? 'Inconnu'}
                    onEdit={canManageShift(user, shift) ? () => openEdit(shift) : null}
                    onDelete={canManageShift(user, shift) ? () => setConfirmDelete(shift) : null}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editShift ? 'Modifier le shift' : 'Ajouter un shift'} size="md">
        <div className="space-y-4">
          <FormField label="Employé" required error={formErrors.employeeId}>
            <select className="select-field" {...field('employeeId')}>
              <option value="">Sélectionner un employé</option>
              {assignableEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
            </select>
          </FormField>
          <FormField label="Département" required error={formErrors.department}>
            <select className="select-field" {...field('department')} disabled={isDepartmentManager(user)}>
              <option value="">Sélectionner</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Date" required error={formErrors.date}>
            <input type="date" className="input-field" {...field('date')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Début" required error={formErrors.time}>
              <input type="time" className="input-field" {...field('startTime')} />
            </FormField>
            <FormField label="Fin" required>
              <input type="time" className="input-field" {...field('endTime')} />
            </FormField>
          </div>
          {formErrors.time && <p className="text-xs text-red-500 font-medium -mt-2">{formErrors.time}</p>}
          <FormField label="Statut">
            <select className="select-field" {...field('status')}>
              <option value="planned">Planifié</option>
              <option value="completed">Terminé</option>
              <option value="absent">Absent</option>
              <option value="replaced">Remplacé</option>
            </select>
          </FormField>
          <FormField label="Note" hint="Optionnel">
            <textarea className="input-field resize-none" rows={2} maxLength={200} {...field('note')} placeholder="Information complémentaire…" />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleSave} className="btn-primary text-sm">{editShift ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer le shift"
        message="Êtes-vous sûr de vouloir supprimer ce shift ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
