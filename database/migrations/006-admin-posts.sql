-- Migration 006: admin role + posts (news, blog, events). Safe to run more than once. Run in Supabase > SQL Editor.
--   1. profiles.role        'user' (default) or 'admin'. Only YOU can make an admin: Table Editor > profiles > change role.
--                           No site route can write this column (profiles is server-only and the profile routes never touch role).
--   2. public.posts         news, blog posts and events written by admins. Server only (RLS on, no policies).
--   3. public.public_posts  the public view: published posts only, explicit columns.
--   4. grants               explicit service_role grants (without them: 42501 permission denied).

-- 1. Role -------------------------------------------------------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'user';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- 2. Posts ------------------------------------------------------------------------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('news', 'blog', 'event')),
  title_fa     text not null default '' check (char_length(title_fa) <= 140),
  title_en     text not null default '' check (char_length(title_en) <= 140),
  body_fa      text not null default '' check (char_length(body_fa) <= 10000),
  body_en      text not null default '' check (char_length(body_en) <= 10000),
  event_at     timestamptz,                                                       -- events only: when it happens
  place_fa     text check (place_fa is null or char_length(place_fa) <= 120),
  place_en     text check (place_en is null or char_length(place_en) <= 120),
  published    boolean not null default false,
  published_at timestamptz,                                                       -- set the first time it is published
  author_id    uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint posts_has_title check (char_length(title_fa) > 0 or char_length(title_en) > 0),
  constraint posts_event_needs_date check (kind <> 'event' or event_at is not null)
);

create or replace function public.post_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists post_touch on public.posts;
create trigger post_touch before update on public.posts
  for each row execute function public.post_touch();

create index if not exists posts_public_idx on public.posts (published, published_at desc);
create index if not exists posts_event_idx on public.posts (kind, event_at);

alter table public.posts enable row level security;          -- no policies = nobody but the server (service_role)
revoke all on public.posts from anon, authenticated;

-- 3. Public view ------------------------------------------------------------------------------------------------------
-- Explicit columns, published only. No author id, no drafts. Do not use select *.
create or replace view public.public_posts as
  select id, kind, title_fa, title_en, body_fa, body_en, event_at, place_fa, place_en, published_at, created_at
  from public.posts
  where published = true;

revoke all on public.public_posts from anon, authenticated;
grant select on public.public_posts to anon, authenticated;

-- 4. Grants -----------------------------------------------------------------------------------------------------------
grant usage on schema public to service_role;
grant all on public.posts    to service_role;
grant all on public.profiles to service_role;
