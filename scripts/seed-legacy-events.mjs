// One-off fixture script for testing the 1(b)/1(c) Event date handling.
// wha_test has no events stored in the old, broken shape (the bug this
// fix targets), so this creates a few that mirror nepalinewyear's real
// shape, in 3 different states (two DST-observing, one not) to exercise
// addressRegion derivation too, plus one clean-format control event.
//
// Confirmed against production: "Mon Apr 13 2026 14:00:00 GMT+0000..." is
// JS Date.prototype.toString() output, meaning the legacy dateRange
// values are real BSON Date objects (Mongoose casts a stored Date to its
// String-typed schema field by calling .toString() on read) - not ISO
// strings. These fixtures insert actual Date instances (via strict:false,
// so Mongoose stores whatever type is given) to match.
//
// Defaults to a dry run: prints exactly what it would insert and writes
// nothing. Only inserts with --apply, and only ever against a MONGODB_URL
// whose path is literally /wha_test - refuses to run anywhere else.
import mongoose from "mongoose";

const DRY_RUN = !process.argv.includes("--apply");

const EventSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema, "events");

// Mirrors the actual pre-fix bug: a date picker holding local Sydney
// midnight, serialized as a real Date object (not a string) - the exact
// shape nepalinewyear's real dateRange.from has today.
function sydneyMidnightDate(dateStr, offsetHours) {
  const sign = offsetHours >= 0 ? "+" : "-";
  const offStr = `${sign}${String(Math.abs(offsetHours)).padStart(2, "0")}:00`;
  return new Date(`${dateStr}T00:00:00${offStr}`);
}

const PLACEHOLDER_IMAGE =
  "https://wha-sunya-my-uploads.s3.ap-southeast-2.amazonaws.com/profile_1793602297218.png";

const testEvents = [
  {
    title: "SEO Test Legacy Event — Sydney",
    slug: "seotestlegacysydney",
    description:
      "Internal test fixture for the legacy-date JSON-LD fix (1b). Safe to delete.",
    // Intended: 15 Dec 2026, Sydney. AEDT (DST) is +11 in December.
    dateRange: {
      from: sydneyMidnightDate("2026-12-15", 11),
      to: sydneyMidnightDate("2026-12-15", 11),
    },
    startTime: "18:00",
    endTime: "21:00",
    venue: "Sydney Opera House",
    location:
      "Sydney Opera House, Bennelong Point, Sydney, New South Wales, 2000, Australia",
    city: "sydney",
    city_name: "Sydney",
    category: "concerts",
    category_name: "Concerts",
    price_category: "registration",
    host_name: "SEO Test Fixture",
    image: PLACEHOLDER_IMAGE,
    archived: false,
  },
  {
    title: "SEO Test Legacy Event — Melbourne",
    slug: "seotestlegacymelbourne",
    description:
      "Internal test fixture for the legacy-date JSON-LD fix (1b), DST-observing state. Safe to delete.",
    // Intended: 18 Dec 2026, Melbourne (also AEDT +11 in December).
    dateRange: {
      from: sydneyMidnightDate("2026-12-18", 11),
      to: sydneyMidnightDate("2026-12-18", 11),
    },
    startTime: "19:30",
    endTime: "22:30",
    venue: "Max Watts",
    location: "Max Watts, 125 Swanston Street, Melbourne, Victoria, 3000, Australia",
    city: "melbourne",
    city_name: "Melbourne",
    category: "concerts",
    category_name: "Concerts",
    price_category: "registration",
    host_name: "SEO Test Fixture",
    image: PLACEHOLDER_IMAGE,
    archived: false,
  },
  {
    title: "SEO Test Legacy Event — Darwin",
    slug: "seotestlegacydarwin",
    description:
      "Internal test fixture for the legacy-date JSON-LD fix (1b), no-DST state. Safe to delete.",
    // Intended: 11 Dec 2026, Darwin. The legacy VALUE is still constructed
    // against Sydney's offset (+11) - that's the bug being fixed (the
    // recovery formula undoes Sydney's offset regardless of venue), while
    // Darwin's own addressRegion ("NT") never observes DST at all.
    dateRange: {
      from: sydneyMidnightDate("2026-12-11", 11),
      to: sydneyMidnightDate("2026-12-11", 11),
    },
    startTime: "17:00",
    endTime: "20:00",
    venue: "Darwin Amphitheatre",
    location: "Darwin Amphitheatre, Darwin, Northern Territory, 0800, Australia",
    city: "darwin",
    city_name: "Darwin",
    category: "concerts",
    category_name: "Concerts",
    price_category: "registration",
    host_name: "SEO Test Fixture",
    image: PLACEHOLDER_IMAGE,
    archived: false,
  },
  {
    title: "SEO Test TBA Venue Event — Brisbane",
    slug: "seotesttbabrisbane",
    description:
      "Internal test fixture for the 1(b) TBA-venue city-level PostalAddress fallback. Safe to delete.",
    dateRange: {
      from: sydneyMidnightDate("2026-12-22", 11),
      to: sydneyMidnightDate("2026-12-22", 11),
    },
    startTime: "18:30",
    endTime: "21:30",
    venue: "",
    location_tba: true,
    location: "",
    city: "brisbane",
    city_name: "Brisbane",
    category: "concerts",
    category_name: "Concerts",
    price_category: "registration",
    host_name: "SEO Test Fixture",
    image: PLACEHOLDER_IMAGE,
    archived: false,
  },
  {
    title: "SEO Test Clean-Format Event — Control",
    slug: "seotestcleancontrol",
    description:
      "Internal control fixture - already in the clean YYYY-MM-DD dateRange format (no legacy bug). Safe to delete.",
    // Already-correct, go-forward format: a plain date-only string, no
    // time, no timezone artifact. Used to confirm the date fix doesn't
    // change behavior for events that were never broken.
    dateRange: {
      from: "2026-12-20",
      to: "2026-12-20",
    },
    startTime: "20:00",
    endTime: "23:00",
    venue: "Hobart Odeon Theatre",
    location: "Hobart Odeon Theatre, Hobart, Tasmania, 7000, Australia",
    city: "hobart",
    city_name: "Hobart",
    category: "concerts",
    category_name: "Concerts",
    price_category: "registration",
    host_name: "SEO Test Fixture",
    image: PLACEHOLDER_IMAGE,
    archived: false,
  },
];

async function main() {
  const uri = process.env.MONGODB_URL;
  if (!uri) throw new Error("MONGODB_URL is not set.");
  if (!/\/wha_test(\?|$)/.test(uri)) {
    throw new Error(
      `Refusing to run: MONGODB_URL does not target /wha_test (got: ${uri.replace(/:[^:@]+@/, ":***@")})`,
    );
  }

  console.log(DRY_RUN ? "DRY RUN — no writes will be made.\n" : "APPLY MODE — inserting into wha_test.\n");
  for (const ev of testEvents) {
    console.log(`${DRY_RUN ? "Would insert" : "Inserting"}: ${ev.slug}`);
    console.log(JSON.stringify(ev, null, 2));
    console.log();
  }

  if (DRY_RUN) {
    console.log("Re-run with --apply to actually insert these documents.");
    return;
  }

  await mongoose.connect(uri);
  for (const ev of testEvents) {
    const existing = await Event.findOne({ slug: ev.slug });
    if (existing) {
      console.log(`Skipping ${ev.slug} — already exists (_id: ${existing._id}).`);
      continue;
    }
    const created = await Event.create(ev);
    console.log(`Inserted ${ev.slug} (_id: ${created._id})`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
