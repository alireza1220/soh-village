// End-to-end test for the admin area (POST /api/admin/overview | listings | posts | users, the role column, the posts table and view):
// the real Next.js app (a throwaway copy of the project) against scripts/mock-supabase.mjs.
// Run: node scripts/test-admin.mjs        (about 1-2 minutes; it starts its own servers: app on 3224, mock on 54397)
// Never run "next build" for this.
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MOCK_PORT = 54397;
const DEV_PORT = 3224;
const MOCK = `http://localhost:${MOCK_PORT}`;
const APP = `http://localhost:${DEV_PORT}`;
const SVC = "svc-key";
const ANON = "anon-key";
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: MOCK,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON,
  SUPABASE_SERVICE_ROLE_KEY: SVC,
  IP_HASH_SALT: "t",
  MANAGE_CODE_SALT: "",
  CRON_SECRET: "cron-t",
};
const DAY = 86_400_000;

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
// "next dev" allows one instance per project dir, so the app runs in a throwaway copy (node_modules is an APFS clone).
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
const freshIp = () => `10.7.${Math.floor(++ipSeq / 250)}.${(ipSeq % 250) + 1}`;
async function api(path, body, { ip, token, raw } = {}) {
  const headers = { "Content-Type": "application/json", "x-forwarded-for": ip ?? freshIp() };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(APP + path, { method: "POST", headers, body: raw ?? JSON.stringify(body) });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _text: text.slice(0, 200) }; }
  return { status: res.status, data };
}
const dump = async () => (await fetch(`${MOCK}/__admin/dump`)).json();
const mock = async (p) => (await fetch(`${MOCK}/__admin/${p}`)).json();
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)])).toString();
const clearRate = () => mock("clear-rate");
const svcRest = (path, init = {}) => fetch(`${MOCK}/rest/v1/${path}`, { ...init, headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
const anonView = (name, extra = "") => fetch(`${MOCK}/rest/v1/${name}?select=*${extra}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });

let userSeq = 0;
async function mkUser(label, { role = "user", profile = true } = {}) {
  const email = `${label}${++userSeq}@example.com`;
  let id;
  if (profile) id = (await mock("mkprofile?" + qs({ email, first: "First" + label, family: "Family" + label, phone: "0912000" + String(1000 + userSeq), role }))).user_id;
  else id = (await mock("mkuser?" + qs({ email }))).id;
  return { email, id, token: `tok-${email}` };
}
const adm = (path, body, u, o = {}) => api(path, body, { token: u?.token, ...o });
async function mkListing(owner, over = {}, photos = 0) {
  const res = await svcRest("listings", {
    method: "POST",
    body: JSON.stringify({ board: "market", type: "sell", category: "fruit", title: "Cherries", area: "Soh", details: "fresh", contact_kind: "phone", contact_value: "09121111111", owner_id: owner.id, images: [], ...over }),
  });
  const row = (await res.json())[0];
  const names = [];
  for (let i = 0; i < photos; i++) {
    const name = `abcdefghij${i}${i}.jpg`;
    await mock("put-object?" + qs({ path: `${row.id}/${name}`, type: "image/jpeg" }));
    await mock("put-object?" + qs({ path: `${row.id}/${name.replace(".jpg", "-t.jpg")}`, type: "image/jpeg" }));
    names.push(name);
  }
  if (names.length) await svcRest(`listings?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ images: names }) });
  return { id: row.id, names };
}
const listingRow = async (id) => (await dump()).listings.find((r) => r.id === id);
const postRow = async (id) => (await dump()).posts.find((r) => r.id === id);
const storageKeys = async (id) => (await dump()).storage.filter((k) => k.startsWith(id + "/"));

// ---------- scenarios ----------
const ROUTES = ["/api/admin/overview", "/api/admin/listings", "/api/admin/posts", "/api/admin/users"];
const SAMPLE_BODIES = [
  ["/api/admin/overview", {}],
  ["/api/admin/listings", { action: "list", status: "all" }],
  ["/api/admin/listings", { action: "set_status", id: "11111111-1111-4111-8111-111111111111", status: "approved" }],
  ["/api/admin/listings", { action: "update", id: "11111111-1111-4111-8111-111111111111", fields: { title: "x" } }],
  ["/api/admin/posts", { action: "list" }],
  ["/api/admin/posts", { action: "create", fields: { kind: "news", titleEn: "Hi" } }],
  ["/api/admin/posts", { action: "update", id: "11111111-1111-4111-8111-111111111111", fields: { titleEn: "x" } }],
  ["/api/admin/posts", { action: "delete", id: "11111111-1111-4111-8111-111111111111" }],
  ["/api/admin/users", { action: "list" }],
];

