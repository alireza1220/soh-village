// End-to-end test for accounts, profiles, avatars, the four boards and the listing API:
// the real Next.js app (a throwaway copy of the project) against scripts/mock-supabase.mjs.
// Run: node scripts/test-market.mjs        (about 3-5 minutes; it starts its own servers on 3222/3223 and the mock on 54399)
// Never run "next build" for this; the "not configured" phase runs a second dev server with no Supabase env.
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { readdirSync, existsSync, rmSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MOCK_PORT = 54399;
const DEV_PORT = 3222;
const PROD_PORT = 3223;
const MOCK = `http://localhost:${MOCK_PORT}`;
const APP = `http://localhost:${DEV_PORT}`;
const SVC = "svc-key";
const ANON = "anon-key";
// MANAGE_CODE_SALT is retired: it is deliberately empty here, and everything must work without it.
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: MOCK,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
  SUPABASE_SERVICE_ROLE_KEY: SVC,
  IP_HASH_SALT: "t",
  MANAGE_CODE_SALT: "",
  CRON_SECRET: "cron-t",
};
const BOARDS = ["market", "careers", "needs", "property"];
const FIXTURE = {
  market: { type: "sell", category: "fruit", extra: {} },
  careers: { type: "hiring", category: "farm", extra: { quantity: "seasonal" } },
  needs: { type: "offer", category: "stay", extra: {} },
  property: { type: "rent", category: "house", extra: {} },
};
const PUBLIC_KEYS = ["id", "type", "category", "title", "quantity", "price", "area", "available", "details", "contact_kind", "contact_value", "created_at", "expires_at", "images", "board", "poster_first_name", "poster_avatar", "poster_verified"].sort();

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
const clones = [];
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
// "next dev" allows one instance per project dir, and Al may have his own running. So each phase runs in a
// throwaway copy of the project (node_modules is an APFS clone, so this takes a couple of seconds).
function makeClone(tag) {
  const dir = join(tmpdir(), `soh-test-${tag}-${process.pid}`);
  rmSync(dir, { recursive: true, force: true });
  execFileSync("mkdir", ["-p", dir]);
  for (const name of readdirSync(ROOT)) {
    if ([".next", "tsconfig.tsbuildinfo", ".git", ".env.local"].includes(name)) continue;
    execFileSync("cp", [name === "node_modules" ? "-Rc" : "-R", join(ROOT, name), join(dir, name)]);
  }
  clones.push(dir);
  return dir;
}
function killAll() {
  for (const p of procs) {
    try { process.kill(-p.pid, "SIGTERM"); } catch {}
  }
  for (const d of clones) {
    try { rmSync(d, { recursive: true, force: true }); } catch {}
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
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])).toString();
const rowOf = async (id) => (await dump()).listings.find((r) => r.id === id);
const profileRow = async (uid) => (await dump()).profiles.find((p) => p.user_id === uid);
const clearRate = () => admin("clear-rate");
const view = async (select = "*", extra = "", key = ANON) =>
  fetch(`${MOCK}/rest/v1/public_listings?select=${select}${extra}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
const viewRows = async (extra = "") => (await view("*", extra)).json();

const FORBIDDEN = ["ip_hash", "manage_hash", "owner_id", "manageHash", "ipHash", "ownerId", "user_id", "manageCode", "manage_code", "posterName", "poster_name", "family_name", "familyName"];
const leaks = (obj) => FORBIDDEN.filter((k) => JSON.stringify(obj).includes(`"${k}"`));

let userSeq = 0;
// A fake user with a token (the mock accepts "tok-<email>"), optionally with a complete profile.
async function mkUser(label, { profile = true, ...p } = {}) {
  const email = `${label}${++userSeq}@example.com`;
  let id;
  if (profile) id = (await admin("mkprofile?" + qs({ email, first: p.first ?? "Test" + label, family: p.family ?? "Family" + label, phone: p.phone ?? "09120000000", avatar: p.avatar, show: p.show === undefined ? undefined : p.show ? 1 : 0, address: p.address, verified: p.verified ? 1 : undefined }))).user_id;
  else id = (await admin("mkuser?" + qs({ email }))).id;
  return { email, id, token: `tok-${email}` };
}
const bodyFor = (board, over = {}) => ({ board, type: FIXTURE[board].type, category: FIXTURE[board].category, title: `T-${board}`, area: "Soh", price: "100", ...FIXTURE[board].extra, ...over });
async function createRaw(u, body, o = {}) {
  await clearRate();
  return post("/api/listings", body, { token: u?.token, ...o });
}
const create = (u, over = {}, o = {}) => createRaw(u, bodyFor(over.board ?? "market", over), o);
const mk = async (u, title, over = {}) => { const r = await create(u, { title, ...over }); return r.data.id; };

// ---------- scenarios ----------
async function scenarioMockAuth() {
  section("auth endpoints (mock sanity: the contract the client lib relies on)");
  const A = { apikey: ANON, "Content-Type": "application/json" };
  const call = async (path, body, method = "POST", extra = {}) => {
    const r = await fetch(MOCK + path, { method, headers: { ...A, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: r.status, data: await r.json().catch(() => null) };
  };
  await admin("set-confirm?on=0");
  const s1 = await call(`/auth/v1/signup?redirect_to=${encodeURIComponent(APP + "/fa/login")}`, { email: "pw1@example.com", password: "correct-horse" });
  check("signup (Confirm email OFF): session returned", s1.status === 200 && !!s1.data.access_token && !!s1.data.refresh_token && s1.data.user.email === "pw1@example.com", JSON.stringify(s1.data).slice(0, 200));
  const l1 = await call("/auth/v1/token?grant_type=password", { email: "pw1@example.com", password: "correct-horse" });
  check("password login ok", l1.status === 200 && l1.data.access_token === "tok-pw1@example.com");
  const bad = await call("/auth/v1/token?grant_type=password", { email: "pw1@example.com", password: "wrong-horse" });
  const unk = await call("/auth/v1/token?grant_type=password", { email: "nobody@example.com", password: "wrong-horse" });
  check("wrong password and unknown email: same 400 invalid_credentials", bad.status === 400 && bad.data.error_code === "invalid_credentials" && JSON.stringify(bad.data) === JSON.stringify(unk.data), JSON.stringify([bad, unk]));
  const weak = await call("/auth/v1/signup", { email: "pw2@example.com", password: "short" });
  check("signup: short password -> 422 weak_password", weak.status === 422 && weak.data.error_code === "weak_password", JSON.stringify(weak));
  const dup = await call("/auth/v1/signup", { email: "pw1@example.com", password: "correct-horse" });
  check("signup (Confirm OFF): repeat -> 422 user_already_exists", dup.status === 422 && dup.data.error_code === "user_already_exists", JSON.stringify(dup));
  const badEmail = await call("/auth/v1/signup", { email: "not-an-email", password: "correct-horse" });
  check("signup: bad email -> 400", badEmail.status === 400, JSON.stringify(badEmail));

  await admin("set-confirm?on=1");
  const s2 = await call("/auth/v1/signup", { email: "pw3@example.com", password: "correct-horse" });
  check("signup (Confirm ON): user but NO session", s2.status === 200 && !s2.data.access_token && s2.data.email === "pw3@example.com", JSON.stringify(s2.data).slice(0, 200));
  const l2 = await call("/auth/v1/token?grant_type=password", { email: "pw3@example.com", password: "correct-horse" });
  check("login before confirming -> 400 email_not_confirmed", l2.status === 400 && l2.data.error_code === "email_not_confirmed", JSON.stringify(l2));
  await admin("confirm?email=pw3@example.com");
  const l3 = await call("/auth/v1/token?grant_type=password", { email: "pw3@example.com", password: "correct-horse" });
  check("login after confirming ok", l3.status === 200 && !!l3.data.access_token);
  const s3 = await call("/auth/v1/signup", { email: "pw3@example.com", password: "another-horse" });
  check("signup (Confirm ON): repeat is obfuscated (identities [], no session, no error)", s3.status === 200 && Array.isArray(s3.data.identities) && s3.data.identities.length === 0 && !s3.data.access_token, JSON.stringify(s3.data).slice(0, 200));
  await admin("set-confirm?on=0");

  const rec = await call(`/auth/v1/recover?redirect_to=${encodeURIComponent(APP + "/fa/reset-password")}`, { email: "pw1@example.com" });
  const rec2 = await call(`/auth/v1/recover?redirect_to=${encodeURIComponent(APP + "/fa/reset-password")}`, { email: "ghost@example.com" });
  check("recover: same 200 for known and unknown address", rec.status === 200 && rec2.status === 200 && JSON.stringify(rec.data) === JSON.stringify(rec2.data));
  const mails = (await dump()).mails;
  check("recover: mail logged with the exact redirect_to (no query string)", mails.some((m) => m.kind === "recovery" && m.email === "pw1@example.com" && m.redirect_to === APP + "/fa/reset-password"), JSON.stringify(mails.slice(-2)));

  const g = await call("/auth/v1/user", undefined, "GET", { Authorization: "Bearer tok-pw1@example.com" });
  const gBad = await call("/auth/v1/user", undefined, "GET", { Authorization: "Bearer garbage" });
  check("user GET: good token ok, garbage 401", g.status === 200 && g.data.email === "pw1@example.com" && /^[0-9a-f-]{36}$/.test(g.data.id) && gBad.status === 401);
  const same = await call("/auth/v1/user", { password: "correct-horse" }, "PUT", { Authorization: "Bearer tok-pw1@example.com" });
  const wk = await call("/auth/v1/user", { password: "short" }, "PUT", { Authorization: "Bearer tok-pw1@example.com" });
  const up = await call("/auth/v1/user", { password: "brand-new-horse" }, "PUT", { Authorization: "Bearer tok-pw1@example.com" });
  check("user PUT: same_password / weak_password / ok", same.data?.error_code === "same_password" && wk.data?.error_code === "weak_password" && up.status === 200);
  const oldPw = await call("/auth/v1/token?grant_type=password", { email: "pw1@example.com", password: "correct-horse" });
  const newPw = await call("/auth/v1/token?grant_type=password", { email: "pw1@example.com", password: "brand-new-horse" });
  check("password change: old refused, new accepted", oldPw.status === 400 && newPw.status === 200);
  const ref = await call("/auth/v1/token?grant_type=refresh_token", { refresh_token: "ref-pw1@example.com" });
  check("refresh token grant", ref.status === 200 && ref.data.access_token === "tok-pw1@example.com");
  const otp = await call(`/auth/v1/otp?redirect_to=${encodeURIComponent(APP + "/fa/login")}`, { email: "link1@example.com", create_user: true });
  check("magic link request ok, creates a user without a password", otp.status === 200 && (await dump()).users.some((u) => u.email === "link1@example.com" && !u.has_password));
  const noPwLogin = await call("/auth/v1/token?grant_type=password", { email: "link1@example.com", password: "whatever-pass" });
  check("link-only user cannot log in with a password until one is set", noPwLogin.status === 400);
  await admin("auth-fail?status=429");
  const rl = await call("/auth/v1/signup", { email: "pw9@example.com", password: "correct-horse" });
  await admin("auth-fail");
  check("auth-fail switch answers 429 over_request_rate_limit", rl.status === 429 && rl.data.error_code === "over_request_rate_limit", JSON.stringify(rl));

  section("REST + storage rules (mock sanity)");
  const U = await mkUser("mockrest", { profile: false });
  const svc = { apikey: SVC, "Content-Type": "application/json" };
  const noOwner = await fetch(`${MOCK}/rest/v1/listings`, { method: "POST", headers: svc, body: JSON.stringify({ board: "market", type: "sell", category: "fruit", title: "x", area: "y" }) });
  const badBoard = await fetch(`${MOCK}/rest/v1/listings`, { method: "POST", headers: svc, body: JSON.stringify({ board: "zzz", type: "sell", category: "fruit", title: "x", area: "y", owner_id: U.id }) });
  const oldCol = await fetch(`${MOCK}/rest/v1/listings`, { method: "POST", headers: svc, body: JSON.stringify({ board: "market", type: "sell", category: "fruit", title: "x", area: "y", owner_id: U.id, manage_hash: "z" }) });
  check("mock listings: insert without owner_id refused (trigger)", noOwner.status === 400);
  check("mock listings: board check and dropped columns refused", badBoard.status === 400 && oldCol.status === 400);
  for (const t of ["profiles", "listings", "rate_events"]) {
    const a = await fetch(`${MOCK}/rest/v1/${t}?select=*`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    check(`mock ${t}: anon key refused`, a.status === 401 || a.status === 403, String(a.status));
  }
  const putAv = async (size, type) => {
    const sign = await fetch(`${MOCK}/storage/v1/object/upload/sign/avatars/${U.id}/${Math.random().toString(36).slice(2, 14)}.jpg`, { method: "POST", headers: { apikey: SVC } });
    const url = MOCK + "/storage/v1" + (await sign.json()).url;
    return putObject(url, { size, type });
  };
  check("mock avatars bucket: 20 KB ok, 20 KB + 1 byte 413, png 415", (await putAv(20480, "image/jpeg")).status === 200 && (await putAv(20481, "image/jpeg")).status === 413 && (await putAv(100, "image/png")).status === 415);
}

// Same wire format as supabase-js uploadToSignedUrl: PUT, FormData with cacheControl + a file under the empty field name.
async function putObject(url, { type = "image/jpeg", size = 2000 } = {}) {
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", new Blob([new Uint8Array(size).fill(7)], { type }));
  const res = await fetch(url, { method: "PUT", body: fd });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function scenarioAuthz() {
  section("every write needs login (401), nothing is written");
  const U = await mkUser("authz");
  const before = await dump();
  const routes = [
    ["POST /api/listings", "/api/listings", bodyFor("market")],
    ["my list", "/api/my/listings", { action: "list" }],
    ["my update", "/api/my/listings", { action: "update", id: "11111111-1111-4111-8111-111111111111", fields: { title: "x" } }],
    ["my renew", "/api/my/listings", { action: "renew", id: "11111111-1111-4111-8111-111111111111" }],
    ["my delete", "/api/my/listings", { action: "delete", id: "11111111-1111-4111-8111-111111111111" }],
    ["images sign", "/api/listings/images", { listingId: "11111111-1111-4111-8111-111111111111", items: [{ ext: "jpg" }] }],
    ["profile get", "/api/profile", { action: "get" }],
    ["profile save", "/api/profile", { action: "save", fields: { firstName: "A", familyName: "B", phone: "09120000000" } }],
    ["avatar sign", "/api/profile", { action: "avatar_sign", ext: "webp" }],
  ];
  for (const [name, path, body] of routes) {
    const none = await post(path, body);
    const junk = await post(path, body, { token: "garbage" });
    const empty = await post(path, body, { token: "tok-" });
    check(`401 unauthorized without a token: ${name}`, none.status === 401 && none.data.error === "unauthorized", JSON.stringify(none));
    check(`401 unauthorized with a garbage token: ${name}`, junk.status === 401 && junk.data.error === "unauthorized" && empty.status === 401, `${junk.status}/${empty.status}`);
  }
  const after = await dump();
  check("401s wrote no listing, profile or avatar", after.listings.length === before.listings.length && after.profiles.length === before.profiles.length && after.avatars.length === before.avatars.length);
  const noHeaderEvents = after.rate_events.length - before.rate_events.length;
  check("no-token calls cost nothing: only garbage-token calls left rate events (one IP row each)", noHeaderEvents === routes.length * 2, String(noHeaderEvents));
  const withAuth = await post("/api/my/listings", { action: "list" }, { token: U.token });
  check("a valid token passes the gate", withAuth.status === 200 && withAuth.data.ok === true, JSON.stringify(withAuth));
  const gone = await post("/api/listings/manage", { code: "AAAA-AAAA-AAAA", action: "get" });
  check("old POST /api/listings/manage is gone (404)", gone.status === 404, String(gone.status));
  const oldCode = await post("/api/my/listings", { action: "get", code: "AAAA-AAAA-AAAA" }, { token: U.token });
  check("no code-based path remains on /api/my/listings", oldCode.status === 400, JSON.stringify(oldCode));
  const oldImages = await post("/api/listings/images", { code: "AAAA-AAAA-AAAA", items: [{ ext: "jpg" }] });
  check("images with a manage code and no token -> 401", oldImages.status === 401, JSON.stringify(oldImages));
}

async function scenarioProfileGate() {
  section("profile_required (403) on create / update / renew / images only");
  const N = await mkUser("noprofile", { profile: false });
  const id = "11111111-1111-4111-8111-111111111111";
  const c = await createRaw(N, bodyFor("market"));
  const u = await post("/api/my/listings", { action: "update", id, fields: { title: "x" } }, { token: N.token });
  const r = await post("/api/my/listings", { action: "renew", id }, { token: N.token });
  const im = await post("/api/listings/images", { listingId: id, items: [{ ext: "jpg" }] }, { token: N.token });
  for (const [name, x] of [["create", c], ["update", u], ["renew", r], ["images", im]]) check(`${name} without a profile: 403 profile_required`, x.status === 403 && x.data.error === "profile_required", JSON.stringify(x));
  check("nothing was created for the profile-less user", !(await dump()).listings.some((l) => l.owner_id === N.id));
  const list = await post("/api/my/listings", { action: "list" }, { token: N.token });
  const del = await post("/api/my/listings", { action: "delete", id }, { token: N.token });
  const get = await post("/api/profile", { action: "get" }, { token: N.token });
  const sign = await post("/api/profile", { action: "avatar_sign", ext: "webp" }, { token: N.token });
  const bad = await post("/api/profile", { action: "save", fields: { firstName: "" } }, { token: N.token });
  check("list without a profile: 200, empty", list.status === 200 && Array.isArray(list.data.listings) && list.data.listings.length === 0, JSON.stringify(list));
  check("delete without a profile: not blocked (404 for an unknown id)", del.status === 404, JSON.stringify(del));
  check("profile get without a row: 200 profile null", get.status === 200 && get.data.ok === true && get.data.profile === null, JSON.stringify(get));
  check("avatar_sign without a profile: 200 (pick a picture before saving)", sign.status === 200 && sign.data.ok === true, JSON.stringify(sign));
  check("profile save with an empty name: 400, not 403", bad.status === 400 && bad.data.error === "first_name_required", JSON.stringify(bad));
  const ok = await post("/api/profile", { action: "save", fields: { firstName: "Nina", familyName: "Nobody", phone: "09121112233", address: "Soh village, Main Street 4" } }, { token: N.token });
  const c2 = await createRaw(N, bodyFor("market"));
  check("after saving the profile the same user can post", ok.status === 200 && c2.status === 200, JSON.stringify([ok.data, c2.data]));
}

async function scenarioProfile() {
  section("profile: validation, phone normalisation, privacy");
  const save = (u, fields) => post("/api/profile", { action: "save", fields }, { token: u.token });
  const U = await mkUser("prof", { profile: false });
  const full = { firstName: "Ali", familyName: "Rezaei", phone: "09121234567", address: "Soh, Main Street 12, blue door" };
  const bidi = await save(await mkUser("bidi", { profile: false }), { ...full, firstName: "\u202EAli\u200B\u2066x" });
  check("profile: bidi overrides and zero-width spaces are stripped from names", bidi.status === 200 && bidi.data.profile?.firstName === "Alix", JSON.stringify(bidi));
  for (const [name, fields, err] of [
    ["no first name", { ...full, firstName: undefined }, "first_name_required"],
    ["blank first name", { ...full, firstName: "   " }, "first_name_required"],
    ["no family name", { ...full, familyName: undefined }, "family_name_required"],
    ["no phone", { ...full, phone: undefined }, "bad_phone"],
    ["no address", { ...full, address: undefined }, "address_required"],
    ["blank address", { ...full, address: "    " }, "address_required"],
    ["address too short", { ...full, address: "abcd" }, "bad_address"],
    ["address too long", { ...full, address: "a".repeat(201) }, "bad_address"],
    ["not an object", "oops", "bad_fields"],
  ]) {
    const r = await save(U, fields);
    check(`create profile: ${name} -> 400 ${err}`, r.status === 400 && r.data.error === err, JSON.stringify(r));
  }
  check("rejected saves left no row", !(await profileRow(U.id)));

  const good = [
    ["09121234567", "09121234567"], ["۰۹۱۲۱۲۳۴۵۶۷", "09121234567"], ["٠٩١٢١٢٣٤٥٦٧", "09121234567"],
    ["+98 912 123 4567", "09121234567"], ["0098-912-123-4567", "09121234567"], ["+989121234567", "09121234567"],
    ["9121234567", "09121234567"], ["0912 123 4567", "09121234567"], ["۰۹۱۲-۱۲۳-۴۵۶۷", "09121234567"], ["(0912) 123.4567", "09121234567"],
  ];
  for (const [input, want] of good) {
    const n = await mkUser("ph", { profile: false });
    const r = await save(n, { ...full, phone: input });
    check(`phone ${JSON.stringify(input)} -> ${want}`, r.status === 200 && r.data.profile?.phone === want && (await profileRow(n.id))?.phone === want, JSON.stringify(r));
  }
  for (const input of ["", "0912", "09121234", "08121234567", "091212345678", "abc", "+1 555 123 4567", "9121234567x", "0912123456٧x", 912, null, "021 1234 5678"]) {
    const n = await mkUser("badph", { profile: false });
    const r = await save(n, { ...full, phone: input });
    check(`phone ${JSON.stringify(input)} rejected (bad_phone)`, r.status === 400 && r.data.error === "bad_phone" && !(await profileRow(n.id)), JSON.stringify(r));
  }

  const r1 = await save(U, { firstName: "  Ali   Reza ", familyName: "Rezaei", phone: "09121234567", address: "  Soh,   Main Street 12 ", junk: "ignored", userId: "x", user_id: "y" });
  check("create: saved, 200 ok, names trimmed and collapsed", r1.status === 200 && r1.data.ok === true && r1.data.profile?.firstName === "Ali Reza", JSON.stringify(r1));
  check("create: Profile shape {firstName, familyName, phone, address, avatar, showOnAds, verified, role}; address trimmed and collapsed; verified false", JSON.stringify(Object.keys(r1.data.profile ?? {}).sort()) === JSON.stringify(["address","avatar","familyName","firstName","phone","role","showOnAds","verified"]) && r1.data.profile.avatar === null && r1.data.profile.showOnAds === true && r1.data.profile.address === "Soh, Main Street 12" && r1.data.profile.verified === false && r1.data.profile.role === "user", JSON.stringify(r1.data));
  const row = await profileRow(U.id);
  check("create: row belongs to the VERIFIED user (user_id from the token, not the body)", row?.user_id === U.id && row.show_on_ads === true && row.avatar === null, JSON.stringify(row));
  const long = await save(U, { firstName: "x".repeat(60) });
  check("update: name clipped to 40 characters", long.status === 200 && long.data.profile.firstName.length === 40, JSON.stringify(long.data));
  const up = await save(U, { phone: "+98 935 111 2233" });
  check("update: partial (phone only) keeps names", up.status === 200 && up.data.profile.phone === "09351112233" && up.data.profile.familyName === "Rezaei", JSON.stringify(up.data));
  const nm = await save(U, { familyName: "" });
  const ph = await save(U, { phone: "123" });
  const sh = await save(U, { showOnAds: "yes" });
  const off = await save(U, { showOnAds: false });
  check("update: empty family name / bad phone / non-boolean showOnAds refused", nm.data.error === "family_name_required" && ph.data.error === "bad_phone" && sh.data.error === "bad_fields" && sh.status === 400);
  check("update: showOnAds false saved", off.status === 200 && off.data.profile.showOnAds === false && (await profileRow(U.id)).show_on_ads === false);
  const empty = await save(U, {});
  check("update: empty fields is harmless (200, unchanged)", empty.status === 200 && empty.data.profile.phone === "09351112233", JSON.stringify(empty));
  const noFields = await post("/api/profile", { action: "save" }, { token: U.token });
  check("save without fields -> 400 bad_fields", noFields.status === 400 && noFields.data.error === "bad_fields", JSON.stringify(noFields));

  const adrUp = await save(U, { address: "Soh, New Street 7" });
  const adrBad = await save(U, { address: "abc" });
  const adrBlank = await save(U, { address: "" });
  check("update: address changed (and saved on the row)", adrUp.status === 200 && adrUp.data.profile.address === "Soh, New Street 7" && (await profileRow(U.id)).address === "Soh, New Street 7", JSON.stringify(adrUp.data));
  check("update: too short -> bad_address, blank -> address_required, row unchanged", adrBad.data.error === "bad_address" && adrBlank.data.error === "address_required" && (await profileRow(U.id)).address === "Soh, New Street 7", JSON.stringify([adrBad.data, adrBlank.data]));
  const mass = await save(U, { verified: true, verified_at: "2020-01-01T00:00:00Z", role: "admin", user_id: "x", showOnAds: true });
  const mrow = await profileRow(U.id);
  check("update: verified / role / verified_at in the body are ignored (cannot self-verify or self-promote)", mass.status === 200 && mass.data.profile.verified === false && mass.data.profile.role === "user" && mrow.verified === false && mrow.verified_at === null && mrow.role === "user", JSON.stringify([mass.data, mrow]));
  const massNew = await save(await mkUser("mass", { profile: false }), { ...full, verified: true, role: "admin", verified_at: "2020-01-01T00:00:00Z" });
  check("create: verified / role in the body are ignored too", massNew.status === 200 && massNew.data.profile.verified === false && massNew.data.profile.role === "user", JSON.stringify(massNew.data));
  const V = await mkUser("prof2", { first: "Vera", phone: "09120000042" });
  const gv = await post("/api/profile", { action: "get" }, { token: V.token });
  const gu = await post("/api/profile", { action: "get" }, { token: U.token });
  check("get returns only the caller's own profile", gv.data.profile?.firstName === "Vera" && gu.data.profile?.firstName.startsWith("x") && gv.data.profile?.phone === "09120000042", JSON.stringify([gv.data, gu.data]));
  check("get: no user id, email or other internals", !/"(user_id|owner_id|ip_hash|email)"/.test(JSON.stringify(gv.data)) && !JSON.stringify(gv.data).includes(V.email) && !JSON.stringify(gv.data).includes(V.id), JSON.stringify(gv.data));
  const badAct = await post("/api/profile", { action: "explode" }, { token: V.token });
  const badJson = await post("/api/profile", null, { token: V.token, raw: "{nope" });
  check("profile: unknown action 400, bad json 400 bad_json", badAct.status === 400 && badJson.status === 400 && badJson.data.error === "bad_json", JSON.stringify([badAct, badJson]));
  check("the phone is stored as the normalised value only (never the typed text)", !JSON.stringify((await dump()).profiles).includes("+98"));
}

async function scenarioAvatar() {
  section("avatar: sign, upload, save, swap, remove, limits");
  const objs = async (uid) => (await dump()).avatars.filter((k) => k.startsWith(uid + "/"));
  const sign = (u, ext = "webp", o = {}) => post("/api/profile", { action: "avatar_sign", ext }, { token: u.token, ...o });
  const save = (u, fields) => post("/api/profile", { action: "save", fields }, { token: u.token });
  const upload = async (u, size = 8000, type = "image/webp", ext = "webp") => {
    const s = await sign(u, ext);
    if (s.status !== 200) return { s, up: null };
    return { s, up: await putObject(s.data.upload.url, { size, type }) };
  };
  const U = await mkUser("av");
  await clearRate();
  const s = await sign(U);
  check("avatar_sign: 200 name + PUT url", s.status === 200 && s.data.ok === true && /^[a-z0-9]{12}\.webp$/.test(s.data.name) && s.data.upload?.method === "PUT", JSON.stringify(s));
  check("avatar_sign: URL points at the avatars bucket, the caller's folder, with a token", s.data.upload.url.startsWith(`${MOCK}/storage/v1/object/upload/sign/avatars/${U.id}/${s.data.name}?`) && s.data.upload.url.includes("token="), s.data.upload.url);
  const sj = await sign(U, "jpg");
  check("avatar_sign: jpg ok", sj.status === 200 && sj.data.name.endsWith(".jpg"));
  for (const ext of ["png", "gif", "", null, 5]) {
    const r = await sign(U, ext);
    check(`avatar_sign: ext ${JSON.stringify(ext)} -> 400 bad_avatar`, r.status === 400 && r.data.error === "bad_avatar", JSON.stringify(r));
  }
  const up1 = await putObject(s.data.upload.url, { size: 8000, type: "image/webp" });
  check("avatar: upload via the FormData PUT protocol", up1.status === 200, JSON.stringify(up1));
  const again = await putObject(s.data.upload.url, { size: 8000, type: "image/webp" });
  check("avatar: a signed URL cannot overwrite", again.status !== 200);
  const pub = await fetch(`${MOCK}/storage/v1/object/public/avatars/${U.id}/${s.data.name}`);
  check("avatar: public object readable without a key", pub.status === 200 && pub.headers.get("content-type") === "image/webp");
  const sv = await save(U, { avatar: s.data.name });
  check("avatar: save -> profile.avatar is the file name", sv.status === 200 && sv.data.profile.avatar === s.data.name && (await profileRow(U.id)).avatar === s.data.name, JSON.stringify(sv));
  check("avatar: the unused jpg signed earlier left no object", (await objs(U.id)).length === 1);

  const u2 = await upload(U, 9000, "image/jpeg", "jpg");
  const sw = await save(U, { avatar: u2.s.data.name });
  const left = await objs(U.id);
  check("avatar swap: new one saved, OLD object removed (one avatar per user)", sw.status === 200 && sw.data.profile.avatar === u2.s.data.name && left.length === 1 && left[0].endsWith(u2.s.data.name), JSON.stringify([sw.data, left]));
  const keep = await save(U, { firstName: "Still" });
  check("saving other fields leaves the avatar alone", keep.status === 200 && keep.data.profile.avatar === u2.s.data.name && (await objs(U.id)).length === 1);
  const rm = await save(U, { avatar: null });
  check("avatar remove (avatar:null): column null, object deleted", rm.status === 200 && rm.data.profile.avatar === null && (await profileRow(U.id)).avatar === null && (await objs(U.id)).length === 0, JSON.stringify(rm));

  section("avatar: refusals");
  const ghost = await save(U, { avatar: "abcdefghijkl.webp" });
  const badName = await save(U, { avatar: "x.png" });
  const traversal = await save(U, { avatar: "../abcdefghijkl.webp" });
  const num = await save(U, { avatar: 5 });
  check("save: name with no object -> 400 bad_avatar", ghost.status === 400 && ghost.data.error === "bad_avatar", JSON.stringify(ghost));
  check("save: malformed names -> 400 bad_avatar", [badName, traversal, num].every((x) => x.status === 400 && x.data.error === "bad_avatar"), JSON.stringify([badName.data, traversal.data, num.data]));
  const bigName = "bigbigbig001.webp", pngName = "pngpngpng001.webp", emptyName = "emptyempty01.webp";
  await admin(`put-object?${qs({ bucket: "avatars", path: `${U.id}/${bigName}`, size: 21000, type: "image/webp" })}`);
  await admin(`put-object?${qs({ bucket: "avatars", path: `${U.id}/${pngName}`, size: 3000, type: "image/png" })}`);
  await admin(`put-object?${qs({ bucket: "avatars", path: `${U.id}/${emptyName}`, size: 0, type: "image/webp" })}`);
  const big = await save(U, { avatar: bigName });
  const png = await save(U, { avatar: pngName });
  const zero = await save(U, { avatar: emptyName });
  check("save: object over 20 KB -> 400 bad_avatar (server checks size itself)", big.status === 400 && big.data.error === "bad_avatar", JSON.stringify(big));
  check("save: object that is not webp/jpeg -> 400 bad_avatar", png.status === 400 && png.data.error === "bad_avatar", JSON.stringify(png));
  check("save: empty object -> 400 bad_avatar", zero.status === 400 && zero.data.error === "bad_avatar", JSON.stringify(zero));
  check("refused saves left the profile without an avatar", (await profileRow(U.id)).avatar === null);
  const w = await mkUser("av-other");
  const theirs = await upload(w);
  const steal = await save(U, { avatar: theirs.s.data.name });
  check("save: another user's object name -> 400 bad_avatar (folders are per user)", steal.status === 400 && steal.data.error === "bad_avatar", JSON.stringify(steal));
  check("the other user's object is untouched", (await objs(w.id)).length === 1);

  section("avatar: new user, orphans, folder cap, limits");
  const N = await mkUser("av-new", { profile: false });
  const pre = await upload(N);
  const first = await save(N, { firstName: "New", familyName: "Person", phone: "09125550000", address: "Soh, Garden Lane 3", avatar: pre.s.data.name });
  check("avatar picked BEFORE the profile exists is accepted on create", first.status === 200 && first.data.profile.avatar === pre.s.data.name, JSON.stringify(first));
  const O = await mkUser("av-orph");
  const real = await upload(O);
  await admin(`put-object?${qs({ bucket: "avatars", path: `${O.id}/oldstray00001.webp`, size: 500, type: "image/webp", age_min: 60 })}`);
  await admin(`put-object?${qs({ bucket: "avatars", path: `${O.id}/younguploa01.webp`, size: 500, type: "image/webp", age_min: 0 })}`);
  await save(O, { avatar: real.s.data.name });
  const rest = (await objs(O.id)).map((k) => k.split("/")[1]).sort();
  check("save removes old unreferenced objects but keeps a young one (upload in progress)", JSON.stringify(rest) === JSON.stringify([real.s.data.name, "younguploa01.webp"].sort()), rest.join());
  const C = await mkUser("av-cap");
  for (let i = 0; i < 4; i++) await admin(`put-object?${qs({ bucket: "avatars", path: `${C.id}/capcapcap00${i}.webp`, size: 500, type: "image/webp", age_min: 0 })}`);
  const capped = await sign(C);
  check("folder cap: 4 young objects -> 400 bad_avatar", capped.status === 400 && capped.data.error === "bad_avatar", JSON.stringify(capped));
  for (let i = 0; i < 4; i++) await admin(`put-object?${qs({ bucket: "avatars", path: `${C.id}/capcapcap00${i}.webp`, size: 500, type: "image/webp", age_min: 60 })}`);
  const freed = await sign(C);
  check("folder cap: old strays are cleared, then signing works", freed.status === 200 && (await objs(C.id)).length === 0, JSON.stringify(freed) + (await objs(C.id)).length);

  const R = await mkUser("av-rl");
  await clearRate();
  const st = [];
  for (let i = 0; i < 10; i++) st.push((await sign(R)).status);
  const eleventh = await sign(R);
  check("avatar_sign: 10 per hour per user, the 11th -> 429 rate_limited", st.every((x) => x === 200) && eleventh.status === 429 && eleventh.data.error === "rate_limited", `${st.join()} ${JSON.stringify(eleventh)}`);
  const pg = await post("/api/profile", { action: "get" }, { token: R.token });
  check("avatar limit is separate from profile get", pg.status === 200);

  section("avatar on public ads");
  const P = await mkUser("av-pub", { first: "Pia", show: true });
  const pu = await upload(P);
  await save(P, { avatar: pu.s.data.name });
  const Q = await mkUser("av-hide", { first: "Quin", show: false });
  const qu = await upload(Q);
  await save(Q, { avatar: qu.s.data.name });
  const a = await mk(P, "avatar ad shown"), b = await mk(Q, "avatar ad hidden");
  await admin(`approve?id=${a}`); await admin(`approve?id=${b}`);
  const rows = await viewRows();
  const ra = rows.find((x) => x.id === a), rb = rows.find((x) => x.id === b);
  check("view: poster first name + avatar path when show_on_ads", ra?.poster_first_name === "Pia" && ra?.poster_avatar === `${P.id}/${pu.s.data.name}`, JSON.stringify(ra));
  check("view: nothing about the poster when show_on_ads is false", rb?.poster_first_name === null && rb?.poster_avatar === null, JSON.stringify(rb));
  const toggled = await save(Q, { showOnAds: true });
  const rb2 = (await viewRows()).find((x) => x.id === b);
  check("view: switching show_on_ads on shows the name at once", toggled.status === 200 && rb2?.poster_first_name === "Quin" && rb2?.poster_avatar === `${Q.id}/${qu.s.data.name}`, JSON.stringify(rb2));
}

async function scenarioCreate() {
  section("create: per-board rules");
  const U = await mkUser("cr", { phone: "09121110000" });
  const r = await create(U, { title: "Cherries", quantity: "10 kg" });
  check("create: 200 {ok:true, id}", r.status === 200 && r.data.ok === true && typeof r.data.id === "string" && r.data.id.length > 10, JSON.stringify(r));
  check("create: response has no manage code or secrets", leaks(r.data).length === 0 && Object.keys(r.data).sort().join() === "id,ok", JSON.stringify(r.data));
  const row = await rowOf(r.data.id);
  check("create: stored pending on the market board, owned by the verified user", row?.status === "pending" && row.board === "market" && row.owner_id === U.id && row.renewals === 0, JSON.stringify(row));
  check("create: ip_hash is a hash, not the address", typeof row?.ip_hash === "string" && row.ip_hash.length >= 16 && !/^\d+\.\d+\.\d+\.\d+$/.test(row.ip_hash));
  check("create: no contact typed -> the profile phone, kind phone, PRIVATE", row?.contact_kind === "phone" && row.contact_value === "09121110000" && row.contact_public === false, JSON.stringify(row));
  check("create: row has no manage_hash / poster_name columns", !("manage_hash" in row) && !("poster_name" in row));

  const own = await create(U, { title: "Own contact", contactKind: "telegram", contactValue: "@ali_soh", contactPublic: true });
  const orow = await rowOf(own.data.id);
  check("create: client contactKind / contactValue / contactPublic are IGNORED (profile phone, private)", own.status === 200 && orow.contact_kind === "phone" && orow.contact_value === "09121110000" && orow.contact_public === false, JSON.stringify(orow));
  const badKind = await create(U, { contactKind: "pigeon", contactValue: "x" });
  check("create: a bogus contactKind is ignored too (no bad_contact any more)", badKind.status === 200 && (await rowOf(badKind.data.id)).contact_value === "09121110000", JSON.stringify(badKind));
  const long = await create(U, { title: "Clip contact", contactKind: "other", contactValue: "c".repeat(200) });
  check("create: a long client contact value is ignored", (await rowOf(long.data.id)).contact_value === "09121110000");
  const NA = await mkUser("noaddr", { phone: "09121119999", address: "none" });
  const na = await create(NA, { title: "no address" });
  check("create: an old profile WITHOUT an address -> 403 profile_required, nothing stored", na.status === 403 && na.data.error === "profile_required" && !(await dump()).listings.some((l) => l.owner_id === NA.id), JSON.stringify(na));
  const naGet = await post("/api/profile", { action: "get" }, { token: NA.token });
  check("an old profile without an address can still read it: address \"\" , other fields intact", naGet.status === 200 && naGet.data.profile?.address === "" && naGet.data.profile.phone === "09121119999" && naGet.data.profile.verified === false, JSON.stringify(naGet.data));
  const naOk = await post("/api/profile", { action: "save", fields: { address: "Soh, Old Street 9" } }, { token: NA.token });
  const na2 = await create(NA, { title: "now with address" });
  check("adding the address (update) lets that person post", naOk.status === 200 && naOk.data.profile.address === "Soh, Old Street 9" && na2.status === 200, JSON.stringify([naOk.data, na2.data]));

  const noTitle = await create(U, { title: "  " });
  const badBoard = await createRaw(U, { ...bodyFor("market"), board: "zzz" });
  const noBoard = await createRaw(U, { ...bodyFor("market"), board: undefined });
  const badJson = await post("/api/listings", null, { token: U.token, raw: "{not json" });
  check("create: title_required", noTitle.status === 400 && noTitle.data.error === "title_required", JSON.stringify(noTitle));
  check("create: bad_board (unknown and missing)", badBoard.status === 400 && badBoard.data.error === "bad_board" && noBoard.data.error === "bad_board", JSON.stringify([badBoard.data, noBoard.data]));
  check("create: bad_json", badJson.status === 400 && badJson.data.error === "bad_json", JSON.stringify(badJson));
  const longRow = await rowOf((await create(U, { title: "x".repeat(300), details: "d".repeat(2000), quantity: "q".repeat(200), price: "p".repeat(200), available: "a".repeat(200), area: "r".repeat(200) })).data.id);
  check("create: clipped (title 120, details 800, quantity/price/available/area 80)", longRow.title.length === 120 && longRow.details.length === 800 && longRow.quantity.length === 80 && longRow.price.length === 80 && longRow.available.length === 80 && longRow.area.length === 80, JSON.stringify([longRow.title.length, longRow.details.length, longRow.quantity.length, longRow.area.length]));
  const noArea = await rowOf((await create(U, { title: "no area", area: "" })).data.id);
  check("create: empty area stored as an em dash", noArea.area === "—", JSON.stringify(noArea.area));

  const mass = await create(U, { title: "mass", status: "approved", owner_id: "x", ownerId: "x", ip_hash: "z", expires_at: "2099-01-01T00:00:00Z", renewals: 3, images: ["abcdefghijkl.jpg"], user_id: "x", manage_hash: "y" });
  const mrow = await rowOf(mass.data.id);
  check("create: cannot set status / owner / hash / expiry / images through the body", mass.status === 200 && mrow.status === "pending" && mrow.owner_id === U.id && mrow.ip_hash !== "z" && mrow.expires_at === null && mrow.renewals === 0 && mrow.images.length === 0, JSON.stringify(mrow));
  const honey = await create(U, { title: "stale client", website: "http://spam.example", openedMs: 100 });
  check("create: honeypot / openedMs fields are ignored (no too_fast, not dropped)", honey.status === 200 && !!(await rowOf(honey.data.id)), JSON.stringify(honey));

  section("create: types and categories per board");
  const allowed = { market: ["sell", "need"], careers: ["seeking", "hiring"], needs: ["need", "offer"], property: ["sell", "rent", "need"] };
  const refused = { market: ["service", "hiring", "seeking", "offer", "rent", "zzz"], careers: ["sell", "need", "service", "offer", "rent"], needs: ["sell", "hiring", "service", "rent"], property: ["offer", "hiring", "seeking", "service", ""] };
  for (const board of BOARDS) {
    for (const type of allowed[board]) {
      const x = await create(U, { board, type, title: `${board}-${type}` });
      check(`${board}: type ${type} accepted`, x.status === 200 && (await rowOf(x.data.id))?.board === board, JSON.stringify(x));
    }
    for (const type of refused[board]) {
      const x = await create(U, { board, type });
      check(`${board}: type ${JSON.stringify(type)} refused (bad_type)`, x.status === 400 && x.data.error === "bad_type", JSON.stringify(x));
    }
  }
  const cats = { market: [["other", true], ["nuts", true], ["farm", false], ["craft", false], ["house", false]], careers: [["farm", true], ["craft", true], ["crafts", false], ["fruit", false], ["house", false]], needs: [["stay", true], ["guide", true], ["fruit", false], ["house", false]], property: [["orchard", true], ["shop", true], ["fruit", false], ["farm", false]] };
  for (const board of BOARDS) {
    for (const [category, ok] of cats[board]) {
      const x = await create(U, { board, category, title: `${board}-${category}` });
      check(`${board}: category ${category} ${ok ? "accepted" : "refused (bad_category)"}`, ok ? x.status === 200 : x.status === 400 && x.data.error === "bad_category", JSON.stringify(x));
    }
  }
  const cr = await rowOf((await create(U, { board: "careers", quantity: "part", title: "arrangement stored" })).data.id);
  check("careers: arrangement code stored in quantity", cr.quantity === "part" && cr.board === "careers", JSON.stringify(cr));
  for (const bad of [undefined, "", "weekly", "Seasonal", "x".repeat(90)]) {
    const x = await create(U, { board: "careers", quantity: bad });
    check(`careers: quantity ${JSON.stringify(bad)?.slice(0, 20)} -> bad_arrangement`, x.status === 400 && x.data.error === "bad_arrangement", JSON.stringify(x));
  }
  for (const code of ["seasonal", "part", "full", "once"]) check(`careers: arrangement ${code} accepted`, (await create(U, { board: "careers", quantity: code, title: "c-" + code })).status === 200);
  const marketQ = await create(U, { board: "market", quantity: "anything goes here" });
  const propQ = await rowOf((await create(U, { board: "property", quantity: "2000 m2", available: "full title", title: "prop facts" })).data.id);
  check("other boards take free text in quantity (no arrangement rule)", marketQ.status === 200 && propQ.quantity === "2000 m2" && propQ.available === "full title");

  section("create: rate limits (per user AND per IP)");
  const R = await mkUser("rl");
  const R2 = await mkUser("rl2");
  await clearRate();
  const sts = [];
  for (let i = 0; i < 6; i++) sts.push((await post("/api/listings", bodyFor("market", { title: "RL" + i }), { token: R.token })).status);
  const seventh = await post("/api/listings", bodyFor("market", { title: "RL7" }), { token: R.token });
  check("per-user: 6 posts per hour succeed (each from a different IP)", sts.every((x) => x === 200), sts.join());
  check("per-user: the 7th -> 429 rate_limited even from a fresh IP", seventh.status === 429 && seventh.data.error === "rate_limited", JSON.stringify(seventh));
  check("per-user: another user is unaffected", (await post("/api/listings", bodyFor("market", { title: "other" }), { token: R2.token })).status === 200);
  const ev = (await dump()).rate_events.filter((e) => e.kind === "post" && e.user_id === R.id);
  check("rate_events: user rows carry user_id + hashed ip; the refused 7th call wrote nothing", ev.length === 6 && ev.every((e) => e.ip_hash.length > 8 && !/\./.test(e.ip_hash)), JSON.stringify(ev.slice(0, 1)));
  check("rate limit is only counted for the same kind (list still works)", (await post("/api/my/listings", { action: "list" }, { token: R.token })).status === 200);

  const ip = "7.7.7.7";
  await clearRate();
  const g = [];
  for (let i = 0; i < 30; i++) g.push((await post("/api/listings", bodyFor("market"), { token: "garbage", ip })).status);
  const g31 = await post("/api/listings", bodyFor("market"), { token: "garbage", ip });
  const valid = await post("/api/listings", bodyFor("market", { title: "same ip" }), { token: R2.token, ip });
  check("per-IP: 30 attempts per hour answered (401 for a bad token)", g.every((x) => x === 401), g.join());
  check("per-IP: the 31st -> 429, checked BEFORE the token (a valid token from that IP also 429)", g31.status === 429 && valid.status === 429, `${g31.status}/${valid.status}`);
  check("per-IP: another IP still fine", (await post("/api/listings", bodyFor("market", { title: "other ip" }), { token: R2.token })).status === 200);
  const evIp = (await dump()).rate_events.filter((e) => e.kind === "post" && e.user_id === null);
  check("per-IP rows have no user id and a hashed address; refused calls add none beyond the limit", evIp.length >= 30 && evIp.length <= 33 && evIp.every((e) => e.ip_hash !== ip && e.ip_hash.length > 8));

  await clearRate();
  const m = [];
  for (let i = 0; i < 60; i++) m.push((await post("/api/my/listings", { action: "list" }, { token: R.token })).status);
  const m61 = await post("/api/my/listings", { action: "list" }, { token: R.token });
  check("manage kind: 60 per hour per user, the 61st -> 429", m.every((x) => x === 200) && m61.status === 429 && m61.data.error === "rate_limited", `${m.filter((x) => x !== 200).join()} ${m61.status}`);
  await clearRate();
  const pr = [];
  for (let i = 0; i < 120; i++) pr.push((await post("/api/profile", { action: "get" }, { token: R.token })).status);
  const pr31 = await post("/api/profile", { action: "get" }, { token: R.token });
  check("profile kind: 120 per hour per user, the 121st -> 429", pr.every((x) => x === 200) && pr31.status === 429, `${pr.filter((x) => x !== 200).join()} ${pr31.status}`);
}

async function scenarioMy() {
  section("my ads: ownership, update, renew, delete");
  const A = await mkUser("alice"), B = await mkUser("bob");
  const a1 = await mk(A, "A one"), a2 = await mk(A, "A two", { category: "bread" }), b1 = await mk(B, "B one");
  const a3 = await mk(A, "A careers", { board: "careers", type: "seeking", category: "farm", quantity: "full" });
  const list = await post("/api/my/listings", { action: "list" }, { token: A.token });
  const titles = (list.data.listings ?? []).map((l) => l.title);
  check("list: only own ads, from every board", list.status === 200 && list.data.ok === true && ["A one", "A two", "A careers"].every((t) => titles.includes(t)) && !titles.includes("B one"), JSON.stringify(titles));
  check("list: newest first", titles.indexOf("A careers") < titles.indexOf("A two") && titles.indexOf("A two") < titles.indexOf("A one"), titles.join());
  const own = list.data.listings.find((l) => l.id === a3);
  const OWN_KEYS = ["id", "board", "type", "category", "title", "quantity", "price", "area", "available", "details", "contactKind", "contactValue", "contactPublic", "status", "createdAt", "expiresAt", "renewals", "images"];
  check("list: OwnListing shape, no secrets", OWN_KEYS.every((k) => k in own) && own.board === "careers" && own.status === "pending" && leaks(list.data).length === 0, Object.keys(own).join());
  const lb = await post("/api/my/listings", { action: "list" }, { token: B.token });
  check("list: another user sees only theirs", lb.data.listings.length === 1 && lb.data.listings[0].id === b1);

  const u = await post("/api/my/listings", { action: "update", id: a1, fields: { title: "A one edited", price: "55" } }, { token: A.token });
  check("update: owner ok, untouched fields kept", u.status === 200 && u.data.ok === true && u.data.listing.title === "A one edited" && u.data.listing.price === "55" && u.data.listing.area === "Soh", JSON.stringify(u));
  check("update: no secrets in the response", leaks(u.data).length === 0);
  const cu = await post("/api/my/listings", { action: "update", id: a1, fields: { contactKind: "telegram", contactValue: "@evil", contactPublic: true, title: "A one edited" } }, { token: A.token });
  const cur = await rowOf(a1);
  check("update: contact fields from the client are ignored (stay phone / profile phone / private)", cu.status === 200 && cur.contact_kind === "phone" && cur.contact_value === "09120000000" && cur.contact_public === false, JSON.stringify(cur));
  await admin(`set-profile?${qs({ email: A.email, field: "address", value: "null" })}`);
  const noAdr = await post("/api/my/listings", { action: "update", id: a1, fields: { title: "blocked" } }, { token: A.token });
  const noAdrRenew = await post("/api/my/listings", { action: "renew", id: a1 }, { token: A.token });
  const noAdrList = await post("/api/my/listings", { action: "list" }, { token: A.token });
  await admin(`set-profile?${qs({ email: A.email, field: "address", value: "Soh, Test Street 1" })}`);
  check("update / renew with a profile that lost its address -> 403 profile_required; list still works", noAdr.status === 403 && noAdr.data.error === "profile_required" && noAdrRenew.status === 403 && noAdrList.status === 200, JSON.stringify([noAdr, noAdrRenew]));
  await admin(`approve?id=${a1}`);
  const u2 = await post("/api/my/listings", { action: "update", id: a1, fields: { title: "A one again" } }, { token: A.token });
  check("update: an approved ad goes back to pending", u2.data.listing?.status === "pending" && (await rowOf(a1)).status === "pending", JSON.stringify(u2));
  check("update: the edited ad vanished from the public view", !(await viewRows()).some((r) => r.id === a1));
  const ux = await post("/api/my/listings", { action: "update", id: a1, fields: { title: "hijack" } }, { token: B.token });
  const rx = await post("/api/my/listings", { action: "renew", id: a1 }, { token: B.token });
  const dx = await post("/api/my/listings", { action: "delete", id: a1 }, { token: B.token });
  check("another user: update / renew / delete -> 404 not_found", [ux, rx, dx].every((x) => x.status === 404 && x.data.error === "not_found"), JSON.stringify([ux.data, rx.data, dx.data]));
  check("another user changed nothing", (await rowOf(a1)).title === "A one again" && (await rowOf(a1)).status === "pending");
  await admin(`set?id=${a2}&field=owner_id&value=null`);
  const orphan = await post("/api/my/listings", { action: "delete", id: a2 }, { token: A.token });
  check("an ownerless legacy row is not deletable by anyone", orphan.status === 404, JSON.stringify(orphan));
  await admin(`set?id=${a2}&field=owner_id&value=${A.id}`);

  const bad = await post("/api/my/listings", { action: "update", id: a2, fields: { type: "zzz" } }, { token: A.token });
  const badC = await post("/api/my/listings", { action: "update", id: a2, fields: { category: "zzz" } }, { token: A.token });
  const empty = await post("/api/my/listings", { action: "update", id: a2, fields: { title: "" } }, { token: A.token });
  const noFields = await post("/api/my/listings", { action: "update", id: a2 }, { token: A.token });
  check("update: bad_type / bad_category / title_required / missing fields", bad.data.error === "bad_type" && badC.data.error === "bad_category" && empty.data.error === "title_required" && noFields.status === 400, JSON.stringify([bad.data, badC.data, empty.data, noFields.data]));
  const cType = await post("/api/my/listings", { action: "update", id: a3, fields: { type: "sell" } }, { token: A.token });
  const cType2 = await post("/api/my/listings", { action: "update", id: a3, fields: { type: "hiring", category: "tourism" } }, { token: A.token });
  const cCat = await post("/api/my/listings", { action: "update", id: a3, fields: { category: "fruit" } }, { token: A.token });
  const cArr = await post("/api/my/listings", { action: "update", id: a3, fields: { quantity: "weekly" } }, { token: A.token });
  check("update validates against the ROW's board (careers: sell and fruit refused, hiring and tourism ok)", cType.data.error === "bad_type" && cType2.status === 200 && cType2.data.listing.type === "hiring" && cCat.data.error === "bad_category", JSON.stringify([cType.data, cType2.data.error, cCat.data]));
  check("update: careers arrangement is still validated", cArr.status === 400 && cArr.data.error === "bad_arrangement", JSON.stringify(cArr));
  const boardSwap = await post("/api/my/listings", { action: "update", id: a3, fields: { board: "property", title: "still careers" } }, { token: A.token });
  check("update: board in fields is ignored", boardSwap.status === 200 && (await rowOf(a3)).board === "careers", JSON.stringify(boardSwap));
  await admin(`set?id=${a1}&field=type&value=service`);
  const legacyKeep = await post("/api/my/listings", { action: "update", id: a1, fields: { title: "legacy type kept", type: "service" } }, { token: A.token });
  const legacyMove = await post("/api/my/listings", { action: "update", id: a1, fields: { type: "hiring" } }, { token: A.token });
  check("update: an older type already on the row stays allowed, switching to a foreign one does not", legacyKeep.status === 200 && legacyKeep.data.listing.type === "service" && legacyMove.data.error === "bad_type", JSON.stringify([legacyKeep.data.error, legacyMove.data]));
  await post("/api/my/listings", { action: "update", id: a1, fields: { status: "approved", owner_id: "x", ip_hash: "z", expires_at: "2099-01-01T00:00:00Z", renewals: 0, user_id: "q" } }, { token: A.token });
  const srow = await rowOf(a1);
  check("update: cannot set status / owner / hash / expiry through fields", srow.status === "pending" && srow.owner_id === A.id && srow.ip_hash !== "z" && srow.expires_at !== "2099-01-01T00:00:00Z", JSON.stringify(srow));
  await post("/api/my/listings", { action: "update", id: a1, fields: { details: "q".repeat(1500) } }, { token: A.token });
  check("update: details clipped to 800", (await rowOf(a1)).details.length === 800);
  for (const st of ["rejected", "removed"]) {
    const x = await mk(A, "NE " + st);
    await admin(`set?id=${x}&field=status&value=${st}`);
    const r = await post("/api/my/listings", { action: "update", id: x, fields: { title: "x" } }, { token: A.token });
    check(`update: ${st} -> 409 not_editable`, r.status === 409 && r.data.error === "not_editable", JSON.stringify(r));
  }
  const malformed = await post("/api/my/listings", { action: "update", id: "not-a-uuid", fields: {} }, { token: A.token });
  const missing = await post("/api/my/listings", { action: "update", id: "11111111-1111-4111-8111-111111111111", fields: { title: "x" } }, { token: A.token });
  const nuke = await post("/api/my/listings", { action: "nuke" }, { token: A.token });
  check("malformed id and unknown id -> 404, unknown action -> 400", malformed.status === 404 && missing.status === 404 && nuke.status === 400, `${malformed.status}/${missing.status}/${nuke.status}`);

  section("my ads: renew rules");
  const renew = (u, id) => post("/api/my/listings", { action: "renew", id }, { token: u.token });
  const rp = await renew(A, a3);
  check("renew: pending -> 409 cannot_renew", rp.status === 409 && rp.data.error === "cannot_renew", JSON.stringify(rp));
  const early = await mk(A, "renew-early"); await admin(`approve?id=${early}`);
  const re = await renew(A, early);
  check("renew: 30 days left -> 409, row untouched", re.status === 409 && (await rowOf(early)).renewals === 0, JSON.stringify(re));
  const eight = await mk(A, "renew-8d"); await admin(`approve?id=${eight}&expires_in_days=8`);
  check("renew: 8 days left still too early", (await renew(A, eight)).status === 409);
  const soon = await mk(A, "renew-soon"); await admin(`approve?id=${soon}&expires_in_days=5`);
  const rs = await renew(A, soon);
  check("renew: within 7 days ok, about now + 30 days, renewals 1, still approved", rs.status === 200 && rs.data.ok === true && Math.abs(Date.parse(rs.data.listing?.expiresAt ?? "") - (Date.now() + 30 * 86400000)) < 5 * 60000 && rs.data.listing.renewals === 1 && rs.data.listing.status === "approved", JSON.stringify(rs));
  check("renew: right after renewing is too early", (await renew(A, soon)).status === 409);
  const gone = await mk(A, "renew-expired"); await admin(`approve?id=${gone}&expires_in_days=-1`);
  check("renew: already expired ok", (await renew(A, gone)).status === 200);
  const noexp = await mk(A, "renew-null-expiry"); await admin(`approve?id=${noexp}`); await admin(`set?id=${noexp}&field=expires_at&value=null`);
  check("renew: null expires_at ok", (await renew(A, noexp)).status === 200);
  const max = await mk(A, "renew-max"); const stat = [];
  await admin(`approve?id=${max}&expires_in_days=1&renewals=0`);
  for (let i = 0; i < 4; i++) { stat.push((await renew(A, max)).status); await admin(`set?id=${max}&field=expires_at&value=${encodeURIComponent(new Date(Date.now() + 86400000).toISOString())}`); }
  const fifth = await renew(A, max);
  check("renew: four renewals allowed, the 5th refused, renewals stays 4", stat.every((s) => s === 200) && fifth.status === 409 && (await rowOf(max)).renewals === 4, stat.join() + JSON.stringify(fifth));
  const old = await mk(A, "renew too late"); await admin(`approve?id=${old}&expires_in_days=-20`);
  const rOld = await renew(A, old);
  check("renew: 20 days after expiry -> 409 (photos are swept at 14)", rOld.status === 409 && rOld.data.error === "cannot_renew", JSON.stringify(rOld));

  section("my ads: delete");
  const del = await mk(A, "to-delete"); await admin(`approve?id=${del}`);
  const d = await post("/api/my/listings", { action: "delete", id: del }, { token: A.token });
  check("delete: ok, status removed, gone from the public view", d.status === 200 && d.data.ok === true && (await rowOf(del)).status === "removed" && !(await viewRows()).some((r) => r.id === del), JSON.stringify(d));
  check("delete: removed rows are not listed any more", !(await post("/api/my/listings", { action: "list" }, { token: A.token })).data.listings.some((l) => l.id === del));
  const du = await post("/api/my/listings", { action: "update", id: del, fields: { title: "zombie" } }, { token: A.token });
  check("delete: update afterwards 409 not_editable, renew 409, repeat delete harmless", du.data.error === "not_editable" && (await renew(A, del)).status === 409 && (await post("/api/my/listings", { action: "delete", id: del }, { token: A.token })).status === 200, JSON.stringify(du));
  check("my: stray b1 still intact", (await rowOf(b1)).status === "pending");
}

async function scenarioReveal() {
  section("reveal: POST /api/listings/contact (Show phone), address privacy");
  const reveal = (id, o = {}) => post("/api/listings/contact", { id }, o);
  const U = await mkUser("rv", { first: "Rana", family: "Revealfamily", phone: "09128889900", address: "Address-Private-88 Hill Road" });
  const mkA = async (title) => { const id = await mk(U, title); await admin(`approve?id=${id}`); return id; };
  const id = await mkA("rv-approved");
  const r = await reveal(id);
  check("reveal: approved ad -> 200 {ok:true, contact:{kind:'phone', value: profile phone}} and NOTHING else", r.status === 200 && JSON.stringify(r.data) === JSON.stringify({ ok: true, contact: { kind: "phone", value: "09128889900" } }), JSON.stringify(r));
  const raw = await fetch(APP + "/api/listings/contact", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": freshIp() }, body: JSON.stringify({ id }) });
  check("reveal: Cache-Control no-store, no login needed", (raw.headers.get("cache-control") ?? "").includes("no-store") && raw.status === 200);
  const rt = JSON.stringify(r.data);
  check("reveal: no address, family name, email, owner id in the answer", !rt.includes("Address-Private") && !rt.includes("Revealfamily") && !rt.includes("example.com") && !rt.includes(U.id));

  await admin(`set-profile?${qs({ email: U.email, field: "phone", value: "09357776655" })}`);
  const r2 = await reveal(id);
  check("reveal: follows the CURRENT profile phone (single source of truth)", r2.status === 200 && r2.data.contact.value === "09357776655" && (await rowOf(id)).contact_value === "09128889900", JSON.stringify(r2));
  const viaSave = await post("/api/profile", { action: "save", fields: { phone: "09121230000" } }, { token: U.token });
  check("reveal: after the owner changes the phone in the profile", viaSave.status === 200 && (await reveal(id)).data.contact?.value === "09121230000");

  const pend = await mk(U, "rv-pending");
  const rej = await mk(U, "rv-rejected"); await admin(`set?id=${rej}&field=status&value=rejected`);
  const rem = await mk(U, "rv-removed"); await admin(`approve?id=${rem}`); await admin(`set?id=${rem}&field=status&value=removed`);
  const exp = await mk(U, "rv-expired"); await admin(`approve?id=${exp}&expires_in_days=-2`);
  const ghost = "22222222-2222-4222-8222-222222222222";
  for (const [name, x] of [["pending", pend], ["rejected", rej], ["removed", rem], ["expired", exp], ["unknown", ghost], ["not a uuid", "nope"], ["sql-ish", "1' or '1'='1"], ["number", 5], ["missing", undefined]]) {
    const q = await reveal(x);
    check(`reveal: ${name} id -> 404 not_found, no phone`, q.status === 404 && JSON.stringify(q.data) === JSON.stringify({ error: "not_found" }), JSON.stringify(q));
  }
  const bj = await post("/api/listings/contact", null, { raw: "{nope" });
  check("reveal: bad JSON -> 400 bad_json", bj.status === 400 && bj.data.error === "bad_json", JSON.stringify(bj));

  // an ad whose owner has no profile row any more falls back to the row's stored phone
  const orphan = await mkA("rv-orphan");
  await admin(`set?id=${orphan}&field=owner_id&value=${(await mkUser("rv-np", { profile: false })).id}`);
  const ro = await reveal(orphan);
  check("reveal: owner without a profile -> falls back to the phone stored on the row", ro.status === 200 && ro.data.contact?.value === "09121230000", JSON.stringify(ro));
  await admin(`set?id=${orphan}&field=contact_value&value=null`);
  const ro2 = await reveal(orphan);
  check("reveal: neither profile nor stored phone -> 404", ro2.status === 404, JSON.stringify(ro2));

  // privacy sweep: nothing public carries the phone or the address
  const created = await create(U, { title: "rv-sweep" });
  const publicJson = JSON.stringify([await viewRows(), created.data, (await view("*", "&limit=500")).status]);
  check("public view + create response never contain the phone or the address", !publicJson.includes("09121230000") && !publicJson.includes("09128889900") && !publicJson.includes("Address-Private-88"), "leak");
  check("the address exists only in profiles (not copied to any listing row)", !JSON.stringify((await dump()).listings).includes("Address-Private-88"));

  // rate limit per IP (kind reveal)
  await clearRate();
  const ip = "10.77.7.7";
  const codes = [];
  for (let i = 0; i < 300; i++) codes.push((await reveal(id, { ip })).status);
  const over = await reveal(id, { ip });
  const other = await reveal(id, { ip: "10.77.7.8" });
  check("reveal: 300 per hour per IP, the 301st -> 429 rate_limited; another IP is fine", codes.every((c) => c === 200) && over.status === 429 && over.data.error === "rate_limited" && other.status === 200, `${codes.filter((c) => c !== 200).length} ${over.status} ${other.status}`);
  const ev = (await dump()).rate_events.filter((e) => e.kind === "reveal");
  check("reveal: rate rows carry a hashed IP, no user id", ev.length >= 300 && ev.every((e) => e.user_id === null && e.ip_hash !== ip && e.ip_hash.length > 8));
  const bad = await reveal(ghost, { ip });
  check("reveal: rate limited before anything else (429 even for unknown ids)", bad.status === 429, JSON.stringify(bad));
  await clearRate();
}

async function scenarioPublicView() {
  section("public view: boards and privacy matrix");
  const U1 = await mkUser("pv1", { first: "Maryam", family: "Secretfamily", phone: "09127654321", avatar: "abcdefghijkl.jpg", show: true, address: "Address-Private-77 Lane" });
  const U2 = await mkUser("pv2", { first: "Hidden", family: "Secretfamily2", phone: "09127654322", show: false });
  const U3 = await mkUser("pv3", { profile: false });
  const mkApproved = async (u, title, over = {}) => { const id = await mk(u, title, over); await admin(`approve?id=${id}`); return id; };
  const hidden = await mkApproved(U1, "view-hidden-contact", { contactPublic: false, contactValue: "SECRET-HIDDEN" });
  const defaultPrivate = await mkApproved(U1, "view-default-private");
  const shown = await mkApproved(U1, "view-shown-contact", { contactPublic: true, contactValue: "SHOWN-123" });
  const noName = await mkApproved(U2, "view-no-name");
  const noProfile = await mkApproved(U2, "view-no-profile");
  await admin(`set?id=${noProfile}&field=owner_id&value=${U3.id}`);
  const pend = await mk(U1, "view-pending", { contactPublic: true });
  const exp = await mk(U1, "view-expired"); await admin(`approve?id=${exp}&expires_in_days=-2`);
  const perBoard = {};
  for (const board of BOARDS) perBoard[board] = await mkApproved(U1, `view-board-${board}`, { board });

  const res = await view("*");
  const rows = await res.json();
  const byTitle = Object.fromEntries(rows.map((r) => [r.title, r]));
  check("view: anon can read it", res.status === 200 && Array.isArray(rows));
  check("view: approved rows listed; pending and expired not", !!byTitle["view-hidden-contact"] && !byTitle["view-pending"] && !byTitle["view-expired"]);
  check("view: every row has exactly the 18 public keys", rows.every((r) => JSON.stringify(Object.keys(r).sort()) === JSON.stringify(PUBLIC_KEYS)), Object.keys(rows[0] ?? {}).sort().join());
  check("view: contact_kind / contact_value are ALWAYS null (even for rows with contact_public = true)", rows.every((r) => r.contact_kind === null && r.contact_value === null));
  await admin(`set?id=${shown}&field=contact_public&value=true`);
  await admin(`set?id=${shown}&field=contact_value&value=SHOWN-123`);
  check("view: still null after forcing contact_public = true on the row", (await viewRows()).find((r) => r.title === "view-shown-contact")?.contact_value === null);
  check("view: poster_verified false by default, true after an admin verifies the profile", byTitle["view-hidden-contact"].poster_verified === false && byTitle["view-no-profile"].poster_verified === false && (await (async () => { await admin(`set-profile?${qs({ email: U1.email, field: "verified", value: "true" })}`); const r = (await viewRows()).find((x) => x.title === "view-hidden-contact"); await admin(`set-profile?${qs({ email: U1.email, field: "verified", value: "false" })}`); return r.poster_verified === true; })()));
  const all = JSON.stringify(rows);
  check("view: no phone, family name, email or hidden contact anywhere in the JSON", !all.includes("09127654321") && !all.includes("09127654322") && !all.includes("Secretfamily") && !all.includes("example.com") && !all.includes("SECRET-HIDDEN") && !all.includes("Address-Private-77"), "found a private value");
  const badKeys = [...FORBIDDEN, "first_name", "phone", "status", "renewals", "updated_at", "show_on_ads", "email", "address", "verified"].filter((k) => all.includes(`"${k}":`));
  check("view: no forbidden keys", badKeys.length === 0, badKeys.join());
  const noAvatars = JSON.stringify(rows.map((r) => ({ ...r, poster_avatar: null })));
  check("view: owner uuids are never exposed except inside a poster_avatar path", !noAvatars.includes(U1.id) && !noAvatars.includes(U2.id) && !noAvatars.includes(U3.id));
  check("view: poster first name + avatar path from the profile", byTitle["view-hidden-contact"].poster_first_name === "Maryam" && byTitle["view-hidden-contact"].poster_avatar === `${U1.id}/abcdefghijkl.jpg`, JSON.stringify(byTitle["view-hidden-contact"]));
  check("view: no poster when show_on_ads is false or the owner has no profile", byTitle["view-no-name"].poster_first_name === null && byTitle["view-no-name"].poster_avatar === null && byTitle["view-no-profile"].poster_first_name === null && byTitle["view-no-profile"].poster_avatar === null);
  check("view: profile without an avatar -> poster_avatar null", (await viewRows()).find((r) => r.title === "view-hidden-contact").poster_avatar !== null && (await (async () => { await admin(`set-profile?${qs({ email: U1.email, field: "avatar", value: "null" })}`); const r = (await viewRows()).find((x) => x.title === "view-hidden-contact"); await admin(`set-profile?${qs({ email: U1.email, field: "avatar", value: "abcdefghijkl.jpg" })}`); return r.poster_avatar === null && r.poster_first_name === "Maryam"; })()));

  for (const board of BOARDS) {
    const r = await viewRows(`&board=eq.${board}`);
    check(`view: board=eq.${board} returns only ${board} rows (and the new one)`, r.length > 0 && r.every((x) => x.board === board) && r.some((x) => x.id === perBoard[board]), `${r.length} rows`);
  }
  const ordered = await viewRows("&board=eq.market&order=created_at.desc&limit=200");
  check("view: order=created_at.desc&limit works with the board filter", ordered.length > 0 && ordered.every((x, i) => i === 0 || ordered[i - 1].created_at >= x.created_at));
  check("view: legacy rows without a board read as market", rows.every((r) => BOARDS.includes(r.board)));

  for (const col of ["owner_id", "family_name", "phone", "address", "verified", "first_name", "status", "ip_hash", "user_id", "email", "show_on_ads", "updated_at", "renewals"]) {
    const r = await view(col);
    check(`view: selecting ${col} is refused (the column does not exist on the view)`, r.status === 400, String(r.status));
  }
  for (const t of ["listings", "profiles", "rate_events"]) {
    const a = await fetch(`${MOCK}/rest/v1/${t}?select=*`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    const b = await fetch(`${MOCK}/rest/v1/${t}?select=*`, { headers: { apikey: ANON, Authorization: `Bearer tok-${U1.email}` } });
    const c = await fetch(`${MOCK}/rest/v1/${t}?select=*`);
    check(`base table ${t}: anon key, a user token and no key are all refused`, [a, b, c].every((x) => x.status === 401 || x.status === 403), `${a.status}/${b.status}/${c.status}`);
  }

  section("sql files");
  const sql = readFileSync(join(ROOT, "database/supabase-listings.sql"), "utf8");
  const mig = readFileSync(join(ROOT, "database/migrations/005-accounts-boards.sql"), "utf8");
  const noComments = (t) => t.replace(/--.*$/gm, "").replace(/\s+/g, " ");
  for (const [name, text] of [["supabase-listings.sql", sql], ["migration 005", mig]]) {
    const code = noComments(text);
    const viewStmt = code.slice(code.indexOf("create or replace view public.public_listings")).split(";")[0];
    const select = viewStmt.replace(/case when p\.show_on_ads and p\.avatar is not null then l\.owner_id::text \|\| '\/' \|\| p\.avatar end as poster_avatar/, "");
    check(`${name}: view has no select * and names its columns`, !/select\s+\*/i.test(viewStmt) && !/\b\w+\.\*/.test(viewStmt));
    check(`${name}: view never touches ip_hash, manage_hash, poster_name, phone, family_name, status/renewals columns, or owner_id outside poster_avatar`, !/(ip_hash|manage_hash|poster_name|\bphone\b|family_name|renewals|updated_at)/.test(select) && !/owner_id/.test(select.replace(/left join public\.profiles p on p\.user_id = l\.owner_id/, "")), select);
    check(`${name}: view exposes board, poster_first_name, poster_avatar and filters approved + unexpired`, /l\.board/.test(viewStmt) && /poster_first_name/.test(viewStmt) && /poster_avatar/.test(viewStmt) && /status\s*=\s*'approved'/.test(viewStmt) && /expires_at/.test(viewStmt));
    check(`${name}: profile columns only via show_on_ads`, /case when p\.show_on_ads then p\.first_name end as poster_first_name/.test(viewStmt) && [...viewStmt.matchAll(/\bp\.(\w+)/g)].every((m) => ["show_on_ads", "first_name", "avatar", "user_id"].includes(m[1])));
    check(`${name}: profiles table with the checks`, /create table if not exists public\.profiles/.test(code) && /phone\s+text not null check \(phone ~ '\^09\[0-9\]\{9\}\$'\)/.test(code) && /show_on_ads\s+boolean not null default true/.test(code) && /references auth\.users \(id\) on delete cascade/.test(code));
    check(`${name}: profiles RLS on, revoked from anon/authenticated, EXPLICIT grant to service_role`, /alter table public\.profiles enable row level security/.test(code) && /revoke all on public\.profiles from anon, authenticated/.test(code) && /grant all on public\.profiles to service_role/.test(code));
    check(`${name}: listings + rate_events keep RLS, revoke and service_role grants`, /grant all on public\.listings\s+to service_role/.test(code) && /grant all on public\.rate_events\s+to service_role/.test(code) && /grant usage on schema public to service_role/.test(code) && /grant all on all sequences in schema public to service_role/.test(code));
    check(`${name}: avatars bucket public, 20480 bytes, webp + jpeg, and NO storage policies`, /'avatars', 'avatars', true/.test(code) && /20480/.test(code) && /image\/webp/.test(code) && /image\/jpeg/.test(code) && !/create policy/i.test(code));
    check(`${name}: board column + check, types incl. offer and rent`, /board text not null default 'market'/.test(code) && /check \(board in \('market', ?'careers', ?'needs', ?'property'\)\)/.test(code) && /'offer'/.test(code) && /'rent'/.test(code));
    check(`${name}: owner trigger, rate_events.user_id`, /listing_require_owner/.test(code) && /user_id uuid/.test(code) && /rate_events_user_idx/.test(code));
    check(`${name}: manage_hash and poster_name are dropped`, /drop column if exists manage_hash/.test(code) && /drop column if exists poster_name/.test(code));
  }
  {
    const c8 = noComments(readFileSync(join(ROOT, "database/migrations/008-address-verified-contact.sql"), "utf8"));
    const v8 = c8.slice(c8.indexOf("create or replace view public.public_listings")).split(";")[0];
    check("migration 008: view nulls contact_kind/contact_value and adds poster_verified", /null::text as contact_kind/.test(v8) && /null::text as contact_value/.test(v8) && /poster_verified/.test(v8));
    check("migration 008: view selects no l.contact_*, no address", !/l\.contact_(kind|value)/.test(v8) && !/address/.test(v8), v8);
  }
  check("sql: the fresh-install file does not create manage_hash / poster_name / manage_code", !/create table[^;]*(manage_hash|poster_name)/s.test(noComments(sql)) && !/manage_code\s/i.test(noComments(sql)));
  check("sql: the fresh-install file creates listings.board and profiles itself (complete end state)", /create table if not exists public\.listings/.test(sql) && /board/.test(sql.slice(sql.indexOf("create table if not exists public.listings"), sql.indexOf("create table if not exists public.listings") + 1500)));
  check("sql: images column, cap 10, listing-images bucket 614400, no storage.objects policies", /images\s+text\[\]\s+not null default '\{\}'/.test(sql) && /cardinality\(images\)\s*<=\s*10/.test(sql) && /'listing-images', 'listing-images', true/.test(sql) && /614400/.test(sql) && !/create policy/i.test(sql));
  for (const f of ["002-manage-codes-and-login.sql", "003-listing-images.sql", "004-service-role-grants.sql", "005-accounts-boards.sql"]) check(`migration ${f} exists`, existsSync(join(ROOT, "database/migrations", f)));
}

// ---------- photos ----------
const NAME_RE = /^[a-z0-9]{10,16}\.(webp|jpg)$/;
const stored = async () => (await dump()).storage;
const putPhoto = putObject;
const signPhotos = (u, listingId, items, o = {}) => post("/api/listings/images", { listingId, items }, { token: u.token, ...o });
async function signAndUpload(u, listingId, n, ext = "jpg") {
  const sign = await signPhotos(u, listingId, Array.from({ length: n }, () => ({ ext })));
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
const setImages = (u, id, images) => post("/api/my/listings", { action: "update", id, fields: { images } }, { token: u.token });

async function scenarioPhotos() {
  section("photos: sign, upload, finalise, view");
  const U = await mkUser("ph1");
  const id = await mk(U, "Photo listing", { contactPublic: true });
  const r = await signAndUpload(U, id, 3);
  check("images: sign 200 with 3 files", r.sign.status === 200 && r.sign.data.ok && r.sign.data.files.length === 3, JSON.stringify(r.sign));
  const f0 = r.sign.data.files?.[0];
  check("images: names match the contract and differ", r.sign.data.files.every((f) => NAME_RE.test(f.name)) && new Set(r.sign.data.files.map((f) => f.name)).size === 3);
  check("images: signed URLs absolute, PUT, token in URL, full and thumb differ", f0 && f0.full.method === "PUT" && f0.thumb.method === "PUT" && f0.full.url.startsWith(MOCK + "/storage/v1/object/upload/sign/listing-images/" + id + "/") && f0.full.url.includes("token=") && f0.thumb.url.includes(`/${f0.name.replace(".jpg", "-t.jpg")}?`), JSON.stringify(f0));
  check("images: all 3 photos uploaded via the FormData protocol", r.names.length === 3);
  check("images: six objects in storage (full + thumb), nothing in the DB before finalise", (await stored()).filter((k) => k.startsWith(id + "/")).length === 6 && (await rowOf(id)).images.length === 0);
  check("images: signed URL cannot overwrite", (await putPhoto(f0.full.url)).status !== 200);
  const fin = await setImages(U, id, r.names);
  check("images: finalise via /api/my/listings, order kept", fin.status === 200 && JSON.stringify(fin.data.listing?.images) === JSON.stringify(r.names) && JSON.stringify((await rowOf(id)).images) === JSON.stringify(r.names), JSON.stringify(fin));
  const lst = await post("/api/my/listings", { action: "list" }, { token: U.token });
  check("images: my list carries the images, no secrets", lst.data.listings.find((l) => l.id === id)?.images.length === 3 && leaks(lst.data).length === 0);
  const reorder = [r.names[2], r.names[0], r.names[1]];
  const ro = await setImages(U, id, reorder);
  check("images: reorder (new cover) ok", ro.status === 200 && ro.data.listing.images[0] === r.names[2]);
  await admin(`approve?id=${id}`);
  const pub = (await viewRows()).find((x) => x.id === id);
  check("images: public view shows images in order", JSON.stringify(pub?.images) === JSON.stringify(reorder), JSON.stringify(pub));
  const obj = await fetch(`${MOCK}/storage/v1/object/public/listing-images/${id}/${reorder[0]}`);
  const thumb = await fetch(`${MOCK}/storage/v1/object/public/listing-images/${id}/${reorder[0].replace(".jpg", "-t.jpg")}`);
  check("images: public object and thumb readable without a key", obj.status === 200 && thumb.status === 200 && obj.headers.get("content-type") === "image/jpeg");
  const anonList = await fetch(`${MOCK}/storage/v1/object/list/listing-images`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: id }) });
  const anonDel = await fetch(`${MOCK}/storage/v1/object/listing-images`, { method: "DELETE", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [`${id}/${reorder[0]}`] }) });
  const anonSign = await fetch(`${MOCK}/storage/v1/object/upload/sign/listing-images/${id}/aaaaaaaaaaaa.jpg`, { method: "POST", headers: { apikey: ANON } });
  check("images: anon key cannot list, delete or sign (no-policy bucket)", anonList.status === 401 && anonDel.status === 401 && anonSign.status === 401);
  const drop = await setImages(U, id, [reorder[0]]);
  check("images: changing photos on an approved ad -> pending", drop.status === 200 && drop.data.listing.status === "pending");
  const left = (await stored()).filter((k) => k.startsWith(id + "/"));
  check("images: dropped photos removed from storage (both files)", left.length === 2 && left.every((k) => k.includes(reorder[0].split(".")[0])), left.join());
  const clear = await setImages(U, id, []);
  check("images: empty list clears photos", clear.status === 200 && clear.data.listing.images.length === 0 && (await stored()).filter((k) => k.startsWith(id + "/")).length === 0);

  section("photos: limits and validation");
  await clearRate();
  const L = await mkUser("ph2");
  const lid = await mk(L, "Limit listing");
  const s11 = await signPhotos(L, lid, Array.from({ length: 11 }, () => ({ ext: "webp" })));
  check("images: 11 in one call -> 400 too_many_images", s11.status === 400 && s11.data.error === "too_many_images", JSON.stringify(s11));
  const eight = await signAndUpload(L, lid, 8, "webp");
  check("images: 8 webp uploaded and saved", eight.names.length === 8 && eight.names.every((n) => n.endsWith(".webp")) && (await setImages(L, lid, eight.names)).data.listing.images.length === 8);
  const s3 = await signPhotos(L, lid, [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }]);
  check("images: 8 existing + 3 new -> too_many_images", s3.status === 400 && s3.data.error === "too_many_images", JSON.stringify(s3));
  const two = await signAndUpload(L, lid, 2);
  const all10 = [...eight.names, ...two.names];
  const fin10 = await setImages(L, lid, all10);
  check("images: 8 + 2 = 10 allowed and saved", two.names.length === 2 && fin10.status === 200 && fin10.data.listing.images.length === 10, JSON.stringify(fin10.data));
  const over = await setImages(L, lid, [...all10, "abcdefghijkl.jpg"]);
  check("images: finalise with 11 names -> 400 too_many_images", over.status === 400 && over.data.error === "too_many_images", JSON.stringify(over));
  const dup = await setImages(L, lid, [all10[0], all10[0]]);
  check("images: duplicate names -> 400 bad_images", dup.status === 400 && dup.data.error === "bad_images", JSON.stringify(dup));
  for (const bad of ["x.png", "../etc/passwd", "ABCDEFGHIJKL.jpg", "short.jpg", `${all10[0]}/../x.jpg`, 5, null]) {
    const rr = await setImages(L, lid, [bad]);
    check(`images: bad name ${JSON.stringify(bad)} -> 400 bad_images`, rr.status === 400 && rr.data.error === "bad_images", JSON.stringify(rr));
  }
  check("images: non-array -> 400 bad_images", (await setImages(L, lid, "abc")).data.error === "bad_images");
  check("images: name with no object in storage -> 400 bad_images", (await setImages(L, lid, ["zzzzzzzzzzzz.jpg"])).data.error === "bad_images");
  const half = await signPhotos(L, lid, [{ ext: "jpg" }]).then(async (x) => (x.status === 200 ? (await putPhoto(x.data.files[0].full.url), x.data.files[0].name) : null));
  const hr = await setImages(L, lid, [half]);
  check("images: full uploaded but thumb missing -> 400 bad_images, saved list untouched", hr.status === 400 && hr.data.error === "bad_images" && (await rowOf(lid)).images.length === 10, JSON.stringify(hr));
  await clearRate();
  const badExt = await signPhotos(L, lid, [{ ext: "png" }]), noItems = await signPhotos(L, lid, []), badItems = await signPhotos(L, lid, "x");
  check("images: bad ext / empty / non-array items -> 400 bad_images", [badExt, noItems, badItems].every((x) => x.status === 400 && x.data.error === "bad_images"), JSON.stringify([badExt.data, noItems.data, badItems.data]));

  section("photos: storage limits (mock mirrors the bucket)");
  const S = await mkUser("ph3");
  const sid = await mk(S, "Limits");
  const sg = await signPhotos(S, sid, [{ ext: "jpg" }, { ext: "jpg" }]);
  const big = await putPhoto(sg.data.files[0].full.url, { size: 650 * 1024 });
  const wrongType = await putPhoto(sg.data.files[1].full.url, { type: "image/png" });
  const edge = await putPhoto(sg.data.files[1].thumb.url, { size: 600 * 1024 });
  check("storage: > 600 KB refused (413), image/png refused (415), exactly 600 KB accepted", big.status === 413 && wrongType.status === 415 && edge.status === 200, `${big.status}/${wrongType.status}/${edge.status}`);
  check("storage: bad token refused", (await putPhoto(sg.data.files[0].full.url.replace(/token=.*/, "token=nope"))).status === 403);

  section("photos: isolation, ownership, errors");
  const O = await mkUser("ph4"), P = await mkUser("ph5");
  const oid = await mk(O, "Other listing");
  const oth = await signAndUpload(O, oid, 1);
  const steal = await setImages(L, lid, [oth.names[0]]);
  check("isolation: user B cannot use A's photo names (bad_images)", steal.status === 400 && steal.data.error === "bad_images", JSON.stringify(steal));
  const bobSign = await signPhotos(P, oid, [{ ext: "jpg" }]);
  const bobFin = await setImages(P, oid, []);
  check("isolation: another user cannot sign for, or change the photos of, my listing (404)", bobSign.status === 404 && bobSign.data.error === "not_found" && bobFin.status === 404, JSON.stringify([bobSign.data, bobFin.data]));
  check("isolation: malformed listingId 404", (await signPhotos(O, "nope", [{ ext: "jpg" }])).status === 404);
  check("images: bad json 400", (await post("/api/listings/images", null, { token: O.token, raw: "{nope" })).data.error === "bad_json");
  for (const st of ["removed", "rejected"]) {
    const x = await mk(O, "NE photo " + st);
    await admin(`set?id=${x}&field=status&value=${st}`);
    const rr = await signPhotos(O, x, [{ ext: "jpg" }]);
    check(`images: ${st} listing -> 409 not_editable`, rr.status === 409 && rr.data.error === "not_editable", JSON.stringify(rr));
  }

  section("photos: rate limit");
  const RL = await mkUser("ph6");
  const rid = await mk(RL, "Rate photos");
  await clearRate();
  const sts = [];
  for (let i = 0; i < 12; i++) sts.push((await signPhotos(RL, rid, [{ ext: "jpg" }])).status);
  const r13 = await signPhotos(RL, rid, [{ ext: "jpg" }]);
  check("images rate: 12 sign calls per hour per user answered (fresh IPs)", sts.every((x) => x === 200), sts.join());
  check("images rate: the 13th -> 429 rate_limited", r13.status === 429 && r13.data.error === "rate_limited", JSON.stringify(r13));
  check("images rate: separate from the manage limiter", (await post("/api/my/listings", { action: "list" }, { token: RL.token })).status === 200);
  await clearRate();
  const ip = "8.8.4.4";
  const gs = [];
  for (let i = 0; i < 60; i++) gs.push((await signPhotos(RL, rid, [{ ext: "jpg" }], { token: "garbage", ip })).status);
  check("images rate per IP: 60 attempts answered, the 61st -> 429", gs.every((x) => x === 401) && (await signPhotos(RL, rid, [{ ext: "jpg" }], { token: "garbage", ip })).status === 429, gs.filter((x) => x !== 401).join());

  section("photos: folder cap, size and type checks, renew cut-off");
  const F = await mkUser("ph7");
  const fcId = await mk(F, "Folder cap");
  await clearRate();
  const fcSign = await signPhotos(F, fcId, Array.from({ length: 10 }, () => ({ ext: "jpg" })));
  for (const f of fcSign.data.files) { await putPhoto(f.full.url); await putPhoto(f.thumb.url); }
  const fcMore = await signPhotos(F, fcId, [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }]);
  check("folder cap: 20 fresh unsaved files + 3 more photos -> 400 too_many_images", fcMore.status === 400 && fcMore.data.error === "too_many_images", JSON.stringify(fcMore));
  check("folder cap: 1 more photo still fits (20 + 2 <= 24)", (await signPhotos(F, fcId, [{ ext: "jpg" }])).status === 200);
  const age = (p) => admin(`put-object?path=${encodeURIComponent(fcId + "/" + p)}&age_min=60`);
  for (const f of fcSign.data.files) { await age(f.name); await age(f.name.replace(".jpg", "-t.jpg")); }
  const fcStale = await signPhotos(F, fcId, [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }]);
  check("folder cap: old unsaved files are cleaned up so a real retry fits", fcStale.status === 200 && (await stored()).filter((k) => k.startsWith(fcId + "/")).length === 0, JSON.stringify(fcStale));

  const Z = await mkUser("ph8");
  const zid = await mk(Z, "Size checks");
  const szS = await signPhotos(Z, zid, [{ ext: "jpg" }, { ext: "jpg" }, { ext: "jpg" }]);
  const [g0, g1, g2] = szS.data.files;
  await putPhoto(g0.full.url); await putPhoto(g0.thumb.url, { size: 200_000 });
  await putPhoto(g1.full.url, { type: "image/png" }); await putPhoto(g1.thumb.url);
  await putPhoto(g2.full.url, { size: 90_000 }); await putPhoto(g2.thumb.url, { size: 20_000 });
  const z0 = await setImages(Z, zid, [g0.name]), z1 = await setImages(Z, zid, [g1.name]), z2 = await setImages(Z, zid, [g2.name]);
  check("finalise: thumbnail over 150 KB -> bad_images; not webp/jpeg -> bad_images; normal sizes ok", z0.data.error === "bad_images" && z1.data.error === "bad_images" && z2.status === 200, JSON.stringify([z0.data, z1.data, z2.status]));

  section("photos: delete cleanup + keepalive sweep");
  const D = await mkUser("ph9");
  const did = await mk(D, "Delete with photos");
  const dd = await signAndUpload(D, did, 2);
  await setImages(D, did, dd.names);
  check("delete: photos exist before", (await stored()).filter((k) => k.startsWith(did + "/")).length === 4);
  const del = await post("/api/my/listings", { action: "delete", id: did }, { token: D.token });
  check("delete: storage folder emptied and images cleared", del.status === 200 && (await stored()).filter((k) => k.startsWith(did + "/")).length === 0 && (await rowOf(did)).images.length === 0);

  const mkPhoto = async (title) => {
    const id2 = await mk(D, title);
    const u = await signAndUpload(D, id2, 1);
    await setImages(D, id2, u.names);
    return id2;
  };
  const has = async (x) => (await stored()).some((k) => k.startsWith(x + "/"));
  const active = await mkPhoto("sweep active"); await admin(`approve?id=${active}`);
  const pendingP = await mkPhoto("sweep pending");
  const rejected = await mkPhoto("sweep rejected"); await admin(`set?id=${rejected}&field=status&value=rejected`);
  const removed = await mkPhoto("sweep removed"); await admin(`set?id=${removed}&field=status&value=removed`);
  const longGone = await mkPhoto("sweep expired 20d"); await admin(`approve?id=${longGone}&expires_in_days=-20`);
  const justGone = await mkPhoto("sweep expired 5d"); await admin(`approve?id=${justGone}&expires_in_days=-5`);
  const noAuthKa = await fetch(`${APP}/api/keepalive`);
  const wrongKa = await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer nope" } });
  check("keepalive: 401 without / with wrong secret, and it sweeps nothing", noAuthKa.status === 401 && wrongKa.status === 401 && (await has(removed)), `${noAuthKa.status}/${wrongKa.status}`);
  const ka = await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  check("keepalive: 200 with the secret", ka.status === 200 && (await ka.json()).ok === true);
  check("sweep: removed / rejected / expired>14d photos deleted and images cleared", !(await has(removed)) && !(await has(rejected)) && !(await has(longGone)) && (await rowOf(removed)).images.length === 0 && (await rowOf(longGone)).images.length === 0);
  check("sweep: expired only 5 days ago, active and pending listings untouched", (await has(justGone)) && (await has(active)) && (await has(pendingP)));
  const many = [];
  for (let i = 0; i < 23; i++) { const x = await mkPhoto("bulk " + i); await admin(`set?id=${x}&field=status&value=removed`); many.push(x); }
  await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  check("sweep: bounded to 20 listings per run", (await dump()).listings.filter((r) => many.includes(r.id) && r.images.length === 0).length === 20);
  await fetch(`${APP}/api/keepalive`, { headers: { Authorization: "Bearer cron-t" } });
  check("sweep: next run finishes the rest", (await dump()).listings.filter((r) => many.includes(r.id) && r.images.length === 0).length === 23);
  const kaView = await fetch(`${MOCK}/__admin/dump`).then((r) => r.json());
  check("keepalive left profiles and avatars alone", kaView.profiles.length > 0);
}

async function scenarioPages() {
  section("pages smoke");
  const paths = [];
  for (const l of ["fa", "en"]) for (const p of ["login", "reset-password", "profile", "my", ...BOARDS, "contribute"]) paths.push(`/${l}/${p}`);
  for (const p of paths) {
    let r;
    try { r = await fetch(APP + p); } catch { r = { status: 0 }; }
    check(`page ${p}: 200`, r.status === 200, String(r.status));
  }
  for (const l of ["fa", "en"]) {
    const m = await fetch(`${APP}/${l}/manage`, { redirect: "manual" });
    const loc = m.headers.get("location") ?? "";
    check(`page /${l}/manage redirects to /${l}/my`, [307, 308].includes(m.status) && loc.endsWith(`/${l}/my`), `${m.status} ${loc}`);
    check(`page /${l}/manage (followed): 200`, (await fetch(`${APP}/${l}/manage`)).status === 200);
  }
  const bad = await fetch(APP + "/xx/login");
  check("page /xx/login: 404", bad.status === 404, String(bad.status));
  const html = await (await fetch(APP + "/fa/market")).text();
  check("page /fa/market: RTL Persian, no service key", /dir="rtl"/.test(html) && /lang="fa"/.test(html) && !html.includes(SVC));
  for (const b of BOARDS) {
    const t = await (await fetch(`${APP}/en/${b}`)).text();
    check(`page /en/${b}: has the posting section heading id pg-form-title`, /id="pg-form-title"/.test(t));
    check(`page /en/${b}: logged-out HTML shows no title/contact input of the form`, !/name="contactValue"/.test(t));
  }
  const login = await (await fetch(APP + "/en/login")).text();
  check("page /en/login: no leftover manage-code wording", !/manage code/i.test(login) && !/optional/i.test(login));
  const my = await (await fetch(APP + "/en/my")).text();
  check("page /en/my: no manage-code wording", !/manage code/i.test(my));
}

function scenarioSource() {
  section("source: manage codes retired, secrets");
  const files = [];
  const walk = (dir) => { for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|css|mjs)$/.test(n) && files.push(p); } };
  walk(join(ROOT, "src"));
  const isComment = (l) => /^\s*(\/\/|\*|\/\*)/.test(l);
  const hits = (re) => files.flatMap((f) => readFileSync(f, "utf8").split("\n").filter((l) => re.test(l) && !isComment(l)).map((l) => `${f.slice(ROOT.length + 1)}: ${l.trim().slice(0, 80)}`));
  for (const [name, re] of [["MANAGE_CODE_SALT", /MANAGE_CODE_SALT/], ["manageCode / manage_hash / manage-code", /manageCode|manage_hash|manage-code|posterName|poster_name/], ["too_fast / openedMs / honeypot", /too_fast|openedMs|"website"/]]) {
    const h = hits(re);
    check(`src: no code uses ${name}`, h.length === 0, h.slice(0, 3).join(" | "));
  }
  check("src: manage-code.ts and api/listings/manage are deleted", !existsSync(join(ROOT, "src/lib/manage-code.ts")) && !existsSync(join(ROOT, "src/app/api/listings/manage")));
  check("src: auth-link.tsx, market-form.tsx, post-form.tsx, manage-client.tsx are deleted", ["auth-link", "market-form", "post-form", "manage-client"].every((n) => !existsSync(join(ROOT, `src/components/${n}.tsx`))));
  const sv = [["production + 32 chars", { NODE_ENV: "production", IP_HASH_SALT: "x".repeat(32) }, true], ["production + short IP_HASH_SALT", { NODE_ENV: "production", IP_HASH_SALT: "short" }, false], ["production + no IP_HASH_SALT", { NODE_ENV: "production" }, false], ["production + long IP_HASH_SALT, MANAGE_CODE_SALT missing", { NODE_ENV: "production", IP_HASH_SALT: "y".repeat(40) }, true], ["production + long IP_HASH_SALT, MANAGE_CODE_SALT short", { NODE_ENV: "production", IP_HASH_SALT: "y".repeat(40), MANAGE_CODE_SALT: "t" }, true], ["development, nothing set", { NODE_ENV: "development" }, true]];
  const modUrl = pathToFileURL(join(ROOT, "src/lib/secrets.ts")).href;
  for (const [name, env, want] of sv) {
    let got = null;
    try {
      const e = { PATH: process.env.PATH, ...env };
      got = execFileSync(process.execPath, ["--no-warnings", "--input-type=module", "-e", `import { secretsReady } from ${JSON.stringify(modUrl)}; console.log(secretsReady());`], { env: e }).toString().trim() === "true";
    } catch (err) { got = "error: " + String(err.message).slice(0, 100); }
    check(`secretsReady(): ${name} -> ${want}`, got === want, String(got));
  }
}

async function scenarioNotConfigured() {
  section("not_configured (server without Supabase env)");
  const dir = makeClone("noenv");
  const clean = {};
  for (const k of Object.keys(ENV)) clean[k] = "";
  const p = start("npx", ["next", "dev", "-p", String(PROD_PORT)], clean, "next-dev-noenv", dir);
  try {
    await waitFor(`http://localhost:${PROD_PORT}/fa`, 180000, p);
  } catch (e) {
    check("not_configured: server starts", false, e.message);
    return;
  }
  const P = `http://localhost:${PROD_PORT}`;
  const calls = [["/api/listings", bodyFor("market")], ["/api/my/listings", { action: "list" }], ["/api/listings/images", { listingId: "x", items: [{ ext: "jpg" }] }], ["/api/profile", { action: "get" }], ["/api/profile", { action: "avatar_sign", ext: "webp" }]];
  for (const [path, body] of calls) {
    const r = await api(P, path, body, { token: "tok-a@b.com" });
    check(`not_configured: POST ${path} ${body.action ?? ""} -> 503`, r.status === 503 && r.data.error === "not_configured", JSON.stringify(r));
  }
  const login = await fetch(P + "/en/login");
  const html = await login.text();
  check("not_configured: login page renders 200 with a 'not available' note", login.status === 200 && /not available/i.test(html), `${login.status} ${/not available/i.test(html)}`);
  for (const b of BOARDS) check(`not_configured: /en/${b} renders 200`, (await fetch(`${P}/en/${b}`)).status === 200);
  const home = await (await fetch(P + "/en")).text();
  check("not_configured: header keeps the Log in link (the login page explains)", /\/en\/login/.test(home));
  try { process.kill(-p.pid, "SIGTERM"); } catch {}
}

