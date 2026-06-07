import { useState, useRef } from 'react'
import { ImagePlus, Loader2, CheckCircle2, AlertTriangle, Zap, Users, UserPlus, Key, Mail, Camera } from 'lucide-react'
import Modal from '../ui/Modal'
import api from '../../api/axios'

function slugName(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/, '')
}

function generateCredentials(name, department) {
  const parts = name.trim().split(/\s+/)
  const first = slugName(parts[0] ?? 'employe')
  const last  = slugName(parts[1] ?? 'nouveau')
  const email = `${first}.${last}@smartshift.fr`
  const password = 'Shift2024!'
  return { email, password }
}

export default function ImportPhotoModal({ isOpen, onClose, weekStart, employees, onImportShifts }) {
  const [step, setStep]           = useState('upload')
  const [preview, setPreview]     = useState(null)
  const [imageB64, setImageB64]   = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [matchedShifts, setMatchedShifts] = useState([])
  const [newAccounts, setNewAccounts]     = useState([]) // comptes créés auto
  const [warning, setWarning]     = useState(null)
  const [error, setError]         = useState(null)
  const [creating, setCreating]   = useState(false)
  const fileRef = useRef()

  const reset = () => {
    setStep('upload'); setPreview(null); setImageB64(null)
    setMatchedShifts([]); setNewAccounts([]); setWarning(null); setError(null)
  }
  const handleClose = () => { reset(); onClose() }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => { setPreview(e.target.result); setImageB64(e.target.result) }
    reader.readAsDataURL(file)
  }

  const matchEmployees = (shifts) => {
    const allEmps = [...employees]
    return shifts.map(s => {
      const nameLower = (s.employee_name ?? '').toLowerCase()
      const matched = allEmps.find(e =>
        e.name.toLowerCase() === nameLower ||
        nameLower.includes(e.name.split(' ')[0]?.toLowerCase()) ||
        e.name.toLowerCase().includes(nameLower.split(' ')[0]?.toLowerCase())
      )
      const creds = !matched ? generateCredentials(s.employee_name, s.department) : null
      return {
        ...s,
        employeeId: matched?.id ?? null,
        employeeName: matched?.name ?? s.employee_name,
        matched: !!matched,
        selected: true,
        needsAccount: !matched,
        tempEmail: creds?.email ?? null,
        tempPassword: creds?.password ?? null,
      }
    })
  }

  const analyze = async () => {
    if (!imageB64) return
    setStep('analyzing'); setError(null)
    try {
      const res = await api.post('/import/photo', { image_base64: imageB64, week_start: weekStart })
      const { shifts, warning } = res.data
      if (warning) setWarning(warning)
      setMatchedShifts(matchEmployees(shifts))
      setStep('review')
    } catch (err) {
      setError(err.response?.data?.detail ?? "Erreur lors de l'analyse")
      setStep('upload')
    }
  }

  const toggleShift = (idx) => {
    setMatchedShifts(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s))
  }

  const handleImport = async () => {
    setCreating(true)
    const created = []

    // Créer les comptes manquants
    const toCreate = matchedShifts.filter(s => s.selected && s.needsAccount)
    const uniqueNames = [...new Map(toCreate.map(s => [s.employee_name, s])).values()]

    const nameToId = {}
    for (const s of uniqueNames) {
      try {
        const res = await api.post('/employees', {
          name: s.employeeName,
          email: s.tempEmail,
          password: s.tempPassword,
          department: s.department || 'Caisse',
          role: 'employee',
          phone: '',
          note: 'Compte créé automatiquement via import photo',
        })
        nameToId[s.employee_name] = res.data.id
        created.push({ name: s.employeeName, email: s.tempEmail, password: s.tempPassword, department: s.department })
      } catch (e) {
        // Email déjà pris — on cherche l'employé existant
        const existing = employees.find(emp => emp.email === s.tempEmail)
        if (existing) nameToId[s.employee_name] = existing.id
      }
    }

    // Construire la liste finale avec les vrais IDs
    const finalShifts = matchedShifts
      .filter(s => s.selected)
      .map(s => ({
        ...s,
        employeeId: s.employeeId ?? nameToId[s.employee_name] ?? null,
      }))
      .filter(s => s.employeeId)

    setNewAccounts(created)
    onImportShifts(finalShifts)
    setCreating(false)
    setStep('done')
  }

  const selectedCount  = matchedShifts.filter(s => s.selected).length
  const needsAccount   = matchedShifts.filter(s => s.selected && s.needsAccount).length
  const alreadyMatched = matchedShifts.filter(s => s.selected && s.matched).length

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📸 Importer depuis une photo" size="lg">

      {/* UPLOAD */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <Zap size={18} className="text-purple-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-purple-800">IA de lecture automatique</p>
              <p className="text-xs text-purple-600">L'IA lit les noms, heures et départements — les nouveaux employés sont créés automatiquement</p>
            </div>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'}`}
          >
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="preview" className="max-h-52 mx-auto rounded-xl shadow-md object-contain" />
                <p className="text-sm text-green-600 font-semibold">✓ Image chargée</p>
                <p className="text-xs text-gray-400">Cliquez pour changer</p>
              </div>
            ) : (
              <>
                <Camera size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-500">Glissez votre screenshot ici</p>
                <p className="text-xs text-gray-400 mt-1">ou cliquez pour choisir</p>
                <p className="text-xs text-gray-300 mt-2">Screenshot CleverAnt, Excel, ou tout autre planning</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={handleClose} className="btn-secondary text-sm">Annuler</button>
            <button onClick={analyze} disabled={!imageB64} className="btn-primary text-sm disabled:opacity-50">
              <Zap size={15} /> Analyser avec l'IA
            </button>
          </div>
        </div>
      )}

      {/* ANALYZING */}
      {step === 'analyzing' && (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 gradient-red rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 size={28} className="text-white animate-spin" />
          </div>
          <p className="text-base font-bold text-gray-900">L'IA analyse votre planning…</p>
          <p className="text-sm text-gray-400">Détection des noms, horaires et départements</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="space-y-4">
          {/* Résumé */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-blue-600">{matchedShifts.length}</p>
              <p className="text-xs text-blue-500 font-semibold">shifts détectés</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-green-600">{matchedShifts.filter(s => s.matched).length}</p>
              <p className="text-xs text-green-500 font-semibold">employés reconnus</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-amber-600">{matchedShifts.filter(s => s.needsAccount).length}</p>
              <p className="text-xs text-amber-500 font-semibold">nouveaux comptes</p>
            </div>
          </div>

          {needsAccount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <UserPlus size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">{needsAccount} nouveau{needsAccount > 1 ? 'x' : ''} compte{needsAccount > 1 ? 's' : ''} à créer</p>
                <p className="text-xs text-amber-600 mt-0.5">Ces employés n'existent pas encore — un compte sera créé automatiquement avec un email et mot de passe temporaires que tu pourras donner à l'employé.</p>
              </div>
            </div>
          )}

          {warning && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <AlertTriangle size={14} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500">{warning}</p>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {matchedShifts.map((s, i) => (
              <div
                key={i}
                onClick={() => toggleShift(i)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                  s.selected
                    ? s.needsAccount ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-100 opacity-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${s.selected ? (s.needsAccount ? 'bg-amber-400 border-amber-400' : 'bg-green-500 border-green-500') : 'border-gray-300'}`}>
                  {s.selected && <CheckCircle2 size={11} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900">{s.employeeName}</p>
                    {s.needsAccount && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                        <UserPlus size={9} /> Nouveau compte
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{s.date} · {s.start_time}–{s.end_time} · {s.department}</p>
                  {s.needsAccount && s.selected && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                        <Mail size={9} /> {s.tempEmail}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                        <Key size={9} /> {s.tempPassword}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={reset} className="btn-secondary text-sm">← Retour</button>
            <button onClick={handleImport} disabled={selectedCount === 0 || creating}
              className="btn-primary text-sm disabled:opacity-50">
              {creating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {creating ? 'Création en cours…' : `Importer ${selectedCount} shift${selectedCount > 1 ? 's' : ''}`}
              {needsAccount > 0 && !creating && ` + ${needsAccount} compte${needsAccount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && (
        <div className="space-y-5">
          <div className="py-6 text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <p className="text-lg font-black text-gray-900">Import réussi !</p>
            <p className="text-sm text-gray-400">{selectedCount} shift{selectedCount > 1 ? 's' : ''} ajouté{selectedCount > 1 ? 's' : ''} au planning</p>
          </div>

          {newAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-amber-500" />
                <p className="text-sm font-bold text-gray-800">{newAccounts.length} nouveau{newAccounts.length > 1 ? 'x' : ''} compte{newAccounts.length > 1 ? 's' : ''} créé{newAccounts.length > 1 ? 's' : ''}</p>
                <span className="text-xs text-gray-400">— donne ces identifiants à tes employés</span>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {newAccounts.map((a, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-sm font-bold text-gray-900 mb-1.5">{a.name} <span className="text-xs text-amber-600 font-normal">· {a.department}</span></p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                        <Mail size={11} className="text-gray-400" /> {a.email}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                        <Key size={11} className="text-gray-400" /> {a.password}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center">📋 Note ces identifiants avant de fermer</p>
            </div>
          )}

          <button onClick={handleClose} className="btn-primary text-sm w-full">
            ✓ Fermer
          </button>
        </div>
      )}
    </Modal>
  )
}
