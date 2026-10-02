// Auth matrix for the business routes (mobile-auth.http step 17 a/b): no credentials
// (web path, must equal each route's old 401 body) and a junk bearer.
// Every request is rejected before any DB write. Usage: node auth-matrix.mjs [baseUrl] [bearer] [cookie]
const BASE = process.argv[2] ?? "http://192.168.1.65:3000";
const BEARER = process.argv[3]; // optional: a real access token
const COOKIE = process.argv[4]; // optional: next-auth.session-token=...
const ID = "000000000000000000000000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const E = { error: "Unauthorized" };
const M = { message: "Unauthorized" };
// [method, path, expected web 401 body, bearer message key]
const ROUTES = [
  ["GET", "/api/business-dashboard", E, "error"],
  ["GET", "/api/dashboard/search?q=a", E, "error"],
  ["GET", "/api/notifications", E, "error"],
  ["PATCH", "/api/notifications", E, "error"],
  ["PATCH", `/api/notifications/${ID}`, E, "error"],
  ["GET", "/api/clients", E, "error"],
  ["GET", `/api/clients/${ID}`, E, "error"],
  ["POST", `/api/review/reply/${ID}`, E, "error"],
  ["PATCH", "/api/business/settings", M, "message"],
  ["POST", "/api/event", E, "error"],
  ["GET", "/api/event", E, "error"],
  ["PATCH", `/api/event/edit/${ID}`, E, "error"],
  ["POST", `/api/event/archive/${ID}`, M, "message"],
  ["GET", `/api/event/single-event-for-form/${ID}`, M, "message"],
  ["GET", "/api/event/redeem/get-business", M, "message"],
  ["POST", "/api/event/verify", M, "message"],
  ["GET", `/api/event/verify/${ID}`, M, "message"],
  ["POST", "/api/event/verify/manual", M, "message"],
  ["GET", "/api/event/ticket/purchase", M, "message"],
  ["POST", `/api/event/ticket/purchase/${ID}/send-invoice`, M, "message"],
  ["POST", "/api/deals", E, "error"],
  ["GET", "/api/deals", E, "error"],
  ["PATCH", `/api/deals/edit/${ID}`, E, "error"],
  ["POST", `/api/deals/delete/${ID}`, E, "error"],
  ["POST", "/api/deals/verify", M, "message"],
  ["GET", `/api/deals/redeem/single/${ID}`, M, "message"],
  ["POST", "/api/services", E, "error"],
  ["GET", "/api/services", E, "error"],
  ["GET", `/api/services/single/${ID}`, E, "error"],
  ["POST", `/api/services/single/${ID}`, E, "error"],
  ["DELETE", `/api/services/single/${ID}`, E, "error"],
  ["POST", "/api/services/assign-employee", E, "error"],
  ["GET", "/api/categories", E, "error"],
  ["POST", "/api/categories", E, "error"],
  ["GET", `/api/categories/${ID}`, E, "error"],
  ["PATCH", `/api/categories/${ID}`, E, "error"],
  ["DELETE", `/api/categories/${ID}`, E, "error"],
  ["POST", "/api/employees", E, "error"],
  ["GET", "/api/employees", E, "error"],
  ["GET", `/api/employees/${ID}`, E, "error"],
  ["POST", `/api/employees/${ID}`, E, "error"],
  ["DELETE", `/api/employees/${ID}`, E, "error"],
  ["PATCH", `/api/employees/${ID}/schedule`, E, "error"],
  ["GET", "/api/employees/time-off", E, "error"],
  ["POST", "/api/employees/time-off", E, "error"],
  ["DELETE", `/api/employees/time-off/${ID}`, E, "error"],
  ["GET", "/api/employees/shift-overrides", E, "error"],
  ["POST", "/api/employees/shift-overrides", E, "error"],
  ["DELETE", `/api/employees/shift-overrides/${ID}`, E, "error"],
  ["PATCH", `/api/resources/${ID}/schedule`, E, "error"],
  ["GET", "/api/resources/overrides", E, "error"],
  ["POST", "/api/resources/overrides", E, "error"],
  ["DELETE", "/api/resources/overrides", E, "error"],
  ["GET", "/api/bookings", { success: false, code: "UNAUTHORIZED", message: "You must be logged in" }, "message"],
  ["PATCH", `/api/bookings/${ID}`, { success: false, error: "Unauthorized" }, "error"],
  ["PATCH", "/api/bookings/status", E, "error"],
  ["GET", "/api/bookings/today", { success: false, error: "Unauthorized" }, "error"],
  ["GET", "/api/calendar/bookings", E, "error"],
  ["POST", "/api/calendar/appointments", { success: false, error: "Unauthorized" }, "error"],
  ["GET", "/api/bookings/verify?session_id=x", E, "error"],
];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function call(method, path, headers) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: method === "GET" ? undefined : "{}",
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

let fail = 0;
const rows = [];
for (const [method, path, webBody, key] of ROUTES) {
  const web = await call(method, path, {});
  await sleep(650);
  const junk = await call(method, path, { Authorization: "Bearer junk" });
  await sleep(650);
  const expectJunk = { [key]: { message: "Unauthorized", code: "TOKEN_INVALID" } };
  const webOk = web.status === 401 && same(web.json, webBody);
  const junkOk = junk.status === 401 && same(junk.json, expectJunk);
  if (!webOk || !junkOk) fail++;
  rows.push(`${webOk && junkOk ? "PASS" : "FAIL"}  ${method.padEnd(6)} ${path.padEnd(52)} web=${web.status}${webOk ? "" : " " + web.text.slice(0, 90)}  bearer=${junk.status}${junkOk ? "" : " " + junk.text.slice(0, 90)}`);
}
for (const [method, body] of [["POST", '{"token":"x","platform":"ios"}'], ["DELETE", '{"token":"x"}']]) {
  for (const h of [{}, { Authorization: "Bearer junk" }]) {
    const r = await fetch(BASE + "/api/mobile/v1/notifications/register-token", { method, headers: { "Content-Type": "application/json", ...h }, body });
    const j = await r.json().catch(() => null);
    const ok = r.status === 401 && j?.error?.code === "TOKEN_INVALID" && j?.data === null;
    if (!ok) fail++;
    rows.push(`${ok ? "PASS" : "FAIL"}  ${method.padEnd(6)} /api/mobile/v1/notifications/register-token (${h.Authorization ? "junk bearer" : "no auth"}) ${r.status}`);
    await sleep(650);
  }
}
console.log(rows.join("\n"));
console.log(`\n${rows.length - fail}/${rows.length} passed`);
void BEARER; void COOKIE;
