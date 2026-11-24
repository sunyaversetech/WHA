// Loads given event slugs in a browser with its OS timezone set to each
// of several values, checks the displayed date text and watches the
// console for React hydration-mismatch warnings.
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3001";
const slugs = process.argv.slice(3).length
  ? process.argv.slice(3)
  : ["seotestnepalinewyearmirror", "seotesttbabrisbane"];

const timezones = ["Asia/Kathmandu", "America/Los_Angeles"];

const browser = await chromium.launch();

for (const tz of timezones) {
  const context = await browser.newContext({ timezoneId: tz });
  for (const slug of slugs) {
    const page = await context.newPage();
    const hydrationWarnings = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (/hydrat/i.test(text)) hydrationWarnings.push(`[${msg.type()}] ${text}`);
    });
    page.on("pageerror", (err) => {
      if (/hydrat/i.test(err.message)) hydrationWarnings.push(`[pageerror] ${err.message}`);
    });

    await page.goto(`${base}/events/${slug}`, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(1000);

    const text = await page.evaluate(() => document.body.innerText);
    const dateLines = text
      .split("\n")
      .filter((l) => /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(l))
      .slice(0, 4);

    console.log(`\n=== ${slug} @ ${tz} ===`);
    console.log("displayed date lines:", dateLines.join(" | ") || "(none found)");
    console.log(
      hydrationWarnings.length
        ? `HYDRATION WARNINGS:\n  ${hydrationWarnings.join("\n  ")}`
        : "no hydration warnings",
    );

    await page.close();
  }
  await context.close();
}

await browser.close();
