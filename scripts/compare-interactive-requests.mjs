// Compares request volume + timing for key search-page interactions,
// against a given base URL (baseline or current build, on different
// ports). Records every request whose URL contains "_rsc=" (Next's RSC
// re-render on client navigation) or hits one of the three listing APIs.
import { chromium } from "playwright";

const base = process.argv[2];
if (!base) {
  console.error("Usage: node compare-interactive-requests.mjs <baseUrl>");
  process.exit(1);
}

function isTrackedRequest(url) {
  return (
    url.includes("_rsc=") ||
    url.includes("/api/business") ||
    url.includes("/api/event/getallevent") ||
    url.includes("/api/deals/get-all")
  );
}

function makeTracker(page) {
  const events = [];
  page.on("request", (req) => {
    const url = req.url();
    if (isTrackedRequest(url)) {
      events.push({ t: Date.now(), phase: "start", url });
    }
  });
  page.on("requestfinished", async (req) => {
    const url = req.url();
    if (isTrackedRequest(url)) {
      events.push({ t: Date.now(), phase: "finish", url });
    }
  });
  return events;
}

async function timeAction(label, events, fn) {
  const before = events.length;
  const t0 = Date.now();
  await fn();
  // settle window: wait for network to go quiet after the action
  await new Promise((r) => setTimeout(r, 1200));
  const t1 = Date.now();
  const relevant = events.slice(before);
  const starts = relevant.filter((e) => e.phase === "start");
  console.log(`\n--- ${label} ---`);
  console.log(`requests fired: ${starts.length}`);
  for (const s of starts) {
    const finish = relevant.find((e) => e.phase === "finish" && e.url === s.url && e.t >= s.t);
    const dur = finish ? finish.t - s.t : null;
    console.log(`  ${s.url.replace(/^https?:\/\/[^/]+/, "")}  (+${s.t - t0}ms${dur !== null ? `, took ${dur}ms` : ""})`);
  }
  console.log(`total wall time for action+settle: ${t1 - t0}ms`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const events = makeTracker(page);

console.log(`\n========== ${base} ==========`);

await timeAction("initial load /search", events, async () => {
  await page.goto(base + "/search", { waitUntil: "networkidle", timeout: 20000 });
});

// --- Category change via Filters modal ---
await timeAction("open Filters modal", events, async () => {
  await page.click('[data-ui="filters-button"]');
  await page.waitForTimeout(300);
});

await timeAction("click a category chip (category change)", events, async () => {
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const text = (await b.textContent())?.trim();
    if (text === "Concert") {
      await b.click();
      break;
    }
  }
});

const closeBtn = await page.$('[data-ui="filters-modal-close"]');
if (closeBtn) await closeBtn.click();
await page.waitForTimeout(300);

// --- City + search submit via header search bar ---
await timeAction("pick a city then submit search (city change)", events, async () => {
  try {
    const fields = await page.$$('[data-ui="search-field"]');
    if (fields.length > 1) {
      await fields[1].click(); // "where"
      await page.waitForTimeout(400);
      const rows = await page.$$("[data-ui]");
      let clicked = false;
      for (const el of rows) {
        const text = (await el.textContent())?.trim();
        if (text === "Melbourne") {
          await el.click({ timeout: 3000 });
          clicked = true;
          break;
        }
      }
      await page.waitForTimeout(300);
      if (clicked) {
        const submit = await page.$('[data-ui="search-submit"]');
        if (submit) await submit.click({ timeout: 3000 });
      } else {
        console.log("  (could not find Melbourne option, skipping submit)");
      }
    }
  } catch (err) {
    console.log("  (city step failed: " + err.message.split("\n")[0] + ")");
  }
});

// --- Map pan ---
await timeAction("pan the map (drag)", events, async () => {
  try {
    const mapBox = await page.$(".leaflet-container");
    if (mapBox) {
      const box = await mapBox.boundingBox();
      if (box) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx - 150, cy - 100, { steps: 10 });
        await page.mouse.up();
      }
    }
    await page.waitForTimeout(800);
  } catch (err) {
    console.log("  (map pan failed: " + err.message.split("\n")[0] + ")");
  }
});

// --- Back/forward ---
await timeAction("browser back", events, async () => {
  try {
    await page.goBack({ waitUntil: "networkidle", timeout: 20000 });
  } catch (err) {
    console.log("  (back failed: " + err.message.split("\n")[0] + ")");
  }
});
await timeAction("browser forward", events, async () => {
  try {
    await page.goForward({ waitUntil: "networkidle", timeout: 20000 });
  } catch (err) {
    console.log("  (forward failed: " + err.message.split("\n")[0] + ")");
  }
});

await browser.close();
