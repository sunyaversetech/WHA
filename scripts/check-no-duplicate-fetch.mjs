import { chromium } from "playwright";

const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/events", "/deals"];
const base = "http://localhost:3001";

const browser = await chromium.launch();
for (const path of paths) {
  const page = await browser.newPage();
  const apiCalls = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/business") || url.includes("/api/event/getallevent") || url.includes("/api/deals/get-all")) {
      apiCalls.push(url);
    }
  });
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500); // give hydration + any effect-driven fetch a chance to fire
  console.log(`=== ${path} ===`);
  console.log(apiCalls.length === 0 ? "No client-side API calls fired." : apiCalls.join("\n"));
  console.log();
  await page.close();
}
await browser.close();
