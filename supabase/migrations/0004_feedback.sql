-- Feedback (app/lib/feedback.ts): what someone wrote from the Feedback button on WowLink's own pages, how it's going
-- for them, the page they sent it from, and a way to reply if they gave one. Read on the admin page.
create table if not exists wowlink.feedback (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  mood text check (mood in ('love', 'okay', 'confused')),
  message text not null,
  page text not null,
  contact text,
  done_at timestamptz
);
create index if not exists feedback_open on wowlink.feedback ((done_at is not null), id desc);
alter table wowlink.feedback enable row level security;

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
