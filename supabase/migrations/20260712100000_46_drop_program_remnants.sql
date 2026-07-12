-- 46 — Suppression définitive des vestiges « Programme » (mode auteur)
--
-- Décision propriétaire (session 30, suite 7) : le programme de leçons
-- structuré est définitivement abandonné — le suivi passe uniquement par
-- lesson_records + custom_title. Vérifié avant suppression :
--   lessons = 2 lignes de seed jamais référencées (records_with_lesson_id = 0),
--   audio_assets = 0 ligne, student_progress = 1 curseur mort,
--   bucket lesson-audio = 0 fichier, aucun code ne passe p_lesson_id.

-- Bucket audio de leçon (vide) + ses policies. Le trigger storage.protect_delete()
-- bloque les DELETE directs sauf autorisation explicite de session (piège session 25).
DROP POLICY IF EXISTS lesson_audio_teacher_all ON storage.objects;
DROP POLICY IF EXISTS lesson_audio_student_select ON storage.objects;
SELECT set_config('storage.allow_delete_query', 'true', false);
DELETE FROM storage.buckets WHERE id = 'lesson-audio';

-- L'ancienne signature référence lessons/student_progress : on la retire avant
DROP FUNCTION IF EXISTS public.submit_session_record(
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb, jsonb, jsonb, text
);

DROP TABLE IF EXISTS public.student_progress;
ALTER TABLE public.lesson_records DROP COLUMN IF EXISTS lesson_id;
DROP TABLE IF EXISTS public.audio_assets CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TYPE IF EXISTS public.lesson_phase;

-- submit_session_record sans p_lesson_id / p_advance_progress (plus de curseur)
CREATE OR REPLACE FUNCTION public.submit_session_record(
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
  p_custom_title text DEFAULT NULL
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
  v_root text;
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

  -- 1) Séance
  INSERT INTO public.lesson_records
    (student_id, teacher_id, session_date, attendance, public_recap, support_files, custom_title)
  VALUES
    (p_student_id, v_teacher_id, p_session_date, p_attendance,
     NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
     COALESCE(p_support_files, '[]'::jsonb),
     v_custom_title)
  RETURNING id INTO v_record_id;

  -- 2) Vocabulaire
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_vocab, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_word', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_definition', '')), '');
    v_root := NULLIF(BTRIM(COALESCE(v_item ->> 'root', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.vocabulary
        (student_id, arabic_word, french_definition, root, lesson_record_id)
      VALUES (p_student_id, v_arabic, v_french, v_root, v_record_id);
    END IF;
  END LOOP;

  -- 3) Règles de grammaire
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

  -- 4) Formulations (expressions ar ↔ fr)
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_formulations, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_text', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_text', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.formulations
        (student_id, arabic_text, french_text, lesson_record_id)
      VALUES (p_student_id, v_arabic, v_french, v_record_id);
    END IF;
  END LOOP;

  -- 5) Devoir
  IF NULLIF(BTRIM(COALESCE(p_homework_instructions, '')), '') IS NOT NULL THEN
    INSERT INTO public.homework (student_id, lesson_record_id, instructions, status)
    VALUES (p_student_id, v_record_id, BTRIM(p_homework_instructions), 'a_rendre');
  END IF;

  -- 6) Note privée
  IF NULLIF(BTRIM(COALESCE(p_private_note, '')), '') IS NOT NULL THEN
    INSERT INTO public.session_private_notes (lesson_record_id, teacher_id, content)
    VALUES (v_record_id, v_teacher_id, BTRIM(p_private_note));
  END IF;

  -- 7) Règle d'absence (§8)
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
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb, text
) TO authenticated;
