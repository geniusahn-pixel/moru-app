// 날짜/포맷 유틸

export function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
  if (isNaN(d)) return iso
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

export function fmtDateShort(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''))
  if (isNaN(d)) return iso
  return `${d.getMonth() + 1}.${d.getDate()}`
}

export function pad(n) {
  return String(n).padStart(2, '0')
}

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 진행률(%) 계산
export function progressPct(book) {
  if (book.status === 'done') return 100
  if (!book.totalPages || book.totalPages <= 0) return 0
  const pct = Math.round((book.currentPage / book.totalPages) * 100)
  return Math.max(0, Math.min(100, pct))
}

// D-day 문자열
export function dday(iso) {
  if (!iso) return ''
  const target = new Date(iso + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target - now) / 86400000)
  if (diff === 0) return 'D-DAY'
  return diff > 0 ? `D-${diff}` : `D+${-diff}`
}
