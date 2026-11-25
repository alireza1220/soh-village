// End-to-end test for the market listing API: real Next.js app against scripts/mock-supabase.mjs.
// Run: node scripts/test-market.mjs   (needs a finished "npm run build" for the not_configured phase; skipped otherwise)
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { readdirSync } from "node:fs";
import { existsSync, rmSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MOCK_PORT = 54399;
const DEV_PORT = 3222;
const PROD_PORT = 3223;
const MOCK = `http://localhost:${MOCK_PORT}`;
const APP = `http://localhost:${DEV_PORT}`;
const SVC = "svc-key";
const ANON = "anon-key";
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: MOCK,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
  SUPABASE_SERVICE_ROLE_KEY: SVC,
  IP_HASH_SALT: "t",
  MANAGE_CODE_SALT: "t",
  CRON_SECRET: "cron-t",
};
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

// ---------- harness ----------
let passed = 0;
const failures = [];
const check = (name, cond, detail = "") => {
  if (cond) passed++;
  else {
    failures.push({ name, detail: String(detail).slice(0, 600) });
    console.log(`  FAIL ${name} ${detail ? "-- " + String(detail).slice(0, 300) : ""}`);
  }
};
const section = (s) => console.log(`\n# ${s}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const procs = [];
const createdEnvLocal = [];
function start(cmd, args, env, tag, cwd = ROOT) {
  const p = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
  let log = "";
  p.stdout.on("data", (d) => (log += d));
  p.stderr.on("data", (d) => (log += d));
  p.tag = tag;
  p.getLog = () => log;
  procs.push(p);
  return p;
}
// "next dev" allows one instance per project dir, and Al may have his own running. So the dev phase runs in a
// throwaway copy of the project (node_modules is an APFS clone, so this takes a couple of seconds).
let CLONE = null;
function makeClone() {
  CLONE = join(tmpdir(), `soh-test-${process.pid}`);
  rmSync(CLONE, { recursive: true, force: true });
  execFileSync("mkdir", ["-p", CLONE]);
  for (const name of readdirSync(ROOT)) {
    if ([".next", "tsconfig.tsbuildinfo", ".git", ".env.local"].includes(name)) continue;
    const flags = name === "node_modules" ? ["-Rc"] : ["-R"];
    execFileSync("cp", [...flags, join(ROOT, name), join(CLONE, name)]);
  }
  return CLONE;
}
function killAll() {
  if (CLONE) { try { rmSync(CLONE, { recursive: true, force: true }); } catch {} CLONE = null; }
  for (const p of procs) {
    try {
      process.kill(-p.pid, "SIGTERM");
    } catch {}
  }
  for (const f of createdEnvLocal) {
    try {
      rmSync(f, { force: true });
    } catch {}
  }
}
process.on("SIGINT", () => { killAll(); process.exit(130); });
process.on("SIGTERM", () => { killAll(); process.exit(143); });

async function waitFor(url, ms, proc) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (proc && proc.exitCode !== null) throw new Error(`${proc.tag} exited early:\n${proc.getLog().slice(-1500)}`);
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${url}${proc ? "\n" + proc.getLog().slice(-1500) : ""}`);
}

// ---------- helpers ----------
let ipSeq = 0;
const freshIp = () => `10.1.${Math.floor(++ipSeq / 250)}.${(ipSeq % 250) + 1}`;
async function api(base, path, body, { ip, token, raw } = {}) {
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip ?? freshIp() };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method: "POST", headers, body: raw ?? JSON.stringify(body) });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = { _text: text.slice(0, 200) }; }
  return { status: res.status, data };
}
const post = (path, body, o) => api(APP, path, body, o);
const dump = async () => (await fetch(`${MOCK}/__admin/dump`)).json();
const admin = async (p) => (await fetch(`${MOCK}/__admin/${p}`)).json();
const rowOf = async (id) => (await dump()).listings.find((r) => r.id === id);
const base = (over = {}) => ({
  type: "sell", category: "fruit", title: "Cherries", area: "Soh", quantity: "10 kg", price: "100",
  contactKind: "phone", contactValue: "09120000000", contactPublic: false, openedMs: 5000, website: "", ...over,
});
async function create(over = {}, o = {}) {
  const r = await post("/api/listings", base(over), o);
  return r;
}
const FORBIDDEN = ["ip_hash", "manage_hash", "owner_id", "manageHash", "ipHash", "ownerId"];
const leaks = (obj) => FORBIDDEN.filter((k) => JSON.stringify(obj).includes(`"${k}"`));
const emailTok = (e) => `tok-${e}`;

// ---------- scenarios ----------
async function scenarioCreate() {
  section("create + honeypot + validation");
  const ip = freshIp();
  const r = await create({}, { ip });
  check("create: 200 ok", r.status === 200 && r.data.ok === true, JSON.stringify(r));
  check("create: id returned", typeof r.data.id === "string" && r.data.id.length > 10, JSON.stringify(r.data));
  const code = r.data.manageCode;
  check("create: manageCode format XXXX-XXXX-XXXX", CODE_RE.test(code ?? ""), code);
  const d = await dump();
  const row = d.listings.find((x) => x.id === r.data.id);
  check("create: row stored pending", row?.status === "pending", JSON.stringify(row));
  check("create: manage_hash is 64 hex", /^[0-9a-f]{64}$/.test(row?.manage_hash ?? ""), row?.manage_hash);
  const plain = (code ?? "x").replace(/-/g, "");
  const s = JSON.stringify(d);
  check("create: plain code absent from DB dump", !s.includes(code) && !s.includes(plain), "code found in DB dump");
  check("create: owner_id null for anonymous", row?.owner_id === null);
  check("create: ip_hash stored (spam control)", typeof row?.ip_hash === "string" && row.ip_hash.length > 0);
  check("create: renewals 0", row?.renewals === 0);
  const r2 = await create({}, { ip });
  check("create: second code differs", r2.data.manageCode && r2.data.manageCode !== code, JSON.stringify(r2.data));

  const tooFast = await create({ openedMs: 100 });
  check("create: too_fast 400", tooFast.status === 400 && tooFast.data.error === "too_fast", JSON.stringify(tooFast));
  const noContact = await create({ contactValue: "" });
  check("create: contact_required 400", noContact.status === 400 && noContact.data.error === "contact_required", JSON.stringify(noContact));
  const badType = await create({ type: "nope" });
  check("create: bad_type 400", badType.status === 400 && badType.data.error === "bad_type", JSON.stringify(badType));
  const badCat = await create({ category: "nope" });
  check("create: bad_category 400", badCat.status === 400 && badCat.data.error === "bad_category", JSON.stringify(badCat));
  const noTitle = await create({ title: "  " });
  check("create: title_required 400", noTitle.status === 400 && noTitle.data.error === "title_required", JSON.stringify(noTitle));
  const badKind = await create({ contactKind: "pigeon" });
  check("create: bad_contact 400", badKind.status === 400 && badKind.data.error === "bad_contact", JSON.stringify(badKind));
  const badJson = await post("/api/listings", null, { raw: "{not json" });
  check("create: bad_json 400", badJson.status === 400 && badJson.data.error === "bad_json", JSON.stringify(badJson));
  const long = await create({ title: "x".repeat(300), details: "d".repeat(2000) });
  const lrow = await rowOf(long.data.id);
  check("create: title clipped to 120, details to 800", lrow?.title.length === 120 && lrow?.details.length === 800, `${lrow?.title?.length}/${lrow?.details?.length}`);

  const before = (await dump()).listings.length;
  const bot = await create({ website: "http://spam.example" });
  check("honeypot: {ok:true} without code/id", bot.status === 200 && bot.data.ok === true && !("manageCode" in bot.data) && !("id" in bot.data), JSON.stringify(bot));
  check("honeypot: nothing stored", (await dump()).listings.length === before);

  const ip5 = freshIp();
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await create({ title: "R" + i }, { ip: ip5 })).status);
  const sixth = await create({ title: "R6" }, { ip: ip5 });
  check("create: first 5 per hour succeed", codes.every((c) => c === 200), codes.join());
  check("create: 6th per hour 429 rate_limited", sixth.status === 429 && sixth.data.error === "rate_limited", JSON.stringify(sixth));
  const other = await create({ title: "other ip" });
  check("create: other IP unaffected", other.status === 200);
}

