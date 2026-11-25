// Browser-side photo preparation: decode, fix rotation, shrink, re-encode (this also drops EXIF / GPS), one photo at a time.
// The pure helpers at the top (fitSize, QUALITY_STEPS, sniffKind) have no browser dependencies and are unit-tested in scripts/test-photos.mjs.
import { FULL_MAX_EDGE, MAX_FILE_BYTES, THUMB_MAX_EDGE, type ImageExt } from "@/lib/listing-images";

export const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;
const MAX_PIXELS = 120_000_000; // refuse absurd dimensions (a 120 MP bitmap would exhaust a cheap phone)
export const START_QUALITY = 0.82;
export const QUALITY_STEPS = [0.82, 0.72, 0.63, 0.55] as const;
const SHRINK = 0.85;

export type PhotoErrorCode = "not_image" | "unreadable" | "too_big_original" | "encode_failed";
export class PhotoError extends Error {
  code: PhotoErrorCode;
  constructor(code: PhotoErrorCode) {
    super(code);
    this.name = "PhotoError";
    this.code = code;
  }
}

export type ProcessedImage = {
  full: Blob;
  thumb: Blob;
  ext: ImageExt;
  /** object URL of the thumbnail; the caller revokes it */
  previewUrl: string;
  width: number;
  height: number;
  /** size of the full file */
  bytes: number;
};

/** Scales (w,h) so the long edge is at most max. Never upscales. Always >= 1 px. */
export function fitSize(w: number, h: number, max: number): { width: number; height: number } {
  const long = Math.max(w, h);
  const k = long > max ? max / long : 1;
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

const IMG_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;
/** "image" = try to decode it, "no" = not a photo. Phones sometimes give an empty type (HEIC), so the name counts too. */
export function sniffKind(name: string, type: string): "image" | "no" {
  if (type === "image/svg+xml") return "no";
  if (type.startsWith("image/")) return "image";
  if (!type && IMG_EXT.test(name)) return "image";
  return "no";
}

// ---- browser part ----

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    let bmp: ImageBitmap | null = null;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try { bmp = await createImageBitmap(file); } catch { bmp = null; }
    }
    if (bmp) return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => { img.src = ""; } };
  } catch {
    throw new PhotoError("unreadable");
  } finally {
    // the bitmap/image already holds the pixels
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try { canvas.toBlob((b) => resolve(b), type, quality); } catch { resolve(null); }
  });
}

function draw(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new PhotoError("encode_failed");
  ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return c;
}

const free = (c: HTMLCanvasElement) => { c.width = 0; c.height = 0; };

/** Finds out once whether this browser really writes WebP (Safari silently gives PNG/JPEG instead). */
let webpOk: boolean | null = null;
async function canWebp(): Promise<boolean> {
  if (webpOk !== null) return webpOk;
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  const b = await toBlob(c, "image/webp", 0.8);
  free(c);
  return (webpOk = !!b && b.type === "image/webp");
}

/** Encodes until the file is <= MAX_FILE_BYTES: lower quality first, then shrink by 15% steps. Frees the canvas it was given. */
async function encodeUnder(
  first: HTMLCanvasElement,
  ext: ImageExt,
  minEdge: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const type = ext === "webp" ? "image/webp" : "image/jpeg";
  let canvas = first;
  for (let round = 0; round < 12; round++) {
    for (const q of QUALITY_STEPS) {
      const blob = await toBlob(canvas, type, q);
      if (!blob) { free(canvas); throw new PhotoError("encode_failed"); }
      if (blob.size <= MAX_FILE_BYTES) {
        const out = { blob, width: canvas.width, height: canvas.height };
        free(canvas);
        return out;
      }
    }
    // still too big at the lowest quality: scale down 15% and try again
    const w = Math.max(minEdge, Math.round(canvas.width * SHRINK));
    const h = Math.max(1, Math.round(canvas.height * SHRINK));
    if (w >= canvas.width && h >= canvas.height) break;
    const next = draw(canvas, w, h);
    free(canvas);
    canvas = next;
  }
  free(canvas);
  throw new PhotoError("encode_failed");
}

/** Decodes a picked file and returns the full-size and thumbnail blobs, ready to upload. Call it for ONE file at a time. */
export async function processImage(file: File): Promise<ProcessedImage> {
  if (sniffKind(file.name, file.type) === "no") throw new PhotoError("not_image");
  if (file.size > MAX_ORIGINAL_BYTES) throw new PhotoError("too_big_original");
  if (file.size === 0) throw new PhotoError("unreadable");

  const dec = await decode(file);
  try {
    if (!dec.width || !dec.height || dec.width * dec.height > MAX_PIXELS) throw new PhotoError("unreadable");
    const ext: ImageExt = (await canWebp()) ? "webp" : "jpg";

    const f = fitSize(dec.width, dec.height, FULL_MAX_EDGE);
    const fullCanvas = draw(dec.source, f.width, f.height);
    dec.close(); // the big decoded bitmap is no longer needed
    // The thumbnail is cut from the full canvas (1280 -> 400), cheaper and smoother than from the camera original.
    const t = fitSize(f.width, f.height, THUMB_MAX_EDGE);
    const thumbCanvas = draw(fullCanvas, t.width, t.height);
    const thumb = await encodeUnder(thumbCanvas, ext, 64);
    const full = await encodeUnder(fullCanvas, ext, 320);
    return {
      full: full.blob,
      thumb: thumb.blob,
      ext,
      previewUrl: URL.createObjectURL(thumb.blob),
      width: full.width,
      height: full.height,
      bytes: full.blob.size,
    };
  } finally {
    dec.close();
  }
}
