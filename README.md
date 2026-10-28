# Kuriat Bay Resort – hotel booking app

My week 6 capstone for the Zenvio Solutions frontend internship. It's the frontend of a beach hotel in Skanes, near Monastir (the hotel is made up, the place isn't): guests search and book rooms, the receptionist checks people in and out, and the admin looks at charts. There is no real backend. A mock API (MSW) runs in the browser, so the live version works with fake data and you can't break anything.

**Live:** https://kuriat-bay-resort.vercel.app  ← *(replace with your Vercel URL after deploying)*
**Repo:** https://github.com/meria-hmama/kuriat-bay-resort

![Home page](docs/screenshots/home.png)

## Try it

Log in with one of these (there are also buttons on the login page that fill them in for you):

| Role | Email | Password |
|---|---|---|
| Guest | guest@kuriatbay.tn | guest123 |
| Receptionist | reception@kuriatbay.tn | desk1234 |
| Admin | admin@kuriatbay.tn | admin123 |

You can also sign up, new accounts are always guests.

For the fake payment: **4242 4242 4242 4242** works, **4000 0000 0000 0002** gets declined. Any future expiry date and any CVC.

Heads up: about 1 in 10 API calls fails on purpose (`VITE_MOCK_FAIL_RATE`), so if you see a "Try again" box, that's the error state doing its job, not a bug.

## What's in it

**Pages**
- **Home / search**: filters for dates, room type, guests and a price range slider. Everything is saved in the URL (`/?checkIn=2026-12-10&checkOut=2026-12-13&type=Suite`), so you can send the link to someone and they see the same results. Pagination at the bottom.
- **Room details**: photo gallery with a lightbox (arrows + Esc work), amenities, booked dates, the booking box with the live price, and reviews.
- **Checkout**: guest details form, then the payment step, then a success or "card declined" screen.
- **My bookings** (guest): upcoming, past and cancelled trips. Cancel an upcoming one, download a PDF invoice for a past one.
- **Front desk** (receptionist + admin): today's arrivals, guests in house, a room board, search by name or booking ref. Check in, check out, mark a room as clean.
- **Admin dashboard**: revenue / occupancy / bookings KPIs, 3 charts with a month range filter, the rooms table and the "add room" form with photo upload.
- Login, sign up and a 404 page.

**The business rules I had to handle on the client**
- You can't pick dates that overlap an existing booking. The check-out day of one guest can be the check-in day of the next one.
- Price is recalculated live: nights × rate + extras + 7% tax. Some extras are per stay (airport pickup), some per night (parking), breakfast is per guest per night.
- Check-out has to be after check-in and past dates are disabled in the date pickers.
- Room status (Available / Booked / Occupied / Cleaning) is worked out from the bookings, so when the receptionist checks someone out, the badge changes on the front desk, on the home page and in the admin table without any extra code.

**Roles**
- Routes are protected: logged out → login page (and you come back where you were after logging in), wrong role → your own home page.
- The navbar links change with the role.
- The session survives a refresh (token in localStorage through Zustand `persist`).

