-- Un élève ne pouvait lire AUCUNE ligne `profiles` autre que la sienne (les
-- seules policies existantes couvraient : soi-même, l'admin, et le sens
-- enseignant -> profils de SES élèves). Résultat : tout embed PostgREST
-- imbriqué type students(...).teachers(...).profiles(...) exécuté par un
-- élève renvoyait `profiles: null` (RLS deny-by-default), même une fois la
-- lecture du fichier Storage autorisée (migration 62) — la ligne `profiles`
-- portant `avatar_url` n'était jamais atteinte. Policy additive symétrique à
-- `profiles_select_teacher_students` : un élève peut lire le profil de SON
-- PROPRE enseignant (via students.teacher_id -> teachers.profile_id), rien
-- d'autre.
create policy "profiles_select_own_teacher" on public.profiles
  for select
  using (
    id in (
      select t.profile_id
      from public.teachers t
      join public.students s on s.teacher_id = t.id
      where s.profile_id = auth.uid()
    )
  );
