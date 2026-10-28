import { addDays, daysInMonth, monthKey, nightsBetween } from './dates'

const counted = (b) => ['confirmed', 'checked_in', 'checked_out'].includes(b.status)

export function monthsBetween(fromKey, toKey) {
  const out = []
  let [y, m] = fromKey.split('-').map(Number)
  const [ty, tm] = toKey.split('-').map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) { m = 1; y += 1 }
    if (out.length > 36) break // safety net
  }
  return out
}

// nights of a booking that fall inside a given month
function nightsInMonth(booking, key) {
  let n = 0
  for (let d = booking.checkIn; d < booking.checkOut; d = addDays(d, 1)) {
    if (monthKey(d) === key) n += 1
  }
  return n
}

export function buildAnalytics({ bookings, rooms, from, to }) {
  const months = monthsBetween(from, to)
  const valid = bookings.filter(counted)

  const monthly = months.map((key) => {
    const booked = valid.reduce((sum, b) => sum + nightsInMonth(b, key), 0)
    const available = rooms.length * daysInMonth(key)
    // revenue is counted in the month the guest checks in, simpler for a dashboard
    const revenue = valid.filter((b) => monthKey(b.checkIn) === key).reduce((s, b) => s + b.total, 0)
    return {
      month: key,
      occupancy: available ? Math.round((booked / available) * 1000) / 10 : 0,
      revenue: Math.round(revenue),
    }
  })

  const inRange = valid.filter((b) => monthKey(b.checkIn) >= from && monthKey(b.checkIn) <= to)
  const roomType = Object.fromEntries(rooms.map((r) => [r.id, r.type]))
  const byTypeMap = {}
  inRange.forEach((b) => {
    const t = roomType[b.roomId] || 'Other'
    byTypeMap[t] = (byTypeMap[t] || 0) + 1
  })
  const byType = Object.entries(byTypeMap).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)

  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0)
  const avgOccupancy = monthly.length ? Math.round((monthly.reduce((s, m) => s + m.occupancy, 0) / monthly.length) * 10) / 10 : 0
  const totalNights = inRange.reduce((s, b) => s + nightsBetween(b.checkIn, b.checkOut), 0)

  return {
    monthly,
    byType,
    kpis: {
      totalRevenue,
      avgOccupancy,
      bookings: inRange.length,
      avgStay: inRange.length ? Math.round((totalNights / inRange.length) * 10) / 10 : 0,
    },
  }
}
