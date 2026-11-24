// One-off, read-only script: grabs the visible date/time text shown in
// the event page's own UI (not the JSON-LD) for cross-checking, with the
// browser's timezone explicitly set to Australia/Sydney.
import { chromium } from "playwright";

const slugs = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ timezoneId: "Australia/Sydney" });
const page = await context.newPage();

for (const slug of slugs) {
  const url = `https://whaustralia.com/events/${slug}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body.innerText);
    const dateLine = text
      .split("\n")
      .filter((l) => /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(l))
      .slice(0, 5);
    console.log(`=== ${slug} (browser tz: Australia/Sydney) ===`);
    console.log(dateLine.join(" | "));
    console.log();
  } catch (err) {
    console.log(`=== ${slug} === ERROR: ${err.message}`);
  }
}

await browser.close();
