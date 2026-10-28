import { z } from 'zod'
import { todayISO } from './dates'
import { isExpiryValid, luhnCheck } from './card'
import { ROOM_TYPES } from './filters'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('That email doesn\'t look right'),
  password: z.string().min(1, 'Password is required').min(6, 'Password is at least 6 characters'),
})

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name'),
    email: z.string().trim().min(1, 'Email is required').email('That email doesn\'t look right'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/\d/, 'Add at least one number'),
    confirm: z.string().min(1, 'Please type your password again'),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords don\'t match' })

// built with a function because the max guests depends on the room
export const makeBookingSchema = (capacity = 4, today = todayISO()) =>
  z
    .object({
      checkIn: z.string().min(1, 'Pick a check-in date').refine((d) => d >= today, 'Check-in can\'t be in the past'),
      checkOut: z.string().min(1, 'Pick a check-out date'),
      guests: z.coerce.number().int().min(1, 'At least 1 guest').max(capacity, `This room fits ${capacity} guests max`),
      fullName: z.string().trim().min(2, 'Full name is required'),
      email: z.string().trim().email('Enter a valid email'),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[\d\s-]{8,15}$/, 'Enter a valid phone number (8 to 15 digits)'),
      arrivalTime: z.string().optional(),
      requests: z.string().max(300, 'Keep it under 300 characters').optional(),
    })
    .refine((v) => !v.checkIn || !v.checkOut || v.checkOut > v.checkIn, {
      path: ['checkOut'],
      message: 'Check-out must be after check-in',
    })

export const paymentSchema = z.object({
  cardName: z.string().trim().min(2, 'Name on card is required'),
  cardNumber: z.string().refine((v) => luhnCheck(v), 'Card number is not valid'),
  expiry: z.string().refine((v) => isExpiryValid(v), 'Use MM/YY and a date that hasn\'t passed'),
  cvc: z.string().regex(/^\d{3,4}$/, '3 or 4 digits'),
})

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB

export function validateImageFile(file) {
  if (!file) return 'Please add a photo of the room'
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG or WEBP images'
  if (file.size > MAX_IMAGE_SIZE) return 'Image is too big (max 2 MB)'
  return true
}

export const roomSchema = z.object({
  name: z.string().trim().min(3, 'Give the room a name'),
  type: z.enum(ROOM_TYPES, { errorMap: () => ({ message: 'Choose a room type' }) }),
  price: z.coerce.number({ invalid_type_error: 'Enter a price' }).min(20, 'Minimum 20 TND').max(800, 'Maximum 800 TND'),
  capacity: z.coerce.number().int().min(1, 'At least 1').max(6, 'Max 6 guests'),
  size: z.coerce.number().min(8, 'Too small').max(200, 'Too big'),
  floor: z.coerce.number().int().min(0).max(5),
  description: z.string().trim().min(20, 'Write at least 20 characters'),
  amenities: z.array(z.string()).min(1, 'Pick at least one amenity'),
  image: z.any().superRefine((files, ctx) => {
    const file = files && files[0]
    const result = validateImageFile(file)
    if (result !== true) ctx.addIssue({ code: z.ZodIssueCode.custom, message: result })
  }),
})

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Choose a rating').max(5),
  comment: z.string().trim().min(10, 'Tell us a bit more (10 characters min)').max(500),
})
