// Test-only Supabase mock: just enough PostgREST + GoTrue + Storage for scripts/test-market.mjs. No dependencies.
// Usage: MOCK_PORT=54399 node scripts/mock-supabase.mjs        (MOCK_SEED=1 also seeds fake people + approved sample ads on all four boards)
//
// What it emulates (it is NOT the real database; review the SQL files by hand and try them once in the real SQL Editor):
//   Auth     signup (Confirm email switchable), token grant_type=password and refresh_token, otp (magic link), recover, user GET/PUT.
//            Tokens are "tok-<email>" and refresh tokens "ref-<email>", so test code can mint a session for any email without signing up.
//   REST     tables listings, profiles (with role), posts, rate_events (service key only; the anon key gets 401) and the views public_listings + public_posts (anon allowed).
//            Filters: eq neq gt gte lt lte in is like ilike and or=(...); order, limit, offset, Range, Prefer count=exact / return=representation.
//            Unknown columns are refused like PostgREST does. Check constraints and the owner_id insert trigger are emulated.
//   Storage  buckets "listing-images" and "post-images" (600 KB, webp/jpeg) and "avatars" (20 KB, webp/jpeg): signed upload, public GET, list, remove.
// Admin helpers (GET, test only): /__admin/dump, seed, reset, clear-rate, approve, set, put-object, mkuser, link, set-confirm, confirm,
//   mkprofile, set-profile, auth-fail. See the handler at the bottom.
import http from "node:http";
import { createHash, randomUUID, randomBytes } from "node:crypto";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MIMES = ["image/webp", "image/jpeg"];
const BUCKETS = {
  "listing-images": { limit: 614400, store: new Map() }, // "<listing id>/<file>" -> { buf, type, at }
  "post-images": { limit: 614400, store: new Map() }, //    "<post id>/<file>"    -> { buf, type, at }
  avatars: { limit: 20480, store: new Map() }, //          "<user id>/<file>"    -> { buf, type, at }
};
const storage = BUCKETS["listing-images"].store; // kept for the listing-photo seed and the dump
const tokens = new Map(); // upload token -> { bucket, path }

const PORT = Number(process.env.MOCK_PORT || process.env.PORT || 54399);
const SVC = "svc-key";
const ANON = "anon-key";
const DAY = 86_400_000;

const db = { listings: [], rate_events: [], profiles: [], posts: [] };
let rateSeq = 0;
const otpLog = []; // magic-link requests
const mails = []; // every mail Supabase would have sent: { kind: "magiclink"|"signup"|"recovery", email, redirect_to, at }
const users = new Map(); // email -> { id, email, password|null, confirmed }
const authState = { confirm: false, fail: null }; // confirm = "Confirm email" switch; fail = HTTP status every auth call answers (e.g. 429) or null

// Columns that exist (an unknown column is a 400 in PostgREST, so a stale query shows up in tests).
const COLUMNS = {
  listings: ["id", "board", "type", "category", "title", "quantity", "price", "area", "available", "details", "contact_kind", "contact_value", "contact_public", "ip_hash", "owner_id", "status", "renewals", "images", "created_at", "updated_at", "approved_at", "expires_at"],
  profiles: ["user_id", "first_name", "family_name", "phone", "avatar", "show_on_ads", "role", "address", "verified", "verified_at", "created_at", "updated_at"],
  posts: ["id", "kind", "title_fa", "title_en", "body_fa", "body_en", "event_at", "place_fa", "place_en", "published", "published_at", "author_id", "created_at", "updated_at", "priority", "cover"],
  rate_events: ["id", "ip_hash", "user_id", "kind", "created_at"],
};
const PUBLIC_COLS = ["id", "type", "category", "title", "quantity", "price", "area", "available", "details", "contact_kind", "contact_value", "created_at", "expires_at", "images", "board", "poster_first_name", "poster_avatar", "poster_verified"];
COLUMNS.public_listings = PUBLIC_COLS;
const PUBLIC_POST_COLS = ["id", "kind", "title_fa", "title_en", "body_fa", "body_en", "event_at", "place_fa", "place_en", "published_at", "created_at", "priority", "cover"];
COLUMNS.public_posts = PUBLIC_POST_COLS; // the view: no author_id, no published flag, published rows only
const TYPES = ["sell", "need", "service", "seeking", "hiring", "offer", "rent"];
const BOARD_IDS = ["market", "careers", "needs", "property"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

// PostgREST pattern ("*" = any text, "\\%" and "\\_" = literal) -> RegExp. Same rules Postgres applies to LIKE after PostgREST maps * to %.
function likeRegex(pat, ci) {
  let re = "";
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    if (c === "\\" && i + 1 < pat.length) re += pat[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    else if (c === "*" || c === "%") re += "[\\s\\S]*";
    else if (c === "_") re += "[\\s\\S]";
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + re + "$", ci ? "i" : "");
}
// or=(a.ilike."*x*",b.eq.y): split on commas outside double quotes, unquote ("\\\"" and "\\\\" inside quotes), evaluate each part.
function orMatches(row, expr) {
  const inner = expr.replace(/^\(|\)$/g, "");
  const parts = [];
  let cur = "", q = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (q && c === "\\" && (inner[i + 1] === '"' || inner[i + 1] === "\\")) { cur += inner[++i]; continue; }
    if (c === '"') { q = !q; continue; }
    if (c === "," && !q) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts.some((p) => {
    const d = p.indexOf(".");
    return matches(row, [[p.slice(0, d), p.slice(d + 1)]]);
  });
}

function matches(row, filters) {
  for (const [col, expr] of filters) {
    if (col === "or") { if (!orMatches(row, expr)) return false; continue; }
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
    } else if (op === "ilike" || op === "like") {
      if (v == null || !likeRegex(val, op === "ilike").test(String(v))) return false;
    } else if (op === "is") {
      if (val === "null" ? v != null : v == null) return false;
    }
  }
  return true;
}

