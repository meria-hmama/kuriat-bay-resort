import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// token + user live in localStorage so a refresh doesn't log you out
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: ({ token, user }) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'kb-auth' },
  ),
)

export const homeForRole = (role) =>
  ({ admin: '/admin', receptionist: '/reception', guest: '/my-bookings' })[role] || '/'
