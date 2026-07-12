-- 49 — Identité de cours partagée (anti-doublon bibliothèque)
--
-- Problème : la bibliothèque liste les lesson_records, qui sont PAR élève. Un même
-- cours donné à plusieurs élèves (fiche multi-élèves, ou duplication) apparaît une
-- fois par élève → doublons. Solution : un `course_group_id` partagé entre les
-- fiches issues d'une même saisie/duplication. La bibliothèque regroupe dessus.
--
-- - Fiche mono-élève : chaque record reçoit un id de groupe frais (groupe de 1).
-- - Fiche multi-élèves : les N records partagent un id (posé par le serveur).
-- - Duplication : les records cibles rejoignent le groupe du cours source.

-- ── 1) Colonne (NOT NULL DEFAULT : tout INSERT obtient un groupe automatiquement) ─
ALTER TABLE public.lesson_records
  ADD COLUMN IF NOT EXISTS course_group_id uuid NOT NULL DEFAULT gen_random_uuid();

-- ── 2) Rattrapage des cours existants : même (enseignant, titre) = même groupe ──
WITH keyed AS (
  SELECT teacher_id, custom_title, gen_random_uuid() AS gid
  FROM public.lesson_records
  GROUP BY teacher_id, custom_title
)
UPDATE public.lesson_records lr
SET course_group_id = k.gid
FROM keyed k
WHERE lr.teacher_id = k.teacher_id
  AND lr.custom_title IS NOT DISTINCT FROM k.custom_title;

-- ── 3) submit_session_record : + p_course_group_id (DROP+CREATE, nouveau param) ─
DROP FUNCTION IF EXISTS public.submit_session_record(
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb, text
);

CREATE FUNCTION public.submit_session_record(
  p_student_id uuid,
  p_session_date timestamptz,
  p_attendance public.attendance_status,
  p_public_recap text DEFAULT NULL,
  p_private_note text DEFAULT NULL,
  p_homework_instructions text DEFAULT NULL,
  p_vocab jsonb DEFAULT '[]'::jsonb,
  p_grammar jsonb DEFAULT '[]'::jsonb,
  p_support_files jsonb DEFAULT '[]'::jsonb,
  p_formulations jsonb DEFAULT '[]'::jsonb,
  p_custom_title text DEFAULT NULL,
  p_course_group_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_teacher_id uuid;
  v_record_id uuid;
  v_item jsonb;
  v_arabic text;
  v_french text;
  v_audio text;
  v_title text;
  v_content text;
  v_counts boolean;
  v_custom_title text;
BEGIN
  v_teacher_id := private.current_teacher_id();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un enseignant.' USING ERRCODE = '42501';
  END IF;

  IF NOT private.owns_student(p_student_id) THEN
    RAISE EXCEPTION 'Élève non rattaché à cet enseignant.' USING ERRCODE = '42501';
  END IF;

  v_custom_title := NULLIF(BTRIM(COALESCE(p_custom_title, '')), '');
  IF v_custom_title IS NULL THEN
    RAISE EXCEPTION 'Nom du cours obligatoire.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.lesson_records
    (student_id, teacher_id, session_date, attendance, public_recap, support_files, custom_title, course_group_id)
  VALUES
    (p_student_id, v_teacher_id, p_session_date, p_attendance,
     NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
     COALESCE(p_support_files, '[]'::jsonb),
     v_custom_title,
     COALESCE(p_course_group_id, gen_random_uuid()))
  RETURNING id INTO v_record_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_vocab, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_word', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_definition', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.vocabulary
        (student_id, arabic_word, french_definition, root, lesson_record_id)
      VALUES (p_student_id, v_arabic, v_french,
              NULLIF(BTRIM(COALESCE(v_item ->> 'root', '')), ''), v_record_id);
    END IF;
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_grammar, '[]'::jsonb))
  LOOP
    v_title := NULLIF(BTRIM(COALESCE(v_item ->> 'title', '')), '');
    v_content := NULLIF(BTRIM(COALESCE(v_item ->> 'content', '')), '');
    IF v_title IS NOT NULL AND v_content IS NOT NULL THEN
      INSERT INTO public.grammar_rules
        (student_id, title, content, lesson_record_id)
      VALUES (p_student_id, v_title, v_content, v_record_id);
    END IF;
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_formulations, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_text', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_text', '')), '');
    v_audio  := NULLIF(BTRIM(COALESCE(v_item ->> 'audio_path', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.formulations
        (student_id, arabic_text, french_text, audio_path, lesson_record_id)
      VALUES (p_student_id, v_arabic, v_french, v_audio, v_record_id);
    END IF;
  END LOOP;

  IF NULLIF(BTRIM(COALESCE(p_homework_instructions, '')), '') IS NOT NULL THEN
    INSERT INTO public.homework (student_id, lesson_record_id, instructions, status)
    VALUES (p_student_id, v_record_id, BTRIM(p_homework_instructions), 'a_rendre');
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_private_note, '')), '') IS NOT NULL THEN
    INSERT INTO public.session_private_notes (lesson_record_id, teacher_id, content)
    VALUES (v_record_id, v_teacher_id, BTRIM(p_private_note));
  END IF;

  v_counts := p_attendance IN ('absent_unjustified', 'late');
  IF v_counts THEN
    UPDATE public.students
      SET unjustified_absences_count = unjustified_absences_count + 1,
          status = CASE
            WHEN unjustified_absences_count + 1 >= 3 THEN 'suspended_absences'::public.student_status
            ELSE status
          END
    WHERE id = p_student_id;
  END IF;

  RETURN v_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_session_record(
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb, text, uuid
) TO authenticated;
