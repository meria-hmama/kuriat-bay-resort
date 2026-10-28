# Lighthouse / PageSpeed

Run on the live site with PageSpeed Insights (mobile, Moto G emulation, slow 4G) on 28 Oct 2026.
Report: https://pagespeed.web.dev/analysis/https-kuriat-bay-resort-vercel-app/jtdw2svat1?form_factor=mobile

| Category | Score |
|---|---|
| Performance | 91 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

| Metric | Value |
|---|---|
| First Contentful Paint | 2.0 s |
| Largest Contentful Paint | 3.3 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0.023 |
| Speed Index | 2.0 s |

Scores change a few points from one run to the next, so run it 2 or 3 times if you check.

I didn't keep a "before" run: I knew the usual Lighthouse complaints from week 5, so the fixes below went in while building instead of after.

## What I did and why

| Usual Lighthouse issue | What I did |
|---|---|
| "Properly size images" / "Serve images in next-gen formats" | Unsplash URLs ask for the displayed width (`?w=600&q=70&auto=format`, gives WebP/AVIF) with `srcset` and `sizes` (`src/lib/images.js`) |
| Layout shift from images | `width`/`height` on every `<img>`, plus `aspect-ratio` boxes (CLS is 0.023) |
| "Defer offscreen images" | `loading="lazy"` below the fold, `fetchpriority="high"` on the hero and the first 3 room cards |
| "Reduce unused JavaScript" | Pages are `React.lazy`, vendor chunks split in `vite.config.js`, jsPDF only loaded on click |
| "Serve static assets with an efficient cache policy" | `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` in `vercel.json` |
| Contrast | secondary text is `slate-600` (light) / `slate-400` (dark) |
| Labels | every input has a `<label htmlFor>`, sliders have `sr-only` labels |
| SEO | meta description in `index.html`, a `<title>` per page, `robots.txt` |

## Still flagged

- **Render-blocking requests (~310 ms):** that's mostly the Google Fonts stylesheet. Self-hosting the two fonts would fix it, I'd do that next.
- **LCP 3.3 s:** the hero photo comes from Unsplash. The app also waits for the mock API service worker to start before rendering, which costs a bit on the first visit.

## How to run it yourself

```bash
npm run build && npm run preview
# open http://localhost:4173 in Chrome, DevTools → Lighthouse → Analyze page load
```