async function scenarioAccess() {
  section("access: 401 without token, 403 for normal users and users without a profile");
  await mock("reset");
  const normal = await mkUser("normal");
  const noProfile = await mkUser("noprofile", { profile: false });
  const boss = await mkUser("boss", { role: "admin" });
  for (const r of ROUTES) {
    const a = await adm(r, {}, null);
    check(`${r}: no token -> 401`, a.status === 401 && a.data.error === "unauthorized", JSON.stringify(a));
    const bad = await adm(r, {}, { token: "tok-" }, {});
    check(`${r}: garbage token -> 401`, bad.status === 401, JSON.stringify(bad));
  }
  let all403 = true, noLeak = true, detail = "";
  for (const [path, body] of SAMPLE_BODIES) {
    for (const [who, u] of [["normal user", normal], ["user without a profile", noProfile]]) {
      const r = await adm(path, body, u);
      if (r.status !== 403 || r.data.error !== "forbidden") { all403 = false; detail += ` ${who} ${path} ${body.action ?? ""} -> ${r.status}`; }
      if (JSON.stringify(r.data) !== JSON.stringify({ error: "forbidden" })) noLeak = false;
    }
  }
  check("every admin action: normal user and user without a profile -> 403 forbidden", all403, detail);
  check("a 403 carries no data, only the error code", noLeak);
  const nobody = await adm("/api/admin/users", { action: "list" }, normal);
  check("users list for a non-admin exposes nothing (no users, no phone)", !("users" in nobody.data) && !JSON.stringify(nobody.data).includes("0912"), JSON.stringify(nobody.data));
  const d = await dump();
  check("the 403 calls changed nothing (no posts created)", d.posts.length === 0);
  const garbage = await api("/api/admin/posts", null, { token: boss.token, raw: "{not json" });
  check("admin with a broken body -> 400 bad_json", garbage.status === 400 && garbage.data.error === "bad_json", JSON.stringify(garbage));
  const nonAdminGarbage = await api("/api/admin/posts", null, { token: normal.token, raw: "{not json" });
  check("non-admin with a broken body -> 403 (the body is not read before the role check)", nonAdminGarbage.status === 403, JSON.stringify(nonAdminGarbage));
  for (const r of ROUTES) {
    const u = await adm(r, { action: "nope" }, boss);
    const expectOverview = r === "/api/admin/overview";
    check(`${r}: unknown action -> 400 bad_action`, expectOverview ? u.status === 200 : u.status === 400 && u.data.error === "bad_action", JSON.stringify(u));
  }
  const ov = await adm("/api/admin/overview", {}, boss);
  check("admin overview -> 200 with counts", ov.status === 200 && ov.data.ok === true && ov.data.counts?.admins === 1 && ov.data.counts?.users === 2, JSON.stringify(ov));
}

async function scenarioRole() {
  section("the role can not be changed from the site");
  await mock("reset");
  const u = await mkUser("sneaky", { profile: false });
  const save = await api("/api/profile", { action: "save", fields: { firstName: "Sneaky", familyName: "One", phone: "09121234567", role: "admin" } }, { token: u.token });
  check("profile save with an extra role field still works", save.status === 200 && save.data.ok === true, JSON.stringify(save));
  let row = (await dump()).profiles.find((p) => p.user_id === u.id);
  check("a new profile is stored with role 'user'", row?.role === "user", JSON.stringify(row));
  check("the API shows role 'user'", save.data.profile?.role === "user", JSON.stringify(save.data));
  const upd = await api("/api/profile", { action: "save", fields: { firstName: "Sneaky2", role: "admin" } }, { token: u.token });
  row = (await dump()).profiles.find((p) => p.user_id === u.id);
  check("an update with {fields:{role:'admin'}} keeps role 'user'", upd.status === 200 && row.role === "user" && row.first_name === "Sneaky2", JSON.stringify(row));
  const top = await api("/api/profile", { action: "save", role: "admin", fields: { firstName: "Sneaky3" } }, { token: u.token });
  row = (await dump()).profiles.find((p) => p.user_id === u.id);
  check("a role at the top of the body keeps role 'user'", top.status === 200 && row.role === "user", JSON.stringify(row));
  const only = await api("/api/profile", { action: "save", fields: { role: "admin" } }, { token: u.token });
  row = (await dump()).profiles.find((p) => p.user_id === u.id);
  check("a body with ONLY role changes nothing and the role stays 'user'", row.role === "user", JSON.stringify(only));
  const gate = await adm("/api/admin/overview", {}, u);
  check("...so the user is still refused by the admin area (403)", gate.status === 403, JSON.stringify(gate));
  // the owner flips the role in Supabase: the next call works at once (the role is read from the database every time)
  await mock("set-profile?" + qs({ email: u.email, field: "role", value: "admin" }));
  const after = await adm("/api/admin/overview", {}, u);
  check("after the owner sets role = admin in the database: 200 on the next call", after.status === 200, JSON.stringify(after));
  await mock("set-profile?" + qs({ email: u.email, field: "role", value: "user" }));
  const back = await adm("/api/admin/overview", {}, u);
  check("after the owner sets it back to user: 403 again", back.status === 403, JSON.stringify(back));
  const bad = await svcRest(`profiles?user_id=eq.${u.id}`, { method: "PATCH", body: JSON.stringify({ role: "superuser" }) });
  check("the database refuses any other role value (check constraint)", bad.status === 400);
}

