import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Gallery from '../components/Gallery'
import StatusBadge from '../components/StatusBadge'
import PriceBreakdown from '../components/PriceBreakdown'
import Reviews from '../components/Reviews'
import { ErrorState, Skeleton } from '../components/States'
import { useAvailability, useRoom, useServices } from '../hooks/queries'
import { useBookingStore } from '../store/bookingStore'
import { useAuthStore } from '../store/authStore'
import { addDays, findConflict, formatDate, isValidISO, todayISO } from '../lib/dates'
import { calculatePrice, formatMoney } from '../lib/pricing'

const PER_LABEL = { night: '/night', 'guest-night': '/guest/night', stay: '/stay' }

export default function RoomDetailsPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const room = useRoom(id)
  const availability = useAvailability(id)
  const { data: services = [] } = useServices()
  const cart = useBookingStore()
  const today = todayISO()

  // put this room in the "cart", and take the dates from the search page link if there are any
  useEffect(() => {
    cart.selectRoom(id)
    const ci = params.get('checkIn')
    const co = params.get('checkOut')
    if (isValidISO(ci) && isValidISO(co) && ci >= today && co > ci) cart.setDates(ci, co)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (room.data) document.title = `${room.data.name} | Kuriat Bay Resort`
  }, [room.data])

  const booked = availability.data || []
  const conflict = findConflict(cart.checkIn, cart.checkOut, booked)
  const pastDate = cart.checkIn && cart.checkIn < today
  const orderError = cart.checkIn && cart.checkOut && cart.checkOut <= cart.checkIn
  const tooManyGuests = room.data && cart.guests > room.data.capacity
  const selectedServices = services.filter((s) => cart.services.includes(s.id))

  // recalculated on every change of dates / guests / services = the "live" price
  const price = useMemo(
    () => calculatePrice({ rate: room.data?.price || 0, checkIn: cart.checkIn, checkOut: cart.checkOut, services: selectedServices, guests: cart.guests }),
    [room.data?.price, cart.checkIn, cart.checkOut, cart.guests, selectedServices.length], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const canContinue = price.nights > 0 && !conflict && !pastDate && !orderError && !tooManyGuests && !availability.isPending
  const isStaff = user && user.role !== 'guest'

  const goToCheckout = () => {
    if (!user) navigate('/login?next=/checkout')
    else navigate('/checkout')
  }

  if (room.isPending) {
    return (
      <div className="page grid gap-8 lg:grid-cols-[1fr_380px]" role="status" aria-label="Loading room">
        <div><Skeleton className="aspect-[3/2] w-full" /><Skeleton className="mt-6 h-8 w-1/2" /><Skeleton className="mt-3 h-4 w-full" /></div>
        <Skeleton className="h-96" />
      </div>
    )
  }
  if (room.isError) {
    return (
      <div className="page">
        <ErrorState error={room.error} onRetry={room.refetch} title={room.error.status === 404 ? 'This room doesn\'t exist' : 'Couldn\'t load this room'} />
        <p className="mt-4 text-center"><Link to="/" className="text-brand-700 underline dark:text-brand-400">Back to all rooms</Link></p>
      </div>
    )
  }

  const r = room.data
  const errorId = 'booking-date-error'

  return (
    <div className="page">
      <Link to="/" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">← All rooms</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <Gallery images={r.images} name={r.name} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl text-slate-900 sm:text-4xl dark:text-white">{r.name}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {r.type} · {r.capacity} {r.capacity > 1 ? 'guests' : 'guest'} · {r.size} m² · Floor {r.floor}
            {r.reviewCount > 0 && <> · <span className="text-amber-600 dark:text-amber-400">★ {r.rating}</span> ({r.reviewCount} {r.reviewCount > 1 ? 'reviews' : 'review'})</>}
          </p>
          <p className="mt-4 leading-relaxed">{r.description}</p>

          <h2 className="mt-8 text-xl text-slate-900 dark:text-white">What's in the room</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {r.amenities.map((a) => (
              <li key={a} className="flex items-center gap-2"><span aria-hidden="true" className="text-brand-600">✓</span>{a}</li>
            ))}
          </ul>

          <Reviews roomId={r.id} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Book this room">
          <div className="card p-5">
            <p><span className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(r.price)}</span> <span className="text-slate-600 dark:text-slate-400">/ night</span></p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="checkin" className="label">Check-in</label>
                <input
                  id="checkin" type="date" className="input" min={today} value={cart.checkIn}
                  aria-invalid={!!(conflict || pastDate) || undefined}
                  aria-describedby={conflict || pastDate || orderError ? errorId : undefined}
                  onChange={(e) => {
                    const ci = e.target.value
                    cart.setDates(ci, cart.checkOut && cart.checkOut <= ci ? addDays(ci, 1) : cart.checkOut)
                  }}
                />
              </div>
              <div>
                <label htmlFor="checkout" className="label">Check-out</label>
                <input
                  id="checkout" type="date" className="input"
                  min={cart.checkIn ? addDays(cart.checkIn, 1) : addDays(today, 1)}
                  value={cart.checkOut}
                  aria-invalid={!!(conflict || orderError) || undefined}
                  aria-describedby={conflict || pastDate || orderError ? errorId : undefined}
                  onChange={(e) => cart.setDates(cart.checkIn, e.target.value)}
                />
              </div>
            </div>
            <div id={errorId} aria-live="polite">
              {pastDate && <p className="field-error">Check-in can't be in the past.</p>}
              {orderError && <p className="field-error">Check-out must be after check-in.</p>}
              {conflict && (
                <p className="field-error">
                  Sorry, the room is already booked from {formatDate(conflict.checkIn)} to {formatDate(conflict.checkOut)}. Try other dates.
                </p>
              )}
            </div>

            <div className="mt-3">
              <label htmlFor="guests" className="label">Guests</label>
              <select id="guests" className="input" value={cart.guests} onChange={(e) => cart.setGuests(e.target.value)}>
                {Array.from({ length: r.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n > 1 ? 'guests' : 'guest'}</option>)}
              </select>
            </div>

            <fieldset className="mt-4">
              <legend className="label">Extras</legend>
              <div className="space-y-2">
                {services.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={cart.services.includes(s.id)} onChange={() => cart.toggleService(s.id)} />
                      {s.name}
                    </span>
                    <span className="shrink-0 text-slate-600 dark:text-slate-400">{s.price} TND{PER_LABEL[s.per]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
              <PriceBreakdown price={price} rate={r.price} />
            </div>

            {isStaff ? (
              <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">You're logged in as staff. Log in with a guest account to book.</p>
            ) : (
              <button type="button" className="btn-primary mt-5 w-full py-3" disabled={!canContinue} onClick={goToCheckout}>
                {user ? 'Continue to checkout' : 'Log in to book'}
              </button>
            )}

            {booked.length > 0 && (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-slate-700 dark:text-slate-300">Already booked dates ({booked.length})</summary>
                <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
                  {booked.slice(0, 8).map((b) => <li key={b.checkIn}>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</li>)}
                </ul>
              </details>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
