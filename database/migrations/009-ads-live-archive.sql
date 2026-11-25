-- Migration 009: ads go live at once + owners can archive. Safe to run more than once.
-- Run in Supabase > SQL Editor AFTER migration 008, and BEFORE the new site code goes live.
--   1. listings.status       gains 'archived' (the owner hid the ad; photos and data are kept; not public; can be restored).
--   2. pending rows          become 'approved' (new policy: there is no review queue; admins take ads down afterwards).
--      approved_at / expires_at are filled in when empty (now / now + 30 days) so those ads are public and expire normally.
--   3. status default        'approved' (the site also sets status, approved_at and expires_at itself on insert, because the
--                            listing_on_approve trigger only runs on UPDATE).
-- public_listings is unchanged: it already shows only status = 'approved' (and unexpired), so archived ads are never public.

-- 1. Allow 'archived' (find the real constraint name, whatever it was called) -----------------------------------------------
do $$ declare c record; begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.listings'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
      and pg_get_constraintdef(oid) ilike '%pending%'
  loop
    execute format('alter table public.listings drop constraint %I', c.conname);
  end loop;
  alter table public.listings add constraint listings_status_check
    check (status in ('pending','approved','archived','rejected','removed'));
end $$;

-- 2. No review queue: pending ads go live -----------------------------------------------------------------------------------
update public.listings
   set status = 'approved',
       approved_at = coalesce(approved_at, now()),
       expires_at = coalesce(expires_at, now() + interval '30 days')
 where status = 'pending';

-- 3. New rows are live by default -------------------------------------------------------------------------------------------
alter table public.listings alter column status set default 'approved';
