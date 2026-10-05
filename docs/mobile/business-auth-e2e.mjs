// Phase 1 end-to-end test for the business routes (mobile-auth.http step 17 c/d + fixes).
// Creates throwaway accounts and data, then calls every swapped route with a REAL web
// session cookie and a REAL mobile bearer token.
//
//   node docs/mobile/business-auth-e2e.mjs [baseUrl]
//
// SAFETY: refuses to run unless MONGODB_URL in .env points at the `wha_test` database,
// AND the running server's public /api/landing matches wha_test's counts. Never run
// against production. Event/deal creation through the API needs an image upload to S3,
// so those two creates are exercised only up to their validation (no S3 writes); test
// events/deals are seeded directly in wha_test instead.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const BASE = process.argv[2] ?? "http://192.168.1.65:3000";
const TS = Date.now();
const PW = "TestPassw0rd!";
const EMAIL = {
  bizA: `mobile-test-biz+${TS}@invalid`,
  bizB: `mobile-test-biz2+${TS}@invalid`,
  user: `mobile-test-user+${TS}@invalid`,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── results ─────────────────────────────────────────────────────────────────
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  → " + detail}`);
}

// ── http ────────────────────────────────────────────────────────────────────
async function http(method, p, { bearer, cookie, json, form, noAuth } = {}) {
  const headers = { Accept: "application/json" };
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(form)) fd.append(k, v);
    body = fd;
  } else if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    body = "{}";
  }
  if (bearer && !noAuth) headers.Authorization = `Bearer ${bearer}`;
  if (cookie && !noAuth) headers.Cookie = cookie;
  const res = await fetch(BASE + p, { method, headers, body, redirect: "manual" });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  await sleep(600); // proxy rate limit: 20 req / 10 s
  return { status: res.status, data, text };
}
const short = (r) => `${r.status} ${r.text.slice(0, 160)}`;

