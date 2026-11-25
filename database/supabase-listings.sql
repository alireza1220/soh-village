-- Village market listings for Supabase (free plan). Run once in Supabase > SQL Editor.
-- Rows arrive as 'pending' from the site's server route. Approve them in Table Editor by setting status = 'approved';
-- the trigger below then sets approved_at and a 30-day expiry. Only approved, unexpired rows are public,
-- and a contact is shown only if the poster agreed (contact_public).

create extension if not exists pgcrypto;

create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('sell','need','service','seeking','hiring')),
  category       text not null,
  title          text not null check (char_length(title) between 1 and 120),
  quantity       text check (char_length(quantity) <= 80),
  price          text check (char_length(price) <= 80),
  area           text not null check (char_length(area) <= 80),
  available      text check (char_length(available) <= 80),
  details        text check (char_length(details) <= 800),
  poster_name    text check (char_length(poster_name) <= 60),   -- never public
  contact_kind   text,
  contact_value  text check (char_length(contact_value) <= 60),
  contact_public boolean not null default false,                -- the poster's permission
  ip_hash        text,                                          -- spam control only, never public
  status         text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  created_at     timestamptz not null default now(),
  approved_at    timestamptz,
  expires_at     timestamptz,
  manage_hash    text unique,                                   -- HMAC-SHA256 of the manage code with a server secret; the code itself is never stored; never public
  owner_id       uuid,                                          -- auth.users id of a logged-in poster (no FK on purpose); never public
  renewals       int not null default 0,                        -- how many times the poster renewed the 30 days
  images         text[] not null default '{}',  -- ordered photo file names "<id>.<webp|jpg>", first = cover (see Photos in README)
  updated_at     timestamptz not null default now()             -- maintained by the listing_touch trigger
);

-- Upgrade path for tables created by an older version of this file (no-op on a fresh install).
alter table public.listings add column if not exists manage_hash text;
alter table public.listings add column if not exists owner_id    uuid;
alter table public.listings add column if not exists renewals    int not null default 0;
alter table public.listings add column if not exists updated_at  timestamptz not null default now();
alter table public.listings add column if not exists images text[] not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listings_images_max10') then
    alter table public.listings add constraint listings_images_max10 check (cardinality(images) <= 10);
  end if;
end $$;
create unique index if not exists listings_manage_hash_key on public.listings (manage_hash);
create index if not exists listings_owner_idx on public.listings (owner_id, created_at desc);

create index if not exists listings_status_idx on public.listings (status, expires_at);
create index if not exists listings_ip_idx on public.listings (ip_hash, created_at);

-- When an admin approves a row, start the 30-day clock.
create or replace function public.listing_on_approve() returns trigger language plpgsql as $$
begin
  -- Only the FIRST approval starts the 30-day clock. A re-approval after a poster edit keeps the old expiry,
  -- so edits cannot be used to dodge the renewal limit.
  if new.status = 'approved' and (old.status is distinct from 'approved') and old.approved_at is null then
    new.approved_at := now();
    new.expires_at  := now() + interval '30 days';
  end if;
  return new;
end $$;

drop trigger if exists listing_on_approve on public.listings;
create trigger listing_on_approve before update on public.listings
  for each row execute function public.listing_on_approve();

-- Keep updated_at current on every update. Named so it fires after listing_on_approve (triggers run alphabetically).
create or replace function public.listing_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists listing_touch on public.listings;
create trigger listing_touch before update on public.listings
  for each row execute function public.listing_touch();

-- Rate-limit log used by the server for manage-code attempts (kind = 'manage'). Only hashed IPs, never public.
create table if not exists public.rate_events (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  kind       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup_idx on public.rate_events (ip_hash, kind, created_at);

alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;
revoke all on sequence public.rate_events_id_seq from anon, authenticated;

-- Lock the base table: nobody but the server (service role) and you in the dashboard can read or write it.
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;

-- The public sees only this view. The column list is explicit on purpose: ip_hash, manage_hash, owner_id,
-- poster_name, renewals and updated_at are NOT selected, so they can never leak. Do not use select *.
-- Note: the view runs with its owner's rights, so anon can read it although the base table is locked.
-- The public sees only this view: approved, unexpired, and contact only if allowed.
create or replace view public.public_listings as
  select id, type, category, title, quantity, price, area, available, details,
         case when contact_public then contact_kind  end as contact_kind,
         case when contact_public then contact_value end as contact_value,
         created_at, expires_at, images
  from public.listings
  where status = 'approved' and (expires_at is null or expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

-- Photos: one PUBLIC bucket. Objects are written only through short-lived signed upload URLs that the site's server
-- hands out; there are deliberately NO policies on storage.objects, so anon cannot write, delete or list anything.
-- Public buckets still serve a file to anyone who knows its (unguessable) URL.
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
  on conflict (id) do update set public = true;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit')
     and exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets set file_size_limit = 614400, allowed_mime_types = array['image/webp','image/jpeg'] where id = 'listing-images';
  end if;
end $$;
