# whaustralia.com SEO Audit

Nov 20, 2026 · @Deswits

## Summary

Every page on the site, including live whaustralia.com, sends crawlers an HTML page that contains only "Loading Your Content © 2026 WHA": 5 words, no H1, no links. Fix that first. Most other issues are much smaller by comparison.

The groundwork is already good. Titles, descriptions and canonicals are generated per event and business, there is a dynamic sitemap and robots.txt, OG images, and JSON-LD. Most of that work is hidden by the issue above or weakened by the bugs below.

**Top 5 fixes, in order:**

1. **Remove the client-side loading gate** in `components/Auth/SessionWrapper.tsx` so pages render on the server. Then prefetch listing data on the server for `/`, `/events` and `/deals`.
2. **Stop every page from claiming the homepage as its canonical.** `app/layout.tsx` sets `canonical: "/"` and the homepage OG tags site-wide.
3. **Fix the Event JSON-LD.** Dates are invalid on many events (e.g. `2026-04-13T14:00:00.000ZT13:00:00`), there is no timezone, and two upcoming events have no location at all.
4. **Add crawlable navigation.** Nothing on the public site links to `/events`, `/deals`, the legal pages or business profiles. The footer has one link (Sunyaverse).
5. **Clean the sitemap, then build pages people search for.** The sitemap lists 29 past events, a login-only page and an empty deals page. Add city/category landing pages and a blog.

Scope: 32 URLs crawled on localhost:3000 (branch `fix/map-fullscreen-sizing`), both as raw server HTML and as rendered in a browser. I also read the Next.js 16 code in `F:\wha` and spot-checked the live homepage. I didn't measure Core Web Vitals, because a dev server gives meaningless numbers.

## Critical issues (fix first)

Five problems affect every page or every event, and each needs a code change.

### 1. Server HTML is a loading screen on every page

**Evidence.** Raw HTML for all 32 URLs, from `/` to `/events/albatrossinmelbourne` to `/privacy-policy`, contains only "Loading Your Content" and "© 2026 WHA". It has no H1, no internal links and no page text, and the live homepage is the same. The Event, LocalBusiness and BreadcrumbList JSON-LD exists only inside the React flight payload. It reaches the DOM after hydration.

**Cause.** `AuthGuard` in `components/Auth/SessionWrapper.tsx` returns `<LoadingPage />` while `useSession()` is `"loading"`, which is always the case on the server. It wraps everything in `app/layout.tsx`, so no page content is ever server-rendered.

**Impact.** Google must queue a JavaScript render before it sees any content, and it may index pages late or incompletely. Crawlers that don't run JavaScript see an empty page with no links to follow. That includes AI crawlers like GPTBot, ClaudeBot and PerplexityBot, and in practice often Bing. LCP is also delayed behind the session fetch. Link previews still work, because the OG tags in `<head>` render outside the gate.

**Fix.** Only gate the private areas, and render children everywhere else:

```js
const PRIVATE = ["/dashboard", "/super-admin", "/activity", "/favorites"];

if (status === "loading" && PRIVATE.some((p) => pathname.startsWith(p))) {
  return <LoadingPage />;
}
return <>{children}</>;
```

Better still, protect `/dashboard` and `/super-admin` server-side (`getServerSession` in their `layout.tsx`, or in `proxy.ts`) and delete the client gate.

### 2. Listing pages fetch their data only in the browser

After fix 1, `/`, `/search`, `/events` and `/deals` will still server-render "Loading…". Their cards come from React Query hooks (`useGetAllEvents`, `useGetBusiness`) that run client-side. Prefetch on the server and pass a `HydrationBoundary`, the way `app/events/[id]/page.tsx` already does. Then the first HTML contains the event titles, dates, venues and `<a href>` links to every event.

### 3. Every page without its own canonical points to the homepage

`app/layout.tsx` sets `alternates.canonical: "/"` and `openGraph.url: SITE_URL`. Child pages inherit both unless they override them.

