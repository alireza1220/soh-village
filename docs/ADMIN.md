# Admin area: how it works and how to use it

An admin is a normal account that you have marked as "admin" in Supabase. Admins get an extra area on the site where they can approve or remove ads, see all users, and write news, blog posts and events for the main page. Nobody can make themselves an admin from the website.

## 1. Run migration 006 (once)

1. Open Supabase, your project, then **SQL Editor**.
2. Open the file `database/migrations/006-admin-posts.sql`, copy everything, paste it into the editor, and press **Run**.
3. It is safe to run again later. It adds a `role` column to `profiles` (everyone starts as `user`), creates the `posts` table for news / blog / events, and creates the public view that shows only published posts.

## 2. Make someone an admin

The person must first sign up on the site and fill in their profile (name and phone). Then, in Supabase:

**With the mouse**
1. **Table Editor**, table **profiles**.
2. Find their row (look at the names and phone).
3. Change the **role** cell from `user` to `admin`, and save.

**With SQL** (SQL Editor). The `user_id` is the "UID" shown for the person under **Authentication > Users**:

```sql
update public.profiles set role = 'admin' where user_id = 'PASTE-THE-USER-ID-HERE';
```

It works at once. The person does not need to log in again; the next time they open the site they see the admin item.

## 3. Remove an admin

Same place, the other way round: set **role** back to `user`, or run

```sql
update public.profiles set role = 'user' where user_id = 'PASTE-THE-USER-ID-HERE';
```

From that moment the person is refused by every admin function.

## 4. What an admin can do

- **Listings:** see ads waiting for approval (or all ads), search them, filter by section, see who posted each one (name and phone, which the public never sees). Approve (30 days, a longer existing expiry is kept), reject, put back to pending, or remove (the photos are deleted too). Fix typos in an ad. Photos are not edited from here.
- **News, blog and events:** write, edit, publish, unpublish and delete. A post can be a draft first. Events have a date, time and place. Persian and English text are separate; one language is enough.
- **Users:** see everybody who has a profile, with phone, role and how many ads they have. Read only.
- **Overview:** counts of ads by status, users, admins and posts.

## 5. What is NOT possible from the site

- Making someone an admin, or removing an admin. Only you, in Supabase.
- Changing anyone's role in any way, even by sending a tricky request. No part of the site writes the role.
- Seeing passwords or email addresses (those stay inside Supabase Authentication).

## 6. Security model in 8 lines

1. The role lives only in the database column `profiles.role`; the browser is never trusted to say who is an admin.
2. Every admin call checks the login token, then reads the role from the database, every time (a removed admin is locked out immediately).
3. A logged-in person who is not an admin gets "403 forbidden" and no data; no profile at all is also 403.
4. The site's profile routes never write `role`; an extra `role` field in a save request is ignored.
5. The database only accepts `user` or `admin` in that column.
6. The `posts` table is closed to the public (no policies); only the server, using the secret service key, can read or write it.
7. The public sees posts only through the view `public_posts`: published rows, fixed columns, no drafts, no author.
8. Admin calls are rate limited per person and per IP, and the author and publish date of a post are set by the server, never by the browser.

## 7. Checking it works

`node scripts/test-admin.mjs` runs the whole admin area against a fake Supabase (takes 1-2 minutes, starts its own servers on ports 3224 and 54397). The mock lives in `scripts/mock-supabase.mjs`.
