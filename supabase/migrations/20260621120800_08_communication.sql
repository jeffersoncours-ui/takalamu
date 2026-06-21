-- 08 — Communication : conversations, messages, notifications
-- Chat cloisonné par paire enseignant↔élève (temps réel via Supabase Realtime).

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id);

create trigger set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.messages for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notifications for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- conversations : seuls les deux membres de la paire y accèdent.
create policy conv_select_member on public.conversations
  for select to authenticated
  using (teacher_id = public.current_teacher_id() or student_id = public.current_student_id());
create policy conv_teacher_write on public.conversations
  for all to authenticated
  using (teacher_id = public.current_teacher_id()) with check (teacher_id = public.current_teacher_id());

-- messages : lisibles par les membres de la conversation ; l'expéditeur est l'utilisateur courant.
create policy messages_select_member on public.messages
  for select to authenticated
  using (conversation_id in (
    select id from public.conversations
    where teacher_id = public.current_teacher_id() or student_id = public.current_student_id()
  ));
create policy messages_insert_member on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select id from public.conversations
      where teacher_id = public.current_teacher_id() or student_id = public.current_student_id()
    )
  );
create policy messages_update_member on public.messages
  for update to authenticated
  using (conversation_id in (
    select id from public.conversations
    where teacher_id = public.current_teacher_id() or student_id = public.current_student_id()
  ));

-- notifications : chacun ne voit/modifie que les siennes (création côté serveur).
create policy notif_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notif_update_own on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
