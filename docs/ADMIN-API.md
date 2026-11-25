# Admin API (static key)

Scripts and scheduled jobs can call every `/api/admin/*` endpoint with one static key instead of a login.
The key is the environment variable `ADMIN_API_KEY` (24+ characters). Whoever holds it is an admin: keep it private.

## Set it up
1. Make a key: `openssl rand -base64 32`
2. Vercel > the project > Settings > Environment Variables > add `ADMIN_API_KEY` (Production, Sensitive), then redeploy.
3. Put the same value in the place that calls the API (never in the repo, never in chat).

To change or revoke it: set a new value in Vercel and redeploy. Without the variable (or shorter than 24 characters) the key does nothing.

## Calling
Every endpoint is `POST`, JSON body, header `Authorization: Bearer <ADMIN_API_KEY>`.

```bash
curl -s https://www.soh-village.site/api/admin/overview -X POST \
  -H "Authorization: Bearer $ADMIN_API_KEY" -H "Content-Type: application/json" -d '{}'
```

| Endpoint | Body | Does |
|---|---|---|
| `/api/admin/overview` | `{}` | counts of ads per status, users, admins, posts, drafts |
| `/api/admin/posts` | `{"action":"list","kind":"blog","published":false}` | list news / blog / events (drafts too) |
| | `{"action":"create","fields":{...}}` | create a post (draft unless `published: true`); `authorId` stays empty for key calls |
| | `{"action":"update","id":"<uuid>","fields":{...}}` | edit, publish (`published: true`), set `priority` |
| | `{"action":"delete","id":"<uuid>"}` | delete a post and its cover |
| | `{"action":"cover_sign","id":"<uuid>","ext":"webp"}` | signed upload URLs for a cover image, then `update` with `fields.cover` |
| `/api/admin/listings` | `{"action":"list","status":"approved","q":"text"}` | list ads (status: pending, approved, archived, rejected, removed, all) |
| | `{"action":"set_status","id":"<uuid>","status":"removed"}` | take an ad down (or restore it) |
| | `{"action":"update","id":"<uuid>","fields":{...}}` | fix an ad's text |
| `/api/admin/users` | `{"action":"list","q":"name","verified":false}` | list users (with private address) |
| | `{"action":"set_verified","userId":"<uuid>","verified":true}` | verified-seller badge on / off |

Post `fields`: `kind` (`news` | `blog` | `event`), `titleFa`, `titleEn`, `bodyFa`, `bodyEn` (Markdown), `priority` (`normal` | `featured` | `urgent`),
`published`, and for events `eventAt` (ISO date), `placeFa`, `placeEn`. Full contract: `src/lib/admin-types.ts`.

Roles (making someone an admin) are still changed only in Supabase.
