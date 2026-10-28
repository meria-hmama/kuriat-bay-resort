import { describe, expect, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import { renderWithProviders } from '../test/utils'

function WhereAmI() {
  const loc = useLocation()
  return <p>at {loc.pathname}{loc.search}</p>
}

const app = (
  <Routes>
    <Route element={<ProtectedRoute roles={['admin']} />}>
      <Route path="/admin" element={<p>admin dashboard</p>} />
    </Route>
    <Route path="*" element={<WhereAmI />} />
  </Routes>
)

describe('role-based routing', () => {
  beforeEach(() => useAuthStore.setState({ user: null, token: null }))

  it('sends logged-out visitors to the login page with a ?next param', () => {
    renderWithProviders(app, { route: '/admin' })
    expect(screen.getByText('at /login?next=%2Fadmin')).toBeInTheDocument()
  })

  it('redirects a guest away from the admin page to their bookings', () => {
    useAuthStore.setState({ token: 'mock.u1.1', user: { id: 'u1', name: 'A B', role: 'guest' } })
    renderWithProviders(app, { route: '/admin' })
    expect(screen.queryByText('admin dashboard')).not.toBeInTheDocument()
    expect(screen.getByText('at /my-bookings')).toBeInTheDocument()
  })

  it('lets an admin in', () => {
    useAuthStore.setState({ token: 'mock.u3.1', user: { id: 'u3', name: 'L M', role: 'admin' } })
    renderWithProviders(app, { route: '/admin' })
    expect(screen.getByText('admin dashboard')).toBeInTheDocument()
  })
})
