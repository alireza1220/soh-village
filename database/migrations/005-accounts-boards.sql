-- Migration 005: accounts + profiles, one avatar per user, four boards, manage codes retired.
-- Safe to run more than once. Run in Supabase > SQL Editor. Run it BEFORE deploying the matching site version:
-- the new site code no longer knows the manage_hash / poster_name columns and needs the new ones.
--
-- BEFORE running: ads posted with a manage code have owner_id null and CANNOT be edited or deleted by their poster afterwards.
-- Check:  select count(*) from public.listings where owner_id is null and status in ('pending','approved');
-- Export what you need first (see docs/LOGIN-SETUP.md section 0). Take such an ad down by setting status = 'removed'.
--
-- What changes
--   1. public.profiles          one row per auth user (first name, family name, mobile, avatar file name, show_on_ads). Server only.
--   2. storage bucket 'avatars' public, 20 KB per object, webp/jpeg only, NO policies (writes only via server-signed URLs).
--   3. listings.board           'market' | 'careers' | 'needs' | 'property' (default 'market', so every old row is a market row).
--   4. listings.type            also allows 'offer' (needs board) and 'rent' (property board).
--   5. owner_id                 must be set on every NEW row (trigger); old rows without an owner stay as they are.
--   6. manage codes retired     drops listings.manage_hash (+ its index) and listings.poster_name (the poster is the profile now).
--   7. rate_events.user_id      per-user rate limit key next to the hashed IP.
--   8. public_listings          adds board, poster_first_name, poster_avatar (explicit columns; phone / family name / owner never exposed).
--   9. grants                   RLS on, revoked from anon/authenticated, EXPLICIT grants to service_role (without them: 42501 permission denied).

-- 1. Profiles ---------------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  first_name  text not null check (char_length(first_name)  between 1 and 40),
  family_name text not null check (char_length(family_name) between 1 and 40),   -- never public
  phone       text not null check (phone ~ '^09[0-9]{9}$'),                       -- never public; format-checked only, NOT verified by SMS
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

-- 2. Avatars bucket ---------------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit')
     and exists (select 1 from information_schema.columns where table_schema = 'storage' and table_name = 'buckets' and column_name = 'allowed_mime_types') then
    update storage.buckets set file_size_limit = 20480, allowed_mime_types = array['image/webp','image/jpeg'] where id = 'avatars';
  else
    raise exception 'storage.buckets has no file_size_limit / allowed_mime_types columns: the avatar size and type limits cannot be set. Upgrade the Supabase project before running this migration.';
  end if;
end $$;

-- 3 + 4. Boards and the two new types ----------------------------------------------------------------------------------
alter table public.listings add column if not exists board text not null default 'market';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'listings_board_check') then
    alter table public.listings add constraint listings_board_check check (board in ('market','careers','needs','property'));
  end if;
end $$;
alter table public.listings drop constraint if exists listings_type_check;
alter table public.listings add constraint listings_type_check
  check (type in ('sell','need','service','seeking','hiring','offer','rent'));
create index if not exists listings_board_idx on public.listings (board, status, expires_at);

-- 5. owner_id is required on new rows (old rows may still be null, so this is a trigger, not NOT NULL) ----------------
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

-- 6. Manage codes retired ---------------------------------------------------------------------------------------------
-- The view below does not use these columns, so they can go. poster_name was never public.
-- Dropping the column also drops its unique constraint and index (listings_manage_hash_key).
alter table public.listings drop column if exists manage_hash;
alter table public.listings drop column if exists poster_name;

-- 7. Per-user rate limit key ------------------------------------------------------------------------------------------
alter table public.rate_events add column if not exists user_id uuid;
create index if not exists rate_events_user_idx on public.rate_events (user_id, kind, created_at);

-- 8. Public view ------------------------------------------------------------------------------------------------------
-- New columns are appended at the END (create or replace view cannot reorder). poster_avatar is '<user id>/<file name>'.
-- Contact only if the poster allowed it for this ad; first name + avatar only if profiles.show_on_ads. Do not use select *.
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

-- 9. Grants: the server (secret / service_role key) needs its own grants on every new table --------------------------
grant usage on schema public to service_role;
grant all on public.listings    to service_role;
grant all on public.rate_events to service_role;
grant all on public.profiles    to service_role;
grant all on all sequences in schema public to service_role;
