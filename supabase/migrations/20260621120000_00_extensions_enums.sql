-- 00 — Extensions & types enum
-- Toutes les dates/heures sont en UTC (timestamptz). Voir Principe 7.

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'teacher', 'student');
create type gender_type as enum ('m', 'f');
create type student_status as enum ('active', 'suspended_payment', 'suspended_absences');
create type lesson_phase as enum ('dechiffrage', 'lecture_oral', 'grammaire');
create type attendance_status as enum ('present', 'absent_justified', 'absent_unjustified', 'late');
create type homework_status as enum ('a_rendre', 'rendu', 'corrige', 'vu');
create type quiz_scope as enum ('individual', 'group');
create type quiz_source as enum ('glossary', 'book');
create type payment_product as enum ('individual_sub', 'book');
create type payment_plan as enum ('1x', '2x', '3x', '12x', 'single');
create type payment_status as enum ('pending', 'paid', 'failed', 'cancelled');
create type booking_type as enum ('individual', 'group');
create type booking_status as enum ('booked', 'completed', 'cancelled', 'moved');
create type video_type as enum ('welcome', 'milestone');
create type notification_type as enum ('new_message', 'homework_due', 'eval_due', 'video_assigned');

-- Fonction générique de maintien de updated_at (déclencheur posé sur chaque table).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
