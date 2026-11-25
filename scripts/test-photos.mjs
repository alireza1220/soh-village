// Unit checks for the pure parts of the poster-side photo code (no browser needed).  node scripts/test-photos.mjs
import { register } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Tiny resolver: "@/x" -> src/x.ts and extensionless relative imports -> .ts, so Node can load the TypeScript sources directly.
const hook = `export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) return next(${JSON.stringify(pathToFileURL(join(ROOT, "src") + "/").href)} + spec.slice(2) + ".ts", ctx);
  return next(spec, ctx);
}`;
register("data:text/javascript," + encodeURIComponent(hook));

const { fitSize, sniffKind, QUALITY_STEPS, MAX_ORIGINAL_BYTES } = await import("../src/lib/image-resize.ts");
const { pendingUploads } = await import("../src/lib/photo-upload.ts");
const { FULL_MAX_EDGE, THUMB_MAX_EDGE } = await import("../src/lib/listing-images.ts");

let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; console.log("ok  ", m); };

const a = fitSize(4000, 3000, FULL_MAX_EDGE);
ok(a.width === 1280 && a.height === 960, "4000x3000 -> 1280x960");
const b = fitSize(3000, 4000, FULL_MAX_EDGE);
ok(b.width === 960 && b.height === 1280, "portrait 3000x4000 -> 960x1280");
const c = fitSize(200, 150, FULL_MAX_EDGE);
ok(c.width === 200 && c.height === 150, "small photo is never upscaled");
const d = fitSize(1280, 960, THUMB_MAX_EDGE);
ok(d.width === 400 && d.height === 300, "thumb from full: 1280x960 -> 400x300");
ok(fitSize(10000, 10, 400).height === 1, "extreme panorama keeps height >= 1");
ok(sniffKind("a.jpg", "image/jpeg") === "image", "jpeg is an image");
ok(sniffKind("IMG_1.HEIC", "") === "image", "HEIC with empty type is tried");
ok(sniffKind("a.svg", "image/svg+xml") === "no", "svg is refused");
ok(sniffKind("doc.pdf", "application/pdf") === "no", "pdf is refused");
ok(sniffKind("notes.txt", "") === "no", "text file is refused");
ok(QUALITY_STEPS[0] === 0.82 && QUALITY_STEPS.at(-1) === 0.55, "quality ladder 0.82 -> 0.55");
ok(MAX_ORIGINAL_BYTES === 30 * 1024 * 1024, "original limit 30 MB");

const blob = { size: 10 };
const items = [
  { kind: "stored", key: "s1", name: "aaaaaaaaaa.webp", thumbUrl: "" },
  { kind: "new", key: "n1", fileName: "x", state: "ready", full: blob, thumb: blob, ext: "webp" },
  { kind: "new", key: "n2", fileName: "y", state: "failed", full: blob, thumb: blob, ext: "jpg" },
  { kind: "new", key: "n3", fileName: "z", state: "uploaded", uploadedName: "bbbbbbbbbb.webp" },
  { kind: "new", key: "n4", fileName: "w", state: "error", error: "unreadable" },
  { kind: "new", key: "n5", fileName: "v", state: "preparing" },
];
ok(pendingUploads(items).map((i) => i.key).join() === "n1,n2", "only ready/failed photos with data are uploaded");
console.log(`\n${n} checks passed`);
