// Seed data for the mock backend. The bookings are generated relative to "today"
// so the dashboard always has the last months filled in, whenever you open the app.
import { addDays, todayISO } from '../lib/dates'
import { calculatePrice } from '../lib/pricing'

const img = (id) => `https://images.unsplash.com/photo-${id}`

const PHOTOS = [
  '1611892440504-42a792e24d32', '1631049307264-da0ec9d70304', '1618773928121-c32242e63f39',
  '1590490360182-c33d57733427', '1566665797739-1674de7a421a', '1582719478250-c89cae4dc85b',
  '1578683010236-d716f9a3f461', '1595576508898-0ad5c879a061', '1584132967334-10e028bd69f7',
  '1596394516093-501ba68a0ba6', '1522771739844-6a9f6d5f14af', '1540518614846-7eded433c457',
  '1505693416388-ac5ce068fe85', '1560448204-e02f11c3d0e2', '1564501049412-61c2a3083791',
  '1586023492125-27b2c045efd7', '1600585154340-be6161a56a0c', '1598928506311-c55ded91a20c',
  '1568495248636-6432b97bd949', '1587985064135-0366536eab42', '1520250497591-112f2f40a3f4',
]



const pick = (i) => [0, 1, 2, 3].map((k) => img(PHOTOS[(i * 3 + k * 5) % PHOTOS.length]))

const AMENITIES = {
  base: ['Free Wi-Fi', 'Air conditioning', 'Smart TV'],
  nice: ['Sea view', 'Balcony', 'Mini bar', 'Bathtub', 'Coffee machine', 'Work desk', 'Kitchenette'],
}

const ROOM_SEED = [
  ['Garden Single', 'Single', 85, 1, 16, 'A small, quiet room on the garden side, two minutes from the pool. Good for solo travellers who just need a nice bed and a strong shower.'],
  ['Lagoon Double', 'Double', 140, 2, 24, 'Our classic double with a balcony over the lagoon pool and the palm trees.'],
  ['Terrace Double', 'Double', 165, 2, 26, 'Double room with a private terrace. Breakfast out there in the morning is the whole point of this one.'],
  ['Palm Deluxe', 'Deluxe', 220, 2, 32, 'Bigger room with handmade tiles, a reading corner and a rain shower.'],
  ['Sea View Deluxe', 'Deluxe', 260, 3, 34, 'Deluxe room facing the Kuriat islands. Sunrise over the sea from the balcony, every single morning.'],
  ['Kuriat Suite', 'Suite', 390, 3, 48, 'Suite with a separate living room, bathtub and a big balcony looking at the beach.'],
  ['Ribat Suite', 'Suite', 450, 4, 55, 'Our largest suite, with arches, a sofa bed and a little kitchenette for longer stays.'],
  ['Family Pool Room', 'Family', 280, 5, 45, 'Two connected rooms with direct access to the kids pool. Kids love it, parents love the soundproofing.'],
  ['Courtyard Single', 'Single', 75, 1, 14, 'The cheapest room in the house, still with the same comfy mattress and a view on the courtyard.'],
  ['Olive Double', 'Double', 130, 2, 22, 'Calm double room with olive wood furniture, close to the breakfast room.'],
  ['Rooftop Deluxe', 'Deluxe', 240, 2, 30, 'Top floor deluxe with a skylight and a view over the whole bay.'],
  ['Big Family Room', 'Family', 310, 6, 52, 'Space for six with two bathrooms. Cots available on request.'],
]

export const seedRooms = ROOM_SEED.map(([name, type, price, capacity, size, description], i) => ({
  id: `r${i + 1}`,
  name,
  type,
  price,
  capacity,
  size,
  floor: (i % 4) + 1,
  description,
  amenities: [...AMENITIES.base, ...AMENITIES.nice.filter((_, k) => (k + i) % 3 === 0)],
  images: pick(i),
  rating: 0,
  reviewCount: 0,
  needsCleaning: i === 9, // one room starts dirty so the receptionist has something to do
  createdAt: '2026-01-10',
}))

export const services = [
  { id: 's1', name: 'Breakfast on the terrace', price: 18, per: 'guest-night' },
  { id: 's2', name: 'Airport pickup (Monastir airport)', price: 60, per: 'stay' },
  { id: 's3', name: 'Late check-out (until 2pm)', price: 35, per: 'stay' },
  { id: 's4', name: 'Hammam & spa access', price: 25, per: 'night' },
  { id: 's5', name: 'Parking', price: 10, per: 'night' },
]

export const seedUsers = [
  { id: 'u1', name: 'Amira Ben Salah', email: 'guest@kuriatbay.tn', password: 'guest123', role: 'guest' },
  { id: 'u2', name: 'Karim Trabelsi', email: 'reception@kuriatbay.tn', password: 'desk1234', role: 'receptionist' },
  { id: 'u3', name: 'Leila Mansour', email: 'admin@kuriatbay.tn', password: 'admin123', role: 'admin' },
]

