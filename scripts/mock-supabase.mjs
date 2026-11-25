// Test-only Supabase mock: just enough PostgREST + GoTrue for scripts/test-market.mjs. No dependencies.
// Usage: MOCK_PORT=54399 node scripts/mock-supabase.mjs        (MOCK_SEED=1 also seeds approved sample listings with photos)
// Also mocks the bits of Supabase Storage the photo flow uses (signed upload, public GET, list, remove), in memory.
import http from "node:http";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKET = "listing-images";
const MAX_OBJECT = 614400;
const MIMES = ["image/webp", "image/jpeg"];
const storage = new Map(); // "<listing id>/<file>" -> { buf, type }
const tokens = new Map(); // token -> object path

const PORT = Number(process.env.MOCK_PORT || process.env.PORT || 54399);
const SVC = "svc-key";
const ANON = "anon-key";
const DAY = 86_400_000;

const db = { listings: [], rate_events: [] };
let rateSeq = 0;
const otpLog = [];

const PUBLIC_COLS = ["id", "type", "category", "title", "quantity", "price", "area", "available", "details", "contact_kind", "contact_value", "created_at", "expires_at", "images"];

const uuidFor = (email) => {
  const h = createHash("sha1").update(email).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range",
};
const send = (res, status, body, extra = {}) => {
  const data = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", ...cors, ...extra });
  res.end(data);
};

const readBody = (req) =>
  new Promise((resolve) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch {
        resolve(null);
      }
    });
  });

