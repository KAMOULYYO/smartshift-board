import { useState, useMemo } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import Pagination from '../components/ui/Pagination'
import EmployeeTable from '../components/employees/EmployeeTable'
import Modal from '../components/ui/Modal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { FormField } from '../components/ui/FormField'
import EmptyState from '../components/ui/EmptyState'
import AccessDenied from '../components/ui/AccessDenied'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { DEPARTMENTS, filterBySearch } from '../utils/helpers'
import {
  ROLES as ROLE_CONSTS, ROLE_LABELS, getRoleLabel,
  isDirector, isDepartmentManager,
  canViewEmployee, canManageEmployee, filterEmployeesByRole,
} from '../utils/permissions'
import { validateEmployee, hasErrors } from '../utils/validation'
import { sanitizeEmployee } from '../utils/sanitize'

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', department: '', role: 'employee', note: '' }

// Roles selectable depending on who is logged in
function allowedRolesForManager(user) {
  if (isDirector(user)) return Object.entries(ROLE_LABELS)
  // Dept managers cannot promote to director
  return Object.entries(ROLE_LABELS).filter(([v]) => v !== ROLE_CONSTS.DIRECTOR)
}

export default function EmployeesPage() {
  const { user, canManage } = useAuth()
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useApp()
  const { toast } = useToast()

  // Employees can't access this page at all
  if (!isDirector(user) && !isDepartmentManager(user)) {
    return <AccessDenied message="La liste des employés est réservée aux managers et à la direction." />
  }

  const [search, setSearch]         = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 10
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmp, setEditEmp]     = useState(null)
  const [form, setForm]           = useState({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Respect RBAC for the list
  const visibleEmployees = useMemo(() => filterEmployeesByRole(user, employees), [user, employees])

  const filtered = useMemo(() => {
    let list = [...visibleEmployees]
    if (search) list = filterBySearch(list, search, ['name', 'email', 'department'])
    if (filterDept) list = list.filter(e => e.department === filterDept)
    if (filterRole) list = list.filter(e => e.role === filterRole)
    return list
  }, [visibleEmployees, search, filterDept, filterRole])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const availableDepts = useMemo(() => {
    if (isDirector(user)) return DEPARTMENTS
    return [user.department]
  }, [user])

  const roleOptions = allowedRolesForManager(user)

  const openAdd = () => {
    const defaultDept = isDepartmentManager(user) ? user.department : ''
    setEditEmp(null)
    setForm({ ...EMPTY_FORM, department: defaultDept })
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (emp) => {
    if (!canManageEmployee(user, emp)) { toast.error('Action non autorisée'); return }
    setEditEmp(emp)
    setForm({ name: emp.name, email: emp.email, password: '', phone: emp.phone || '', department: emp.department, role: emp.role, note: emp.note || '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    const clean = sanitizeEmployee(form)

    // Managers restricted to their dept
    if (isDepartmentManager(user)) clean.department = user.department
    // Cannot promote to director if not director
    if (!isDirector(user) && clean.role === ROLE_CONSTS.DIRECTOR) {
      setFormErrors({ role: 'Vous ne pouvez pas attribuer le rôle Directeur.' })
      return
    }

    const errs = validateEmployee(clean)
    if (!editEmp && !form.password) errs.password = 'Mot de passe requis'
    if (form.password && form.password.length < 6) errs.password = 'Minimum 6 caractères'
    if (hasErrors(errs)) { setFormErrors(errs); return }

    try {
      if (editEmp) {
        const updates = { name: clean.name, email: clean.email, phone: clean.phone, role: clean.role, department: clean.department, note: clean.note }
        await updateEmployee(editEmp.id, updates)
        toast.success('Employé mis à jour')
      } else {
        await addEmployee({ ...clean, password: form.password })
        toast.success('Employé ajouté')
      }
      setModalOpen(false)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Erreur lors de la sauvegarde'
      toast.error(msg)
    }
  }

  const handleDelete = (emp) => {
    if (!canManageEmployee(user, emp)) { toast.error('Action non autorisée'); return }
    setConfirmDelete(emp)
  }

  const doDelete = async () => {
    const emp = confirmDelete
    setConfirmDelete(null)
    try {
      await deleteEmployee(emp.id)
      toast.success(`${emp.name} supprimé`)
    } catch (err) {
      const msg = err.response?.data?.detail ?? 'Erreur lors de la suppression'
      toast.error(msg)
    }
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
            {isDepartmentManager(user) ? `Mon équipe — ${user.department}` : 'Employés'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {visibleEmployees.length} employé{visibleEmployees.length > 1 ? 's' : ''} · {filtered.length} affiché{filtered.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={16} /> Ajouter employé
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: visibleEmployees.length,                                      color: 'bg-blue-50 text-blue-600' },
          { label: 'Directeurs', value: visibleEmployees.filter(e => e.role === ROLE_CONSTS.DIRECTOR).length,          color: 'bg-red-50 text-red-600' },
          { label: 'Managers',   value: visibleEmployees.filter(e => [ROLE_CONSTS.ASSISTANT_MANAGER, ROLE_CONSTS.MANAGER].includes(e.role)).length, color: 'bg-amber-50 text-amber-600' },
          { label: 'Employés',   value: visibleEmployees.filter(e => e.role === ROLE_CONSTS.EMPLOYEE).length,          color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color} flex items-center justify-between`}>
            <p className="text-sm font-semibold">{s.label}</p>
            <p className="text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email…" className="input-field pl-9 text-sm" maxLength={100} />
        </div>
        {availableDepts.length > 1 && (
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="select-field text-sm w-auto">
            <option value="">Tous les dép.</option>
            {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="select-field text-sm w-auto">
          <option value="">Tous les rôles</option>
          {roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="Aucun employé trouvé" description="Aucun résultat ne correspond à vos critères."
            action={canManage && <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15} /> Ajouter</button>}
          />
        ) : (
          <>
            <EmployeeTable
              employees={paginated}
              onEdit={openEdit}
              onDelete={handleDelete}
              canManage={canManage}
            />
            <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0,0) }} />
          </>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editEmp ? "Modifier l'employé" : 'Ajouter un employé'} size="md">
        <div className="space-y-4">
          <FormField label="Nom complet" required error={formErrors.name}>
            <input type="text" className="input-field" placeholder="Jean Dupont" maxLength={100} {...field('name')} />
          </FormField>
          <FormField label="Email" required error={formErrors.email}>
            <input type="email" className="input-field" placeholder="jean.dupont@email.fr" maxLength={254} {...field('email')} />
          </FormField>
          {!editEmp && (
            <FormField label="Mot de passe" required error={formErrors.password} hint="Min. 6 caractères — l'employé s'en servira pour se connecter">
              <input type="password" className="input-field" placeholder="••••••••" maxLength={128} {...field('password')} />
            </FormField>
          )}
          <FormField label="Téléphone" error={formErrors.phone}>
            <input type="tel" className="input-field" placeholder="06 00 00 00 00" maxLength={20} {...field('phone')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Département" required error={formErrors.department}>
              <select className="select-field" {...field('department')} disabled={isDepartmentManager(user)}>
                <option value="">Sélectionner</option>
                {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Rôle" required error={formErrors.role}>
              <select className="select-field" {...field('role')}>
                {roleOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Note" hint="Optionnel">
            <input type="text" className="input-field" placeholder="Ex: Responsable secteur…" maxLength={200} {...field('note')} />
          </FormField>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleSave} className="btn-primary text-sm">{editEmp ? 'Enregistrer' : 'Ajouter'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Supprimer l'employé"
        message={`Êtes-vous sûr de vouloir supprimer ${confirmDelete?.name} ? Ses shifts et absences seront également supprimés.`}
        confirmLabel="Supprimer"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
