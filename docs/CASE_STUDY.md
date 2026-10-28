# Case study: Kuriat Bay Resort booking

*Meria Hmama, Zenvio Solutions frontend internship, week 6 capstone*

## The problem

A small hotel needs three apps in one. Guests want to find a free room for their dates, see the real price before paying, and find their booking again later. The receptionist needs to see who arrives today and who is leaving, and switch a room from "occupied" to "cleaning" to "available" without calling anyone. The owner wants to know how full the hotel is and how much it earns. The brief also said: no real backend, but it should still feel like a real product, slow network and failures included.

I set it in Skanes, on the beach in front of the Kuriat islands near Monastir, because I know those hotels well and it was easier to write room descriptions I actually believe. The hotel itself is invented, I didn't want to copy a real hotel's name or branding.

## UI decisions

- **Search first.** The home page is the search page. The filters sit right under the hero so you can start without scrolling, and every filter goes into the URL. I added that because the brief asked for shareable links, but it also fixed the back button for free: going back from a room brings you to the same filtered page.
- **One booking box, always visible.** On the room page the booking box is sticky on desktop, and the price updates while you change dates, guests or extras. I didn't want people to find out the real price only at checkout.
- **Errors where they happen.** Every input has its own message under it, linked with `aria-describedby`, and the submit button is disabled with a spinner while a request is running. Toasts are only for things that aren't tied to one field ("Booking cancelled", "Card declined").
- **Native date inputs.** I hesitated a lot here. A calendar library would let me grey out booked days, but the native picker works really well on phones and is accessible without extra work. In the end I kept it, set `min` so past dates are disabled, and show a clear message plus the list of booked dates when you hit a conflict.
- **Colours.** Teal and sand, like the sea and the beach over there. Dark mode uses the same tokens with `dark:` classes, and the charts switch their axis and tooltip colours too, because grey text on a dark tooltip was unreadable the first time.

## State management choices

I split state into two kinds, and that made everything simpler:

- **Server state → React Query.** Rooms, bookings, reviews, availability. React Query gives me the loading, error and retry flags I need for the skeletons and error boxes, and it caches results so going back and forth between pages is instant.
- **Client state → Zustand**, three small stores: `auth` (token + user, persisted in localStorage so a refresh keeps you logged in), `booking` (the "cart": room, dates, guests, extras, in sessionStorage) and `theme`.

The cart store is what removed the prop drilling. The room page writes the dates and extras into it and the checkout page reads them, two routes apart, without passing anything through the router.

The part I'm happiest with is the room status. At first I stored `status` on each room and updated it in every handler (check-in, check-out, cancel…). I forgot one case almost immediately: cancelling today's booking left the room "Booked". So I deleted the field and wrote `deriveRoomStatus(room, bookings, today)`. The status is now always calculated from the bookings, and after any change I just invalidate the `rooms` query. Every badge in the app (home cards, front desk board, admin table) updates on its own.

## Challenges

### 1. The date overlap

My first version used `<=` to compare ranges, and it said a room was taken if someone checked out on the 14th and you wanted to arrive on the 14th. That's wrong for a hotel, the room is free that afternoon. The rule is that two stays overlap only if `startA < endB && startB < endA` (strictly). I wrote tests for the edge cases: arriving the day someone leaves, a stay completely inside another, a stay completely around another.

The second problem was timezones. `new Date('2026-03-29')` is midnight UTC, which is already 1am in Tunis, and in some places it's still the day before, so counting nights with local dates can be off by one (and that weekend is also a daylight saving change in Europe). In the end I keep every date as a `'YYYY-MM-DD'` string (they compare correctly as strings!) and only turn them into UTC timestamps when I need to count nights. No more off-by-one.

The same `findConflict` function is used in three places: the room page (instant feedback), the checkout form (before going to payment) and the mock API (in case someone else booked meanwhile, then it answers 409 and I send the user back to the dates).

### 2. The live price

The formula looks easy (nights × rate + services + tax) until you look at the services: an airport pickup is paid once, parking every night, breakfast every night *for every guest*. I added a `per` field (`stay`, `night`, `guest-night`) to each service and one `serviceCost` function. Then the floating point thing: 300 × 0.07 in JavaScript is 21.000000000000004, so every amount goes through a `round2` helper before it's shown or saved.

To make it "live" I just recompute with `useMemo` whenever dates, guests or services change. The breakdown has `aria-live="polite"` so a screen reader announces the new total. And the mock API recalculates the price itself when you book. It never trusts a total sent by the browser, like a real backend wouldn't.

### 3. Random failures in the e2e test

The brief wanted random API failures so the error states are visible. Great for the demo, terrible for an automated test that fails 1 time out of 10 for no reason. I moved the fail rate and delays into environment variables, and the Playwright config builds the app with `VITE_MOCK_FAIL_RATE=0`. React Query also retries once, so in normal use most failures are invisible unless you're unlucky twice.

## What I'd change with more time

A proper calendar with blocked days, the Urdu/RTL version, and a PWA mode with offline listings. I'd also move the mock "database" from localStorage to IndexedDB, because uploaded room photos fill the 5 MB limit quickly (that's why I shrink them with a canvas before saving).
