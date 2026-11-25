-- Migration 008: private address + verified seller + phone numbers no longer public. Safe to run more than once.
-- Run in Supabase > SQL Editor AFTER migration 007, and BEFORE the new site code goes live.
--   1. profiles.address      the poster's home address. Required by the site to post, NEVER shown to the public (only admins see it, to verify people).
--   2. profiles.verified     'verified seller' badge. Only an admin (admin page, or the Table Editor here) can turn it on.
--   3. public_listings view  no longer carries a phone / contact (contact_kind and contact_value are always null now; the site hands the
--                            number out only when a visitor taps "Show phone", through the server, rate limited) and gains poster_verified.
-- Existing profiles keep working but have no address yet: the site asks them to add it before their next post.

-- 1. Address ----------------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists address text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_address_check') then
    alter table public.profiles add constraint profiles_address_check check (address is null or char_length(address) between 5 and 200);
  end if;
end $$;

-- 2. Verified seller --------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.profiles add column if not exists verified_at timestamptz;

-- 3. Public view: contact columns stay (same names and types, so create or replace works) but are always null -------------
create or replace view public.public_listings as
  select l.id, l.type, l.category, l.title, l.quantity, l.price, l.area, l.available, l.details,
         null::text as contact_kind,
         null::text as contact_value,
         l.created_at, l.expires_at, l.images,
         l.board,
         case when p.show_on_ads then p.first_name end as poster_first_name,
         case when p.show_on_ads and p.avatar is not null then l.owner_id::text || '/' || p.avatar end as poster_avatar,
         coalesce(p.verified, false) as poster_verified
  from public.listings l
  left join public.profiles p on p.user_id = l.owner_id
  where l.status = 'approved' and (l.expires_at is null or l.expires_at > now());

revoke all on public.public_listings from anon, authenticated;
grant select on public.public_listings to anon, authenticated;

grant all on public.profiles to service_role;
