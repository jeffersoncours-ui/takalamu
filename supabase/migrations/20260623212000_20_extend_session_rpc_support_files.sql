-- 20 — Extend submit_session_record to accept p_support_files
-- support_files stocké en JSON : tableau de { path, name }
DROP FUNCTION IF EXISTS public.submit_session_record(
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb
);
DROP FUNCTION IF EXISTS public.submit_session_record(
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb, jsonb
);

CREATE OR REPLACE FUNCTION public.submit_session_record(
  p_student_id uuid,
  p_session_date timestamptz,
  p_attendance public.attendance_status,
  p_lesson_id uuid DEFAULT NULL,
  p_advance_progress boolean DEFAULT false,
  p_public_recap text DEFAULT NULL,
  p_private_note text DEFAULT NULL,
  p_homework_instructions text DEFAULT NULL,
  p_vocab jsonb DEFAULT '[]'::jsonb,
  p_grammar jsonb DEFAULT '[]'::jsonb,
  p_support_files jsonb DEFAULT '[]'::jsonb
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
BEGIN
  v_teacher_id := private.current_teacher_id();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un enseignant.' USING ERRCODE = '42501';
  END IF;

  IF NOT private.owns_student(p_student_id) THEN
    RAISE EXCEPTION 'Élève non rattaché à cet enseignant.' USING ERRCODE = '42501';
  END IF;

  -- 1) Séance
  INSERT INTO public.lesson_records
    (student_id, teacher_id, lesson_id, session_date, attendance, public_recap, support_files)
  VALUES
    (p_student_id, v_teacher_id, p_lesson_id, p_session_date, p_attendance,
     NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
     COALESCE(p_support_files, '[]'::jsonb))
  RETURNING id INTO v_record_id;

  -- 2) Avance du curseur
  IF p_advance_progress AND p_lesson_id IS NOT NULL THEN
    INSERT INTO public.student_progress (student_id, current_lesson_id)
    VALUES (p_student_id, p_lesson_id)
    ON CONFLICT (student_id)
    DO UPDATE SET current_lesson_id = EXCLUDED.current_lesson_id;
  END IF;

  -- 3) Vocabulaire
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

  -- 4) Règles de grammaire
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

COMMENT ON FUNCTION public.submit_session_record IS
  'Fiche de fin de cours (§7.6) : soumission atomique alimentant lesson_records (avec support_files), vocabulary, grammar_rules, homework, student_progress et session_private_notes, avec application des règles d''absence (§8).';
