import { adminGate } from "@/lib/admin-server";
import { adminPostFromRow, isPostKind, parsePostInput } from "@/lib/posts";
import { failure, json, sbHeaders, UUID, type Row } from "@/lib/server-guard";

// POST /api/admin/posts  (admins only; see src/lib/admin-types.ts)  list / create / update / delete news, blog posts and events.
// The id, author_id, published_at and the dates of creation are never taken from the browser.
const writeHeaders = (h: Record<string, string>) => ({ ...h, "Content-Type": "application/json", Prefer: "return=representation" });

export async function POST(req: Request) {
  const ctx = await adminGate(req);
  if (ctx instanceof Response) return ctx;
  const { sb, user, body: b } = ctx;
  const base = `${sb.url}/rest/v1/posts`;
  const headers = sbHeaders(sb);
  try {
    if (b.action === "list") {
      if (b.kind !== undefined && b.kind !== null && b.kind !== "all" && !isPostKind(b.kind)) return json({ error: "bad_kind" }, 400);
      if (b.published !== undefined && b.published !== null && typeof b.published !== "boolean") return json({ error: "bad_fields" }, 400);
      let filter = "";
      if (isPostKind(b.kind)) filter += `&kind=eq.${b.kind}`;
      if (typeof b.published === "boolean") filter += `&published=eq.${b.published}`;
      const res = await fetch(`${base}?select=*${filter}&order=created_at.desc&limit=200`, { headers, cache: "no-store" });
      if (!res.ok) return failure("admin_posts_list", res);
      return json({ ok: true, posts: ((await res.json()) as Row[]).map(adminPostFromRow) });
    }

    if (b.action === "create") {
      const parsed = parsePostInput(b.fields, "create");
      if (!parsed.ok) return json({ error: parsed.error }, 400);
      const published = parsed.value.published === true;
      const row = { ...parsed.value, published, published_at: published ? new Date().toISOString() : null, author_id: user.id };
      const res = await fetch(base, { method: "POST", headers: writeHeaders(headers), body: JSON.stringify(row), cache: "no-store" });
      if (!res.ok) return failure("admin_posts_create", res);
      const rows = (await res.json()) as Row[];
      if (!rows[0]) return failure("admin_posts_create_empty");
      return json({ ok: true, post: adminPostFromRow(rows[0]) });
    }

    if (b.action === "update" || b.action === "delete") {
      const id = typeof b.id === "string" ? b.id : "";
      if (!UUID.test(id)) return json({ error: "not_found" }, 404);

      if (b.action === "delete") {
        const res = await fetch(`${base}?id=eq.${id}`, { method: "DELETE", headers: { ...headers, Prefer: "return=representation" }, cache: "no-store" });
        if (!res.ok) return failure("admin_posts_delete", res);
        if (!((await res.json()) as Row[]).length) return json({ error: "not_found" }, 404);
        return json({ ok: true });
      }

      const cur = await fetch(`${base}?select=*&id=eq.${id}&limit=1`, { headers, cache: "no-store" });
      if (!cur.ok) return failure("admin_posts_find", cur);
      const current = ((await cur.json()) as Row[])[0];
      if (!current) return json({ error: "not_found" }, 404);
      const parsed = parsePostInput(b.fields, "update", {
        kind: isPostKind(current.kind) ? current.kind : undefined,
        titleFa: String(current.title_fa ?? ""),
        titleEn: String(current.title_en ?? ""),
        eventAt: typeof current.event_at === "string" ? current.event_at : null,
      });
      if (!parsed.ok) return json({ error: parsed.error }, 400);
      const patch: Row = { ...parsed.value };
      // A post that is no longer an event carries no date, even when the form did not send eventAt.
      if ((parsed.value.kind ?? current.kind) !== "event" && current.event_at != null) patch.event_at = null;
      // published_at is set the first time the post goes public, and never moves after that.
      if (parsed.value.published === true && current.published_at == null) patch.published_at = new Date().toISOString();
      if (Object.keys(patch).length === 0) return json({ ok: true, post: adminPostFromRow(current) });
      const res = await fetch(`${base}?id=eq.${id}`, { method: "PATCH", headers: writeHeaders(headers), body: JSON.stringify(patch), cache: "no-store" });
      if (!res.ok) return failure("admin_posts_update", res);
      const row = ((await res.json()) as Row[])[0];
      if (!row) return json({ error: "not_found" }, 404);
      return json({ ok: true, post: adminPostFromRow(row) });
    }

    return json({ error: "bad_action" }, 400);
  } catch (e) {
    return failure("admin_posts_exception", undefined, e);
  }
}
