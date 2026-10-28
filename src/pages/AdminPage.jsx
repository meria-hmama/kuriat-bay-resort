import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminCharts from '../components/AdminCharts'
import AddRoomForm from '../components/AddRoomForm'
import StatusBadge from '../components/StatusBadge'
import { ErrorState, Skeleton } from '../components/States'
import { useAllRooms, useBookings } from '../hooks/queries'
import { buildAnalytics } from '../lib/analytics'
import { monthKey, todayISO } from '../lib/dates'
import { formatMoney } from '../lib/pricing'
import { api } from '../lib/api'

const shiftMonth = (key, delta) => {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

const PRESETS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '8 months', months: 8 },
]

function Kpi({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export default function AdminPage() {
  const thisMonth = monthKey(todayISO())
  const [range, setRange] = useState({ from: shiftMonth(thisMonth, -5), to: thisMonth })
  const [showForm, setShowForm] = useState(false)
  const bookings = useBookings()
  const rooms = useAllRooms()
  const qc = useQueryClient()

  const analytics = useMemo(() => {
    if (!bookings.data || !rooms.data) return null
    return buildAnalytics({ bookings: bookings.data, rooms: rooms.data, from: range.from, to: range.to })
  }, [bookings.data, rooms.data, range])

  const resetData = async () => {
    try {
      await api('/api/admin/reset', { method: 'POST' })
      qc.invalidateQueries()
      toast.success('Demo data reset')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const rangeError = range.from > range.to

  return (
    <div className="page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">How the hotel is doing.</p>
        </div>
        <form className="flex flex-wrap items-end gap-3" aria-label="Date range" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="from" className="label">From</label>
            <input id="from" type="month" className="input" max={thisMonth} value={range.from} onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="to" className="label">To</label>
            <input id="to" type="month" className="input" value={range.to} onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))} />
          </div>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn-ghost px-3" onClick={() => setRange({ from: shiftMonth(thisMonth, -(p.months - 1)), to: thisMonth })}>
                {p.label}
              </button>
            ))}
          </div>
        </form>
      </div>
      {rangeError && <p className="field-error mt-2" role="alert">"From" has to be before "To".</p>}

      {bookings.isPending || rooms.isPending ? (
        <div className="mt-6 space-y-4" role="status" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          <div className="grid gap-4 lg:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-80" />)}</div>
        </div>
      ) : bookings.isError || rooms.isError ? (
        <div className="mt-6"><ErrorState error={bookings.error || rooms.error} onRetry={() => { bookings.refetch(); rooms.refetch() }} title="Dashboard data didn't load" /></div>
      ) : (
        !rangeError && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="Revenue" value={formatMoney(analytics.kpis.totalRevenue)} hint="in the selected period" />
              <Kpi label="Avg. occupancy" value={`${analytics.kpis.avgOccupancy}%`} />
              <Kpi label="Bookings" value={analytics.kpis.bookings} />
              <Kpi label="Avg. stay" value={`${analytics.kpis.avgStay} nights`} />
            </div>
            <div className="mt-6"><AdminCharts data={analytics} /></div>
          </>
        )
      )}

      <section className="mt-10" aria-labelledby="rooms-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="rooms-title" className="text-2xl text-slate-900 dark:text-white">Rooms</h2>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={resetData}>Reset demo data</button>
            <button type="button" className="btn-primary" aria-expanded={showForm} aria-controls="add-room" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Close form' : '+ Add room'}
            </button>
          </div>
        </div>
        {showForm && (
          <div id="add-room" className="card mt-4 p-5 animate-fade-up">
            <h3 className="mb-4 text-xl text-slate-900 dark:text-white">New room</h3>
            <AddRoomForm onDone={() => setShowForm(false)} />
          </div>
        )}
        {rooms.data && (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">All rooms with price and status</caption>
              <thead className="text-left text-slate-600 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Room</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3 text-right">Price</th>
                  <th scope="col" className="px-4 py-3 text-right">Guests</th>
                  <th scope="col" className="px-4 py-3 text-right">Rating</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.data.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <th scope="row" className="px-4 py-3 text-left font-semibold">{r.name}</th>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(r.price)}</td>
                    <td className="px-4 py-3 text-right">{r.capacity}</td>
                    <td className="px-4 py-3 text-right">{r.reviewCount ? `★ ${r.rating}` : '–'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
