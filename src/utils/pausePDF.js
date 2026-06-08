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
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function calcBreaks(startTime, endTime) {
  const start = parseMin(startTime)
  const end   = parseMin(endTime)
  const dur   = end - start

  const hh = Math.floor(dur / 60)
  const mm  = dur % 60
  const total = `${hh}h${String(mm).padStart(2, '0')}`

  if (dur < 360) return { pause1: '—', repas: '—', pause2: '—', total }

  // Pause 1 : ~1h30 après le début, 15 min
  const p1s = start + 90
  const p1e = p1s + 15

  // Repas : milieu du shift, 30 min
  const rs = start + Math.floor(dur / 2) - 15
  const re = rs + 30

  // Pause 2 : seulement si ≥ 8h, 1h30 avant la fin, 15 min
  let pause2 = '—'
  if (dur >= 480) {
    const p2e = end - 90
    const p2s = p2e - 15
    pause2 = `${fmtMin(p2s)}–${fmtMin(p2e)}`
  }

  return {
    pause1: `${fmtMin(p1s)}–${fmtMin(p1e)}`,
    repas:  `${fmtMin(rs)}–${fmtMin(re)}`,
    pause2,
    total,
  }
}

function groupByDay(shifts) {
  const map = {}
  for (const s of shifts) {
    if (!map[s.date]) map[s.date] = []
    map[s.date].push(s)
  }
  // Sort each day's shifts by start_time
  for (const date of Object.keys(map)) {
    map[date].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
  }
  return map
}

// ─── Couleurs ────────────────────────────────────────────────────────────────
const C = {
  primary:    [220, 38,  38],   // rouge SmartShift
  primaryDark:[185, 28,  28],
  accent:     [239, 68,  68],
  pause1:     [22,  163, 74],   // vert
  repas:      [37,  99,  235],  // bleu
  pause2:     [234, 88,  12],   // orange
  total:      [109, 40,  217],  // violet
  gray1:      [249, 250, 251],
  gray2:      [243, 244, 246],
  gray3:      [156, 163, 175],
  dark:       [17,  24,  39],
  white:      [255, 255, 255],
}

