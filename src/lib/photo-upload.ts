// Poster-side photo upload: ask the server for signed URLs, PUT each blob straight to Supabase Storage (3 at a time, with
// progress and retries), then hand the ordered names to a `finalize` callback that saves them with the normal "update" action.
// Contract: src/lib/listing-images.ts. Browser-only.
import { MAX_IMAGES, type ImageExt } from "@/lib/listing-images";
import type { ProcessedImage } from "@/lib/image-resize";
import { postJson } from "@/components/listing-api";

/** One tile in the picker. Stored photos come from the listing; new ones are picked on this device. */
export type PhotoItem =
  | { kind: "stored"; key: string; name: string; thumbUrl: string }
  | {
      kind: "new";
      key: string;
      fileName: string;
      state: "preparing" | "ready" | "uploading" | "uploaded" | "failed" | "error";
      previewUrl?: string;
      bytes?: number;
      width?: number;
      height?: number;
      ext?: ImageExt;
      full?: Blob;
      thumb?: Blob;
      /** error code (see listing-api ERRORS) when state is failed or error */
      error?: string;
      /** name on the server once both files are uploaded */
      uploadedName?: string;
      /** 0..1 while uploading */
      progress?: number;
    };

export type NewPhoto = Extract<PhotoItem, { kind: "new" }>;
export const processedPatch = (p: ProcessedImage): Partial<NewPhoto> => ({
  state: "ready", previewUrl: p.previewUrl, bytes: p.bytes, width: p.width, height: p.height, ext: p.ext, full: p.full, thumb: p.thumb, error: undefined,
});

export type PhotoAuth = { code: string } | { token: string; listingId: string };
export type Progress = { phase: "sending" | "saving"; /** 1-based photo being sent */ index: number; total: number; /** 0..1 over all bytes */ fraction: number };
export type SaveResult = {
  /** names saved on the listing (only meaningful when finalize succeeded) */
  names: string[];
  failed: { key: string; error: string }[];
  /** set when the final save of the photo list did not work; uploaded photos stay uploaded for a retry */
  finalizeError?: string;
  finalized: boolean;
};

/** English "photo(s)" -> "photo" / "photos" for the number n (Persian has no plural form). */
export const plural = (s: string, n: number) => s.replace("photo(s)", n === 1 ? "photo" : "photos");

const keepName = (it: PhotoItem): string | null => (it.kind === "stored" ? it.name : it.uploadedName ?? null);
/** Items that still need to travel to the server. */
export const pendingUploads = (items: PhotoItem[]): NewPhoto[] =>
  items.filter((i): i is NewPhoto => i.kind === "new" && !i.uploadedName && (i.state === "ready" || i.state === "failed") && !!i.full && !!i.thumb && !!i.ext);

type SignedFile = { name: string; full: { url: string }; thumb: { url: string } };

export async function requestUploads(auth: PhotoAuth, exts: ImageExt[]): Promise<{ ok: true; files: SignedFile[] } | { ok: false; error: string }> {
  const body = "code" in auth ? { code: auth.code, items: exts.map((ext) => ({ ext })) } : { listingId: auth.listingId, items: exts.map((ext) => ({ ext })) };
  const r = await postJson("/api/listings/images", body, "token" in auth ? auth.token : undefined);
  const files = r.data.files;
  if (r.ok && Array.isArray(files) && files.length === exts.length) return { ok: true, files: files as SignedFile[] };
  return { ok: false, error: r.status === 429 ? "rate_limited" : (r.data.error as string) || (r.status === 0 ? "network" : "upload_failed") };
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((res) => {
    const t = setTimeout(res, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); res(); }, { once: true });
  });

function putOnce(url: string, blob: Blob, onProgress: (loaded: number) => void, signal?: AbortSignal): Promise<number> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData(); // same body supabase-js sends in uploadToSignedUrl
    form.append("cacheControl", "31536000");
    form.append("", blob);
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded); };
    xhr.onload = () => resolve(xhr.status);
    xhr.onerror = () => resolve(0);
    xhr.ontimeout = () => resolve(0);
    xhr.timeout = 120_000;
    const abort = () => { try { xhr.abort(); } catch { /* ignore */ } resolve(-1); };
    if (signal?.aborted) return resolve(-1);
    signal?.addEventListener("abort", abort, { once: true });
    xhr.send(form);
  });
}

/** PUT with 2 retries (0.8 s, 2 s). Returns an error code or null. A "file exists" answer on a retry counts as success. */
export async function uploadBlob(url: string, blob: Blob, onProgress: (loaded: number) => void, signal?: AbortSignal): Promise<string | null> {
  const waits = [800, 2000];
  for (let attempt = 0; attempt <= waits.length; attempt++) {
    onProgress(0);
    const status = await putOnce(url, blob, onProgress, signal);
    if (status === -1) return "aborted";
    if (status >= 200 && status < 300) { onProgress(blob.size); return null; }
    if (status === 409 && attempt > 0) { onProgress(blob.size); return null; }
    const retryable = status === 0 || status >= 500 || status === 408 || status === 429;
    if (!retryable || attempt === waits.length) return status === 0 ? "network" : "upload_failed";
    await sleep(waits[attempt], signal);
    if (signal?.aborted) return "aborted";
  }
  return "upload_failed";
}

