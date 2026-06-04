import { useState } from 'react'
import { User, Mail, Phone, Building2, Shield, Edit2, Check, X } from 'lucide-react'
import DepartmentBadge from '../components/ui/DepartmentBadge'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { getRoleLabel } from '../utils/permissions'
import { sanitizeText, sanitizePhone } from '../utils/sanitize'
import { validatePhone } from '../utils/validation'

export default function MyProfilePage() {
  const { user } = useAuth()
  const { employees, updateEmployee } = useApp()
  const { toast } = useToast()

  const emp = employees.find(e => e.id === user?.id)

  const [editing, setEditing] = useState(false)
  const [phone, setPhone]     = useState(emp?.phone ?? '')
  const [note, setNote]       = useState(emp?.note ?? '')
  const [phoneErr, setPhoneErr] = useState('')

  const handleSave = () => {
    const err = validatePhone(phone)
    if (err) { setPhoneErr(err); return }
    setPhoneErr('')
    updateEmployee(user.id, {
      ...emp,
      phone: sanitizePhone(phone),
      note: sanitizeText(note, 200),
    })
    toast.success('Profil mis à jour')
    setEditing(false)
  }

  const handleCancel = () => {
    setPhone(emp?.phone ?? '')
    setNote(emp?.note ?? '')
    setPhoneErr('')
    setEditing(false)
  }

  if (!emp) {
    return (
      <div className="card p-8 text-center text-gray-400">
        <User size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Profil introuvable. Contactez votre administrateur.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-xl">
      <div>
        <h2 className="page-title">Mon profil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Vos informations personnelles</p>
      </div>

      <div className="card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 gradient-red rounded-3xl flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-2xl">{emp.name.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">{emp.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <DepartmentBadge department={emp.department} size="sm" />
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-semibold text-gray-500">{getRoleLabel(emp.role)}</span>
            </div>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="space-y-4">
          <Row icon={Mail} label="Email" value={emp.email} />
          <Row icon={Building2} label="Département" value={emp.department} />
          <Row icon={Shield} label="Rôle" value={getRoleLabel(emp.role)} />

          {/* Editable: phone */}
          <div className="flex items-start gap-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
              <Phone size={15} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Téléphone</p>
              {editing ? (
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneErr('') }}
                    maxLength={20}
                    className="input-field text-sm"
                    placeholder="06 00 00 00 00"
                    autoFocus
                  />
                  {phoneErr && <p className="mt-1 text-xs text-red-500 font-medium">{phoneErr}</p>}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-900">{emp.phone || <span className="text-gray-400 italic">Non renseigné</span>}</p>
              )}
            </div>
          </div>

          {/* Editable: note */}
          <div className="flex items-start gap-3 py-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
              <User size={15} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Note personnelle</p>
              {editing ? (
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="input-field text-sm resize-none"
                  placeholder="Ex: Je préfère les shifts du matin…"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{emp.note || <span className="text-gray-400 italic">Aucune note</span>}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
          {editing ? (
            <>
              <button onClick={handleSave} className="btn-primary text-sm"><Check size={15} /> Enregistrer</button>
              <button onClick={handleCancel} className="btn-secondary text-sm"><X size={15} /> Annuler</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm"><Edit2 size={15} /> Modifier mes informations</button>
          )}
        </div>
      </div>

      <div className="card p-4 bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Informations modifiables :</strong> téléphone et note personnelle uniquement. Pour tout autre changement (nom, email, département, rôle), contactez votre responsable ou la direction.
        </p>
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
