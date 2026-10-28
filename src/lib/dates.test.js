import { describe, expect, it } from 'vitest'
import { addDays, findConflict, nightsBetween, rangesOverlap } from './dates'

describe('date overlap logic', () => {
  const booked = [{ checkIn: '2026-12-10', checkOut: '2026-12-14' }]

  it('detects a selection that overlaps an existing booking', () => {
    expect(findConflict('2026-12-12', '2026-12-16', booked)).toEqual(booked[0])
    expect(findConflict('2026-12-08', '2026-12-11', booked)).toEqual(booked[0])
    expect(findConflict('2026-12-11', '2026-12-12', booked)).toEqual(booked[0]) // fully inside
    expect(findConflict('2026-12-01', '2026-12-20', booked)).toEqual(booked[0]) // fully around
  })

  it('allows checking in on the day the previous guest checks out', () => {
    expect(rangesOverlap('2026-12-14', '2026-12-16', '2026-12-10', '2026-12-14')).toBe(false)
    expect(findConflict('2026-12-05', '2026-12-10', booked)).toBeNull()
  })

  it('counts nights across months and years without timezone bugs', () => {
    expect(nightsBetween('2026-12-30', '2027-01-02')).toBe(3)
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30') // DST weekend in Europe
  })
})
