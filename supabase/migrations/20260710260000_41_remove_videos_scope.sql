-- Retrait du périmètre vidéos (décision propriétaire, session 28) : 3 tables
-- confirmées vides (0 ligne chacune) et sans consommateur applicatif.

drop table if exists public.video_views;
drop table if exists public.milestone_video_assignments;
drop table if exists public.videos;
drop type if exists public.video_type;

-- Retrait de la valeur d'enum notification_type.video_assigned (jamais utilisée
-- dans le code applicatif). Postgres ne supporte pas DROP VALUE sur un enum :
-- on recrée le type sans cette valeur.
alter type public.notification_type rename to notification_type_old;

create type public.notification_type as enum (
  'new_message',
  'homework_due',
  'eval_due',
  'homework_corrected',
  'payment_requested',
  'payment_confirmed',
  'homework_submitted',
  'trial_request',
  'session_reminder'
);

alter table public.notifications
  alter column type type public.notification_type
  using type::text::public.notification_type;

drop type public.notification_type_old;