**Bonus features I picked**
1. Payment UI: card number formatting, Luhn check, expiry in the future, processing state, success and failure screens.
2. Reviews and ratings: star rating input (it's a radio group, so it works with the keyboard), and only a guest with a completed stay in that room can post one. The demo guest has stayed in *Lagoon Double* and *Sea View Deluxe*, so you can try it there.

**Other stuff**: dark mode (follows your system the first time, then remembers), skeleton loaders everywhere, empty states, error states with retry, small fade-in animations (turned off if you have "reduce motion" on), mobile-first layout.

## Tech stack and why

| | | Why |
|---|---|---|
| React 18 + Vite | UI + build | Fast dev server, and I already used it in the earlier weeks |
| React Router 6 | routing | Nested routes made the protected routes easy (one `<ProtectedRoute>` wraps a group) |
| Zustand | global state | Auth, the booking "cart" and the theme. Much less code than Redux for 3 small stores |
| TanStack React Query | server state | Caching, refetching, loading/error flags for free, and `invalidateQueries` is what makes the status badges update everywhere |
| MSW 2 | mock API | Works in the deployed site too (a service worker), unlike JSON Server which needs a running Node server |
| React Hook Form + Zod | forms | Schemas are plain functions I can unit test, and the forms don't re-render on every key |
| Recharts | charts | Simple API, responsive |
| jsPDF | invoice | Only loaded when you click "Download invoice" |
| Tailwind CSS 3 | styling | Same as the previous weeks, `dark:` variants for dark mode |
| Vitest + Testing Library, Playwright | tests | Unit/component tests + one end-to-end booking test |

## Folder structure

```
src/
  main.jsx            starts MSW, then renders the app
  App.jsx             routes (all pages except Home are lazy loaded)
  pages/              one file per page
  components/         Navbar, RoomCard, Filters, Gallery, PaymentForm, AdminCharts, ...
  hooks/queries.js    every React Query hook lives here
  store/              Zustand stores: auth, booking cart, theme
  lib/                plain JS logic, no React: dates, pricing, filters, schemas,
                      analytics, room status, invoice, api client
  mocks/              MSW handlers, seed data and the tiny localStorage "database"
  test/               test setup and helpers
e2e/                  Playwright test of the full booking flow
docs/                 case study, Lighthouse notes, screenshots
```

I tried to keep the important logic in `src/lib` as normal functions. The mock API and the pages both import the same `filterRooms`, `findConflict` and `calculatePrice`, so the "server" and the UI can't disagree about a price or an overlap, and I can test them without rendering anything.

## Run it locally

You need Node 18+ (I used Node 22).

```bash
git clone https://github.com/meria-hmama/kuriat-bay-resort.git
cd kuriat-bay-resort
npm install          # also copies mockServiceWorker.js into /public
cp .env.example .env # optional, the defaults are fine
npm run dev          # http://localhost:5173
```

If MSW complains that the worker script is missing, run `npm run mock:init` once.

### The mock API

There's nothing to start separately, the API runs inside the browser. Handlers are in `src/mocks/handlers.js`:

```
POST  /api/auth/login | /api/auth/signup      GET /api/auth/me
GET   /api/rooms?checkIn&checkOut&type&minPrice&maxPrice&guests&sort&page
GET   /api/rooms/:id | /:id/availability | /:id/reviews
POST  /api/rooms (admin)          POST /api/rooms/:id/reviews (guest who stayed)
PATCH /api/rooms/:id/clean (staff)
GET   /api/bookings               POST /api/bookings (guest)
PATCH /api/bookings/:id/cancel | check-in | check-out
GET   /api/services               POST /api/admin/reset
```

Environment variables (`.env`, and in Vercel → Settings → Environment Variables):

| Variable | Default | What it does |
|---|---|---|
| `VITE_MOCK_FAIL_RATE` | `0.1` | Chance that a call returns a 500. Put `0` to turn it off |
| `VITE_MOCK_MIN_DELAY` / `VITE_MOCK_MAX_DELAY` | `300` / `900` | Fake network delay in ms |

Data is saved in localStorage (`kb-db-v1`), so your bookings are still there after a refresh. The admin dashboard has a "Reset demo data" button if you want to start over. The seed bookings are generated around today's date so the charts always show the last months.

## Tests

```bash
npm test             # Vitest: 27 unit + component tests
npx playwright install chromium   # first time only
npm run test:e2e     # builds the app, then runs the booking flow in Chromium
```

What's covered: price calculation (services, tax, rounding), date overlap rules, URL filter params, room filtering, booking/payment/upload validation, analytics numbers, room status rules, role-based routing (logged out, wrong role, right role), login form errors, the price breakdown component. The e2e test logs in as the guest, searches, opens a room, adds breakfast, fills the checkout, pays with the test card and checks the booking shows up.

The e2e test sets `VITE_MOCK_FAIL_RATE=0`, otherwise it would fail randomly (which is the whole point of the fail rate, but not in a test).

## Performance and Lighthouse

What I changed after the first audit (details and scores in [docs/LIGHTHOUSE.md](docs/LIGHTHOUSE.md)):

1. **Images**: Unsplash's CDN resizes for me (`?w=600&auto=format`), with `srcset`/`sizes`, `width`/`height` to stop layout shift, `loading="lazy"` below the fold and `fetchpriority="high"` on the hero.
2. **Code splitting**: every page except Home is `React.lazy`, and recharts / forms / react are in their own chunks. jsPDF is only imported when you click the invoice button.
3. **Caching**: hashed files in `/assets` get `Cache-Control: immutable` for a year (`vercel.json`), and React Query keeps API results for 30 s.
4. **Accessibility**: labels on every input, `aria-invalid` + `aria-describedby` on errors, skip link, visible focus rings, a focus trap in the lightbox, darker text colours for contrast, a table version of the chart data.
5. **SEO**: title per page, meta description, `robots.txt`, `lang="en"`.

![Lighthouse before and after](docs/screenshots/lighthouse-before-after.png)

## Screenshots

| | |
|---|---|
| ![Search](docs/screenshots/home.png) | ![Room](docs/screenshots/room.png) |
| ![Checkout](docs/screenshots/checkout.png) | ![Admin dark mode](docs/screenshots/admin-dark.png) |

## Things I'd do next

- A real calendar date picker where booked days are greyed out. Right now I use the native `<input type="date">` (good on mobile, accessible), but it can't disable random days in the middle, so I show an error and the list of booked dates instead.
- Urdu / Arabic with RTL. I started looking at react-i18next but chose to finish the reviews properly instead.
- PWA with offline room listings.

The case study (problem, choices, the date-overlap and live price headaches) is in [docs/CASE_STUDY.md](docs/CASE_STUDY.md).
