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
  check("sql: no raw manage_code column", !/manage_code\s/i.test(sql));
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
  check("not_configured: header shows no Log in link", !/>\s*Log in\s*</i.test(home) && !/\/en\/login/.test(home), "login link present while Supabase is not configured");
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