async function scenarioListings() {
  section("admin: listings");
  await mock("reset");
  const boss = await mkUser("boss", { role: "admin" });
  const maryam = await mkUser("maryam");
  const reza = await mkUser("reza");
  const a = await mkListing(maryam, { title: "Walnuts 100% fresh", details: "sweet_and, dry (new)" }, 2);
  const b = await mkListing(reza, { title: "Apples", board: "careers", type: "hiring", category: "farm", quantity: "seasonal" });
  const c = await mkListing(reza, { title: "Old chair", status: "approved", approved_at: new Date().toISOString(), expires_at: new Date(Date.now() + 50 * DAY).toISOString() }, 1);
  const noOwnerProfile = await mkUser("ghost", { profile: false });
  const e = await mkListing(noOwnerProfile, { title: "No profile ad" });

  const l1 = await adm("/api/admin/listings", { action: "list" }, boss);
  const ids1 = (l1.data.listings || []).map((x) => x.id);
  check("list: default shows pending ones only", l1.status === 200 && ids1.includes(a.id) && ids1.includes(b.id) && !ids1.includes(c.id) && l1.data.total === 3, JSON.stringify(l1.data).slice(0, 300));
  const first = (l1.data.listings || []).find((x) => x.id === a.id);
  check("list: poster has user id, names and phone", first?.poster?.userId === maryam.id && first.poster.firstName === "Firstmaryam" && first.poster.familyName === "Familymaryam" && /^0912/.test(first.poster.phone), JSON.stringify(first?.poster));
  check("list: a listing whose owner has no profile has poster null", (l1.data.listings.find((x) => x.id === e.id) || {}).poster === null);
  check("list: AdminListing has status, images, approvedAt (null for pending) and no owner_id / ip_hash", first && first.status === "pending" && first.images.length === 2 && first.approvedAt === null && !JSON.stringify(first).includes("owner_id") && !JSON.stringify(first).includes("ip_hash"));
  const all = await adm("/api/admin/listings", { action: "list", status: "all" }, boss);
  check("list: status all -> every listing, newest first", all.data.total === 4 && all.data.listings[0].id === e.id, JSON.stringify(all.data.listings?.map((x) => x.title)));
  const careers = await adm("/api/admin/listings", { action: "list", status: "all", board: "careers" }, boss);
  check("list: board filter", careers.data.total === 1 && careers.data.listings[0].id === b.id);
  const q1 = await adm("/api/admin/listings", { action: "list", status: "all", q: "WALNUT" }, boss);
  check("list: q matches title case-insensitively", q1.data.total === 1 && q1.data.listings[0].id === a.id, JSON.stringify(q1.data).slice(0, 200));
  const q2 = await adm("/api/admin/listings", { action: "list", status: "all", q: "dry (new)" }, boss);
  check("list: q with parentheses matches details", q2.data.total === 1 && q2.data.listings[0].id === a.id, JSON.stringify(q2));
  const q3 = await adm("/api/admin/listings", { action: "list", status: "all", q: "100%" }, boss);
  check("list: q with % is literal (not a wildcard)", q3.data.total === 1 && q3.data.listings[0].id === a.id, JSON.stringify(q3.data).slice(0, 200));
  const q4 = await adm("/api/admin/listings", { action: "list", status: "all", q: "%" }, boss);
  check("list: q '%' matches only the row that contains a percent sign", q4.data.total === 1, JSON.stringify(q4.data).slice(0, 200));
  const q5 = await adm("/api/admin/listings", { action: "list", status: "all", q: "sweet_and" }, boss);
  const q6 = await adm("/api/admin/listings", { action: "list", status: "all", q: "sweetXand" }, boss);
  check("list: q with _ is literal (sweet_and found, sweetXand not)", q5.data.total === 1 && q6.data.total === 0, `${q5.data.total} ${q6.data.total}`);
  const q7 = await adm("/api/admin/listings", { action: "list", status: "all", q: 'a,b"c\\d)' }, boss);
  check("list: commas, quotes, backslashes and brackets in q do not break the query", q7.status === 200 && q7.data.total === 0, JSON.stringify(q7));
  const badStatus = await adm("/api/admin/listings", { action: "list", status: "weird" }, boss);
  check("list: bad status -> 400 bad_status", badStatus.status === 400 && badStatus.data.error === "bad_status");
  const badBoard = await adm("/api/admin/listings", { action: "list", board: "nope" }, boss);
  check("list: bad board -> 400 bad_board", badBoard.status === 400 && badBoard.data.error === "bad_board");
  const page2 = await adm("/api/admin/listings", { action: "list", status: "all", offset: 3 }, boss);
  check("list: offset pages (4 in total, offset 3 -> 1 row, total still 4)", page2.data.listings.length === 1 && page2.data.total === 4);

  // many rows -> 50 per page
  for (let i = 0; i < 52; i++) await svcRest("listings", { method: "POST", body: JSON.stringify({ board: "market", type: "sell", category: "fruit", title: "Bulk " + i, area: "Soh", owner_id: reza.id }) });
  const big1 = await adm("/api/admin/listings", { action: "list", status: "all" }, boss);
  const big2 = await adm("/api/admin/listings", { action: "list", status: "all", offset: 50 }, boss);
  check("list: 50 per page, total counts everything", big1.data.listings.length === 50 && big1.data.total === 56 && big2.data.listings.length === 6, `${big1.data.listings?.length} ${big1.data.total} ${big2.data.listings?.length}`);

  // approve
  const t0 = Date.now();
  const ap = await adm("/api/admin/listings", { action: "set_status", id: a.id, status: "approved" }, boss);
  let row = await listingRow(a.id);
  const exp = Date.parse(row.expires_at);
  check("approve: 200 with the updated AdminListing", ap.status === 200 && ap.data.listing?.status === "approved" && ap.data.listing.poster?.userId === maryam.id, JSON.stringify(ap).slice(0, 300));
  check("approve: approved_at is now and expires_at is about 30 days away", row.approved_at && Math.abs(Date.parse(row.approved_at) - t0) < 60_000 && Math.abs(exp - (t0 + 30 * DAY)) < 60_000, JSON.stringify(row));
  check("approve: the answer carries approvedAt and expiresAt", !!ap.data.listing.approvedAt && !!ap.data.listing.expiresAt);
  const pub = await anonView("public_listings", `&id=eq.${a.id}`);
  check("approve: the listing is now in the public view", (await pub.json()).length === 1);
  check("approve: photos stay", (await storageKeys(a.id)).length === 4);
  // a longer existing expiry is kept
  await svcRest(`listings?id=eq.${b.id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", approved_at: new Date(Date.now() - 5 * DAY).toISOString(), expires_at: new Date(Date.now() + 90 * DAY).toISOString() }) });
  const keepLong = await adm("/api/admin/listings", { action: "set_status", id: b.id, status: "approved" }, boss);
  row = await listingRow(b.id);
  check("approve: a longer existing expiry (90 days) is kept", keepLong.status === 200 && Math.abs(Date.parse(row.expires_at) - (Date.now() + 90 * DAY)) < 120_000, row.expires_at);
  // reject / pending keep photos
  const rej = await adm("/api/admin/listings", { action: "set_status", id: a.id, status: "rejected" }, boss);
  check("reject: 200, status rejected, photos stay", rej.status === 200 && rej.data.listing.status === "rejected" && (await storageKeys(a.id)).length === 4);
  const pubGone = await (await anonView("public_listings", `&id=eq.${a.id}`)).json();
  check("reject: no longer in the public view", pubGone.length === 0);
  const pend = await adm("/api/admin/listings", { action: "set_status", id: a.id, status: "pending" }, boss);
  check("back to pending works", pend.status === 200 && pend.data.listing.status === "pending");
  // remove
  const rem = await adm("/api/admin/listings", { action: "set_status", id: a.id, status: "removed" }, boss);
  row = await listingRow(a.id);
  check("remove: 200 status removed", rem.status === 200 && rem.data.listing.status === "removed" && row.status === "removed");
  check("remove: photos purged from storage and images emptied", (await storageKeys(a.id)).length === 0 && row.images.length === 0 && rem.data.listing.images.length === 0, JSON.stringify(await storageKeys(a.id)));
  const again = await adm("/api/admin/listings", { action: "set_status", id: a.id, status: "removed" }, boss);
  check("remove twice is fine", again.status === 200);
  // errors
  const badSt = await adm("/api/admin/listings", { action: "set_status", id: c.id, status: "deleted" }, boss);
  check("set_status: bad status -> 400 bad_status", badSt.status === 400 && badSt.data.error === "bad_status");
  const noId = await adm("/api/admin/listings", { action: "set_status", id: "nope", status: "approved" }, boss);
  check("set_status: bad id -> 404 not_found", noId.status === 404 && noId.data.error === "not_found");
  const missing = await adm("/api/admin/listings", { action: "set_status", id: "22222222-2222-4222-8222-222222222222", status: "approved" }, boss);
  check("set_status: unknown id -> 404 not_found", missing.status === 404);
  // update
  const upd = await adm("/api/admin/listings", { action: "update", id: c.id, fields: { title: "Old chair (fixed)", price: "50", images: ["zzzzzzzzzzzz.jpg"], status: "rejected" } }, boss);
  row = await listingRow(c.id);
  check("update: admin fixes the title and price, the status stays approved, images are not touched", upd.status === 200 && upd.data.listing.title === "Old chair (fixed)" && row.price === "50" && row.status === "approved" && row.images.length === 1 && upd.data.listing.status === "approved", JSON.stringify(upd).slice(0, 300));
  const updBad = await adm("/api/admin/listings", { action: "update", id: c.id, fields: { type: "nonsense" } }, boss);
  check("update: bad type -> 400 bad_type", updBad.status === 400 && updBad.data.error === "bad_type", JSON.stringify(updBad));
  const updNo = await adm("/api/admin/listings", { action: "update", id: c.id, fields: [] }, boss);
  check("update: fields not an object -> 400 bad_fields", updNo.status === 400 && updNo.data.error === "bad_fields");
  const updTitle = await adm("/api/admin/listings", { action: "update", id: c.id, fields: { title: "  " } }, boss);
  check("update: empty title -> 400 title_required", updTitle.status === 400 && updTitle.data.error === "title_required");
  // overview
  const ov = await adm("/api/admin/overview", {}, boss);
  const k = ov.data.counts;
  check("overview: listing counts per status add up", k.listings.removed === 1 && k.listings.approved === 2 && k.listings.pending >= 50 && k.users === 3 && k.admins === 1, JSON.stringify(k));
}

async function scenarioPosts() {
  section("admin: posts (news, blog, events)");
  await mock("reset");
  const boss = await mkUser("boss", { role: "admin" });
  const other = await mkUser("other", { role: "admin" });
  const post = (body, u = boss) => adm("/api/admin/posts", body, u);

  const n = await post({ action: "create", fields: { kind: "news", titleFa: "خبر اول", bodyFa: "متن", published: false } });
  check("create draft news -> 200 AdminPost, unpublished, no publishedAt", n.status === 200 && n.data.post?.kind === "news" && n.data.post.published === false && n.data.post.publishedAt === null && n.data.post.titleFa === "خبر اول", JSON.stringify(n).slice(0, 300));
  check("create: author is the admin", n.data.post.authorId === boss.id);
  const id = n.data.post.id;
  const pub0 = await (await anonView("public_posts")).json();
  check("a draft is NOT in the public_posts view", pub0.length === 0, JSON.stringify(pub0));

  const forged = await post({ action: "create", fields: { kind: "blog", titleEn: "Forged", authorId: other.id, author_id: other.id, id: "33333333-3333-4333-8333-333333333333", publishedAt: "2001-01-01T00:00:00Z", published_at: "2001-01-01T00:00:00Z", createdAt: "2001-01-01T00:00:00Z" }, author_id: other.id, authorId: other.id });
  const fr = await postRow(forged.data.post?.id);
  check("author_id / id / published_at from the client are ignored on create", forged.status === 200 && fr.author_id === boss.id && fr.id !== "33333333-3333-4333-8333-333333333333" && fr.published_at === null && !fr.created_at.startsWith("2001"), JSON.stringify(fr));

  // publish
  const t0 = Date.now();
  const p1 = await post({ action: "update", id, fields: { published: true } });
  let row = await postRow(id);
  check("publish: published true and publishedAt is now", p1.status === 200 && p1.data.post.published === true && Math.abs(Date.parse(row.published_at) - t0) < 60_000, JSON.stringify(row));
  const firstAt = row.published_at;
  const pub1 = await (await anonView("public_posts")).json();
  check("a published post is in the public view", pub1.length === 1 && pub1[0].id === id);
  check("the public view has no author_id, no published flag, no updated_at", !("author_id" in pub1[0]) && !("published" in pub1[0]) && !("updated_at" in pub1[0]) && Object.keys(pub1[0]).sort().join() === "body_en,body_fa,created_at,event_at,id,kind,place_en,place_fa,published_at,title_en,title_fa", Object.keys(pub1[0]).join());
  const hide = await anonView("public_posts", "&author_id=eq." + boss.id);
  check("the public view refuses to be filtered on author_id (column does not exist)", hide.status === 400);
  const unp = await post({ action: "update", id, fields: { published: false } });
  const gone = await (await anonView("public_posts")).json();
  check("unpublish: gone from the public view, published_at kept", unp.status === 200 && gone.length === 0 && (await postRow(id)).published_at === firstAt);
  await sleep(30);
  await post({ action: "update", id, fields: { published: true, titleFa: "خبر اول (ویرایش)" } });
  row = await postRow(id);
  check("publish again: published_at is not moved (set once)", row.published_at === firstAt && row.title_fa === "خبر اول (ویرایش)", `${row.published_at} vs ${firstAt}`);
  const sneak = await post({ action: "update", id, fields: { titleEn: "x", publishedAt: "2001-01-01T00:00:00Z", authorId: other.id, author_id: other.id, id: "44444444-4444-4444-8444-444444444444" } });
  row = await postRow(id);
  check("update ignores client author_id / published_at / id", sneak.status === 200 && row.author_id === boss.id && row.published_at === firstAt && row.id === id);
  const other2 = await post({ action: "update", id, fields: { titleEn: "by other admin" } }, other);
  check("another admin can edit it; the author stays the first admin", other2.status === 200 && (await postRow(id)).author_id === boss.id);

  // created published at once
  const direct = await post({ action: "create", fields: { kind: "blog", titleEn: "Live blog", bodyEn: "Hello", published: true } });
  check("create with published true sets published_at at once", direct.status === 200 && direct.data.post.published === true && !!direct.data.post.publishedAt && (await anonView("public_posts")).status === 200);

  // events
  const when = new Date(Date.now() + 10 * DAY).toISOString();
  const ev = await post({ action: "create", fields: { kind: "event", titleEn: "Harvest fair", eventAt: when, placeEn: "Village square", placeFa: "میدان ده", published: true } });
  check("create event with a date and place", ev.status === 200 && ev.data.post.kind === "event" && ev.data.post.eventAt === when && ev.data.post.placeEn === "Village square" && ev.data.post.placeFa === "میدان ده", JSON.stringify(ev).slice(0, 300));
  const evNoDate = await post({ action: "create", fields: { kind: "event", titleEn: "No date" } });
  check("event without a date -> 400 event_date_required", evNoDate.status === 400 && evNoDate.data.error === "event_date_required", JSON.stringify(evNoDate));
  const toNews = await post({ action: "update", id: ev.data.post.id, fields: { kind: "news" } });
  row = await postRow(ev.data.post.id);
  check("event -> news clears event_at", toNews.status === 200 && row.kind === "news" && row.event_at === null && toNews.data.post.eventAt === null, JSON.stringify(row));
  const toEvNoDate = await post({ action: "update", id: ev.data.post.id, fields: { kind: "event" } });
  check("news -> event without a date -> 400 event_date_required", toEvNoDate.status === 400 && toEvNoDate.data.error === "event_date_required");
  const evClear = await post({ action: "create", fields: { kind: "event", titleEn: "Fair 2", eventAt: when } });
  const clearDate = await post({ action: "update", id: evClear.data.post.id, fields: { eventAt: null } });
  check("clearing the date of an event -> 400 event_date_required", clearDate.status === 400 && clearDate.data.error === "event_date_required");

  // validation
  const v = async (fields, expect, name) => {
    const r = await post({ action: "create", fields });
    check(`create: ${name} -> 400 ${expect}`, r.status === 400 && r.data.error === expect, JSON.stringify(r));
  };
  await v({ kind: "news" }, "title_required", "no title");
  await v({ kind: "news", titleFa: "   ", titleEn: "" }, "title_required", "blank titles");
  await v({ titleEn: "x" }, "bad_kind", "no kind");
  await v({ kind: "gossip", titleEn: "x" }, "bad_kind", "bad kind");
  await v({ kind: "news", titleEn: "x".repeat(141) }, "too_long", "title of 141 characters");
  await v({ kind: "news", titleEn: "x", bodyEn: "y".repeat(10001) }, "too_long", "body of 10001 characters");
  await v({ kind: "news", titleEn: "x", placeEn: "p".repeat(121) }, "too_long", "place of 121 characters");
  await v({ kind: "event", titleEn: "x", eventAt: "not a date" }, "bad_date", "bad date");
  await v({ kind: "event", titleEn: "x", eventAt: "1850-01-01T00:00:00Z" }, "bad_date", "date in year 1850");
  await v({ kind: "news", titleEn: "x", published: "yes" }, "bad_fields", "published not a boolean");
  const noFields = await post({ action: "create" });
  check("create without fields -> 400 bad_fields", noFields.status === 400 && noFields.data.error === "bad_fields");
  const okLong = await post({ action: "create", fields: { kind: "news", titleEn: "x".repeat(140), bodyEn: "y".repeat(10000) } });
  check("exact limits (140 / 10000) are accepted", okLong.status === 200);
  const updTitleGone = await post({ action: "update", id, fields: { titleFa: "", titleEn: "" } });
  check("update that would leave no title at all -> 400 title_required", updTitleGone.status === 400 && updTitleGone.data.error === "title_required");
  const updBadKind = await post({ action: "update", id, fields: { kind: "x" } });
  check("update with a bad kind -> 400 bad_kind", updBadKind.status === 400 && updBadKind.data.error === "bad_kind");
  const nf = await post({ action: "update", id: "55555555-5555-4555-8555-555555555555", fields: { titleEn: "x" } });
  check("update of an unknown post -> 404 not_found", nf.status === 404 && nf.data.error === "not_found");
  const badId = await post({ action: "delete", id: "x" });
  check("delete with a bad id -> 404 not_found", badId.status === 404);

  // list
  const l = await post({ action: "list" });
  check("list: all posts incl. drafts, newest first, with authorId", l.status === 200 && l.data.posts.length >= 5 && l.data.posts.every((p) => "authorId" in p && "published" in p) && Date.parse(l.data.posts[0].createdAt) >= Date.parse(l.data.posts.at(-1).createdAt), JSON.stringify(l.data).slice(0, 200));
  const lp = await post({ action: "list", published: false });
  check("list: published false -> drafts only", lp.data.posts.length > 0 && lp.data.posts.every((p) => p.published === false));
  const lk = await post({ action: "list", kind: "blog" });
  check("list: kind filter", lk.data.posts.length > 0 && lk.data.posts.every((p) => p.kind === "blog"));
  const lall = await post({ action: "list", kind: "all" });
  check("list: kind all is allowed", lall.status === 200 && lall.data.posts.length === l.data.posts.length);
  const lbad = await post({ action: "list", kind: "x" });
  check("list: bad kind -> 400 bad_kind", lbad.status === 400 && lbad.data.error === "bad_kind");

  // delete
  const del = await post({ action: "delete", id });
  check("delete: 200 and the row is gone", del.status === 200 && del.data.ok === true && !(await postRow(id)));
  const del2 = await post({ action: "delete", id });
  check("delete again -> 404 not_found", del2.status === 404 && del2.data.error === "not_found");

  // overview
  const ov = await adm("/api/admin/overview", {}, boss);
  const p = ov.data.counts.posts;
  const d = await dump();
  const count = (f) => d.posts.filter(f).length;
  check("overview: posts per kind and drafts match the table", p.news === count((x) => x.kind === "news") && p.blog === count((x) => x.kind === "blog") && p.event === count((x) => x.kind === "event") && p.drafts === count((x) => !x.published), JSON.stringify(p));
  // the public view never exposes a draft
  const pubNow = await (await anonView("public_posts")).json();
  check("public_posts: only published rows, no author ids anywhere", pubNow.length === count((x) => x.published) && !JSON.stringify(pubNow).includes(boss.id));
  const baseAnon = await fetch(`${MOCK}/rest/v1/posts?select=*`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  check("the posts table itself is closed to the anon key", baseAnon.status === 401 || baseAnon.status === 403);
  // database checks (what the SQL enforces even if the route were bypassed)
  const raw = await svcRest("posts", { method: "POST", body: JSON.stringify({ kind: "event", title_en: "x" }) });
  check("the table itself refuses an event without a date (check constraint)", raw.status === 400);
  const raw2 = await svcRest("posts", { method: "POST", body: JSON.stringify({ kind: "news", title_fa: "", title_en: "" }) });
  check("the table itself refuses a post without any title", raw2.status === 400);
}

async function scenarioUsers() {
  section("admin: users");
  await mock("reset");
  const boss = await mkUser("boss", { role: "admin" });
  const maryam = await mkUser("maryam");
  const reza = await mkUser("reza");
  await mkListing(maryam, { title: "one" });
  await mkListing(maryam, { title: "two" });
  await mkListing(maryam, { title: "gone", status: "removed" });
  await mkListing(reza, { title: "three" });
  const l = await adm("/api/admin/users", { action: "list" }, boss);
  const byId = Object.fromEntries((l.data.users || []).map((u) => [u.userId, u]));
  check("users list: all three, total 3", l.status === 200 && l.data.total === 3 && l.data.users.length === 3, JSON.stringify(l.data).slice(0, 200));
  check("users list: role and listing count (removed not counted)", byId[boss.id]?.role === "admin" && byId[maryam.id]?.role === "user" && byId[maryam.id].listingCount === 2 && byId[reza.id].listingCount === 1 && byId[boss.id].listingCount === 0, JSON.stringify(l.data.users));
  check("users list: names, phone, createdAt present", /^0912/.test(byId[maryam.id].phone) && byId[maryam.id].firstName === "Firstmaryam" && !!byId[maryam.id].createdAt);
  const q = await adm("/api/admin/users", { action: "list", q: "familyreza" }, boss);
  check("users q: family name, case-insensitive", q.data.total === 1 && q.data.users[0].userId === reza.id, JSON.stringify(q.data));
  const qp = await adm("/api/admin/users", { action: "list", q: byId[maryam.id].phone.slice(2, 9) }, boss);
  check("users q: part of the phone number", qp.data.users.some((u) => u.userId === maryam.id), JSON.stringify(qp.data));
  const qd = await adm("/api/admin/users", { action: "list", q: byId[maryam.id].phone.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]).slice(0, 8) }, boss);
  check("users q: Persian digits match the phone", qd.data.users.some((u) => u.userId === maryam.id), JSON.stringify(qd.data));
  const qn = await adm("/api/admin/users", { action: "list", q: "zzzz" }, boss);
  check("users q: no match -> empty list, total 0", qn.status === 200 && qn.data.total === 0 && qn.data.users.length === 0);
  const wild = await adm("/api/admin/users", { action: "list", q: "%" }, boss);
  check("users q: % is literal, so it matches nobody", wild.status === 200 && wild.data.total === 0);
  const writeTry = await adm("/api/admin/users", { action: "set_role", userId: reza.id, role: "admin" }, boss);
  check("there is no way to change a role: set_role -> 400 bad_action", writeTry.status === 400 && writeTry.data.error === "bad_action");
  const writeTry2 = await adm("/api/admin/users", { action: "update", userId: reza.id, fields: { role: "admin" } }, boss);
  check("update on users -> 400 bad_action, and the role stays user", writeTry2.status === 400 && (await dump()).profiles.find((p) => p.user_id === reza.id).role === "user");
  check("no response contains an email address", !JSON.stringify(l.data).includes("@"));
}

async function scenarioRate() {
  section("admin: rate limit kind 'admin'");
  await mock("reset");
  const boss = await mkUser("boss", { role: "admin" });
  const ok = await adm("/api/admin/overview", {}, boss);
  check("an admin call is logged as kind admin", ok.status === 200 && (await dump()).rate_events.some((e) => e.kind === "admin" && e.user_id === boss.id));
  // 600 calls per hour per user: fill the log in one batch, then the next call is refused
  const now = new Date().toISOString();
  const rows = Array.from({ length: 600 }, () => ({ ip_hash: "fill", user_id: boss.id, kind: "admin", created_at: now }));
  const fill = await svcRest("rate_events", { method: "POST", body: JSON.stringify(rows), headers: { Prefer: "return=minimal" } });
  check("(test setup) rate log filled", fill.status === 201, String(fill.status));
  const refused = await adm("/api/admin/overview", {}, boss);
  check("the 601st admin call in an hour -> 429 rate_limited", refused.status === 429 && refused.data.error === "rate_limited", JSON.stringify(refused));
  const refusedPost = await adm("/api/admin/posts", { action: "create", fields: { kind: "news", titleEn: "x" } }, boss);
  check("...for every admin route, and nothing was written", refusedPost.status === 429 && (await dump()).posts.length === 0);
  const other = await mkUser("boss2", { role: "admin" });
  const fine = await adm("/api/admin/overview", {}, other);
  check("another admin is not affected", fine.status === 200);
  await clearRate();
  const normal = await mkUser("normal");
  const rows2 = Array.from({ length: 600 }, () => ({ ip_hash: "fill", user_id: normal.id, kind: "admin", created_at: now }));
  await svcRest("rate_events", { method: "POST", body: JSON.stringify(rows2), headers: { Prefer: "return=minimal" } });
  const nr = await adm("/api/admin/overview", {}, normal);
  check("a normal user who hits the limit gets 429 (not information about the role)", nr.status === 429);
  await clearRate();
  const manage = await api("/api/my/listings", { action: "list" }, { token: boss.token });
  check("admin calls do not use up the 'manage' budget of normal routes", manage.status === 200, JSON.stringify(manage));
}

// ---------- main ----------
async function main() {
  const m = start("node", ["scripts/mock-supabase.mjs"], { MOCK_PORT: String(MOCK_PORT) }, "mock");
  await waitFor(`${MOCK}/__health`, 10000, m);
  console.log("mock up");
  const dev = start("npx", ["next", "dev", "-p", String(DEV_PORT)], ENV, "next-dev", makeClone("admin"));
  try {
    await waitFor(`${APP}/fa`, 180000, dev);
    console.log("next dev up");
    await scenarioAccess();
    await scenarioRole();
    await scenarioListings();
    await scenarioPosts();
    await scenarioUsers();
    await scenarioRate();
    const log = dev.getLog();
    check("dev server log: no unhandled server errors", !/⨯|Unhandled|TypeError|ReferenceError/.test(log), log.split("\n").filter((l) => /⨯|Unhandled|TypeError|ReferenceError/.test(l)).slice(0, 4).join(" | "));
    check("dev server log: no token, phone or email printed", !/tok-[a-z]/.test(log) && !/0912\d{7}/.test(log) && !/@example\.com/.test(log));
  } finally {
    try { process.kill(-dev.pid, "SIGTERM"); } catch {}
  }
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
