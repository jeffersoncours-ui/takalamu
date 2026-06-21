-- 02 — Programme (mode auteur, partagé entre enseignants) : lessons, audio_assets

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  order_index int not null default 0,
  title text not null,
  objective text,
  phase lesson_phase not null,
  reading_support text,
  audio_asset_id uuid,            -- FK ajoutée après audio_assets (dépendance circulaire)
  grammar_point text,
  homework_template text,
  quiz_id uuid,                   -- FK ajoutée en 04 (quizzes)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons (id) on delete cascade,
  storage_path text not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons
  add constraint lessons_audio_asset_fk
  foreign key (audio_asset_id) references public.audio_assets (id) on delete set null;

create index lessons_order_idx on public.lessons (order_index);

create trigger set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.audio_assets for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.lessons enable row level security;
alter table public.audio_assets enable row level security;

-- Programme lisible par tout utilisateur authentifié (les élèves le voient via leurs séances).
-- Écriture réservée aux enseignants et à l'admin (mode auteur partagé).
create policy lessons_select_auth on public.lessons
  for select to authenticated using (true);
create policy lessons_write_teacher on public.lessons
  for all to authenticated
  using (public.current_teacher_id() is not null or public.is_admin())
  with check (public.current_teacher_id() is not null or public.is_admin());

create policy audio_select_auth on public.audio_assets
  for select to authenticated using (true);
create policy audio_write_teacher on public.audio_assets
  for all to authenticated
  using (public.current_teacher_id() is not null or public.is_admin())
  with check (public.current_teacher_id() is not null or public.is_admin());
