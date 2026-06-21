-- 04 — Évaluations : quizzes, quiz_questions, quiz_attempts
-- Quiz individuels : questions générées à la volée depuis vocabulary (non stockées).
-- Quiz de groupe : quiz_questions saisies à la main (liées au livre).

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  scope quiz_scope not null,
  source_type quiz_source not null,
  book_id uuid,                   -- FK ajoutée en 05 (books)
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- La leçon peut référencer un quiz (cf. 02).
alter table public.lessons
  add constraint lessons_quiz_fk
  foreign key (quiz_id) references public.quizzes (id) on delete set null;

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  prompt text not null,
  correct_answer text not null,
  distractors text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  score numeric,
  answers jsonb not null default '{}'::jsonb,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quiz_attempts_student_idx on public.quiz_attempts (student_id);

create trigger set_updated_at before update on public.quizzes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.quiz_questions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.quiz_attempts for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- quizzes : lisibles par les authentifiés (pour passer l'éval) ; écriture enseignant/admin.
create policy quizzes_select_auth on public.quizzes
  for select to authenticated using (true);
create policy quizzes_write_teacher on public.quizzes
  for all to authenticated
  using (public.current_teacher_id() is not null or public.is_admin())
  with check (public.current_teacher_id() is not null or public.is_admin());

-- quiz_questions : contiennent les BONNES RÉPONSES → JAMAIS lisibles par un élève.
-- Lecture/écriture réservées aux enseignants/admin. La passation côté élève se fait
-- via une RPC/server action qui renvoie les questions SANS la réponse.
create policy quiz_questions_teacher_all on public.quiz_questions
  for all to authenticated
  using (public.current_teacher_id() is not null or public.is_admin())
  with check (public.current_teacher_id() is not null or public.is_admin());

-- quiz_attempts : élève gère les siennes ; enseignant lit celles de ses élèves.
create policy qa_select_student on public.quiz_attempts
  for select to authenticated using (student_id = public.current_student_id());
create policy qa_insert_student on public.quiz_attempts
  for insert to authenticated with check (student_id = public.current_student_id());
create policy qa_teacher_select on public.quiz_attempts
  for select to authenticated using (public.owns_student(student_id));
