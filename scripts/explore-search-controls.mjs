import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3001";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + "/search", { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(1000);

console.log("--- clicking Filters button ---");
await page.click('[data-ui="filters-button"]');
await page.waitForTimeout(500);
let info = await page.evaluate(() => {
  const dataUiEls = Array.from(document.querySelectorAll("[data-ui]"))
    .map((el) => el.getAttribute("data-ui"))
    .filter((v, i, a) => a.indexOf(v) === i);
  const buttons = Array.from(document.querySelectorAll("button"))
    .map((b) => b.textContent?.trim())
    .filter(Boolean);
  return { dataUiEls, buttons };
});
console.log(JSON.stringify(info, null, 2));

// close filters modal (escape) and try the search field
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

console.log("--- clicking search-field (what/where/when) ---");
const fields = await page.$$('[data-ui="search-field"]');
console.log("num search-field elements:", fields.length);
if (fields.length > 1) {
  await fields[1].click(); // "where" field, typically index 1
  await page.waitForTimeout(500);
  info = await page.evaluate(() => {
    const dataUiEls = Array.from(document.querySelectorAll("[data-ui]"))
      .map((el) => el.getAttribute("data-ui"))
      .filter((v, i, a) => a.indexOf(v) === i);
    const rows = Array.from(document.querySelectorAll('[data-ui="search-popover-item"], [data-ui]'))
      .slice(0, 30)
      .map((el) => ({ ui: el.getAttribute("data-ui"), text: el.textContent?.trim().slice(0, 40) }));
    return { dataUiEls, rows };
  });
  console.log(JSON.stringify(info, null, 2));
}

await browser.close();
