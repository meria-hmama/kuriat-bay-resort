import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// the "cart": what the guest picked on the room page, read again on the checkout page.
// sessionStorage because a half-finished booking shouldn't follow you for days.
const empty = { roomId: null, checkIn: '', checkOut: '', guests: 1, services: [] }

export const useBookingStore = create(
  persist(
    (set) => ({
      ...empty,
      setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
      setGuests: (guests) => set({ guests: Number(guests) || 1 }),
      toggleService: (id) =>
        set((s) => ({ services: s.services.includes(id) ? s.services.filter((x) => x !== id) : [...s.services, id] })),
      selectRoom: (roomId) => set((s) => (s.roomId === roomId ? {} : { ...empty, roomId, checkIn: s.checkIn, checkOut: s.checkOut })),
      clear: () => set(empty),
    }),
    { name: 'kb-cart', storage: createJSONStorage(() => sessionStorage) },
  ),
)
