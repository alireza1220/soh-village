import { IMAGE_BUCKET } from "@/lib/listing-images";
import { keyHeaders, type serverSupabase } from "@/lib/supabase";

// Server-only helpers for the "listing-images" bucket (Supabase Storage REST API, service key).
type Sb = NonNullable<ReturnType<typeof serverSupabase>>;
const base = (sb: Sb) => `${sb.url}/storage/v1`;
const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

/** Mints a one-time signed upload URL (absolute) for one object path, or null on failure. */
export async function signUpload(sb: Sb, path: string): Promise<string | null> {
  try {
    const res = await fetch(`${base(sb)}/object/upload/sign/${IMAGE_BUCKET}/${encPath(path)}`, {
      method: "POST",
      headers: { ...keyHeaders(sb.key), "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: unknown };
    if (typeof data.url !== "string" || !data.url.includes("token=")) return null;
    // storage-js does `storageUrl + data.url`; older servers may already include /storage/v1.
    const rel = data.url.startsWith("/storage/v1") ? data.url.slice("/storage/v1".length) : data.url;
    return /^https?:\/\//.test(data.url) ? data.url : `${base(sb)}${rel.startsWith("/") ? "" : "/"}${rel}`;
  } catch {
    return null;
  }
}

export type StoredObject = { name: string; size: number; mimetype: string; /** ms since it was created; null when storage did not say */ ageMs: number | null };

/** Objects directly under prefix (e.g. "<listing id>"), paging past 100 per call up to 5000. null = storage unreachable. */
export async function listObjects(sb: Sb, prefix: string): Promise<StoredObject[] | null> {
  const out: StoredObject[] = [];
  try {
    for (let offset = 0; offset < 5000; offset += 100) {
      const res = await fetch(`${base(sb)}/object/list/${IMAGE_BUCKET}`, {
        method: "POST",
        headers: { ...keyHeaders(sb.key), "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: "name", order: "asc" } }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const items = (await res.json()) as { name?: unknown; created_at?: unknown; metadata?: { size?: unknown; mimetype?: unknown } | null }[];
      for (const it of items) {
        if (typeof it.name !== "string") continue;
        const made = typeof it.created_at === "string" ? Date.parse(it.created_at) : NaN;
        out.push({
          name: it.name,
          size: typeof it.metadata?.size === "number" ? it.metadata.size : -1,
          mimetype: typeof it.metadata?.mimetype === "string" ? it.metadata.mimetype : "",
          ageMs: Number.isNaN(made) ? null : Date.now() - made,
        });
      }
      if (items.length < 100) break;
    }
    return out;
  } catch {
    return null;
  }
}

/** Removes objects by full path inside the bucket. Best effort; true when the call succeeded. */
export async function removeObjects(sb: Sb, paths: string[]): Promise<boolean> {
  if (!paths.length) return true;
  try {
    const res = await fetch(`${base(sb)}/object/${IMAGE_BUCKET}`, {
      method: "DELETE",
      headers: { ...keyHeaders(sb.key), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: paths }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
