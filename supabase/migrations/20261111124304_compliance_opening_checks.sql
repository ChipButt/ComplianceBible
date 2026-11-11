create table public.cb_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0)
);

create table public.cb_premises (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.cb_companies(id),
  name text not null check (length(trim(name)) > 0),
  unique (company_id, id)
);

create table public.cb_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null,
  premises_id uuid not null,
  display_name text not null check (length(trim(display_name)) > 0),
  role text not null check (role in ('staff', 'manager', 'owner')),
  primary key (user_id, premises_id),
  foreign key (company_id, premises_id) references public.cb_premises(company_id, id)
);

create table public.cb_opening_checks (
  id uuid primary key,
  company_id uuid not null,
  premises_id uuid not null,
  submitted_by uuid not null default auth.uid(),
  actor_name text not null,
  submitted_at timestamptz not null default statement_timestamp(),
  business_day date generated always as ((submitted_at at time zone 'Europe/London')::date) stored,
  task_version smallint not null default 1 check (task_version = 1),
  completed_tasks text[] not null check (completed_tasks = array['exits','first-aid','public-areas','equipment']),
  notes text not null default '' check (length(notes) <= 1000),
  evidence_path text generated always as (premises_id::text || '/' || submitted_by::text || '/' || id::text) stored,
  foreign key (company_id, premises_id) references public.cb_premises(company_id, id),
  unique (premises_id, business_day),
  unique (evidence_path)
);

alter table public.cb_companies enable row level security;
alter table public.cb_premises enable row level security;
alter table public.cb_memberships enable row level security;
alter table public.cb_opening_checks enable row level security;
revoke all on public.cb_companies, public.cb_premises, public.cb_memberships, public.cb_opening_checks from public, anon, authenticated;
grant select on public.cb_companies, public.cb_premises, public.cb_memberships, public.cb_opening_checks to authenticated;
grant insert (id, company_id, premises_id, completed_tasks, notes) on public.cb_opening_checks to authenticated;

create policy cb_own_membership on public.cb_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy cb_company_read on public.cb_companies for select to authenticated
using (exists (select 1 from public.cb_memberships m where m.company_id = id));

create policy cb_premises_read on public.cb_premises for select to authenticated
using (exists (select 1 from public.cb_memberships m where m.premises_id = id));

create policy cb_opening_read on public.cb_opening_checks for select to authenticated
using (exists (
  select 1 from public.cb_memberships m where m.premises_id = cb_opening_checks.premises_id
  and (submitted_by = (select auth.uid()) or m.role in ('manager','owner'))
));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cb-opening-evidence', 'cb-opening-evidence', false, 5242880, array['image/jpeg','image/png','image/webp']);

create policy cb_evidence_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'cb-opening-evidence'
  and split_part(name, '/', 2) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}$'
  and exists (select 1 from public.cb_memberships m where m.premises_id::text = split_part(name, '/', 1))
);

create policy cb_evidence_read on storage.objects for select to authenticated
using (
  bucket_id = 'cb-opening-evidence'
  and (
    (split_part(name, '/', 2) = (select auth.uid())::text and exists (
      select 1 from public.cb_memberships m where m.premises_id::text = split_part(name, '/', 1)
    ))
    or exists (select 1 from public.cb_opening_checks c where c.evidence_path = storage.objects.name)
  )
);

create schema if not exists cb_private;
revoke all on schema cb_private from public;

-- Read the upload metadata without recursing through the object read policy.
create function cb_private.has_opening_upload(site uuid, record uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.cb_memberships m
      where m.user_id = (select auth.uid()) and m.premises_id = site
    )
    and exists (
      select 1 from storage.objects o
      where o.bucket_id = 'cb-opening-evidence'
        and o.name = site::text || '/' || (select auth.uid())::text || '/' || record::text
    )
$$;
revoke all on function cb_private.has_opening_upload(uuid, uuid) from public, anon, authenticated;
grant execute on function cb_private.has_opening_upload(uuid, uuid) to authenticated;

create policy cb_opening_insert on public.cb_opening_checks for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and exists (select 1 from public.cb_memberships m where m.premises_id = cb_opening_checks.premises_id)
  and cb_private.has_opening_upload(premises_id, id)
);

create index cb_memberships_company_idx on public.cb_memberships(company_id);
create index cb_premises_company_idx on public.cb_premises(company_id);

create function cb_private.snapshot_opening_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  select display_name into new.actor_name
  from public.cb_memberships
  where user_id = (select auth.uid()) and premises_id = new.premises_id;
  if new.actor_name is null then
    raise exception 'A premises assignment is required' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function cb_private.snapshot_opening_actor() from public, anon, authenticated;
create trigger cb_opening_actor before insert on public.cb_opening_checks
for each row execute function cb_private.snapshot_opening_actor();
