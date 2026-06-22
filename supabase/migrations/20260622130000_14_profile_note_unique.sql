-- 14 — Contrainte UNIQUE sur student_profile_notes (1 note par élève par enseignant)
-- Permet l'upsert via onConflict: "student_id,teacher_id".

alter table public.student_profile_notes
  add constraint spn_student_teacher_unique unique (student_id, teacher_id);
