// Test-only Supabase mock: just enough PostgREST + GoTrue for scripts/test-market.mjs. No dependencies.
// Usage: MOCK_PORT=54399 node scripts/mock-supabase.mjs
import http from "node:http";
import { createHash, randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT || process.env.PORT || 54399);
const SVC = "svc-key";
const ANON = "anon-key";
const DAY = 86_400_000;

const db = { listings: [], rate_events: [] };
let rateSeq = 0;
const otpLog = [];

const PUBLIC_COLS = ["id", "type", "category", "title", "quantity", "price", "area", "available", "details", "contact_kind", "contact_value", "created_at", "expires_at"];

const uuidFor = (email) => {
  const h = createHash("sha1").update(email).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
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
    if (op === "eq") {
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
  } else if (key !== SVC || bearer !== SVC) {
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
          id: randomUUID(), status: "pending", renewals: 0, contact_public: false, created_at: now, updated_at: now,
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
  if (p === "/__admin/dump") return send(res, 200, { listings: db.listings, rate_events: db.rate_events, otp: otpLog });
  if (p === "/__admin/reset") {
    db.listings.length = 0; db.rate_events.length = 0; otpLog.length = 0;
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
      return send(res, 404, { message: "not found" });
    } catch (e) {
      return send(res, 500, { message: String(e) });
    }
  })
  .listen(PORT, () => console.log(`mock supabase on :${PORT}`));
