import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { useBookingStore } from '../store/bookingStore'

// the links you see depend on who's logged in
const LINKS = {
  public: [{ to: '/', label: 'Rooms' }],
  guest: [{ to: '/', label: 'Rooms' }, { to: '/my-bookings', label: 'My bookings' }],
  receptionist: [{ to: '/reception', label: 'Front desk' }, { to: '/', label: 'Rooms' }],
  admin: [{ to: '/admin', label: 'Dashboard' }, { to: '/reception', label: 'Front desk' }, { to: '/', label: 'Rooms' }],
}

const ROLE_LABEL = { guest: 'Guest', receptionist: 'Reception', admin: 'Admin' }

function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  )
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const clearCart = useBookingStore((s) => s.clear)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  const links = LINKS[user?.role] || LINKS.public

  const handleLogout = () => {
    logout()
    clearCart()
    qc.removeQueries({ queryKey: ['bookings'] })
    toast.success('You are logged out. See you soon!')
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-sand-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6" aria-label="Main">
        <Link to="/" className="flex items-center gap-2" aria-label="Kuriat Bay Resort, home">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span className="font-display text-xl text-slate-900 dark:text-white">Kuriat Bay</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>{l.label}</NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="text-right text-sm leading-tight">
                <span className="block font-semibold text-slate-900 dark:text-white">{user.name.split(' ')[0]}</span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">{ROLE_LABEL[user.role]}</span>
              </span>
              <button type="button" className="btn-ghost py-2" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden py-2 md:inline-flex">Log in</Link>
          )}
          <button
            type="button"
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden dark:text-slate-200 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 px-4 pb-4 pt-2 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>{l.label}</NavLink>
            ))}
          </div>
          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm">{user.name} · <span className="text-slate-600 dark:text-slate-400">{ROLE_LABEL[user.role]}</span></span>
                <button type="button" className="btn-ghost py-2" onClick={handleLogout}>Log out</button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary w-full">Log in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
