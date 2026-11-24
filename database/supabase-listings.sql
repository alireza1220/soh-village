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
  expires_at     timestamptz
);

create index if not exists listings_status_idx on public.listings (status, expires_at);
create index if not exists listings_ip_idx on public.listings (ip_hash, created_at);

-- When an admin approves a row, start the 30-day clock.
create or replace function public.listing_on_approve() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    new.approved_at := now();
    new.expires_at  := now() + interval '30 days';
  end if;
  return new;
end $$;

drop trigger if exists listing_on_approve on public.listings;
create trigger listing_on_approve before update on public.listings
  for each row execute function public.listing_on_approve();

-- Lock the base table: nobody but the server (service role) and you in the dashboard can read or write it.
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;

-- The public sees only this view: approved, unexpired, and contact only if allowed.
create or replace view public.public_listings as
  select id, type, category, title, quantity, price, area, available, details,
         case when contact_public then contact_kind  end as contact_kind,
         case when contact_public then contact_value end as contact_value,
         created_at, expires_at
  from public.listings
  where status = 'approved' and (expires_at is null or expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;
