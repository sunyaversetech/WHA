# API Reference

**Base URL**: relative to the site origin — see `00-README.md`. All request/response
shapes below are transcribed from the actual route handlers and the `services/*.ts`
callers; fields not directly observed in a route body are marked `⚠️ inferred` (taken
from the client-side type in `services/*.ts` rather than confirmed server-side).

**Auth column key**: 🔒 = requires a NextAuth session (`getServerSession(authOptions)`
returns non-null) or the route 401s; — = no auth check found; 🔒role = session required
AND a specific `category` is checked server-side.

**Standard envelope**: most routes return
`ApiResponseType<T> = { status, message, error, data: T, pagination? }`
(`services/apitypes.ts:1-20`) but this is **not universal** — many routes (bookings,
tickets, deals-redeem, auth) return their own ad hoc `{ success, data/message/error }`
shape instead. There is **no single standard response envelope** across this API — see
the "Inconsistent conventions" item in `12-mobile-gap-report.md`.

---

## Shared TypeScript interfaces (data models)

```ts
// User / Auth — server/models/Auth.model.ts
interface User {
  _id: string;
  name?: string;
  category?: "user" | "business" | "super-admin";
  email: string; // unique, lowercased
  city?: string;
  longitude?: number;
  latitude?: number;
  geo?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  city_name?: string;
  location?: string;
  community: string[];
  image?: string;
  venue_images: string[];
  portfolio_images: string[];
  accpetalltermsandcondition: boolean;
  emailVerified?: Date | null;
  provider: "credentials" | "google" | "guest";
  googleId?: string;
  business_name?: string;       // unique when present
  business_type?: "employee_based" | "item_based" | null;
  phone_number?: string;
  business_category?: string;
  is24_7: boolean;
  schedule?: Record<string, { open: boolean; slots: { from: string; to: string }[] }> | null;
  isblocked: boolean;
  abn_number?: string;
  seo_keywords: string[];       // max 10
  seo_description?: string;     // max 200 chars
  verified: boolean;
  isSponsor: boolean;
  createdAt: string; updatedAt: string;
}

// Event — server/models/Event.model.ts (fields per services/event.service.ts:9-86, cross-checked against route usage this session)
interface EventOption {
  _id?: string; name?: string; release_date?: string | null; close_date?: string | null;
  price?: number | null; capacity?: number | null; sold?: number | null; held?: number | null; // held = actively-reserved-but-unpaid count
}
interface EventPromoCode {
  _id?: string; code?: string; discount_percentage?: number | null; limit?: number | null;
  used?: number | null; applicable_options?: string[]; // option names this code discounts; empty = applies to all
}
interface Event {
  _id: string; title: string; description: string;
  dateRange?: { from: string; to: string };
  user: { _id: string; email: string; name: string; business_name: string; city: string; location: string; image: string }; // the organizing business
  location: string; location_tba?: boolean;
  event_rules?: string; refund_policy?: string; host_name?: string; support_details?: string;
  category_name: string; email: string; phone_number: string; website_link: string;
  price_category: "registration" | "paid" | "external"; // free-with-registration / paid ticketed / external ticket link
  registration_capacity?: number | null; registration_sold?: number | null;
  max_tickets_per_request?: number | null; // default 10
  show_remaining_tickets?: boolean;         // default true
  community_name: string; city: string; community: string;
  startTime: string; endTime: string; // "HH:mm"
  venue: string; category: string; image: string;
  latitude: number; longitude: number; isSponsor: boolean;
  geo?: { type: string; coordinates: [number, number] };
  distance?: number; // metres, only when a geo query is active
  ticket_link: string | null; // for price_category "external"
  options?: EventOption[]; promo_codes?: EventPromoCode[];
  slug?: string; archived?: boolean; createdAt?: string; updatedAt?: string;
}

// EventTicketPurchase — server/models/EventTicketPurchase.model.ts
interface EventTicketLineItem { optionId: string; optionName: string; quantity: number; unitPrice: number; uniqueKeys: string[]; }
interface EventTicketPurchase {
  _id: string; event: string | Event; user: string | User; business: string;
  items: EventTicketLineItem[]; uniqueKeys: string[]; verifiedKeys: string[];
  verifiedTimestamps: { key: string; verifiedAt: Date }[]; // per-ticket check-in time
  promoCode?: string; invoiceNumber: string;
  ticketTotal: number; serviceFee: number; surcharge: number; totalAmount: number;
  paymentIntentId: string; status: "pending" | "verified"; verifiedAt?: Date;
}

// Deal — server/models/DealSchema.model.ts (fields per services/deal.service.ts:9-26)
interface Deal {
  _id: string; title: string; current_redemptions: number; max_redemptions: number;
  discount_percentage: number; price: number; valid_till: string; deals_for: string;
  category?: string; city?: string; image?: string; description: string; user: User;
  terms_for_the_deal: string; deal_code: string; verifiedRedemptions: number;
}

// Service / Employee / Booking — server/models/{Service,Employee,Booking}.model.ts (per services/booking.service.ts:7-66)
interface Service {
  _id: string; business_id: string; name: string; description?: string; category: string;
  base_price: number; base_duration: number; // minutes
  service_type?: "employee_based" | "resource_based" | "group_session";
  require_employee_selection: boolean; assigned_employees: Employee[]; is_active: boolean;
  buffer_time?: number; availability_type?: "always" | "specific";
  max_concurrent_bookings?: number; allow_multiple_bookings?: boolean;
  max_bookings_per_slot?: number; is_one_time_booking?: boolean;
}
interface Employee {
  _id: string; business_id: string; full_name: string; email?: string; phone_number?: string;
  bio?: string; is_active: boolean; employee_photo?: string;
}
interface Booking {
  _id: string; business_id: string; user_id: string; service_id: Service | string;
  employee_id: Employee | string | null; start_time: string; end_time: string;
  duration: number; total_price: number; currency: string;
  payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed";
  status: "pending" | "confirmed" | "rescheduled" | "arrived" | "completed" | "cancelled" | "no_show" | "refunded";
  notes?: string; idempotency_key?: string | null; created_at: string; updated_at: string;
}
```