function cmp(a, b) {
  if (a == null || b == null) return NaN;
  const da = typeof a === "string" ? Date.parse(a) : NaN;
  const db2 = typeof b === "string" ? Date.parse(b) : NaN;
  if (!Number.isNaN(da) && !Number.isNaN(db2) && /^\d{4}-/.test(String(a))) return da - db2;
  if (typeof a === "number" || typeof b === "number") return Number(a) - Number(b);
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function matches(row, filters) {
  for (const [col, expr] of filters) {
    const dot = expr.indexOf(".");
    const op = expr.slice(0, dot);
    const val = expr.slice(dot + 1);
    const v = row[col];
    if (op === "neq" && Array.isArray(v)) {
      if ((val === "{}") === (v.length === 0)) return false;
    } else if (op === "eq") {
      if (String(v) !== val) return false;
    } else if (op === "neq") {
      if (String(v) === val) return false;
    } else if (op === "gte") {
      if (!(cmp(v, val) >= 0)) return false;
    } else if (op === "gt") {
      if (!(cmp(v, val) > 0)) return false;
    } else if (op === "lte") {
      if (!(cmp(v, val) <= 0)) return false;
    } else if (op === "lt") {
      if (!(cmp(v, val) < 0)) return false;
    } else if (op === "in") {
      if (!val.replace(/^\(|\)$/g, "").split(",").includes(String(v))) return false;
    } else if (op === "is") {
      if (val === "null" ? v != null : v == null) return false;
    }
  }
  return true;
}

const RESERVED = new Set(["select", "order", "limit", "offset"]);
const parseFilters = (sp) => [...sp.entries()].filter(([k]) => !RESERVED.has(k));

const publicView = () =>
  db.listings
    .filter((r) => r.status === "approved" && (r.expires_at == null || Date.parse(r.expires_at) > Date.now()))
    .map((r) => ({
      ...Object.fromEntries(PUBLIC_COLS.map((c) => [c, r[c] ?? null])),
      contact_kind: r.contact_public ? r.contact_kind ?? null : null,
      contact_value: r.contact_public ? r.contact_value ?? null : null,
    }));

function project(rows, select) {
  if (!select || select === "*") return rows;
  const cols = select.split(",").map((s) => s.trim());
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
}

const validListing = (r) => {
  const types = ["sell", "need", "service", "seeking", "hiring"];
  if (!types.includes(r.type)) return "type";
  if (typeof r.category !== "string") return "category";
  if (typeof r.title !== "string" || r.title.length < 1 || r.title.length > 120) return "title";
  if (typeof r.area !== "string" || r.area.length > 80) return "area";
  if (r.details && r.details.length > 800) return "details";
  if (r.images !== undefined && (!Array.isArray(r.images) || r.images.length > 10)) return "images";
  return null;
};

function touchOnUpdate(oldRow, newRow) {
  if (newRow.status === "approved" && oldRow.status !== "approved") {
    newRow.approved_at = new Date().toISOString();
    newRow.expires_at = new Date(Date.now() + 30 * DAY).toISOString();
  }
  newRow.updated_at = new Date().toISOString();
}

async function rest(req, res, url) {
  const table = url.pathname.replace("/rest/v1/", "");
  const key = req.headers["apikey"];
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  const isView = table === "public_listings";
  if (!isView && !["listings", "rate_events"].includes(table)) return send(res, 404, { message: "no such table" });
  if (isView) {
    if (![SVC, ANON].includes(key)) return send(res, 401, { message: "Invalid API key" });
  } else if (key !== SVC || (bearer !== "" && bearer !== SVC)) {
    // New-style keys (not JWTs) arrive in the apikey header only; legacy keys also send a matching bearer.
    // Base tables are locked for anon: behave like RLS + revoke.
    return send(res, key === ANON ? 401 : 401, { message: "permission denied for table " + table });
  }
  const prefer = String(req.headers["prefer"] || "");
  const sp = url.searchParams;
  const filters = parseFilters(sp);

  if (req.method === "GET") {
    if (isView && url.searchParams.get("select") === null) return send(res, 400, { message: "select required" });
    let rows = (isView ? publicView() : db[table]).filter((r) => matches(r, filters));
    const order = sp.get("order");
    if (order) {
      const [col, dir] = order.split(".");
      rows = [...rows].sort((a, b) => cmp(a[col], b[col]) * (dir === "desc" ? -1 : 1));
    }
    const total = rows.length;
    let start = Number(sp.get("offset") || 0);
    let end = total;
    const range = String(req.headers["range"] || "");
    const m = /^(\d+)-(\d+)$/.exec(range);
    if (m) {
      start = Number(m[1]);
      end = Math.min(total, Number(m[2]) + 1);
    }
    if (sp.get("limit")) end = Math.min(end, start + Number(sp.get("limit")));
    const page = rows.slice(start, end);
    const headers = {};
    if (prefer.includes("count=exact")) headers["Content-Range"] = `${page.length ? start : "*"}${page.length ? `-${start + page.length - 1}` : ""}/${total}`.replace("*-", "*");
    if (prefer.includes("count=exact") && !page.length) headers["Content-Range"] = `*/${total}`;
    return send(res, 200, project(page, sp.get("select")), headers);
  }
  if (isView) return send(res, 405, { message: "view is read-only" });

  if (req.method === "POST") {
    const body = await readBody(req);
    if (body === null) return send(res, 400, { message: "bad json" });
    const items = Array.isArray(body) ? body : [body];
    const out = [];
    for (const it of items) {
      if (table === "listings") {
        const bad = validListing(it);
        if (bad) return send(res, 400, { message: "check violation: " + bad });
        if (it.manage_hash && db.listings.some((r) => r.manage_hash === it.manage_hash)) {
          return send(res, 409, { code: "23505", message: "duplicate key manage_hash" });
        }
        const now = new Date().toISOString();
        out.push({
          id: randomUUID(), status: "pending", renewals: 0, images: [], contact_public: false, created_at: now, updated_at: now,
          approved_at: null, expires_at: null, manage_hash: null, owner_id: null, ip_hash: null,
          quantity: null, price: null, available: null, details: null, poster_name: null, contact_kind: null, contact_value: null,
          ...Object.fromEntries(Object.entries(it).filter(([k]) => k !== "id" || false)),
        });
      } else {
        if (typeof it.ip_hash !== "string" || typeof it.kind !== "string") return send(res, 400, { message: "not null violation" });
        out.push({ id: ++rateSeq, ip_hash: it.ip_hash, kind: it.kind, created_at: new Date().toISOString() });
      }
    }
    db[table].push(...out);
    if (prefer.includes("return=representation")) return send(res, 201, Array.isArray(body) ? out : out, {});
    res.writeHead(201, cors);
    return res.end();
  }

  if (req.method === "PATCH") {
    const body = await readBody(req);
    if (!body || typeof body !== "object") return send(res, 400, { message: "bad json" });
    const hit = db[table].filter((r) => matches(r, filters));
    for (const r of hit) {
      const old = { ...r };
      Object.assign(r, body);
      if (table === "listings") touchOnUpdate(old, r);
    }
    if (prefer.includes("return=representation")) return send(res, 200, hit);
    res.writeHead(204, cors);
    return res.end();
  }
  return send(res, 405, { message: "method not allowed" });
}


// ---------- storage ----------
const svcOk = (req) => req.headers["apikey"] === SVC;
const readRaw = (req) => new Promise((resolve) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => resolve(Buffer.concat(c))); });
const storErr = (res, status, message) => send(res, status, { statusCode: String(status), error: message, message });

