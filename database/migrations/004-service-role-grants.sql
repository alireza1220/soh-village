-- The server talks to Supabase with the secret (service_role) key. On newer projects a table made in the SQL Editor
-- does not automatically give service_role access, which shows up as "permission denied for table ..." (error 42501).
-- Run once in Supabase > SQL Editor. Safe to run again. Public (anon) access stays locked as before.
grant usage on schema public to service_role;
grant all on public.listings    to service_role;
grant all on public.rate_events to service_role;
grant all on all sequences in schema public to service_role;