const RESERVED = new Set(["select", "order", "limit", "offset"]);
const parseFilters = (sp) => [...sp.entries()].filter(([k]) => !RESERVED.has(k));

const profileOf = (uid) => db.profiles.find((p) => p.user_id === uid);
const BASE_PUBLIC = ["id", "type", "category", "title", "quantity", "price", "area", "available", "details", "created_at", "expires_at", "images"];

// public.public_listings: approved + not expired, explicit columns, left join to profiles (first name + avatar only when show_on_ads).
const publicView = () =>
  db.listings
    .filter((r) => r.status === "approved" && (r.expires_at == null || Date.parse(r.expires_at) > Date.now()))
    .map((r) => {
      const p = r.owner_id ? profileOf(r.owner_id) : null;
      const show = !!p && p.show_on_ads !== false;
      const row = {
        ...Object.fromEntries(BASE_PUBLIC.map((c) => [c, r[c] ?? null])),
        contact_kind: null, // migration 008: never public; the phone comes from POST /api/listings/contact
        contact_value: null,
        board: r.board ?? "market",
        poster_first_name: show ? p.first_name : null,
        poster_avatar: show && p.avatar ? `${r.owner_id}/${p.avatar}` : null,
        poster_verified: !!p && p.verified === true,
      };
      return Object.fromEntries(PUBLIC_COLS.map((c) => [c, row[c]]));
    });

// public.public_posts: published rows only, explicit columns (no author_id, no published flag, no drafts).
const postsView = () => db.posts.filter((r) => r.published === true).map((r) => Object.fromEntries(PUBLIC_POST_COLS.map((c) => [c, r[c] ?? null])));
const VIEWS = { public_listings: publicView, public_posts: postsView };

function project(rows, select) {
  if (!select || select === "*") return rows;
  const cols = select.split(",").map((s) => s.trim());
  return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c] ?? null])));
}

// CHECK constraints of the real tables.
const validListing = (r) => {
  if (!BOARD_IDS.includes(r.board)) return "board";
  if (!["pending", "approved", "archived", "rejected", "removed"].includes(r.status)) return "listings_status_check"; // migration 009
  if (!TYPES.includes(r.type)) return "type";
  if (typeof r.category !== "string") return "category";
  if (typeof r.title !== "string" || r.title.length < 1 || r.title.length > 120) return "title";
  if (typeof r.area !== "string" || r.area.length > 80) return "area";
  if (r.details && r.details.length > 800) return "details";
  if (r.images !== undefined && (!Array.isArray(r.images) || r.images.length > 10)) return "images";
  return null;
};
// posts: the table's CHECKs (title lengths, at least one title, kind, event needs a date, body / place lengths).
const validPost = (r) => {
  if (!["news", "blog", "event"].includes(r.kind)) return "kind";
  for (const k of ["title_fa", "title_en"]) if (typeof r[k] !== "string" || r[k].length > 140) return k;
  for (const k of ["body_fa", "body_en"]) if (typeof r[k] !== "string" || r[k].length > 10000) return k;
  for (const k of ["place_fa", "place_en"]) if (r[k] != null && (typeof r[k] !== "string" || r[k].length > 120)) return k;
  if (!r.title_fa && !r.title_en) return "posts_has_title";
  if (r.kind === "event" && !r.event_at) return "posts_event_needs_date";
  if (r.event_at != null && Number.isNaN(Date.parse(r.event_at))) return "event_at";
  if (typeof r.published !== "boolean") return "published";
  if (!["normal", "featured", "urgent"].includes(r.priority)) return "posts_priority_check";
  if (r.cover != null && !(typeof r.cover === "string" && /^[a-z0-9]{10,16}\.(webp|jpg)$/.test(r.cover))) return "posts_cover_check";
  if (r.author_id != null && !(typeof r.author_id === "string" && UUID_RE.test(r.author_id))) return "author_id";
  return null;
};
const validProfile = (r) => {
  if (typeof r.user_id !== "string" || !UUID_RE.test(r.user_id)) return "user_id";
  for (const k of ["first_name", "family_name"]) if (typeof r[k] !== "string" || r[k].length < 1 || r[k].length > 40) return k;
  if (typeof r.phone !== "string" || !/^09[0-9]{9}$/.test(r.phone)) return "phone";
  if (r.avatar != null && !/^[a-z0-9]{10,16}\.(webp|jpg)$/.test(r.avatar)) return "avatar";
  if (!["user", "admin"].includes(r.role)) return "role"; // profiles_role_check
  if (typeof r.show_on_ads !== "boolean") return "show_on_ads";
  if (r.address != null && (typeof r.address !== "string" || r.address.length < 5 || r.address.length > 200)) return "profiles_address_check";
  if (typeof r.verified !== "boolean") return "verified";
  return null;
};

