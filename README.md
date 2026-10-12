# Casita Stays

Student accommodation marketplace: search → listing details → booking. Next.js (App Router), TypeScript (strict), MUI, TanStack Query, Zod, Vitest + React Testing Library.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit + integration tests
npm run check        # format, lint, typecheck, tests
npm run build && npm start
```

Mock API chaos (300–1200 ms latency, ~10% 503s) is on by default. `MOCK_CHAOS=off npm run dev` disables it.

## Architecture

```
src/
  app/            routes + Route Handlers (/api/*) acting as the fake HTTP API
  features/       search, listing, booking: UI + query hooks per feature
  domain/         pure pricing and date-range logic (no React)
  lib/            api client, query client/keys, Zod schemas, formatting
  mocks/          seeded data (240 listings, 5 cities) + in-memory service
```

- **UI / data / domain are separate.** Components call query hooks; hooks call a typed `apiFetch`; pricing and date validation are pure functions tested without React.
- **Mock API as Route Handlers** so the client is a real HTTP client with real status codes (404, 409, 503). State is in-memory: not durable across restarts or instances.
- **Seeded deterministically**, so URLs and tests are reproducible.

## Key decisions (and rejected alternatives)

| Decision                                           | Why                                                                              | Rejected                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| TanStack Query                                     | caching, dedup, `AbortSignal` cancellation, `keepPreviousData` for pagination    | SWR (less control over mutations/invalidation), hand-rolled `fetch` hooks |
| Zod at the API boundary                            | runtime guarantee that responses match types                                     | trusting `as` casts                                                       |
| Checkout is exclusive                              | guest occupies nights [checkIn, checkOut); checkout on a booked night is allowed | inclusive checkout (double-books turnover days)                           |
| Money in integer cents                             | no float drift; service fee rounded once                                         | floats                                                                    |
| Pagination, not infinite scroll                    | URL-addressable pages, back/forward works, simple a11y                           | infinite scroll (breaks link reproducibility)                             |
| URL is the source of truth for filters             | shareable links, back/forward                                                    | local state synced to URL                                                 |
| Queries retry only on 5xx/network; mutations never | no idempotency key, so a retried POST could double-book                          | blanket retries                                                           |
| Confirmation reads booking from URL params         | brief has no `GET /bookings`                                                     | extra endpoint                                                            |

## Booking conflicts (409)

Booking POST is never retried. On 409 the availability queries are invalidated, the calendar updates, selected dates are kept, and the panel names the nights that were taken.

## Testing

- Unit: pricing, date-range validation (same-day, crossing a booked night, month boundary, checkout on a booked night), URL param parsing.
- Integration (RTL): price breakdown, inline validation, success redirect, 409 recovery with exactly one POST.
- `fetch` is stubbed per test; no real timers or randomness.

## Lighthouse (results page, production build, mobile, Lighthouse 13.4.1)

Performance 75 · Accessibility 100 · Best Practices 100 · SEO 100
LCP 3.6 s, TBT 590 ms, CLS 0.

Performance is limited by (1) the LCP image not being discoverable in the initial HTML, because the list is fetched client-side, and (2) the shared JS bundle (MUI + React + TanStack Query) evaluating on a throttled CPU. The mock API's 300–1200 ms latency also counts toward LCP.

## Accessibility

Labelled fields, errors in `role="alert"` regions, keyboard-operable calendar and gallery, visible focus. Targeting WCAG 2.1 AA; checked with Lighthouse and keyboard-only passes.

## Known limitations

- In-memory bookings reset on restart; confirmation page trusts URL params.
- Calendar covers the next three months only.
- No E2E test, no SSR for listing pages.

## With another day

E2E (Playwright) for search → book; server-rendered listing pages for SEO; idempotency keys so booking POSTs could be retried safely; virtualised list; prefetch page 1 on the server and hydrate the query cache, and trim the bundle.

## Time spent

Slightly over the 8 h guidance because I spent time learning TanStack Query, Vitest and RTL while building.

## AI usage

Used Claude as a pair-programmer for scaffolding, code and tests across all phases. I reviewed and ran everything, and can explain each decision.
