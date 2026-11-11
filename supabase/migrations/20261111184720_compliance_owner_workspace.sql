create table public.cb_workspace (
  premises_id uuid primary key references public.cb_premises(id),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) <= 20971520),
  revision integer not null default 1 check (revision > 0),
  updated_by uuid not null default auth.uid(),
  updated_at timestamptz not null default statement_timestamp()
);

create table cb_private.workspace_history (
  premises_id uuid not null,
  revision integer not null,
  snapshot jsonb not null,
  updated_by uuid not null,
  updated_at timestamptz not null,
  primary key (premises_id, revision)
);
revoke all on cb_private.workspace_history from public, anon, authenticated;

alter table public.cb_workspace enable row level security;
revoke all on public.cb_workspace from public, anon, authenticated;
grant select on public.cb_workspace to authenticated;
grant insert (premises_id, snapshot), update (snapshot) on public.cb_workspace to authenticated;

create policy cb_workspace_owner_read on public.cb_workspace for select to authenticated
using (exists (
  select 1 from public.cb_memberships m
  where m.premises_id = cb_workspace.premises_id and m.role = 'owner'
));

create policy cb_workspace_owner_insert on public.cb_workspace for insert to authenticated
with check (exists (
  select 1 from public.cb_memberships m
  where m.premises_id = cb_workspace.premises_id and m.role = 'owner'
));

create policy cb_workspace_owner_update on public.cb_workspace for update to authenticated
using (exists (
  select 1 from public.cb_memberships m
  where m.premises_id = cb_workspace.premises_id and m.role = 'owner'
))
with check (exists (
  select 1 from public.cb_memberships m
  where m.premises_id = cb_workspace.premises_id and m.role = 'owner'
));

create function cb_private.version_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.cb_memberships m
    where m.user_id = (select auth.uid()) and m.premises_id = new.premises_id and m.role = 'owner'
  ) then
    raise exception 'Owner access required' using errcode = '42501';
  end if;
  insert into cb_private.workspace_history (premises_id, revision, snapshot, updated_by, updated_at)
  values (old.premises_id, old.revision, old.snapshot, old.updated_by, old.updated_at);
  new.revision := old.revision + 1;
  new.updated_by := (select auth.uid());
  new.updated_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function cb_private.version_workspace() from public, anon, authenticated;
create trigger cb_workspace_version before update on public.cb_workspace
for each row execute function cb_private.version_workspace();
