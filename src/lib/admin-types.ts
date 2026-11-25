// SHARED CONTRACT for the admin area. Owned by the architect: builders must not edit this file.
// Every route below answers 401 unauthorized (no / bad token), 403 forbidden (valid user whose profiles.role is not 'admin'),
// 429 rate_limited, 400 with an error code from api-errors.ts, 404 not_found, 502 store_failed. The role is read from the
// database on EVERY call; nothing the browser sends can make a user an admin.
import type { OwnListing } from "@/lib/api-types";
import type { AdminPost, PostFields } from "@/lib/posts";
import type { Role } from "@/lib/profile";

export const LISTING_STATUSES = ["pending", "approved", "archived", "rejected", "removed"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export const isListingStatus = (v: unknown): v is ListingStatus => typeof v === "string" && (LISTING_STATUSES as readonly string[]).includes(v);

/** Who posted a listing, as only an admin sees it (the phone and family name are never public). */
export type AdminPoster = { userId: string; firstName: string; familyName: string; phone: string; verified: boolean } | null;

/** A listing as an admin sees it: every field of OwnListing plus the poster and the contact kept on the row. */
export type AdminListing = OwnListing & { poster: AdminPoster; approvedAt: string | null };

/** A user as an admin sees it. Email lives in Supabase Auth and is not copied here. */
export type AdminUser = {
  userId: string; firstName: string; familyName: string; phone: string;
  /** private home address (admins only); "" when the person has not given one yet */
  address: string;
  verified: boolean; verifiedAt: string | null;
  role: Role; createdAt: string; listingCount: number;
};

// POST /api/admin/overview   body {}  ->  { ok: true, counts: AdminCounts }
export type AdminCounts = {
  listings: Record<ListingStatus, number>;
  users: number;
  admins: number;
  posts: { news: number; blog: number; event: number; drafts: number };
};

// POST /api/admin/listings
//   body { action: "list", status?: ListingStatus | "all", board?: BoardId, q?: string, offset?: number }  (page size 50, newest first)
//        -> { ok: true, listings: AdminListing[], total: number }
//   body { action: "set_status", id, status: ListingStatus }
//        -> { ok: true, listing: AdminListing }   approved: the FIRST approval sets approved_at = now and expires_at = now + 30 days; a re-approval keeps both (unless expires_at is already past, then now + 30 days);
//                                                 removed: also deletes the photos from storage; rejected / pending: photos stay.
//   body { action: "update", id, fields: ListingFields }  -> { ok: true, listing: AdminListing }  (admin fixes typos; status is left alone)

// POST /api/admin/posts
//   body { action: "list", kind?: PostKind | "all", published?: boolean }  -> { ok: true, posts: AdminPost[] }  (newest first, max 200)
//   body { action: "create", fields: PostFields }                           -> { ok: true, post: AdminPost }
//   body { action: "update", id, fields: PostFields }                       -> { ok: true, post: AdminPost }
//   body { action: "delete", id }                                           -> { ok: true }
//   body { action: "cover_sign", id, ext: "webp"|"jpg" } -> { ok: true, name, full: SignedUpload, thumb: SignedUpload }  (admin only; signed PUT URLs for <id>/<name> and <id>/<name-t>, bucket post-images)
//   Then update { fields: { cover: name } } finalises: the server checks both objects exist (size <= 600 KB full / 150 KB thumb, webp or jpeg),
//   removes the previous cover's objects and any leftovers; { cover: null } removes the cover. delete also removes the cover objects.
//   fields.priority: "normal" | "featured" | "urgent" (any kind of post). The home page shows urgent posts as a top banner and featured ones as a lower band.
//   Publishing (published: true) sets published_at the first time only. author_id = the admin's user id on create.

// POST /api/admin/users
//   body { action: "list", q?: string, offset?: number }  (page size 50)  -> { ok: true, users: AdminUser[], total: number }
//   body { action: "set_verified", userId, verified: boolean } -> { ok: true, user: AdminUser }  (sets profiles.verified and verified_at = now / null; 404 not_found when there is no such profile)
//   body list also accepts { verified?: boolean } to filter. Roles are changed in Supabase (Table Editor > profiles > role), never here.
export type { AdminPost, PostFields };
