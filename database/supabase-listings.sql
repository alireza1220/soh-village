-- Village market listings. NOT APPLIED. Use when hosting is decided and tested from inside Iran.
-- Works on Supabase or any Postgres. The public site reads only approved, unexpired rows.
create table if not exists listings (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('sell','need','service','seeking','hiring')),
  category     text not null,
  title        text not null check (char_length(title) <= 120),
  quantity     text,
  price        text,                       -- free text, e.g. '120,000 toman per kg'
  area         text not null,
  available    text,
  details      text check (char_length(details) <= 800),
  poster_name  text,                       -- never shown publicly
  contact_kind text,                       -- phone | telegram | whatsapp | other
  contact_value text,
  contact_public boolean not null default false,  -- the poster's permission to publish contact
  status       text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  created_at   timestamptz not null default now(),
  approved_at  timestamptz,
  expires_at   timestamptz                 -- set to approved_at + 30 days on approval
);

alter table listings enable row level security;

-- Public: read approved, unexpired listings, and only show contact if the poster agreed.
create view public_listings as
  select id, type, category, title, quantity, price, area, available, details,
         case when contact_public then contact_kind end  as contact_kind,
         case when contact_public then contact_value end as contact_value,
         created_at, expires_at
  from listings
  where status = 'approved' and (expires_at is null or expires_at > now());

create policy "anyone can read approved" on listings for select using (status = 'approved' and (expires_at is null or expires_at > now()));
-- Inserts go through a server route that rate-limits and validates; no public insert policy.
-- Approval (status, approved_at, expires_at) is done by the admin with the service role.
