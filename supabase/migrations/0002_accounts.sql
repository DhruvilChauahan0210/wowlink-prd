-- Accounts: an invitation's owner (a Supabase Auth user id) is in its document; this column mirrors it so a host's
-- invitations can be found and their free plan's one live invitation counted.
alter table wowlink.experiences add column if not exists owner_id text generated always as (doc ->> 'ownerId') stored;
create index if not exists experiences_owner_id on wowlink.experiences (owner_id);

-- Rate limits shared by every server (app/lib/rate-limit.ts): one count per key per fixed window.
create table if not exists wowlink.rate_limits (
  key text not null,
  window_start bigint not null,
  count integer not null,
  primary key (key, window_start)
);
alter table wowlink.rate_limits enable row level security;

do $$
declare role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format('revoke all on all tables in schema wowlink from %I', role_name);
    end if;
  end loop;
end $$;
