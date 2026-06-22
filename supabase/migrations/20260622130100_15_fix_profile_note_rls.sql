-- 15 — Correctif RLS student_profile_notes
-- La policy précédente ne vérifiait que teacher_id = current_teacher_id()
-- sur le WITH CHECK, sans vérifier que l'élève appartient au teacher.
-- Un enseignant pouvait donc insérer une note pour un élève d'un autre enseignant
-- (note invisible à l'autre enseignant, mais sémantiquement incorrecte).

drop policy if exists spn_owner_all on public.student_profile_notes;

create policy spn_owner_all on public.student_profile_notes
  for all to authenticated
  using  (teacher_id = private.current_teacher_id())
  with check (
    teacher_id = private.current_teacher_id()
    and private.owns_student(student_id)
  );