/**
 * Uploads every new photo that is not on the server yet, then saves the whole ordered list through `finalize`.
 * - items: the picker's tiles in the poster's order (stored ones are kept, `error`/`preparing` ones are skipped).
 * - serverCount: how many photos the listing holds right now (so the server's 10-photo check is not tripped by tiles the poster removed but did not save yet).
 * Failed photos keep their tile (state "failed") so only they are retried; the photos that did arrive are still saved.
 */
export async function savePhotos(o: {
  auth: PhotoAuth | null;
  items: PhotoItem[];
  serverCount: number;
  finalize: (names: string[]) => Promise<{ ok: boolean; error?: string }>;
  onItem: (key: string, patch: Partial<NewPhoto>) => void;
  onProgress?: (p: Progress) => void;
  signal?: AbortSignal;
  /** skip the final save when nothing changed (the caller decides) */
  skipFinalizeIfUnchanged?: boolean;
  /** the finalize callback also saves other edits (text fields), so it must still run when signing failed */
  finalizeCarriesEdits?: boolean;
}): Promise<SaveResult> {
  const { items, onItem, onProgress, signal } = o;
  let serverCount = o.serverCount;
  const failed: { key: string; error: string }[] = [];
  const todo = pendingUploads(items);
  const current = () => items.filter((i) => i.kind === "stored" || !!i.uploadedName);
  const uploadedNow = new Map<string, string>(); // key -> name, for this run

  if (todo.length) {
    if (!o.auth) {
      todo.forEach((t) => { failed.push({ key: t.key, error: "unauthorized" }); onItem(t.key, { state: "failed", error: "unauthorized" }); });
    } else {
      // Make room first: tiles the poster removed still count on the server until the list is saved.
      if (serverCount + todo.length > MAX_IMAGES) {
        const names = current().map((i) => keepName(i)!);
        const r = await o.finalize(names);
        if (!r.ok) return { names: [], failed, finalizeError: r.error || "bad_images", finalized: false };
        serverCount = names.length;
      }
      const signedRes = await requestUploads(o.auth, todo.map((t) => t.ext!));
      if (!signedRes.ok) {
        todo.forEach((t) => { failed.push({ key: t.key, error: signedRes.error }); onItem(t.key, { state: "failed", error: signedRes.error }); });
        // Nothing was sent, so saving the list again would only spend a rate-limited call (unless finalize also carries other edits).
        if (!o.finalizeCarriesEdits) return { names: [], failed, finalizeError: signedRes.error, finalized: false };
      } else {
        const total = todo.reduce((n, t) => n + t.full!.size + t.thumb!.size, 0) || 1;
        const sent = new Map<string, number>();
        let finished = 0;
        let started = 0;
        const report = (index: number) => {
          let b = 0;
          sent.forEach((v) => (b += v));
          onProgress?.({ phase: "sending", index: Math.min(index, todo.length), total: todo.length, fraction: Math.min(1, b / total) });
        };
        report(1);
        let next = 0;
        const worker = async () => {
          while (next < todo.length && !signal?.aborted) {
            const i = next++;
            const t = todo[i];
            const file = signedRes.files[i];
            started++;
            onItem(t.key, { state: "uploading", progress: 0, error: undefined });
            const part = [0, 0];
            const upd = (n: number, loaded: number) => {
              part[n] = loaded;
              sent.set(t.key, part[0] + part[1]);
              onItem(t.key, { progress: (part[0] + part[1]) / (t.full!.size + t.thumb!.size) });
              report(finished + 1);
            };
            let err = await uploadBlob(file.thumb.url, t.thumb!, (l) => upd(0, l), signal);
            if (!err) err = await uploadBlob(file.full.url, t.full!, (l) => upd(1, l), signal);
            finished++;
            if (err) {
              if (err !== "aborted") failed.push({ key: t.key, error: err });
              onItem(t.key, { state: "failed", error: err === "aborted" ? undefined : err, progress: 0 });
            } else {
              uploadedNow.set(t.key, file.name);
              onItem(t.key, { state: "uploaded", uploadedName: file.name, progress: 1, full: undefined, thumb: undefined, error: undefined });
            }
            report(finished + 1);
          }
        };
        await Promise.all(Array.from({ length: Math.min(3, todo.length) }, worker));
        void started;
      }
    }
  }
  if (signal?.aborted) return { names: [], failed, finalized: false };

  // Final list = the poster's order: kept stored photos + everything that is on the server now.
  const names = items
    .map((i) => (i.kind === "stored" ? i.name : i.uploadedName ?? (i.kind === "new" ? uploadedNow.get(i.key) : undefined) ?? null))
    .filter((n): n is string => !!n);
  onProgress?.({ phase: "saving", index: todo.length, total: todo.length, fraction: 1 });
  const r = await o.finalize(names);
  if (!r.ok) return { names, failed, finalizeError: r.error || "bad_images", finalized: false };
  return { names, failed, finalized: true };
}