function touchOnUpdate(table, oldRow, newRow) {
  if (table === "listings" && newRow.status === "approved" && oldRow.status !== "approved" && oldRow.approved_at == null) {
    newRow.approved_at = new Date().toISOString();
    newRow.expires_at = new Date(Date.now() + 30 * DAY).toISOString();
  }
  newRow.updated_at = new Date().toISOString(); // listing_touch / profile_touch triggers
}

const plain = (c) => /^[a-z_]+$/.test(c);
async function rest(req, res, url) {
  const table = url.pathname.replace("/rest/v1/", "");
  const key = req.headers["apikey"];
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  const isView = table in VIEWS;
  if (!isView && !["listings", "rate_events", "profiles", "posts"].includes(table)) return send(res, 404, { message: "no such table" });
  if (isView) {
    if (![SVC, ANON].includes(key)) return send(res, 401, { message: "Invalid API key" });
  } else if (key !== SVC || (bearer !== "" && bearer !== SVC)) {
    // New-style keys (not JWTs) arrive in the apikey header only; legacy keys also send a matching bearer.
    // Base tables are locked for anon: behave like RLS + revoke (42501), which is what PostgREST answers.
    return send(res, 401, { code: "42501", message: "permission denied for table " + table });
  }
  const prefer = String(req.headers["prefer"] || "");
  const sp = url.searchParams;
  const filters = parseFilters(sp);
  const unknown = (names) => names.find((c) => plain(c) && !COLUMNS[table].includes(c));
  const badCol = (c) => send(res, 400, { code: "42703", message: `column ${table}.${c} does not exist` });

  if (req.method === "GET") {
    if (isView && url.searchParams.get("select") === null) return send(res, 400, { message: "select required" });
    const sel = sp.get("select");
    const bad = unknown([...(sel && sel !== "*" ? sel.split(",").map((s) => s.trim()) : []), ...filters.map(([k]) => k).filter((k) => !["or", "and", "not"].includes(k)), ...(sp.get("order") ? [sp.get("order").split(".")[0]] : [])]);
    if (bad) return badCol(bad);
    let rows = (isView ? VIEWS[table]() : db[table]).filter((r) => matches(r, filters));
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
    return send(res, 200, project(page, sel), headers);
  }
  if (isView) return send(res, 405, { message: "view is read-only" });

  if (req.method === "POST") {
    const body = await readBody(req);
    if (body === null) return send(res, 400, { message: "bad json" });
    const items = Array.isArray(body) ? body : [body];
    const out = [];
    for (const it of items) {
      const stray = Object.keys(it).find((k) => !COLUMNS[table].includes(k));
      if (stray) return send(res, 400, { code: "PGRST204", message: `Could not find the '${stray}' column of '${table}' in the schema cache` });
      const now = new Date().toISOString();
      if (table === "listings") {
        const row = {
          id: randomUUID(), board: "market", status: "approved", renewals: 0, images: [], contact_public: false, created_at: now, updated_at: now,
          approved_at: null, expires_at: null, owner_id: null, ip_hash: null,
          quantity: null, price: null, available: null, details: null, contact_kind: null, contact_value: null,
          ...Object.fromEntries(Object.entries(it).filter(([k]) => k !== "id")),
        };
        const bad = validListing(row);
        if (bad) return send(res, 400, { code: "23514", message: "check violation: " + bad });
        if (!row.owner_id) return send(res, 400, { code: "23502", message: "listings.owner_id is required: a listing belongs to a logged-in user" }); // listing_require_owner trigger
        out.push(row);
      } else if (table === "posts") {
        const row = {
          title_fa: "", title_en: "", body_fa: "", body_en: "", event_at: null, place_fa: null, place_en: null, published: false, published_at: null, author_id: null, priority: "normal", cover: null,
          ...Object.fromEntries(Object.entries(it).filter(([k]) => k !== "id")), id: randomUUID(), created_at: now, updated_at: now,
        };
        const bad = validPost(row);
        if (bad) return send(res, 400, { code: "23514", message: "check violation: " + bad });
        if (row.author_id && ![...users.values()].some((u) => u.id === row.author_id)) return send(res, 409, { code: "23503", message: "violates foreign key constraint: auth.users" });
        out.push(row);
      } else if (table === "profiles") {
        const row = { avatar: null, show_on_ads: true, role: "user", address: null, verified: false, verified_at: null, created_at: now, updated_at: now, ...it };
        const bad = validProfile(row);
        if (bad) return send(res, 400, { code: bad === "user_id" || bad === "phone" || bad === "avatar" ? "23514" : "23514", message: "check violation: " + bad });
        if (![...users.values()].some((u) => u.id === row.user_id)) return send(res, 409, { code: "23503", message: "violates foreign key constraint: auth.users" });
        const dup = db.profiles.find((p) => p.user_id === row.user_id);
        if (dup) {
          if (prefer.includes("resolution=merge-duplicates")) { Object.assign(dup, it, { updated_at: now }); out.push(dup); continue; }
          return send(res, 409, { code: "23505", message: "duplicate key value violates unique constraint \"profiles_pkey\"" });
        }
        out.push(row);
      } else {
        if (typeof it.ip_hash !== "string" || typeof it.kind !== "string") return send(res, 400, { code: "23502", message: "not null violation" });
        if (it.user_id != null && (typeof it.user_id !== "string" || !UUID_RE.test(it.user_id))) return send(res, 400, { code: "22P02", message: "invalid input syntax for type uuid" });
        out.push({ id: ++rateSeq, ip_hash: it.ip_hash, user_id: it.user_id ?? null, kind: it.kind, created_at: now });
      }
    }
    for (const r of out) if (!db[table].includes(r)) db[table].push(r);
    if (prefer.includes("return=representation")) return send(res, 201, out);
    res.writeHead(201, cors);
    return res.end();
  }

  if (req.method === "PATCH") {
    const body = await readBody(req);
    if (!body || typeof body !== "object") return send(res, 400, { message: "bad json" });
    const stray = Object.keys(body).find((k) => !COLUMNS[table].includes(k));
    if (stray) return send(res, 400, { code: "PGRST204", message: `Could not find the '${stray}' column of '${table}' in the schema cache` });
    const bad0 = unknown(filters.map(([k]) => k).filter((k) => !["or", "and", "not"].includes(k)));
    if (bad0) return badCol(bad0);
    const hit = db[table].filter((r) => matches(r, filters));
    for (const r of hit) {
      const merged = { ...r, ...body };
      const bad = table === "listings" ? validListing(merged) : table === "profiles" ? validProfile(merged) : table === "posts" ? validPost(merged) : null;
      if (bad) return send(res, 400, { code: "23514", message: "check violation: " + bad });
    }
    for (const r of hit) {
      const old = { ...r };
      Object.assign(r, body);
      if (table !== "rate_events") touchOnUpdate(table, old, r);
    }
    if (prefer.includes("return=representation")) return send(res, 200, hit);
    res.writeHead(204, cors);
    return res.end();
  }

  if (req.method === "DELETE") {
    const hit = db[table].filter((r) => matches(r, filters));
    db[table] = db[table].filter((r) => !hit.includes(r));
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
  let m;
  if ((m = /^\/object\/upload\/sign\/([^/]+)\/(.+)$/.exec(rel))) {
    const bucket = BUCKETS[m[1]];
    if (!bucket) return storErr(res, 404, "Bucket not found");
    const path = decodeURIComponent(m[2]);
    if (req.method === "POST") {
      if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
      if (!/^[0-9a-f-]{36}\/[a-z0-9-]+\.(webp|jpg)$/.test(path)) return storErr(res, 400, "Invalid path");
      const token = randomBytes(16).toString("hex");
      tokens.set(token, { bucket: m[1], path });
      return send(res, 200, { url: `/object/upload/sign/${m[1]}/${m[2]}?token=${token}` });
    }
    if (req.method === "PUT") {
      const token = url.searchParams.get("token");
      const t = token && tokens.get(token);
      if (!t || t.path !== path || t.bucket !== m[1]) return storErr(res, 403, "Invalid token");
      if ((req.headers["content-type"] || "").indexOf("multipart/form-data") === -1) return storErr(res, 400, "Expected multipart/form-data");
      const parts = parseMultipart(await readRaw(req), req.headers["content-type"]);
      const file = parts?.find((x) => x.name === "" && x.filename !== null);
      const cc = parts?.find((x) => x.name === "cacheControl");
      if (!file || !cc) return storErr(res, 400, "Missing file or cacheControl");
      if (file.data.length > bucket.limit) return storErr(res, 413, "The object exceeded the maximum allowed size");
      if (!MIMES.includes(file.type)) return storErr(res, 415, "mime type " + file.type + " is not supported");
      if (bucket.store.has(path)) return storErr(res, 409, "The resource already exists");
      bucket.store.set(path, { buf: file.data, type: file.type, at: Date.now() });
      tokens.delete(token);
      return send(res, 200, { Key: `${m[1]}/${path}` });
    }
  }
  if ((m = /^\/object\/public\/([^/]+)\/(.+)$/.exec(rel)) && (req.method === "GET" || req.method === "HEAD")) {
    const o = BUCKETS[m[1]]?.store.get(decodeURIComponent(m[2]));
    if (!o) return storErr(res, 404, "Object not found");
    res.writeHead(200, { "Content-Type": o.type, "Content-Length": o.buf.length, "Cache-Control": "public, max-age=3600", ...cors });
    return res.end(req.method === "HEAD" ? undefined : o.buf);
  }
  if ((m = /^\/object\/list\/([^/]+)$/.exec(rel)) && req.method === "POST") {
    const bucket = BUCKETS[m[1]];
    if (!bucket) return storErr(res, 404, "Bucket not found");
    if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
    const body = await readBody(req);
    const prefix = String(body?.prefix || "").replace(/\/?$/, "/");
    const limit = Number(body?.limit ?? 100), offset = Number(body?.offset ?? 0);
    const st = bucket.store;
    const names = [...st.keys()].filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes("/")).map((k) => k.slice(prefix.length)).sort();
    return send(res, 200, names.slice(offset, offset + limit).map((name) => ({ name, id: name, created_at: st.get(prefix + name).at ? new Date(st.get(prefix + name).at).toISOString() : undefined, metadata: { size: st.get(prefix + name).buf.length, mimetype: st.get(prefix + name).type } })));
  }
  if ((m = /^\/object\/([^/]+)$/.exec(rel)) && req.method === "DELETE") {
    const bucket = BUCKETS[m[1]];
    if (!bucket) return storErr(res, 404, "Bucket not found");
    if (!svcOk(req)) return storErr(res, 401, "Unauthorized");
    const body = await readBody(req);
    if (!Array.isArray(body?.prefixes)) return storErr(res, 400, "prefixes required");
    const gone = body.prefixes.filter((p) => bucket.store.delete(p));
    return send(res, 200, gone.map((name) => ({ name })));
  }
  return storErr(res, 404, "not found");
}