async function scenarioManage() {
  section("manage: wrong codes, get, update");
  const mip = freshIp();
  const c = await create({ title: "Walnuts", category: "nuts" });
  const code = c.data.manageCode;

  const wrong = await post("/api/listings/manage", { code: "AAAA-AAAA-AAAA", action: "get" }, { ip: mip });
  const malformedShort = await post("/api/listings/manage", { code: "ABC", action: "get" }, { ip: mip });
  const malformedChars = await post("/api/listings/manage", { code: "0000-1111-OOOO", action: "get" }, { ip: mip });
  const noCode = await post("/api/listings/manage", { action: "get" }, { ip: mip });
  const numCode = await post("/api/listings/manage", { code: 12345, action: "get" }, { ip: mip });
  check("manage: wrong code 404 not_found", wrong.status === 404 && wrong.data.error === "not_found", JSON.stringify(wrong));
  check("manage: malformed (short) 404 not_found", malformedShort.status === 404 && malformedShort.data.error === "not_found", JSON.stringify(malformedShort));
  check("manage: malformed (illegal chars) 404 not_found", malformedChars.status === 404 && malformedChars.data.error === "not_found", JSON.stringify(malformedChars));
  check("manage: missing / non-string code 404", noCode.status === 404 && numCode.status === 404, `${noCode.status}/${numCode.status}`);
  check("manage: wrong and malformed give identical bodies", JSON.stringify(wrong.data) === JSON.stringify(malformedShort.data) && JSON.stringify(wrong.data) === JSON.stringify(malformedChars.data));
  const badAct = await post("/api/listings/manage", { code, action: "explode" });
  check("manage: unknown action 400", badAct.status === 400, JSON.stringify(badAct));

  const lower = code.toLowerCase().replace(/-/g, "");
  const g = await post("/api/listings/manage", { code: lower, action: "get" });
  check("manage get: accepts lowercase code without dashes", g.status === 200 && g.data.ok && g.data.listing?.title === "Walnuts", JSON.stringify(g));
  const spaced = await post("/api/listings/manage", { code: " " + code.replace(/-/g, " ") + " ", action: "get" });
  check("manage get: accepts spaces", spaced.status === 200, JSON.stringify(spaced));
  check("manage get: camelCase listing, no secrets", g.data.listing?.contactValue === "09120000000" && g.data.listing?.status === "pending" && leaks(g.data).length === 0, JSON.stringify(g.data));
  check("manage get: expected public keys", ["id","type","category","title","quantity","price","area","available","details","posterName","contactKind","contactValue","contactPublic","status","createdAt","expiresAt","renewals"].every((k) => k in (g.data.listing ?? {})), Object.keys(g.data.listing ?? {}).join());

  const id = c.data.id;
  const u1 = await post("/api/listings/manage", { code, action: "update", fields: { title: "Walnuts v2", price: "55" } });
  check("manage update (pending): ok and stays pending", u1.status === 200 && u1.data.listing?.title === "Walnuts v2" && u1.data.listing?.status === "pending" && u1.data.listing?.price === "55", JSON.stringify(u1));
  check("manage update: untouched fields kept", u1.data.listing?.quantity === "10 kg" && u1.data.listing?.contactValue === "09120000000", JSON.stringify(u1.data));
  check("manage update: no secrets in response", leaks(u1.data).length === 0);

  await admin(`approve?id=${id}`);
  check("approve (admin) works", (await rowOf(id)).status === "approved");
  const u2 = await post("/api/listings/manage", { code, action: "update", fields: { title: "Walnuts v3" } });
  check("manage update (approved): goes back to pending", u2.status === 200 && u2.data.listing?.status === "pending" && u2.data.listing?.title === "Walnuts v3", JSON.stringify(u2));
  check("manage update: DB status pending", (await rowOf(id)).status === "pending");
  const pub = await (await fetch(`${MOCK}/rest/v1/public_listings?select=id`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
  check("manage update: edited listing hidden from public view", !pub.some((r) => r.id === id), JSON.stringify(pub));

  const ub = await post("/api/listings/manage", { code, action: "update", fields: { category: "zzz" } });
  check("manage update: invalid field 400", ub.status === 400 && ub.data.error === "bad_category", JSON.stringify(ub));
  const ub2 = await post("/api/listings/manage", { code, action: "update", fields: { title: "" } });
  check("manage update: empty title 400", ub2.status === 400 && ub2.data.error === "title_required", JSON.stringify(ub2));
  const ub3 = await post("/api/listings/manage", { code, action: "update" });
  check("manage update: missing fields 400", ub3.status === 400, JSON.stringify(ub3));
  const sneaky = await post("/api/listings/manage", { code, action: "update", fields: { status: "approved", owner_id: "x", manage_hash: "y", ip_hash: "z", expires_at: "2099-01-01T00:00:00Z", renewals: 0 } });
  const srow = await rowOf(id);
  check("manage update: cannot set status/owner/hash/expiry via fields", srow.status === "pending" && srow.owner_id === null && /^[0-9a-f]{64}$/.test(srow.manage_hash) && srow.manage_hash !== "y" && srow.expires_at !== "2099-01-01T00:00:00Z", `${sneaky.status} ${JSON.stringify(srow)}`);
  const long = await post("/api/listings/manage", { code, action: "update", fields: { details: "q".repeat(1500) } });
  check("manage update: details clipped to 800", (await rowOf(id)).details.length === 800, `${long.status}`);

  // not editable
  for (const st of ["rejected", "removed"]) {
    const x = await create({ title: "NE " + st });
    await admin(`set?id=${x.data.id}&field=status&value=${st}`);
    const r = await post("/api/listings/manage", { code: x.data.manageCode, action: "update", fields: { title: "x" } });
    check(`manage update: ${st} -> 409 not_editable`, r.status === 409 && r.data.error === "not_editable", JSON.stringify(r));
  }
}

async function scenarioRenewDelete() {
  section("manage: renew rules + delete");
  const mk = async (title) => { const x = await create({ title }); return { id: x.data.id, code: x.data.manageCode }; };
  const renew = (code) => post("/api/listings/manage", { code, action: "renew" });

  const p = await mk("renew-pending");
  const rp = await renew(p.code);
  check("renew: pending row 409 cannot_renew", rp.status === 409 && rp.data.error === "cannot_renew", JSON.stringify(rp));

  const early = await mk("renew-early");
  await admin(`approve?id=${early.id}`);
  const re = await renew(early.code);
  check("renew: too early (30 days left) 409 cannot_renew", re.status === 409 && re.data.error === "cannot_renew", JSON.stringify(re));
  check("renew: too early leaves row untouched", (await rowOf(early.id)).renewals === 0);

  const eight = await mk("renew-8d");
  await admin(`approve?id=${eight.id}&expires_in_days=8`);
  const r8 = await renew(eight.code);
  check("renew: 8 days left still too early", r8.status === 409, JSON.stringify(r8));

  const soon = await mk("renew-soon");
  await admin(`approve?id=${soon.id}&expires_in_days=5`);
  const rs = await renew(soon.code);
  const expMs = Date.parse(rs.data.listing?.expiresAt ?? "");
  check("renew: within 7 days ok", rs.status === 200 && rs.data.ok === true, JSON.stringify(rs));
  check("renew: expires about now + 30 days", Math.abs(expMs - (Date.now() + 30 * 86400000)) < 5 * 60000, rs.data.listing?.expiresAt);
  check("renew: renewals incremented to 1", rs.data.listing?.renewals === 1 && (await rowOf(soon.id)).renewals === 1);
  check("renew: still approved", rs.data.listing?.status === "approved");
  const rs2 = await renew(soon.code);
  check("renew: right after renewing is too early", rs2.status === 409, JSON.stringify(rs2));

  const gone = await mk("renew-expired");
  await admin(`approve?id=${gone.id}&expires_in_days=-1`);
  const rg = await renew(gone.code);
  check("renew: already expired ok", rg.status === 200 && rg.data.listing?.renewals === 1, JSON.stringify(rg));

  const noexp = await mk("renew-null-expiry");
  await admin(`approve?id=${noexp.id}`);
  await admin(`set?id=${noexp.id}&field=expires_at&value=null`);
  const rn = await renew(noexp.code);
  check("renew: null expires_at ok", rn.status === 200, JSON.stringify(rn));

  const max = await mk("renew-max");
  let statuses = [];
  await admin(`approve?id=${max.id}&expires_in_days=1&renewals=0`);
  for (let i = 0; i < 4; i++) {
    const r = await renew(max.code);
    statuses.push(r.status);
    await admin(`set?id=${max.id}&field=expires_at&value=${encodeURIComponent(new Date(Date.now() + 86400000).toISOString())}`);
  }
  const fifth = await renew(max.code);
  check("renew: four renewals allowed", statuses.every((s) => s === 200), statuses.join());
  check("renew: 5th refused (max 4)", fifth.status === 409 && fifth.data.error === "cannot_renew", JSON.stringify(fifth));
  check("renew: renewals stays 4", (await rowOf(max.id)).renewals === 4);

  const del = await mk("to-delete");
  await admin(`approve?id=${del.id}`);
  const d = await post("/api/listings/manage", { code: del.code, action: "delete" });
  check("delete: ok", d.status === 200 && d.data.ok === true, JSON.stringify(d));
  check("delete: status removed in DB", (await rowOf(del.id)).status === "removed");
  const pub = await (await fetch(`${MOCK}/rest/v1/public_listings?select=id`, { headers: { apikey: ANON } })).json();
  check("delete: gone from public view", !pub.some((r) => r.id === del.id));
  const du = await post("/api/listings/manage", { code: del.code, action: "update", fields: { title: "zombie" } });
  check("delete: update afterwards 409 not_editable", du.status === 409 && du.data.error === "not_editable", JSON.stringify(du));
  const dr = await renew(del.code);
  check("delete: renew afterwards 409", dr.status === 409, JSON.stringify(dr));
  const d2 = await post("/api/listings/manage", { code: del.code, action: "delete" });
  check("delete: repeat is harmless (200)", d2.status === 200, JSON.stringify(d2));
}

async function scenarioRateLimit() {
  section("manage rate limit");
  const x = await create({ title: "rate-limit target" });
  const ip = "9.9.9.9";
  await admin("clear-rate");
  const res = [];
  for (let i = 0; i < 20; i++) res.push((await post("/api/listings/manage", { code: "AAAA-BBBB-CCCC", action: "get" }, { ip })).status);
  check("rate limit: first 20 calls answered (404)", res.every((s) => s === 404), res.join());
  const r21 = await post("/api/listings/manage", { code: "AAAA-BBBB-CCCC", action: "get" }, { ip });
  check("rate limit: 21st call 429 rate_limited", r21.status === 429 && r21.data.error === "rate_limited", JSON.stringify(r21));
  const valid = await post("/api/listings/manage", { code: x.data.manageCode, action: "get" }, { ip });
  check("rate limit: checked BEFORE lookup (valid code also 429)", valid.status === 429, JSON.stringify(valid));
  const otherIp = await post("/api/listings/manage", { code: x.data.manageCode, action: "get" }, { ip: freshIp() });
  check("rate limit: other IP still fine", otherIp.status === 200, JSON.stringify(otherIp));
  const ev = (await dump()).rate_events.filter((e) => e.kind === "manage");
  check("rate limit: events recorded with kind manage and hashed ip", ev.length >= 21 && ev.every((e) => e.ip_hash !== "9.9.9.9" && e.ip_hash.length > 8), JSON.stringify(ev.slice(0, 2)));
  const m = await post("/api/listings/manage", { code: "x", action: "get" }, { ip: "9.9.9.9" });
  check("rate limit: limit does not leak to /api/listings create", (await create({ title: "same ip create" }, { ip: "9.9.9.9" })).status === 200);
}

async function scenarioOwner() {
  section("logged-in create + /api/my/listings");
  const A = "alice@example.com", B = "bob@example.com";
  const ta = emailTok(A), tb = emailTok(B);
  const ipA = freshIp();
  const a1 = await create({ title: "A one" }, { token: ta, ip: ipA });
  const a2 = await create({ title: "A two", category: "bread" }, { token: ta, ip: ipA });
  const b1 = await create({ title: "B one" }, { token: tb });
  const anon = await create({ title: "anon with junk token" }, { token: "garbage" });
  check("owner: logged-in create returns code", a1.status === 200 && CODE_RE.test(a1.data.manageCode ?? ""), JSON.stringify(a1));
  const ra1 = await rowOf(a1.data.id);
  check("owner: owner_id stored", /^[0-9a-f-]{36}$/.test(ra1.owner_id ?? ""), JSON.stringify(ra1.owner_id));
  check("owner: same user same owner_id, other user different", (await rowOf(a2.data.id)).owner_id === ra1.owner_id && (await rowOf(b1.data.id)).owner_id !== ra1.owner_id);
  check("owner: bad token still posts anonymously", anon.status === 200 && (await rowOf(anon.data.id)).owner_id === null, JSON.stringify(anon));

  const list = await post("/api/my/listings", { action: "list" }, { token: ta });
  const titles = (list.data.listings ?? []).map((l) => l.title);
  check("my list: only own listings", list.status === 200 && titles.includes("A one") && titles.includes("A two") && !titles.includes("B one") && !titles.includes("anon with junk token"), JSON.stringify(titles));
  check("my list: newest first", titles.indexOf("A two") < titles.indexOf("A one"), titles.join());
  check("my list: no secrets", leaks(list.data).length === 0, JSON.stringify(leaks(list.data)));
  const listB = await post("/api/my/listings", { action: "list" }, { token: tb });
  check("my list: other user sees only theirs", (listB.data.listings ?? []).every((l) => l.title === "B one") && listB.data.listings.length === 1, JSON.stringify(listB.data));

  const u = await post("/api/my/listings", { action: "update", id: a1.data.id, fields: { title: "A one edited" } }, { token: ta });
  check("my update: owner ok", u.status === 200 && u.data.listing?.title === "A one edited", JSON.stringify(u));
  await admin(`approve?id=${a1.data.id}`);
  const u2 = await post("/api/my/listings", { action: "update", id: a1.data.id, fields: { title: "A one again" } }, { token: ta });
  check("my update: approved goes back to pending", u2.data.listing?.status === "pending", JSON.stringify(u2));
  const ux = await post("/api/my/listings", { action: "update", id: a1.data.id, fields: { title: "hijack" } }, { token: tb });
  check("my update: different user 404 not_found", ux.status === 404 && ux.data.error === "not_found", JSON.stringify(ux));
  check("my update: hijack did not change row", (await rowOf(a1.data.id)).title === "A one again");
  const rx = await post("/api/my/listings", { action: "renew", id: a1.data.id }, { token: tb });
  const dx = await post("/api/my/listings", { action: "delete", id: a1.data.id }, { token: tb });
  check("my renew/delete: different user 404", rx.status === 404 && dx.status === 404, `${rx.status}/${dx.status}`);
  check("my delete: other user's attempt left row alone", (await rowOf(a1.data.id)).status === "pending");
  const anonRow = await post("/api/my/listings", { action: "delete", id: anon.data.id }, { token: ta });
  check("my delete: ownerless row is not deletable by a user", anonRow.status === 404, JSON.stringify(anonRow));

  const early = await post("/api/my/listings", { action: "renew", id: a2.data.id }, { token: ta });
  check("my renew: pending -> 409 cannot_renew", early.status === 409 && early.data.error === "cannot_renew", JSON.stringify(early));
  await admin(`approve?id=${a2.data.id}&expires_in_days=3`);
  const ok = await post("/api/my/listings", { action: "renew", id: a2.data.id }, { token: ta });
  check("my renew: within window ok, renewals 1", ok.status === 200 && ok.data.listing?.renewals === 1, JSON.stringify(ok));
  const again = await post("/api/my/listings", { action: "renew", id: a2.data.id }, { token: ta });
  check("my renew: again too early 409", again.status === 409, JSON.stringify(again));

  const bad = await post("/api/my/listings", { action: "update", id: a2.data.id, fields: { type: "zzz" } }, { token: ta });
  check("my update: invalid field 400 bad_type", bad.status === 400 && bad.data.error === "bad_type", JSON.stringify(bad));
  const del = await post("/api/my/listings", { action: "delete", id: a2.data.id }, { token: ta });
  check("my delete: owner ok", del.status === 200 && del.data.ok === true, JSON.stringify(del));
  const list2 = await post("/api/my/listings", { action: "list" }, { token: ta });
  check("my list: removed rows excluded", !(list2.data.listings ?? []).some((l) => l.title === "A two"), JSON.stringify(list2.data));
  const upDel = await post("/api/my/listings", { action: "update", id: a2.data.id, fields: { title: "x" } }, { token: ta });
  check("my update: removed row 409 not_editable", upDel.status === 409 && upDel.data.error === "not_editable", JSON.stringify(upDel));

  const nid = await post("/api/my/listings", { action: "update", id: "not-a-uuid", fields: {} }, { token: ta });
  check("my: malformed id 404", nid.status === 404, JSON.stringify(nid));
  const missing = await post("/api/my/listings", { action: "update", id: "11111111-1111-4111-8111-111111111111", fields: { title: "x" } }, { token: ta });
  check("my: unknown id 404", missing.status === 404, JSON.stringify(missing));
  const ba = await post("/api/my/listings", { action: "nuke" }, { token: ta });
  check("my: unknown action 400", ba.status === 400, JSON.stringify(ba));

  const noTok = await post("/api/my/listings", { action: "list" });
  const badTok = await post("/api/my/listings", { action: "list" }, { token: "garbage" });
  const badTok2 = await post("/api/my/listings", { action: "list" }, { token: "tok-" });
  check("my: no token 401 unauthorized", noTok.status === 401 && noTok.data.error === "unauthorized", JSON.stringify(noTok));
  check("my: bad token 401 unauthorized", badTok.status === 401 && badTok.data.error === "unauthorized" && badTok2.status === 401, `${badTok.status}/${badTok2.status}`);
  const noTokDel = await post("/api/my/listings", { action: "delete", id: a1.data.id });
  check("my: delete without token 401", noTokDel.status === 401);
}

async function scenarioPublicView() {
  section("public view");
  const hidden = await create({ title: "view-hidden-contact", contactPublic: false, contactValue: "SECRET-HIDDEN" }, { token: emailTok("v@example.com") });
  const shown = await create({ title: "view-shown-contact", contactPublic: true, contactValue: "SHOWN-123" });
  const pend = await create({ title: "view-pending", contactPublic: true });
  const exp = await create({ title: "view-expired", contactPublic: true });
  await admin(`approve?id=${hidden.data.id}`);
  await admin(`approve?id=${shown.data.id}`);
  await admin(`approve?id=${exp.data.id}&expires_in_days=-2`);
  const get = (key) => fetch(`${MOCK}/rest/v1/public_listings?select=*`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const res = await get(ANON);
  const rows = await res.json();
  const byTitle = Object.fromEntries(rows.map((r) => [r.title, r]));
  check("view: anon can read it", res.status === 200 && Array.isArray(rows));
  check("view: approved rows listed", !!byTitle["view-hidden-contact"] && !!byTitle["view-shown-contact"], Object.keys(byTitle).join());
  check("view: pending and expired not listed", !byTitle["view-pending"] && !byTitle["view-expired"]);
  check("view: contact hidden unless contact_public", byTitle["view-hidden-contact"]?.contact_value == null && byTitle["view-hidden-contact"]?.contact_kind == null, JSON.stringify(byTitle["view-hidden-contact"]));
  check("view: contact shown when contact_public", byTitle["view-shown-contact"]?.contact_value === "SHOWN-123", JSON.stringify(byTitle["view-shown-contact"]));
  check("view: SECRET contact value appears nowhere", !JSON.stringify(rows).includes("SECRET-HIDDEN"));
  check("view: no ip_hash/manage_hash/owner_id/poster_name", leaks(rows).length === 0 && !JSON.stringify(rows).includes("poster_name") && !JSON.stringify(rows).includes("renewals"), JSON.stringify(leaks(rows)));
  const direct = await fetch(`${MOCK}/rest/v1/listings?select=*`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  check("base table: anon key refused", direct.status === 401 || direct.status === 403, String(direct.status));

  // The real SQL file: the view must name its columns explicitly and never select the secret ones.
  const sql = readFileSync(join(ROOT, "database/supabase-listings.sql"), "utf8");
  const viewSql = sql.slice(sql.indexOf("create or replace view public.public_listings"));
  const viewStmt = viewSql.slice(0, viewSql.indexOf(";"));
  check("sql: view has no select *", !/select\s+\*/i.test(viewStmt) && !/\.\*/.test(viewStmt));
  check("sql: view does not select secret columns", !/(ip_hash|manage_hash|owner_id|poster_name)/.test(viewStmt.replace(/--.*$/gm, "")), viewStmt);
  check("sql: view filters approved + unexpired", /status\s*=\s*'approved'/.test(viewStmt) && /expires_at/.test(viewStmt));
  check("sql: rate_events RLS + revoke", /alter table public\.rate_events enable row level security/i.test(sql) && /revoke all on public\.rate_events from anon, authenticated/i.test(sql));
  check("sql: listings RLS + revoke", /alter table public\.listings enable row level security/i.test(sql) && /revoke all on public\.listings from anon, authenticated/i.test(sql));
  check("sql: new columns present", ["manage_hash", "owner_id", "renewals", "updated_at"].every((c) => new RegExp(`${c}\\b`).test(sql)));
  check("sql: images column, cap 10, view exposes images", /images\s+text\[\]\s+not null default '\{\}'/.test(sql) && /cardinality\(images\)\s*<=\s*10/.test(sql) && /expires_at, images\s*\n\s*from public\.listings/.test(sql));
  const mig = readFileSync(join(ROOT, "database/migrations/003-listing-images.sql"), "utf8");
  check("sql: migration 003 adds column, view, public bucket without storage.objects policies", /add column if not exists images/.test(mig) && /expires_at, images/.test(mig) && /'listing-images', 'listing-images', true/.test(mig) && /614400/.test(mig) && !/create policy/i.test(mig + sql));
  check("sql: no raw manage_code column", !/manage_code\s/i.test(sql));
}


// ---------- photos ----------
// Same wire format as supabase-js uploadToSignedUrl: PUT, FormData with cacheControl + a file under the empty field name.
async function putPhoto(url, { type = "image/jpeg", size = 2000 } = {}) {
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", new Blob([new Uint8Array(size).fill(7)], { type }));
  const res = await fetch(url, { method: "PUT", body: fd });
  return { status: res.status, data: await res.json().catch(() => null) };
}
const NAME_RE = /^[a-z0-9]{10,16}\.(webp|jpg)$/;
const stored = async () => (await dump()).storage;
async function signAndUpload(auth, n, ext = "jpg") {
  const sign = await post("/api/listings/images", { ...auth.body, items: Array.from({ length: n }, () => ({ ext })) }, { token: auth.token, ip: auth.ip });
  const names = [];
  if (sign.status === 200) {
    for (const f of sign.data.files) {
      const a = await putPhoto(f.full.url);
      const b = await putPhoto(f.thumb.url);
      if (a.status === 200 && b.status === 200) names.push(f.name);
    }
  }
  return { sign, names };
}

async function scenarioPhotos() {
  section("photos: sign, upload, finalise, view");
  const c = await create({ title: "Photo listing", contactPublic: true });
  const code = c.data.manageCode, id = c.data.id;
  const A = { body: { code } };
  const r = await signAndUpload(A, 3);
  check("images: sign 200 with 3 files", r.sign.status === 200 && r.sign.data.ok && r.sign.data.files.length === 3, JSON.stringify(r.sign));
  const f0 = r.sign.data.files?.[0];
  check("images: names match contract and differ", r.sign.data.files.every((f) => NAME_RE.test(f.name)) && new Set(r.sign.data.files.map((f) => f.name)).size === 3, JSON.stringify(r.sign.data.files?.map((f) => f.name)));
  check("images: signed URLs absolute, PUT, token in URL, full and thumb differ", f0 && f0.full.method === "PUT" && f0.thumb.method === "PUT" && f0.full.url.startsWith(MOCK + "/storage/v1/object/upload/sign/listing-images/" + id + "/") && f0.full.url.includes("token=") && f0.thumb.url.includes(`/${f0.name.replace(".jpg", "-t.jpg")}?`) , JSON.stringify(f0));
  check("images: all 3 photos uploaded via the FormData protocol", r.names.length === 3);
  const keys = (await stored()).filter((k) => k.startsWith(id + "/"));
  check("images: six objects in storage (full + thumb)", keys.length === 6, keys.join());
  check("images: nothing in DB before finalise", (await rowOf(id)).images.length === 0);

  const reuse = await putPhoto(f0.full.url);
  check("images: signed URL cannot overwrite (409)", reuse.status !== 200, JSON.stringify(reuse));
  const fin = await post("/api/listings/manage", { code, action: "update", fields: { images: r.names } });
  check("images: finalise ok, order kept, names in response", fin.status === 200 && JSON.stringify(fin.data.listing?.images) === JSON.stringify(r.names), JSON.stringify(fin));
  check("images: DB row has the names", JSON.stringify((await rowOf(id)).images) === JSON.stringify(r.names));
  const g = await post("/api/listings/manage", { code, action: "get" });
  check("images: manage get returns images array", Array.isArray(g.data.listing?.images) && g.data.listing.images.length === 3 && leaks(g.data).length === 0);
  const reorder = [r.names[2], r.names[0], r.names[1]];
  const ro = await post("/api/listings/manage", { code, action: "update", fields: { images: reorder } });
  check("images: reorder (new cover) ok", ro.status === 200 && ro.data.listing.images[0] === r.names[2], JSON.stringify(ro.data));

  await admin(`approve?id=${id}`);
  const pubRows = await (await fetch(`${MOCK}/rest/v1/public_listings?select=*`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
  const pub = pubRows.find((x) => x.id === id);
  check("images: public view shows images in order", JSON.stringify(pub?.images) === JSON.stringify(reorder), JSON.stringify(pub));
  const obj = await fetch(`${MOCK}/storage/v1/object/public/listing-images/${id}/${reorder[0]}`);
  const thumb = await fetch(`${MOCK}/storage/v1/object/public/listing-images/${id}/${reorder[0].replace(".jpg", "-t.jpg")}`);
  check("images: public object and thumb readable without a key", obj.status === 200 && thumb.status === 200 && obj.headers.get("content-type") === "image/jpeg");
  const anonList = await fetch(`${MOCK}/storage/v1/object/list/listing-images`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: id }) });
  const anonDel = await fetch(`${MOCK}/storage/v1/object/listing-images`, { method: "DELETE", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [`${id}/${reorder[0]}`] }) });
  const anonSign = await fetch(`${MOCK}/storage/v1/object/upload/sign/listing-images/${id}/aaaaaaaaaaaa.jpg`, { method: "POST", headers: { apikey: ANON } });
  check("images: anon key cannot list, delete or sign (mock mirrors no-policy bucket)", anonList.status === 401 && anonDel.status === 401 && anonSign.status === 401);

  const drop = await post("/api/listings/manage", { code, action: "update", fields: { images: [reorder[0]] } });
  check("images: images change on approved listing -> pending", drop.status === 200 && drop.data.listing.status === "pending", JSON.stringify(drop.data));
  const left = (await stored()).filter((k) => k.startsWith(id + "/"));
  check("images: dropped photos removed from storage (both files)", left.length === 2 && left.every((k) => k.includes(reorder[0].split(".")[0])), left.join());
  const clear = await post("/api/listings/manage", { code, action: "update", fields: { images: [] } });
  check("images: empty list clears photos", clear.status === 200 && clear.data.listing.images.length === 0 && (await stored()).filter((k) => k.startsWith(id + "/")).length === 0, JSON.stringify(clear.data));

  section("photos: limits and validation");
  const lim = await create({ title: "Limit listing" });
  const L = { body: { code: lim.data.manageCode } };
  const s11 = await post("/api/listings/images", { ...L.body, items: Array.from({ length: 11 }, () => ({ ext: "webp" })) });
  check("images: 11 in one call -> 400 too_many_images", s11.status === 400 && s11.data.error === "too_many_images", JSON.stringify(s11));
  const eight = await signAndUpload(L, 8, "webp");
  check("images: 8 webp uploaded", eight.names.length === 8 && eight.names.every((n) => n.endsWith(".webp")));
  const fin8 = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: eight.names } });
  check("images: 8 saved", fin8.status === 200 && fin8.data.listing.images.length === 8);
  const s3 = await post("/api/listings/images", { ...L.body, items: [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }] });
  check("images: 8 existing + 3 new -> too_many_images", s3.status === 400 && s3.data.error === "too_many_images", JSON.stringify(s3));
  const two = await signAndUpload(L, 2);
  check("images: 8 + 2 = 10 allowed", two.names.length === 2);
  const all10 = [...eight.names, ...two.names];
  const fin10 = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: all10 } });
  check("images: exactly 10 saved", fin10.status === 200 && fin10.data.listing.images.length === 10, JSON.stringify(fin10.data));
  const over = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: [...all10, "abcdefghijkl.jpg"] } });
  check("images: finalise with 11 names -> 400 too_many_images", over.status === 400 && over.data.error === "too_many_images", JSON.stringify(over));
  const dup = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: [all10[0], all10[0]] } });
  check("images: duplicate names -> 400 bad_images", dup.status === 400 && dup.data.error === "bad_images", JSON.stringify(dup));
  for (const bad of ["x.png", "../etc/passwd", "ABCDEFGHIJKL.jpg", "short.jpg", `${all10[0]}/../x.jpg`, 5, null]) {
    const rr = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: [bad] } });
    check(`images: bad name ${JSON.stringify(bad)} -> 400 bad_images`, rr.status === 400 && rr.data.error === "bad_images", JSON.stringify(rr));
  }
  const notArr = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: "abc" } });
  check("images: non-array -> 400 bad_images", notArr.status === 400 && notArr.data.error === "bad_images", JSON.stringify(notArr));
  const ghost = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: ["zzzzzzzzzzzz.jpg"] } });
  check("images: name with no object in storage -> 400 bad_images", ghost.status === 400 && ghost.data.error === "bad_images", JSON.stringify(ghost));
  const half = await post("/api/listings/images", { ...L.body, items: [{ ext: "jpg" }] }).then(async (x) => (x.status === 200 ? (await putPhoto(x.data.files[0].full.url), x.data.files[0].name) : null));
  const hr = await post("/api/listings/manage", { code: L.body.code, action: "update", fields: { images: [half] } });
  check("images: full uploaded but thumb missing -> 400 bad_images", hr.status === 400 && hr.data.error === "bad_images", JSON.stringify(hr));
  check("images: failed finalise left the saved list alone", (await rowOf(lim.data.id)).images.length === 10);
  const badExt = await post("/api/listings/images", { ...L.body, items: [{ ext: "png" }] });
  const noItems = await post("/api/listings/images", { ...L.body, items: [] });
  const badItems = await post("/api/listings/images", { ...L.body, items: "x" });
  check("images: bad ext / empty / non-array items -> 400 bad_images", [badExt, noItems, badItems].every((x) => x.status === 400 && x.data.error === "bad_images"), JSON.stringify([badExt.data, noItems.data, badItems.data]));

  section("photos: storage limits (mock mirrors the bucket)");
  const lone = await create({ title: "Limits" });
  const sg = await post("/api/listings/images", { code: lone.data.manageCode, items: [{ ext: "jpg" }, { ext: "jpg" }] });
  const big = await putPhoto(sg.data.files[0].full.url, { size: 650 * 1024 });
  const wrongType = await putPhoto(sg.data.files[1].full.url, { type: "image/png" });
  const edge = await putPhoto(sg.data.files[1].thumb.url, { size: 600 * 1024 });
  check("storage: > 600 KB refused (413)", big.status === 413, JSON.stringify(big));
  check("storage: image/png refused (415)", wrongType.status === 415, JSON.stringify(wrongType));
  check("storage: exactly 600 KB accepted", edge.status === 200, JSON.stringify(edge));
  const badTok = await putPhoto(sg.data.files[0].full.url.replace(/token=.*/, "token=nope"));
  check("storage: bad token refused", badTok.status === 403, JSON.stringify(badTok));

  section("photos: isolation, owner path, errors");
  const other = await create({ title: "Other listing" });
  const oth = await signAndUpload({ body: { code: other.data.manageCode } }, 1);
  const steal = await post("/api/listings/manage", { code: lim.data.manageCode, action: "update", fields: { images: [oth.names[0]] } });
  check("isolation: code A cannot use B's photo names (bad_images)", steal.status === 400 && steal.data.error === "bad_images", JSON.stringify(steal));
  const sign = await post("/api/listings/images", { code: lim.data.manageCode, listingId: other.data.id, items: [{ ext: "jpg" }] });
  const signedPaths = (sign.data.files ?? []).map((f) => f.full.url);
  check("isolation: listingId in body is ignored when a code is used (URLs are for A's folder)", sign.status !== 200 || signedPaths.every((u) => u.includes(`/${lim.data.id}/`)) , JSON.stringify(sign));
  const wrong = await post("/api/listings/images", { code: "AAAA-AAAA-AAAA", items: [{ ext: "jpg" }] });
  const mal = await post("/api/listings/images", { code: "zz", items: [{ ext: "jpg" }] });
  check("images: wrong and malformed code -> identical 404 not_found", wrong.status === 404 && mal.status === 404 && JSON.stringify(wrong.data) === JSON.stringify(mal.data) && wrong.data.error === "not_found", JSON.stringify([wrong, mal]));
  const noAuth = await post("/api/listings/images", { items: [{ ext: "jpg" }], listingId: other.data.id });
  check("images: no code and no token -> 401", noAuth.status === 401, JSON.stringify(noAuth));
  const badJ = await post("/api/listings/images", null, { raw: "{nope" });
  check("images: bad json 400", badJ.status === 400 && badJ.data.error === "bad_json");

  const ta = emailTok("alice-photos@example.com"), tb = emailTok("bob-photos@example.com");
  const mine = await create({ title: "Owner photos" }, { token: ta });
  const O = { body: { listingId: mine.data.id }, token: ta };
  const ow = await signAndUpload(O, 2);
  check("owner: sign + upload with login token", ow.sign.status === 200 && ow.names.length === 2, JSON.stringify(ow.sign));
  const fo = await post("/api/my/listings", { action: "update", id: mine.data.id, fields: { images: ow.names } }, { token: ta });
  check("owner: finalise via /api/my/listings", fo.status === 200 && fo.data.listing.images.length === 2, JSON.stringify(fo));
  const lst = await post("/api/my/listings", { action: "list" }, { token: ta });
  check("owner: my list carries images", lst.data.listings.find((l) => l.id === mine.data.id)?.images.length === 2 && leaks(lst.data).length === 0);
  const bobSign = await post("/api/listings/images", { listingId: mine.data.id, items: [{ ext: "jpg" }] }, { token: tb });
  check("owner: another user cannot sign for my listing (404)", bobSign.status === 404 && bobSign.data.error === "not_found", JSON.stringify(bobSign));
  const bobFin = await post("/api/my/listings", { action: "update", id: mine.data.id, fields: { images: [] } }, { token: tb });
  check("owner: another user cannot change my photos (404)", bobFin.status === 404 && (await rowOf(mine.data.id)).images.length === 2, JSON.stringify(bobFin));
  const junk = await post("/api/listings/images", { listingId: mine.data.id, items: [{ ext: "jpg" }] }, { token: "garbage" });
  check("owner: garbage token 401", junk.status === 401);
  const badId = await post("/api/listings/images", { listingId: "nope", items: [{ ext: "jpg" }] }, { token: ta });
  check("owner: malformed listingId 404", badId.status === 404);

  for (const st of ["removed", "rejected"]) {
    const x = await create({ title: "NE photo " + st });
    await admin(`set?id=${x.data.id}&field=status&value=${st}`);
    const rr = await post("/api/listings/images", { code: x.data.manageCode, items: [{ ext: "jpg" }] });
    check(`images: ${st} listing -> 409 not_editable`, rr.status === 409 && rr.data.error === "not_editable", JSON.stringify(rr));
  }

  section("photos: rate limit");
  const rl = await create({ title: "Rate photos" });
  const ip = "8.8.4.4";
  await admin("clear-rate");
  const sts = [];
  for (let i = 0; i < 12; i++) sts.push((await post("/api/listings/images", { code: rl.data.manageCode, items: [{ ext: "jpg" }] }, { ip })).status);
  const r41 = await post("/api/listings/images", { code: rl.data.manageCode, items: [{ ext: "jpg" }] }, { ip });
  check("images rate: first 12 per hour answered", sts.every((x) => x === 200), sts.join());
  check("images rate: 13th -> 429 rate_limited", r41.status === 429 && r41.data.error === "rate_limited", JSON.stringify(r41));
  const mg = await post("/api/listings/manage", { code: rl.data.manageCode, action: "get" }, { ip });
  check("images rate: separate from the manage limiter", mg.status === 200, JSON.stringify(mg));

  section("photos: folder cap, size and type checks, renew cut-off");
  const fc = await create({ title: "Folder cap" });
  const fcId = fc.data.id, fcCode = fc.data.manageCode;
  await admin("clear-rate");
  const fcSign = await post("/api/listings/images", { code: fcCode, items: Array.from({ length: 10 }, () => ({ ext: "jpg" })) }, { ip: "9.9.9.1" });
  for (const f of fcSign.data.files) { await putPhoto(f.full.url); await putPhoto(f.thumb.url); }
  const fcMore = await post("/api/listings/images", { code: fcCode, items: [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }] }, { ip: "9.9.9.1" });
  check("folder cap: 20 fresh unsaved files + 3 more photos -> 400 too_many_images", fcMore.status === 400 && fcMore.data.error === "too_many_images", JSON.stringify(fcMore));
  const fcOne = await post("/api/listings/images", { code: fcCode, items: [{ ext: "jpg" }] }, { ip: "9.9.9.1" });
  check("folder cap: 1 more photo still fits (20 + 2 <= 24)", fcOne.status === 200, JSON.stringify(fcOne));
  for (const f of fcSign.data.files.slice(0, 2)) await admin(`put-object?path=${encodeURIComponent(fcId + "/" + f.name)}&age_min=60`);
  for (const f of fcSign.data.files.slice(2)) { await admin(`put-object?path=${encodeURIComponent(fcId + "/" + f.name)}&age_min=60`); await admin(`put-object?path=${encodeURIComponent(fcId + "/" + f.name.replace(".jpg", "-t.jpg"))}&age_min=60`); }
  for (const f of fcSign.data.files.slice(0, 2)) await admin(`put-object?path=${encodeURIComponent(fcId + "/" + f.name.replace(".jpg", "-t.jpg"))}&age_min=60`);
  const fcStale = await post("/api/listings/images", { code: fcCode, items: [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }] }, { ip: "9.9.9.1" });
  check("folder cap: old unsaved files are cleaned up so a real retry fits", fcStale.status === 200 && (await stored()).filter((k) => k.startsWith(fcId + "/")).length === 0, JSON.stringify(fcStale) + (await stored()).filter((k) => k.startsWith(fcId + "/")).length);

  const sz = await create({ title: "Size checks" });
  const szS = await post("/api/listings/images", { code: sz.data.manageCode, items: [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }] }, { ip: "9.9.9.2" });
  const [g0, g1, g2] = szS.data.files;
  await putPhoto(g0.full.url); await putPhoto(g0.thumb.url, { size: 200_000 });
  await putPhoto(g1.full.url, { type: "image/png" }); await putPhoto(g1.thumb.url);
  await putPhoto(g2.full.url, { size: 90_000 }); await putPhoto(g2.thumb.url, { size: 20_000 });
  const fz = (n) => post("/api/listings/manage", { code: sz.data.manageCode, action: "update", fields: { images: [n] } });
  const z0 = await fz(g0.name), z1 = await fz(g1.name), z2 = await fz(g2.name);
  check("finalise: thumbnail over 150 KB -> 400 bad_images", z0.status === 400 && z0.data.error === "bad_images", JSON.stringify(z0));
  check("finalise: not webp/jpeg -> 400 bad_images", z1.status === 400 && z1.data.error === "bad_images", JSON.stringify(z1));
  check("finalise: normal sizes ok", z2.status === 200, JSON.stringify(z2));
  check("finalise: leftover files of unsaved uploads removed once old (young ones kept)", (await stored()).filter((k) => k.startsWith(sz.data.id + "/")).length >= 2);

  const old = await create({ title: "Renew too late" });
  await admin(`approve?id=${old.data.id}&expires_in_days=-20`);
  const rOld = await post("/api/listings/manage", { code: old.data.manageCode, action: "renew" });
  check("renew: 20 days after expiry -> 409 cannot_renew (photos are swept at 14)", rOld.status === 409 && rOld.data.error === "cannot_renew", JSON.stringify(rOld));

  section("photos: delete cleanup + keepalive sweep");
  const dl = await create({ title: "Delete with photos" });
  const dd = await signAndUpload({ body: { code: dl.data.manageCode } }, 2);
  await post("/api/listings/manage", { code: dl.data.manageCode, action: "update", fields: { images: dd.names } });
  check("delete: photos exist before", (await stored()).filter((k) => k.startsWith(dl.data.id + "/")).length === 4);
  const del = await post("/api/listings/manage", { code: dl.data.manageCode, action: "delete" });
  check("delete: ok", del.status === 200 && del.data.ok === true);
  check("delete: storage folder emptied and images cleared", (await stored()).filter((k) => k.startsWith(dl.data.id + "/")).length === 0 && (await rowOf(dl.data.id)).images.length === 0);

  const mkPhoto = async (title) => {
    const x = await create({ title });
    const u = await signAndUpload({ body: { code: x.data.manageCode } }, 1);
    await post("/api/listings/manage", { code: x.data.manageCode, action: "update", fields: { images: u.names } });
    return x.data.id;
  };
  const has = async (id) => (await stored()).some((k) => k.startsWith(id + "/"));
  const active = await mkPhoto("sweep active");
  await admin(`approve?id=${active}`);
  const pendingP = await mkPhoto("sweep pending");
  const rejected = await mkPhoto("sweep rejected");
  await admin(`set?id=${rejected}&field=status&value=rejected`);
  const removed = await mkPhoto("sweep removed");
  await admin(`set?id=${removed}&field=status&value=removed`);
  const longGone = await mkPhoto("sweep expired 20d");
  await admin(`approve?id=${longGone}&expires_in_days=-20`);
  const justGone = await mkPhoto("sweep expired 5d");
  await admin(`approve?id=${justGone}&expires_in_days=-5`);
  const noAuthKa = await fetch(`${APP}/api/keepalive`);
  const wrongKa = await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer nope" } });
  check("keepalive: 401 without / with wrong secret", noAuthKa.status === 401 && wrongKa.status === 401, `${noAuthKa.status}/${wrongKa.status}`);
  check("keepalive: 401 sweeps nothing", await has(removed));
  const ka = await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  check("keepalive: 200 with secret", ka.status === 200 && (await ka.json()).ok === true);
  check("sweep: removed listing's photos deleted + images cleared", !(await has(removed)) && (await rowOf(removed)).images.length === 0);
  check("sweep: rejected listing's photos deleted", !(await has(rejected)) && (await rowOf(rejected)).images.length === 0);
  check("sweep: expired > 14 days ago deleted", !(await has(longGone)) && (await rowOf(longGone)).images.length === 0);
  check("sweep: expired only 5 days ago kept (grace)", (await has(justGone)) && (await rowOf(justGone)).images.length === 1);
  check("sweep: active approved listing untouched", (await has(active)) && (await rowOf(active)).images.length === 1);
  check("sweep: pending listing untouched", (await has(pendingP)) && (await rowOf(pendingP)).images.length === 1);

  const many = [];
  for (let i = 0; i < 23; i++) { const x = await create({ title: "bulk " + i }); const u = await signAndUpload({ body: { code: x.data.manageCode } }, 1); await post("/api/listings/manage", { code: x.data.manageCode, action: "update", fields: { images: u.names } }); await admin(`set?id=${x.data.id}&field=status&value=removed`); many.push(x.data.id); }
  await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  const clearedN = (await dump()).listings.filter((r) => many.includes(r.id) && r.images.length === 0).length;
  check("sweep: bounded to 20 listings per run", clearedN === 20, String(clearedN));
  await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  check("sweep: next run finishes the rest", (await dump()).listings.filter((r) => many.includes(r.id) && r.images.length === 0).length === 23);
}

