import { jsPDF } from 'jspdf'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Helpers temps ────────────────────────────────────────────────────────────

function fmtMin(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function parseMin(t) {
  if (!t || t === 'undefined' || !t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  return isNaN(h) || isNaN(m) ? null : h * 60 + m
}

function calcBreaks(startTime, endTime) {
  const s = parseMin(startTime)
  const e = parseMin(endTime)
  if (s === null || e === null || e <= s) {
    return { shiftStr: '—', pause1: '—', repas: '—', pause2: '—', total: '—' }
  }
  const dur = e - s
  const hh  = Math.floor(dur / 60)
  const mm  = dur % 60
  const total    = `${hh}h${String(mm).padStart(2, '0')}`
  const shiftStr = `${fmtMin(s)}–${fmtMin(e)}`

  if (dur < 240) return { shiftStr, pause1: '—', repas: '—', pause2: '—', total }

  const rs = s + Math.floor(dur / 2) - 15
  const re = rs + 30

  if (dur < 360) {
    return { shiftStr, pause1: '—', repas: `${fmtMin(rs)}–${fmtMin(re)}`, pause2: '—', total }
  }

  const p1s = s + 90
  const p1e = p1s + 15

  let pause2 = '—'
  if (dur >= 480) {
    const p2e = e - 90
    pause2 = `${fmtMin(p2e - 15)}–${fmtMin(p2e)}`
  }

  return { shiftStr, pause1: `${fmtMin(p1s)}–${fmtMin(p1e)}`, repas: `${fmtMin(rs)}–${fmtMin(re)}`, pause2, total }
}

// ─── Logo supermarché (dessiné sans image) ────────────────────────────────────

function drawStoreLogo(doc, cx, cy, storeName) {
  // Fond cercle blanc
  doc.setFillColor(255, 255, 255)
  doc.rect(cx - 14, cy - 14, 28, 28, 'F')

  // Toit du magasin (triangle simulé avec trapèze)
  doc.setFillColor(198, 22, 22)
  doc.rect(cx - 13, cy - 12, 26, 4, 'F')   // bande rouge toit

  // Corps du bâtiment
  doc.setFillColor(240, 240, 240)
  doc.rect(cx - 10, cy - 8, 20, 14, 'F')

  // Porte
  doc.setFillColor(198, 22, 22)
  doc.rect(cx - 3, cy + 1, 6, 5, 'F')

  // Vitrine gauche
  doc.setFillColor(200, 230, 255)
  doc.rect(cx - 9, cy - 5, 5, 5, 'F')

  // Vitrine droite
  doc.rect(cx + 4, cy - 5, 5, 5, 'F')

  // Sol
  doc.setFillColor(155, 10, 10)
  doc.rect(cx - 14, cy + 6, 28, 2, 'F')

  // Initiales en dessous
  const ini = (storeName || 'SS').split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 3).toUpperCase()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  doc.text(ini, cx, cy + 13, { align: 'center' })
}

function groupByDay(shifts) {
  const map = {}
  for (const s of shifts) {
    if (!s.date) continue
    if (!map[s.date]) map[s.date] = []
    map[s.date].push(s)
  }
  for (const d of Object.keys(map)) {
    map[d].sort((a, b) => {
      const at = a.startTime ?? a.start_time ?? ''
      const bt = b.startTime ?? b.start_time ?? ''
      return at.localeCompare(bt)
    })
  }
  return map
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function generatePausePDF({ shifts, storeName, logoBase64, weekLabel }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW = doc.internal.pageSize.getWidth()   // 297
  const PH = doc.internal.pageSize.getHeight()  // 210

  const byDay = groupByDay(shifts)
  const dates = Object.keys(byDay).sort()
  if (!dates.length) return

  dates.forEach((date, pageIdx) => {
    if (pageIdx > 0) doc.addPage()

    const dayShifts = byDay[date]
    let dateObj
    try { dateObj = parseISO(date) } catch { dateObj = new Date(date) }
    const dayLabel = format(dateObj, 'EEEE', { locale: fr }).toUpperCase()
    const dateLong = format(dateObj, 'd MMMM yyyy', { locale: fr })

    // ── Fond blanc ──
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, PW, PH, 'F')

    // ── Header rouge ──
    doc.setFillColor(198, 22, 22)
    doc.rect(0, 0, PW, 40, 'F')

    // Zone logo (rouge foncé)
    doc.setFillColor(155, 10, 10)
    doc.rect(0, 0, 54, 40, 'F')

    // Logo supermarché dessiné (formes basiques, aucune image)
    drawStoreLogo(doc, 27, 20, storeName)

    // Nom du magasin
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text((storeName || 'SmartShift').toUpperCase(), 60, 17)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(255, 200, 200)
    doc.text('Rapport planning — Horaire des pauses', 60, 25)

    // Coin droit
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('SmartShift Board', PW - 8, 13, { align: 'right' })

    // Semaine
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(255, 200, 200)
    const wl = (weekLabel || '').replace(/(\d{4}-\d{2}-\d{2})/g, (m) => {
      try { return format(parseISO(m), 'd MMM yyyy', { locale: fr }) } catch { return m }
    })
    doc.text(wl, PW - 8, 20, { align: 'right' })

    // ── Bandeau jour ──
    doc.setFillColor(254, 226, 226)
    doc.rect(10, 44, PW - 20, 9, 'F')
    doc.setDrawColor(198, 22, 22)
    doc.setLineWidth(0.4)
    doc.rect(10, 44, PW - 20, 9, 'S')

    doc.setTextColor(155, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${dayLabel}  —  ${dateLong}`, 15, 50.5)

    // ── Tableau ──
    const TY = 57
    const ROW = 9
    const cols = [
      { label: 'Employé',  w: 60 },
      { label: 'Shift',    w: 30 },
      { label: 'Pause 1',  w: 38 },
      { label: 'Repas',    w: 38 },
      { label: 'Pause 2',  w: 38 },
      { label: 'Total',    w: 26 },
    ]
    const TW = cols.reduce((s, c) => s + c.w, 0)
    const ML = (PW - TW) / 2

    // Calcul des X
    const xs = []
    let cx = ML
    cols.forEach(c => { xs.push(cx); cx += c.w })

    // En-tête
    doc.setFillColor(198, 22, 22)
    doc.rect(ML, TY, TW, ROW, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    cols.forEach((c, i) => {
      doc.text(c.label, xs[i] + c.w / 2, TY + 6, { align: 'center' })
    })

    // Lignes séparatrices en-tête
    doc.setDrawColor(220, 100, 100)
    doc.setLineWidth(0.2)
    for (let i = 1; i < cols.length; i++) {
      doc.line(xs[i], TY, xs[i], TY + ROW)
    }

    // Données
    dayShifts.forEach((shift, ri) => {
      const ry = TY + ROW * (ri + 1)
      const st = shift.startTime ?? shift.start_time
      const et = shift.endTime   ?? shift.end_time
      const br = calcBreaks(st, et)
      const name = (shift.employee_name ?? shift.employeeName ?? '—').slice(0, 28)

      // Fond alternant
      doc.setFillColor(ri % 2 === 0 ? 255 : 248, ri % 2 === 0 ? 255 : 248, ri % 2 === 0 ? 255 : 248)
      doc.rect(ML, ry, TW, ROW, 'F')

      // Bordure ligne
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.rect(ML, ry, TW, ROW, 'S')

      // Séparateurs colonnes
      for (let i = 1; i < cols.length; i++) {
        doc.line(xs[i], ry, xs[i], ry + ROW)
      }

      // Textes
      const cells = [name, br.shiftStr, br.pause1, br.repas, br.pause2, br.total]
      cells.forEach((txt, ci) => {
        const bold = ci === 0 || ci === 5
        const gray = txt === '—'
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setFontSize(8)
        doc.setTextColor(gray ? 180 : 30, gray ? 180 : 30, gray ? 180 : 30)
        doc.text(txt, xs[ci] + cols[ci].w / 2, ry + 6, { align: 'center' })
      })
    })

    // Bordure externe tableau
    doc.setDrawColor(198, 22, 22)
    doc.setLineWidth(0.5)
    doc.rect(ML, TY, TW, ROW * (dayShifts.length + 1), 'S')

    // ── Légende ──
    const LY = TY + ROW * (dayShifts.length + 1) + 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(140, 140, 140)
    const legtexts = [
      '• Pause 1 : 15 min (~1h30 après le début) — shift ≥ 6h',
      '• Repas : 30 min (milieu du shift) — shift ≥ 4h',
      '• Pause 2 : 15 min — shift ≥ 8h',
      '• — : shift < 4h',
    ]
    let lx = ML
    legtexts.forEach(t => {
      doc.text(t, lx, LY)
      lx += doc.getTextWidth(t) + 6
    })

    // ── Section NOTE ──
    const NY = PH - 42
    doc.setFillColor(198, 22, 22)
    doc.rect(ML, NY, 20, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOTE', ML + 3, NY + 5)

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    for (let i = 0; i < 3; i++) {
      doc.line(ML, NY + 10 + i * 8, ML + TW, NY + 10 + i * 8)
    }

    // ── Footer ──
    doc.setFillColor(155, 10, 10)
    doc.rect(0, PH - 8, PW, 8, 'F')
    doc.setTextColor(255, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(`Document interne — SmartShift Board — ${storeName || ''}`, 8, PH - 3)
    doc.text(`Page ${pageIdx + 1} / ${dates.length}`, PW - 8, PH - 3, { align: 'right' })
  })

  const safeName = (storeName || 'planning').replace(/[^a-z0-9]/gi, '_')
  doc.save(`feuille_pauses_${safeName}_${dates[0] ?? ''}.pdf`)
}
