// Derives an Australian state/territory abbreviation for Event JSON-LD's
// PostalAddress.addressRegion. Per instruction: check the stored address
// text first, fall back to lat/lng only if that fails, and if still
// unsure, return null rather than guess - callers should omit
// addressRegion entirely in that case, not emit a wrong one.

const AU_STATE_NAMES: [RegExp, string][] = [
  [/\bnew south wales\b/i, "NSW"],
  [/\bvictoria\b/i, "VIC"],
  [/\bqueensland\b/i, "QLD"],
  [/\bwestern australia\b/i, "WA"],
  [/\bsouth australia\b/i, "SA"],
  [/\btasmania\b/i, "TAS"],
  [/\baustralian capital territory\b/i, "ACT"],
  [/\bnorthern territory\b/i, "NT"],
  // Abbreviations only matched with surrounding context (a 4-digit AU
  // postcode nearby) so "SA" doesn't false-match inside an unrelated word
  // or acronym - state names above are checked first and are unambiguous
  // on their own.
  [/\bnsw\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bnsw\b/i, "NSW"],
  [/\bvic\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bvic\b/i, "VIC"],
  [/\bqld\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bqld\b/i, "QLD"],
  [/\bwa\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bwa\b/i, "WA"],
  [/\bsa\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bsa\b/i, "SA"],
  [/\btas\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\btas\b/i, "TAS"],
  [/\bact\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bact\b/i, "ACT"],
  [/\bnt\b.{0,10}\d{4}\b|\b\d{4}\b.{0,10}\bnt\b/i, "NT"],
];

// Australia's state/territory capitals and a handful of other well-known
// cities this site actually lists events/businesses in (kept in sync
// with AU_CITY_NAMES in server/lib/getBusinessListData.ts) - used so a
// bare city name (no full address available, e.g. a TBA-venue event)
// still resolves a region instead of needing to omit it.
const AU_CITY_STATE: Record<string, string> = {
  sydney: "NSW",
  newcastle: "NSW",
  wollongong: "NSW",
  melbourne: "VIC",
  geelong: "VIC",
  brisbane: "QLD",
  "gold coast": "QLD",
  goldcoast: "QLD",
  townsville: "QLD",
  cairns: "QLD",
  perth: "WA",
  adelaide: "SA",
  hobart: "TAS",
  darwin: "NT",
  canberra: "ACT",
};

export function extractAuStateFromText(text?: string | null): string | null {
  if (!text) return null;
  for (const [re, abbr] of AU_STATE_NAMES) {
    if (re.test(text)) return abbr;
  }
  return null;
}

export function extractAuStateFromCity(city?: string | null): string | null {
  if (!city) return null;
  return AU_CITY_STATE[city.trim().toLowerCase()] ?? null;
}

// Rough, deliberately non-overlapping bounding boxes - a coordinate that
// doesn't land cleanly in exactly one is left unresolved (null) rather
// than guessed. Last resort, only used once address text and city name
// both fail to resolve anything.
const AU_STATE_BOUNDS: { region: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
  { region: "WA", minLat: -35.5, maxLat: -13.5, minLng: 112.0, maxLng: 129.0 },
  { region: "NT", minLat: -26.0, maxLat: -10.5, minLng: 129.0, maxLng: 138.0 },
  { region: "SA", minLat: -38.1, maxLat: -26.0, minLng: 129.0, maxLng: 141.0 },
  { region: "QLD", minLat: -29.2, maxLat: -9.0, minLng: 138.0, maxLng: 153.6 },
  { region: "NSW", minLat: -37.6, maxLat: -28.0, minLng: 141.0, maxLng: 153.7 },
  { region: "ACT", minLat: -35.95, maxLat: -35.1, minLng: 148.7, maxLng: 149.4 },
  { region: "VIC", minLat: -39.2, maxLat: -33.98, minLng: 140.9, maxLng: 150.0 },
  { region: "TAS", minLat: -43.7, maxLat: -39.5, minLng: 143.8, maxLng: 148.5 },
];

export function extractAuStateFromCoords(
  lat?: number | null,
  lng?: number | null,
): string | null {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return null;
  const matches = AU_STATE_BOUNDS.filter(
    (b) => lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng,
  );
  // ACT is wholly inside NSW's box - check it first/separately so a point
  // actually in Canberra doesn't resolve to the ambiguous "ACT or NSW".
  if (matches.length === 1) return matches[0].region;
  const act = matches.find((m) => m.region === "ACT");
  if (act && matches.length === 2 && matches.some((m) => m.region === "NSW")) return "ACT";
  return null; // 0 or >1 non-ACT matches - genuinely ambiguous, don't guess
}

// The derivation order asked for: address text first, (lat, lng) only as
// a fallback, else give up (null) rather than guess. Deliberately just
// these two layers - a known-city lookup is a separate, TBA-specific
// fallback (extractAuStateFromCity above), used explicitly only when
// there's no address text to check at all (a TBA venue), not folded in
// here.
export function deriveAddressRegion(opts: {
  addressText?: string | null;
  lat?: number | null;
  lng?: number | null;
}): string | null {
  return (
    extractAuStateFromText(opts.addressText) ??
    extractAuStateFromCoords(opts.lat, opts.lng)
  );
}
