/** Quiet line drawing for a section that has no photograph yet. */
export function SectionMark({ slug }: { slug: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center" style={{ color: "var(--accent)" }} aria-hidden>
      <span lang="fa" className="fa-display absolute text-7xl font-bold" style={{ opacity: 0.1 }}>سُه</span>
      <svg className="relative" width="64" height="64" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <Mark slug={slug} />
      </svg>
    </div>
  );
}

function Mark({ slug }: { slug: string }) {
  switch (slug) {
    case "people":
      return (
        <>
          <circle cx="36" cy="24" r="8" />
          <path d="M18 54c2.2-11 9-16 18-16s15.8 5 18 16" />
        </>
      );
    case "market":
      return (
        <>
          <path d="M16 30h40l-3.5 24H19.5L16 30z" />
          <path d="M24 30c0-8 5.4-14 12-14s12 6 12 14" />
        </>
      );
    case "stay":
      return (
        <>
          <path d="M12 34 36 16l24 18" />
          <path d="M18 32v22h36V32" />
          <path d="M32 54V42h8v12" />
        </>
      );
    case "shop":
      return (
        <>
          <path d="M36 30c8 0 16 6 16 16a16 16 0 1 1-32 0c0-10 8-16 16-16z" />
          <path d="M36 30c1-8 8-12 14-10" />
          <path d="M36 30c-1-6-6-9-9-7" />
        </>
      );
    case "stores":
      return (
        <>
          <path d="M14 32h44l-4 22H18L14 32z" />
          <path d="M22 32V24h28v8" />
          <path d="M32 40h8v14h-8z" />
        </>
      );
    case "hospital":
      return (
        <>
          <rect x="16" y="16" width="40" height="40" rx="6" />
          <path d="M36 26v20M26 36h20" />
        </>
      );
    case "words":
      return (
        <>
          <path d="M16 20h30a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H30l-10 8v-8h-4a8 8 0 0 1-8-8V28a8 8 0 0 1 8-8z" />
          <path d="M26 34h20M26 42h12" />
        </>
      );
    case "resources":
    case "references":
      return (
        <>
          <path d="M12 20h16c6 0 10 3 10 8v28c-6-4-10-4-14-4H12V20z" />
          <path d="M60 20H44c-6 0-10 3-10 8v28c6-4 10-4 14-4h12V20z" />
        </>
      );
    case "map":
      return (
        <>
          <path d="M14 22l16-8 14 8 14-8v36l-14 8-14-8-16 8V22z" />
          <path d="M30 14v36M44 22v36" />
        </>
      );
    case "tourism":
      return (
        <>
          <path d="M10 48l18-24 12 14 8-10 14 20" />
          <path d="M10 54h52" />
        </>
      );
    case "banks":
      return (
        <>
          <path d="M12 30 36 16l24 14" />
          <path d="M18 32v16M30 32v16M42 32v16M54 32v16" />
          <path d="M12 52h48" />
        </>
      );
    case "property":
      return (
        <>
          <rect x="16" y="18" width="28" height="36" rx="2" />
          <path d="M44 34h14v8a6 6 0 0 1-6 6H44" />
          <circle cx="52" cy="38" r="1.4" fill="currentColor" stroke="none" />
        </>
      );
    case "needs":
      return (
        <>
          <path d="M22 24h32M22 36h32M22 48h20" />
          <path d="M14 24l2.2 2.2L22 20.5M14 36l2.2 2.2L22 32.5M14 48l2.2 2.2L22 44.5" />
        </>
      );
    case "careers":
      return (
        <>
          <rect x="18" y="28" width="36" height="24" rx="3" />
          <path d="M28 28v-4a8 8 0 0 1 16 0v4" />
          <path d="M18 40h36" />
        </>
      );
    default:
      return <circle cx="36" cy="36" r="16" />;
  }
}
