import { CONTACT_KINDS, LISTING_CATEGORIES, LISTING_TYPES } from "@/lib/market";

// Shared by POST /api/listings and the manage routes. No browser or Node-only APIs.
// Snake_case DB columns. Every field is optional so the same type serves inserts (all set by "create") and patches ("update").
export type ListingRow = {
  type?: string;
  category?: string;
  title?: string;
  quantity?: string | null;
  price?: string | null;
  area?: string;
  available?: string | null;
  details?: string | null;
  poster_name?: string | null;
  contact_kind?: string;
  contact_value?: string;
  contact_public?: boolean;
};

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const has = (b: Record<string, unknown>, k: string) => b[k] !== undefined;

export function parseListingInput(
  body: Record<string, unknown>,
  mode: "create" | "update",
): { ok: true; value: ListingRow } | { ok: false; error: string } {
  const b = body && typeof body === "object" ? body : {};
  const create = mode === "create";
  const v: ListingRow = {};
  const fail = (error: string) => ({ ok: false as const, error });

  if (create || has(b, "type")) {
    const type = clip(b.type, 20);
    if (!LISTING_TYPES.some((t) => t.v === type)) return fail("bad_type");
    v.type = type;
  }
  if (create || has(b, "category")) {
    const category = clip(b.category, 20);
    if (!LISTING_CATEGORIES.some((c) => c.v === category)) return fail("bad_category");
    v.category = category;
  }
  if (create || has(b, "title")) {
    const title = clip(b.title, 120);
    if (!title) return fail("title_required");
    v.title = title;
  }
  if (create || has(b, "area")) v.area = clip(b.area, 80) || "—";
  if (create || has(b, "quantity")) v.quantity = clip(b.quantity, 80) || null;
  if (create || has(b, "price")) v.price = clip(b.price, 80) || null;
  if (create || has(b, "available")) v.available = clip(b.available, 80) || null;
  if (create || has(b, "details")) v.details = clip(b.details, 800) || null;
  if (create || has(b, "posterName")) v.poster_name = clip(b.posterName, 60) || null;
  if (create || has(b, "contactPublic")) v.contact_public = b.contactPublic === true;

  if (create || has(b, "contactValue")) {
    const contactValue = clip(b.contactValue, 60);
    if (!contactValue) return fail("contact_required");
    v.contact_value = contactValue;
  }
  if (create || has(b, "contactKind") || v.contact_value) {
    // A contact value always needs a valid kind; in update mode send both together.
    const contactKind = clip(b.contactKind, 20);
    if (!CONTACT_KINDS.some((c) => c.v === contactKind)) return fail("bad_contact");
    v.contact_kind = contactKind;
  }
  return { ok: true, value: v };
}

// DB row -> public camelCase object. Never exposes ip_hash, manage_hash or owner_id.
export function publicRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    quantity: row.quantity ?? null,
    price: row.price ?? null,
    area: row.area,
    available: row.available ?? null,
    details: row.details ?? null,
    posterName: row.poster_name ?? null,
    contactKind: row.contact_kind,
    contactValue: row.contact_value,
    contactPublic: row.contact_public === true,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? null,
    renewals: typeof row.renewals === "number" ? row.renewals : 0,
  };
}
