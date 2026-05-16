-- ═══════════════════════════════════════════════════════════════════════════
-- GlamourOS — Arreglar perfiles (compatible con tu esquema real)
-- Ejecuta TODO en Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 0) Ver columnas reales (opcional, solo consulta)
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public' and table_name in ('organizations', 'profiles')
-- order by table_name, ordinal_position;

-- 1) Política: el usuario puede crear su propia fila en profiles
drop policy if exists "glamouros_profiles_insert_own" on public.profiles;
create policy "glamouros_profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- 2) Crear organización si no existe (solo columnas id + name)
insert into public.organizations (id, name)
select gen_random_uuid(), 'Glamour Studio'
where not exists (select 1 from public.organizations limit 1);

-- 3) Crear perfil para usuarios de Auth sin fila en profiles
--    Si falla por columnas, revisa el paso 0 y ajusta full_name si no existe.
insert into public.profiles (id, organization_id, full_name)
select
  u.id,
  (select o.id from public.organizations o order by o.id limit 1),
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 4) Perfiles sin organization_id
update public.profiles p
set organization_id = (select o.id from public.organizations o order by o.id limit 1)
where p.organization_id is null;

-- 5) Verificación
select
  u.email,
  p.id as profile_id,
  p.organization_id,
  o.name as salon
from auth.users u
left join public.profiles p on p.id = u.id
left join public.organizations o on o.id = p.organization_id;
