// One-off backfill: sets `slug` on every existing Deal and business User
// document that doesn't have one yet, using the same generateSlug formula
// as server/lib/slug.ts (duplicated here deliberately — this is a plain
// Node script with no TypeScript/path-alias resolution, so it can run with
// nothing beyond the `mongodb` driver already installed as a dependency of
// mongoose).
//
// Usage: MONGODB_URL="<connection string>" node scripts/backfill-slugs.js
// Defaults to reading MONGODB_URL from .env if not passed explicitly.
//
// Safe to re-run: only touches documents where slug is missing/empty, never
// overwrites an existing slug.

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

function loadMongoUrl() {
  if (process.env.MONGODB_URL) return process.env.MONGODB_URL;
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith("MONGODB_URL"));
    if (line) return line.split("=").slice(1).join("=").trim();
  }
  throw new Error("MONGODB_URL not set and not found in .env");
}

async function run() {
  const url = loadMongoUrl();
  const dbNameMatch = url.match(/\/([a-zA-Z0-9_-]+)(\?|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : "(unknown)";
  console.log(`Connecting to database: ${dbName}`);
  if (dbName !== "wha_test" && !process.env.I_UNDERSTAND_THIS_IS_PRODUCTION) {
    throw new Error(
      `Refusing to run against "${dbName}" — this looks like it might not be wha_test. ` +
        `Set I_UNDERSTAND_THIS_IS_PRODUCTION=1 to proceed anyway once you've verified the ` +
        `connection string is intentional.`,
    );
  }

  const client = new MongoClient(url);
  await client.connect();
  const db = client.db();

  try {
    const deals = db.collection("deals");
    const dealsToFix = await deals
      .find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] })
      .toArray();
    console.log(`Deals missing a slug: ${dealsToFix.length}`);
    for (const deal of dealsToFix) {
      await deals.updateOne(
        { _id: deal._id },
        { $set: { slug: generateSlug(deal.title) } },
      );
    }
    console.log(`Deals updated: ${dealsToFix.length}`);

    const users = db.collection("users");
    const businessesToFix = await users
      .find({
        category: "business",
        business_name: { $exists: true, $ne: null },
        $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
      })
      .toArray();
    console.log(`Businesses missing a slug: ${businessesToFix.length}`);
    for (const biz of businessesToFix) {
      await users.updateOne(
        { _id: biz._id },
        { $set: { slug: generateSlug(biz.business_name) } },
      );
    }
    console.log(`Businesses updated: ${businessesToFix.length}`);
  } finally {
    await client.close();
  }
}

run()
  .then(() => {
    console.log("Backfill complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
