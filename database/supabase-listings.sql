-- Village listings + accounts for Supabase (free plan). Run once in Supabase > SQL Editor. Safe to run again.
-- This file is the COMPLETE fresh-install end state and equals migrations 001-005 applied in order (see database/migrations/).
-- An existing database can run this file too: the upgrade blocks below bring older tables forward (it drops the retired
-- listings.manage_hash and listings.poster_name columns, which cannot be undone).
--
-- Everyone can LOOK at approved ads (view public_listings); every WRITE goes through the site's server routes, which need a
-- logged-in user. Rows arrive as 'pending'. Approve them in Table Editor by setting status = 'approved'; the trigger below then
-- sets approved_at and a 30-day expiry. Only approved, unexpired rows are public. A contact is shown only if the poster ticked
-- it for that ad (contact_public). The poster's first name and avatar are shown only if profiles.show_on_ads.
-- Rows you insert by hand in the Table Editor need an owner_id (any uuid) because of the listing_require_owner trigger.

create extension if not exists pgcrypto;

-- 1. Profiles: one row per auth user. Server only (service role). Phone is format-checked, NOT verified by SMS. -------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null check (char_length(first_name)  between 1 and 40),
  family_name text not null check (char_length(family_name) between 1 and 40),   -- never public
  phone       text not null check (phone ~ '^09[0-9]{9}$'),                       -- never public
  avatar      text check (avatar is null or avatar ~ '^[a-z0-9]{10,16}\.(webp|jpg)$'),  -- file name; object path is '<user_id>/<avatar>' in bucket 'avatars'
  show_on_ads boolean not null default true,                                      -- show first name + avatar on public ads
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.profile_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profile_touch on public.profiles;
create trigger profile_touch before update on public.profiles
  for each row execute function public.profile_touch();

alter table public.profiles enable row level security;          -- no policies = nobody but the server (service_role)
revoke all on public.profiles from anon, authenticated;

-- 2. Listings ---------------------------------------------------------------------------------------------------------
create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  board          text not null default 'market' check (board in ('market','careers','needs','property')),
  type           text not null check (type in ('sell','need','service','seeking','hiring','offer','rent')),
  category       text not null,
  title          text not null check (char_length(title) between 1 and 120),
  quantity       text check (char_length(quantity) <= 80),
  price          text check (char_length(price) <= 80),
  area           text not null check (char_length(area) <= 80),
  available      text check (char_length(available) <= 80),
  details        text check (char_length(details) <= 800),
  contact_kind   text,
  contact_value  text check (char_length(contact_value) <= 60),
  contact_public boolean not null default false,                -- the poster's permission (per ad)
  ip_hash        text,                                          -- spam control only, never public
  status         text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  created_at     timestamptz not null default now(),
  approved_at    timestamptz,
  expires_at     timestamptz,
  owner_id       uuid,                                          -- auth.users id of the poster (no FK on purpose); required on new rows (trigger); never public
  renewals       int not null default 0,                        -- how many times the poster renewed the 30 days
  images         text[] not null default '{}',  -- ordered photo file names "<id>.<webp|jpg>", first = cover (see Photos in README)
  updated_at     timestamptz not null default now()             -- maintained by the listing_touch trigger
);

-- Upgrade path for tables created by an older version of this file (no-op on a fresh install).
alter table public.listings add column if not exists owner_id    uuid;
alter table public.listings add column if not exists renewals    int not null default 0;
alter table public.listings add column if not exists updated_at  timestamptz not null default now();
alter table public.listings add column if not exists images text[] not null default '{}';
alter table public.listings add column if not exists board text not null default 'market';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listings_images_max10') then
    alter table public.listings add constraint listings_images_max10 check (cardinality(images) <= 10);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'listings_board_check') then
    alter table public.listings add constraint listings_board_check check (board in ('market','careers','needs','property'));
  end if;
end $$;
alter table public.listings drop constraint if exists listings_type_check;
alter table public.listings add constraint listings_type_check
  check (type in ('sell','need','service','seeking','hiring','offer','rent'));
