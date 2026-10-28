import { isWithin } from './dates'

export const STATUSES = ['Available', 'Booked', 'Occupied', 'Cleaning']

// The status is not stored on the room, it's worked out from the bookings.
// That way check-in / check-out / cancel only touch the booking and every badge
// in the app updates by itself when React Query refetches the rooms.
export function deriveRoomStatus(room, bookings, today) {
  if (room.needsCleaning) return 'Cleaning'
  const mine = bookings.filter((b) => b.roomId === room.id)
  if (mine.some((b) => b.status === 'checked_in')) return 'Occupied'
  if (mine.some((b) => b.status === 'confirmed' && isWithin(today, b.checkIn, b.checkOut))) return 'Booked'
  return 'Available'
}
