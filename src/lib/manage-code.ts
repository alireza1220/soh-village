import { createHmac, randomInt } from "node:crypto";
import { secret } from "@/lib/secrets";

// Server-only. The code is shown to the poster once; only its keyed hash (HMAC) is stored.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // 31 chars, no 0 O 1 I L
const LENGTH = 12;

export function generateManageCode(): string {
  let s = "";
  for (let i = 0; i < LENGTH; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function normalizeManageCode(input: string): string | null {
  if (typeof input !== "string") return null;
  const s = input.toUpperCase().replace(/[\s-]+/g, "");
  if (s.length !== LENGTH) return null;
  for (const ch of s) if (!ALPHABET.includes(ch)) return null;
  return s;
}

// HMAC with a secret that lives only in the server environment, never in the database,
// so a database-only leak does not let anyone test guesses against the stored hashes.
export function hashManageCode(normalized: string): string {
  return createHmac("sha256", secret("MANAGE_CODE_SALT")).update(normalized).digest("hex");
}
