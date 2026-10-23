-- Server errors (app/lib/errors.ts): what failed, where and when, for the admin page and the live-site check. No
-- request bodies, no query strings, nothing about who asked.
create table if not exists wowlink.errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  method text not null,
  path text not null,
  message text not null,
  digest text
);
create index if not exists errors_at on wowlink.errors (at desc);
alter table wowlink.errors enable row level security;

do $$
declare role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format('revoke all on all tables in schema wowlink from %I', role_name);
      execute format('revoke all on all sequences in schema wowlink from %I', role_name);
    end if;
  end loop;
end $$;
