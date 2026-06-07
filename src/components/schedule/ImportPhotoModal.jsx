import { useState, useRef } from 'react'
import { Upload, ImagePlus, Loader2, CheckCircle2, AlertTriangle, X, Zap, Users } from 'lucide-react'
import Modal from '../ui/Modal'
import api from '../../api/axios'

export default function ImportPhotoModal({ isOpen, onClose, weekStart, employees, onImportShifts }) {
  const [step, setStep] = useState('upload') // upload | analyzing | review | done
  const [preview, setPreview] = useState(null)
  const [imageB64, setImageB64] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [extractedShifts, setExtractedShifts] = useState([])
  const [matchedShifts, setMatchedShifts] = useState([])
  const [warning, setWarning] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const reset = () => {
    setStep('upload')
    setPreview(null)
    setImageB64(null)
    setExtractedShifts([])
    setMatchedShifts([])
    setWarning(null)
    setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setImageB64(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Match extracted employee names to real employees
  const matchEmployees = (shifts) => {
    return shifts.map(s => {
      const nameLower = s.employee_name?.toLowerCase() ?? ''
      // Try exact match first, then partial
      const matched = employees.find(e =>
        e.name.toLowerCase() === nameLower ||
        nameLower.includes(e.name.split(' ')[0]?.toLowerCase()) ||
        e.name.toLowerCase().includes(nameLower.split(' ')[0]?.toLowerCase())
      )
      return {
        ...s,
        employeeId: matched?.id ?? null,
        employeeName: matched?.name ?? s.employee_name,
        matched: !!matched,
        selected: !!matched,
      }
    })
  }

  const analyze = async () => {
    if (!imageB64) return
    setStep('analyzing')
    setError(null)
    try {
      const res = await api.post('/import/photo', {
        image_base64: imageB64,
        week_start: weekStart,
      })
      const { shifts, warning } = res.data
      if (warning) setWarning(warning)
      const matched = matchEmployees(shifts)
      setExtractedShifts(shifts)
      setMatchedShifts(matched)
      setStep('review')
    } catch (err) {
      setError(err.response?.data?.detail ?? "Erreur lors de l'analyse")
      setStep('upload')
    }
  }

  const toggleShift = (idx) => {
    setMatchedShifts(prev => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s))
  }

  const handleImport = () => {
    const toImport = matchedShifts.filter(s => s.selected && s.employeeId)
    onImportShifts(toImport)
    setStep('done')
  }

  const selectedCount = matchedShifts.filter(s => s.selected && s.employeeId).length
  const unmatchedCount = matchedShifts.filter(s => !s.matched).length

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📸 Importer depuis une photo" size="lg">
      {/* STEP: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Zap size={18} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800">IA de lecture automatique</p>
              <p className="text-xs text-blue-600">Prends une capture du planning CleverAnt → l'IA lit tous les shifts automatiquement</p>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'}`}
          >
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-xl shadow-md object-contain" />
                <p className="text-sm text-green-600 font-semibold">✓ Image chargée — prête à analyser</p>
                <p className="text-xs text-gray-400">Cliquez pour changer l'image</p>
              </div>
            ) : (
              <>
                <ImagePlus size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-bold text-gray-500">Glissez votre capture ici</p>
                <p className="text-xs text-gray-400 mt-1">ou cliquez pour choisir</p>
                <p className="text-xs text-gray-300 mt-2">PNG, JPG — screenshot de CleverAnt ou autre planning</p>
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
            <button onClick={analyze} disabled={!imageB64}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Zap size={15} /> Analyser avec l'IA
            </button>
          </div>
        </div>
      )}

      {/* STEP: Analyzing */}
      {step === 'analyzing' && (
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 gradient-red rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Loader2 size={28} className="text-white animate-spin" />
          </div>
          <p className="text-base font-bold text-gray-900">L'IA analyse votre planning…</p>
          <p className="text-sm text-gray-400">Lecture des noms, dates et horaires en cours</p>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* STEP: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">{matchedShifts.length} shifts détectés</p>
              <p className="text-xs text-gray-400">{selectedCount} sélectionnés · {unmatchedCount} employés non reconnus</p>
            </div>
            <button onClick={() => { setMatchedShifts(p => p.map(s => ({ ...s, selected: s.matched }))) }}
              className="text-xs text-red-500 font-semibold hover:text-red-600">
              Tout réinitialiser
            </button>
          </div>

          {warning && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <AlertTriangle size={15} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">{warning}</p>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {matchedShifts.map((s, i) => (
              <div
                key={i}
                onClick={() => s.matched && toggleShift(i)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  s.selected && s.matched ? 'bg-green-50 border-green-200' :
                  !s.matched ? 'bg-gray-50 border-gray-100 opacity-60' :
                  'bg-white border-gray-100'
                } ${s.matched ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'}`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${s.selected && s.matched ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {s.selected && s.matched && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate">{s.employeeName}</p>
                    {!s.matched && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">Non reconnu</span>}
                  </div>
                  <p className="text-xs text-gray-500">{s.date} · {s.start_time} → {s.end_time} · {s.department}</p>
                </div>
              </div>
            ))}
          </div>

          {unmatchedCount > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Users size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>{unmatchedCount} employé(s) non reconnu(s)</strong> — leur nom dans la photo ne correspond à aucun employé dans l'app. Créez-les d'abord dans Employés.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={reset} className="btn-secondary text-sm">← Retour</button>
            <button onClick={handleImport} disabled={selectedCount === 0}
              className="btn-primary text-sm disabled:opacity-50">
              <CheckCircle2 size={15} /> Importer {selectedCount} shift{selectedCount > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Done */}
      {step === 'done' && (
        <div className="py-10 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <p className="text-lg font-black text-gray-900">{selectedCount} shift{selectedCount > 1 ? 's' : ''} importé{selectedCount > 1 ? 's' : ''} !</p>
          <p className="text-sm text-gray-400">Le planning a été mis à jour automatiquement</p>
          <button onClick={handleClose} className="btn-primary text-sm mx-auto">Fermer</button>
        </div>
      )}
    </Modal>
  )
}
