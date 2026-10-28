const styles = {
  Available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  Booked: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  Occupied: 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200',
  Cleaning: 'bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-200',
  // booking statuses use the same component
  confirmed: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  checked_in: 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200',
  checked_out: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
}

const labels = { confirmed: 'Upcoming', checked_in: 'Checked in', checked_out: 'Completed', cancelled: 'Cancelled' }

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.Available} ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  )
}
