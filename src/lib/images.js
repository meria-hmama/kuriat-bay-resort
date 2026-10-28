// Unsplash can resize on their CDN, so I ask for the size I actually display
// instead of downloading 4000px photos (that was the #1 Lighthouse complaint).
export function imgUrl(src, width = 800) {
  if (!src || !src.startsWith('https://images.unsplash.com')) return src
  return `${src}?w=${width}&q=70&auto=format&fit=crop`
}

export function imgSrcSet(src, widths = [400, 800, 1200]) {
  if (!src || !src.startsWith('https://images.unsplash.com')) return undefined
  return widths.map((w) => `${imgUrl(src, w)} ${w}w`).join(', ')
}

export const HERO_IMAGE = 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