// ─── Main export ─────────────────────────────────────────────────────────────

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
    const dayLabel    = format(dateObj, 'EEEE', { locale: fr }).toUpperCase()
    const dateLabel   = format(dateObj, 'd MMMM yyyy', { locale: fr })

    // ── Background ──────────────────────────────────────────────────────────
    // Full white page
    doc.setFillColor(...C.white)
    doc.rect(0, 0, PW, PH, 'F')

    // ── Header band ─────────────────────────────────────────────────────────
    const hH = 38
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, PW, hH, 'F')

    // Accent stripe
    doc.setFillColor(...C.primaryDark)
    doc.rect(0, hH - 3, PW, 3, 'F')

    // Red left bar (logo area background)
    doc.setFillColor(...C.primaryDark)
    doc.rect(0, 0, 52, hH, 'F')

    // ── Logo or initials ────────────────────────────────────────────────────
    if (logoBase64 && logoBase64.startsWith('data:image')) {
      try {
        const ext = logoBase64.includes('png') ? 'PNG' : 'JPEG'
        doc.addImage(logoBase64, ext, 6, 6, 40, 26, undefined, 'FAST')
      } catch {
        drawInitials(doc, storeName, 26, 19)
      }
    } else {
      drawInitials(doc, storeName, 26, 19)
    }

    // ── Store name + subtitle ───────────────────────────────────────────────
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text((storeName || 'SmartShift').toUpperCase(), 58, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(255, 200, 200)
    doc.text('Rapport planning — Horaire des pauses', 58, 23)

    // Week label top right
    doc.setTextColor(...C.white)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('SmartShift Board', PW - 10, 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(255, 200, 200)
    doc.text(weekLabel || '', PW - 10, 18, { align: 'right' })

    // ── Day label pill ──────────────────────────────────────────────────────
    const pillY = hH + 6
    doc.setFillColor(...C.accent)
    roundedRect(doc, 10, pillY, PW - 20, 10, 3, 'F')
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${dayLabel}  —  ${dateLabel}`, 16, pillY + 6.5)

    // ── Table ───────────────────────────────────────────────────────────────
    const tableY = pillY + 14
    const colW   = [58, 30, 42, 42, 42, 28]  // Employé Shift P1 Repas P2 Total
    const colX   = [10]
    colW.forEach((w, i) => colX.push(colX[i] + w))
    const rowH   = 10
    const heads  = ['Employé', 'Shift', 'Pause 1', 'Repas', 'Pause 2', 'Total']
    const headColors = [C.dark, C.dark, C.pause1, C.repas, C.pause2, C.total]

    // Header row
    doc.setFillColor(240, 240, 240)
    doc.rect(10, tableY, PW - 20, rowH, 'F')
    doc.setLineWidth(0.3)
    doc.setDrawColor(220, 220, 220)
    doc.rect(10, tableY, PW - 20, rowH, 'S')

    heads.forEach((h, i) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...headColors[i])
      const cx = colX[i] + colW[i] / 2
      doc.text(h, cx, tableY + 6.5, { align: 'center' })
      if (i > 0) {
        doc.setDrawColor(220, 220, 220)
        doc.line(colX[i], tableY, colX[i], tableY + rowH)
      }
    })

    // Data rows
    dayShifts.forEach((shift, ri) => {
      const y  = tableY + rowH * (ri + 1)
      const br = calcBreaks(shift.start_time, shift.end_time)

      // Alternating row background
      doc.setFillColor(...(ri % 2 === 0 ? C.gray1 : C.gray2))
      doc.rect(10, y, PW - 20, rowH, 'F')
      doc.setDrawColor(220, 220, 220)
      doc.rect(10, y, PW - 20, rowH, 'S')

      // Col separators
      colX.slice(1, -1).forEach(x => {
        doc.setDrawColor(220, 220, 220)
        doc.line(x, y, x, y + rowH)
      })

      const cells = [
        { text: shift.employee_name || shift.employeeName || '—', color: C.dark, bold: true },
        { text: `${shift.start_time}–${shift.end_time}`, color: C.dark },
        { text: br.pause1,  color: br.pause1 !== '—' ? C.pause1 : C.gray3 },
        { text: br.repas,   color: br.repas  !== '—' ? C.repas  : C.gray3 },
        { text: br.pause2,  color: br.pause2 !== '—' ? C.pause2 : C.gray3 },
        { text: br.total,   color: C.total,  bold: true },
      ]

      cells.forEach((cell, ci) => {
        doc.setFont('helvetica', cell.bold ? 'bold' : 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...cell.color)
        const cx = colX[ci] + colW[ci] / 2
        doc.text(cell.text, cx, y + 6.5, { align: 'center' })
      })
    })

    // ── Legend ──────────────────────────────────────────────────────────────
    const legendY = tableY + rowH * (dayShifts.length + 1) + 4
    const legendItems = [
      { color: C.pause1, label: 'Pause 1 (15 min)' },
      { color: C.repas,  label: 'Repas (30 min)' },
      { color: C.pause2, label: 'Pause 2 (15 min) — shifts ≥ 8h' },
      { color: C.total,  label: 'Durée totale du shift' },
    ]
    let lx = 10
    legendItems.forEach(item => {
      doc.setFillColor(...item.color)
      doc.rect(lx, legendY, 3, 3, 'F')
      doc.setTextColor(...C.gray3)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.text(item.label, lx + 4.5, legendY + 2.5)
      lx += doc.getTextWidth(item.label) + 12
    })

    // ── Note section ────────────────────────────────────────────────────────
    const noteY = PH - 38
    doc.setFillColor(...C.accent)
    roundedRect(doc, 10, noteY, 28, 8, 2, 'F')
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('NOTE', 14, noteY + 5.5)

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(10, noteY + 12, PW - 10, noteY + 12)
    doc.line(10, noteY + 20, PW - 10, noteY + 20)
    doc.line(10, noteY + 28, PW - 10, noteY + 28)

    // ── Footer ──────────────────────────────────────────────────────────────
    doc.setFillColor(...C.primary)
    doc.rect(0, PH - 7, PW, 7, 'F')
    doc.setTextColor(...C.white)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(`Document interne — SmartShift Board — ${storeName || ''}`, 10, PH - 2.5)
    doc.text(`Page ${pageIdx + 1} / ${dates.length}`, PW - 10, PH - 2.5, { align: 'right' })
  })

  const safeName = (storeName || 'planning').replace(/[^a-z0-9]/gi, '_')
  doc.save(`feuille_pauses_${safeName}_${dates[0] ?? ''}.pdf`)
}

// ─── Helpers dessin ──────────────────────────────────────────────────────────

function drawInitials(doc, name, x, y) {
  const initials = (name || 'S')
    .split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'SS'
  doc.setFillColor(255, 255, 255, 0.15)
  doc.circle(x, y, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(initials, x, y + 4, { align: 'center' })
}

function roundedRect(doc, x, y, w, h, r, style) {
  doc.roundedRect(x, y, w, h, r, r, style)
}
