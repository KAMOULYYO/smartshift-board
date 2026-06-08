import { jsPDF } from 'jspdf'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtMin(totalMin) {
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseMin(timeStr) {
  if (!timeStr || timeStr === 'undefined') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

function calcBreaks(startTime, endTime) {
  const start = parseMin(startTime)
  const end   = parseMin(endTime)

  if (start === null || end === null || end <= start) {
    return { pause1: '—', repas: '—', pause2: '—', total: '—', shiftStr: '—' }
  }

  const dur = end - start
  const hh  = Math.floor(dur / 60)
  const mm  = dur % 60
  const total    = `${hh}h${String(mm).padStart(2, '0')}`
  const shiftStr = `${fmtMin(start)}–${fmtMin(end)}`

  if (dur < 360) return { pause1: '—', repas: '—', pause2: '—', total, shiftStr }

  const p1s = start + 90
  const p1e = p1s + 15
  const rs  = start + Math.floor(dur / 2) - 15
  const re  = rs + 30

  let pause2 = '—'
  if (dur >= 480) {
    const p2e = end - 90
    const p2s = p2e - 15
    pause2 = `${fmtMin(p2s)}–${fmtMin(p2e)}`
  }

  return {
    shiftStr,
    pause1: `${fmtMin(p1s)}–${fmtMin(p1e)}`,
    repas:  `${fmtMin(rs)}–${fmtMin(re)}`,
    pause2,
    total,
  }
}

function groupByDay(shifts) {
  const map = {}
  for (const s of shifts) {
    const date = s.date
    if (!date) continue
    if (!map[date]) map[date] = []
    map[date].push(s)
  }
  for (const date of Object.keys(map)) {
    map[date].sort((a, b) => {
      const at = a.startTime ?? a.start_time ?? ''
      const bt = b.startTime ?? b.start_time ?? ''
      return at.localeCompare(bt)
    })
  }
  return map
}

// ─── Couleurs rouge uniquement ───────────────────────────────────────────────
const RED       = [198, 22,  22 ]
const RED_DARK  = [155, 10,  10 ]
const RED_LIGHT = [254, 226, 226]
const WHITE     = [255, 255, 255]
const DARK      = [30,  30,  30 ]
const GRAY      = [120, 120, 120]
const LGRAY     = [245, 245, 245]
const MGRAY     = [220, 220, 220]

// ─── Main export ─────────────────────────────────────────────────────────────

export function generatePausePDF({ shifts, storeName, logoBase64, weekLabel }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW  = doc.internal.pageSize.getWidth()   // 297
  const PH  = doc.internal.pageSize.getHeight()  // 210

  const byDay = groupByDay(shifts)
  const dates = Object.keys(byDay).sort()
  if (!dates.length) return

  dates.forEach((date, pageIdx) => {
    if (pageIdx > 0) doc.addPage()

    const dayShifts = byDay[date]

    let dateObj
    try { dateObj = parseISO(date) } catch { dateObj = new Date(date) }
    const dayLabel  = format(dateObj, 'EEEE', { locale: fr }).toUpperCase()
    const dateLong  = format(dateObj, 'd MMMM yyyy', { locale: fr })

    // ── Page background blanc ────────────────────────────────────────────────
    doc.setFillColor(...WHITE)
    doc.rect(0, 0, PW, PH, 'F')

    // ── Header principal ─────────────────────────────────────────────────────
    const HEADER_H = 42
    doc.setFillColor(...RED)
    doc.rect(0, 0, PW, HEADER_H, 'F')

    // Bande logo à gauche (rouge foncé)
    const LOGO_W = 55
    doc.setFillColor(...RED_DARK)
    doc.rect(0, 0, LOGO_W, HEADER_H, 'F')

    // ── Logo ─────────────────────────────────────────────────────────────────
    if (logoBase64 && logoBase64.startsWith('data:image')) {
      try {
        const ext = logoBase64.toLowerCase().includes('png') ? 'PNG' : 'JPEG'
        // Centré dans la zone logo
        doc.addImage(logoBase64, ext, 6, 5, 43, 32, undefined, 'FAST')
      } catch {
        drawTextLogo(doc, storeName, LOGO_W / 2, HEADER_H / 2)
      }
    } else {
      drawTextLogo(doc, storeName, LOGO_W / 2, HEADER_H / 2)
    }

    // ── Nom du magasin ───────────────────────────────────────────────────────
    doc.setTextColor(...WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text((storeName || 'SmartShift').toUpperCase(), LOGO_W + 8, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(255, 200, 200)
    doc.text('Rapport planning — Horaire des pauses', LOGO_W + 8, 27)

    // ── Coin haut droite ─────────────────────────────────────────────────────
    doc.setTextColor(255, 200, 200)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('SmartShift Board', PW - 10, 14, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)

    // Format weekLabel proprement
    const wl = (weekLabel || '').replace(/(\d{4}-\d{2}-\d{2})/g, (m) => {
      try { return format(parseISO(m), 'd MMM yyyy', { locale: fr }) } catch { return m }
    })
    doc.text(wl, PW - 10, 21, { align: 'right' })

    // ── Bandeau jour ─────────────────────────────────────────────────────────
    const DAY_Y = HEADER_H + 4
    doc.setFillColor(...RED_LIGHT)
    doc.rect(10, DAY_Y, PW - 20, 9, 'F')
    doc.setDrawColor(...RED)
    doc.setLineWidth(0.5)
    doc.rect(10, DAY_Y, PW - 20, 9, 'S')

    doc.setTextColor(...RED_DARK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${dayLabel}  —  ${dateLong}`, 15, DAY_Y + 6)

    // ── Tableau ──────────────────────────────────────────────────────────────
    const TBL_Y = DAY_Y + 13
    // Colonnes : Employé, Shift, Pause 1, Repas, Pause 2, Total
    const cols = [
      { label: 'Employé',    w: 62 },
      { label: 'Shift',      w: 30 },
      { label: 'Pause 1',    w: 40 },
      { label: 'Repas',      w: 40 },
      { label: 'Pause 2',    w: 40 },
      { label: 'Total',      w: 26 },
    ]
    const totalW = cols.reduce((s, c) => s + c.w, 0)  // 238
    const marginL = (PW - totalW) / 2
    const ROW_H = 9

    // Construire les X de départ
    const xs = []
    let cx = marginL
    for (const col of cols) { xs.push(cx); cx += col.w }

    // En-tête tableau
    doc.setFillColor(...RED)
    doc.rect(marginL, TBL_Y, totalW, ROW_H, 'F')

    cols.forEach((col, i) => {
      doc.setTextColor(...WHITE)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(col.label, xs[i] + col.w / 2, TBL_Y + 6, { align: 'center' })
    })

    // Séparateurs colonnes dans l'en-tête
    doc.setDrawColor(255, 150, 150)
    doc.setLineWidth(0.2)
    for (let i = 1; i < cols.length; i++) {
      doc.line(xs[i], TBL_Y, xs[i], TBL_Y + ROW_H)
    }

    // Lignes de données
    dayShifts.forEach((shift, ri) => {
      const ry = TBL_Y + ROW_H * (ri + 1)
      const st = shift.startTime ?? shift.start_time
      const et = shift.endTime   ?? shift.end_time
      const br = calcBreaks(st, et)
      const name = shift.employee_name ?? shift.employeeName ?? '—'

      // Fond alternant
      doc.setFillColor(...(ri % 2 === 0 ? WHITE : LGRAY))
      doc.rect(marginL, ry, totalW, ROW_H, 'F')

      // Bordure
      doc.setDrawColor(...MGRAY)
      doc.setLineWidth(0.2)
      doc.rect(marginL, ry, totalW, ROW_H, 'S')

      // Séparateurs colonnes
      for (let i = 1; i < cols.length; i++) {
        doc.setDrawColor(...MGRAY)
        doc.line(xs[i], ry, xs[i], ry + ROW_H)
      }

      const cells = [name, br.shiftStr, br.pause1, br.repas, br.pause2, br.total]
      cells.forEach((txt, ci) => {
        const isBold = ci === 0 || ci === cols.length - 1
        const isNA   = txt === '—'
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...(isNA ? GRAY : DARK))
        doc.text(txt, xs[ci] + cols[ci].w / 2, ry + 6, { align: 'center' })
      })
    })

    // Bordure externe du tableau
    doc.setDrawColor(...RED)
    doc.setLineWidth(0.5)
    doc.rect(marginL, TBL_Y, totalW, ROW_H * (dayShifts.length + 1), 'S')

    // ── Légende ──────────────────────────────────────────────────────────────
    const LEG_Y = TBL_Y + ROW_H * (dayShifts.length + 1) + 5
    const legends = [
      'Pause 1 : 15 min (~1h30 après le début)',
      'Repas : 30 min (milieu du shift)',
      'Pause 2 : 15 min pour les shifts ≥ 8h',
      '— : pas de pause (shift < 6h)',
    ]
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6.5)
    let lx = marginL
    legends.forEach((leg, i) => {
      doc.text(`• ${leg}`, lx, LEG_Y)
      lx += doc.getTextWidth(`• ${leg}`) + 8
    })

    // ── Section NOTE ─────────────────────────────────────────────────────────
    const NOTE_Y = PH - 40
    // Label NOTE
    doc.setFillColor(...RED)
    doc.rect(marginL, NOTE_Y, 22, 7, 'F')
    doc.setTextColor(...WHITE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOTE', marginL + 4, NOTE_Y + 5)

    // Lignes de notes
    doc.setDrawColor(...MGRAY)
    doc.setLineWidth(0.3)
    for (let i = 0; i < 3; i++) {
      const lineY = NOTE_Y + 11 + i * 8
      doc.line(marginL, lineY, marginL + totalW, lineY)
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFillColor(...RED_DARK)
    doc.rect(0, PH - 8, PW, 8, 'F')
    doc.setTextColor(255, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(`Document interne — SmartShift Board — ${storeName || ''}`, 10, PH - 3)
    doc.text(`Page ${pageIdx + 1} / ${dates.length}`, PW - 10, PH - 3, { align: 'right' })
  })

  const safeName = (storeName || 'planning').replace(/[^a-z0-9]/gi, '_')
  doc.save(`feuille_pauses_${safeName}_${dates[0] ?? ''}.pdf`)
}

// ─── Dessin logo texte ────────────────────────────────────────────────────────

function drawTextLogo(doc, name, cx, cy) {
  const initials = (name || 'S')
    .split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'SS'
  doc.setFillColor(255, 255, 255, 30)
  doc.circle(cx, cy, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(initials, cx, cy + 5, { align: 'center' })
}