// Minimal multipart parser: returns [{ name, filename, type, data }]
function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!m) return null;
  const delim = Buffer.from("--" + (m[1] || m[2]));
  const parts = [];
  let pos = buf.indexOf(delim);
  while (pos !== -1) {
    const next = buf.indexOf(delim, pos + delim.length);
    if (next === -1) break;
    let chunk = buf.subarray(pos + delim.length, next);
    if (chunk.subarray(0, 2).toString() === "\r\n") chunk = chunk.subarray(2);
    if (chunk.subarray(-2).toString() === "\r\n") chunk = chunk.subarray(0, chunk.length - 2);
    const sep = chunk.indexOf("\r\n\r\n");
    if (sep !== -1) {
      const head = chunk.subarray(0, sep).toString("utf8");
      const nm = /name="([^"]*)"/i.exec(head);
      const fn = /filename="([^"]*)"/i.exec(head);
      const ct = /content-type:\s*([^\r\n]+)/i.exec(head);
      parts.push({ name: nm ? nm[1] : null, filename: fn ? fn[1] : null, type: ct ? ct[1].trim() : null, data: chunk.subarray(sep + 4) });
    }
    pos = next;
  }
  return parts;
}

async function storageRoute(req, res, url) {
  const rel = url.pathname.slice("/storage/v1".length);
  const signRe = new RegExp(`^/object/upload/sign/${BUCKET}/(.+)$`);
  const pubRe = new RegExp(`^/object/public/${BUCKET}/(.+)$`);
  let m;
  if ((m = signRe.exec(rel))) {
    const path = decodeURIComponent(m[1]);
    if (req.method === "POST") {
      if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
      if (!/^[0-9a-f-]{36}\/[a-z0-9-]+\.(webp|jpg)$/.test(path)) return storErr(res, 400, "Invalid path");
      const token = randomBytes(16).toString("hex");
      tokens.set(token, path);
      return send(res, 200, { url: `/object/upload/sign/${BUCKET}/${m[1]}?token=${token}` });
    }
    if (req.method === "PUT") {
      const token = url.searchParams.get("token");
      if (!token || tokens.get(token) !== path) return storErr(res, 403, "Invalid token");
      if ((req.headers["content-type"] || "").indexOf("multipart/form-data") === -1) return storErr(res, 400, "Expected multipart/form-data");
      const parts = parseMultipart(await readRaw(req), req.headers["content-type"]);
      const file = parts?.find((x) => x.name === "" && x.filename !== null);
      const cc = parts?.find((x) => x.name === "cacheControl");
      if (!file || !cc) return storErr(res, 400, "Missing file or cacheControl");
      if (file.data.length > MAX_OBJECT) return storErr(res, 413, "The object exceeded the maximum allowed size");
      if (!MIMES.includes(file.type)) return storErr(res, 415, "mime type " + file.type + " is not supported");
      if (storage.has(path)) return storErr(res, 409, "The resource already exists");
      storage.set(path, { buf: file.data, type: file.type, at: Date.now() });
      tokens.delete(token);
      return send(res, 200, { Key: `${BUCKET}/${path}` });
    }
  }
  if ((m = pubRe.exec(rel)) && (req.method === "GET" || req.method === "HEAD")) {
    const o = storage.get(decodeURIComponent(m[1]));
    if (!o) return storErr(res, 404, "Object not found");
    res.writeHead(200, { "Content-Type": o.type, "Content-Length": o.buf.length, "Cache-Control": "public, max-age=3600", ...cors });
    return res.end(req.method === "HEAD" ? undefined : o.buf);
  }
  if (rel === `/object/list/${BUCKET}` && req.method === "POST") {
    if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
    const body = await readBody(req);
    const prefix = String(body?.prefix || "").replace(/\/?$/, "/");
    const limit = Number(body?.limit ?? 100), offset = Number(body?.offset ?? 0);
    const names = [...storage.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes("/")).map((k) => k.slice(prefix.length)).sort();
    return send(res, 200, names.slice(offset, offset + limit).map((name) => ({ name, id: name, created_at: storage.get(prefix + name).at ? new Date(storage.get(prefix + name).at).toISOString() : undefined, metadata: { size: storage.get(prefix + name).buf.length, mimetype: storage.get(prefix + name).type } })));
  }
  if (rel === `/object/${BUCKET}` && req.method === "DELETE") {
    if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
    const body = await readBody(req);
    if (!Array.isArray(body?.prefixes)) return storErr(res, 400, "prefixes required");
    const gone = body.prefixes.filter((p) => storage.delete(p));
    return send(res, 200, gone.map((name) => ({ name })));
  }
  return storErr(res, 404, "not found");
}

