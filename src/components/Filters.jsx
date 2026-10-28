import { useEffect, useState } from 'react'
import { PRICE_MAX, PRICE_MIN, ROOM_TYPES, defaultFilters } from '../lib/filters'
import { addDays, todayISO } from '../lib/dates'

// The filters are "controlled" by the URL (see HomePage). This component keeps a local copy
// for the price sliders so the URL isn't rewritten 60 times per second while dragging.
export default function Filters({ filters, onChange }) {
  const [price, setPrice] = useState([filters.minPrice, filters.maxPrice])
  const today = todayISO()

  useEffect(() => setPrice([filters.minPrice, filters.maxPrice]), [filters.minPrice, filters.maxPrice])

  // small debounce on the sliders
  useEffect(() => {
    if (price[0] === filters.minPrice && price[1] === filters.maxPrice) return undefined
    const t = setTimeout(() => onChange({ minPrice: price[0], maxPrice: price[1] }), 350)
    return () => clearTimeout(t)
  }, [price]) // eslint-disable-line react-hooks/exhaustive-deps

  const dateError = filters.checkIn && filters.checkOut && filters.checkOut <= filters.checkIn

  return (
    <form className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filter rooms" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="f-checkin" className="label">Check-in</label>
        <input
          id="f-checkin"
          type="date"
          className="input"
          min={today}
          value={filters.checkIn}
          onChange={(e) => {
            const checkIn = e.target.value
            // if check-out is now before check-in, push it one night later
            const checkOut = filters.checkOut && filters.checkOut <= checkIn ? addDays(checkIn, 1) : filters.checkOut
            onChange({ checkIn, checkOut })
          }}
        />
      </div>
      <div>
        <label htmlFor="f-checkout" className="label">Check-out</label>
        <input
          id="f-checkout"
          type="date"
          className={`input ${dateError ? 'input-error' : ''}`}
          min={filters.checkIn ? addDays(filters.checkIn, 1) : addDays(today, 1)}
          value={filters.checkOut}
          aria-invalid={dateError || undefined}
          aria-describedby={dateError ? 'f-date-err' : undefined}
          onChange={(e) => onChange({ checkOut: e.target.value })}
        />
        {dateError && <p id="f-date-err" className="field-error">Check-out must be after check-in</p>}
      </div>
      <div>
        <label htmlFor="f-type" className="label">Room type</label>
        <select id="f-type" className="input" value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
          <option value="">Any type</option>
          {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-guests" className="label">Guests</label>
        <select id="f-guests" className="input" value={filters.guests} onChange={(e) => onChange({ guests: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n > 1 ? 'guests' : 'guest'}</option>)}
        </select>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="label">
          Price per night: <span className="font-semibold">{price[0]} – {price[1]} TND</span>
        </legend>
        <div className="flex items-center gap-3 pt-1">
          <label htmlFor="f-min" className="sr-only">Minimum price</label>
          <input
            id="f-min" type="range" className="w-full accent-brand-700"
            min={PRICE_MIN} max={PRICE_MAX} step={10} value={price[0]}
            onChange={(e) => setPrice(([, max]) => [Math.min(Number(e.target.value), max - 10), max])}
          />
          <label htmlFor="f-max" className="sr-only">Maximum price</label>
          <input
            id="f-max" type="range" className="w-full accent-brand-700"
            min={PRICE_MIN} max={PRICE_MAX} step={10} value={price[1]}
            onChange={(e) => setPrice(([min]) => [min, Math.max(Number(e.target.value), min + 10)])}
          />
        </div>
      </fieldset>
      <div className="flex flex-wrap items-end justify-between gap-3 sm:col-span-2 lg:col-span-6">
        <div>
          <label htmlFor="f-sort" className="label">Sort by</label>
          <select id="f-sort" className="input w-auto" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
            <option value="recommended">Recommended</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Best rated</option>
          </select>
        </div>
        <button type="button" className="btn-ghost" onClick={() => onChange({ ...defaultFilters })}>
          Reset filters
        </button>
      </div>
    </form>
  )
}
