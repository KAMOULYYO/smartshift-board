import jsPDF from 'jspdf'

/* Palette départements */
const DEPT_COLORS = {
  'Caisse':            [59,  130, 246],
  'Fruits et légumes': [34,  197,  94],
  'Viande':            [239,  68,  68],
  'Boulangerie':       [245, 158,  11],
  'Épicerie':          [168,  85, 247],
  'Produits laitiers': [ 6,  182, 212],
  'Réception':         [ 99, 102, 241],
  'Administration':    [107, 114, 128],
}

function deptColor(dept) {
  return DEPT_COLORS[dept] ?? [217, 4, 41]
}

function pad(n) { return String(n).padStart(2, '0') }

function frDate(iso) {
  const [y, m, d] = iso.split('-')
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  return `${d} ${months[+m - 1]} ${y}`
}

const DAY_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

/**
 * Exporte le planning de la semaine en PDF.
 *
 * @param {object} params
 * @param {string[]} params.weekDates   - ISO dates de la semaine (lundi → dimanche)
 * @param {object[]} params.shifts      - shifts filtrés pour la semaine
 * @param {object[]} params.employees   - tous les employés
 * @param {object[]} params.absences    - toutes les absences
 * @param {object[]} params.replacements- tous les remplacements
 * @param {object}   params.user        - utilisateur courant
 */
