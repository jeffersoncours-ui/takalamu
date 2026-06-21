-- 05 — Produit B (cours de groupe / livre) : books, book_sessions, book_enrollments

create table public.books (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers (id) on delete set null,
  title text not null,
  description text,
  shared_notes text,
  price numeric,                  -- §10 : montant non fixé → nullable
  total_sessions int not null default 15,
  quiz_id uuid references public.quizzes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Le quiz de groupe référence son livre (cf. 04).
alter table public.quizzes
  add constraint quizzes_book_fk
  foreign key (book_id) references public.books (id) on delete set null;

create table public.book_sessions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  session_number int not null,
  scheduled_at timestamptz not null,
  zoom_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index book_sessions_book_idx on public.book_sessions (book_id);

create table public.book_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  payment_id uuid,                -- FK ajoutée en 09 (payments)
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, book_id)
);

create trigger set_updated_at before update on public.books for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.book_sessions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.book_enrollments for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.books enable row level security;
alter table public.book_sessions enable row level security;
alter table public.book_enrollments enable row level security;

-- books : vitrine publique en lecture ; écriture par l'enseignant propriétaire / admin.
create policy books_select_public on public.books
  for select to anon, authenticated using (true);
create policy books_write_owner on public.books
  for all to authenticated
  using (teacher_id = public.current_teacher_id() or public.is_admin())
  with check (teacher_id = public.current_teacher_id() or public.is_admin());

-- book_sessions : lisibles par les authentifiés ; écriture par l'enseignant du livre.
create policy book_sessions_select_auth on public.book_sessions
  for select to authenticated using (true);
create policy book_sessions_write_owner on public.book_sessions
  for all to authenticated
  using (book_id in (select id from public.books where teacher_id = public.current_teacher_id()) or public.is_admin())
  with check (book_id in (select id from public.books where teacher_id = public.current_teacher_id()) or public.is_admin());

-- book_enrollments : élève lit les siennes ; enseignant lit celles de ses livres.
-- (Création = serveur après paiement confirmé ; pas d'insert élève en direct.)
create policy be_select_student on public.book_enrollments
  for select to authenticated using (student_id = public.current_student_id());
create policy be_select_teacher on public.book_enrollments
  for select to authenticated
  using (book_id in (select id from public.books where teacher_id = public.current_teacher_id()));
create policy be_admin_all on public.book_enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
