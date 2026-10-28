import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Spinner } from '../components/States'
import { loginSchema } from '../lib/schemas'
import { api } from '../lib/api'
import { homeForRole, useAuthStore } from '../store/authStore'

const DEMO = [
  { role: 'Guest', email: 'guest@kuriatbay.tn', password: 'guest123' },
  { role: 'Receptionist', email: 'reception@kuriatbay.tn', password: 'desk1234' },
  { role: 'Admin', email: 'admin@kuriatbay.tn', password: 'admin123' },
]

// only allow redirects inside the app (no ?next=https://evil.com)
const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null)

export default function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, login } = useAuthStore()
  const next = safeNext(params.get('next'))

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values) => api('/api/auth/login', { method: 'POST', body: values }),
    onSuccess: (data) => {
      login(data)
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
      // a guest coming from "book" goes back to checkout, staff go to their panel
      const target = next && (data.user.role === 'guest' || !['/checkout', '/my-bookings'].includes(next)) ? next : homeForRole(data.user.role)
      navigate(target, { replace: true })
    },
    onError: (err) => toast.error(err.message),
  })

  if (user && !mutation.isPending && !mutation.isSuccess) return <Navigate to={homeForRole(user.role)} replace />

  const fillDemo = (d) => {
    setValue('email', d.email, { shouldValidate: true })
    setValue('password', d.password, { shouldValidate: true })
  }

  return (
    <div className="page max-w-md">
      <h1 className="text-3xl text-slate-900 dark:text-white">Log in</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        No account? <Link to={`/signup${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-brand-700 underline dark:text-brand-400">Sign up</Link>
      </p>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="card mt-6 space-y-4 p-6">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email" type="email" autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            aria-invalid={!!errors.email || undefined} aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && <p id="email-error" className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password" type="password" autoComplete="current-password"
            className={`input ${errors.password ? 'input-error' : ''}`}
            aria-invalid={!!errors.password || undefined} aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && <p id="password-error" className="field-error">{errors.password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full py-3" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />} {mutation.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm font-semibold">Demo accounts (click to fill)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO.map((d) => (
            <button key={d.role} type="button" className="btn-ghost px-3 py-1.5" onClick={() => fillDemo(d)}>{d.role}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
