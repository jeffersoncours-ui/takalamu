-- 06 — Planning & réservations : teacher_availability, bookings
-- Toutes les heures en UTC (Principe 7). teacher_availability = règles récurrentes.

create table public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = dimanche
  start_time time not null,       -- en UTC
  end_time time not null,         -- en UTC
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index teacher_availability_teacher_idx on public.teacher_availability (teacher_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  type booking_type not null,
  scheduled_at timestamptz not null,
  status booking_status not null default 'booked',
  zoom_link text,
  linked_book_session_id uuid references public.book_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_student_idx on public.bookings (student_id);
create index bookings_teacher_idx on public.bookings (teacher_id);

create trigger set_updated_at before update on public.teacher_availability for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.teacher_availability enable row level security;
alter table public.bookings enable row level security;

-- Dispos : lisibles par les authentifiés (l'élève doit voir les créneaux) ; écriture enseignant.
create policy ta_select_auth on public.teacher_availability
  for select to authenticated using (true);
create policy ta_write_owner on public.teacher_availability
  for all to authenticated
  using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

-- bookings : élève lit/crée les siennes ; enseignant gère les siennes.
-- (Verrou « pas payé = pas de résa » et règles de retard validés CÔTÉ SERVEUR, §8.)
create policy bookings_select_student on public.bookings
  for select to authenticated using (student_id = public.current_student_id());
create policy bookings_insert_student on public.bookings
  for insert to authenticated with check (student_id = public.current_student_id());
create policy bookings_update_student on public.bookings
  for update to authenticated using (student_id = public.current_student_id()) with check (student_id = public.current_student_id());
create policy bookings_teacher_all on public.bookings
  for all to authenticated using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());
