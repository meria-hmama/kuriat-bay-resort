# Lighthouse audit

Run on the deployed Vercel site, Chrome DevTools → Lighthouse, mobile, home page.

| | Before | After |
|---|---|---|
| Performance | __ | __ |
| Accessibility | __ | __ |
| Best practices | __ | __ |
| SEO | __ | __ |

*(fill in your own numbers, and put the two screenshots in `docs/screenshots/`)*

## What was flagged and what I did

| Issue Lighthouse flagged | Fix |
|---|---|
| "Properly size images" / "Serve images in next-gen formats" | Unsplash URLs now ask for the displayed width (`?w=600&q=70&auto=format`, gives WebP/AVIF) with `srcset` and `sizes` (`src/lib/images.js`) |
| "Image elements do not have explicit width and height" (layout shift) | `width`/`height` on every `<img>`, plus `aspect-ratio` boxes |
| "Defer offscreen images" | `loading="lazy"` on everything below the fold, `fetchpriority="high"` on the hero and the first 3 room cards |
| "Reduce unused JavaScript" | Pages are `React.lazy`, vendor chunks split in `vite.config.js`, jsPDF only loaded on click |
| "Serve static assets with an efficient cache policy" | `Cache-Control: public, max-age=31536000, immutable` on `/assets/*` in `vercel.json` |
| "Background and foreground colors do not have a sufficient contrast ratio" | secondary text moved from `slate-400/500` to `slate-600` (light) / `slate-400` (dark) |
| "Form elements do not have associated labels" | every input has a `<label htmlFor>`, sliders have `sr-only` labels |
| "Document does not have a meta description" | added in `index.html`, plus a `<title>` per page |

## How to reproduce

```bash
npm run build && npm run preview
# open http://localhost:4173 in Chrome, DevTools → Lighthouse → Analyze page load
```
