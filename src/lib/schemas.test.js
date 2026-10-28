import { describe, expect, it } from 'vitest'
import { makeBookingSchema, paymentSchema, validateImageFile } from './schemas'
import { luhnCheck } from './card'

const valid = {
  checkIn: '2026-12-10', checkOut: '2026-12-12', guests: 2,
  fullName: 'Meria Hmama', email: 'meria@example.com', phone: '+216 20 123 456',
}

describe('booking form validation', () => {
  const schema = makeBookingSchema(2, '2026-11-01')
  const issueFor = (data, path) => schema.safeParse(data).error?.issues.find((i) => i.path[0] === path)?.message

  it('accepts a correct booking', () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })
  it('rejects check-out before (or equal to) check-in', () => {
    expect(issueFor({ ...valid, checkOut: '2026-12-10' }, 'checkOut')).toBe('Check-out must be after check-in')
  })
  it('rejects past check-in dates and too many guests', () => {
    expect(issueFor({ ...valid, checkIn: '2026-10-01' }, 'checkIn')).toMatch(/past/)
    expect(issueFor({ ...valid, guests: 3 }, 'guests')).toMatch(/2 guests max/)
  })
})

describe('payment + upload validation', () => {
  it('checks card numbers with the Luhn algorithm', () => {
    expect(luhnCheck('4242 4242 4242 4242')).toBe(true)
    expect(luhnCheck('4242 4242 4242 4241')).toBe(false)
    const res = paymentSchema.safeParse({ cardName: 'M H', cardNumber: '1234', expiry: '01/20', cvc: '12' })
    expect(res.success).toBe(false)
    expect(res.error.issues).toHaveLength(3)
  })

  it('rejects wrong file types and files over 2 MB', () => {
    expect(validateImageFile({ type: 'image/gif', size: 1000 })).toMatch(/JPG, PNG or WEBP/)
    expect(validateImageFile({ type: 'image/png', size: 3 * 1024 * 1024 })).toMatch(/2 MB/)
    expect(validateImageFile({ type: 'image/webp', size: 500_000 })).toBe(true)
  })
})
