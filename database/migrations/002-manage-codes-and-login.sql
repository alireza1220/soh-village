-- Migration 002: manage codes, optional login, renewals, rate log.
-- For installs that already ran the OLD database/supabase-listings.sql. Safe to run more than once.
-- Run in Supabase > SQL Editor.

-- 1. New columns on the locked base table.
alter table public.listings add column if not exists manage_hash text;                         -- sha256(code + salt); never public
alter table public.listings add column if not exists owner_id    uuid;                         -- auth.users id of a logged-in poster; never public
alter table public.listings add column if not exists renewals    int not null default 0;      -- number of 30-day renewals
alter table public.listings add column if not exists updated_at  timestamptz not null default now();

-- 2. Indexes: unique manage_hash (nulls allowed, old rows have none) and owner lookups for "My listings".
create unique index if not exists listings_manage_hash_key on public.listings (manage_hash);
create index if not exists listings_owner_idx on public.listings (owner_id, created_at desc);

-- 3. Keep updated_at current on every update.
create or replace function public.listing_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists listing_touch on public.listings;
create trigger listing_touch before update on public.listings
  for each row execute function public.listing_touch();

-- 4. Rate-limit log (hashed IPs only), locked like the base table.
create table if not exists public.rate_events (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  kind       text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup_idx on public.rate_events (ip_hash, kind, created_at);

alter table public.rate_events enable row level security;      -- no policies = no access for anon/authenticated
revoke all on public.rate_events from anon, authenticated;
revoke all on sequence public.rate_events_id_seq from anon, authenticated;

-- 5. Re-assert the lock-down on the base table (harmless if already set).
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;

-- 6. The public view is deliberately NOT changed: it lists explicit columns only, so the new columns
--    (manage_hash, owner_id, renewals, updated_at) are never exposed. Re-create it identically to be sure.
create or replace view public.public_listings as
  select id, type, category, title, quantity, price, area, available, details,
         case when contact_public then contact_kind  end as contact_kind,
         case when contact_public then contact_value end as contact_value,
         created_at, expires_at
  from public.listings
  where status = 'approved' and (expires_at is null or expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

-- Optional housekeeping (run by hand now and then): delete rate log rows older than 2 days.
-- delete from public.rate_events where created_at < now() - interval '2 days';

-- 5. Re-approval after a poster edit keeps the original expiry (only the first approval starts the 30 days).
create or replace function public.listing_on_approve() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') and old.approved_at is null then
    new.approved_at := now();
    new.expires_at  := now() + interval '30 days';
  end if;
  return new;
end $$;
-- Note: manage codes are now stored as HMAC-SHA256 with MANAGE_CODE_SALT. Codes created by an earlier test build
-- (plain salted sha256) will not match; delete such test rows or let them expire.
