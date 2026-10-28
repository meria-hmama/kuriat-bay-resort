// All dates in the app are plain 'YYYY-MM-DD' strings. I tried Date objects first and
// kept getting off-by-one days because of timezones (Tunis is UTC+1), so now I only
// turn them into Date objects in UTC when I need to do math.

const DAY = 24 * 60 * 60 * 1000

const pad = (n) => String(n).padStart(2, '0')

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO() {
  return toISO(new Date())
}

function toUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(iso, days) {
  const d = new Date(toUTC(iso) + days * DAY)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  return Math.round((toUTC(checkOut) - toUTC(checkIn)) / DAY)
}

export function isValidISO(iso) {
  return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(toUTC(iso))
}

// check-out day of one booking can be the check-in day of the next one,
// that's why it's a strict < and not <=
export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

// returns the first booked range that clashes with the selection, or null
export function findConflict(checkIn, checkOut, bookedRanges = []) {
  if (!checkIn || !checkOut) return null
  return bookedRanges.find((r) => rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut)) || null
}

export function isWithin(iso, start, end) {
  return iso >= start && iso < end
}

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return ''
  return new Date(toUTC(iso)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' })
}

export function monthKey(iso) {
  return iso.slice(0, 7)
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}
