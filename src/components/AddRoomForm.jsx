import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Spinner } from './States'
import { roomSchema, validateImageFile, ACCEPTED_IMAGE_TYPES } from '../lib/schemas'
import { ROOM_TYPES } from '../lib/filters'
import { useAddRoom } from '../hooks/queries'

const AMENITIES = ['Free Wi-Fi', 'Air conditioning', 'Smart TV', 'Sea view', 'Balcony', 'Mini bar', 'Bathtub', 'Coffee machine', 'Work desk', 'Kitchenette']

// shrink the uploaded photo before saving it (it ends up in localStorage, which is only ~5MB)
function resizeImage(file, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => reject(new Error('Could not read this image'))
    img.src = url
  })
}

export default function AddRoomForm({ onDone }) {
  const addRoom = useAddRoom()
  const [preview, setPreview] = useState(null)
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(roomSchema),
    mode: 'onTouched',
    defaultValues: { name: '', type: '', price: '', capacity: 2, size: '', floor: 1, description: '', amenities: ['Free Wi-Fi', 'Air conditioning'], image: undefined },
  })

  // live preview as soon as a valid file is picked
  const files = watch('image')
  useEffect(() => {
    const file = files && files[0]
    if (!file || validateImageFile(file) !== true) { setPreview(null); return undefined }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [files])

  const onSubmit = async (values) => {
    try {
      const image = await resizeImage(values.image[0])
      const { image: _ignored, ...rest } = values
      await addRoom.mutateAsync({ ...rest, images: [image] })
      toast.success(`${values.name} was added`)
      reset()
      onDone?.()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const a11y = (name) => ({ 'aria-invalid': !!errors[name] || undefined, 'aria-describedby': errors[name] ? `room-${name}-error` : undefined })
  const err = (name) => errors[name] && <p id={`room-${name}-error`} className="field-error">{errors[name].message}</p>
  const cls = (name) => `input ${errors[name] ? 'input-error' : ''}`

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="room-name" className="label">Room name</label>
        <input id="room-name" className={cls('name')} {...a11y('name')} {...register('name')} />
        {err('name')}
      </div>
      <div>
        <label htmlFor="room-type" className="label">Type</label>
        <select id="room-type" className={cls('type')} {...a11y('type')} {...register('type')}>
          <option value="">Choose…</option>
          {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {err('type')}
      </div>
      <div>
        <label htmlFor="room-price" className="label">Price per night (TND)</label>
        <input id="room-price" type="number" inputMode="numeric" className={cls('price')} {...a11y('price')} {...register('price')} />
        {err('price')}
      </div>
      <div>
        <label htmlFor="room-capacity" className="label">Max guests</label>
        <input id="room-capacity" type="number" min={1} max={6} className={cls('capacity')} {...a11y('capacity')} {...register('capacity')} />
        {err('capacity')}
      </div>
      <div>
        <label htmlFor="room-size" className="label">Size (m²)</label>
        <input id="room-size" type="number" className={cls('size')} {...a11y('size')} {...register('size')} />
        {err('size')}
      </div>
      <div>
        <label htmlFor="room-floor" className="label">Floor</label>
        <select id="room-floor" className={cls('floor')} {...register('floor')}>
          {[0, 1, 2, 3, 4, 5].map((f) => <option key={f} value={f}>{f === 0 ? 'Ground' : f}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label htmlFor="room-description" className="label">Description</label>
        <textarea id="room-description" rows={3} className={cls('description')} {...a11y('description')} {...register('description')} />
        {err('description')}
      </div>
      <fieldset className="sm:col-span-2 lg:col-span-3" aria-describedby={errors.amenities ? 'room-amenities-error' : undefined}>
        <legend className="label">Amenities</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 dark:border-slate-700 dark:has-[:checked]:bg-brand-900/40">
              <input type="checkbox" value={a} className="accent-brand-700" {...register('amenities')} />
              {a}
            </label>
          ))}
        </div>
        {err('amenities')}
      </fieldset>
      <div className="sm:col-span-2 lg:col-span-3">
        <label htmlFor="room-image" className="label">Photo (JPG, PNG or WEBP, max 2 MB)</label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            id="room-image" type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')}
            className="block text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-800 dark:file:bg-brand-900/50 dark:file:text-brand-200"
            {...a11y('image')} {...register('image')}
          />
          {preview && <img src={preview} alt="Preview of the uploaded room" className="h-28 w-40 rounded-xl object-cover shadow" />}
        </div>
        {err('image')}
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {isSubmitting ? 'Saving room…' : 'Add room'}
        </button>
      </div>
    </form>
  )
}
