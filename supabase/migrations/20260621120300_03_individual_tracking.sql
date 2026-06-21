-- 03 — Suivi individuel (Produit A) :
-- student_progress, lesson_records, vocabulary, grammar_rules, homework

create table public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students (id) on delete cascade,
  current_lesson_id uuid references public.lessons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  session_date timestamptz not null,
  attendance attendance_status not null,
  public_recap text,
  support_files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_records_student_idx on public.lesson_records (student_id);
create index lesson_records_teacher_idx on public.lesson_records (teacher_id);

create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  arabic_word text not null,
  french_definition text not null,
  root text,
  lesson_record_id uuid references public.lesson_records (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vocabulary_student_idx on public.vocabulary (student_id);

create table public.grammar_rules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  content text not null,
  lesson_record_id uuid references public.lesson_records (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index grammar_rules_student_idx on public.grammar_rules (student_id);

create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  lesson_record_id uuid references public.lesson_records (id) on delete set null,
  instructions text,
  status homework_status not null default 'a_rendre',
  submission_file text,
  correction_file text,
  feedback text,
  grade text,
  assigned_at timestamptz not null default now(),
  submitted_at timestamptz,
  corrected_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index homework_student_idx on public.homework (student_id);
create index homework_status_idx on public.homework (status);

create trigger set_updated_at before update on public.student_progress for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.lesson_records for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.vocabulary for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.grammar_rules for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.homework for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.student_progress enable row level security;
alter table public.lesson_records enable row level security;
alter table public.vocabulary enable row level security;
alter table public.grammar_rules enable row level security;
alter table public.homework enable row level security;

-- student_progress : élève en lecture seule sur le sien ; enseignant gère les siens.
create policy sp_select_student on public.student_progress
  for select to authenticated using (student_id = public.current_student_id());
create policy sp_teacher_all on public.student_progress
  for all to authenticated using (public.owns_student(student_id)) with check (public.owns_student(student_id));

-- lesson_records : élève lit les siens ; enseignant gère ceux qu'il a saisis.
create policy lr_select_student on public.lesson_records
  for select to authenticated using (student_id = public.current_student_id());
create policy lr_teacher_all on public.lesson_records
  for all to authenticated using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

-- vocabulary : élève lit le sien ; enseignant gère celui de ses élèves.
create policy vocab_select_student on public.vocabulary
  for select to authenticated using (student_id = public.current_student_id());
create policy vocab_teacher_all on public.vocabulary
  for all to authenticated using (public.owns_student(student_id)) with check (public.owns_student(student_id));

-- grammar_rules : jumeau du glossaire.
create policy gr_select_student on public.grammar_rules
  for select to authenticated using (student_id = public.current_student_id());
create policy gr_teacher_all on public.grammar_rules
  for all to authenticated using (public.owns_student(student_id)) with check (public.owns_student(student_id));

-- homework : élève lit les siens et peut les mettre à jour (dépôt) ; enseignant gère.
-- (Les transitions de statut autorisées sont validées côté serveur, pas par la RLS.)
create policy hw_select_student on public.homework
  for select to authenticated using (student_id = public.current_student_id());
create policy hw_update_student on public.homework
  for update to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
create policy hw_teacher_all on public.homework
  for all to authenticated using (public.owns_student(student_id)) with check (public.owns_student(student_id));