- **Canonical = homepage** on `/auth/user`, `/auth/business`, `/v2.0`, `/favorites`, `/activity`, `/forgot-password`, `/blocked`, `/unauthorized`, the 404 page and all not-found event/deal/business pages.
- **og:url and og:title = homepage** on `/events`, `/deals`, `/bookings`, all legal pages and all auth pages. A shared `/events` link previews as the homepage.

**Fix:** delete `alternates` and `openGraph.url` / `title` from the layout. Give `app/page.tsx` its own metadata with `canonical: "/"`. Add a small `buildMetadata({ title, description, path })` helper in `lib/seo.ts` that returns title, description, canonical and a matching `openGraph` / `twitter` block, and use it in every static page.

### 4. Event dates in JSON-LD are invalid

`dateRange.from/to` is stored in three formats: `"2026-05-16"`, ISO strings like `"2026-04-13T14:00:00.000Z"`, and BSON Dates. The page builds `` `${from}T${startTime}:00` ``, which produces values Google rejects:

| Event | startDate sent to Google |
|---|---|
| nepalinewyear | `2026-04-13T14:00:00.000ZT13:00:00` |
| trnfest2026secondshow | `Sat Apr 11 2026 19:45:00 GMT+0545 (Nepal Time)T19:00:00` |
| albatrossinmelbourne | `2026-11-23T20:00:00` (valid, but no timezone; endDate is a bare date) |
| albatrossliveindarwin | location `name` and `address` both undefined |
| albatrossinsunshinecoast | venue empty |

**Fix:** normalise to the event's Australian timezone and always emit an offset. The ISO values are local midnight stored as UTC (`14:00Z` = 00:00 AEST next day), and converting in-timezone recovers the right day:

