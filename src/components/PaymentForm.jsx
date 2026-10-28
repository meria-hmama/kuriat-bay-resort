import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema } from '../lib/schemas'
import { formatCardNumber } from '../lib/card'
import { formatMoney } from '../lib/pricing'
import { Spinner } from './States'

// Simulated card form (bonus). Test cards:
//   4242 4242 4242 4242 -> works
//   4000 0000 0000 0002 -> declined
export default function PaymentForm({ total, onPay, onBack }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    mode: 'onTouched',
    defaultValues: { cardName: '', cardNumber: '', expiry: '', cvc: '' },
  })

  const a11y = (name) => ({ 'aria-invalid': !!errors[name] || undefined, 'aria-describedby': errors[name] ? `${name}-error` : undefined })
  const err = (name) => errors[name] && <p id={`${name}-error`} className="field-error">{errors[name].message}</p>

  const cardField = register('cardNumber')
  const expiryField = register('expiry')

  return (
    <form onSubmit={handleSubmit(onPay)} noValidate className="space-y-4">
      <div className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-100">
        Test mode, no real payment. Use <strong>4242 4242 4242 4242</strong> (works) or <strong>4000 0000 0000 0002</strong> (declined), any future date and any CVC.
      </div>
      <div>
        <label htmlFor="cardName" className="label">Name on card</label>
        <input id="cardName" autoComplete="cc-name" className={`input ${errors.cardName ? 'input-error' : ''}`} {...a11y('cardName')} {...register('cardName')} />
        {err('cardName')}
      </div>
      <div>
        <label htmlFor="cardNumber" className="label">Card number</label>
        <input
          id="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
          className={`input ${errors.cardNumber ? 'input-error' : ''}`} {...a11y('cardNumber')}
          {...cardField}
          onChange={(e) => { e.target.value = formatCardNumber(e.target.value); cardField.onChange(e) }}
        />
        {err('cardNumber')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiry" className="label">Expiry (MM/YY)</label>
          <input
            id="expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="08/28"
            className={`input ${errors.expiry ? 'input-error' : ''}`} {...a11y('expiry')}
            {...expiryField}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
              setValue('expiry', digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits, { shouldValidate: !!errors.expiry })
            }}
          />
          {err('expiry')}
        </div>
        <div>
          <label htmlFor="cvc" className="label">CVC</label>
          <input id="cvc" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="123" className={`input ${errors.cvc ? 'input-error' : ''}`} {...a11y('cvc')} {...register('cvc')} />
          {err('cvc')}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" className="btn-ghost" onClick={onBack} disabled={isSubmitting}>← Back</button>
        <button type="submit" className="btn-primary flex-1 py-3" disabled={isSubmitting}>
          {isSubmitting ? <><Spinner /> Processing payment…</> : `Pay ${formatMoney(total)}`}
        </button>
      </div>
    </form>
  )
}
