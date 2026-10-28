import { useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Spinner } from './States'
import { formatDate, nightsBetween } from '../lib/dates'
import { formatMoney } from '../lib/pricing'

// one booking in a list. "actions" decides which buttons show up (guest vs reception)
export default function BookingRow({ booking: b, room, actions = [], busy }) {
  const [confirming, setConfirming] = useState(null)
  const nights = nightsBetween(b.checkIn, b.checkOut)

  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {room ? (
            <Link to={`/rooms/${b.roomId}`} className="font-semibold hover:underline">{b.roomName}</Link>
          ) : (
            <span className="font-semibold">{b.roomName}</span>
          )}
          <StatusBadge status={b.status} />
        </div>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {nights} {nights > 1 ? 'nights' : 'night'} · {b.guests} {b.guests > 1 ? 'guests' : 'guest'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {b.guestName} · Ref {b.id.toUpperCase()} · {formatMoney(b.total)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) =>
          confirming === a.key ? (
            <span key={a.key} className="flex items-center gap-2 text-sm">
              {a.confirm}
              <button type="button" className="btn-danger px-3 py-1.5" onClick={() => { setConfirming(null); a.onClick() }}>Yes</button>
              <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setConfirming(null)}>No</button>
            </span>
          ) : (
            <button
              key={a.key}
              type="button"
              className={`${a.primary ? 'btn-primary' : 'btn-ghost'} px-3 py-2`}
              disabled={busy === `${b.id}:${a.key}`}
              onClick={() => (a.confirm ? setConfirming(a.key) : a.onClick())}
            >
              {busy === `${b.id}:${a.key}` && <Spinner />}
              {a.label}
            </button>
          ),
        )}
      </div>
    </li>
  )
}