// ---------- auth users ----------
const normEmail = (e) => String(e ?? "").trim().toLowerCase();
const userJson = (u) => ({
  id: u.id, aud: "authenticated", role: "authenticated", email: u.email,
  email_confirmed_at: u.confirmed ? new Date().toISOString() : null,
  app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {},
  identities: [{ identity_id: u.id, provider: "email", id: u.id }],
});
const sessionFor = (u) => ({
  access_token: `tok-${u.email}`, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: `ref-${u.email}`, user: userJson(u),
});
const addUser = (email, password = null, confirmed = true) => {
  let u = users.get(email);
  if (!u) { u = { id: uuidFor(email), email, password: null, confirmed }; users.set(email, u); }
  if (password !== null) u.password = password;
  u.confirmed = confirmed;
  return u;
};
// Any "tok-<email>" token is valid and implies the user exists (so profiles can reference it).
// A JWT-shaped token "h.<base64url {sub,email}>.s" is valid too: it is what the real e-mail links put in the address (/__admin/link below),
// and the browser reads the user id and e-mail out of it.
const jwtLike = (email) => `h.${Buffer.from(JSON.stringify({ sub: uuidFor(email), email })).toString("base64url")}.s`;
const userFromBearer = (bearer) => {
  const m = /^tok-(.+@.+)$/.exec(bearer);
  if (m) return users.get(m[1]) ?? addUser(m[1]);
  const j = /^h\.([\w-]+)\.s$/.exec(bearer);
  if (!j) return null;
  try {
    const email = JSON.parse(Buffer.from(j[1], "base64url").toString()).email;
    return typeof email === "string" && email.includes("@") ? users.get(email) ?? addUser(email) : null;
  } catch { return null; }
};
const authErr = (res, status, error_code, msg, extra = {}) => send(res, status, { code: status, error_code, msg, ...extra });
const weak = (res) => authErr(res, 422, "weak_password", "Password should be at least 8 characters.", { weak_password: { reasons: ["length"] } });

