// One-off baseline/comparison screenshot capture for the SEO-fixes branch.
// Not part of the app; run manually with `node scripts/seo-baseline-screenshots.mjs <outDir>`.
// Captures the 8 pages the brief lists, at 390px and 1440px, logged out.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const outDir = process.argv[2] || ".seo-baseline";

const pages = [
  { name: "home", path: "/" },
  { name: "events", path: "/events" },
  { name: "event-detail", path: "/events/albatrossinsydney" },
  { name: "business-detail", path: "/businesses/cbrnursing" },
  { name: "deals", path: "/deals" },
  { name: "privacy-policy", path: "/privacy-policy" },
  { name: "auth", path: "/auth" },
  { name: "dashboard", path: "/dashboard" },
];

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  // Fresh, cookie-less context per page so "logged out" is guaranteed.
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    for (const p of pages) {
      const url = BASE_URL + p.path;
      const file = path.join(outDir, `${p.name}-${vp.name}.png`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(500); // let any client fetch settle
        await page.screenshot({ path: file, fullPage: true });
        console.log(`OK   ${vp.name}px ${p.path} -> ${file}`);
      } catch (err) {
        console.log(`FAIL ${vp.name}px ${p.path} -> ${err.message}`);
      }
    }
    await context.close();
  }
  await browser.close();
}

main();
