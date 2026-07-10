-- 39 — Photos de profil (élève + enseignant) + retrait scheduling/essai/dispo
--
-- Contexte : pivot vers plus de simplicité (décision propriétaire 2026-07-10).
-- bookings / teacher_availability / trial_requests confirmées VIDES (0 ligne)
-- avant suppression — aucune perte de données réelles.

-- ── Avatar ────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists avatar_url text;

revoke update on public.profiles from authenticated;
grant update (full_name, gender, avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('avatars', 'avatars', false, 5242880)
on conflict (id) do nothing;

create policy "avatars_owner_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Retrait scheduling / essai / disponibilités ────────────────────────────────
drop function if exists public.get_teacher_availability_by_gender(public.gender_type);
drop function if exists public.get_trial_taken_slots(public.gender_type);
drop function if exists public.get_teacher_booked_slots(uuid, timestamptz);
drop function if exists public.notify_teachers_by_gender(public.gender_type, public.notification_type, jsonb);

drop table if exists public.bookings;
drop table if exists public.teacher_availability;
drop table if exists public.trial_requests;

drop type if exists public.booking_status;
drop type if exists public.booking_type;
