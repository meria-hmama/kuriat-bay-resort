import { TAX_RATE, formatMoney } from '../lib/pricing'

export default function PriceBreakdown({ price, rate }) {
  if (!price.nights) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">Pick your dates to see the total.</p>
  }
  return (
    <dl className="space-y-2 text-sm" aria-live="polite">
      <div className="flex justify-between">
        <dt>{formatMoney(rate)} × {price.nights} {price.nights > 1 ? 'nights' : 'night'}</dt>
        <dd>{formatMoney(price.roomTotal)}</dd>
      </div>
      {price.services.map((s) => (
        <div key={s.id} className="flex justify-between text-slate-700 dark:text-slate-300">
          <dt>{s.name}</dt>
          <dd>{formatMoney(s.amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between text-slate-700 dark:text-slate-300">
        <dt>Taxes ({Math.round(TAX_RATE * 100)}%)</dt>
        <dd>{formatMoney(price.tax)}</dd>
      </div>
      <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
        <dt>Total</dt>
        <dd data-testid="price-total">{formatMoney(price.total)}</dd>
      </div>
    </dl>
  )
}
