import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import PriceBreakdown from '../components/PriceBreakdown'
import PaymentForm from '../components/PaymentForm'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { useAvailability, useCreateBooking, useRoom, useServices } from '../hooks/queries'
import { useBookingStore } from '../store/bookingStore'
import { useAuthStore } from '../store/authStore'
import { makeBookingSchema } from '../lib/schemas'
import { addDays, findConflict, formatDate, todayISO } from '../lib/dates'
import { calculatePrice } from '../lib/pricing'
import { imgUrl } from '../lib/images'

function Field({ id, label, error, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  )
}

const Steps = ({ step }) => (
  <ol className="mb-6 flex items-center gap-2 text-sm" aria-label="Checkout steps">
    {['Your details', 'Payment', 'Done'].map((label, i) => {
      const current = { details: 0, payment: 1, success: 2, failed: 1 }[step]
      return (
        <li key={label} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= current ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-slate-950' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{i + 1}</span>
          <span className={i === current ? 'font-semibold' : 'text-slate-600 dark:text-slate-400'}>{label}</span>
          {i < 2 && <span aria-hidden="true" className="mx-1 text-slate-400">—</span>}
        </li>
      )
    })}
  </ol>
)

export default function CheckoutPage() {
  const cart = useBookingStore()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const room = useRoom(cart.roomId)
  const availability = useAvailability(cart.roomId)
  const { data: services = [] } = useServices()
  const createBooking = useCreateBooking()
  const [step, setStep] = useState('details')
  const [details, setDetails] = useState(null)
  const [result, setResult] = useState(null)
  const today = todayISO()

  const schema = useMemo(() => makeBookingSchema(room.data?.capacity || 6, today), [room.data?.capacity, today])
  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      checkIn: cart.checkIn, checkOut: cart.checkOut, guests: cart.guests,
      fullName: user?.name || '', email: user?.email || '', phone: '', arrivalTime: '', requests: '',
    },
  })

  // keep the cart in sync so the price on the right updates live
  const [checkIn, checkOut, guests] = watch(['checkIn', 'checkOut', 'guests'])
  useEffect(() => { cart.setDates(checkIn, checkOut) }, [checkIn, checkOut]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cart.setGuests(guests) }, [guests]) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = services.filter((s) => cart.services.includes(s.id))
  const price = calculatePrice({ rate: room.data?.price || 0, checkIn: cart.checkIn, checkOut: cart.checkOut, services: selected, guests: Number(cart.guests) })

  if (!cart.roomId && step !== 'success') {
    return (
      <div className="page">
        <EmptyState icon="🧳" title="Nothing to check out yet" action={<Link to="/" className="btn-primary">Browse rooms</Link>}>
          Pick a room and your dates first, then come back here.
        </EmptyState>
      </div>
    )
  }
  if (step !== 'success' && room.isPending) return <div className="page"><Skeleton className="h-96" /></div>
  if (step !== 'success' && room.isError) return <div className="page"><ErrorState error={room.error} onRetry={room.refetch} /></div>

  const onDetails = (values) => {
    const conflict = findConflict(values.checkIn, values.checkOut, availability.data || [])
    if (conflict) {
      setError('checkOut', { message: `Room is booked from ${formatDate(conflict.checkIn)} to ${formatDate(conflict.checkOut)}` })
      return
    }
    setDetails(values)
    setStep('payment')
  }

  const onPay = async (payment) => {
    try {
      const booking = await createBooking.mutateAsync({
        ...details, roomId: cart.roomId, services: cart.services, guests: Number(details.guests), payment: { cardNumber: payment.cardNumber },
      })
      setResult(booking)
      setStep('success')
      cart.clear()
      toast.success('Booking confirmed!')
    } catch (err) {
      if (err.status === 402) {
        setResult({ error: err.message })
        setStep('failed')
      } else if (err.status === 409) {
        toast.error(err.message)
        setStep('details')
        availability.refetch()
      } else {
        toast.error(err.message || 'Payment failed, please try again')
      }
    }
  }

  const r = room.data
  const inputCls = (name) => `input ${errors[name] ? 'input-error' : ''}`
  const a11y = (name) => ({ 'aria-invalid': !!errors[name] || undefined, 'aria-describedby': errors[name] ? `${name}-error` : undefined })

  return (
    <div className="page">
      <h1 className="mb-4 text-3xl text-slate-900 dark:text-white">Checkout</h1>
      <Steps step={step} />

      {step === 'success' ? (
        <div className="card mx-auto max-w-lg p-8 text-center animate-fade-up" role="status">
          <div className="text-5xl" aria-hidden="true">🎉</div>
          <h2 className="mt-3 text-2xl text-slate-900 dark:text-white">You're all set!</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {result.roomName}, {formatDate(result.checkIn)} → {formatDate(result.checkOut)}. Booking ref <strong>{result.id.toUpperCase()}</strong>.
            A confirmation would be sent to {result.email} (if this was a real hotel 🙂).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn-primary" onClick={() => navigate('/my-bookings')}>See my bookings</button>
            <Link to="/" className="btn-ghost">Back to rooms</Link>
          </div>
        </div>
      ) : step === 'failed' ? (
        <div className="card mx-auto max-w-lg border-red-200 p-8 text-center dark:border-red-900" role="alert">
          <div className="text-5xl" aria-hidden="true">💳</div>
          <h2 className="mt-3 text-2xl text-slate-900 dark:text-white">Payment didn't go through</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{result?.error} Nothing was charged and the room is not booked yet.</p>
          <button type="button" className="btn-primary mt-6" onClick={() => setStep('payment')}>Try another card</button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="card p-5 sm:p-6">
            {step === 'details' ? (
              <form onSubmit={handleSubmit(onDetails)} noValidate className="grid gap-4 sm:grid-cols-2">
                <Field id="checkIn" label="Check-in" error={errors.checkIn?.message}>
                  <input id="checkIn" type="date" min={today} className={inputCls('checkIn')} {...a11y('checkIn')} {...register('checkIn')} />
                </Field>
                <Field id="checkOut" label="Check-out" error={errors.checkOut?.message}>
                  <input id="checkOut" type="date" min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)} className={inputCls('checkOut')} {...a11y('checkOut')} {...register('checkOut')} />
                </Field>
                <Field id="guests" label="Guests" error={errors.guests?.message}>
                  <select id="guests" className={inputCls('guests')} {...a11y('guests')} {...register('guests')}>
                    {Array.from({ length: r.capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field id="arrivalTime" label="Arrival time (optional)">
                  <select id="arrivalTime" className="input" {...register('arrivalTime')}>
                    <option value="">I don't know yet</option>
                    <option>Before 2pm</option>
                    <option>2pm – 6pm</option>
                    <option>6pm – 10pm</option>
                    <option>After 10pm</option>
                  </select>
                </Field>
                <Field id="fullName" label="Full name" error={errors.fullName?.message}>
                  <input id="fullName" autoComplete="name" className={inputCls('fullName')} {...a11y('fullName')} {...register('fullName')} />
                </Field>
                <Field id="email" label="Email" error={errors.email?.message}>
                  <input id="email" type="email" autoComplete="email" className={inputCls('email')} {...a11y('email')} {...register('email')} />
                </Field>
                <Field id="phone" label="Phone" error={errors.phone?.message} hint="We only call if your plans change.">
                  <input id="phone" type="tel" autoComplete="tel" placeholder="+216 20 123 456" className={inputCls('phone')} {...a11y('phone')} {...register('phone')} />
                </Field>
                <div className="sm:col-span-2">
                  <Field id="requests" label="Special requests (optional)" error={errors.requests?.message}>
                    <textarea id="requests" rows={3} className={inputCls('requests')} placeholder="Baby cot, high floor, allergies…" {...a11y('requests')} {...register('requests')} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary w-full py-3 sm:w-auto">Continue to payment</button>
                </div>
              </form>
            ) : (
              <PaymentForm total={price.total} onPay={onPay} onBack={() => setStep('details')} />
            )}
          </div>

          <aside className="card h-fit p-5" aria-label="Booking summary">
            <div className="flex gap-3">
              <img src={imgUrl(r.images[0], 200)} alt="" width="96" height="72" className="h-[72px] w-24 rounded-lg object-cover" />
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{r.type} · up to {r.capacity} guests</p>
                <Link to={`/rooms/${r.id}`} className="text-sm text-brand-700 underline dark:text-brand-400">Change extras</Link>
              </div>
            </div>
            {cart.checkIn && cart.checkOut && (
              <p className="mt-4 text-sm">{formatDate(cart.checkIn)} → {formatDate(cart.checkOut)} · {cart.guests} {Number(cart.guests) > 1 ? 'guests' : 'guest'}</p>
            )}
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <PriceBreakdown price={price} rate={r.price} />
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