// ---------- sample data (MOCK_SEED=1 or /__admin/seed): approved listings with photos for visual checks ----------
const ALNUM = "abcdefghijklmnopqrstuvwxyz0123456789";
const rid = () => Array.from(randomBytes(12), (b) => ALNUM[b % 36]).join("");
function seed() {
  const pics = ["market", "shop", "needs", "resources", "traditions", "tourism", "people", "stay", "history", "words"]
    .map((n) => join(ROOT, "public/illustrations", n + ".jpg")).filter(existsSync).map((f) => readFileSync(f));
  if (!pics.length) pics.push(Buffer.alloc(100, 1));
  const add = (o, n) => {
    const id = randomUUID();
    const images = [];
    for (let i = 0; i < n; i++) {
      const name = rid() + ".jpg", buf = pics[(i + db.listings.length) % pics.length];
      storage.set(`${id}/${name}`, { buf, type: "image/jpeg" });
      storage.set(`${id}/${name.replace(".jpg", "-t.jpg")}`, { buf, type: "image/jpeg" });
      images.push(name);
    }
    const now = Date.now();
    db.listings.push({
      id, status: "approved", renewals: 0, contact_public: true, poster_name: null, manage_hash: null, owner_id: null, ip_hash: null,
      quantity: null, price: null, available: null, details: null, contact_kind: "phone", contact_value: "09121234567",
      created_at: new Date(now - (db.listings.length + 1) * 3600_000).toISOString(), updated_at: new Date(now).toISOString(),
      approved_at: new Date(now).toISOString(), expires_at: new Date(now + 25 * DAY).toISOString(), images, ...o,
    });
  };
  add({ type: "sell", category: "fruit", title: "گیلاس تازه از باغ سه", quantity: "۲۰۰ کیلو", price: "۱۲۰٬۰۰۰ تومان هر کیلو", area: "سه، باغ بالا", available: "تا آخر خرداد", details: "گیلاس درشت و شیرین، خودتان بچینید یا ما می‌چینیم." }, 6);
  add({ type: "sell", category: "nuts", title: "Walnuts, 2025 harvest", quantity: "50 kg", price: "450,000 toman per kg", area: "Soh", details: "Dry, hand-cracked on request." }, 3);
  add({ type: "need", category: "labour", title: "دنبال دو نفر برای چیدن سیب", quantity: "۲ نفر", price: "روزی ۸۰۰٬۰۰۰ تومان", area: "سه", available: "از اول مهر", details: "ناهار با ماست." }, 0);
  add({ type: "sell", category: "crafts", title: "قالی دستباف کاشان", quantity: "۱", price: "توافقی", area: "اصفهان", details: "شش متری، رنگ‌های سنتی." , contact_public: false }, 10);
  add({ type: "sell", category: "bread", title: "نان محلی تنوری", quantity: "هر روز", price: "۱۵٬۰۰۰ تومان", area: "سه، مرکز" }, 1);
  add({ type: "need", category: "other", title: "Looking for a used wheelbarrow", area: "Soh" }, 0);
}
if (process.env.MOCK_SEED) seed();

