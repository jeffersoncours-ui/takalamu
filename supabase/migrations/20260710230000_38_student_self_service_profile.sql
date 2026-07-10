-- 38 — Profil élève éditable (adresse, date de naissance, parcours scolaire)
-- + correctif sécurité : profiles_update_own autorisait la modification de
--   TOUTE colonne de sa propre ligne (y compris role/email) → élévation de
--   privilège possible via un PATCH REST direct. Aucun flux applicatif n'en
--   dépendait (vérifié : aucun .from("profiles").update(...) côté client).
--   Restreint aux seules colonnes éditables par l'utilisateur lui-même.

alter table public.students
  add column if not exists address text,
  add column if not exists birth_date date,
  add column if not exists school_background text;

revoke update on public.profiles from authenticated;
grant update (full_name, gender) on public.profiles to authenticated;

-- RPC dédiée pour les colonnes students : une policy RLS générique sur
-- students ne peut pas restreindre les colonnes (status/teacher_id/
-- unjustified_absences_count doivent rester hors de portée de l'élève,
-- et authenticated est le même rôle Postgres pour élève ET enseignant —
-- un grant column-level ne peut donc pas les distinguer). SECURITY DEFINER
-- avec vérification explicite d'appartenance, pattern déjà utilisé pour
-- confirm_payment / get_teacher_booked_slots / get_public_teachers.
create or replace function public.update_own_student_info(
  p_full_name text,
  p_gender public.gender_type,
  p_address text default null,
  p_birth_date date default null,
  p_school_background text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid;
begin
  v_student_id := (select id from public.students where profile_id = auth.uid());
  if v_student_id is null then
    raise exception 'not a student' using errcode = '42501';
  end if;

  update public.profiles
    set full_name = p_full_name,
        gender = p_gender
    where id = auth.uid();

  update public.students
    set address = p_address,
        birth_date = p_birth_date,
        school_background = p_school_background
    where id = v_student_id;
end;
$$;

grant execute on function public.update_own_student_info(text, public.gender_type, text, date, text) to authenticated;