const FAKE_GUESTS = [
  'Yassine Gharbi', 'Sarah Klein', 'Mohamed Ayari', 'Julie Martin', 'Hiba Jlassi', 'Tom Becker',
  'Nour Haddad', 'Marco Rossi', 'Rania Chebbi', 'Ines Bouaziz', 'Lucas Petit', 'Salma Riahi',
]

// tiny seeded random so the demo data is the same on every reload
function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const makeBooking = (id, room, fields) => {
  const chosen = services.filter((s) => (fields.services || []).includes(s.id))
  const price = calculatePrice({ rate: room.price, checkIn: fields.checkIn, checkOut: fields.checkOut, services: chosen, guests: fields.guests })
  return {
    id,
    roomId: room.id,
    roomName: room.name,
    userId: null,
    phone: '+216 20 000 000',
    arrivalTime: '',
    requests: '',
    services: [],
    paid: true,
    createdAt: addDays(fields.checkIn, -14),
    ...fields,
    total: price.total,
  }
}

export function generateSeed(today = todayISO()) {
  const rand = mulberry32(42)
  const rooms = seedRooms.map((r) => ({ ...r }))
  const bookings = []
  const start = addDays(today, -240)
  let n = 1

  // fixed bookings for the demo guest, so My Bookings, invoice and reviews have something to show
  const demo = [
    { roomId: 'r2', checkIn: addDays(today, -40), checkOut: addDays(today, -36), status: 'checked_out', services: ['s1'] },
    { roomId: 'r5', checkIn: addDays(today, -12), checkOut: addDays(today, -9), status: 'checked_out', services: ['s1', 's2'] },
    { roomId: 'r4', checkIn: addDays(today, 10), checkOut: addDays(today, 14), status: 'confirmed', services: ['s1'] },
  ]
  demo.forEach((d) => {
    const room = rooms.find((r) => r.id === d.roomId)
    bookings.push(makeBooking(`b${n++}`, room, {
      ...d, userId: 'u1', guestName: 'Amira Ben Salah', email: 'guest@kuriatbay.tn', guests: 2, paid: true,
    }))
  })

  rooms.forEach((room) => {
    let cursor = addDays(start, Math.floor(rand() * 5))
    while (cursor < addDays(today, 45)) {
      const nights = 1 + Math.floor(rand() * 5)
      const checkIn = cursor
      const checkOut = addDays(checkIn, nights)
      const clash = bookings.some((b) => b.roomId === room.id && b.checkIn < checkOut && checkIn < b.checkOut)
      const isFuture = checkIn > today
      // fewer bookings in the future, otherwise everything is fully booked and the search is boring
      const coversToday = checkIn <= today && today < checkOut
      if (!clash && (!isFuture || rand() < 0.35) && !(coversToday && room.needsCleaning)) {
        let status = 'checked_out'
        if (checkIn > today) status = 'confirmed'
        else if (checkOut > today) status = rand() < 0.6 ? 'checked_in' : 'confirmed'
        if (status === 'checked_out' && rand() < 0.06) status = 'cancelled'
        const name = FAKE_GUESTS[Math.floor(rand() * FAKE_GUESTS.length)]
        bookings.push(makeBooking(`b${n++}`, room, {
          checkIn,
          checkOut,
          status,
          guestName: name,
          email: `${name.split(' ')[0].toLowerCase()}@example.com`,
          guests: Math.min(room.capacity, 1 + Math.floor(rand() * room.capacity)),
          services: services.filter(() => rand() < 0.3).map((s) => s.id),
        }))
      }
      // summer is busier: shorter gaps between guests in June, July and August
      const summer = ['06', '07', '08'].includes(checkOut.slice(5, 7))
      cursor = addDays(checkOut, summer ? Math.floor(rand() * 2) : 1 + Math.floor(rand() * 5))
    }
  })

  const reviews = [
    { id: 'rv1', roomId: 'r2', userId: 'x1', author: 'Sarah K.', rating: 5, comment: 'Waking up with the pool and the sea right there is unreal. Staff were super kind too.', date: addDays(today, -60) },
    { id: 'rv2', roomId: 'r2', userId: 'x2', author: 'Yassine G.', rating: 4, comment: 'Very clean and well placed. A bit noisy on Saturday night but nothing crazy.', date: addDays(today, -31) },
    { id: 'rv3', roomId: 'r5', userId: 'x3', author: 'Marco R.', rating: 5, comment: 'Sunrise from the balcony was the highlight of our trip to Tunisia.', date: addDays(today, -20) },
    { id: 'rv4', roomId: 'r6', userId: 'x4', author: 'Ines B.', rating: 4, comment: 'Huge suite, comfy bed. Breakfast could have more variety.', date: addDays(today, -15) },
    { id: 'rv5', roomId: 'r8', userId: 'x5', author: 'Tom B.', rating: 5, comment: 'Perfect for our family of five, kids basically lived in the pool.', date: addDays(today, -8) },
  ]

  return { rooms, bookings, reviews, users: seedUsers.map((u) => ({ ...u })), seededOn: today }
}
