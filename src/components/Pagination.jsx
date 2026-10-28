export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" className="btn-ghost px-3" disabled={page === 1} onClick={() => onPage(page - 1)}>
        ← <span className="sr-only sm:not-sr-only">Previous</span>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPage(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          className={`h-10 w-10 rounded-xl text-sm font-semibold ${
            p === page ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {p}
        </button>
      ))}
      <button type="button" className="btn-ghost px-3" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <span className="sr-only sm:not-sr-only">Next</span> →
      </button>
    </nav>
  )
}
