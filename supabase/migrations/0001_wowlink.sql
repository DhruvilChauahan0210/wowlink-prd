-- WowLink's data (app/lib/store-pg.ts). Everything is in its own schema, which Supabase's Data API doesn't serve, and
-- every table has row level security on with no policies: only the server, connecting as the database owner, reads
-- or writes it. Each row keeps its object as a JSON document; the columns beside it are for finding and linking.

create schema if not exists wowlink;

create table if not exists wowlink.experiences (
  id text primary key,
  slug text not null unique,
  doc jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every link ever given out, in lowercase: slugs, custom links, and retired ones (experience_id null), so a link
-- shared once never opens someone else's invitation.
create table if not exists wowlink.links (
  link text primary key,
  experience_id text references wowlink.experiences (id) on delete set null
);
create index if not exists links_experience_id on wowlink.links (experience_id);

create table if not exists wowlink.rsvps (
  id text primary key,
  experience_id text not null references wowlink.experiences (id) on delete cascade,
  doc jsonb not null
);
create index if not exists rsvps_experience_id on wowlink.rsvps (experience_id);

create table if not exists wowlink.reports (
  id text primary key,
  experience_id text not null references wowlink.experiences (id) on delete cascade,
  doc jsonb not null
);
create index if not exists reports_experience_id on wowlink.reports (experience_id);

create table if not exists wowlink.upgrades (
  id text primary key,
  experience_id text not null references wowlink.experiences (id) on delete cascade,
  doc jsonb not null
);
create index if not exists upgrades_experience_id on wowlink.upgrades (experience_id);

create table if not exists wowlink.previews (
  token text primary key,
  experience_id text not null references wowlink.experiences (id) on delete cascade,
  doc jsonb not null
);
create index if not exists previews_experience_id on wowlink.previews (experience_id);

-- The app's daily numbers (insights.ts): one count per name per day on India's calendar.
create table if not exists wowlink.metrics (
  key text not null,
  day text not null,
  count integer not null,
  primary key (key, day)
);

alter table wowlink.experiences enable row level security;
alter table wowlink.links enable row level security;
alter table wowlink.rsvps enable row level security;
alter table wowlink.reports enable row level security;
alter table wowlink.upgrades enable row level security;
alter table wowlink.previews enable row level security;
alter table wowlink.metrics enable row level security;

-- Supabase's public roles get nothing here, now or in tables added later. (Plain Postgres has no such roles.)
do $$
declare role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format('revoke all on schema wowlink from %I', role_name);
      execute format('revoke all on all tables in schema wowlink from %I', role_name);
      execute format('revoke all on all sequences in schema wowlink from %I', role_name);
      execute format('alter default privileges in schema wowlink revoke all on tables from %I', role_name);
      execute format('alter default privileges in schema wowlink revoke all on sequences from %I', role_name);
    end if;
  end loop;
end $$;
