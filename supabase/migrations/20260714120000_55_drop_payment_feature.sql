-- Retrait complet de la fonctionnalité paiement in-app : le propriétaire gère
-- le paiement en externe, directement avec l'élève (jamais utilisé en
-- pratique — table payments vide, 0 notification payment_* au moment du
-- retrait, 0 élève au statut suspended_payment). Code applicatif déjà retiré
-- et déployé en prod avant cette migration (base partagée preview/prod).

-- ── RPC ──────────────────────────────────────────────────────────────────────
drop function if exists public.confirm_payment(uuid);
drop function if exists public.cancel_payment(uuid);

-- ── Table (RLS policies droppées avec la table) ────────────────────────────
drop table if exists public.payments;

-- ── Enums devenus inutilisés (aucune colonne restante ne les référence) ────
drop type if exists payment_plan;
drop type if exists payment_product;
drop type if exists payment_status;

-- ── Valeurs d'enum orphelines (rename → create → alter → drop, pattern
--    déjà utilisé migration 47) ────────────────────────────────────────────
alter type notification_type rename to notification_type_old;
create type notification_type as enum (
  'new_message',
  'homework_due',
  'eval_due',
  'homework_corrected',
  'homework_submitted',
  'trial_request',
  'session_reminder'
);
alter table public.notifications alter column type type notification_type using type::text::notification_type;
drop type notification_type_old;

alter type student_status rename to student_status_old;
create type student_status as enum ('active', 'suspended_absences');
alter table public.students alter column status drop default;
alter table public.students alter column status type student_status using status::text::student_status;
alter table public.students alter column status set default 'active'::student_status;
drop type student_status_old;
