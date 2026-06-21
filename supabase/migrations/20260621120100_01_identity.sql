-- 01 — Identité & acteurs : profiles, teachers, students
-- + fonctions helper SECURITY DEFINER (anti-récursion RLS) + RLS deny-by-default.

-- ── Tables ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  full_name text,
  gender gender_type,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  gender gender_type,
  status student_status not null default 'active',
  onboarding_completed boolean not null default false,
  unjustified_absences_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_teacher_id_idx on public.students (teacher_id);

-- ── Helpers (SECURITY DEFINER → contournent les RLS pour éviter la récursion) ─
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.current_teacher_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.teachers where profile_id = auth.uid();
$$;

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where profile_id = auth.uid();
$$;

-- Vrai si l'élève passé en argument appartient à l'enseignant courant.
create or replace function public.owns_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id and s.teacher_id = public.current_teacher_id()
  );
$$;

-- ── Création automatique du profil à l'inscription auth ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, gender, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    new.raw_user_meta_data ->> 'full_name',
    (new.raw_user_meta_data ->> 'gender')::gender_type,
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ── Déclencheurs updated_at ──────────────────────────────────────────────────
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.teachers for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.students for each row execute function public.set_updated_at();

-- ── RLS : deny-by-default ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;

-- profiles : chacun lit le sien ; l'enseignant lit ceux de ses élèves ; l'admin tout.
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());
create policy profiles_select_teacher_students on public.profiles
  for select to authenticated
  using (id in (select profile_id from public.students where teacher_id = public.current_teacher_id()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- teachers : vitrine publique en lecture ; écriture admin ; chaque enseignant édite sa fiche.
create policy teachers_select_public on public.teachers
  for select to anon, authenticated using (true);
create policy teachers_update_own on public.teachers
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy teachers_admin_all on public.teachers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- students : l'élève lit le sien ; l'enseignant gère les siens ; l'admin tout.
create policy students_select_own on public.students
  for select to authenticated using (profile_id = auth.uid());
create policy students_select_teacher on public.students
  for select to authenticated using (teacher_id = public.current_teacher_id());
create policy students_update_teacher on public.students
  for update to authenticated using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());
create policy students_admin_all on public.students
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
