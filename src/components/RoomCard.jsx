import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { Skeleton } from './States'
import { imgSrcSet, imgUrl } from '../lib/images'
import { formatMoney } from '../lib/pricing'

export default function RoomCard({ room, search = '', eager = false }) {
  return (
    <article className="card group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img
          src={imgUrl(room.images[0], 600)}
          srcSet={imgSrcSet(room.images[0], [400, 600, 800])}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          alt={`${room.name} room`}
          width="600"
          height="450"
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : undefined}
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <StatusBadge status={room.status} className="absolute left-3 top-3 shadow-sm" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">{room.type}</p>
            <h3 className="mt-0.5 text-xl text-slate-900 dark:text-white">
              {/* the whole card is clickable thanks to the ::after trick, but only one link for screen readers */}
              <Link to={`/rooms/${room.id}${search}`} className="after:absolute after:inset-0 focus:outline-none">
                {room.name}
              </Link>
            </h3>
          </div>
          {room.reviewCount > 0 && (
            <span className="shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-200" aria-label={`Rated ${room.rating} out of 5`}>
              <span aria-hidden="true" className="text-amber-500">★</span> {room.rating}
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{room.description}</p>
        <div className="mt-auto flex items-end justify-between pt-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {room.capacity} {room.capacity > 1 ? 'guests' : 'guest'} · {room.size} m²
          </span>
          <span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatMoney(room.price)}</span>
            <span className="text-slate-600 dark:text-slate-400"> /night</span>
          </span>
        </div>
      </div>
    </article>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  )
}
