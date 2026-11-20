// One-off, read-only script: fetches the live production site's Event
// JSON-LD (after client-side hydration, since production doesn't have
// the SSR fix yet) for the audit's named legacy-format events. No DB
// access - this is exactly what https://whaustralia.com serves today.
import { chromium } from "playwright";

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "nepalinewyear",
      "trnfest2026secondshow",
      "albatrossinmelbourne",
      "albatrossliveindarwin",
      "albatrossinsunshinecoast",
      "albatrossinsydney",
    ];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const slug of slugs) {
  const url = `https://whaustralia.com/events/${slug}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(800);
    const jsonLd = await page.evaluate(() => {
      const scripts = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      );
      return scripts.map((s) => s.textContent).filter(Boolean);
    });
    const eventBlock = jsonLd.find((j) => j.includes('"@type":"Event"'));
    console.log(`=== ${slug} ===`);
    console.log(eventBlock || "(no Event JSON-LD found)");
    console.log();
  } catch (err) {
    console.log(`=== ${slug} === ERROR: ${err.message}`);
  }
}

await browser.close();
