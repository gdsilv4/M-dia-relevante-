-- ============================================================================
-- Etapa 1 · Fundação: usuários (perfis), funções e plataformas.
-- Execute UMA vez no Supabase: SQL Editor -> New query -> colar tudo -> Run.
-- IMPORTANTE: rode este script ANTES de criar o seu usuário administrador.
-- Pode ser executado de novo sem causar erro ou duplicar dados.
-- ============================================================================

-- ---------- Funções (papéis) ----------
-- Por enquanto só existe "admin". Novas funções (designer, etc.) serão
-- cadastradas na etapa de Equipe e permissões.
create table if not exists public.roles (
  key        text primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (key, name)
values ('admin', 'Administrador')
on conflict (key) do nothing;

-- ---------- Perfis (um por usuário do login) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role_key   text references public.roles (key),
  is_active  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Plataformas de publicação ----------
create table if not exists public.platforms (
  key        text primary key,
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.platforms (key, name)
values ('instagram', 'Instagram')
on conflict (key) do nothing;

-- ---------- Segurança: ninguém sem login enxerga nada ----------
alter table public.roles     enable row level security;
alter table public.profiles  enable row level security;
alter table public.platforms enable row level security;

revoke all on public.roles, public.profiles, public.platforms from anon;

-- Função auxiliar: o usuário logado é um administrador ativo?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role_key = 'admin'
      and p.is_active
  );
$$;

-- roles: qualquer usuário logado lê; só admin altera
drop policy if exists roles_leitura on public.roles;
create policy roles_leitura on public.roles
  for select to authenticated using (true);

drop policy if exists roles_admin on public.roles;
create policy roles_admin on public.roles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- platforms: qualquer usuário logado lê; só admin altera
drop policy if exists platforms_leitura on public.platforms;
create policy platforms_leitura on public.platforms
  for select to authenticated using (true);

drop policy if exists platforms_admin on public.platforms;
create policy platforms_admin on public.platforms
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles: cada um lê só o próprio perfil; admin lê e altera todos.
-- Ninguém além do admin consegue mudar função ou ativar contas.
drop policy if exists profiles_leitura on public.profiles;
create policy profiles_leitura on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_admin on public.profiles;
create policy profiles_admin on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Criação automática do perfil ----------
-- O PRIMEIRO usuário criado vira administrador ativo.
-- Qualquer usuário criado depois nasce INATIVO e sem acesso ao sistema
-- até que um administrador o ative.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  primeiro boolean;
begin
  select not exists (select 1 from public.profiles) into primeiro;

  insert into public.profiles (id, email, full_name, role_key, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when primeiro then 'admin' else null end,
    primeiro
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
