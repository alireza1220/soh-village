-- Migration 003: listing photos (up to 10 per listing). Safe to run more than once. Run in Supabase > SQL Editor.

-- 1. Ordered file names, first = cover. At most 10.
alter table public.listings add column if not exists images text[] not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listings_images_max10') then
    alter table public.listings add constraint listings_images_max10 check (cardinality(images) <= 10);
  end if;
end $$;

-- 2. Public view now also exposes images (explicit column list; secrets stay out).
create or replace view public.public_listings as
  select id, type, category, title, quantity, price, area, available, details,
         case when contact_public then contact_kind  end as contact_kind,
         case when contact_public then contact_value end as contact_value,
         created_at, expires_at, images
  from public.listings
  where status = 'approved' and (expires_at is null or expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

-- 3. Storage bucket: public, 600 KB per file, webp/jpeg only. No policies on storage.objects on purpose:
--    anon cannot write, delete or list. Uploads go through signed URLs from the site's server.
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
  on conflict (id) do update set public = true;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit')
     and exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets set file_size_limit = 614400, allowed_mime_types = array['image/webp','image/jpeg'] where id = 'listing-images';
  else
    raise exception 'storage.buckets has no file_size_limit / allowed_mime_types columns: the photo size and type limits cannot be set. Upgrade the Supabase project before running this migration.';
  end if;
end $$;
