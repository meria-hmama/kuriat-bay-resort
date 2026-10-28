import { describe, expect, it } from 'vitest'
import { calculatePrice } from './pricing'

describe('calculatePrice', () => {
  it('multiplies nights by the nightly rate and adds tax', () => {
    const p = calculatePrice({ rate: 100, checkIn: '2026-11-10', checkOut: '2026-11-13' })
    expect(p.nights).toBe(3)
    expect(p.roomTotal).toBe(300)
    expect(p.tax).toBe(21) // 300 * 7%, rounded (JS says 21.000000000000004 otherwise)
    expect(p.total).toBe(321)
  })

  it('charges services per stay, per night and per guest per night', () => {
    const services = [
      { id: 'a', name: 'Pickup', price: 60, per: 'stay' },
      { id: 'b', name: 'Parking', price: 10, per: 'night' },
      { id: 'c', name: 'Breakfast', price: 18, per: 'guest-night' },
    ]
    const p = calculatePrice({ rate: 140, checkIn: '2026-11-10', checkOut: '2026-11-12', services, guests: 2 })
    // 2 nights * 140 = 280, pickup 60, parking 20, breakfast 18*2*2 = 72
    expect(p.servicesTotal).toBe(152)
    expect(p.subtotal).toBe(432)
    expect(p.total).toBe(462.24)
  })

  it('returns 0 when the dates are missing or reversed', () => {
    expect(calculatePrice({ rate: 100, checkIn: '', checkOut: '' }).total).toBe(0)
    expect(calculatePrice({ rate: 100, checkIn: '2026-11-12', checkOut: '2026-11-10' }).nights).toBe(0)
  })
})
