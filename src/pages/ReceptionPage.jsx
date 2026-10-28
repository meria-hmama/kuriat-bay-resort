import { useState } from 'react'
import toast from 'react-hot-toast'
import BookingRow from '../components/BookingRow'
import StatusBadge from '../components/StatusBadge'
import { EmptyState, ErrorState, Skeleton, Spinner } from '../components/States'
import { useAllRooms, useBookingAction, useBookings, useMarkClean, useServices } from '../hooks/queries'
import { formatDate, todayISO } from '../lib/dates'
import { downloadInvoice } from '../lib/invoice'

function Stat({ label, value, tone }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="text-xl text-slate-900 dark:text-white">{title} <span className="text-base text-slate-600 dark:text-slate-400">({count})</span></h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export default function ReceptionPage() {
  const today = todayISO()
  const bookings = useBookings()
  const rooms = useAllRooms()
  const { data: services = [] } = useServices()
  const action = useBookingAction()
  const clean = useMarkClean()
  const [busy, setBusy] = useState(null)
  const [query, setQuery] = useState('')

  const run = async (key, fn, success) => {
    setBusy(key)
    try {
      await fn()
      if (success) toast.success(success)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  if (bookings.isPending || rooms.isPending) {
    return (
      <div className="page" role="status" aria-label="Loading front desk">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="mt-8 h-64" />
      </div>
    )
  }
  const failed = bookings.isError ? bookings : rooms.isError ? rooms : null
  if (failed) {
    return <div className="page"><ErrorState error={failed.error} onRetry={() => { bookings.refetch(); rooms.refetch() }} title="Front desk data didn't load" /></div>
  }

  const all = bookings.data
  const arrivals = all.filter((b) => b.status === 'confirmed' && b.checkIn <= today && b.checkOut > today)
  const inHouse = all.filter((b) => b.status === 'checked_in').sort((a, b) => a.checkOut.localeCompare(b.checkOut))
  const departures = inHouse.filter((b) => b.checkOut <= today)
  const toClean = rooms.data.filter((r) => r.status === 'Cleaning')
  const roomById = Object.fromEntries(rooms.data.map((r) => [r.id, r]))

  const q = query.trim().toLowerCase()
  const results = q
    ? all.filter((b) => b.guestName.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.roomName.toLowerCase().includes(q)).slice(0, 10)
    : []

  const bookingActions = (b) => {
    const list = []
    if (b.status === 'confirmed' && b.checkIn <= today) {
      list.push({ key: 'check-in', label: 'Check in', primary: true, onClick: () => run(`${b.id}:check-in`, () => action.mutateAsync({ id: b.id, action: 'check-in' }), `${b.guestName} checked in`) })
    }
    if (b.status === 'checked_in') {
      list.push({ key: 'check-out', label: 'Check out', primary: true, onClick: () => run(`${b.id}:check-out`, () => action.mutateAsync({ id: b.id, action: 'check-out' }), `${b.guestName} checked out, room sent to cleaning`) })
    }
    if (b.status === 'confirmed') {
      list.push({ key: 'cancel', label: 'Cancel', confirm: 'Cancel?', onClick: () => run(`${b.id}:cancel`, () => action.mutateAsync({ id: b.id, action: 'cancel' }), 'Booking cancelled') })
    }
    if (b.status === 'checked_out') {
      list.push({ key: 'invoice', label: 'Invoice', onClick: () => run(`${b.id}:invoice`, () => downloadInvoice(b, { rooms: rooms.data, services })) })
    }
    return list
  }

  return (
    <div className="page">
      <h1 className="text-3xl text-slate-900 dark:text-white">Front desk</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Arrivals today" value={arrivals.length} tone="text-amber-700 dark:text-amber-400" />
        <Stat label="Guests in house" value={inHouse.length} tone="text-sky-700 dark:text-sky-400" />
        <Stat label="Due to leave" value={departures.length} tone="text-slate-900 dark:text-white" />
        <Stat label="Rooms to clean" value={toClean.length} tone="text-violet-700 dark:text-violet-400" />
      </div>

      <div className="mt-8">
        <label htmlFor="desk-search" className="label">Find a booking</label>
        <input id="desk-search" type="search" className="input max-w-md" placeholder="Guest name, room or booking ref" value={query} onChange={(e) => setQuery(e.target.value)} />
        {q && (
          <div className="mt-3">
            {results.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No booking matches "{query}".</p>
            ) : (
              <ul className="space-y-3">{results.map((b) => <BookingRow key={b.id} booking={b} busy={busy} actions={bookingActions(b)} />)}</ul>
            )}
          </div>
        )}
      </div>

      <Section title="Arrivals" count={arrivals.length}>
        {arrivals.length ? (
          <ul className="space-y-3">{arrivals.map((b) => <BookingRow key={b.id} booking={b} busy={busy} actions={bookingActions(b)} />)}</ul>
        ) : (
          <EmptyState icon="🛎️" title="No more arrivals today">Everyone expected today is already checked in.</EmptyState>
        )}
      </Section>

      <Section title="In house" count={inHouse.length}>
        {inHouse.length ? (
          <ul className="space-y-3">{inHouse.map((b) => <BookingRow key={b.id} booking={b} busy={busy} actions={bookingActions(b)} />)}</ul>
        ) : (
          <EmptyState icon="🌙" title="The hotel is empty">No guest is checked in right now.</EmptyState>
        )}
      </Section>

      <Section title="Room board" count={rooms.data.length}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rooms.data.map((r) => (
            <li key={r.id} className="card flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.name}</span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{r.type} · floor {r.floor}</span>
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={r.status} />
                {r.status === 'Cleaning' && (
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-xs"
                    disabled={busy === `clean:${r.id}`}
                    onClick={() => run(`clean:${r.id}`, () => clean.mutateAsync(r.id), `${r.name} is ready`)}
                  >
                    {busy === `clean:${r.id}` && <Spinner className="h-3 w-3" />} Mark clean
                  </button>
                )}
              </div>
              {roomById[r.id] && r.status === 'Occupied' && (
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {inHouse.find((b) => b.roomId === r.id)?.guestName}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