async function auth(req, res, url) {
  const key = req.headers["apikey"];
  if (![ANON, SVC].includes(key)) return send(res, 401, { message: "No API key found" });
  const p = url.pathname;
  const bearer = (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
  const mailed = ["/auth/v1/signup", "/auth/v1/otp", "/auth/v1/recover", "/auth/v1/user"].includes(p) && req.method !== "GET";
  const passwordGrant = p === "/auth/v1/token" && url.searchParams.get("grant_type") === "password";
  if (authState.fail && (mailed || passwordGrant)) return authErr(res, authState.fail, authState.fail === 429 ? "over_request_rate_limit" : "unexpected_failure", "Request rate limit reached");

  if (p === "/auth/v1/signup" && req.method === "POST") {
    const body = await readBody(req);
    const email = normEmail(body?.email);
    if (!EMAIL_RE.test(email)) return authErr(res, 400, "email_address_invalid", `Email address "${email}" is invalid`);
    if (typeof body?.password !== "string" || body.password.length < 8) return weak(res);
    const redirect_to = url.searchParams.get("redirect_to");
    const existing = users.get(email);
    if (existing) {
      // Confirm email ON: Supabase hides that the address exists (obfuscated user, identities []). OFF: a clear error.
      if (authState.confirm) return send(res, 200, { ...userJson({ ...existing, id: randomUUID(), confirmed: false }), identities: [] });
      return authErr(res, 422, "user_already_exists", "User already registered");
    }
    const u = addUser(email, body.password, !authState.confirm);
    if (authState.confirm) {
      mails.push({ kind: "signup", email, redirect_to, at: Date.now() });
      return send(res, 200, userJson(u)); // no session until the address is confirmed
    }
    return send(res, 200, sessionFor(u));
  }
  if (p === "/auth/v1/otp" && req.method === "POST") {
    const body = await readBody(req);
    const email = normEmail(body?.email);
    if (!EMAIL_RE.test(email)) return authErr(res, 400, "validation_failed", "Unable to validate email address: invalid format");
    if (!users.has(email) && body.create_user === false) return authErr(res, 422, "otp_disabled", "Signups not allowed for otp");
    if (!users.has(email)) addUser(email, null, true);
    otpLog.push({ email, redirect_to: url.searchParams.get("redirect_to"), create_user: body.create_user, at: Date.now() });
    mails.push({ kind: "magiclink", email, redirect_to: url.searchParams.get("redirect_to"), at: Date.now() });
    return send(res, 200, {});
  }
  if (p === "/auth/v1/recover" && req.method === "POST") {
    const body = await readBody(req);
    const email = normEmail(body?.email);
    if (!EMAIL_RE.test(email)) return authErr(res, 400, "validation_failed", "Unable to validate email address: invalid format");
    mails.push({ kind: "recovery", email, redirect_to: url.searchParams.get("redirect_to"), known: users.has(email), at: Date.now() });
    return send(res, 200, {}); // same answer whether or not the address has an account
  }
  if (p === "/auth/v1/user" && req.method === "GET") {
    const u = userFromBearer(bearer);
    if (!u) return send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    return send(res, 200, userJson(u));
  }
  if (p === "/auth/v1/user" && req.method === "PUT") {
    const u = userFromBearer(bearer);
    if (!u) return send(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
    const body = await readBody(req);
    if (typeof body?.password !== "string") return authErr(res, 422, "validation_failed", "Nothing to update");
    if (body.password.length < 8) return weak(res);
    if (u.password === body.password) return authErr(res, 422, "same_password", "New password should be different from the old password.");
    u.password = body.password;
    return send(res, 200, userJson(u));
  }
  if (p === "/auth/v1/logout" && req.method === "POST") {
    if (!userFromBearer(bearer)) return send(res, 401, { msg: "invalid JWT" });
    res.writeHead(204, cors);
    return res.end();
  }
  if (p === "/auth/v1/token" && req.method === "POST" && url.searchParams.get("grant_type") === "refresh_token") {
    const body = await readBody(req);
    const m = /^ref-(.+@.+)$/.exec(body?.refresh_token || "");
    if (!m) return send(res, 400, { error: "invalid_grant", error_description: "Invalid Refresh Token" });
    return send(res, 200, sessionFor(users.get(m[1]) ?? addUser(m[1])));
  }
  if (passwordGrant) {
    const body = await readBody(req);
    const email = normEmail(body?.email);
    const u = users.get(email);
    if (!u || !u.password || u.password !== body?.password) return authErr(res, 400, "invalid_credentials", "Invalid login credentials");
    if (!u.confirmed) return authErr(res, 400, "email_not_confirmed", "Email not confirmed");
    return send(res, 200, sessionFor(u));
  }
  return send(res, 404, { msg: "not found" });
}

// ---------- sample data (MOCK_SEED=1 or /__admin/seed): fake people + approved ads on all four boards, with photos ----------
const ALNUM = "abcdefghijklmnopqrstuvwxyz0123456789";
const rid = () => Array.from(randomBytes(12), (b) => ALNUM[b % 36]).join("");
const DEMO_PASSWORD = "demo-pass-1234"; // a fake password for the fake demo accounts below; exists only inside this mock
const DEMO = {
  maryam: { email: "maryam.demo@example.com", first: "مریم", family: "نمونه", phone: "09120000001", avatar: true, show: true, address: "اصفهان، خیابان نمونه، پلاک ۱", verified: true },
  reza: { email: "reza.demo@example.com", first: "Reza", family: "Sample", phone: "09120000002", avatar: false, show: true, address: "Sample St 2, Kashan", verified: true },
  sara: { email: "sara.demo@example.com", first: "Sara", family: "Demo", phone: "09120000003", avatar: true, show: false, address: "Demo Road 3, Natanz", verified: false }, // hides her name and picture on ads
  nobody: { email: "no-profile.demo@example.com", first: null }, // has an account, never filled in a profile
};
function avatarBuf(pic) {
  try {
    const dir = mkdtempSync(join(tmpdir(), "mock-av-"));
    const src = join(dir, "src.jpg"), out = join(dir, "out.jpg");
    execFileSync("cp", [pic.file, src]);
    execFileSync("sips", ["-c", "600", "600", "-z", "96", "96", "-s", "format", "jpeg", "-s", "formatOptions", "55", src, "--out", out], { stdio: "ignore" });
    const b = readFileSync(out);
    rmSync(dir, { recursive: true, force: true });
    return b;
  } catch { return pic.buf; }
}
function seed() {
  const pics = ["market", "shop", "needs", "resources", "traditions", "tourism", "people", "stay", "history", "words"]
    .map((n) => join(ROOT, "public/illustrations", n + ".jpg")).filter(existsSync).map((file) => ({ file, buf: readFileSync(file) }));
  if (!pics.length) pics.push({ file: "", buf: Buffer.alloc(100, 1) });
  const who = {};
  let i = 0;
  for (const [k, d] of Object.entries(DEMO)) {
    const u = addUser(d.email, DEMO_PASSWORD, true);
    who[k] = u.id;
    if (d.first && !profileOf(u.id)) {
      let avatar = null;
      if (d.avatar) {
        avatar = rid().slice(0, 12) + ".jpg";
        BUCKETS.avatars.store.set(`${u.id}/${avatar}`, { buf: avatarBuf(pics[i % pics.length]), type: "image/jpeg", at: Date.now() });
      }
      const now = new Date().toISOString();
      db.profiles.push({ user_id: u.id, first_name: d.first, family_name: d.family, phone: d.phone, avatar, show_on_ads: d.show, role: "user", address: d.address, verified: d.verified === true, verified_at: d.verified ? now : null, created_at: now, updated_at: now });
    }
    i++;
  }
  const add = (o, n, owner) => {
    const id = randomUUID();
    const images = [];
    for (let k = 0; k < n; k++) {
      const name = rid() + ".jpg", buf = pics[(k + db.listings.length) % pics.length].buf;
      storage.set(`${id}/${name}`, { buf, type: "image/jpeg", at: Date.now() });
      storage.set(`${id}/${name.replace(".jpg", "-t.jpg")}`, { buf, type: "image/jpeg", at: Date.now() });
      images.push(name);
    }
    const now = Date.now();
    db.listings.push({
      id, board: "market", status: "approved", renewals: 0, contact_public: false, owner_id: owner, ip_hash: null,
      quantity: null, price: null, available: null, details: null, contact_kind: "phone", contact_value: "09121234567",
      created_at: new Date(now - (db.listings.length + 1) * 3600_000).toISOString(), updated_at: new Date(now).toISOString(),
      approved_at: new Date(now).toISOString(), expires_at: new Date(now + 25 * DAY).toISOString(), images, ...o,
    });
  };
  // market
  add({ type: "sell", category: "fruit", title: "گیلاس تازه از باغ سه", quantity: "۲۰۰ کیلو", price: "۱۲۰٬۰۰۰ تومان هر کیلو", area: "سه، باغ بالا", available: "تا آخر خرداد", details: "گیلاس درشت و شیرین، خودتان بچینید یا ما می‌چینیم." }, 6, who.maryam);
  add({ type: "sell", category: "nuts", title: "Walnuts, 2025 harvest", quantity: "50 kg", price: "450,000 toman per kg", area: "Soh", details: "Dry, hand-cracked on request." }, 3, who.reza);
  add({ type: "need", category: "labour", title: "دنبال دو نفر برای چیدن سیب", quantity: "۲ نفر", price: "روزی ۸۰۰٬۰۰۰ تومان", area: "سه", available: "از اول مهر", details: "ناهار با ماست." }, 0, who.sara);
  add({ type: "sell", category: "crafts", title: "قالی دستباف کاشان", quantity: "۱", price: "توافقی", area: "اصفهان", details: "شش متری، رنگ‌های سنتی.", contact_public: false }, 10, who.maryam);
  add({ type: "sell", category: "bread", title: "نان محلی تنوری", quantity: "هر روز", price: "۱۵٬۰۰۰ تومان", area: "سه، مرکز" }, 1, who.nobody);
  add({ type: "need", category: "other", title: "Looking for a used wheelbarrow", area: "Soh" }, 0, who.reza);
  // careers (quantity = arrangement code)
  add({ board: "careers", type: "hiring", category: "farm", title: "کارگر برای برداشت سیب", quantity: "seasonal", price: "روزی ۸۰۰٬۰۰۰ تومان", area: "سه", available: "از اول مهر", details: "ناهار با ماست." }, 0, who.maryam);
  add({ board: "careers", type: "seeking", category: "tourism", title: "Local guide, speaks English", quantity: "part", price: "Negotiable", area: "Soh and Meymeh", available: "Weekends" }, 1, who.reza);
  add({ board: "careers", type: "hiring", category: "craft", title: "شاگرد قالی‌باف", quantity: "full", area: "اصفهان", contact_public: false }, 2, who.sara);
  // needs
  add({ board: "needs", type: "need", category: "stay", title: "اتاق برای دو شب", quantity: "۲ نفر", area: "سه", available: "آخر هفته" }, 0, who.sara);
  add({ board: "needs", type: "offer", category: "transport", title: "Ride to Isfahan every Friday", quantity: "3 seats", price: "100,000 toman", area: "Soh to Isfahan", details: "Leaving at 8 am." }, 0, who.maryam);
  add({ board: "needs", type: "offer", category: "guide", title: "راهنمای گردش در باغ‌ها", area: "سه", details: "با چای و گردو." }, 2, who.nobody);
  // property
  add({ board: "property", type: "sell", category: "orchard", title: "باغ ۲۰۰۰ متری با آب", quantity: "۲۰۰۰ متر", price: "توافقی", area: "سه، پایین‌ده", available: "شش‌دانگ", details: "چاه آب دارد و راه ماشین‌رو." }, 6, who.maryam);
  add({ board: "property", type: "rent", category: "house", title: "Small house for rent, spring and summer", quantity: "60 m²", price: "8,000,000 toman per month", area: "Soh centre", available: "Full title", details: "Two rooms, courtyard." }, 4, who.reza);
  add({ board: "property", type: "need", category: "plot", title: "دنبال زمین برای باغ", quantity: "حدود ۱۰۰۰ متر", area: "سه یا میمه", contact_public: false }, 0, who.sara);
  add({ board: "property", type: "sell", category: "shop", title: "مغازه کنار میدان", quantity: "۲۰ متر", price: "۲ میلیارد تومان", area: "سه، میدان", available: "شش‌دانگ" }, 3, who.reza);
}
if (process.env.MOCK_SEED) seed();

// ---------- admin helpers (GET; tests and visual checks only) ----------
function admin(req, res, url) {
  const p = url.pathname;
  const sp = url.searchParams;
  const flag = (v) => v === "1" || v === "true";
  if (p === "/__admin/dump") {
    return send(res, 200, {
      listings: db.listings, rate_events: db.rate_events, profiles: db.profiles, posts: db.posts,
      users: [...users.values()].map((u) => ({ id: u.id, email: u.email, has_password: !!u.password, confirmed: u.confirmed })),
      otp: otpLog, mails, confirm_email: authState.confirm,
      storage: [...BUCKETS["listing-images"].store.keys()], avatars: [...BUCKETS.avatars.store.keys()], post_images: [...BUCKETS["post-images"].store.keys()],
    });
  }
  if (p === "/__admin/seed") { seed(); return send(res, 200, { ok: true, listings: db.listings.length }); }
  if (p === "/__admin/put-object") { // store an object directly: bucket (default listing-images), path, type, size, age_min
    const b = BUCKETS[sp.get("bucket") || "listing-images"];
    if (!b) return send(res, 404, { error: "no bucket" });
    b.store.set(sp.get("path"), { buf: Buffer.alloc(Number(sp.get("size") || 10), 1), type: sp.get("type") || "image/jpeg", at: Date.now() - Number(sp.get("age_min") || 0) * 60_000 });
    return send(res, 200, { ok: true });
  }
  if (p === "/__admin/reset") {
    db.listings.length = 0; db.rate_events.length = 0; db.profiles.length = 0; db.posts.length = 0; otpLog.length = 0; mails.length = 0; users.clear(); tokens.clear();
    for (const b of Object.values(BUCKETS)) b.store.clear();
    authState.fail = null;
    return send(res, 200, { ok: true });
  }
  if (p === "/__admin/clear-rate") { db.rate_events.length = 0; return send(res, 200, { ok: true }); }
  // Auth switches
  if (p === "/__admin/set-confirm") { authState.confirm = flag(sp.get("on")); return send(res, 200, { ok: true, confirm: authState.confirm }); } // Confirm email ON / OFF
  if (p === "/__admin/auth-fail") { authState.fail = sp.get("status") ? Number(sp.get("status")) : null; return send(res, 200, { ok: true, fail: authState.fail }); } // every signup/otp/recover/password call answers this status
  if (p === "/__admin/mkuser") { // email, password (optional), confirmed (default 1)
    const email = normEmail(sp.get("email"));
    const u = addUser(email, sp.get("password"), sp.get("confirmed") === null ? true : flag(sp.get("confirmed")));
    return send(res, 200, { id: u.id, email: u.email });
  }
  if (p === "/__admin/link") { // email, type (recovery|magiclink|signup): the address fragment an e-mail link lands on (JWT-shaped token, like the real thing)
    const email = normEmail(sp.get("email"));
    addUser(email, null, true);
    return send(res, 200, { hash: `#access_token=${jwtLike(email)}&refresh_token=ref-${email}&expires_in=3600&token_type=bearer&type=${sp.get("type") || "magiclink"}` });
  }
  if (p === "/__admin/confirm") { const u = users.get(normEmail(sp.get("email"))); if (!u) return send(res, 404, { error: "no user" }); u.confirmed = true; return send(res, 200, { ok: true }); }
  if (p === "/__admin/mkprofile") { // email, first, family, phone, avatar (file name), show (1|0), role (user|admin), address (default "Test Street 1, Test Town"; "none" = no address), verified (1|0): replaces any profile of that user
    const u = addUser(normEmail(sp.get("email")), null, true);
    db.profiles = db.profiles.filter((x) => x.user_id !== u.id);
    const now = new Date().toISOString();
    const row = { user_id: u.id, first_name: sp.get("first") || "Test", family_name: sp.get("family") || "User", phone: sp.get("phone") || "09120000000", avatar: sp.get("avatar") || null, show_on_ads: sp.get("show") === null ? true : flag(sp.get("show")), role: sp.get("role") || "user", address: sp.get("address") === "none" ? null : sp.get("address") || "Test Street 1, Test Town", verified: flag(sp.get("verified")), verified_at: flag(sp.get("verified")) ? now : null, created_at: now, updated_at: now };
    db.profiles.push(row);
    return send(res, 200, row);
  }
  if (p === "/__admin/set-profile") { // email, field, value ("null", "true", "false" understood)
    const u = users.get(normEmail(sp.get("email")));
    const row = u && profileOf(u.id);
    if (!row) return send(res, 404, { error: "no profile" });
    const v = sp.get("value");
    row[sp.get("field")] = v === "null" ? null : v === "true" ? true : v === "false" ? false : v;
    return send(res, 200, row);
  }
  const row = db.listings.find((r) => r.id === sp.get("id"));
  if (!row) return send(res, 404, { error: "no row" });
  if (p === "/__admin/approve") {
    const old = { ...row };
    row.status = "approved";
    touchOnUpdate("listings", old, row);
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
  .listen(PORT, () => console.log(`mock supabase on :${PORT}${process.env.MOCK_SEED ? `  (seeded; demo logins: *.demo@example.com / ${DEMO_PASSWORD})` : ""}`));