```ts
export function eventIso(dateVal: unknown, time = "00:00", tz = "Australia/Sydney") {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz })
    .format(new Date(dateVal as string)); // YYYY-MM-DD in venue time
  const off = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${day}T${time}:00Z`))
    .find((p) => p.type === "timeZoneName")!.value.replace("GMT", "") || "+00:00";
  return `${day}T${time}:00${off}`;
}
```

Pick `tz` from the state: NSW/ACT `Australia/Sydney`, VIC `Australia/Melbourne`, TAS `Australia/Hobart`, QLD `Australia/Brisbane`, SA `Australia/Adelaide`, NT `Australia/Darwin`, WA `Australia/Perth`. The Albatross tour alone spans five UTC offsets (+8 to +11). Store a `timezone` field on Event at creation and backfill existing events, and write `dateRange` as `YYYY-MM-DD` only from now on.

### 5. Key pages are orphans

On the public site, the only internal links are `/`, `/search`, `/auth` and the event cards. Nothing links to `/events`, `/deals`, `/bookings`, `/privacy-policy`, `/terms-*` or any `/businesses/*` page. The legal pages are linked only from inside the signup forms. `Footer.tsx` contains a single link, to sunyaverse.com.au.

- Add header links: Events, Businesses, Deals, List your business.
- Add a real footer with those plus About, Contact, Privacy, Terms, and Instagram/Facebook.
- On event pages, link the Host block to `/businesses/{slug}` (`components/Event/SingleEventPage.tsx`).
- Make deal cards real links: `deal-card.tsx` and `new-deal-card.tsx` use `onClick={() => router.push(...)}`, which crawlers can't follow. Wrap them in `<Link href>`, as `business-card.tsx` and `event-card.tsx` already do.

## Page-by-page findings

Every public page shares critical issues 1, 3 and 5. The table lists what is specific to each page, as seen after JavaScript renders.

| Page | HTTP / index | Title (chars) | Rendered H1 | Page-specific issues |
|---|---|---|---|---|
| `/` (home) | 200, indexable | 26 | "Local Businesses Near You" (screenreader only) | Title has no keywords. The H1 says businesses, but the page shows events. It renders two `<main>` elements, so every card is in the DOM twice. On load it rewrites the URL to `/search?lat=…&swLat=…`. There is no intro text. The layout description mentions "community news", which the site doesn't publish. |
| `/search` | 200, canonical → `/` | 45 | Same as home | Duplicate of home (canonical is fine), but it's still in the sitemap and in business breadcrumbs. Its description ("Nepali-owned local businesses") contradicts the home description. |
| `/events` | 200, indexable | 35 | "Events in Australia" (screenreader only) | Only the 10 upcoming events are listed: no city pages, no archive, no pagination. OG tags are the homepage's. |
| `/events/[slug]` (39 in sitemap) | 200, indexable | ~45–90 | Event name | Invalid JSON-LD dates (issue 4). The Host block doesn't link to the business. There are no "more events" links. The canonical keeps whatever casing was requested (`/events/AlbatrossInMelbourne` canonicalises to itself). Slugs have no hyphens. TBA venues go into titles ("Albatross in Hobart — To Be Announced"). The section is headed "Descriptions". |
| `/businesses/[slug]` (2 in sitemap) | 200, indexable | 140–164 | Present only in the desktop layout | Title and description contain the full geocoded address. Below 1024px there is no H1, and desktop and mobile layouts are both in the DOM. The description is empty and the page shows "Community Not Specified". The Services section is empty. |
| `/search/[slug]` | 200, canonical → `/businesses/[slug]` | 164 | — | Duplicate route; it took 1.9 s to respond on dev. Replace it with a 308 redirect. |
| `/deals` | 200, indexable | 34 | "Deals in Australia" (screen-reader only) | 0 deals ("No deals found"), yet it's in the sitemap at priority 0.9, hourly. Deal cards aren't links. |
| `/deals/[slug]` | none live | — | — | Expired deals are noindexed (good). Standalone Offer schema doesn't produce a rich result. |
| `/bookings` | 200, indexable | 51 | none (H3 "Sign in to view bookings") | A login-gated page titled "Book Treatments Online" and listed in the sitemap. |
| `/privacy-policy`, `/terms-and-conditions`, `/terms-of-service` | 200, indexable | 44–50 | Correct | Good content (about 1,700 words, proper H2/H3). Linked only from signup forms. OG tags are the homepage's. |
| `/auth`, `/auth/user/login`, `/auth/user/signup`, `/auth/business/login`, `/auth/business/signup` | 200, indexable | 30–50 | — | Login and signup pages are indexable. They should be `noindex, follow`, except a proper "List your business" marketing page. |
| `/auth/user`, `/auth/business` | 200, canonical → home | 26 | — | Default title and wrong canonical. Noindex them. |
| `/v2.0` | 200, indexable | 26 | none | Stub page whose only text is "page". Delete it. |
| `/activity`, `/favorites` | 200, noindex + robots-blocked | — | — | Fine. `/favorites` also canonicalises to home. |
| `/forgot-password`, `/reset-password`, `/verify-*`, `/email-sent`, `/blocked`, `/unauthorized` | 200, robots-blocked, no noindex | 26 | — | Default title; canonical → home. Add `robots: { index: false }`. |
| Unknown URL (404) | 404, noindex | 26 | — | Status is correct, but it's the default page: canonical → home, no links back. There is no `app/not-found.tsx`. |
| Unknown event, deal or business slug | 200 + noindex | — | — | Soft 404s. Call `notFound()` so they return 404. |

## Technical SEO

The sitemap is the main thing to clean here. Of its 49 URLs, 32 are past events, a non-canonical URL, a login page or an empty page.

### Sitemap (`app/sitemap.ts`)

- **29 of 39 event URLs are past events.** They date from April to September 2026. The query filters only on `archived`. Add a date filter (`dateRange.to >= today`), or keep past events out once they're 30 days old.
- **Remove `/search`**, which canonicalises to `/`, and `/bookings`, which needs a login.
- **Only include `/deals` when there is at least one live deal.** Do the same for future city and category pages.
- **The sitemap includes what looks like test content.** `/events/houseparty` has the description "Food event in my house" and the venue "My House". Archive it.
- Static routes have no `lastModified`. Use the newest `updatedAt` of the content they list. Google ignores `changeFrequency` and `priority`, so they're harmless but don't help.

### Duplicate URLs and redirects

- `/search/[id]` duplicates `/businesses/[id]`. Replace the page with `permanentRedirect(/businesses/${slug})`.
- Event canonicals use the raw URL parameter. In `app/events/[id]/page.tsx`, `absoluteUrl(/events/${id})` keeps uppercase or ObjectId variants as separate canonicals. Use `event.slug`, and `permanentRedirect` any request where `id !== event.slug`. Businesses and deals already canonicalise to the slug, but should redirect too.
- `buildPath()` in the Navbar and BottomNav appends `?city=` to every link, which creates parameter duplicates of every page. Replace query-param cities with path-based city pages (see Growth).
- Map panning rewrites the URL to `/search?lat=&lng=&swLat=&swLng=&neLat=&neLng=`, which creates endless unique URLs. They canonicalise to `/`, which is fine. Optionally add `Disallow: /*?*swLat=` to robots.txt to save crawl budget.

### Status codes

- Unknown event, deal and business slugs return 200 with noindex. That's a soft 404, which Search Console reports. In each `page.tsx`, `if (entity === null) notFound();`. Keep the current fallback for the DB-error (`undefined`) case.
- Add `app/not-found.tsx` with an H1, a search box and links to Events, Businesses and the city pages. Today's default 404 inherits the layout's homepage canonical.
- Delete `app/v2.0/page.tsx`.

### URL slugs

`generateSlug()` in `server/lib/slug.ts` deletes spaces instead of hyphenating them, which gives URLs like `/events/nepaleseandbhutaneseunitybasketballtournament2026`. Google recommends hyphens to separate words. Generic slugs also collide year to year: `nepalinewyear`, `rachana` and `rachanadahal` already exist.

1. Change it to `title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")`. Add the city and year for events, e.g. `nepali-new-year-2084-sydney`.
2. Store the old slug in a `legacySlugs: [String]` field and backfill it. On lookup, if the slug matches a legacy value, `permanentRedirect` to the new one.
3. Update `normalizeSlug()` in `app/events/[id]/page.tsx` and the slugify fallback in `sitemap.ts`. Both strip hyphens today.

### Indexing directives

Add `robots: { index: false, follow: true }` to the auth, forgot-password, reset, verify, blocked and unauthorized pages. For the `"use client"` ones, add a tiny server `layout.tsx` that exports the metadata.

`robots.txt` is otherwise fine. Leave `/auth` crawlable so Google can see the noindex.

### Housekeeping

- `public/.DS_Store` and `public/wha/.DS_Store` are publicly downloadable. Delete them and add `.DS_Store` to `.gitignore`.
- There are two web manifests (`manifest.json` and `site.webmanifest`), and neither is linked from the layout. Keep one and add `manifest: "/site.webmanifest"` to the metadata.
- Set `<html lang="en-AU">`.
- Check on production (I couldn't from localhost): `http://` and `www.` should 301 to `https://whaustralia.com`, and only one trailing-slash form should resolve.

## Structured data (JSON-LD)

The right schema types are in place, but Event and LocalBusiness are missing or corrupting the fields Google uses for rich results. All of it reaches the page only after hydration (critical issue 1).

| Schema | File | Problems | Fix |
|---|---|---|---|
| Event | `app/events/[id]/page.tsx` | Invalid or timezone-less dates (critical issue 4). `location.address` is a single string. Darwin's location is undefined. A TBA venue becomes the Place name. External-ticket events (the whole Albatross tour) have no `offers`. No `performer`. `organizer` has no `url`. Every event says `EventScheduled`, past ones included. | Use a `PostalAddress` (street, locality, region, postcode, `addressCountry: "AU"`). For TBA venues, use the city as the Place. Add `offers.url` = the ticket link. Add `performer` (needs a field on Event). Set `organizer.url` = the business page. |
| LocalBusiness | `app/businesses/[id]/page.tsx` | `description` is `""`. The full geocoded address is crammed into `addressLocality`. No `geo`, even though lat/lng are stored. No `openingHoursSpecification`, even though hours show on the page. No `telephone` or `sameAs`. Generic type. | Map the stored fields properly. Use a subtype by category (`MedicalBusiness` for health, `Restaurant`, `BeautySalon`…). Add `aggregateRating` only once real reviews exist. |
| BreadcrumbList | business pages | Item 2 is `/search`, which canonicalises to `/`. | Point it to a real `/businesses` hub page. Also show the breadcrumb visibly on the page. |
| Offer | `app/deals/[id]/page.tsx` | A standalone Offer isn't a rich-result type. | Low priority. Leave it, or nest it as `offers` inside the business's `LocalBusiness`. |
| Organization | `app/layout.tsx` | Fine. Note that the footer credits "Sunyaverse", not the brand. | Add `alternateName: "WHA"`, `email`, `areaServed: "AU"`. Change the footer to "© 2026 What's Happening Australia". |
| WebSite | `app/layout.tsx` | Fine | No change needed. A `SearchAction` isn't needed. |

What a corrected Event block should look like:

```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Albatross Live in Melbourne",
  "startDate": "2026-11-23T20:00:00+11:00",
  "endDate": "2026-11-23T23:00:00+11:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "Max Watts",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "125 Swanston Street",
      "addressLocality": "Melbourne",
      "addressRegion": "VIC",
      "postalCode": "3000",
      "addressCountry": "AU"
    }
  },
  "image": ["https://…/profile_1793602297218.png"],
  "performer": { "@type": "MusicGroup", "name": "Albatross" },
  "organizer": { "@type": "Organization", "name": "What's Happening Australia", "url": "https://whaustralia.com/businesses/whatshappeningaustralia" },
  "offers": { "@type": "Offer", "url": "https://tickets.oztix.com.au/outlet/event/bd03ad7a-…", "availability": "https://schema.org/InStock", "priceCurrency": "AUD" }
}
```

The end time (23:00) is illustrative: the event has no `endTime` stored. When an event has none, omit the time from `endDate` rather than inventing one.

Test every template in Google's Rich Results Test after deploying.

## On-page content

The site doesn't say in words what it is or who it's for, and the business pages are nearly empty. Content is where competitors can't simply copy you, so this matters as much as the code fixes.

### Pick one positioning and use it everywhere

The pages disagree about what the site is:

- Layout: "events, local businesses, deals, and community news across Australia". There is no news section.
- `/search`: "Nepali-owned local businesses".
- `/events`: "Nepali community events".

Decide on the core phrase, probably "Nepali events and businesses in Australia". Then use it in the home title, H1, description, OG tags and the Organization schema.

Suggested home metadata (in `app/page.tsx`):

```ts
export const metadata = {
  title: { absolute: "What's Happening Australia – Nepali Events & Businesses" },
  description: "Find upcoming Nepali concerts, festivals and community events across Sydney, Melbourne, Canberra and the rest of Australia, plus Nepali-owned local businesses and deals.",
  alternates: { canonical: "/" },
};
```

### Headings

- Make the H1 visible on `/`, `/events` and `/deals` (today they're `sr-only`) and add a 1–2 sentence intro under each. The home H1 says "Local Businesses Near You" while the default tab shows events. Make it follow the active tab.
- Fix the business page H1. Below 1024px the visible layout has no H1, and Google indexes the mobile version. Render one responsive layout instead of two copies (see Performance).
- Rename "Descriptions" to "About this event".

### Titles and descriptions

- Business titles run 140–164 characters because `city_name` holds a full geocoded address ("Colbee Court, Phillip Business District, …, 2606, Australia"). Store suburb and state separately and use `{name} – {suburb} {STATE}`, e.g. "CBR Nursing – Phillip ACT".
- Event titles use the venue, even when it's "To Be Announced". Use `{title} – {city} {date}` instead, e.g. "Albatross Live – Hobart, 1 Dec 2026".
- Business descriptions fall back to a template stuffed with the address. Prompt owners to fill `seo_description` in the dashboard.

### Thin and duplicate content

- Business pages: the description is empty and the page shows "Community Not Specified", no services and no photos (CBR Nursing). Hide empty sections, and require a description, at least one service and a photo before a profile is listed and added to the sitemap.
- The 10 Albatross pages share near-identical text, and the Melbourne page says the band will "take over Belconnen". Write unique copy per city (venue, support act, transport, age limits). Or add one tour hub page (`/tours/albatross-2026`) that links to each date.
- Two events have almost no text: `trnfest2026secondshow` (34 characters) and `houseparty` (22 characters). Expand or archive them.
- 29 past events are still indexable and marked `EventScheduled`. Show a "This event has ended" banner with links to upcoming events in the same city, and take them out of the sitemap. For recurring events (Nepa Jatra, Nepali New Year, Janmashtami), keep one evergreen URL per city and update it each year, so it keeps its rankings and backlinks.

### Smaller items

- The footer says "© 2026 Sunyaverse" on every page, while the loading screen says WHA. Credit the brand, with "built by Sunyaverse" if you like.
- Ticket links carry tracking junk (`fbclid`, `utm_*` from Instagram). Strip query parameters when an organiser saves a `ticket_link`.
- The host image alt is the event title. Use the host's name.
- Map tiles and the Leaflet marker shadow have no `alt`. They're decorative, so add `alt=""`.

## Performance, mobile and accessibility

The biggest speed win is critical issue 1. Today the browser has to download JS, fetch the session, then fetch the API before any content appears, so LCP is several round trips late. These items are next. Measure on production with PageSpeed Insights before and after, because dev-server numbers are meaningless.

- **Duplicate layouts.** `BusinessPage.tsx` (home and search) and the business profile mount the desktop and the compact layout at once and hide one with CSS. That means two `<main>` elements, every card and image twice, and 543 DOM nodes on a 5-event page. Render one responsive layout, or mount only the active one after a `matchMedia` check.
- **The map loads on every listing and detail page.** Leaflet plus 15–20 OpenStreetMap tiles load even when the map is below the fold. Load it with `next/dynamic` when it scrolls into view, or show a static preview with a "Show map" button on detail pages.
- **Leaflet marker icons come from unpkg.com**, an extra third-party connection. Self-host them in `/public`.
- **Images:** give the event hero image `priority` and a correct `sizes` so it's the LCP element. Event posters are uploaded as PNG/JPEG and served through `next/image`, which optimises them. That part is good.
- **Unused assets:** `public/lil-banner3.png` (1.4 MB), plus `skippy.png` and `skippy-banner.png`, which are identical. Only the retired landing page uses `lil-banner3.png`, and the Skippy images aren't referenced anywhere. Delete them, along with `tour-poster.webp`, which the code doesn't reference either. Check the database before deleting it.
- **Accessibility overlaps:** the visible H1s and decorative `alt=""` items (On-page content) also fix the matching Lighthouse accessibility warnings.

## Growth: pages people actually search for

The site has no page that can rank for a query like "Nepali events Sydney". Cities and categories exist only as `?city=` filters, which canonicalise away. City and category landing pages will likely bring more traffic than a blog, so build them first, then the blog.

### 1. City and category landing pages

- **Events by city:** `/events/city/sydney`, `/melbourne`, `/canberra`, `/brisbane`, `/adelaide`, `/perth`, `/hobart`, `/darwin`. Use a `/city/` segment so they can't collide with event slugs under `/events/[id]`. Give each a unique H1 and title, e.g. "Nepali Events in Sydney – Upcoming Concerts & Festivals". Add a short paragraph about the community there, the upcoming events server-rendered as links, a few recent past events, and an `ItemList` JSON-LD.
- **Events by category:** `/events/category/concerts`, `festivals`, `religious`, `sports`.
- **Business hub and filters:** `/businesses`, `/businesses/city/[city]`, `/businesses/category/[category]` (restaurants, beauty, health, migration agents…).
- **Tour pages** for multi-city tours, e.g. `/tours/albatross-2026`.
- **Avoid thin pages:** generate a page, and list it in the sitemap, only once it has at least 3 live listings. Otherwise noindex it.

### 2. Trust pages

- `/about`: who runs WHA, the mission, the communities served.
- `/contact`: email, social links and the business details.
- `/list-your-business`: a marketing page with benefits, pricing and FAQs, linking to signup. Today `/auth/business/signup` is the only page for business owners.
- `/faq`: genuinely useful answers. Google now shows FAQ rich results only for a small set of authoritative sites, so do this for users, not for the snippet.

### 3. Blog

The WHA team will write the posts, so store them in MongoDB with an editor in the existing super-admin, so the client can publish without a deploy. (MDX files in the repo also work if only developers will write.) What to build:

- `/blog` index with pagination, plus `/blog/[slug]` with `generateMetadata`, a canonical, OG image, `Article` and `BreadcrumbList` JSON-LD, author name, and published and updated dates.
- `/blog/category/[cat]` pages and an author page for credibility.
- Add posts to `sitemap.ts`. Optionally add an RSS feed at `/blog/rss.xml`.
- In every post, link to the matching city page, events and businesses. Show "Related articles" on event pages.

Starting topics. Check each with Search Console and Google Keyword Planner before investing; I haven't checked their search volumes.

| Topic | Target search | Links to |
|---|---|---|
| Nepali events in Sydney this month (one roundup per city, monthly) | nepali events sydney | `/events/city/sydney` |
| Nepali New Year 2084 celebrations across Australia | nepali new year sydney / melbourne | city pages, event pages |
| Dashain & Tihar 2027 events in Australia | dashain australia | festival events |
| Nepa Jatra 2027 tour dates and tickets | nepa jatra australia | evergreen event URLs |
| Best Nepali restaurants and momo spots in Canberra (then each city) | nepali restaurant canberra | business category pages |
| Guide for new Nepali students in Australia: community groups, shops, events | nepali community australia | `/about`, business pages |
| Albatross Australia tour 2026: dates, venues, tickets | albatross australia tour | `/tours/albatross-2026` |
| How to list your business on WHA | (for businesses) | `/list-your-business` |

### 4. Links from other sites

- Ask organisers to link to their WHA event page. The Auburn Nepalese Community, Nepa Jatra and the Albatross tour promoters are examples.
- Keep the Instagram and Facebook profiles in `sameAs`. Link back to the site from their bios.
- If WHA has a public address, create a Google Business Profile and keep the name and address identical everywhere.
- Search for the full name. "WHA" is also used by other Australian organisations (e.g. Workforce Health Assessors), so always write "What's Happening Australia" in titles and schema.

## Step-by-step action plan

Work top to bottom. Phase 1 alone takes the site from invisible to crawlable, so ship it on its own.

### Phase 1: make content crawlable (this week)

- [ ] `SessionWrapper.tsx`: show the loading gate only on private routes, and protect `/dashboard` and `/super-admin` server-side.
- [ ] Server-prefetch events and businesses for `/`, `/search`, `/events` and `/deals` (`HydrationBoundary`).
- [ ] `app/layout.tsx`: remove the inherited `canonical: "/"` and the homepage `openGraph.url` / `title`.
- [ ] Add `buildMetadata()` to `lib/seo.ts` and use it on every static page (home, events, deals, bookings, legal, auth).
- [ ] Give the home page its own keyword title, description and canonical.
- [ ] Fix the Event `startDate` / `endDate` with the timezone helper. Normalise the stored `dateRange` with a backfill script.
- [ ] Header and footer: add crawlable links to Events, Businesses, Deals, List your business, About, Contact, Privacy and Terms.
- [ ] Event page: link the Host block to `/businesses/{slug}`. Deal cards: switch from `router.push` to `<Link>`.
- [ ] Check with `curl -A "Googlebot" https://whaustralia.com/events/albatrossinsydney | grep -c "<h1"`. It should print 1 or more.

### Phase 2: technical clean-up (next week)

- [ ] Sitemap: drop past events, `/search` and `/bookings`. Include `/deals` only when it has deals. Add `lastModified`.
- [ ] Return a real 404 via `notFound()` for unknown events, deals and businesses. Add `app/not-found.tsx`.
- [ ] Make `/search/[id]` a 308 redirect to `/businesses/[slug]`. Redirect non-canonical event slugs (uppercase, ObjectId).
- [ ] Event canonical: use `event.slug`, not the URL parameter.
- [ ] Noindex the auth, password, verify, blocked and unauthorized pages. Delete `/v2.0`.
- [ ] Event JSON-LD: add `PostalAddress`, `offers.url`, `performer`, `organizer.url`, and a city fallback for TBA venues.
- [ ] LocalBusiness JSON-LD: add the real address fields, `geo`, opening hours, a subtype and a non-empty description.
- [ ] Delete `.DS_Store` files and unused images, link one manifest, set `lang="en-AU"`.

### Phase 3: on-page and structure (weeks 3–4)

- [ ] Visible H1 and intro text on home, events and deals. Make the home H1 match the active tab.
- [ ] Render one responsive layout instead of desktop and mobile duplicates, so the business page H1 shows on mobile.
- [ ] Deal detail pages have no `<h1>` at all (confirmed via production build HTML, `/deals/[slug]` - not previously called out in the audit, same underlying pattern as the business page H1 gap).
- [ ] Store suburb and state separately. Shorten business and event titles.
- [ ] Switch to hyphenated slugs with `legacySlugs` and 308 redirects.
- [ ] Show an "event ended" state with related upcoming events. Use evergreen URLs for recurring festivals.
- [ ] Lazy-load the map and self-host the Leaflet icons.
- [ ] Footer copyright: "What's Happening Australia".

### Phase 4: growth (month 2 onwards)

- [ ] City landing pages for events, then for businesses. Category pages once they have at least 3 listings each.
- [ ] `/about`, `/contact`, `/list-your-business`.
- [ ] Blog: super-admin editor, `/blog`, `/blog/[slug]`, Article schema, sitemap entries.
- [ ] Publish the first 4 posts: a city roundup for Sydney, Canberra and Melbourne, plus the Albatross tour guide.
- [ ] Ask event organisers and community associations to link to their WHA pages.
- [ ] Content rules for businesses: require a description, one service and one photo before listing.
- [ ] Rewrite the duplicate Albatross descriptions (the Melbourne page mentions Belconnen). Archive the `houseparty` test event.

## Implementation follow-ups (found while building Phase 1, not in the original audit)

Discovered verifying 1(c) (server-prefetching `/`, `/search`, `/events`, `/deals`). Not fixed - deferred.

- [ ] **Initial load server-renders the page 3 times.** SSR, then an RSC re-render when the geolocation fallback sets `lat`/`lng`, then another when the map's initial bounds settle - each running both the business and event queries. Possible fix: apply the fallback location in `page.tsx` itself so the first render already matches, and stop pushing the map's initial bounds into the URL.
- [ ] **Filter changes may leave stale results on screen until the server responds.** Changing category/city now triggers a real server round trip (previously a client-side fetch did too, just via a different path - not a regression, see the 1(c) commit). Measured ~100ms locally; check on the preview deploy. If noticeable, wrap the triggering `router.push` in `useTransition` and dim the results while `isPending`.

## After deploying: verify and monitor

The Search Console verification file is already in place at `public/googlef329283d5e4da8c5.html`. Confirm the property is verified, then run these checks.

| Check | Where | Pass when |
|---|---|---|
| Crawlers see real content | Search Console → URL Inspection → Test live URL → View crawled page (`/`, one event, one business) | The HTML tab shows the H1, event titles and `<a href>` links, not "Loading Your Content" |
| Event schema valid | Rich Results Test on 2–3 events, including Darwin and a Sydney one | "Event" detected, with no errors on `startDate` or `location` |
| Business schema valid | Rich Results Test on `/businesses/cbrnursing` | LocalBusiness with a full address and opening hours |
| Canonicals correct | View source on `/events`, `/auth/user` and a 404 | Each canonical is its own URL. A 404 has none. |
| Social previews | Facebook Sharing Debugger on `/events` | Shows the Events title and URL, not the homepage |
| Sitemap clean | Search Console → Sitemaps → resubmit sitemap.xml | No past events, `/search` or `/bookings`; all URLs return 200 |
| Soft 404s gone | Search Console → Pages report, a few weeks later | "Soft 404" and "Alternate page with proper canonical" counts falling |
| Speed | PageSpeed Insights, mobile, on `/` and one event | LCP under 2.5 s, CLS under 0.1 |

Also:

- Add the site to Bing Webmaster Tools (it can import from Search Console). Bing's index also powers Microsoft Copilot answers.
- Every month, check the Search Console Performance report filtered by queries containing "nepali". Those queries show which city pages and blog topics to expand next.
