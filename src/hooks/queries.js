import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { filtersToParams } from '../lib/filters'
import { useAuthStore } from '../store/authStore'

export const keys = {
  rooms: (filters) => ['rooms', 'list', filters],
  allRooms: ['rooms', 'all'],
  room: (id) => ['rooms', 'detail', id],
  availability: (id) => ['availability', id],
  reviews: (id) => ['reviews', id],
  bookings: (userId) => ['bookings', userId],
  services: ['services'],
}

export function useRooms(filters) {
  return useQuery({
    queryKey: keys.rooms(filters),
    queryFn: () => api('/api/rooms', { params: filtersToParams(filters) }),
    placeholderData: (prev) => prev, // keeps the old page visible while the next one loads
  })
}

export function useAllRooms() {
  return useQuery({ queryKey: keys.allRooms, queryFn: () => api('/api/rooms', { params: { all: 1 } }) })
}

export function useRoom(id) {
  return useQuery({ queryKey: keys.room(id), queryFn: () => api(`/api/rooms/${id}`), enabled: !!id })
}

export function useAvailability(id) {
  return useQuery({ queryKey: keys.availability(id), queryFn: () => api(`/api/rooms/${id}/availability`), enabled: !!id })
}

export function useReviews(id) {
  return useQuery({ queryKey: keys.reviews(id), queryFn: () => api(`/api/rooms/${id}/reviews`), enabled: !!id })
}

export function useServices() {
  return useQuery({ queryKey: keys.services, queryFn: () => api('/api/services'), staleTime: Infinity })
}

export function useBookings() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({ queryKey: keys.bookings(userId), queryFn: () => api('/api/bookings'), enabled: !!userId })
}

// after anything that changes a booking, rooms + availability + bookings are refetched,
// that's what makes the status badges update everywhere
function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['rooms'] })
    qc.invalidateQueries({ queryKey: ['bookings'] })
    qc.invalidateQueries({ queryKey: ['availability'] })
  }
}

export function useCreateBooking() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (payload) => api('/api/bookings', { method: 'POST', body: payload }),
    onSuccess: invalidate,
  })
}

export function useBookingAction() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, action }) => api(`/api/bookings/${id}/${action}`, { method: 'PATCH' }),
    onSuccess: invalidate,
  })
}

export function useMarkClean() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (roomId) => api(`/api/rooms/${roomId}/clean`, { method: 'PATCH' }),
    onSuccess: invalidate,
  })
}

export function useAddRoom() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (room) => api('/api/rooms', { method: 'POST', body: room }),
    onSuccess: invalidate,
  })
}

export function useAddReview(roomId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (review) => api(`/api/rooms/${roomId}/reviews`, { method: 'POST', body: review }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.reviews(roomId) })
      qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