-- Manage codes are retired: ownership is the logged-in user. The poster's name lives in profiles now.
drop index if exists public.listings_manage_hash_key;
alter table public.listings drop column if exists manage_hash;
alter table public.listings drop column if exists poster_name;

create index if not exists listings_owner_idx on public.listings (owner_id, created_at desc);
create index if not exists listings_status_idx on public.listings (status, expires_at);
create index if not exists listings_board_idx on public.listings (board, status, expires_at);
create index if not exists listings_ip_idx on public.listings (ip_hash, created_at);

-- owner_id is required on NEW rows (old rows may still be null, so this is a trigger, not NOT NULL).
create or replace function public.listing_require_owner() returns trigger language plpgsql as $$
begin
  if new.owner_id is null then
    raise exception 'listings.owner_id is required: a listing belongs to a logged-in user' using errcode = '23502';
  end if;
  return new;
end $$;

drop trigger if exists listing_require_owner on public.listings;
create trigger listing_require_owner before insert on public.listings
  for each row execute function public.listing_require_owner();

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

-- Rate-limit log used by the server (kinds: post, manage, images, profile, avatar). Hashed IP and, when logged in, the user id. Never public.
create table if not exists public.rate_events (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  user_id    uuid,
  kind       text not null,
  created_at timestamptz not null default now()
);
alter table public.rate_events add column if not exists user_id uuid;
create index if not exists rate_events_lookup_idx on public.rate_events (ip_hash, kind, created_at);
create index if not exists rate_events_user_idx on public.rate_events (user_id, kind, created_at);

alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;
revoke all on sequence public.rate_events_id_seq from anon, authenticated;

-- Lock the base table: nobody but the server (service role) and you in the dashboard can read or write it.
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;

-- The public sees only this view: approved, unexpired rows. The column list is explicit on purpose: ip_hash, owner_id,
-- phone, family name, renewals, status and updated_at are NOT selected, so they can never leak. Do not use select *.
-- New columns go at the END (create or replace view cannot reorder). poster_avatar is '<user id>/<file name>'.
-- Contact only if the poster allowed it for this ad; first name + avatar only if profiles.show_on_ads.
-- Note: the view runs with its owner's rights, so anon can read it although the base tables are locked.
create or replace view public.public_listings as
  select l.id, l.type, l.category, l.title, l.quantity, l.price, l.area, l.available, l.details,
         case when l.contact_public then l.contact_kind  end as contact_kind,
         case when l.contact_public then l.contact_value end as contact_value,
         l.created_at, l.expires_at, l.images,
         l.board,
         case when p.show_on_ads then p.first_name end as poster_first_name,
         case when p.show_on_ads and p.avatar is not null then l.owner_id::text || '/' || p.avatar end as poster_avatar
  from public.listings l
  left join public.profiles p on p.user_id = l.owner_id
  where l.status = 'approved' and (l.expires_at is null or l.expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

-- Photos: one PUBLIC bucket. Objects are written only through short-lived signed upload URLs that the site's server
-- hands out; there are deliberately NO policies on storage.objects, so anon cannot write, delete or list anything.
-- Public buckets still serve a file to anyone who knows its (unguessable) URL.
insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit')
     and exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets set file_size_limit = 614400, allowed_mime_types = array['image/webp','image/jpeg'] where id = 'listing-images';
    update storage.buckets set file_size_limit = 20480,  allowed_mime_types = array['image/webp','image/jpeg'] where id = 'avatars';
  else
    raise exception 'storage.buckets has no file_size_limit / allowed_mime_types columns: the photo and avatar size and type limits cannot be set. Upgrade the Supabase project.';
  end if;
end $$;

-- The server (secret / service_role key) needs its own grants on the locked tables. Without them every post fails
-- with "permission denied for table ..." (42501). Same as migrations/004 and 005.
grant usage on schema public to service_role;
grant all on public.listings    to service_role;
grant all on public.rate_events to service_role;
grant all on public.profiles    to service_role;
grant all on all sequences in schema public to service_role;