async function scenarioPages() {
  section("pages smoke");
  for (const p of ["/fa/login", "/en/login", "/fa/my", "/en/my", "/fa/manage", "/en/manage", "/fa/market", "/en/market"]) {
    let r;
    try { r = await fetch(APP + p); } catch (e) { r = { status: 0 }; }
    check(`page ${p}: 200`, r.status === 200, String(r.status));
  }
  const bad = await fetch(APP + "/xx/login");
  check("page /xx/login: 404", bad.status === 404, String(bad.status));
  const html = await (await fetch(APP + "/fa/manage")).text();
  check("page /fa/manage: RTL Persian", /dir="rtl"/.test(html) && /lang="fa"/.test(html));
  check("page: no service role key in HTML", !html.includes(SVC));
  const login = await (await fetch(APP + "/en/login")).text();
  check("page /en/login: mentions login is optional", /optional/i.test(login), "no 'optional' text on /en/login");
}

async function scenarioAuthLib() {
  section("auth endpoints used by the client lib (mock sanity)");
  const r = await fetch(`${MOCK}/auth/v1/otp?redirect_to=${encodeURIComponent(APP + "/fa/login")}`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email: "x@y.com", create_user: true }) });
  check("mock otp ok", r.status === 200);
}

async function scenarioNotConfigured() {
  section("not_configured (production server without Supabase env)");
  if (!existsSync(join(ROOT, ".next/BUILD_ID"))) { console.log("  skipped: no production build"); failures.push({ name: "not_configured phase", detail: "skipped: run npm run build first" }); return; }
  const clean = {};
  for (const k of Object.keys(ENV)) clean[k] = "";
  const p = start("npx", ["next", "start", "-p", String(PROD_PORT)], { ...clean, PORT: String(PROD_PORT) }, "next-start");
  try {
    await waitFor(`http://localhost:${PROD_PORT}/fa`, 60000, p);
  } catch (e) {
    check("not_configured: prod server starts", false, e.message);
    return;
  }
  const P = `http://localhost:${PROD_PORT}`;
  const r1 = await api(P, "/api/listings", base());
  const r2 = await api(P, "/api/listings/manage", { code: "AAAA-AAAA-AAAA", action: "get" });
  const r3 = await api(P, "/api/my/listings", { action: "list" }, { token: "tok-a@b.com" });
  check("not_configured: POST /api/listings 503", r1.status === 503 && r1.data.error === "not_configured", JSON.stringify(r1));
  check("not_configured: POST /api/listings/manage 503", r2.status === 503 && r2.data.error === "not_configured", JSON.stringify(r2));
  check("not_configured: POST /api/my/listings 503", r3.status === 503 && r3.data.error === "not_configured", JSON.stringify(r3));
  const login = await fetch(P + "/en/login");
  const html = await login.text();
  check("not_configured: login page renders 200 with 'not available' note", login.status === 200 && /not available/i.test(html), `${login.status} ${/not available/i.test(html)}`);
  const home = await (await fetch(P + "/en")).text();
  check("not_configured: header keeps the Log in link (the login page explains)", /\/en\/login/.test(home), "login link missing from the header");
  try { process.kill(-p.pid, "SIGTERM"); } catch {}
}

