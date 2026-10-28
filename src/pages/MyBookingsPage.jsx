import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import BookingRow from '../components/BookingRow'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { useAllRooms, useBookingAction, useBookings, useServices } from '../hooks/queries'
import { useAuthStore } from '../store/authStore'
import { downloadInvoice } from '../lib/invoice'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', match: (b) => b.status === 'confirmed' || b.status === 'checked_in' },
  { key: 'past', label: 'Past stays', match: (b) => b.status === 'checked_out' },
  { key: 'cancelled', label: 'Cancelled', match: (b) => b.status === 'cancelled' },
]

export default function MyBookingsPage() {
  const user = useAuthStore((s) => s.user)
  const bookings = useBookings()
  const { data: rooms = [] } = useAllRooms()
  const { data: services = [] } = useServices()
  const action = useBookingAction()
  const [tab, setTab] = useState('upcoming')
  const [busy, setBusy] = useState(null)

  const run = async (b, key, fn) => {
    setBusy(`${b.id}:${key}`)
    try {
      await fn()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  const list = (bookings.data || []).filter(TABS.find((t) => t.key === tab).match)
  const upcoming = list.slice().sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  return (
    <div className="page">
      <h1 className="text-3xl text-slate-900 dark:text-white">Hi {user.name.split(' ')[0]} 👋</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Your trips to Kuriat Bay, past and future.</p>

      <div role="tablist" aria-label="Booking filter" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => {
          const count = (bookings.data || []).filter(t.match).length
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls="booking-panel"
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? 'border-brand-700 text-brand-800 dark:border-brand-400 dark:text-brand-300' : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
            >
              {t.label} {bookings.data && <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs dark:bg-slate-800">{count}</span>}
            </button>
          )
        })}
      </div>

      <div id="booking-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6">
        {bookings.isPending ? (
          <div className="space-y-3" role="status" aria-label="Loading bookings">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : bookings.isError ? (
          <ErrorState error={bookings.error} onRetry={bookings.refetch} title="Couldn't load your bookings" />
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === 'cancelled' ? '🗂️' : '🧳'}
            title={tab === 'upcoming' ? 'No upcoming trips' : tab === 'past' ? 'No past stays yet' : 'Nothing cancelled'}
            action={tab === 'upcoming' && <Link to="/" className="btn-primary">Find a room</Link>}
          >
            {tab === 'upcoming' ? 'When you book a room it will show up here.' : null}
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {(tab === 'upcoming' ? upcoming : list).map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                room
                busy={busy}
                actions={[
                  ...(b.status === 'confirmed'
                    ? [{ key: 'cancel', label: 'Cancel', confirm: 'Cancel this booking?', onClick: () => run(b, 'cancel', async () => { await action.mutateAsync({ id: b.id, action: 'cancel' }); toast.success('Booking cancelled') }) }]
                    : []),
                  ...(b.status === 'checked_out'
                    ? [{ key: 'invoice', label: 'Download invoice', primary: true, onClick: () => run(b, 'invoice', () => downloadInvoice(b, { rooms, services })) }]
                    : []),
                ]}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
