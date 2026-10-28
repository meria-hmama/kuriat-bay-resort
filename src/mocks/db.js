// Super small "database": one object kept in memory and saved to localStorage,
// so new bookings survive a page refresh. Clear it with resetDb() (there's a button
// in the admin dashboard) or by deleting the kb-db-v1 key in dev tools.
import { generateSeed } from './data'
import { deriveRoomStatus } from '../lib/roomStatus'
import { todayISO } from '../lib/dates'

const KEY = 'kb-db-v1'
let db = null

function load() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted or blocked storage, just start fresh
  }
  return generateSeed()
}

export function getDb() {
  if (!db) {
    db = load()
    refreshRatings()
  }
  return db
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    // quota exceeded (big uploaded images) - the data still lives in memory
  }
}

export function resetDb(seed) {
  db = seed || generateSeed()
  refreshRatings()
  save()
  return db
}

export function refreshRatings() {
  db.rooms.forEach((room) => {
    const list = db.reviews.filter((r) => r.roomId === room.id)
    room.reviewCount = list.length
    room.rating = list.length ? Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10 : 0
  })
}

export function withStatus(room) {
  return { ...room, status: deriveRoomStatus(room, getDb().bookings, todayISO()) }
}

export function nextId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}
