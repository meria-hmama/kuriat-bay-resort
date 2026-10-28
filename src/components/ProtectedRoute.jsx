import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { homeForRole, useAuthStore } from '../store/authStore'

// <ProtectedRoute roles={['admin']} /> wraps routes in App.jsx
// - not logged in -> /login?next=<where you wanted to go>
// - wrong role    -> your own home page (guest -> my bookings, etc.)
export default function ProtectedRoute({ roles }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace state={{ denied: location.pathname }} />
  }
  return <Outlet />
}