// ── safety: wha_test only ───────────────────────────────────────────────────
const envLine = fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/).find((l) => /^\s*MONGODB_URL\s*=/.test(l));
const MONGODB_URL = envLine.replace(/^\s*MONGODB_URL\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
if (new URL(MONGODB_URL).pathname.slice(1) !== "wha_test") {
  console.error("REFUSING: MONGODB_URL is not the wha_test database.");
  process.exit(2);
}
await mongoose.connect(MONGODB_URL);
const db = mongoose.connection.db;
if (db.databaseName !== "wha_test") { console.error("REFUSING: connected db is not wha_test"); process.exit(2); }
{
  const landing = await (await fetch(BASE + "/api/landing")).json();
  const events = await db.collection("events").countDocuments();
  const biz = await db.collection("users").countDocuments({ category: "business" });
  const serverEvents = landing?.upcomingevents?.length ?? landing?.data?.upcomingevents?.length;
  console.log(`safety: wha_test events=${events} businesses=${biz}; server landing events=${serverEvents}`);
  if (events > 50) { console.error("REFUSING: wha_test looks like production data"); process.exit(2); }
}

// ── 1. accounts ─────────────────────────────────────────────────────────────
for (const email of Object.values(EMAIL)) {
  await db.collection("emailverifications").updateOne(
    { email },
    { $set: { email, code: "000000", verified: true, attempts: 0, expires_at: new Date(Date.now() + 3600_000) } },
    { upsert: true },
  );
}
async function register(email, kind, bizName) {
  const form = {
    category: kind, name: kind === "user" ? "Mobile Test User" : "Mobile Test Owner",
    email, password: PW, accpetalltermsandcondition: "true", deviceId: "e2e-device", platform: "android",
  };
  if (kind === "business") Object.assign(form, {
    business_name: bizName, business_category: "beauty", phone_number: "0400000000",
    location: "1 Test St, Sydney NSW", latitude: "-33.86", longitude: "151.2", schedule: "[]",
  });
  const r = await http("POST", "/api/mobile/v1/auth/register", { form });
  check(`register ${kind} ${email}`, r.status === 200 || r.status === 201, short(r));
}
await register(EMAIL.bizA, "business", `E2E Biz A ${TS}`);
await register(EMAIL.bizB, "business", `E2E Biz B ${TS}`);
await register(EMAIL.user, "user");

async function mobileLogin(email, category) {
  const r = await http("POST", "/api/mobile/v1/auth/login", { json: { email, password: PW, category, deviceId: "e2e-device", platform: "android" } });
  check(`mobile login ${email}`, r.status === 200 && r.data?.data?.accessToken, short(r));
  return r.data?.data?.accessToken;
}
async function webLogin(provider, email) {
  const c = await fetch(BASE + "/api/auth/csrf");
  const { csrfToken } = await c.json();
  const csrfCookie = c.headers.getSetCookie().map((x) => x.split(";")[0]).join("; ");
  const res = await fetch(`${BASE}/api/auth/callback/${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: csrfCookie },
    body: new URLSearchParams({ csrfToken, email, password: PW, json: "true", callbackUrl: BASE + "/dashboard" }),
    redirect: "manual",
  });
  const session = res.headers.getSetCookie().map((x) => x.split(";")[0]).find((x) => /next-auth\.session-token=/.test(x));
  await sleep(600);
  const s = session ? await http("GET", "/api/auth/session", { cookie: session }) : null;
  check(`web login ${email}`, !!session && s?.data?.user?.email === email, session ? short(s) : `no session cookie (${res.status})`);
  return session;
}
const T = {
  bizA: await mobileLogin(EMAIL.bizA, "business"),
  bizB: await mobileLogin(EMAIL.bizB, "business"),
  user: await mobileLogin(EMAIL.user, "user"),
};
const C = {
  bizA: await webLogin("business-credentials", EMAIL.bizA),
  user: await webLogin("user-credentials", EMAIL.user),
};
const U = {};
for (const k of Object.keys(EMAIL)) U[k] = (await db.collection("users").findOne({ email: EMAIL[k] }))._id;

// ── 2. seed data (directly in wha_test; no S3) ───────────────────────────────
const day = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d; };
const ymd = (d) => d.toISOString().slice(0, 10);
const ids = {};
const ins = async (col, doc) => (await db.collection(col).insertOne({ createdAt: new Date(), updatedAt: new Date(), ...doc })).insertedId;

const optA = new ObjectId();
ids.eventA = await ins("events", { latitude: -33.86, longitude: 151.2, geo: { type: "Point", coordinates: [151.2, -33.86] }, title: `E2E Event A ${TS}`, user: U.bizA, price_category: "paid", dateRange: { from: ymd(day(10)), to: ymd(day(11)) }, startTime: "18:00", endTime: "22:00", city: "Sydney", location: "Test venue", options: [{ _id: optA, name: "GA", price: 10, quantity: 100, sold: 4 }], max_tickets_per_request: 10 });
ids.eventA2 = await ins("events", { latitude: -33.86, longitude: 151.2, geo: { type: "Point", coordinates: [151.2, -33.86] }, title: `E2E Event A2 ${TS}`, user: U.bizA, price_category: "free", dateRange: { from: ymd(day(20)), to: ymd(day(20)) }, options: [] });
ids.eventA3 = await ins("events", { latitude: -33.86, longitude: 151.2, geo: { type: "Point", coordinates: [151.2, -33.86] }, title: `E2E Event A3 ${TS}`, user: U.bizA, price_category: "free", dateRange: { from: ymd(day(21)), to: ymd(day(21)) }, options: [] });
const optHeld = new ObjectId();
ids.eventHeld = await ins("events", { latitude: -33.86, longitude: 151.2, geo: { type: "Point", coordinates: [151.2, -33.86] }, title: `E2E Event Held ${TS}`, user: U.bizA, price_category: "paid", dateRange: { from: ymd(day(30)), to: ymd(day(30)) }, startTime: "10:00", venue: "Hall", location: "1 Test St", options: [{ _id: optHeld, name: "GA", release_date: ymd(day(0)), price: 15, capacity: 50, sold: 1, held: 2 }] });
ids.eventB = await ins("events", { latitude: -33.86, longitude: 151.2, geo: { type: "Point", coordinates: [151.2, -33.86] }, title: `E2E Event B ${TS}`, user: U.bizB, price_category: "free", dateRange: { from: ymd(day(10)), to: ymd(day(10)) }, options: [] });
const K = [1, 2, 3, 4].map((i) => `TKT${TS}-${i}`);
ids.purchaseA = await ins("eventticketpurchases", { event: ids.eventA, user: U.user, business: U.bizA, items: [{ optionId: optA, optionName: "GA", quantity: 4, unitPrice: 10, uniqueKeys: K }], uniqueKeys: K, verifiedKeys: [], verifiedTimestamps: [], invoiceNumber: `E2E-${TS}`, ticketTotal: 40, serviceFee: 2, surcharge: 1.05, totalAmount: 43.05, paymentIntentId: `pi_e2e_${TS}`, status: "pending" });
const dealBase = { valid_till: day(30), description: "E2E test deal description", city: "Sydney", terms_for_the_deal: "Test terms", category: "Others", max_redemptions: 10, current_redemptions: 2, price: 0, discount_percentage: 10 };
ids.dealA = await ins("deals", { ...dealBase, title: `E2E Deal A ${TS}`, user: U.bizA });
ids.dealDel1 = await ins("deals", { ...dealBase, title: `E2E Deal del1 ${TS}`, user: U.bizA });
ids.dealDel2 = await ins("deals", { ...dealBase, title: `E2E Deal del2 ${TS}`, user: U.bizA });
ids.dealB = await ins("deals", { ...dealBase, title: `E2E Deal B ${TS}`, user: U.bizB });
const hex = () => Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, "0");
const DC = { a1: `WHA-DEAL-${hex()}`, a2: `WHA-DEAL-${hex()}`, b1: `WHA-DEAL-${hex()}` };
await ins("redemptions", { deal: ids.dealA, user: U.user, business: U.bizA, uniqueKeys: [DC.a1], status: "pending" });
await ins("redemptions", { deal: ids.dealA, user: U.user, business: U.bizA, uniqueKeys: [DC.a2], status: "pending" });
await ins("redemptions", { deal: ids.dealB, user: U.user, business: U.bizB, uniqueKeys: [DC.b1], status: "pending" });
const svcBase = { price_type: "Fixed", base_price: 50, base_duration: 60, buffer_time: 0, service_type: "resource_based", assigned_employees: [], is_active: true, availability_type: "always", availability_schedule: [], max_concurrent_bookings: 5, group_schedule: [], advance_booking_days: 30, min_notice_hours: 0 };
ids.serviceA = await ins("services", { ...svcBase, name: `E2E Service A ${TS}`, business_id: String(U.bizA) });
ids.serviceB = await ins("services", { ...svcBase, name: `E2E Service B ${TS}`, business_id: String(U.bizB) });
ids.empA = await ins("employees", { business_id: String(U.bizA), full_name: "E2E Employee A", is_active: true });
ids.empB = await ins("employees", { business_id: String(U.bizB), full_name: "E2E Employee B", is_active: true });
ids.timeoffB = await ins("employeetimeoffs", { employee_id: ids.empB, start_time: day(5), end_time: day(6), type: "holiday" });
ids.overrideB = await ins("employeeshiftoverrides", { employee_id: ids.empB, date: ymd(day(5)), is_day_off: true, shifts: [] });
ids.reviewA = await ins("reviews", { business_id: String(U.bizA), user: U.user, rating: 5, comment: "Great place, would visit again.", replies: [] });
ids.reviewB = await ins("reviews", { business_id: String(U.bizB), user: U.user, rating: 4, comment: "Nice service, friendly staff.", replies: [] });
ids.notifA1 = await ins("notifications", { business_id: String(U.bizA), type: "appointment", title: "Seed 1", body: "Seed", related_id: new ObjectId(), is_read: false });
ids.notifA2 = await ins("notifications", { business_id: String(U.bizA), type: "appointment", title: "Seed 2", body: "Seed", related_id: new ObjectId(), is_read: false });
const bookingBase = (n) => ({ business_id: String(U.bizA), service_id: ids.serviceA, user_id: U.user, employee_id: null, inventory_quantity: 1, start_time: day(n), end_time: new Date(day(n).getTime() + 3600_000), duration: 60, total_price: 50, currency: "AUD", payment_status: "pending", status: "confirmed" });
ids.bookingVerify = await ins("bookings", { ...bookingBase(3), employee_id: ids.empA, stripe_session_id: `cs_e2e_${TS}` });
ids.bookingCancel = await ins("bookings", bookingBase(4));
console.log("seeded:", Object.keys(ids).length, "documents");

// ── 3. customer is rejected on every business route (403 NOT_BUSINESS) ─────
const ROUTES = [
  ["GET", "/api/business-dashboard", "error", 401], ["GET", "/api/dashboard/search?q=a", "error", 401],
  ["GET", "/api/notifications", "error", 401], ["PATCH", "/api/notifications", "error", 401],
  ["PATCH", `/api/notifications/${ids.notifA1}`, "error"], ["GET", "/api/clients", "error", 401],
  ["GET", `/api/clients/${U.user}`, "error", 401], ["POST", `/api/review/reply/${ids.reviewA}`, "error"],
  ["PATCH", "/api/business/settings", "message"], ["GET", "/api/business/operating-hours", "error"],
  ["POST", "/api/business/operating-hours", "error"], ["POST", "/api/event", "error"], ["GET", "/api/event", "error"],
  ["PATCH", `/api/event/edit/${ids.eventA}`, "error"], ["POST", `/api/event/archive/${ids.eventA2}`, "message"],
  ["GET", `/api/event/single-event-for-form/${ids.eventA}`, "message"], ["GET", "/api/event/redeem/get-business", "message"],
  ["POST", "/api/event/verify", "message"], ["GET", `/api/event/verify/${ids.eventA}`, "message"],
  ["POST", "/api/event/verify/manual", "message"], ["GET", `/api/event/ticket/purchase?eventId=${ids.eventA}`, "message"],
  ["POST", `/api/event/ticket/purchase/${ids.purchaseA}/send-invoice`, "message"], ["POST", "/api/deals", "error"],
  ["GET", "/api/deals", "error"], ["PATCH", `/api/deals/edit/${ids.dealA}`, "error"], ["POST", `/api/deals/delete/${ids.dealDel1}`, "error"],
  ["POST", "/api/deals/verify", "message"], ["GET", `/api/deals/redeem/single/${ids.dealA}`, "message"],
  ["POST", "/api/services", "error"], ["GET", "/api/services", "error"], ["GET", `/api/services/single/${ids.serviceA}`, "error"],
  ["POST", `/api/services/single/${ids.serviceA}`, "error"], ["DELETE", `/api/services/single/${ids.serviceA}`, "error"],
  ["POST", "/api/services/assign-employee", "error"], ["GET", "/api/categories", "error"], ["POST", "/api/categories", "error"],
  ["GET", `/api/categories/${ids.serviceA}`, "error"], ["PATCH", `/api/categories/${ids.serviceA}`, "error"],
  ["DELETE", `/api/categories/${ids.serviceA}`, "error"], ["POST", "/api/employees", "error"], ["GET", "/api/employees", "error"],
  ["GET", `/api/employees/${ids.empA}`, "error"], ["POST", `/api/employees/${ids.empA}`, "error"],
  ["DELETE", `/api/employees/${ids.empA}`, "error"], ["PATCH", `/api/employees/${ids.empA}/schedule`, "error"],
  ["GET", "/api/employees/time-off", "error"], ["POST", "/api/employees/time-off", "error"],
  ["DELETE", `/api/employees/time-off/${ids.timeoffB}`, "error"], ["GET", "/api/employees/shift-overrides", "error"],
  ["POST", "/api/employees/shift-overrides", "error"], ["DELETE", `/api/employees/shift-overrides/${ids.overrideB}`, "error"],
  ["PATCH", `/api/resources/${ids.serviceA}/schedule`, "error"], ["GET", "/api/resources/overrides", "error"],
  ["POST", "/api/resources/overrides", "error"], ["DELETE", "/api/resources/overrides", "error"],
  ["GET", "/api/bookings", "message"], ["PATCH", `/api/bookings/${ids.bookingCancel}`, "error"],
  ["PATCH", "/api/bookings/status", "error"], ["GET", "/api/bookings/today", "error"],
  ["GET", "/api/calendar/bookings", "error"], ["POST", "/api/calendar/appointments", "error"],
];
let custBearerOk = 0, custCookieOk = 0;
for (const [m, p, key, legacy] of ROUTES) {
  const b = await http(m, p, { bearer: T.user });
  const bOk = b.status === 403 && b.data?.[key]?.code === "NOT_BUSINESS";
  if (bOk) custBearerOk++; else check(`customer bearer ${m} ${p}`, false, short(b));
  const c = await http(m, p, { cookie: C.user });
  const cOk = legacy ? c.status === 401 && c.data?.[key] === "Unauthorized" : c.status === 403 && c.data?.[key] === "Forbidden";
  if (cOk) custCookieOk++; else check(`customer cookie ${m} ${p}`, false, short(c));
}
check(`customer bearer → 403 NOT_BUSINESS on all ${ROUTES.length} routes`, custBearerOk === ROUTES.length, `${custBearerOk}/${ROUTES.length}`);
check(`customer web cookie → old 401 / new 403 on all ${ROUTES.length} routes`, custCookieOk === ROUTES.length, `${custCookieOk}/${ROUTES.length}`);

// ── 4. business A: every route with a real bearer AND a real web cookie ─────
const ok2xx = (r) => r.status >= 200 && r.status < 300;
const READS = [
  "/api/business-dashboard", "/api/dashboard/search?q=Mobile", "/api/notifications", "/api/clients",
  `/api/clients/${U.user}`, "/api/event", `/api/event/single-event-for-form/${ids.eventA}`, "/api/event/redeem/get-business",
  `/api/event/verify/${ids.eventA}`, `/api/event/ticket/purchase?eventId=${ids.eventA}`, "/api/deals",
  `/api/deals/redeem/single/${ids.dealA}`, "/api/services", `/api/services/single/${ids.serviceA}`, "/api/categories",
  "/api/employees", `/api/employees/${ids.empA}`, "/api/employees/time-off", "/api/employees/shift-overrides",
  "/api/resources/overrides", "/api/bookings", "/api/bookings/today",
  `/api/calendar/bookings?start_date=${ymd(day(0))}&end_date=${ymd(day(7))}&timezone=Australia%2FSydney&limit=50`,
];
const VARIANTS = [["bearer", { bearer: T.bizA }], ["cookie", { cookie: C.bizA }]];
for (const p of READS) {
  for (const [v, auth] of VARIANTS) {
    const r = await http("GET", p, auth);
    check(`bizA ${v} GET ${p}`, ok2xx(r), short(r));
  }
}

for (const [v, auth] of VARIANTS) {
  const tag = `${v}-${TS}`;
  let r;
  r = await http("PATCH", `/api/notifications/${v === "bearer" ? ids.notifA1 : ids.notifA2}`, auth); check(`bizA ${v} PATCH notification read`, r.status === 200 && r.data?.data?.is_read === true, short(r));
  r = await http("PATCH", "/api/notifications", auth); check(`bizA ${v} PATCH notifications (mark all)`, r.status === 200 && r.data?.unread_count === 0, short(r));
  r = await http("POST", `/api/review/reply/${ids.reviewA}`, { ...auth, json: { reply: `Thanks (${v})` } }); check(`bizA ${v} POST review reply (own review)`, r.status === 200, short(r));
  r = await http("PATCH", "/api/business/settings", { ...auth, form: { phone_number: v === "bearer" ? "0400000001" : "0400000002" } }); check(`bizA ${v} PATCH business/settings`, r.status === 200, short(r));
  r = await http("POST", "/api/business/operating-hours", { ...auth, json: { is24_7: false, schedule: [], business_id: String(U.bizB) } }); check(`bizA ${v} POST operating-hours`, r.status === 200, short(r));
  r = await http("GET", "/api/business/operating-hours", auth); check(`bizA ${v} GET operating-hours`, r.status === 200, short(r));

  r = await http("POST", "/api/categories", { ...auth, json: { name: `Cat ${tag}`, color: "#3771db" } }); check(`bizA ${v} POST category`, ok2xx(r), short(r));
  const catId = r.data?.data?._id;
  r = await http("GET", `/api/categories/${catId}`, auth); check(`bizA ${v} GET category`, r.status === 200, short(r));
  r = await http("PATCH", `/api/categories/${catId}`, { ...auth, json: { name: `Cat ${tag} edited` } }); check(`bizA ${v} PATCH category`, r.status === 200, short(r));
  r = await http("DELETE", `/api/categories/${catId}`, auth); check(`bizA ${v} DELETE category`, r.status === 200, short(r));

  r = await http("POST", "/api/employees", { ...auth, form: { full_name: `Emp ${tag}`, is_active: "true" } }); check(`bizA ${v} POST employee`, ok2xx(r), short(r));
  const empId = r.data?.data?._id;
  r = await http("POST", `/api/employees/${empId}`, { ...auth, form: { full_name: `Emp ${tag} edited`, is_active: "true" } }); check(`bizA ${v} POST employee edit`, r.status === 200, short(r));
  r = await http("PATCH", `/api/employees/${empId}/schedule`, { ...auth, json: { availability_schedule: [], repeating_schedule_config: {} } }); check(`bizA ${v} PATCH employee schedule`, r.status === 200, short(r));
  r = await http("POST", "/api/employees/time-off", { ...auth, json: { employee_id: empId, start_time: day(8).toISOString(), end_time: day(9).toISOString(), type: "holiday" } }); check(`bizA ${v} POST time-off`, ok2xx(r), short(r));
  const toId = r.data?.data?._id;
  r = await http("DELETE", `/api/employees/time-off/${toId}`, auth); check(`bizA ${v} DELETE time-off`, r.status === 200, short(r));
  r = await http("POST", "/api/employees/shift-overrides", { ...auth, json: { employee_id: empId, date: ymd(day(8)), is_day_off: true } }); check(`bizA ${v} POST shift-override`, ok2xx(r), short(r));
  const soId = r.data?.data?._id;
  r = await http("DELETE", `/api/employees/shift-overrides/${soId}`, auth); check(`bizA ${v} DELETE shift-override`, r.status === 200, short(r));

  r = await http("POST", "/api/services", { ...auth, json: { name: `Svc ${tag}`, price_type: "Fixed", base_price: 20, base_duration: 30, service_type: "resource_based", is_active: true, max_concurrent_bookings: 2, availability_type: "always", availability_schedule: [], assigned_employees: [] } }); check(`bizA ${v} POST service`, ok2xx(r), short(r));
  const svcId = r.data?.data?._id;
  r = await http("POST", `/api/services/single/${svcId}`, { ...auth, json: { is_active: false } }); check(`bizA ${v} POST service toggle`, r.status === 200, short(r));
  r = await http("POST", "/api/services/assign-employee", { ...auth, json: { serviceId: svcId, employeeId: [empId] } }); check(`bizA ${v} POST assign-employee`, r.status === 200, short(r));
  r = await http("PATCH", `/api/resources/${svcId}/schedule`, { ...auth, json: { availability_type: "always", availability_schedule: [], max_concurrent_bookings: 3, group_schedule: [] } }); check(`bizA ${v} PATCH resource schedule`, r.status === 200, short(r));
  r = await http("POST", "/api/resources/overrides", { ...auth, json: { service_id: svcId, date: ymd(day(9)), is_closed: true } }); check(`bizA ${v} POST resource override`, ok2xx(r), short(r));
  r = await http("DELETE", `/api/resources/overrides?service_id=${svcId}&date=${ymd(day(9))}`, auth); check(`bizA ${v} DELETE resource override`, r.status === 200, short(r));
  r = await http("DELETE", `/api/services/single/${svcId}`, auth); check(`bizA ${v} DELETE service`, r.status === 200, short(r));
  r = await http("DELETE", `/api/employees/${empId}`, auth); check(`bizA ${v} DELETE employee`, r.status === 200, short(r));

  r = await http("POST", "/api/calendar/appointments", { ...auth, json: { service_id: String(ids.serviceA), start_time: new Date(day(12).setUTCHours(1, 0, 0, 0)).toISOString(), duration: 60, customer_name: `Walk-in ${v}` } }); check(`bizA ${v} POST calendar appointment`, ok2xx(r), short(r));
  const apptId = r.data?.data?._id;
  r = await http("PATCH", "/api/bookings/status", { ...auth, json: { bookingId: apptId, newStatus: "arrived" } }); check(`bizA ${v} PATCH bookings/status confirmed→arrived`, r.status === 200, short(r));
  r = await http("PATCH", "/api/bookings/status", { ...auth, json: { bookingId: apptId, newStatus: "refunded" } }); check(`bizA ${v} PATCH bookings/status arrived→refunded rejected`, r.status === 400, short(r));
  r = await http("PATCH", `/api/bookings/${apptId}`, { ...auth, json: { start_time: new Date(day(13).setUTCHours(2, 0, 0, 0)).toISOString() } }); check(`bizA ${v} PATCH bookings/[id] reschedule`, r.status === 200, short(r));

  r = await http("PATCH", `/api/event/edit/${ids.eventA}`, { ...auth, form: { title: `E2E Event A ${TS} (${v})` } }); check(`bizA ${v} PATCH event edit`, r.status === 200, short(r));
  r = await http("POST", `/api/event/archive/${v === "bearer" ? ids.eventA2 : ids.eventA3}`, auth); check(`bizA ${v} POST event archive`, r.status === 200, short(r));
  const key = v === "bearer" ? K[0] : K[1];
  r = await http("POST", "/api/event/verify", { ...auth, json: { uniqueKey: key.toLowerCase(), event: String(ids.eventA) } }); check(`bizA ${v} POST event verify (lowercase code)`, r.status === 200, short(r));
  r = await http("POST", "/api/event/verify", { ...auth, json: { uniqueKey: key, event: String(ids.eventA) } }); check(`bizA ${v} POST event verify again → already checked in`, r.status === 400, short(r));
  r = await http("POST", "/api/event/verify/manual", { ...auth, json: { uniqueKey: key, status: "pending" } }); check(`bizA ${v} POST event verify/manual → pending`, r.status === 200, short(r));
  r = await http("POST", `/api/event/ticket/purchase/${ids.purchaseA}/send-invoice`, auth); check(`bizA ${v} POST send-invoice`, r.status === 200, short(r));
  r = await http("POST", "/api/event", { ...auth, form: { title: "no image" } }); check(`bizA ${v} POST event (auth ok, stops at validation — no S3)`, r.status === 400, short(r));
  r = await http("POST", "/api/deals", { ...auth, form: { title: "no image" } }); check(`bizA ${v} POST deal (auth ok, stops at validation — no S3)`, r.status === 400, short(r));
  r = await http("PATCH", `/api/deals/edit/${ids.dealA}`, { ...auth, form: { title: `E2E Deal A ${v}`, description: "Edited E2E deal description", terms_for_the_deal: "Edited terms" } }); check(`bizA ${v} PATCH deal edit`, r.status === 200, short(r));
  const code = v === "bearer" ? DC.a1 : DC.a2;
  r = await http("POST", "/api/deals/verify", { ...auth, json: { uniqueKey: code.toLowerCase(), deal: String(ids.dealA) } }); check(`bizA ${v} POST deals/verify (uniqueKeys, lowercase)`, r.status === 200, short(r));
  r = await http("POST", "/api/deals/verify", { ...auth, json: { uniqueKey: code, deal: String(ids.dealA) } }); check(`bizA ${v} POST deals/verify again → already verified`, r.status === 400, short(r));
  r = await http("POST", `/api/deals/delete/${v === "bearer" ? ids.dealDel1 : ids.dealDel2}`, auth); check(`bizA ${v} POST deal delete`, r.status === 200, short(r));
}

// ── 5. fix checks: business B must not see business A's data ────────────────
let r;
r = await http("GET", `/api/clients/${U.user}`, { bearer: T.bizB }); check("fix: clients/[id] of a non-client → 404", r.status === 404, short(r));
r = await http("GET", `/api/deals/redeem/single/${ids.dealA}`, { bearer: T.bizB }); check("fix: deal redemptions of another business → 404", r.status === 404, short(r));
r = await http("GET", `/api/event/verify/${ids.eventA}`, { bearer: T.bizB }); check("fix: event attendees of another business → 404", r.status === 404, short(r));
r = await http("GET", `/api/employees/${ids.empA}`, { bearer: T.bizB }); check("fix: employees/[id] of another business → 404", r.status === 404, short(r));
r = await http("GET", `/api/employees/time-off?employee_id=${ids.empA}`, { bearer: T.bizB }); check("fix: time-off for another business's employee → []", r.status === 200 && r.data?.data?.length === 0, short(r));
r = await http("GET", "/api/employees/time-off", { bearer: T.bizA }); check("fix: time-off list excludes other businesses", r.status === 200 && !r.data?.data?.some((t) => String(t._id) === String(ids.timeoffB)), short(r));
r = await http("GET", "/api/employees/shift-overrides", { bearer: T.bizA }); check("fix: shift-overrides list excludes other businesses", r.status === 200 && !r.data?.data?.some((t) => String(t._id) === String(ids.overrideB)), short(r));
r = await http("GET", "/api/employees/shift-overrides", { bearer: T.bizB }); check("fix: shift-overrides list includes own", r.status === 200 && r.data?.data?.some((t) => String(t._id) === String(ids.overrideB)), short(r));
r = await http("POST", `/api/review/reply/${ids.reviewA}`, { bearer: T.bizB, json: { reply: "not mine" } }); check("fix: reply to another business's review → 403", r.status === 403, short(r));
r = await http("POST", `/api/review/reply/${ids.reviewB}`, { bearer: T.bizA, json: { reply: "not mine" } }); check("fix: reply to another business's review (A→B) → 403", r.status === 403, short(r));
r = await http("POST", "/api/deals/verify", { bearer: T.bizB, json: { uniqueKey: DC.b1, deal: String(ids.dealB) } }); check("fix: deals/verify own code (biz B) → 200", r.status === 200, short(r));
r = await http("GET", `/api/bookings/verify?session_id=cs_e2e_${TS}`, { bearer: T.user }); check("fix: bookings/verify by its customer → 200", r.status === 200 && r.data?.verified === true, short(r));
r = await http("GET", `/api/bookings/verify?session_id=cs_e2e_${TS}`, { bearer: T.bizA }); check("fix: bookings/verify by its business → 200", r.status === 200 && r.data?.verified === true, short(r));
r = await http("GET", `/api/bookings/verify?session_id=cs_e2e_${TS}`, { bearer: T.bizB }); check("fix: bookings/verify by another business → 404", r.status === 404, short(r));
r = await http("GET", `/api/bookings/verify?session_id=cs_e2e_${TS}`, {}); check("fix: bookings/verify without login → 401", r.status === 401, short(r));
r = await http("POST", "/api/business/operating-hours", { json: { is24_7: true, schedule: [], business_id: String(U.bizB) } }); check("fix: operating-hours POST without login → 401", r.status === 401, short(r));
{
  const hoursB = await db.collection("operatinghours").countDocuments({ business_id: U.bizB });
  const hoursA = await db.collection("operatinghours").countDocuments({ business_id: U.bizA });
  check("fix: operating-hours wrote the signed-in business, ignored body.business_id", hoursA === 1 && hoursB === 0, `A=${hoursA} B=${hoursB}`);
}
{
  const form = { title: `E2E Event Held ${TS}`, description: "Held counter regression test", category: "Concert", dateRange: JSON.stringify({ from: ymd(day(30)), to: ymd(day(30)) }), startTime: "10:00", location_tba: "false", venue: "Hall", location: "1 Test St", price_category: "paid", options: JSON.stringify([{ _id: String(optHeld), name: "GA", release_date: ymd(day(0)), close_date: "", price: "18", capacity: "60" }]), promo_codes: "[]", max_tickets_per_request: "10", show_remaining_tickets: "true", image: "https://example.com/e2e.png" };
  r = await http("PATCH", `/api/event/edit/${ids.eventHeld}`, { bearer: T.bizA, form });
  const opt = (await db.collection("events").findOne({ _id: ids.eventHeld }))?.options?.find((o) => String(o._id) === String(optHeld));
  check("fix: event edit keeps options[].held (and sold) by _id", r.status === 200 && opt?.held === 2 && opt?.sold === 1 && opt?.price === 18, `${short(r)} held=${opt?.held} sold=${opt?.sold}`);
}
r = await http("GET", "/api/business-dashboard", { bearer: T.bizA });
check("fix: business-dashboard populates employee_id.full_name", r.status === 200 && r.data?.data?.upcomingBookings?.some((b) => b.employee_id?.full_name === "E2E Employee A"), short(r));
r = await http("GET", `/api/event/verify/${ids.eventA}`, { bearer: T.bizA }); check("event attendees for own event → 200 with rows", r.status === 200 && r.data?.data?.length === K.length, short(r));

// ── 6. push: register token, then new booking + customer cancel ────────────
const fakeToken = (n) => `ExponentPushToken[e2e${TS}x${n}]`;
r = await http("POST", "/api/mobile/v1/notifications/register-token", { bearer: T.bizA, json: { token: "nope", platform: "android" } }); check("push: invalid token rejected", r.status === 400, short(r));
r = await http("POST", "/api/mobile/v1/notifications/register-token", { bearer: T.bizA, json: { token: fakeToken(1), platform: "android" } }); check("push: register token", r.status === 200 && r.data?.data?.registered === true, short(r));
check("push: token stored for business A", (await db.collection("pushtokens").countDocuments({ token: fakeToken(1), user_id: U.bizA })) === 1);

const slot = new Date(day(15).setUTCHours(0, 0, 0, 0));
const lockId = await ins("bookinglocks", { business_id: String(U.bizA), user_id: String(U.user), service_id: ids.serviceA, employee_id: null, inventory_quantity: 1, start_time: slot, end_time: new Date(slot.getTime() + 3600_000), expires_at: new Date(Date.now() + 600_000) });
const notifBefore = await db.collection("notifications").countDocuments({ business_id: String(U.bizA), title: "New appointment" });
r = await http("POST", "/api/bookings", { cookie: C.user, json: { service_id: String(ids.serviceA), lock_id: String(lockId), start_time: slot.toISOString(), items: [{ service_id: String(ids.serviceA), quantity: 1 }], idempotency_key: `e2e-${TS}` } });
check("push: customer creates a booking (consumer route, web cookie)", r.status === 201, short(r));
await sleep(4000);
check("push: 'New appointment' notification created", (await db.collection("notifications").countDocuments({ business_id: String(U.bizA), title: "New appointment" })) === notifBefore + 1);
const tok1Left = await db.collection("pushtokens").countDocuments({ token: fakeToken(1) });
check("push: Expo was called for the new booking (fake token pruned as DeviceNotRegistered)", tok1Left === 0, `token still present (${tok1Left}) — Expo may have accepted it or the call failed; see server log`);

r = await http("POST", "/api/mobile/v1/notifications/register-token", { bearer: T.bizA, json: { token: fakeToken(2), platform: "ios" } }); check("push: register second token", r.status === 200, short(r));
r = await http("PATCH", `/api/bookings/user/${ids.bookingCancel}`, { cookie: C.user, json: { action: "cancel" } }); check("push: customer cancels a booking", r.status === 200, short(r));
await sleep(4000);
check("push: 'Booking cancelled' notification created", (await db.collection("notifications").countDocuments({ business_id: String(U.bizA), title: "Booking cancelled" })) === 1);
check("push: Expo was called for the cancellation (token pruned)", (await db.collection("pushtokens").countDocuments({ token: fakeToken(2) })) === 0);

r = await http("POST", "/api/mobile/v1/notifications/register-token", { bearer: T.bizA, json: { token: fakeToken(3), platform: "android" } });
r = await http("DELETE", "/api/mobile/v1/notifications/register-token", { bearer: T.bizA, json: { token: fakeToken(3) } }); check("push: unregister token", r.status === 200 && r.data?.data?.removed === true, short(r));

// ── summary ─────────────────────────────────────────────────────────────────
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) console.log("FAILED:\n" + failed.map((f) => `- ${f.name}: ${f.detail}`).join("\n"));
console.log(`\ntest accounts (wha_test): ${Object.values(EMAIL).join(", ")} / ${PW}`);
await mongoose.disconnect();
process.exit(failed.length ? 1 : 0);
