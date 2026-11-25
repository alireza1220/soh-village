// Server-only. Reads the hashing secret. In production it MUST be set (32+ characters);
// otherwise the routes answer 503 not_configured instead of silently using a public default.
// MANAGE_CODE_SALT is retired (manage codes no longer exist); it may be deleted from the environment.
const MIN_LEN = 32;
const DEV_DEFAULTS = { IP_HASH_SALT: "soh" } as const;

export function secret(name: keyof typeof DEV_DEFAULTS): string {
  const v = process.env[name];
  if (process.env.NODE_ENV === "production") {
    if (!v || v.length < MIN_LEN) throw new Error(`${name} must be set (at least ${MIN_LEN} characters) in production`);
    return v;
  }
  return v ?? DEV_DEFAULTS[name];
}

// True when the secret is usable in this environment.
export function secretsReady(): boolean {
  try {
    secret("IP_HASH_SALT");
    return true;
  } catch {
    return false;
  }
}
