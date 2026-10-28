import { describe, expect, it } from 'vitest'
import { filterRooms, filtersFromParams, filtersToParams, paginate } from './filters'

const rooms = [
  { id: 'r1', type: 'Single', price: 80, capacity: 1, rating: 4 },
  { id: 'r2', type: 'Double', price: 140, capacity: 2, rating: 5 },
  { id: 'r3', type: 'Suite', price: 400, capacity: 4, rating: 3 },
  { id: 'r4', type: 'Double', price: 160, capacity: 2, rating: 4.5 },
]

describe('filterRooms', () => {
  it('filters by type, price range and capacity', () => {
    expect(filterRooms(rooms, { type: 'Double' }).map((r) => r.id)).toEqual(['r2', 'r4'])
    expect(filterRooms(rooms, { minPrice: 100, maxPrice: 200 }).map((r) => r.id)).toEqual(['r2', 'r4'])
    expect(filterRooms(rooms, { guests: 3 }).map((r) => r.id)).toEqual(['r3'])
  })

  it('hides rooms already booked on the chosen dates', () => {
    const bookings = [
      { roomId: 'r2', checkIn: '2026-12-10', checkOut: '2026-12-12', status: 'confirmed' },
      { roomId: 'r4', checkIn: '2026-12-10', checkOut: '2026-12-12', status: 'cancelled' }, // cancelled = free again
    ]
    const ids = filterRooms(rooms, { checkIn: '2026-12-11', checkOut: '2026-12-13' }, bookings).map((r) => r.id)
    expect(ids).toEqual(['r1', 'r3', 'r4'])
  })

  it('sorts by price', () => {
    expect(filterRooms(rooms, { sort: 'price-desc' })[0].id).toBe('r3')
  })
})

describe('URL params', () => {
  it('round-trips filters through the URL and drops default values', () => {
    const filters = { ...filtersFromParams(new URLSearchParams()), type: 'Suite', maxPrice: 500, checkIn: '2026-12-01', checkOut: '2026-12-03' }
    const params = filtersToParams(filters)
    expect(params.toString()).toBe('checkIn=2026-12-01&checkOut=2026-12-03&type=Suite&maxPrice=500')
    expect(filtersFromParams(params)).toEqual(filters)
  })

  it('ignores garbage values in the URL', () => {
    const f = filtersFromParams(new URLSearchParams('type=Castle&guests=abc&page=-3'))
    expect(f.type).toBe('')
    expect(f.guests).toBe(1)
    expect(f.page).toBe(1)
  })

  it('paginates', () => {
    const p = paginate([1, 2, 3, 4, 5, 6, 7], 2, 3)
    expect(p).toEqual({ items: [4, 5, 6], total: 7, page: 2, totalPages: 3 })
  })
})
