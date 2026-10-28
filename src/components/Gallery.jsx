import { useCallback, useEffect, useRef, useState } from 'react'
import { imgSrcSet, imgUrl } from '../lib/images'

// main photo + thumbnails, click the big one to open the lightbox.
// lightbox: Esc closes, left/right arrows switch photos, focus goes back where it was.
export default function Gallery({ images, name }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)
  const openerRef = useRef(null)

  const go = useCallback((dir) => setActive((i) => (i + dir + images.length) % images.length), [images.length])

  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'Tab') {
        // keep focus inside the lightbox
        const els = [...document.querySelectorAll('#lightbox button')]
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      openerRef.current?.focus()
    }
  }, [open, go])

  return (
    <div>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800"
        aria-label={`Open photo ${active + 1} of ${images.length} in full screen`}
      >
        <img
          src={imgUrl(images[active], 1200)}
          srcSet={imgSrcSet(images[active], [600, 900, 1200])}
          sizes="(min-width: 1024px) 60vw, 100vw"
          alt={`${name}, photo ${active + 1}`}
          width="1200"
          height="800"
          fetchpriority="high"
          className="aspect-[3/2] w-full object-cover transition hover:opacity-95"
        />
      </button>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-2" aria-label="Photos">
          {images.map((src, i) => (
            <li key={src + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={i === active}
                className={`block w-full overflow-hidden rounded-xl ring-2 transition ${i === active ? 'ring-brand-600' : 'ring-transparent opacity-80 hover:opacity-100'}`}
              >
                <img src={imgUrl(src, 240)} alt="" width="240" height="160" loading="lazy" className="aspect-[3/2] w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          id="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photos`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-up"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-white hover:bg-white/20" aria-label="Close">
            ✕
          </button>
          {images.length > 1 && (
            <button type="button" onClick={() => go(-1)} className="absolute left-2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:left-6" aria-label="Previous photo">‹</button>
          )}
          <figure className="max-h-full max-w-5xl">
            <img src={imgUrl(images[active], 1600)} alt={`${name}, photo ${active + 1}`} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-sm text-white/80">{active + 1} / {images.length}</figcaption>
          </figure>
          {images.length > 1 && (
            <button type="button" onClick={() => go(1)} className="absolute right-2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20 sm:right-6" aria-label="Next photo">›</button>
          )}
        </div>
      )}
    </div>
  )
}
