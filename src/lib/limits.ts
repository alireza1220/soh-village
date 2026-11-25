// SHARED CONTRACT. Hourly rate limits. Each protected call is logged in public.rate_events with the hashed IP and,
// when the caller is logged in, the user id (rate_events.user_id). A call is refused with 429 rate_limited when EITHER
// the per-IP or the per-user count of the same `kind` in the last hour is above its limit.
// IP limits are generous on purpose: many phones in Iran share one carrier IP. The user limits are the real budget.
// Owned by the architect.
export const RATE_KINDS = ["post", "manage", "images", "profile", "avatar", "admin"] as const;
export type RateKind = (typeof RATE_KINDS)[number];

export const LIMITS: Record<RateKind, { ip: number; user: number }> = {
  post: { ip: 30, user: 6 }, // POST /api/listings (create)
  manage: { ip: 120, user: 60 }, // POST /api/my/listings (list / update / renew / delete)
  images: { ip: 60, user: 12 }, // POST /api/listings/images (one call may sign up to 10 photos)
  profile: { ip: 600, user: 120 }, // POST /api/profile get / save (every full page load of a logged-in visitor does one get, and carrier IPs are shared, so this is high)
  avatar: { ip: 40, user: 10 }, // POST /api/profile avatar_sign
  admin: { ip: 600, user: 600 }, // every /api/admin/* call; only logged-in admins pass, the limit just stops a stuck loop
};
