-- 10 — Notes privées (ENSEIGNANT UNIQUEMENT) : student_profile_notes, session_private_notes
-- RLS : seul l'enseignant propriétaire accède. AUCUNE policy pour le rôle student
-- → deny-by-default ⇒ un compte élève ne peut JAMAIS lire ces lignes, même en requête manuelle.

create table public.student_profile_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index spn_student_idx on public.student_profile_notes (student_id);

create table public.session_private_notes (
  id uuid primary key default gen_random_uuid(),
  lesson_record_id uuid not null references public.lesson_records (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index spn_record_idx on public.session_private_notes (lesson_record_id);

create trigger set_updated_at before update on public.student_profile_notes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.session_private_notes for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.student_profile_notes enable row level security;
alter table public.session_private_notes enable row level security;

-- Note de profil : uniquement l'enseignant propriétaire.
create policy spn_owner_all on public.student_profile_notes
  for all to authenticated
  using (teacher_id = public.current_teacher_id())
  with check (teacher_id = public.current_teacher_id());

-- Note privée de séance : uniquement l'enseignant propriétaire.
create policy session_notes_owner_all on public.session_private_notes
  for all to authenticated
  using (teacher_id = public.current_teacher_id())
  with check (teacher_id = public.current_teacher_id());
