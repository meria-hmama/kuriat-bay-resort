// loading / empty / error building blocks used on every page

export function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />
}

export function EmptyState({ icon = '🛏️', title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">{icon}</div>
      <h2 className="text-xl text-slate-900 dark:text-white">{title}</h2>
      {children && <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div role="alert" className="card flex flex-col items-center border-red-200 px-6 py-10 text-center dark:border-red-900">
      <div className="mb-3 text-4xl" aria-hidden="true">⚠️</div>
      <h2 className="text-xl text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <button type="button" className="btn-primary mt-5" onClick={() => onRetry()}>
          Try again
        </button>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-700 dark:text-brand-400" role="status">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">Loading page</span>
    </div>
  )
}
