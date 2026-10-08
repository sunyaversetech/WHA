// Canonical production origin (no trailing slash). Deliberately hardcoded
// rather than read from NEXT_PUBLIC_APP_URL: that env var is also used for
// email links and is set to http://localhost:3000 in local dev, and
// canonical/OG/sitemap URLs must always claim the one real production
// identity regardless of which environment generated the page — otherwise
// staging or a misconfigured env var would silently emit wrong canonical
// tags.
export const SITE_URL = "https://whaustralia.com";

export const SITE_NAME = "What's Happening Australia";

export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og-image.png`,
  width: 1200,
  height: 630,
  alt: SITE_NAME,
};

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
