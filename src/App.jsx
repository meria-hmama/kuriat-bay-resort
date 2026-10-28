import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'

// every page except home is lazy loaded -> smaller first bundle (Lighthouse fix #2)
const RoomDetailsPage = lazy(() => import('./pages/RoomDetailsPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'))
const ReceptionPage = lazy(() => import('./pages/ReceptionPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="rooms/:id" element={<RoomDetailsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute roles={['guest']} />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['receptionist', 'admin']} />}>
          <Route path="reception" element={<ReceptionPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
