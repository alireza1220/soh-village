// Third-party video / post as plain strings in the page language, so client components can take it without the data files.
// Kept apart from media.ts so client bundles do not pull in the video and post lists.
export type MediaItem = {
  id: string;
  kind: "video" | "post";
  platform: "youtube" | "facebook" | "instagram";
  title: string;
  /** Channel (YouTube) or account (posts). */
  source: string;
  note: string;
  /** The original, on its own site. */
  href: string;
  /** Embed address; for YouTube the video id is enough. */
  embed?: string;
  width?: number;
  height?: number;
  tall?: boolean;
  sections: string[];
};

export const platformName = (p: MediaItem["platform"]) => (p === "youtube" ? "YouTube" : p === "facebook" ? "Facebook" : "Instagram");
