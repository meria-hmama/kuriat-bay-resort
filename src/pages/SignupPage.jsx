import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Spinner } from '../components/States'
import { signupSchema } from '../lib/schemas'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: '8+ characters with at least one number' },
  { name: 'confirm', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
]

export default function SignupPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const next = params.get('next')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: ({ confirm, ...values }) => api('/api/auth/signup', { method: 'POST', body: values }),
    onSuccess: (data) => {
      login(data)
      toast.success('Account created, welcome!')
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true })
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="page max-w-md">
      <h1 className="text-3xl text-slate-900 dark:text-white">Create an account</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Already have one? <Link to="/login" className="font-semibold text-brand-700 underline dark:text-brand-400">Log in</Link>
      </p>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="card mt-6 space-y-4 p-6">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label htmlFor={`su-${f.name}`} className="label">{f.label}</label>
            <input
              id={`su-${f.name}`} type={f.type} autoComplete={f.autoComplete}
              className={`input ${errors[f.name] ? 'input-error' : ''}`}
              aria-invalid={!!errors[f.name] || undefined}
              aria-describedby={errors[f.name] ? `su-${f.name}-error` : f.hint ? `su-${f.name}-hint` : undefined}
              {...register(f.name)}
            />
            {errors[f.name] ? (
              <p id={`su-${f.name}-error`} className="field-error">{errors[f.name].message}</p>
            ) : (
              f.hint && <p id={`su-${f.name}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">{f.hint}</p>
            )}
          </div>
        ))}
        <button type="submit" className="btn-primary w-full py-3" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />} {mutation.isPending ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-xs text-slate-600 dark:text-slate-400">New accounts are guest accounts. Staff accounts are created by the admin (well, they're in the seed data).</p>
      </form>
    </div>
  )
}
