import { http, HttpResponse, delay } from 'msw'
import { getDb, save, resetDb, withStatus, nextId, refreshRatings } from './db'
import { services } from './data'
import { filterRooms, filtersFromParams, paginate } from '../lib/filters'
import { findConflict, todayISO } from '../lib/dates'
import { calculatePrice } from '../lib/pricing'
import { DECLINED_CARD } from '../lib/card'

const env = import.meta.env || {}
const FAIL_RATE = Number(env.VITE_MOCK_FAIL_RATE ?? 0.1)
const MIN_DELAY = Number(env.VITE_MOCK_MIN_DELAY ?? 300)
const MAX_DELAY = Number(env.VITE_MOCK_MAX_DELAY ?? 900)

// a fake "slow network" + random 500s so the loading / error states actually get used
async function network({ canFail = true } = {}) {
  await delay(MIN_DELAY + Math.random() * Math.max(0, MAX_DELAY - MIN_DELAY))
  if (canFail && Math.random() < FAIL_RATE) {
    return HttpResponse.json({ message: 'The server had a hiccup. Please try again.' }, { status: 500 })
  }
  return null
}

const error = (status, message) => HttpResponse.json({ message }, { status })

// token format is "mock.<userId>.<timestamp>", good enough for a fake backend
function currentUser(request) {
  const header = request.headers.get('Authorization') || ''
  const token = header.replace('Bearer ', '')
  const userId = token.split('.')[1]
  return getDb().users.find((u) => u.id === userId) || null
}

const publicUser = ({ password, ...rest }) => rest
const isStaff = (user) => user && (user.role === 'receptionist' || user.role === 'admin')
const activeRanges = (roomId) =>
  getDb().bookings.filter((b) => b.roomId === roomId && ['confirmed', 'checked_in'].includes(b.status))

