# Secrets guide (for the site owner)

A secret is a value that lets someone act as the website: write to the database, read private rows, or sign things. If a secret leaks, anyone can do that. This page explains which values are secret, where to keep them, and how to add your own.

## 1. What is secret and what is public

| Variable | Public or secret | Where it lives | What it does |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Vercel env vars, `.env.local` | Address of your Supabase project. Sent to every visitor's browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (by design) | Vercel env vars, `.env.local` | Lets the browser read the public view `public_listings` and request email login links. Safe because database rules (RLS) block everything else. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Vercel env vars (Sensitive), `.env.local` | Full access to the database, ignoring RLS. Used only by server routes: `/api/listings`, `/api/listings/manage`, `/api/my/listings` and `/api/keepalive` (cleanup). |
| `IP_HASH_SALT` | **Secret** | Vercel env vars, `.env.local` | Mixed into visitors' IP addresses before hashing, for the rate limit. Production needs 32+ characters or the routes answer 503. |
| `MANAGE_CODE_SALT` | **Secret** | Vercel env vars, `.env.local` | Key for the HMAC hash of manage codes (the key never goes in the database). Production needs 32+ characters or the routes answer 503. Changing it invalidates every existing manage code. |
| `CRON_SECRET` | **Secret** | Vercel env vars, `.env.local` | Proves that a call to `/api/keepalive` comes from the Vercel cron job. Required: without it the route answers 401. |
| SMTP / email-service keys (Resend, Brevo) | **Secret** | Supabase dashboard only | Used by Supabase to send login emails. Not part of this repo. See section 7. |

Rule of thumb: anything starting with `NEXT_PUBLIC_` is copied into the browser code and visible to everyone. Never put a secret in such a variable.

## 2. Where to find the Supabase values

In the Supabase dashboard open your project, then Project Settings and the API section (the label may be "API" or "API Keys" depending on the dashboard version):

- Project URL: use as `NEXT_PUBLIC_SUPABASE_URL`.
- `anon` public key: use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `service_role` key: use as `SUPABASE_SERVICE_ROLE_KEY`. Treat it like a master password. Never paste it in chat, email, a screenshot or a commit.

The salts and `CRON_SECRET` are not from Supabase. Make them yourself: any long random text. For example, in a terminal: `openssl rand -base64 32`.

## 3. Setting secrets on Vercel

Dashboard:
1. Open your project in Vercel, then Settings, then Environment Variables.
2. Enter the name (for example `MANAGE_CODE_SALT`) and the value.
3. Choose the environments: Production at least; Preview for test deployments (give it a different test value). Keep Development secrets in `.env.local` only.
4. For secrets in Production and Preview, turn on the **Sensitive** option if it is offered (Vercel may not allow it for Development). A sensitive value can no longer be read back in the dashboard afterwards, only replaced.
5. Save, then **redeploy**. Environment variables are read when a deployment is built, so a change does not affect an already running deployment.

Command line (needs the Vercel CLI and `vercel login` / `vercel link` once):

```
vercel env add MANAGE_CODE_SALT production
vercel env ls
vercel env rm MANAGE_CODE_SALT production
vercel --prod
```

`vercel env add NAME ENVIRONMENT` asks you to type the value; it is not stored in your shell history that way. The last command redeploys to production (or use Redeploy in the dashboard). Check the CLI help (`vercel env --help`) if an option differs in your version.

## 4. Local development: `.env.local`

1. Copy `.env.example` to `.env.local` in the project folder.
2. Fill in real values.
3. Run `npm run dev`. Restart it after any change to `.env.local`.

`.env.local` must never be committed. Check that `.gitignore` lists `.env*` (Next.js projects normally do) and that `git status` never shows `.env.local`. Only `.env.example`, with fake values, is committed.

## 5. Adding a new secret of your own

Example: a key for a weather service called `WEATHER_API_KEY`.

1. Add a line to `.env.example` with a fake value and a comment:
   ```
   # Secret, server only. Key for the weather service.
   WEATHER_API_KEY=your-weather-key
   ```
2. Put the real value in `.env.local` for local work.
3. Read it with `process.env.WEATHER_API_KEY` only in server code, such as a route handler. Never in a component marked `"use client"`, and never with a `NEXT_PUBLIC_` prefix unless the value is truly meant to be public.
   ```ts
   // src/app/api/weather/route.ts
   export async function POST() {
     const key = process.env.WEATHER_API_KEY;
     if (!key) return Response.json({ error: "not_configured" }, { status: 503 });
     const res = await fetch("https://api.example.com/weather", {
       headers: { Authorization: `Bearer ${key}` },
     });
     return Response.json(await res.json());
   }
   ```
   The browser calls `/api/weather`; only the server ever sees the key. Do not return the key or log it.
