// Server-only. Reads the two hashing secrets. In production they MUST be set (32+ characters);
// otherwise the routes answer 503 not_configured instead of silently using a public default.
const MIN_LEN = 32;
const DEV_DEFAULTS = { MANAGE_CODE_SALT: "soh-dev-salt", IP_HASH_SALT: "soh" } as const;

export function secret(name: keyof typeof DEV_DEFAULTS): string {
  const v = process.env[name];
  if (process.env.NODE_ENV === "production") {
    if (!v || v.length < MIN_LEN) throw new Error(`${name} must be set (at least ${MIN_LEN} characters) in production`);
    return v;
  }
  return v ?? DEV_DEFAULTS[name];
}

// True when both secrets are usable in this environment.
export function secretsReady(): boolean {
  try {
    secret("MANAGE_CODE_SALT");
    secret("IP_HASH_SALT");
    return true;
  } catch {
    return false;
  }
}
