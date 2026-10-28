import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import StarRatingInput, { Stars } from './StarRating'
import { ErrorState, Skeleton, Spinner } from './States'
import { useAddReview, useBookings, useReviews } from '../hooks/queries'
import { useAuthStore } from '../store/authStore'
import { reviewSchema } from '../lib/schemas'
import { formatDate } from '../lib/dates'

function ReviewForm({ roomId }) {
  const addReview = useAddReview(roomId)
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  const onSubmit = (values) =>
    addReview.mutateAsync(values).then(
      () => { toast.success('Thanks for your review!'); reset() },
      (err) => toast.error(err.message),
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card mt-4 space-y-4 p-5" noValidate>
      <h3 className="text-lg text-slate-900 dark:text-white">You stayed here, how was it?</h3>
      <Controller
        control={control}
        name="rating"
        render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} error={errors.rating?.message} />}
      />
      <div>
        <label htmlFor="comment" className="label">Your review</label>
        <textarea
          id="comment"
          rows={3}
          className={`input ${errors.comment ? 'input-error' : ''}`}
          aria-invalid={!!errors.comment || undefined}
          aria-describedby={errors.comment ? 'comment-error' : undefined}
          {...register('comment')}
        />
        {errors.comment && <p id="comment-error" className="field-error">{errors.comment.message}</p>}
      </div>
      <button type="submit" className="btn-primary" disabled={addReview.isPending}>
        {addReview.isPending && <Spinner />} {addReview.isPending ? 'Posting…' : 'Post review'}
      </button>
    </form>
  )
}

export default function Reviews({ roomId }) {
  const user = useAuthStore((s) => s.user)
  const reviews = useReviews(roomId)
  const bookings = useBookings()

  const isGuest = user?.role === 'guest'
  const stayed = isGuest && (bookings.data || []).some((b) => b.roomId === roomId && b.status === 'checked_out')
  const alreadyReviewed = (reviews.data || []).some((r) => r.userId === user?.id)

  return (
    <section className="mt-10" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-xl text-slate-900 dark:text-white">Guest reviews</h2>

      {reviews.isPending ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : reviews.isError ? (
        <div className="mt-4"><ErrorState error={reviews.error} onRetry={reviews.refetch} title="Reviews didn't load" /></div>
      ) : reviews.data.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">No reviews yet for this room.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reviews.data.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.author}</span>
                <Stars value={r.rating} size="text-sm" />
              </div>
              <p className="mt-2 text-sm">{r.comment}</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{formatDate(r.date)}</p>
            </li>
          ))}
        </ul>
      )}

      {stayed && !alreadyReviewed && <ReviewForm roomId={roomId} />}
      {isGuest && !stayed && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Only guests who completed a stay in this room can leave a review.</p>
      )}
    </section>
  )
}