---

## Auth

See `05-auth-and-user.md` for full detail. Table form:

| Purpose | Method | Path | Auth | Request | Response |
|---|---|---|---|---|---|
| NextAuth handler (session, providers, callback) | GET/POST | `/api/auth/[...nextauth]` | varies | NextAuth internal | NextAuth internal — do not call directly from the app |
| Send pre-signup code | POST | `/api/auth/send-verification-code` | — | `{ email }` | `{ message, success }` |
| Verify pre-signup code | POST | `/api/auth/verify-signup-code` | — | `{ email, code }` | `{ message, success }` |
| User signup | POST | `/api/auth/user/signup` | — | `FormData{ name, email, password, accpetalltermsandcondition, image? }` | 201 `{ message, success, userId }` |
| Business signup | POST | `/api/auth/business/signup` | — | `FormData{ name, email, password, business_name, business_type?, business_category, phone_number?, city, location, is24_7, latitude?, longitude?, community(json), schedule(json), accpetalltermsandcondition, image?, venue_image_0..8? }` | 201 `{ message, success, userId }` |
| Forgot password (send code) | POST | `/api/reset-password` | — | `{ email }` | `{ message }` / 404 |
| Verify reset code | POST | `/api/auth/verify-code` | — | `{ email, code }` | `{ message }` |
| Set new password | POST | `/api/auth/update-password` | — | `{ email, code, password }` | `{ message }` |
| Send "verify my email" link | POST | `/api/send-email-verification` | — | `{ email }` | `{ success }` |
| Consume verify-email link | GET | `/api/verify-email?token=` | — | — | `{ message }` |

### Mobile Auth (`/api/mobile/v1/*`) — implemented, Phase 1 + Phase A

