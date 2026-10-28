import { findConflict } from './dates'

export const ROOM_TYPES = ['Single', 'Double', 'Deluxe', 'Suite', 'Family']
export const PRICE_MIN = 0
export const PRICE_MAX = 800
export const PAGE_SIZE = 6

export const defaultFilters = {
  checkIn: '',
  checkOut: '',
  type: '',
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  guests: 1,
  sort: 'recommended',
  page: 1,
}

const num = (v, fallback) => {
  const n = Number(v)
  return v === null || v === '' || Number.isNaN(n) ? fallback : n
}

// URL -> filters object. Anything weird in the URL just falls back to the default.
export function filtersFromParams(params) {
  const type = params.get('type') || ''
  return {
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    type: ROOM_TYPES.includes(type) ? type : '',
    minPrice: Math.max(PRICE_MIN, num(params.get('minPrice'), PRICE_MIN)),
    maxPrice: Math.min(PRICE_MAX, num(params.get('maxPrice'), PRICE_MAX)),
    guests: Math.max(1, num(params.get('guests'), 1)),
    sort: params.get('sort') || 'recommended',
    page: Math.max(1, num(params.get('page'), 1)),
  }
}

// filters -> URL params. Default values are left out so shared links stay short.
export function filtersToParams(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return
    if (value === defaultFilters[key]) return
    params.set(key, String(value))
  })
  return params
}

// used by the mock API, kept here so I can unit test it without MSW
export function filterRooms(rooms, filters, bookings = []) {
  const f = { ...defaultFilters, ...filters }
  let result = rooms.filter((room) => {
    if (f.type && room.type !== f.type) return false
    if (room.price < f.minPrice || room.price > f.maxPrice) return false
    if (room.capacity < f.guests) return false
    if (f.checkIn && f.checkOut) {
      const ranges = bookings.filter((b) => b.roomId === room.id && ['confirmed', 'checked_in'].includes(b.status))
      if (findConflict(f.checkIn, f.checkOut, ranges)) return false
    }
    return true
  })

  if (f.sort === 'price-asc') result = [...result].sort((a, b) => a.price - b.price)
  if (f.sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price)
  if (f.sort === 'rating') result = [...result].sort((a, b) => b.rating - a.rating)
  return result
}

export function paginate(items, page = 1, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    page: current,
    totalPages,
  }
}
