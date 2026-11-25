-- Migration 007: post priority (normal / featured / urgent) and one cover image per post. Safe to run more than once.
-- Run in Supabase > SQL Editor AFTER migration 006.
--   1. posts.priority   'normal' (default), 'featured' (second priority, shown lower on the home page) or 'urgent' (main news, top of the home page).
--   2. posts.cover      file name of the post's one image (stored in the public bucket 'post-images', admin uploads only).
--   3. bucket post-images   public, 600 KB per file, webp/jpeg only. No storage policies: uploads go through signed URLs from the server.
--   4. public_posts view    now also exposes priority and cover.

-- 1. Priority ---------------------------------------------------------------------------------------------------------
alter table public.posts add column if not exists priority text not null default 'normal';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_priority_check') then
    alter table public.posts add constraint posts_priority_check check (priority in ('normal', 'featured', 'urgent'));
  end if;
end $$;
create index if not exists posts_priority_idx on public.posts (priority, published_at desc) where published;

-- 2. Cover ------------------------------------------------------------------------------------------------------------
alter table public.posts add column if not exists cover text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_cover_check') then
    alter table public.posts add constraint posts_cover_check check (cover is null or cover ~ '^[a-z0-9]{10,16}\.(webp|jpg)$');
  end if;
end $$;

-- 3. Storage bucket ---------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true)
  on conflict (id) do update set public = true;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit')
     and exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets set file_size_limit = 614400, allowed_mime_types = array['image/webp','image/jpeg'] where id = 'post-images';
  else
    raise exception 'storage.buckets has no file_size_limit / allowed_mime_types columns: the image size and type limits cannot be set. Upgrade the Supabase project before running this migration.';
  end if;
end $$;

-- 4. Public view (new columns are appended at the END: create or replace view cannot reorder) --------------------------
create or replace view public.public_posts as
  select id, kind, title_fa, title_en, body_fa, body_en, event_at, place_fa, place_en, published_at, created_at, priority, cover
  from public.posts
  where published = true;

revoke all on public.public_posts from anon, authenticated;
grant select on public.public_posts to anon, authenticated;

grant all on public.posts to service_role;
