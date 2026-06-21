-- 07 — Vidéos : videos, milestone_video_assignments, video_views
-- Hébergement Bunny Stream : on ne stocke que bunny_video_id + l'état de visionnage.

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  type video_type not null,
  teacher_id uuid references public.teachers (id) on delete cascade, -- welcome : 1 par enseignant
  bunny_video_id text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.milestone_video_assignments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, student_id)
);

create table public.video_views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  viewed_at timestamptz,          -- null tant que non vue
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (video_id, student_id)
);

create trigger set_updated_at before update on public.videos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.milestone_video_assignments for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.video_views for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.videos enable row level security;
alter table public.milestone_video_assignments enable row level security;
alter table public.video_views enable row level security;

-- videos : lisibles par les authentifiés (welcome + paliers) ; écriture enseignant/admin.
create policy videos_select_auth on public.videos
  for select to authenticated using (true);
create policy videos_write_teacher on public.videos
  for all to authenticated
  using (public.current_teacher_id() is not null or public.is_admin())
  with check (public.current_teacher_id() is not null or public.is_admin());

-- milestone_video_assignments : élève voit les siennes ; enseignant gère celles de ses élèves.
create policy mva_select_student on public.milestone_video_assignments
  for select to authenticated using (student_id = public.current_student_id());
create policy mva_teacher_all on public.milestone_video_assignments
  for all to authenticated using (public.owns_student(student_id)) with check (public.owns_student(student_id));

-- video_views : élève gère les siennes (la complétion est validée côté serveur) ;
-- enseignant lit celles de ses élèves.
create policy vv_select_student on public.video_views
  for select to authenticated using (student_id = public.current_student_id());
create policy vv_insert_student on public.video_views
  for insert to authenticated with check (student_id = public.current_student_id());
create policy vv_update_student on public.video_views
  for update to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
create policy vv_teacher_select on public.video_views
  for select to authenticated using (public.owns_student(student_id));
