-- ═══════════════════════════════════════════════════════════════════════════
-- GlamourOS — Ejecutar en Supabase SQL Editor después de las políticas RLS
-- Objetivo: ver que auth.users ↔ profiles ↔ organizations encajan
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Usuarios en Auth vs filas en public.profiles
select
  u.id,
  u.email,
  p.id as profile_id,
  p.organization_id,
  o.name as organization_name
from auth.users u
left join public.profiles p on p.id = u.id
left join public.organizations o on o.id = p.organization_id
order by u.created_at;

-- 2) Organizaciones existentes (elige un id para asignar a tus perfiles)
select id, name
from public.organizations;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) OPCIÓN A — Ya tienes una organización: asignar a UN usuario por email
--    Sustituye los UUID y el email, luego descomenta y ejecuta SOLO ese bloque.
-- ═══════════════════════════════════════════════════════════════════════════

/*
update public.profiles
set organization_id = '00000000-0000-0000-0000-000000000001'::uuid
where id = (select id from auth.users where email = 'adamespersonal@gmail.com' limit 1);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) OPCIÓN B — Crear organización mínima y asignarla a ambos emails del proyecto
--    Ajusta nombre/plan si tu tabla organizations tiene más columnas NOT NULL.
-- ═══════════════════════════════════════════════════════════════════════════

/*
-- Paso B1: crea organización (ejecuta solo esto; copia el id que devuelve "returning")
insert into public.organizations (id, name)
values (gen_random_uuid(), 'Glamour Studio')
returning id;

-- Paso B2: pega el UUID del paso anterior y ejecuta solo esto:
update public.profiles
set organization_id = 'PEGA_AQUI_EL_UUID_DE_RETURNING'::uuid
where id in (
  select id from auth.users
  where email in ('adamespersonal@gmail.com', 'info@axiora.lat')
);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) Comprobar que ya pueden ver clientas (misma org que el perfil)
-- ═══════════════════════════════════════════════════════════════════════════

-- select * from public.clients limit 20;