export const handlers = [
  // ---------- auth ----------
  http.post('/api/auth/login', async ({ request }) => {
    await network({ canFail: false })
    const { email, password } = await request.json()
    const user = getDb().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
    if (!user || user.password !== password) return error(401, 'Wrong email or password')
    return HttpResponse.json({ token: `mock.${user.id}.${Date.now()}`, user: publicUser(user) })
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const fail = await network()
    if (fail) return fail
    const { name, email, password } = await request.json()
    const db = getDb()
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      return error(409, 'An account with this email already exists')
    }
    const user = { id: nextId('u'), name, email, password, role: 'guest' }
    db.users.push(user)
    save()
    return HttpResponse.json({ token: `mock.${user.id}.${Date.now()}`, user: publicUser(user) }, { status: 201 })
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await network({ canFail: false })
    const user = currentUser(request)
    return user ? HttpResponse.json(publicUser(user)) : error(401, 'Session expired')
  }),

  // ---------- rooms ----------
  http.get('/api/rooms', async ({ request }) => {
    const fail = await network()
    if (fail) return fail
    const url = new URL(request.url)
    const db = getDb()
    if (url.searchParams.get('all') === '1') return HttpResponse.json(db.rooms.map(withStatus))
    const filters = filtersFromParams(url.searchParams)
    const filtered = filterRooms(db.rooms, filters, db.bookings).map(withStatus)
    return HttpResponse.json(paginate(filtered, filters.page))
  }),

  http.get('/api/rooms/:id', async ({ params }) => {
    const fail = await network()
    if (fail) return fail
    const room = getDb().rooms.find((r) => r.id === params.id)
    return room ? HttpResponse.json(withStatus(room)) : error(404, 'Room not found')
  }),

  http.get('/api/rooms/:id/availability', async ({ params }) => {
    const fail = await network()
    if (fail) return fail
    const ranges = activeRanges(params.id)
      .filter((b) => b.checkOut > todayISO())
      .map(({ checkIn, checkOut }) => ({ checkIn, checkOut }))
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    return HttpResponse.json(ranges)
  }),

  http.post('/api/rooms', async ({ request }) => {
    const fail = await network()
    if (fail) return fail
    const user = currentUser(request)
    if (!user || user.role !== 'admin') return error(403, 'Only admins can add rooms')
    const body = await request.json()
    const room = {
      id: nextId('r'),
      name: body.name,
      type: body.type,
      price: Number(body.price),
      capacity: Number(body.capacity),
      size: Number(body.size),
      floor: Number(body.floor),
      description: body.description,
      amenities: body.amenities,
      images: body.images,
      rating: 0,
      reviewCount: 0,
      needsCleaning: false,
      createdAt: todayISO(),
    }
    getDb().rooms.push(room)
    save()
    return HttpResponse.json(withStatus(room), { status: 201 })
  }),

  http.patch('/api/rooms/:id/clean', async ({ params, request }) => {
    const fail = await network()
    if (fail) return fail
    if (!isStaff(currentUser(request))) return error(403, 'Staff only')
    const room = getDb().rooms.find((r) => r.id === params.id)
    if (!room) return error(404, 'Room not found')
    room.needsCleaning = false
    save()
    return HttpResponse.json(withStatus(room))
  }),

  // ---------- reviews (bonus) ----------
  http.get('/api/rooms/:id/reviews', async ({ params }) => {
    const fail = await network()
    if (fail) return fail
    const list = getDb().reviews.filter((r) => r.roomId === params.id).sort((a, b) => b.date.localeCompare(a.date))
    return HttpResponse.json(list)
  }),

  http.post('/api/rooms/:id/reviews', async ({ params, request }) => {
    const fail = await network()
    if (fail) return fail
    const user = currentUser(request)
    const db = getDb()
    if (!user) return error(401, 'Log in to leave a review')
    if (user.role !== 'guest') return error(403, 'Only guests can leave reviews')
    const stayed = db.bookings.some((b) => b.userId === user.id && b.roomId === params.id && b.status === 'checked_out')
    if (!stayed) return error(403, 'Only guests who completed a stay in this room can review it')
    if (db.reviews.some((r) => r.userId === user.id && r.roomId === params.id)) {
      return error(409, 'You already reviewed this room')
    }
    const { rating, comment } = await request.json()
    const [first, last = ''] = user.name.split(' ')
    const review = { id: nextId('rv'), roomId: params.id, userId: user.id, author: `${first} ${last.charAt(0)}.`.trim(), rating: Number(rating), comment, date: todayISO() }
    db.reviews.push(review)
    refreshRatings()
    save()
    return HttpResponse.json(review, { status: 201 })
  }),

  // ---------- services ----------
  http.get('/api/services', async () => {
    await network({ canFail: false })
    return HttpResponse.json(services)
  }),

  // ---------- bookings ----------
  http.get('/api/bookings', async ({ request }) => {
    const fail = await network()
    if (fail) return fail
    const user = currentUser(request)
    if (!user) return error(401, 'Please log in')
    const all = getDb().bookings
    const list = isStaff(user) ? all : all.filter((b) => b.userId === user.id)
    return HttpResponse.json([...list].sort((a, b) => b.checkIn.localeCompare(a.checkIn)))
  }),

  http.post('/api/bookings', async ({ request }) => {
    const fail = await network()
    if (fail) return fail
    const user = currentUser(request)
    if (!user) return error(401, 'Log in to book a room')
    if (user.role !== 'guest') return error(403, 'Staff accounts can\'t make bookings')
    const body = await request.json()
    const db = getDb()
    const room = db.rooms.find((r) => r.id === body.roomId)
    if (!room) return error(404, 'Room not found')
    if (!body.checkIn || !body.checkOut || body.checkOut <= body.checkIn) return error(400, 'Check-out must be after check-in')
    if (body.checkIn < todayISO()) return error(400, 'Check-in can\'t be in the past')
    if (body.guests > room.capacity) return error(400, `This room fits ${room.capacity} guests max`)
    // double check on the "server" too, someone else could have booked in the meantime
    if (findConflict(body.checkIn, body.checkOut, activeRanges(room.id))) {
      return error(409, 'Sorry, these dates were just booked by someone else')
    }
    const card = String(body.payment?.cardNumber || '').replace(/\s/g, '')
    if (card === DECLINED_CARD) return error(402, 'Your card was declined. Try another card.')

    const chosen = services.filter((s) => (body.services || []).includes(s.id))
    const price = calculatePrice({ rate: room.price, checkIn: body.checkIn, checkOut: body.checkOut, services: chosen, guests: body.guests })
    const booking = {
      id: nextId('b'),
      roomId: room.id,
      roomName: room.name,
      userId: user.id,
      guestName: body.fullName,
      email: body.email,
      phone: body.phone,
      arrivalTime: body.arrivalTime || '',
      requests: body.requests || '',
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guests: Number(body.guests),
      services: chosen.map((s) => s.id),
      total: price.total,
      status: 'confirmed',
      paid: true,
      cardLast4: card.slice(-4),
      createdAt: todayISO(),
    }
    db.bookings.push(booking)
    save()
    return HttpResponse.json(booking, { status: 201 })
  }),

  http.patch('/api/bookings/:id/:action', async ({ params, request }) => {
    const fail = await network()
    if (fail) return fail
    const user = currentUser(request)
    if (!user) return error(401, 'Please log in')
    const db = getDb()
    const booking = db.bookings.find((b) => b.id === params.id)
    if (!booking) return error(404, 'Booking not found')
    const room = db.rooms.find((r) => r.id === booking.roomId)

    if (params.action === 'cancel') {
      if (!isStaff(user) && booking.userId !== user.id) return error(403, 'Not your booking')
      if (booking.status !== 'confirmed') return error(400, 'Only upcoming bookings can be cancelled')
      booking.status = 'cancelled'
    } else if (params.action === 'check-in') {
      if (!isStaff(user)) return error(403, 'Staff only')
      if (booking.status !== 'confirmed') return error(400, 'This booking can\'t be checked in')
      if (room?.needsCleaning) return error(400, 'The room is still being cleaned')
      booking.status = 'checked_in'
    } else if (params.action === 'check-out') {
      if (!isStaff(user)) return error(403, 'Staff only')
      if (booking.status !== 'checked_in') return error(400, 'Guest is not checked in')
      booking.status = 'checked_out'
      booking.checkedOutOn = todayISO()
      if (room) room.needsCleaning = true
    } else {
      return error(400, 'Unknown action')
    }
    save()
    return HttpResponse.json(booking)
  }),

  // ---------- dev helper ----------
  http.post('/api/admin/reset', async ({ request }) => {
    if (currentUser(request)?.role !== 'admin') return error(403, 'Admins only')
    resetDb()
    return HttpResponse.json({ ok: true })
  }),
]