4. Add it in Vercel (section 3), choosing Sensitive and the right environments.
5. Redeploy.

## 6. Supabase Vault (database-level secrets)

Use the Supabase Vault when a secret must live inside the database itself, for example a key used by a database function or a scheduled SQL job. It stores secrets encrypted and lets SQL read them. For this site's normal needs (server routes) Vercel environment variables are enough, and simpler. See the Vault page in the Supabase documentation for the current steps.

## 7. Email-service keys (Resend or Brevo)

Login emails are sent by Supabase, not by this site. So the SMTP host, user and password or API key of Resend or Brevo are entered in the Supabase dashboard (Authentication settings, SMTP section), never in this repository or in Vercel. Details in `docs/LOGIN-SETUP.md`.

## 8. If a key leaks

1. **Supabase service role or anon key**: in Supabase, Project Settings, look for the JWT / API key settings and generate a new JWT secret or rotate the keys (the exact labels differ by dashboard version). This invalidates the old keys, and also signs out logged-in users. Then copy the new keys.
2. Update the values in Vercel and `.env.local`, then **redeploy**.
3. **Salts and `CRON_SECRET`**: set a new random value and redeploy. Warning: a new `MANAGE_CODE_SALT` makes all existing manage codes stop working (people can still log in, or you can edit rows in the Table Editor). A new `IP_HASH_SALT` only resets rate-limit history.
4. **Email-service key**: create a new key at Resend or Brevo, replace it in Supabase, delete the old key at the provider.
5. Check logs: Vercel project Logs for strange calls to `/api/*`, and Supabase logs and the `listings` table for rows you did not expect. Reject or remove any spam rows.
6. Find out how it leaked and fix that (see section 9).

## 9. GitHub rules

- Never commit real secrets, in any file, including docs and test files.
- Keep `.env.local` out of git. Commit only `.env.example` with fake values.
- Turn on secret scanning in the repository's Settings, Code security section (available on public repositories, and on private ones depending on your plan). GitHub also warns about known key formats.
- If you committed a secret by accident: treat it as leaked even if you delete it right away, because the history keeps it and bots scan quickly. First rotate the secret (section 8). Only then, optionally, remove it from history. Deleting the file in a new commit is not enough.

## 10. Rate limits and your IP header

The per-IP limits (5 posts per hour, 20 manage calls per hour) use the address Vercel sets (`x-vercel-forwarded-for` / `x-real-ip`; IPv6 is grouped by /64). This is trustworthy on Vercel. If you ever put a CDN or proxy (for example Cloudflare) in front of Vercel, or self-host, the limits must be re-based on that proxy's header in `clientIp()` in `src/lib/listing-actions.ts`, otherwise everyone shares one bucket or the header can be forged.

## 11. Checklist

- [ ] `NEXT_PUBLIC_*` variables contain only public values (URL and anon key).
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `MANAGE_CODE_SALT`, `CRON_SECRET` are set in Vercel for Production, marked Sensitive. The two salts are at least 32 characters (production refuses to run without).
- [ ] Salts are long random text, not the example values.
- [ ] `.env.local` is not tracked by git; `git status` is clean of secrets.
- [ ] Redeployed after every change to variables.
- [ ] SMTP key is only in Supabase, not in the repo.
- [ ] Secret scanning is on in GitHub.
- [ ] You know the rotation steps (section 8) and `MANAGE_CODE_SALT` is never changed casually.

## New-style Supabase keys (publishable and secret)

Newer Supabase projects show two keys that start with `sb_publishable_` and `sb_secret_`. They work here:

| Supabase shows | Put it in | Public? |
|---|---|---|
| publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes, it is meant for the browser |
| secret key (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` | **no, server only** |

The variable names still say "anon" and "service role" for historical reasons. The code (`keyHeaders` in `src/lib/supabase.ts`) sends the new keys in the `apikey` header only, because they are not JWTs; the older JWT-style keys (`eyJ...`) are still sent as before, so either kind works. Never paste a secret key in chat, in a commit, or into a variable that starts with `NEXT_PUBLIC_`.
