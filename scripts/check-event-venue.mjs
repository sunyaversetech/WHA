import { chromium } from "playwright";

const slugs = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();

for (const slug of slugs) {
  const url = `https://whaustralia.com/events/${slug}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body.innerText);
    console.log(`=== ${slug} ===`);
    console.log(text.split("\n").filter(Boolean).slice(0, 15).join(" | "));
    console.log();
  } catch (err) {
    console.log(`=== ${slug} === ERROR: ${err.message}`);
  }
}

await browser.close();
