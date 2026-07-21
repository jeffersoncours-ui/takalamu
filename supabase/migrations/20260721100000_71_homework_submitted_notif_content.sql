-- 71 — Écriture des notifications homework_submitted : ajoute le nom de l'élève et un
-- aperçu des instructions du devoir au payload (jusqu'ici juste { url }, donc la cloche
-- ne pouvait afficher que le libellé générique "Devoir soumis"). CREATE OR REPLACE sur
-- les 2 signatures existantes (migration 53) — signatures inchangées, aucun risque de
-- casse pour un client encore en cache.

CREATE OR REPLACE FUNCTION public.submit_homework(
  p_homework_id uuid,
  p_files       jsonb   -- [{path, name}] (chemins déjà uploadés côté navigateur)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student         uuid;
  v_hw_student      uuid;
  v_status          public.homework_status;
  v_instructions    text;
  v_teacher_profile uuid;
  v_student_name    text;
  v_file            jsonb;
  v_path            text;
  v_count           int;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT student_id, status, instructions INTO v_hw_student, v_status, v_instructions
  FROM   public.homework
  WHERE  id = p_homework_id;

  IF v_hw_student IS NULL OR v_hw_student != v_student THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- Verrou : une fois corrigé (ou vu), l'élève ne peut plus toucher son dépôt.
  IF v_status NOT IN ('a_rendre', 'rendu') THEN
    RAISE EXCEPTION 'Devoir déjà corrigé — modification impossible.' USING ERRCODE = '42501';
  END IF;

  -- Chaque chemin doit être dans le dossier de l'élève (défense en profondeur).
  FOR v_file IN SELECT * FROM jsonb_array_elements(COALESCE(p_files, '[]'::jsonb))
  LOOP
    v_path := v_file ->> 'path';
    IF v_path IS NULL OR v_path NOT LIKE v_student::text || '/%' THEN
      RAISE EXCEPTION 'Fichier non autorisé.' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  v_count := jsonb_array_length(COALESCE(p_files, '[]'::jsonb));

  UPDATE public.homework
  SET    submission_files = COALESCE(p_files, '[]'::jsonb),
         submission_file  = p_files -> 0 ->> 'path',   -- 1ʳᵉ pièce : compat ancien lecteur
         status           = CASE WHEN v_count > 0 THEN 'rendu' ELSE 'a_rendre' END::public.homework_status,
         submitted_at     = CASE WHEN v_count > 0 THEN now() ELSE NULL END
  WHERE  id = p_homework_id;

  -- Notifier l'enseignant uniquement au passage à_rendre → rendu (pas à chaque édition).
  IF v_status = 'a_rendre' AND v_count > 0 THEN
    SELECT t.profile_id, p.full_name INTO v_teacher_profile, v_student_name
    FROM   public.students s
    JOIN   public.teachers t ON t.id = s.teacher_id
    JOIN   public.profiles p ON p.id = s.profile_id
    WHERE  s.id = v_student;

    IF v_teacher_profile IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, payload, read)
      VALUES (
        v_teacher_profile,
        'homework_submitted',
        jsonb_build_object(
          'url', '/teacher/homework',
          'student_name', v_student_name,
          'instructions_preview', left(coalesce(v_instructions, ''), 100)
        ),
        false
      );
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_homework(uuid, jsonb) TO authenticated;

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
  v_instructions    text;
  v_teacher_profile uuid;
  v_student_name    text;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT student_id, instructions INTO v_hw_student, v_instructions
  FROM   public.homework
  WHERE  id = p_homework_id;

  IF v_hw_student IS NULL OR v_hw_student != v_student THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  UPDATE public.homework
  SET    submission_file  = p_submission_file,
         submission_files = jsonb_build_array(
           jsonb_build_object('path', p_submission_file, 'name', p_submission_file)
         ),
         status           = 'rendu',
         submitted_at     = now()
  WHERE  id = p_homework_id;

  SELECT t.profile_id, p.full_name INTO v_teacher_profile, v_student_name
  FROM   public.students s
  JOIN   public.teachers t ON t.id = s.teacher_id
  JOIN   public.profiles p ON p.id = s.profile_id
  WHERE  s.id = v_student;

  IF v_teacher_profile IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload, read)
    VALUES (
      v_teacher_profile,
      'homework_submitted',
      jsonb_build_object(
        'url', '/teacher/homework',
        'student_name', v_student_name,
        'instructions_preview', left(coalesce(v_instructions, ''), 100)
      ),
      false
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_homework(uuid, text) TO authenticated;