async function auth(req, res, url) {
  const key = req.headers["apikey"];
  if (![ANON, SVC].includes(key)) return send(res, 401, { message: "No API key found" });
  const p = url.pathname;
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  if (p === "/auth/v1/otp" && req.method === "POST") {
    const body = await readBody(req);
    if (!body || typeof body.email !== "string" || !body.email.includes("@")) return send(res, 400, { msg: "invalid email" });
    otpLog.push({ email: body.email, redirect_to: url.searchParams.get("redirect_to"), create_user: body.create_user, at: Date.now() });
    return send(res, 200, {});
  }
  if (p === "/auth/v1/user" && req.method === "GET") {
    const m = /^tok-(.+@.+)$/.exec(bearer);
    if (!m) return send(res, 401, { msg: "invalid JWT" });
    return send(res, 200, { id: uuidFor(m[1]), email: m[1] });
  }
  if (p === "/auth/v1/logout" && req.method === "POST") {
    if (!/^tok-/.test(bearer)) return send(res, 401, { msg: "invalid JWT" });
    res.writeHead(204, cors);
    return res.end();
  }
  if (p === "/auth/v1/token" && req.method === "POST" && url.searchParams.get("grant_type") === "refresh_token") {
    const body = await readBody(req);
    const m = /^ref-(.+@.+)$/.exec(body?.refresh_token || "");
    if (!m) return send(res, 400, { error: "invalid_grant" });
    return send(res, 200, {
      access_token: `tok-${m[1]}`, refresh_token: `ref-${m[1]}`, expires_in: 3600, token_type: "bearer",
      user: { id: uuidFor(m[1]), email: m[1] },
    });
  }
  return send(res, 404, { msg: "not found" });
}

function admin(req, res, url) {
  const p = url.pathname;
  const sp = url.searchParams;
  if (p === "/__admin/dump") return send(res, 200, { listings: db.listings, rate_events: db.rate_events, otp: otpLog, storage: [...storage.keys()] });
  if (p === "/__admin/seed") { seed(); return send(res, 200, { ok: true, listings: db.listings.length }); }
  if (p === "/__admin/put-object") { // test helper: store an object directly (path, type, size)
    storage.set(sp.get("path"), { buf: Buffer.alloc(Number(sp.get("size") || 10), 1), type: sp.get("type") || "image/jpeg", at: Date.now() - Number(sp.get("age_min") || 0) * 60_000 });
    return send(res, 200, { ok: true });
  }
  if (p === "/__admin/reset") {
    db.listings.length = 0; db.rate_events.length = 0; otpLog.length = 0; storage.clear(); tokens.clear();
    return send(res, 200, { ok: true });
  }
  if (p === "/__admin/clear-rate") {
    db.rate_events.length = 0;
    return send(res, 200, { ok: true });
  }
  const row = db.listings.find((r) => r.id === sp.get("id"));
  if (!row) return send(res, 404, { error: "no row" });
  if (p === "/__admin/approve") {
    const old = { ...row };
    row.status = "approved";
    touchOnUpdate(old, row);
    // optional: expires_in_days (may be negative or fractional) overrides the 30-day default
    if (sp.get("expires_in_days") !== null) row.expires_at = new Date(Date.now() + Number(sp.get("expires_in_days")) * DAY).toISOString();
    if (sp.get("renewals") !== null) row.renewals = Number(sp.get("renewals"));
    return send(res, 200, row);
  }
  if (p === "/__admin/set") {
    row[sp.get("field")] = sp.get("value") === "null" ? null : sp.get("value");
    return send(res, 200, row);
  }
  return send(res, 404, { error: "unknown admin route" });
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors);
      return res.end();
    }
    try {
      if (url.pathname.startsWith("/__admin/")) return admin(req, res, url);
      if (url.pathname === "/__health") return send(res, 200, { ok: true });
      if (url.pathname.startsWith("/rest/v1/")) return await rest(req, res, url);
      if (url.pathname.startsWith("/auth/v1/")) return await auth(req, res, url);
      if (url.pathname.startsWith("/storage/v1/")) return await storageRoute(req, res, url);
      return send(res, 404, { message: "not found" });
    } catch (e) {
      return send(res, 500, { message: String(e) });
    }
  })
  .listen(PORT, () => console.log(`mock supabase on :${PORT}`));
