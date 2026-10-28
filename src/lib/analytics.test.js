import { describe, expect, it } from 'vitest'
import { buildAnalytics } from './analytics'
import { deriveRoomStatus } from './roomStatus'

describe('admin analytics', () => {
  const rooms = [{ id: 'a', type: 'Double' }, { id: 'b', type: 'Suite' }]
  const bookings = [
    { roomId: 'a', checkIn: '2026-09-28', checkOut: '2026-10-03', total: 500, status: 'checked_out' }, // 3 nights sept, 2 oct
    { roomId: 'b', checkIn: '2026-10-10', checkOut: '2026-10-12', total: 800, status: 'checked_out' },
    { roomId: 'b', checkIn: '2026-10-20', checkOut: '2026-10-25', total: 999, status: 'cancelled' }, // ignored
  ]

  it('computes occupancy, revenue and bookings by type for the range', () => {
    const { monthly, byType, kpis } = buildAnalytics({ bookings, rooms, from: '2026-09', to: '2026-10' })
    expect(monthly).toEqual([
      { month: '2026-09', occupancy: 5, revenue: 500 }, // 3 / (2 rooms * 30 days)
      { month: '2026-10', occupancy: 6.5, revenue: 800 }, // 4 / 62
    ])
    expect(byType).toEqual([{ type: 'Double', count: 1 }, { type: 'Suite', count: 1 }])
    expect(kpis.totalRevenue).toBe(1300)
  })
})

describe('room status', () => {
  const room = { id: 'r1', needsCleaning: false }
  it('follows the booking lifecycle', () => {
    expect(deriveRoomStatus(room, [], '2026-11-01')).toBe('Available')
    expect(deriveRoomStatus(room, [{ roomId: 'r1', status: 'confirmed', checkIn: '2026-11-01', checkOut: '2026-11-03' }], '2026-11-01')).toBe('Booked')
    expect(deriveRoomStatus(room, [{ roomId: 'r1', status: 'checked_in', checkIn: '2026-11-01', checkOut: '2026-11-03' }], '2026-11-01')).toBe('Occupied')
    expect(deriveRoomStatus({ ...room, needsCleaning: true }, [], '2026-11-01')).toBe('Cleaning')
  })
})
