import { useSearchParams } from 'react-router-dom'
import Filters from '../components/Filters'
import RoomCard, { RoomCardSkeleton } from '../components/RoomCard'
import Pagination from '../components/Pagination'
import { EmptyState, ErrorState } from '../components/States'
import { useRooms } from '../hooks/queries'
import { defaultFilters, filtersFromParams, filtersToParams } from '../lib/filters'
import { HERO_IMAGE, imgSrcSet, imgUrl } from '../lib/images'
import { formatDate, nightsBetween } from '../lib/dates'

export default function HomePage() {
  // the URL is the single source of truth for the filters -> you can copy the link and share it
  const [params, setParams] = useSearchParams()
  const filters = filtersFromParams(params)
  const { data, isPending, isError, error, refetch, isFetching } = useRooms(filters)

  const update = (patch) => {
    const next = { ...filters, ...patch }
    if (!('page' in patch)) next.page = 1 // new filter = back to page 1
    setParams(filtersToParams(next), { replace: !('page' in patch) })
  }

  const changePage = (page) => {
    update({ page })
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
  }

  const hasDates = filters.checkIn && filters.checkOut && filters.checkOut > filters.checkIn
  const nights = hasDates ? nightsBetween(filters.checkIn, filters.checkOut) : 0
  const search = hasDates ? `?checkIn=${filters.checkIn}&checkOut=${filters.checkOut}` : ''
  const isFiltered = filtersToParams({ ...filters, page: defaultFilters.page }).toString() !== ''

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={imgUrl(HERO_IMAGE, 1600)}
          srcSet={imgSrcSet(HERO_IMAGE, [800, 1200, 1600, 2000])}
          sizes="100vw"
          alt=""
          width="1600"
          height="700"
          fetchpriority="high"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-slate-950/10" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-200">Skanes · Monastir · Tunisia</p>
          <h1 className="mt-3 max-w-xl text-4xl text-white sm:text-5xl">Sand, sea and the Kuriat islands on the horizon.</h1>
          <p className="mt-4 max-w-lg text-lg text-slate-100">
            12 rooms, a lagoon pool and a beach right in front. Pick your dates and book in two minutes.
          </p>
        </div>
      </section>

      <div className="page relative -mt-10 pt-0">
        <Filters filters={filters} onChange={update} />

        <div id="results" className="mt-8 flex flex-wrap items-baseline justify-between gap-2 scroll-mt-24">
          <h2 className="text-2xl text-slate-900 dark:text-white">
            {hasDates ? `Free from ${formatDate(filters.checkIn)} to ${formatDate(filters.checkOut)}` : 'All our rooms'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
            {data && !isError && `${data.total} ${data.total === 1 ? 'room' : 'rooms'} found${nights ? ` · ${nights} ${nights > 1 ? 'nights' : 'night'}` : ''}`}
            {isFetching && !isPending && ' · updating…'}
          </p>
        </div>

        <div className="mt-4">
          {isPending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading rooms">
              {Array.from({ length: 6 }).map((_, i) => <RoomCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} title="We couldn't load the rooms" />
          ) : data.items.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No rooms match your search"
              action={isFiltered && <button type="button" className="btn-primary" onClick={() => update({ ...defaultFilters })}>Clear all filters</button>}
            >
              Try other dates, a bigger price range or fewer guests. Summer weekends fill up fast!
            </EmptyState>
          ) : (
            <>
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
                {data.items.map((room, i) => <RoomCard key={room.id} room={room} search={search} eager={i < 3} />)}
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onPage={changePage} />
            </>
          )}
        </div>
      </div>
    </>
  )
}
