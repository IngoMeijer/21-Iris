export function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function dateKey(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function diffDays(a, b) {
  const ms = new Date(a).setHours(0, 0, 0, 0) - new Date(b).setHours(0, 0, 0, 0)
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export const WEEKDAY_LABELS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

export function weekdayIndex(dateString) {
  // dateString = YYYY-MM-DD, returns 0..6 with monday = 0
  const d = new Date(dateString + 'T00:00:00')
  const js = d.getDay() // 0=Sun..6=Sat
  return (js + 6) % 7
}
