import { useState, useRef } from 'react'
import { ImagePlus, Loader2, CheckCircle2, AlertTriangle, Zap, Users, UserPlus, Key, Mail, Camera, X, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import api from '../../api/axios'

function slugName(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/, '')
}

function generateCredentials(name) {
  const parts = name.trim().split(/\s+/)
  const first = slugName(parts[0] ?? 'employe')
  const last  = slugName(parts[1] ?? 'nouveau')
  const email = `${first}.${last}@smartshift.fr`
  const password = 'Shift2024!'
  return { email, password }
}

export default function ImportPhotoModal({ isOpen, onClose, weekStart, employees, onImportShifts }) {
  const [step, setStep]           = useState('upload')
  const [images, setImages]       = useState([])   // [{preview, b64, name}]
  const [dragOver, setDragOver]   = useState(false)
  const [matchedShifts, setMatchedShifts] = useState([])
  const [newAccounts, setNewAccounts]     = useState([])
  const [warnings, setWarnings]   = useState([])
  const [error, setError]         = useState(null)
  const [creating, setCreating]   = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 })
  const fileRef = useRef()

  const reset = () => {
    setStep('upload'); setImages([])
    setMatchedShifts([]); setNewAccounts([]); setWarnings([]); setError(null)
    setAnalyzeProgress({ current: 0, total: 0 })
  }
  const handleClose = () => { reset(); onClose() }

  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve({ preview: e.target.result, b64: e.target.result, name: file.name })
    reader.readAsDataURL(file)
  })

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    const loaded = await Promise.all(imageFiles.map(readFile))
    setImages(prev => {
      const existing = new Set(prev.map(i => i.name))
      const toAdd = loaded.filter(i => !existing.has(i.name))
      return [...prev, ...toAdd]
    })
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
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
      const creds = !matched ? generateCredentials(s.employee_name) : null
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
    if (!images.length) return
    setStep('analyzing')
    setError(null)
    setAnalyzeProgress({ current: 0, total: images.length })

    const allShifts = []
    const allWarnings = []

    for (let i = 0; i < images.length; i++) {
      setAnalyzeProgress({ current: i + 1, total: images.length })
      try {
        const res = await api.post('/import/photo', {
          image_base64: images[i].b64,
          week_start: weekStart,
        })
        const { shifts, warning } = res.data
        if (warning) allWarnings.push(`Photo ${i + 1}: ${warning}`)
        allShifts.push(...(shifts || []))
      } catch (err) {
        allWarnings.push(`Photo ${i + 1}: ${err.response?.data?.detail ?? 'Erreur analyse'}`)
      }
    }

    // Deduplicate shifts (same employee + date + start_time)
    const seen = new Set()
    const unique = allShifts.filter(s => {
      const key = `${s.employee_name}|${s.date}|${s.start_time}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setWarnings(allWarnings)
    setMatchedShifts(matchEmployees(unique))
    setStep('review')
  }

  const toggleShift = (idx) => {
    setMatchedShifts(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s))
  }

  const toggleAll = (val) => {
    setMatchedShifts(prev => prev.map(s => ({ ...s, selected: val })))
  }

  const handleImport = async () => {
    setCreating(true)
    const created = []

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
      } catch {
        const existing = employees.find(emp => emp.email === s.tempEmail)
        if (existing) nameToId[s.employee_name] = existing.id
      }
    }

    const finalShifts = matchedShifts
      .filter(s => s.selected)
      .map(s => ({ ...s, employeeId: s.employeeId ?? nameToId[s.employee_name] ?? null }))
      .filter(s => s.employeeId)

    setNewAccounts(created)
    onImportShifts(finalShifts)
    setCreating(false)
    setStep('done')
  }

  const selectedCount  = matchedShifts.filter(s => s.selected).length
  const needsAccount   = matchedShifts.filter(s => s.selected && s.needsAccount).length

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📸 Importer depuis des photos" size="lg">

      {/* UPLOAD */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <Zap size={18} className="text-purple-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-purple-800">IA de lecture automatique — multi-photos</p>
              <p className="text-xs text-purple-600">Importe plusieurs screenshots à la fois, l'IA lit tous les plannings et les combine automatiquement</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'}`}
          >
            <Camera size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-500">Glissez vos screenshots ici</p>
            <p className="text-xs text-gray-400 mt-1">ou cliquez pour choisir</p>
            <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP — plusieurs fichiers acceptés</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Image previews */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{images.length} photo{images.length > 1 ? 's' : ''} chargée{images.length > 1 ? 's' : ''}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-semibold"
                >
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img src={img.preview} alt={img.name} className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} className="text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-[9px] text-white truncate">{img.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={handleClose} className="btn-secondary text-sm">Annuler</button>
            <button onClick={analyze} disabled={!images.length} className="btn-primary text-sm disabled:opacity-50">
              <Zap size={15} /> Analyser {images.length > 0 ? `${images.length} photo${images.length > 1 ? 's' : ''}` : ''} avec l'IA
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
          <p className="text-base font-bold text-gray-900">Analyse en cours…</p>
          <p className="text-sm text-gray-500">
            Photo {analyzeProgress.current} / {analyzeProgress.total}
          </p>
          {/* Progress bar */}
          <div className="w-48 mx-auto bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 gradient-red rounded-full transition-all duration-500"
              style={{ width: `${analyzeProgress.total ? (analyzeProgress.current / analyzeProgress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Détection des noms, horaires et départements</p>
        </div>
      )}

      {/* REVIEW */}
      {step === 'review' && (
        <div className="space-y-4">
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
                <p className="text-xs text-amber-600 mt-0.5">Ces employés n'existent pas encore — un compte sera créé automatiquement.</p>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <AlertTriangle size={12} className="text-gray-400 shrink-0" />
                  <p className="text-xs text-gray-500">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Select all / none */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{selectedCount} shift{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="text-xs text-purple-600 hover:text-purple-700 font-semibold">Tout sélectionner</button>
              <span className="text-gray-300">·</span>
              <button onClick={() => toggleAll(false)} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">Tout désélectionner</button>
            </div>
          </div>

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
            <button onClick={handleImport} disabled={selectedCount === 0 || creating} className="btn-primary text-sm disabled:opacity-50">
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

          <button onClick={handleClose} className="btn-primary text-sm w-full">✓ Fermer</button>
        </div>
      )}
    </Modal>
  )
}
