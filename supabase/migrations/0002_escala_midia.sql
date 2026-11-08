-- Equipe e escala de mídia. Seguro para executar mais de uma vez.
create table if not exists public.media_team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 1 and 100),
  area text not null default 'Mídia' check (length(area) <= 60),
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  shift_date date not null,
  activity text not null check (length(trim(activity)) between 1 and 120),
  responsibility text not null check (length(trim(responsibility)) between 1 and 100),
  team_member_id uuid not null references public.media_team_members (id) on delete restrict,
  notes text not null default '' check (length(notes) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists media_schedule_date_idx
  on public.media_schedule_assignments (shift_date, activity);
create index if not exists media_schedule_member_idx
  on public.media_schedule_assignments (team_member_id);

alter table public.media_team_members enable row level security;
alter table public.media_schedule_assignments enable row level security;
revoke all on public.media_team_members, public.media_schedule_assignments from anon;
grant select, insert, update, delete on public.media_team_members, public.media_schedule_assignments to authenticated;

drop policy if exists media_team_admin on public.media_team_members;
create policy media_team_admin on public.media_team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists media_schedule_admin on public.media_schedule_assignments;
create policy media_schedule_admin on public.media_schedule_assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
