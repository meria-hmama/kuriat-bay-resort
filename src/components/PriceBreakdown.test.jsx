import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PriceBreakdown from './PriceBreakdown'
import StatusBadge from './StatusBadge'
import { calculatePrice } from '../lib/pricing'

describe('PriceBreakdown', () => {
  it('asks for dates when no nights are selected', () => {
    render(<PriceBreakdown price={calculatePrice({ rate: 100 })} rate={100} />)
    expect(screen.getByText(/pick your dates/i)).toBeInTheDocument()
  })

  it('shows every line and the total', () => {
    const price = calculatePrice({
      rate: 100, checkIn: '2026-12-01', checkOut: '2026-12-03',
      services: [{ id: 's2', name: 'Airport pickup', price: 60, per: 'stay' }],
    })
    render(<PriceBreakdown price={price} rate={100} />)
    expect(screen.getByText(/× 2 nights/)).toBeInTheDocument()
    expect(screen.getByText('Airport pickup')).toBeInTheDocument()
    expect(screen.getByTestId('price-total')).toHaveTextContent('278.2') // (200 + 60) * 1.07
  })
})

describe('StatusBadge', () => {
  it('renders friendly labels for booking statuses', () => {
    render(<StatusBadge status="checked_out" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})
