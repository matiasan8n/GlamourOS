-- GlamourOS: políticas RLS alineadas con la app (perfil → organization_id → datos del salón).
-- Ejecuta en Supabase: SQL Editor → pega todo → Run.
-- Si alguna tabla no existe en tu proyecto, comenta ese bloque o ajústalo.

-- ─── Helper: id de organización del usuario autenticado ─────────────────────

create or replace function public.glam_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

grant execute on function public.glam_user_organization_id() to authenticated;

-- ─── profiles ────────────────────────────────────────────────────────────────

alter table if exists public.profiles enable row level security;

drop policy if exists "glamouros_profiles_select_own" on public.profiles;
create policy "glamouros_profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "glamouros_profiles_update_own" on public.profiles;
create policy "glamouros_profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "glamouros_profiles_insert_own" on public.profiles;
create policy "glamouros_profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- ─── organizations (join desde dashboard) ─────────────────────────────────

alter table if exists public.organizations enable row level security;

drop policy if exists "glamouros_organizations_select_member" on public.organizations;
create policy "glamouros_organizations_select_member"
  on public.organizations
  for select
  to authenticated
  using (id = public.glam_user_organization_id());

-- ─── clients ─────────────────────────────────────────────────────────────────

alter table if exists public.clients enable row level security;

drop policy if exists "glamouros_clients_select" on public.clients;
create policy "glamouros_clients_select"
  on public.clients
  for select
  to authenticated
  using (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_clients_insert" on public.clients;
create policy "glamouros_clients_insert"
  on public.clients
  for insert
  to authenticated
  with check (
    organization_id is not null
    and organization_id = public.glam_user_organization_id()
  );

drop policy if exists "glamouros_clients_update" on public.clients;
create policy "glamouros_clients_update"
  on public.clients
  for update
  to authenticated
  using (organization_id = public.glam_user_organization_id())
  with check (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_clients_delete" on public.clients;
create policy "glamouros_clients_delete"
  on public.clients
  for delete
  to authenticated
  using (organization_id = public.glam_user_organization_id());

-- ─── staff ───────────────────────────────────────────────────────────────────

alter table if exists public.staff enable row level security;

drop policy if exists "glamouros_staff_select" on public.staff;
create policy "glamouros_staff_select"
  on public.staff
  for select
  to authenticated
  using (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_staff_insert" on public.staff;
create policy "glamouros_staff_insert"
  on public.staff
  for insert
  to authenticated
  with check (
    organization_id is not null
    and organization_id = public.glam_user_organization_id()
  );

drop policy if exists "glamouros_staff_update" on public.staff;
create policy "glamouros_staff_update"
  on public.staff
  for update
  to authenticated
  using (organization_id = public.glam_user_organization_id())
  with check (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_staff_delete" on public.staff;
create policy "glamouros_staff_delete"
  on public.staff
  for delete
  to authenticated
  using (organization_id = public.glam_user_organization_id());

-- ─── services ────────────────────────────────────────────────────────────────

alter table if exists public.services enable row level security;

drop policy if exists "glamouros_services_select" on public.services;
create policy "glamouros_services_select"
  on public.services
  for select
  to authenticated
  using (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_services_insert" on public.services;
create policy "glamouros_services_insert"
  on public.services
  for insert
  to authenticated
  with check (
    organization_id is not null
    and organization_id = public.glam_user_organization_id()
  );

drop policy if exists "glamouros_services_update" on public.services;
create policy "glamouros_services_update"
  on public.services
  for update
  to authenticated
  using (organization_id = public.glam_user_organization_id())
  with check (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_services_delete" on public.services;
create policy "glamouros_services_delete"
  on public.services
  for delete
  to authenticated
  using (organization_id = public.glam_user_organization_id());

-- ─── branches ────────────────────────────────────────────────────────────────

alter table if exists public.branches enable row level security;

drop policy if exists "glamouros_branches_select" on public.branches;
create policy "glamouros_branches_select"
  on public.branches
  for select
  to authenticated
  using (organization_id = public.glam_user_organization_id());

-- ─── appointments ────────────────────────────────────────────────────────────

alter table if exists public.appointments enable row level security;

drop policy if exists "glamouros_appointments_select" on public.appointments;
create policy "glamouros_appointments_select"
  on public.appointments
  for select
  to authenticated
  using (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_appointments_insert" on public.appointments;
create policy "glamouros_appointments_insert"
  on public.appointments
  for insert
  to authenticated
  with check (
    organization_id is not null
    and organization_id = public.glam_user_organization_id()
  );

drop policy if exists "glamouros_appointments_update" on public.appointments;
create policy "glamouros_appointments_update"
  on public.appointments
  for update
  to authenticated
  using (organization_id = public.glam_user_organization_id())
  with check (organization_id = public.glam_user_organization_id());

drop policy if exists "glamouros_appointments_delete" on public.appointments;
create policy "glamouros_appointments_delete"
  on public.appointments
  for delete
  to authenticated
  using (organization_id = public.glam_user_organization_id());
