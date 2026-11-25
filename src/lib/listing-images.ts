// Shared contract for listing photos. No browser-only or Node-only APIs, so server routes, client components and tests all import it.
//
// Storage: one PUBLIC Supabase Storage bucket "listing-images" (free plan: 1 GB total). Objects are written only through
// short-lived signed upload URLs that the server hands out after checking the poster's login (verified user id) and profile.
// Per photo two files are stored, named by an unguessable random id plus the extension the browser could encode:
//   <listing uuid>/<id>.<ext>      full size, long edge <= FULL_MAX_EDGE
//   <listing uuid>/<id>-t.<ext>    thumbnail, long edge <= THUMB_MAX_EDGE
// listings.images (text[]) holds the ordered file names ("<id>.<ext>"); the first one is the cover shown in lists.
export const MAX_IMAGES = 10;
export const IMAGE_BUCKET = "listing-images";
export const FULL_MAX_EDGE = 1280; // px
export const THUMB_MAX_EDGE = 400; // px
export const MAX_FILE_BYTES = 600 * 1024; // bucket limit per object; the client re-encodes until each file fits
export const IMAGE_EXTS = ["webp", "jpg"] as const;
export type ImageExt = (typeof IMAGE_EXTS)[number];

/** A stored photo's file name, e.g. "k3j9x0q2m7ab.webp". */
export const IMAGE_NAME_RE = /^[a-z0-9]{10,16}\.(webp|jpg)$/;
export const isImageName = (v: unknown): v is string => typeof v === "string" && IMAGE_NAME_RE.test(v);

/** Object path inside the bucket. */
export const imagePath = (listingId: string, name: string, kind: "full" | "thumb" = "full") =>
  `${listingId}/${kind === "thumb" ? name.replace(/\.(webp|jpg)$/, "-t.$1") : name}`;

/** Public URL of a stored photo. supabaseUrl = NEXT_PUBLIC_SUPABASE_URL without a trailing slash. */
export const imageUrl = (supabaseUrl: string, listingId: string, name: string, kind: "full" | "thumb" = "full") =>
  `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/${imagePath(listingId, name, kind)}`;

/** What the market UI renders. */
export type ListingImage = { full: string; thumb: string };

// Server routes (the sign step and finalising a listing's photos) answer with these error codes; the client maps them to words.
//   too_many_images (more than MAX_IMAGES in total) · bad_images (a name fails IMAGE_NAME_RE, a duplicate, or an object is missing in storage)
//   upload_failed (Supabase Storage refused or was unreachable)
