import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './Navbar'
import { PageLoader } from './States'
import { useThemeStore } from '../store/themeStore'

const TITLES = {
  '/': 'Find a room',
  '/checkout': 'Checkout',
  '/my-bookings': 'My bookings',
  '/reception': 'Front desk',
  '/admin': 'Admin dashboard',
  '/login': 'Log in',
  '/signup': 'Create an account',
}

export default function Layout() {
  const theme = useThemeStore((s) => s.theme)
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // simple per-page <title>, room pages set their own with the room name
  useEffect(() => {
    if (TITLES[pathname]) document.title = `${TITLES[pathname]} | Kuriat Bay Resort`
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        Kuriat Bay Resort · Skanes, Monastir · Student project, fictional hotel, all data is fake (mock API)
      </footer>
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!rounded-xl !text-sm dark:!bg-slate-800 dark:!text-slate-100',
          duration: 3500,
        }}
      />
    </div>
  )
}