// ---------- main ----------
async function main() {
  for (const f of [".env.local", ".env.test.local"]) if (existsSync(join(ROOT, f))) console.log(`note: existing ${f} left untouched`);
  scenarioSource();
  const mock = start("node", ["scripts/mock-supabase.mjs"], { MOCK_PORT: String(MOCK_PORT) }, "mock");
  await waitFor(`${MOCK}/__health`, 10000, mock);
  console.log("mock up");
  const dev = start("npx", ["next", "dev", "-p", String(DEV_PORT)], ENV, "next-dev", makeClone("main"));
  try {
    await waitFor(`${APP}/fa`, 180000, dev);
    console.log("next dev up");
    await scenarioMockAuth();
    await scenarioAuthz();
    await scenarioProfileGate();
    await scenarioProfile();
    await scenarioAvatar();
    await scenarioCreate();
    await scenarioMy();
    await scenarioPublicView();
    await scenarioReveal();
    await scenarioPhotos();
    await scenarioPages();
    const devLog = dev.getLog();
    check("dev server log: no unhandled server errors", !/⨯|Unhandled|TypeError|ReferenceError/.test(devLog), devLog.split("\n").filter((l) => /⨯|Unhandled|TypeError|ReferenceError/.test(l)).slice(0, 5).join(" | "));
    check("dev server log: no token, password, phone or email printed", !/tok-[a-z]/.test(devLog) && !/0912\d{7}/.test(devLog) && !/@example\.com/.test(devLog), devLog.split("\n").filter((l) => /tok-|0912\d{7}|@example\.com/.test(l)).slice(0, 3).join(" | "));
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