export function exportSchedulePdf({ weekDates, shifts, employees, absences, replacements, user }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 297
  const H = doc.internal.pageSize.getHeight()  // 210

  const margin = 12
  const innerW = W - margin * 2

  // ── En-tête ───────────────────────────────────────────────────────────────
  // Fond header
  doc.setFillColor(17, 24, 39)
  doc.roundedRect(margin, margin, innerW, 22, 4, 4, 'F')

  // Accent rouge
  doc.setFillColor(217, 4, 41)
  doc.roundedRect(margin, margin, 5, 22, 2, 2, 'F')

  // Titre
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SmartShift Board', margin + 9, margin + 9)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(156, 163, 175)
  doc.text('Planning hebdomadaire', margin + 9, margin + 15)

  // Semaine + générateur (droite)
  const weekLabel = `Semaine du ${frDate(weekDates[0])} au ${frDate(weekDates[6])}`
  const genLabel  = `Généré le ${new Date().toLocaleDateString('fr-FR')} par ${user?.name ?? ''}`
  doc.setTextColor(209, 213, 219)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(weekLabel, W - margin - 2, margin + 9, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(156, 163, 175)
  doc.text(genLabel, W - margin - 2, margin + 15, { align: 'right' })

  // ── KPI row ───────────────────────────────────────────────────────────────
  const weekShifts = shifts.filter(s => weekDates.includes(s.date))
  const weekAbs    = absences.filter(a => weekDates.includes(a.date) && a.status === 'accepted')
  const openReps   = replacements.filter(r => weekDates.includes(r.date) && r.status === 'open')
  const totalHours = weekShifts.reduce((acc, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return acc + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }, 0)

  const kpis = [
    { label: 'Shifts planifiés', value: String(weekShifts.length), color: [59, 130, 246] },
    { label: 'Absences acceptées', value: String(weekAbs.length), color: weekAbs.length > 0 ? [239, 68, 68] : [34, 197, 94] },
    { label: 'Remplacements ouverts', value: String(openReps.length), color: openReps.length > 0 ? [245, 158, 11] : [34, 197, 94] },
    { label: 'Heures totales', value: `${Math.round(totalHours)}h`, color: [168, 85, 247] },
    { label: 'Employés concernés', value: String(new Set(weekShifts.map(s => s.employeeId)).size), color: [6, 182, 212] },
  ]

  const kpiW = innerW / kpis.length
  const kpiY = margin + 26

  kpis.forEach((k, i) => {
    const x = margin + i * kpiW
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(x + 1, kpiY, kpiW - 2, 13, 2, 2, 'F')
    // Barre couleur gauche
    doc.setFillColor(...k.color)
    doc.roundedRect(x + 1, kpiY, 3, 13, 1, 1, 'F')
    // Valeur
    doc.setTextColor(...k.color)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text(k.value, x + 8, kpiY + 8)
    // Label
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(k.label, x + 8, kpiY + 12)
  })

  // ── Grille planning ───────────────────────────────────────────────────────
  const gridY     = kpiY + 17
  const gridH     = H - gridY - 14
  const dayW      = innerW / 7
  const rowH      = 6
  const headerH   = 8

  // Fond grille
  doc.setFillColor(249, 250, 251)
  doc.roundedRect(margin, gridY, innerW, gridH, 3, 3, 'F')

  // En-têtes des jours
  weekDates.forEach((date, i) => {
    const x   = margin + i * dayW
    const d   = new Date(date + 'T00:00:00')
    const day = DAY_FR[d.getDay()]
    const num = pad(d.getDate())
    const isToday = date === new Date().toISOString().slice(0, 10)

    if (isToday) {
      doc.setFillColor(217, 4, 41)
      doc.roundedRect(x + 1, gridY + 1, dayW - 2, headerH - 2, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
    } else {
      doc.setFillColor(31, 41, 55)
      doc.roundedRect(x + 1, gridY + 1, dayW - 2, headerH - 2, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
    }
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(`${day} ${num}`, x + dayW / 2, gridY + 6, { align: 'center' })
  })

  // Lignes séparatrices verticales
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  for (let i = 1; i < 7; i++) {
    const x = margin + i * dayW
    doc.line(x, gridY + headerH, x, gridY + gridH)
  }

  // Shifts par jour
  const shiftsByDate = {}
  weekDates.forEach(d => { shiftsByDate[d] = [] })
  weekShifts.forEach(s => { if (shiftsByDate[s.date]) shiftsByDate[s.date].push(s) })

  weekDates.forEach((date, colIdx) => {
    const dayShifts = shiftsByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
    let cellY = gridY + headerH + 2

    dayShifts.forEach((shift) => {
      if (cellY + rowH > gridY + gridH - 2) return // overflow guard

      const emp = employees.find(e => e.id === shift.employeeId)
      const [r, g, b] = deptColor(shift.department)
      const x = margin + colIdx * dayW + 2

      // Fond coloré léger
      doc.setFillColor(r, g, b, 0.12)
      doc.setFillColor(
        Math.round(r + (255 - r) * 0.85),
        Math.round(g + (255 - g) * 0.85),
        Math.round(b + (255 - b) * 0.85),
      )
      doc.roundedRect(x, cellY, dayW - 4, rowH - 1, 1, 1, 'F')

      // Barre gauche couleur département
      doc.setFillColor(r, g, b)
      doc.rect(x, cellY, 2, rowH - 1, 'F')

      // Nom employé
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      const name = emp?.name ?? 'Inconnu'
      const truncName = name.length > 14 ? name.slice(0, 13) + '…' : name
      doc.text(truncName, x + 4, cellY + 3.5)

      // Horaire
      doc.setTextColor(r, g, b)
      doc.setFontSize(5.5)
      doc.setFont('helvetica', 'normal')
      doc.text(`${shift.startTime}–${shift.endTime}`, x + 4, cellY + 6.5 - 1.5)

      cellY += rowH + 0.5
    })

    // "n shifts" si trop de shifts
    if (shiftsByDate[date].length === 0) {
      doc.setTextColor(209, 213, 219)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text('—', margin + colIdx * dayW + dayW / 2, gridY + headerH + 8, { align: 'center' })
    }
  })

  // ── Légende départements ──────────────────────────────────────────────────
  const legendY = H - 10
  const depts   = [...new Set(weekShifts.map(s => s.department))].sort()
  let legendX   = margin

  doc.setFontSize(6)
  depts.forEach(dept => {
    const [r, g, b] = deptColor(dept)
    doc.setFillColor(r, g, b)
    doc.roundedRect(legendX, legendY - 2.5, 3, 3, 0.5, 0.5, 'F')
    doc.setTextColor(75, 85, 99)
    doc.setFont('helvetica', 'normal')
    doc.text(dept, legendX + 4, legendY)
    legendX += doc.getTextWidth(dept) + 8
  })

  // Page footer
  doc.setFontSize(6)
  doc.setTextColor(209, 213, 219)
  doc.setFont('helvetica', 'normal')
  doc.text('SmartShift Board — Document confidentiel', W / 2, legendY, { align: 'center' })

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const filename = `planning-${weekDates[0]}.pdf`
  doc.save(filename)
}
