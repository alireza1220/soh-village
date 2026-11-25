import type { OwnListing } from "@/lib/api-types";
import { categoryAllowed, isArrangement, isBoard, typeAllowed, type BoardId } from "@/lib/boards";

// Shared by POST /api/listings and POST /api/my/listings. No browser or Node-only APIs.
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
  contact_kind?: string;
  contact_value?: string;
  contact_public?: boolean;
};

/** board: the board of the listing (create: the validated body board; update: the stored row's board).
 *  currentType / currentCategory: what the row already carries, still allowed on update (older names).
 *  profilePhone: the poster's profile phone, stored as the (private, legacy) contact of a NEW ad. */
export type ParseContext = { board: BoardId; currentType?: string; currentCategory?: string; profilePhone?: string };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const has = (b: Record<string, unknown>, k: string) => b[k] !== undefined;

/** The board a create body asks for, or null when it is missing or unknown. */
export const boardOf = (b: Record<string, unknown>): BoardId | null => (isBoard(b.board) ? b.board : null);

export function parseListingInput(
  body: Record<string, unknown>,
  mode: "create" | "update",
  ctx: ParseContext,
): { ok: true; value: ListingRow } | { ok: false; error: string } {
  const b = body && typeof body === "object" ? body : {};
  const create = mode === "create";
  const v: ListingRow = {};
  const fail = (error: string) => ({ ok: false as const, error });

  if (create || has(b, "type")) {
    const type = clip(b.type, 20);
    if (!typeAllowed(ctx.board, type, mode, ctx.currentType)) return fail("bad_type");
    v.type = type;
  }
  if (create || has(b, "category")) {
    const category = clip(b.category, 20);
    if (!categoryAllowed(ctx.board, category, mode, ctx.currentCategory)) return fail("bad_category");
    v.category = category;
  }
  if (create || has(b, "title")) {
    const title = clip(b.title, 120);
    if (!title) return fail("title_required");
    v.title = title;
  }
  if (create || has(b, "area")) v.area = clip(b.area, 80) || "—";
  if (create || has(b, "quantity")) {
    const q = clip(b.quantity, 80);
    // Careers: quantity holds the arrangement code (seasonal, part, full, once).
    if (ctx.board === "careers" && !isArrangement(q)) return fail("bad_arrangement");
    v.quantity = q || null;
  }
  if (create || has(b, "price")) v.price = clip(b.price, 80) || null;
  if (create || has(b, "available")) v.available = clip(b.available, 80) || null;
  if (create || has(b, "details")) v.details = clip(b.details, 800) || null;
  // Contact: clients cannot choose it any more (contactKind / contactValue / contactPublic are ignored). A new ad stores the poster's
  // profile phone as a private, legacy contact; the real number is handed out by POST /api/listings/contact from the CURRENT profile.
  // An update never touches these columns.
  if (create && ctx.profilePhone) {
    v.contact_kind = "phone";
    v.contact_value = ctx.profilePhone;
    v.contact_public = false;
  }
  return { ok: true, value: v };
}

// DB row -> the owner's camelCase object (OwnListing). Never exposes ip_hash or owner_id.
export function publicRow(row: Record<string, unknown>): OwnListing {
  return {
    id: String(row.id),
    board: isBoard(row.board) ? row.board : "market",
    type: String(row.type ?? ""),
    category: String(row.category ?? ""),
    title: String(row.title ?? ""),
    quantity: (row.quantity as string | null) ?? null,
    price: (row.price as string | null) ?? null,
    area: (row.area as string | null) ?? null,
    available: (row.available as string | null) ?? null,
    details: (row.details as string | null) ?? null,
    contactKind: (row.contact_kind as string | null) ?? null,
    contactValue: (row.contact_value as string | null) ?? null,
    contactPublic: row.contact_public === true,
    status: row.status as OwnListing["status"],
    createdAt: (row.created_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    renewals: typeof row.renewals === "number" ? row.renewals : 0,
    images: Array.isArray(row.images) ? row.images.filter((x): x is string => typeof x === "string") : [],
  };
}