New, parallel bearer-token auth namespace — see `05-auth-and-user.md` and
`12-mobile-gap-report.md` for the design rationale. All routes below share one
response envelope: `{ data, error: {message,code?}|null, meta }`. `authOptions` /
`app/api/auth/[...nextauth]/route.ts` was never modified to build this — every route
either reuses extracted shared logic (`server/lib/accountCreation.ts`,
`server/lib/passwordReset.ts`, `server/lib/guestAuth.ts`) or, for Google sign-in, a
deliberate duplicate of the NextAuth callback's find-or-create block
(`server/lib/googleAuth.ts` — see that file's comment for why).

| Purpose | Method | Path | Auth | Request | Response (`data`) |
|---|---|---|---|---|---|
| Login | POST | `/auth/login` | — | `{email,password,category:"user"\|"business",deviceId?,platform?}` | `{accessToken,refreshToken,expiresIn,user}` |
| Register | POST | `/auth/register` | — (rate-limited: 10/10min/IP) | `FormData` — same fields as the existing web signup routes, plus `category`, `deviceId?`, `platform?` | 201 `{accessToken,refreshToken,expiresIn,user}`. Checks `MOBILE_JWT_SECRET` is configured *before* creating the account (500 config error, nothing created, if not). If the account is created but token issuance then fails for some other reason, still 201 — `{user,tokens:null}` with `meta:{message:"Account created, please log in"}` — the account is never deleted or treated as a failed registration once it exists; the client should fall back to `/auth/login`. |
| Refresh | POST | `/auth/refresh` | — | `{refreshToken,deviceId?,platform?}` | `{accessToken,refreshToken,expiresIn}` (rotated — see below). On rejection, returns the same `error.code` values as `/me` (see Error codes below) — `ACCOUNT_BLOCKED` (403), `ACCOUNT_NOT_FOUND` (401), or `TOKEN_INVALID` (401, dead/reused/malformed refresh token). |
| Logout | POST | `/auth/logout` | — | `{refreshToken}` | `{success:true}` |
| Forgot password | POST | `/auth/forgot-password` | — | `{email}` | `{message}` (reuses `/api/reset-password`'s logic) |
| Verify reset code | POST | `/auth/verify-reset-code` | — | `{email,code}` | `{message}` (new in Phase A — thin wrapper over the same `verifyResetCode` the web `/api/auth/verify-code` calls; the web route is untouched) |
| Reset password | POST | `/auth/reset-password` | — | `{email,code,password}` (password min length 6, enforced same as signup) | `{message}` (reuses `/api/auth/verify-code` + `/api/auth/update-password`'s logic in one call) |
| Social sign-in | POST | `/auth/social` | — | `{idToken,provider:"google"\|"apple",name?,deviceId?,platform?}` | `{accessToken,refreshToken,expiresIn,user}` — `name` only matters for Apple (its id_token never carries a name; the client sends it separately on first authorization) |
| Guest checkout identity | POST | `/auth/guest` | — (rate-limited: 10/10min/IP) | `{name,email,phone,deviceId?,platform?}` | `{accessToken,refreshToken,expiresIn,user}`, or 409 if that email already belongs to a password-protected account (never auto-signs into an account it doesn't own) |
| Current user | GET | `/me` | bearer | — | `{user}` |
| Delete account | DELETE | `/me` | bearer | — | `{success:true}` — anonymizes in place (email → `deleted+<id>@invalid`, PII wiped, googleId/appleId/password unset, `deletedAt` set); the `User` document and its `_id` are kept so existing Booking/EventTicketPurchase/Review references never dangle |

**Note on password reset email normalization** (Phase A): `sendResetCode`,
`verifyResetCode`, and `setNewPassword` (`server/lib/passwordReset.ts`) now all
`.trim().toLowerCase()` the email consistently at every step, for both the web
(`/api/reset-password`, `/api/auth/verify-code`, `/api/auth/update-password`) and
mobile callers that share this logic — previously `setNewPassword` did neither,
which could cause a reset to silently fail to match the account if the client sent
the email with different casing/whitespace than the earlier steps.

**`AuthUser` shape** (`server/lib/authUser.ts`) — this is what every `user` field
above actually contains. Field names deliberately mirror the web session's
`session.user` shape (verified against `authOptions`'s `session` callback directly):

```ts
type AuthUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  category: "user" | "business" | "super-admin";
  business_name?: string;
  business_category?: string;
  business_type?: "employee_based" | "item_based" | null;
  city_name?: string;
  community_name?: string;
  location?: string;
  phone_number?: string;
  emailVerified?: Date | null;
  isblocked: boolean;
  verified: boolean;
  googleId?: string | null;
  appleId?: string | null;
};
```

**Token design**: access tokens are short-lived (15 min) HS256 JWTs signed with
`MOBILE_JWT_SECRET` (a new secret, deliberately separate from `NEXT_AUTH_SECRET`),
verified via `server/lib/mobileJwt.ts` — the only file `proxy.ts` imports from, kept
free of any Mongoose dependency so it stays Edge-runtime-safe. Refresh tokens are
opaque random strings (30-day lifetime), stored server-side only as a sha256 hash
(`server/models/RefreshToken.model.ts`) — the raw value is never persisted.

**Refresh rotation**: each successful `/auth/refresh` call atomically revokes the
presented token and issues a new pair (a single `findOneAndUpdate` guarded on
`revokedAt:null`, so two simultaneous calls can never both win). Presenting an
already-revoked token within a 30-second grace window of its own revocation — the
signature of a racing duplicate call, not theft — issues a fresh **sibling** pair
without touching the token's real successor; both remain valid. Presenting a dead
token outside that window (or with no valid successor) is treated as a replayed/stolen
token: every other active refresh token for that user is revoked immediately, forcing
re-login on every device.

**`getAuthUser(req)`** (`server/lib/getAuthUser.ts`) is the one identity check both
the web session cookie and the mobile bearer token go through. It tries the existing
NextAuth session first, falling back to `Authorization: Bearer`; either path does a
*fresh* Mongo read and rejects if the account is `isblocked` or has `deletedAt` set —
this is applied consumer-side to `event/ticket/purchase`, `event/ticket/hold`,
`event/ticket/hold/release` (all still guest-allowed — `getAuthUser` returning `null`
is handled identically to a missing session before), `tickets`, `favroite`, `review`,
`review/edit/[id]`, `review/delete/[id]`, `event/redeem`, `user/profile`,
`user/update`. **Business-only routes (event create/edit/delete/archive, event
verify*, event/redeem/get-business, send-invoice) are explicitly NOT swapped in this
phase** — v1 is consumer-only.

⚠️ **Behavior change on the web path, not just additive**: those 10-11 routes now
reject a blocked (`isblocked`) or deleted user even on an existing, still-valid web
session cookie — previously a stale JWT session could keep working against these
specific routes until it naturally refreshed. This also adds one extra DB read per
authenticated request to those routes.

Rate limiting: `proxy.ts`'s global 20-req/10s-per-IP limiter now keys by
`user:<id>` when a valid bearer token is present (verified Edge-side via
`mobileJwt.ts`, no DB call), falling back to `ip:<ip>` exactly as before — the limit
itself is unchanged. `/auth/register` and `/auth/guest` additionally have their own
stricter 10-req/10min-per-IP limiter (`server/lib/mobileRateLimit.ts`) on top of that,
since they're the two endpoints that can create an account/identity with no password
guess required.

### Error codes

Every `error` object may carry an optional `code` alongside `message` — a stable,
machine-readable string the client can switch on without parsing prose.

| Code | HTTP status | Meaning |
|---|---|---|
| `ACCOUNT_BLOCKED` | 403 | The credential (session or bearer token) is valid and identifies a real account, but that account has `isblocked:true`. The client should show a "your account has been blocked" message, not prompt for re-login. |
| `ACCOUNT_NOT_FOUND` | 401 | The credential identifies a user id that no longer resolves to a usable account — either genuinely doesn't exist, or resolves to one with `deletedAt` set (anonymized via `DELETE /me`). The client should clear stored tokens and treat this as "not logged in". |
| `TOKEN_INVALID` | 401 | No bearer token was presented, or the one presented is malformed, unsigned, or expired. The client should attempt `/auth/refresh`, and if that also fails, clear tokens and prompt for login. |

`GET/DELETE /me` and `POST /auth/refresh` always return these on rejection,
regardless of caller. The following **8 of the original 11 Phase 1 consumer-swapped
routes** now also return `{message,code}` on this list **when the caller used a
bearer token** — `GET/PATCH /api/user/profile`, `POST /api/user/update`,
`GET/POST /api/event/redeem`, `POST /api/favroite` / `GET /api/favroite`,
`GET /api/tickets`, `POST /api/review`, `PATCH /api/review/edit/[id]`,
`POST /api/review/delete/[id]`. Each keeps its own historical top-level key name
(`error` for most; `message` where that route always used `message` — see each
route's existing shape) — only the *value* upgrades from a bare string to
`{message,code}`, and only on the bearer path.

**The web session-cookie path for all 8 is byte-identical to before Phase A** — a
missing/invalid web session still gets that route's original plain response, never a
coded one; coded errors only ever appear when `Authorization: Bearer` was actually
presented and rejected (`getAuthUserDetailed(req).viaBearer === true`).

**Not touched, unchanged from Phase 1**: `event/ticket/hold`, `event/ticket/purchase`
(both intentionally guest-allowed, never reject on missing auth), and
`event/ticket/hold/release` (its 403 is an ownership mismatch, not an auth-rejection
reason — ships its own error shape, unrelated to this code list).

---

## Events & Tickets

This is the deepest, most-recently-built area of the codebase (this session built the
guest checkout, ticket holds, and business scanning/reports on top of it).

| Purpose | Method | Path | Auth | Notes |
|---|---|---|---|---|
| List/search events | GET | `/api/event/getallevent` | — | Query params (from `useGetAllEvents`, `services/event.service.ts:148-177`): `category, search, city, community, from, to, lat, lng, radius`. Returns `ApiResponseType<Event[]>`. Geo-radius search implies a `$geoNear`/2dsphere query — same pattern as `User.geo` (`Auth.model.ts:83`) and likely `Event.geo`. |
| Get single event | GET | `/api/event/single-event/[id]` | — | Path param is the **slug** (lowercased, non-alphanumeric stripped — see `components/Event/SingleEventPage.tsx`), not the Mongo `_id`. Returns `ApiResponseType<Event>` with `reviews: ReviewType[]` embedded. |
| Get event for edit form | GET | `/api/event/single-event-for-form/[id]` | 🔒 | Business-only variant (raw, unformatted for the edit form). |
| Create event | POST | `/api/event` | 🔒 | `FormData` — see field list in `app/api/event/route.ts` (title, description, venue, city, community, category, location, location_tba, email, phone_number, website_link, dateRange(json), price_category, ticket_link, options(json), promo_codes(json), event_rules, refund_policy, host_name, support_details, startTime, endTime, latitude, longitude, registration_capacity, max_tickets_per_request, show_remaining_tickets, image file). |
| Edit event | PATCH | `/api/event/edit/[id]` | 🔒 | Same field set. **Important**: merges `options[].sold`/`promo_codes[].used` by `_id` rather than blindly overwriting — a naive full-array replace would zero out real sales counters (a bug this session fixed). A mobile edit screen must send existing option/promo `_id`s back, not just names, or it will silently create duplicates. |
| Archive event | POST | `/api/event/archive/[id]` | 🔒 | Business rule (added this session): can only archive once the event has ended AND (if any ticket was ever sold) not before then — see `06-features-and-business-logic.md`. |
| Delete event | POST/DELETE | `/api/event/delete/[id]` | 🔒 | ⚠️ UNVERIFIED exact HTTP verb — `services/event.service.ts` has this commented out (`useDeleteEvent`, lines 194-203); not currently called from the UI. |
| Price + hold a cart (web) | server action | `getEventTicketPaymentIntent` in `app/actions/eventTicketStripe.tsx` | — (guests allowed) | Web's Server Action — now a thin wrapper over `priceEventTickets` in `server/lib/eventTicketPricing.ts` (extracted verbatim in Phase A, zero behavior change). Re-derives pricing server-side: `serviceFee = quantity * $2.00`, `surcharge = 2.5% of (ticketTotal+serviceFee)`, creates/updates a Stripe PaymentIntent, returns `{ clientSecret, paymentIntentId, invoiceNumber, items[], ticketTotal, serviceFee, surcharge, totalToPay, promoApplied }`. |
| Price + hold a cart (mobile) | POST | `/api/mobile/v1/event/ticket/price` | — (guests allowed; rate-limited 30/min, keyed by user id when known else IP) | **New in Phase A/2** — the mobile-callable REST equivalent of the Server Action above; calls the exact same `priceEventTickets` function, so pricing is byte-identical between web and mobile. Body `{eventId, items:[{optionId,quantity}], promoCode?, previousPaymentIntentId?}`. `getAuthUser(req)` is called only so the rate limiter can key by user id — pricing itself never trusts or requires caller identity; buyer identity is only ever attached later, at finalize (`POST /api/event/ticket/purchase`). Response `data` is the same `EventTicketPricing` shape as the Server Action's return value. |
| Hold tickets | POST | `/api/event/ticket/hold` | — (guests allowed) | Body `{ eventId, items:[{optionId,quantity}], paymentIntentId }`. Idempotent per `paymentIntentId` (repeat calls don't reset the 5-minute timer). Validates `capacity - sold - held >= quantity` per option inside a Mongo transaction; increments `held`; creates a `TicketHold` doc (TTL index, `expiresAt`). Response `{ success, expiresAt }`. Errors: `` `Only ${remaining} ${name} ticket(s) available right now` `` / `` `${name} tickets are not available right now` ``. |
| Release a hold | POST | `/api/event/ticket/hold/release` | — | Body `{ paymentIntentId }`. No session required — the `paymentIntentId` itself is treated as a bearer secret for release authorization (only the client holding that ID would know it). Decrements `held`, deletes the `TicketHold` doc. |
| Finalize purchase | POST | `/api/event/ticket/purchase` | — (guests allowed) | Body `{ eventId, paymentIntentId, guestInfo?: { name, email, phone } }`. **Idempotency check runs first** (returns the same result if `paymentIntentId` already has a purchase — safe to retry). If no session and no `guestInfo`, 400 `{ error, code: "GUEST_INFO_REQUIRED" }`. Verifies the Stripe PaymentIntent succeeded, re-derives pricing, consumes the hold (or falls back to a raw capacity check if the hold expired), creates the `EventTicketPurchase`, emails tickets, and — for a brand-new/passwordless guest account — mints an auto-login session cookie (see `05-auth-and-user.md`). Response: `{ success, purchaseId, invoiceNumber, items:[{optionName,codes}], signedIn, receipt?: {...} }` — `receipt` (added this session) carries everything needed to render a post-payment ticket page without another authenticated call: event summary, itemized `items` (with `uniqueKeys`), `ticketTotal, serviceFee, surcharge, totalAmount, promoCode, createdAt, holderName`. |
| List purchases (business) | GET | `/api/event/ticket/purchase?eventId=` | 🔒 | Business-scoped: `EventTicketPurchase.find({business: session.user.id})`, `.populate("event").populate("user","name email")`. `eventId` query param optional (filters to one event). |
| Send invoice email | POST | `/api/event/ticket/purchase/[purchaseId]/send-invoice` | 🔒 | Re-sends the invoice email for an existing purchase. |
| Redeem a free ("registration") ticket | POST | `/api/event/redeem` | 🔒 | Body `{ eventId, userId, business }`. For `price_category: "registration"` events — generates a `uniqueKey`, response `{ success, uniqueKey }`. |
| List my redemptions | GET | `/api/event/redeem` | 🔒 | Current user's registration-ticket redemptions. |
| List redemptions for my business | GET | `/api/event/redeem/get-business` | 🔒 | Business-scoped. |
| Scanner/manual verify | GET/POST | `/api/event/verify`, `/api/event/verify/[id]`, `/api/event/verify/manual` | 🔒 | Verifies a scanned QR code or manual status change; scoped so a business can only verify tickets for events it created. Case-insensitive code matching (a bug fixed this session — legacy mixed-case codes are backfilled on read). Manual status change writes a per-code `verifiedTimestamps` entry rather than a single shared `verifiedAt`, so changing one ticket's status never corrupts another ticket's displayed check-in time (also a fix from this session). |
| List tickets for a session | GET | `/api/tickets` | 🔒 | Merges deal redemptions + event redemptions + event ticket purchases into one array for the logged-in user's "My tickets" screen. |

### Pricing formulas (re-derive these exactly — do not trust client input)
- `serviceFee = totalQuantity * 2.00` (AUD, flat per ticket)
- `surcharge = (ticketTotal + serviceFee) * 0.025` (2.5% card surcharge)
- `totalToPay = ticketTotal + serviceFee + surcharge`
- A promo code discounts `unitPrice` by `discount_percentage`% on each matching option
  (`applicable_options` empty ⇒ applies to every option in the event).
- The finalize route **compares `paymentIntent.amount` (cents) to the re-derived
  total** and 400s on any mismatch — a mobile client must never assume it can pass a
  price; it only ever supplies `eventId` + `items` and reads back the authoritative price.

---

## Deals

| Purpose | Method | Path | Auth | Notes |
|---|---|---|---|---|
| List all deals (public browse) | GET | `/api/deals/get-all` | — | Query: `category, search, from, to, city`. |
| List my deals (business) | GET | `/api/deals` | 🔒 | |
| Create/update deal | POST/PATCH | `/api/deals` / `/api/deals/edit/[id]` | 🔒 | `FormData`, image upload. |
| Get single deal | GET | `/api/deals/single-deal/[id]` | — | |
| Delete deal | POST | `/api/deals/delete/[id]` | 🔒 | |
| Redeem a deal | POST | `/api/deals/redeem` | 🔒 | Body `{ dealId, userId, business, paymentIntentId?, quantity? }` — deals can apparently also be paid (`paymentIntentId`/`quantity` present) ⚠️ UNVERIFIED whether deal purchase uses the same Stripe pattern as events; not traced this pass. Response `{ success, uniqueKey, paymentIntentId? }`. |
| Redeem multiple | POST | `/api/deals/redeem/multiple` | 🔒 | Same shape, presumably a quantity > 1 path — ⚠️ UNVERIFIED how this differs from passing `quantity` to the single endpoint above. |
| List my redemptions | GET | `/api/deals/redeem` | 🔒 | |
| Get redemptions for one deal (business) | GET | `/api/deals/redeem/single/[id]` | 🔒 | |
| Verify a redemption code | POST | `/api/deals/verify` | 🔒 | Business scanning/manual verify, mirrors event verify. |

---

## Business directory & profile

| Purpose | Method | Path | Auth | Notes |
|---|---|---|---|---|
| Search/list businesses | GET | `/api/business` | — | Query (from `useGetBusiness`, `services/business.service.ts:49-68`): `category, search, service, city, community, lat, lng, radius, swLat, swLng, neLat, neLng` — supports both radius search and a bounding-box (`sw*/ne*`) search, i.e. map-viewport search. Returns `ApiResponseType<UserBusinessType[]>`. |
| List all businesses (no filters) | GET | `/api/business` (no params) | — | `useGetALLBusiness` calls the same endpoint with an empty query. |
| Single business (public) | GET | `/api/business/single/[id]` | — | |
| Single business (dashboard) | GET | `/api/business/getwithid/[id]` | 🔒 | |
| Get/update operating hours | GET/POST | `/api/business/operating-hours` | 🔒 | |
| Get operating hours (public, by id) | GET | `/api/business/operating-hours/get-single/[id]` | — | |
| Update business type | POST | `/api/business/businesstype` | 🔒 | `{ business_type: "employee_based" \| "item_based" }` |
| Update ABN | POST | `/api/business/abn` | 🔒 | `{ abn_number }` |
| Business profile | GET/PATCH | `/api/business/profile` | 🔒 | |
| Business settings | GET/PATCH | `/api/business/settings` | 🔒 | |
| Complete business profile (post-signup) | POST | `/api/profile-complete-business` | 🔒 | |
| Business dashboard stats | GET | `/api/business-dashboard` | 🔒 | `{ dailyStats:[{date,appointments,sales}], totalAppointments, totalSales, recentBookings, upcomingBookings, todayBookings }` |
| General dashboard (user) | GET | `/api/dashboard` | 🔒 | `{ favorite?, deals? }` |
| Dashboard search | GET | `/api/dashboard/search` | 🔒 | ⚠️ UNVERIFIED query params/shape — not traced this pass. |

---

## Bookings (services/appointments)

| Purpose | Method | Path | Auth | Notes |
|---|---|---|---|---|
| List services | GET | `/api/services?business_id=` | — for browse / 🔒 for `/api/services/user` | `business_id` optional query param. |
| Single service | GET | `/api/services/single/[id]` | — | |
| My services (business) | GET | `/api/services/user` | 🔒 | |
| Create/update service | POST | `/api/services` / `/api/services/single/[id]` | 🔒 | Also used for the `is_active` toggle (partial `{ is_active }` body to the single-service POST). |
| Delete service | DELETE | `/api/services/single/[id]` | 🔒 | |
| Assign employees to service | POST | `/api/services/assign-employee` | 🔒 | `{ serviceId, employeeId: string[] }` |
| Available slots | GET | `/api/bookings/available-slots` | — | Query: `service_id, date, business_id?, duration_minutes, employee_id?, timezone`. Response `{ success, count, available_slots: string[], slot_remaining?: Record<string,number> }` (the latter only for `resource_based` services). |
| Create a booking lock (hold a slot) | POST | `/api/bookings/lock` | 🔒 (⚠️ inferred — not traced; `useCreateBookingLock` implies session context via `user_id`) | Body: `BookingLockPayload{ business_id, service_id, employee_id, start_time, timezone, inventory_quantity, items:[{service_id,quantity,multiplier}] }`. Response `{ success, lock_id, total_price }`. |
| Confirm booking | POST | `/api/bookings` | 🔒 | Body `{ lock_id, start_time, service_id, items, idempotency_key?, employee_id? }` (per the actual route read — the client type `BookingPayload` in `services/booking.service.ts:88-102` is narrower than what the route reads; ⚠️ treat the route, `app/api/bookings/route.ts:32-388`, as authoritative). **Creates the booking directly with `payment_status: "pending"` — does not itself call Stripe.** Re-validates the lock, re-derives price/duration server-side from `Service`/`Employee` overrides, runs concurrency checks (employee double-booking, resource capacity peak-usage, group-session slot capacity), sends confirmation emails, creates a business `Notification`. Response 201 `{ success, message, data: Booking }`, or 409 for `SLOT_TAKEN`/`OUT_OF_STOCK`. |
| List my bookings (business) | GET | `/api/bookings` | 🔒 | Despite the name, filters `Booking.find({business_id: session.user.id})` — i.e. this is the **business's own bookings**, not a consumer's. |
| List my bookings (consumer) | GET | `/api/bookings/user` | 🔒 | **Confirmed** (`components/Dashboard/UserBookings/UserBookings.tsx:755`) — this is the real consumer "my bookings" endpoint. Response `{ data: BookingRecord[] }`. |
| Cancel a booking (consumer) | PATCH | `/api/bookings/user/[id]` | 🔒 | Body `{ action: "cancel" }` (`UserBookings.tsx:774-777`) — the same route likely supports other `action` values; only `cancel` was observed. |
| Single booking | GET/PATCH | `/api/bookings/[id]` | 🔒 | |
| Update booking status | PATCH | `/api/bookings/status` | 🔒 | `{ bookingId, newStatus, notes }` |
| Today's bookings | GET | `/api/bookings/today` | 🔒 | |
| Verify a booking (QR/manual, presumably) | POST | `/api/bookings/verify` | 🔒 | ⚠️ UNVERIFIED — not traced this pass, inferred from naming parallel to event/deal verify. |
| Calendar view | GET | `/api/calendar/bookings`, `/api/calendar/appointments` | 🔒 | `start_date, end_date, timezone` query params. |
| ~~Hosted Stripe Checkout for bookings~~ | POST | `/api/checkout-session` | — | ⚠️ **Likely dead/legacy code** — computes price from a **hardcoded `basePrice = 50.0`** (`app/api/checkout-session/route.ts:32`, comment: "Replace with your service db price logic if dynamic") rather than the real service price. The live booking-creation path (`POST /api/bookings` above) does not call this route or go through Stripe at all — it creates the booking as `payment_status: "pending"` directly. Its paired webhook (`app/api/webhooks/stripe/route.ts`) still listens for `checkout.session.completed` and would create a *second*, differently-shaped `Booking` document if ever triggered. **Do not model mobile booking-payment on this route** — flagged as a blocker-priority question in `99-open-questions.md`/`12-mobile-gap-report.md`: is online payment for bookings intentionally deferred to in-person, or is this an incomplete feature? |

---

## Employees, resources, scheduling (business-side; light coverage — lower mobile priority)

| Purpose | Method | Path | Auth |
|---|---|---|---|
| List/create employees | GET/POST | `/api/employees` | 🔒 |
| Single/update/delete employee | GET/POST/DELETE | `/api/employees/[id]` | 🔒 |
| Employee weekly schedule | PATCH | `/api/employees/[id]/schedule` | 🔒 |
| Time off (list/create) | GET/POST | `/api/employees/time-off` | 🔒 |
| Time off (delete) | DELETE | `/api/employees/time-off/[id]` | 🔒 |
| Shift overrides (list/upsert) | GET/POST | `/api/employees/shift-overrides` | 🔒 |
| Shift override (delete) | DELETE | `/api/employees/shift-overrides/[id]` | 🔒 |
| Resource overrides (list/upsert/delete) | GET/POST/DELETE | `/api/resources/overrides` | 🔒 |
| Resource schedule | PATCH | `/api/resources/[id]/schedule` | 🔒 |
| Categories (inventory-style, list/create/update/delete) | GET/POST/PATCH/DELETE | `/api/categories`, `/api/categories/[id]` | 🔒 |
| Clients list / detail | GET | `/api/clients`, `/api/clients/[id]` | 🔒 | `q` search param on list. |
| Inventory categories/services | GET/POST | `/api/... ` (component-level `/api/inventory` per `services/inventory.service.ts` — ⚠️ that literal path was not found in the `app/api/**/route.ts` glob; likely nested under `/api/services` or renamed — **treat as unverified**, flagged in `99-open-questions.md`) | 🔒 |

---

## Reviews, favorites, notifications, profile

| Purpose | Method | Path | Auth | Notes |
|---|---|---|---|---|
| List reviews for a business | GET | `/api/review?business_id=` | — | |
| Create/update review | POST/PATCH | `/api/review` / `/api/review/edit/[id]` | 🔒 | `{ business_id, rating, comment, review_id? }` |
| Delete review | POST | `/api/review/delete/[id]` | 🔒 | |
| Reply to a review (business) | POST | `/api/review/reply/[id]` | 🔒 | `{ reply: string }` |
| Add/remove favorite | POST | `/api/favroite` | 🔒 | `{ item_id, item_type: "Event"\|... }` — toggles; ⚠️ inferred toggle vs. separate add/remove verbs, not traced. |
| List my favorites | GET | `/api/favroite` | 🔒 | `{ events, deals, services, business }` |
| Notifications (list) | GET | `/api/notifications` | 🔒 | |
| Single notification (read/delete) | GET/PATCH/DELETE | `/api/notifications/[id]` | 🔒 | |
| Profile (view/update) | GET/PATCH | `/api/user/profile`, `/api/user/update`, `/api/edit-profile` | 🔒 | ⚠️ three routes touch the same data — see `05-auth-and-user.md`. |
| Delete account | POST | `/api/delete-profile` | 🔒 | |
| Upload profile pic | POST | `/api/upload-profile-pic` | 🔒 | `FormData{ image }` → `{ url }` |
| Landing page data | GET | `/api/landing?city=` | — | Aggregated homepage data (featured events/deals/businesses by city) — shape not traced. |
| Categories (public taxonomy) | GET | `/api/categories` | — | Note: same path family as the business-scoped inventory categories above but likely a different, public route — ⚠️ UNVERIFIED whether these are the same handler with conditional scoping or two different concerns sharing a name. |

---

## Sanatan Samaj (community org vertical)

| Purpose | Method | Path | Auth |
|---|---|---|---|
| Donate | POST | `/api/sanatansamaj/donate` | ⚠️ unverified |
| Community events | GET/POST | `/api/sanatansamaj/event` | ⚠️ unverified |
| Membership | GET/POST | `/api/sanatansamaj/membership` | ⚠️ unverified |

Not traced this pass — low priority for a first mobile release unless the team says
otherwise (flag in `99-open-questions.md`).

---

## Super-admin (platform operator — likely out of scope for v1 mobile)

| Purpose | Method | Path | Auth |
|---|---|---|---|
| List/manage businesses | GET/DELETE | `/api/super-admin/business`, `/business/delete/[id]` | 🔒role (super-admin) |
| Block/unblock | POST | `/api/super-admin/business/block/[id]` | 🔒role |
| Verify business | POST | `/api/super-admin/business/update-verify/[id]` | 🔒role |
| List users | GET | `/api/super-admin/users` | 🔒role |
| List/manage events | GET/DELETE | `/api/super-admin/events`, `/events/[id]` | 🔒role |
| List/manage deals | GET/DELETE | `/api/super-admin/deals`, `/deals/[id]` | 🔒role |
| Sponsor a business/event | POST | `/api/super-admin/sponsor`, `/sponsor/event` | 🔒role |

## Infrastructure / webhooks (not app-facing)

| Purpose | Method | Path | Notes |
|---|---|---|---|
| Stripe webhook | POST | `/api/webhooks/stripe` | Signature-verified (`STRIPE_WEBHOOK_SECRET`). Only handles `checkout.session.completed` (the booking hosted-checkout flow that appears to be dead — see above). The event-ticket flow does **not** rely on this webhook; it finalizes synchronously via `confirmPayment({redirect:"if_required"})` + `POST /api/event/ticket/purchase`. |
| One-off geo backfill | POST(?) | `/api/migrate-geo` | Admin/ops utility, not app-facing. |

---

## Pagination

`useFetcher` (`lib/generic.service.tsx:8-37`) defaults every list query to
`{ page: "1", per_page: "10" }` appended as query params, and `ApiResponseType` carries
a matching `pagination: { total_number, count, per_page, current_page, last_page }`
block. This is only meaningful for routes that actually implement server-side paging —
⚠️ UNVERIFIED which specific list routes honor `page`/`per_page` vs. return everything
regardless (several routes read in this pass, e.g. event/deal listing, showed no
`.skip()/.limit()` — treat pagination as **not implemented** on those until proven
otherwise per-route).

## Caching / revalidation

Purely client-side via TanStack Query — no `revalidatePath`/`revalidateTag`,
no `Cache-Control` headers observed on API responses. Mutations call
`queryClient.invalidateQueries({queryKey:[...]})` after success (seen throughout the
components worked on this session). A mobile client should replicate this with its own
React Query (or equivalent) cache and invalidate on the same mutation/queryKey
boundaries — there is no server-driven caching contract to depend on.

## Error handling convention

`lib/action.ts`'s `Post`/`PATCH` throw `new Error(rawResponseBodyText)` on any non-2xx —
i.e. **the raw JSON string**, not a parsed object. Callers that do
`toast.error(error.message)` directly (without `JSON.parse`-ing first) will show raw
`{"error":"..."}` text to the user — a real bug pattern that recurred several times in
this codebase's history (see `components/Stripe/EventCheckOut.tsx`'s
`parseErrorMessage` helper for the correct pattern). **The mobile HTTP client should
always attempt `JSON.parse` on an error body** and fall back to the raw text only if
that fails.

## ⚠️ Mobile compatibility check — see `12-mobile-gap-report.md` for the full table

Quick summary of what's flagged there: the Server Action
(`getEventTicketPaymentIntent`), the entire cookie-only auth model, the dead
`checkout-session`/webhook booking-payment path, the missing consumer-facing
"my bookings" confirmation, and the global unauthenticated IP rate limit (20 req/10s)
are the items most likely to block a straightforward "point the app at these APIs" plan.
