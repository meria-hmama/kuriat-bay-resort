// Price = nights x nightly rate + extra services + tax.
// Some services are charged once (airport pickup), others per night (breakfast),
// I added the "per" field after realising breakfast for 5 nights can't cost the same as for 1.

import { nightsBetween } from './dates'

export const TAX_RATE = 0.07 // 7% city/tourist tax, made up for the project

export const round2 = (n) => Math.round(n * 100) / 100

export function serviceCost(service, nights, guests = 1) {
  if (!service) return 0
  switch (service.per) {
    case 'night':
      return service.price * nights
    case 'guest-night':
      return service.price * nights * guests
    default:
      return service.price // 'stay' = flat fee
  }
}

export function calculatePrice({ rate, checkIn, checkOut, services = [], guests = 1 }) {
  const nights = Math.max(0, nightsBetween(checkIn, checkOut))
  const roomTotal = nights * (rate || 0)
  const lines = services.map((s) => ({ id: s.id, name: s.name, amount: round2(serviceCost(s, nights, guests)) }))
  const servicesTotal = lines.reduce((sum, l) => sum + l.amount, 0)
  const subtotal = roomTotal + servicesTotal
  const tax = round2(subtotal * TAX_RATE)
  return {
    nights,
    roomTotal: round2(roomTotal),
    services: lines,
    servicesTotal: round2(servicesTotal),
    subtotal: round2(subtotal),
    tax,
    total: round2(subtotal + tax),
  }
}

export function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TND', minimumFractionDigits: 0, maximumFractionDigits: 2 })
    .format(n)
}
