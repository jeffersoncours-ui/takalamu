-- 23 — Soumission de devoir côté élève (D1)
-- (a) Ferme la faille RLS : l'élève ne doit PAS pouvoir modifier grade/feedback/status librement.
-- (b) RPC submit_homework SECURITY DEFINER : seul l'élève propriétaire dépose, et uniquement
--     submission_file + status='rendu' + submitted_at. Notifie l'enseignant.
-- (c) Bucket Storage homework-submissions + policies.

-- ── (a) Suppression de la policy trop permissive ─────────────────────────────
-- L'ancienne policy hw_update_student autorisait l'élève à UPDATE n'importe quelle
-- colonne de SES devoirs (y compris grade, feedback, status). Remplacée par la RPC.
DROP POLICY IF EXISTS hw_update_student ON public.homework;

-- ── (b) RPC submit_homework ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_homework(
  p_homework_id     uuid,
  p_submission_file text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student         uuid;
  v_hw_student      uuid;
  v_teacher_profile uuid;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- Le devoir doit appartenir à l'élève courant
  SELECT student_id INTO v_hw_student
  FROM   public.homework
  WHERE  id = p_homework_id;

  IF v_hw_student IS NULL OR v_hw_student != v_student THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- Mise à jour restreinte aux seuls champs de dépôt
  UPDATE public.homework
  SET    submission_file = p_submission_file,
         status          = 'rendu',
         submitted_at    = now()
  WHERE  id = p_homework_id;

  -- Notifier l'enseignant rattaché
  SELECT t.profile_id INTO v_teacher_profile
  FROM   public.students s
  JOIN   public.teachers t ON t.id = s.teacher_id
  WHERE  s.id = v_student;

  IF v_teacher_profile IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload, read)
    VALUES (
      v_teacher_profile,
      'homework_submitted',
      jsonb_build_object('url', '/teacher/homework'),
      false
    );
  END IF;
END;
$$;

-- ── (c) Bucket homework-submissions ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('homework-submissions', 'homework-submissions', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Élève : dépose (INSERT) et relit (SELECT) uniquement dans son propre dossier
CREATE POLICY "hw_submissions_student_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'homework-submissions'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

CREATE POLICY "hw_submissions_student_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'homework-submissions'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

-- Enseignant : lecture (pour corriger). Isolation effective au niveau de la table
-- homework (RLS owns_student) : le prof ne connaît le chemin que via un devoir lisible.
CREATE POLICY "hw_submissions_teacher_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'homework-submissions' AND private.current_teacher_id() IS NOT NULL);
