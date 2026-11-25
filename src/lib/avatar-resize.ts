// Browser-only: turns any picked photo into a tiny round-profile picture (96x96 square, WebP or JPEG, <= 12 KB).
// Re-encoding through a canvas drops EXIF / GPS. Nothing here talks to the network.
import { AVATAR_MAX_BYTES, AVATAR_QUALITIES, AVATAR_SIZE, type AvatarExt } from "@/lib/profile";
import { MAX_ORIGINAL_BYTES, canWebp, decode, sniffKind, toBlob } from "@/lib/image-resize";

export type AvatarErrorCode = "not_image" | "unreadable" | "too_big_original" | "encode_failed" | "avatar_too_big";
export class AvatarError extends Error {
  code: AvatarErrorCode;
  constructor(code: AvatarErrorCode) {
    super(code);
    this.name = "AvatarError";
    this.code = code;
  }
}

export type ProcessedAvatar = { blob: Blob; ext: AvatarExt; /** object URL; the caller revokes it */ previewUrl: string; bytes: number };

export async function processAvatar(file: File): Promise<ProcessedAvatar> {
  if (sniffKind(file.name, file.type) === "no") throw new AvatarError("not_image");
  if (file.size > MAX_ORIGINAL_BYTES) throw new AvatarError("too_big_original");
  if (file.size === 0) throw new AvatarError("unreadable");
  let dec;
  try {
    dec = await decode(file);
  } catch {
    throw new AvatarError("unreadable");
  }
  const canvas = document.createElement("canvas");
  try {
    if (!dec.width || !dec.height) throw new AvatarError("unreadable");
    const side = Math.min(dec.width, dec.height); // centre-crop to a square
    const sx = Math.round((dec.width - side) / 2);
    const sy = Math.round((dec.height - side) / 2);
    canvas.width = canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new AvatarError("encode_failed");
    ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(dec.source, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  } finally {
    dec.close();
  }
  try {
    const ext: AvatarExt = (await canWebp()) ? "webp" : "jpg";
    const type = ext === "webp" ? "image/webp" : "image/jpeg";
    for (const q of AVATAR_QUALITIES) {
      const blob = await toBlob(canvas, type, q);
      if (!blob || blob.type !== type) throw new AvatarError("encode_failed");
      if (blob.size <= AVATAR_MAX_BYTES) return { blob, ext, previewUrl: URL.createObjectURL(blob), bytes: blob.size };
    }
    throw new AvatarError("avatar_too_big");
  } finally {
    canvas.width = canvas.height = 0;
  }
}
