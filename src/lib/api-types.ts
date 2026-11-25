// SHARED CONTRACT. JSON shapes of the site's own API (request and response). Type-only file.
// Every route: POST, JSON body, header "Authorization: Bearer <Supabase access token>". Errors: { error: ErrorCode } (see api-errors.ts).
// Owned by the architect.
import type { BoardId } from "./boards";
import type { Profile } from "./profile";

/** A listing as its OWNER sees it (POST /api/my/listings). Built by publicRow() in listing-validation.ts. Never has ip_hash or owner_id. */
export type OwnListing = {
  id: string;
  board: BoardId;
  type: string;
  category: string;
  title: string;
  quantity: string | null;
  price: string | null;
  area: string | null;
  available: string | null;
  details: string | null;
  contactKind: string | null;
  contactValue: string | null;
  contactPublic: boolean;
  /** "approved" = LIVE (new ads go live at once, nobody checks them first); "archived" = hidden by the owner, can be restored; "pending" is legacy (no longer created); "rejected" / "removed" = taken down. */
  status: "pending" | "approved" | "archived" | "rejected" | "removed";
  createdAt: string | null;
  expiresAt: string | null;
  renewals: number;
  /** ordered photo file names, first = cover (see listing-images.ts) */
  images: string[];
};

/** Fields of a listing as the browser sends them (create: all of board/type/category/title required; update: any subset, never board). */
export type ListingFields = {
  board?: BoardId; // create only
  type?: string;
  category?: string;
  title?: string;
  quantity?: string;
  price?: string;
  area?: string;
  available?: string;
  details?: string;
  /** "phone" | "telegram" | "whatsapp" | "other". Omitted on create = the profile phone as "phone". */
  contactKind?: string;
  contactValue?: string;
  /** show the contact on the public ad (default false) */
  contactPublic?: boolean;
  /** update only: the full ordered list of photo file names the listing should have */
  images?: string[];
};

// POST /api/listings            body ListingFields (board required)        -> { ok: true, id }   the ad is LIVE at once (status approved, expires in 30 days); admins can still take it down
// POST /api/listings/images     body { listingId, items: {ext: "webp"|"jpg"}[] } -> { ok: true, files: SignedPhoto[] }
// POST /api/my/listings         body { action: "list" }                    -> { ok: true, listings: OwnListing[] }
//                               body { action: "update", id, fields: ListingFields } -> { ok: true, listing: OwnListing }
//                               body { action: "renew" | "delete" | "archive" | "unarchive", id }    -> { ok: true, listing?: OwnListing }
//                                 archive: approved -> archived (hidden, photos kept); unarchive: archived -> approved (an already expired ad needs a renewal slot: 409 cannot_renew otherwise)
// POST /api/listings/contact    body { id }  (PUBLIC, no login, rate limited per IP, kind "reveal")
//                               -> { ok: true, contact: { kind: "phone", value: "09XXXXXXXXX" } }  the poster's CURRENT profile phone, only for an approved, unexpired ad.
//                                  404 not_found (unknown / not public ad), 429 rate_limited, 503 not_configured. The phone is never in any public listing response.
// POST /api/profile             body { action: "get" }                     -> { ok: true, profile: Profile | null }
//                               body { action: "save", fields: ProfileFields } -> { ok: true, profile: Profile }
//                               body { action: "avatar_sign", ext }        -> { ok: true, name, upload: SignedUpload }
export type SignedUpload = { url: string; method: "PUT" };
export type SignedPhoto = { name: string; full: SignedUpload; thumb: SignedUpload };

/** Body of {action:"save"}. Create (no row yet): firstName, familyName, phone, address required. Update: any subset. avatar: file name | null (remove). */
export type ProfileFields = Partial<Pick<Profile, "firstName" | "familyName" | "phone" | "address" | "showOnAds" | "avatar">>;
