// read-only stars
export function Stars({ value, size = 'text-base' }) {
  return (
    <span className={`${size} text-amber-500`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= Math.round(value) ? '' : 'text-slate-300 dark:text-slate-600'}>★</span>
      ))}
    </span>
  )
}

// input version = a radio group, so it works with the keyboard for free (arrow keys)
export default function StarRatingInput({ value, onChange, name = 'rating', error }) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="label">Your rating</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={n}
              checked={Number(value) === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <span className="sr-only">{n} {n > 1 ? 'stars' : 'star'}</span>
            <span
              aria-hidden="true"
              className={`block rounded text-3xl leading-none transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${
                n <= Number(value) ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300 dark:text-slate-600'
              }`}
            >
              ★
            </span>
          </label>
        ))}
      </div>
      {error && <p id={`${name}-error`} className="field-error">{error}</p>}
    </fieldset>
  )
}
