// Tiny shared SVG icons for post priorities. currentColor; decorative (aria-hidden) unless a title is given.
import type { PostPriority } from "@/lib/posts";

/** urgent = warning triangle, featured = star, normal = nothing. */
export function PriorityIcon({ priority, size = 18, title, className }: { priority: PostPriority; size?: number; title?: string; className?: string }) {
  if (priority === "normal") return null;
  const label = title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...label}
    >
      {title ? <title>{title}</title> : null}
      {priority === "urgent" ? (
        <>
          <path d="M12 3.5l9.5 16.5h-19z" />
          <path d="M12 10v4.5M12 17.4v.01" />
        </>
      ) : (
        <path d="M12 3.6l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.9 19.6l1-5.8-4.2-4.1 5.8-.8z" />
      )}
    </svg>
  );
}
