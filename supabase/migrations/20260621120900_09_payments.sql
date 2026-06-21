-- 09 — Paiement : payments
-- Pot commun : lisible par tout enseignant. Écriture réservée au service_role
-- (webhook Revolut) → aucune policy d'écriture pour les rôles client.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  product payment_product not null,
  revolut_reference text,
  plan payment_plan,
  status payment_status not null default 'pending',
  period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_student_idx on public.payments (student_id);

-- Lien d'inscription groupe ↔ paiement (cf. 05).
alter table public.book_enrollments
  add constraint be_payment_fk
  foreign key (payment_id) references public.payments (id) on delete set null;

create trigger set_updated_at before update on public.payments for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.payments enable row level security;

-- L'élève lit ses propres paiements.
create policy payments_select_student on public.payments
  for select to authenticated using (student_id = public.current_student_id());

-- Tout enseignant lit tous les paiements (pot commun aux enseignants).
create policy payments_select_teacher on public.payments
  for select to authenticated using (public.current_teacher_id() is not null);

-- Aucune policy INSERT/UPDATE/DELETE : seules les opérations en service_role
-- (qui contourne la RLS) peuvent écrire → un élève ne peut PAS se déclarer « payé ».
