import { useState, useEffect } from 'react'
import {
  Settings, Store, Palette, Calendar, Clock, Info,
  Save, RotateCcw, ChevronDown, ChevronUp, Sparkles,
  Tag, Globe, Shield, ImagePlus, Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import AccessDenied from '../components/ui/AccessDenied'
import { isDirector } from '../utils/permissions'

/* ── Changelog ─────────────────────────────────────────────────────────────── */
const CHANGELOG = [
  {
    version: '2.0',
    date: 'Juin 2025',
    badge: 'Majeure',
    badgeColor: 'bg-red-100 text-red-600',
    items: [
      '📺 Mode TV — affichage mural plein écran avec horloge live',
      '✍️ Signature électronique des plannings par les employés',
      '⏱️ Check-in / Check-out des shifts en temps réel',
      '🔄 Copie automatique du planning semaine précédente',
      '🌐 Page de partage planning publique (/share)',
      '📱 Tab bar mobile — navigation en bas sur téléphone',
      '💀 Skeleton loading — effet shimmer pendant le chargement',
      '🔔 PWA installable sur téléphone et bureau',
      '🚫 Page 404 personnalisée',
      '✨ Animations de transition entre les pages',
      '⚙️ Page Paramètres avec changelog',
    ],
  },
  {
    version: '1.5',
    date: 'Mai 2025',
    badge: 'Importante',
    badgeColor: 'bg-amber-100 text-amber-600',
    items: [
      '📄 Export PDF du planning hebdomadaire',
      '🗑️ Suppression des employés avec gestion des erreurs',
      '🎨 Nouveau dashboard directeur — hero banner + KPI cards',
      '📊 Graphiques bar chart + pie chart par département',
      '🔁 Anneau de couverture animé sur le dashboard',
      '🔗 Bouton de partage du planning par lien',
    ],
  },
  {
    version: '1.2',
    date: 'Avril 2025',
    badge: 'Correctifs',
    badgeColor: 'bg-blue-100 text-blue-600',
    items: [
      '🔐 Correction login premier essai (Render cold start)',
      '👤 Correction création et suppression d\'employés',
      '🔑 Mot de passe requis à la création d\'un employé',
      '🆔 Compatibilité ObjectId / UUID pour les IDs MongoDB',
      '⏳ Retry automatique après 12s si le serveur démarre',
    ],
  },
  {
    version: '1.0',
    date: 'Mars 2025',
    badge: 'Lancement',
    badgeColor: 'bg-green-100 text-green-600',
    items: [
      '🚀 Lancement initial de SmartShift Board',
      '👥 Gestion des employés (CRUD complet)',
      '📅 Planning hebdomadaire avec vue calendrier et liste',
      '🏖️ Gestion des absences avec validation',
      '🔄 Système de remplacements',
      '📋 Disponibilités des employés',
      '🏢 Vue par département',
      '🔒 Authentification JWT + RBAC (4 niveaux)',
      '📱 Interface responsive mobile',
    ],
  },
]

/* ── Paramètres par défaut ──────────────────────────────────────────────────── */
const DEFAULT_SETTINGS = {
  storeName: 'Mon Magasin',
  storeCity: '',
  primaryColor: '#D90429',
  weekStartsMonday: true,
  workDays: [1, 2, 3, 4, 5, 6], // 0=dim, 1=lun … 6=sam
  openTime: '07:00',
  closeTime: '21:00',
  currency: 'EUR',
  timezone: 'Europe/Paris',
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const COLORS = [
  { label: 'Rouge', value: '#D90429' },
  { label: 'Bleu', value: '#2563EB' },
  { label: 'Vert', value: '#16A34A' },
  { label: 'Violet', value: '#7C3AED' },
  { label: 'Orange', value: '#EA580C' },
  { label: 'Noir', value: '#111827' },
]

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function ChangelogEntry({ entry }) {
  const [open, setOpen] = useState(entry.version === CHANGELOG[0].version)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${entry.badgeColor}`}>{entry.badge}</span>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">Version {entry.version}</p>
            <p className="text-xs text-gray-400">{entry.date}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-1.5">
          {entry.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-0.5 shrink-0">{item.slice(0, 2)}</span>
              <span>{item.slice(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { appSettings, updateAppSettings } = useApp()

  if (!isDirector(user)) {
    return <AccessDenied message="Les paramètres sont réservés à la direction." />
  }

  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...appSettings }))
  const [saved, setSaved] = useState(false)
  const [logo, setLogo] = useState(() => appSettings.logo ?? null)
  const [dragOver, setDragOver] = useState(false)

  const handleLogoFile = (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Fichier image invalide'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop lourde (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = async (e) => {
      setLogo(e.target.result)
      await updateAppSettings({ logo: e.target.result })
      toast.success('Logo enregistré pour tous ✓')
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = async () => {
    setLogo(null)
    await updateAppSettings({ logo: null })
    toast.success('Logo supprimé pour tous')
  }

  const update = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const toggleDay = (day) => {
    setSettings(s => ({
      ...s,
      workDays: s.workDays.includes(day) ? s.workDays.filter(d => d !== day) : [...s.workDays, day],
    }))
  }

  const handleSave = async () => {
    await updateAppSettings({ ...settings, logo: logo ?? null })
    setSaved(true)
    toast.success('⚙️ Paramètres enregistrés pour tous ✓')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('ssb_settings')
    toast.success('Paramètres réinitialisés')
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Settings size={24} className="text-red-500" /> Paramètres
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Configuration du magasin et de l'application</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="btn-secondary text-sm">
            <RotateCcw size={15} /> Réinitialiser
          </button>
          <button onClick={handleSave} className={`btn-primary text-sm ${saved ? 'bg-green-500 hover:bg-green-600' : ''}`}>
            <Save size={15} /> {saved ? 'Enregistré ✓' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Magasin */}
      <Section icon={Store} title="Informations du magasin" subtitle="Nom et localisation affichés dans l'application">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nom du magasin</label>
            <input
              type="text" className="input-field"
              value={settings.storeName}
              onChange={e => update('storeName', e.target.value)}
              placeholder="Mon Magasin"
              maxLength={60}
            />
          </div>
          <div>
            <label className="label">Ville</label>
            <input
              type="text" className="input-field"
              value={settings.storeCity}
              onChange={e => update('storeCity', e.target.value)}
              placeholder="Paris"
              maxLength={60}
            />
          </div>
        </div>
      </Section>

      {/* Apparence */}
      <Section icon={Palette} title="Apparence" subtitle="Couleur principale de l'interface">
        <div>
          <label className="label">Couleur principale</label>
          <div className="flex flex-wrap gap-3 mt-1">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => update('primaryColor', c.value)}
                title={c.label}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${settings.primaryColor === c.value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={e => update('primaryColor', e.target.value)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5"
                title="Couleur personnalisée"
              />
              <span className="text-xs text-gray-400">Personnalisé</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Couleur actuelle : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{settings.primaryColor}</code>
            {' '}· Rechargez la page après enregistrement
          </p>
        </div>
      </Section>

      {/* Logo */}
      <Section icon={ImagePlus} title="Logo du magasin" subtitle="Affiché dans la barre latérale à la place de l'icône par défaut">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Aperçu */}
          <div className="shrink-0">
            <p className="label mb-2">Aperçu</p>
            <div className="w-16 h-16 rounded-2xl gradient-red flex items-center justify-center overflow-hidden border-2 border-gray-100">
              {logo
                ? <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
                : <span className="text-white font-bold text-2xl">S</span>
              }
            </div>
          </div>

          {/* Upload zone */}
          <div className="flex-1 w-full">
            <p className="label mb-2">Importer un logo</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleLogoFile(e.dataTransfer.files[0]) }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'}`}
              onClick={() => document.getElementById('logo-input').click()}
            >
              <ImagePlus size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-500">Glissez votre logo ici</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour choisir un fichier</p>
              <p className="text-xs text-gray-300 mt-2">PNG, JPG, SVG — max 2 Mo</p>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files[0])}
              />
            </div>
            {logo && (
              <button onClick={removeLogo} className="mt-3 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
                <Trash2 size={14} /> Supprimer le logo
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* Horaires */}
      <Section icon={Clock} title="Horaires d'ouverture" subtitle="Plages horaires du magasin">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Heure d'ouverture</label>
            <input type="time" className="input-field" value={settings.openTime} onChange={e => update('openTime', e.target.value)} />
          </div>
          <div>
            <label className="label">Heure de fermeture</label>
            <input type="time" className="input-field" value={settings.closeTime} onChange={e => update('closeTime', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Jours de travail */}
      <Section icon={Calendar} title="Jours ouvrés" subtitle="Jours où le magasin est ouvert">
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                settings.workDays.includes(i)
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {settings.workDays.length} jour{settings.workDays.length > 1 ? 's' : ''} sélectionné{settings.workDays.length > 1 ? 's' : ''}
        </p>
      </Section>

      {/* Région */}
      <Section icon={Globe} title="Région & Devise" subtitle="Paramètres régionaux">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Fuseau horaire</label>
            <select className="select-field" value={settings.timezone} onChange={e => update('timezone', e.target.value)}>
              <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
              <option value="Europe/London">Europe/London (UTC+0/+1)</option>
              <option value="America/Montreal">America/Montreal (UTC-5/-4)</option>
              <option value="Africa/Casablanca">Africa/Casablanca (UTC+0/+1)</option>
              <option value="Africa/Tunis">Africa/Tunis (UTC+1)</option>
              <option value="Africa/Algiers">Africa/Algiers (UTC+1)</option>
            </select>
          </div>
          <div>
            <label className="label">Devise</label>
            <select className="select-field" value={settings.currency} onChange={e => update('currency', e.target.value)}>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">Livre sterling (£)</option>
              <option value="CAD">Dollar canadien (CA$)</option>
              <option value="MAD">Dirham marocain (MAD)</option>
              <option value="TND">Dinar tunisien (TND)</option>
              <option value="DZD">Dinar algérien (DZD)</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Sécurité */}
      <Section icon={Shield} title="Sécurité" subtitle="Informations sur la sécurité de votre compte">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-sm font-semibold text-green-800">Authentification JWT active</p>
            </div>
            <span className="text-xs text-green-600 font-medium">Sécurisé</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-sm text-gray-700">Session expire après</p>
            <span className="text-sm font-bold text-gray-900">24 heures</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-sm text-gray-700">Rôle actuel</p>
            <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">Directeur</span>
          </div>
        </div>
      </Section>

      {/* Changelog */}
      <Section icon={Sparkles} title="Historique des versions" subtitle="Toutes les améliorations apportées à SmartShift Board">
        <div className="space-y-3">
          {CHANGELOG.map(entry => (
            <ChangelogEntry key={entry.version} entry={entry} />
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 mt-2">
          <Tag size={14} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-400">
            Version actuelle : <strong className="text-gray-600">2.0</strong> · Juin 2025 ·{' '}
            Développé avec React + FastAPI + MongoDB Atlas
          </p>
        </div>
      </Section>

    </div>
  )
}