// ---------- main ----------
async function main() {
  for (const f of [".env.local", ".env.test.local"]) if (existsSync(join(ROOT, f))) console.log(`note: existing ${f} left untouched`);
  const mock = start("node", ["scripts/mock-supabase.mjs"], { MOCK_PORT: String(MOCK_PORT) }, "mock");
  await waitFor(`${MOCK}/__health`, 10000, mock);
  console.log("mock up");

  const dev = start("npx", ["next", "dev", "-p", String(DEV_PORT)], ENV, "next-dev", makeClone());
  try {
    await waitFor(`${APP}/fa`, 180000, dev);
    console.log("next dev up");
    await scenarioCreate();
    await scenarioManage();
    await scenarioRenewDelete();
    await scenarioRateLimit();
    await scenarioOwner();
    await scenarioPublicView();
    await scenarioPhotos();
    await scenarioAuthLib();
    await scenarioPages();
    const devLog = dev.getLog();
    check("dev server log: no unhandled server errors", !/⨯|Unhandled|TypeError|ReferenceError/.test(devLog), devLog.split("\n").filter((l) => /⨯|Unhandled|TypeError|ReferenceError/.test(l)).slice(0, 5).join(" | "));
  } finally {
    try { process.kill(-dev.pid, "SIGTERM"); } catch {}
  }
  await sleep(1500);
  await scenarioNotConfigured();
}

let code = 0;
try {
  await main();
} catch (e) {
  console.log("\nHARNESS ERROR", e.message);
  failures.push({ name: "harness", detail: e.message });
  code = 2;
} finally {
  killAll();
}
console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log(`- ${f.name}: ${f.detail}`);
process.exit(code || (failures.length ? 1 : 0));
