-- 45 — Nom de cours personnalisé (remplace « Cours N » à la saisie)
--
-- Demande propriétaire : au lieu de laisser l'affichage "Cours 1", "Cours 2"…
-- purement calculé par ordre chronologique (groupByLesson), l'enseignant tape
-- lui-même un nom pour chaque séance dans la fiche de fin de cours (obligatoire
-- pour toute NOUVELLE fiche). Les séances déjà existantes gardent leur
-- numérotation automatique (custom_title reste NULL, pas de backfill demandé —
-- l'enseignant les renommera à la main via "Modifier" s'il le souhaite).

ALTER TABLE public.lesson_records ADD COLUMN IF NOT EXISTS custom_title text;

-- ── submit_session_record : + p_custom_title (obligatoire) ──────────────────
DROP FUNCTION IF EXISTS public.submit_session_record(
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb, jsonb, jsonb
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
    (student_id, teacher_id, lesson_id, session_date, attendance, public_recap, support_files, custom_title)
  VALUES
    (p_student_id, v_teacher_id, p_lesson_id, p_session_date, p_attendance,
     NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
     COALESCE(p_support_files, '[]'::jsonb),
     v_custom_title)
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

  -- 5) Formulations (expressions ar ↔ fr)
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

  -- 6) Devoir
  IF NULLIF(BTRIM(COALESCE(p_homework_instructions, '')), '') IS NOT NULL THEN
    INSERT INTO public.homework (student_id, lesson_record_id, instructions, status)
    VALUES (p_student_id, v_record_id, BTRIM(p_homework_instructions), 'a_rendre');
  END IF;

  -- 7) Note privée
  IF NULLIF(BTRIM(COALESCE(p_private_note, '')), '') IS NOT NULL THEN
    INSERT INTO public.session_private_notes (lesson_record_id, teacher_id, content)
    VALUES (v_record_id, v_teacher_id, BTRIM(p_private_note));
  END IF;

  -- 8) Règle d'absence (§8)
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
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb, jsonb, jsonb, text
) TO authenticated;

-- ── update_session_record : + p_custom_title (obligatoire) ──────────────────
DROP FUNCTION IF EXISTS public.update_session_record(
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb
);

CREATE OR REPLACE FUNCTION public.update_session_record(
  p_record_id             uuid,
  p_session_date          timestamptz,
  p_attendance            public.attendance_status,
  p_public_recap          text  DEFAULT NULL,
  p_private_note          text  DEFAULT NULL,
  p_homework_instructions text  DEFAULT NULL,
  p_vocab                 jsonb DEFAULT '[]'::jsonb,
  p_grammar               jsonb DEFAULT '[]'::jsonb,
  p_support_files         jsonb DEFAULT '[]'::jsonb,
  p_formulations          jsonb DEFAULT '[]'::jsonb,
  p_custom_title          text  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_teacher_id       uuid;
  v_student_id       uuid;
  v_old_attendance   public.attendance_status;
  v_old_counts       boolean;
  v_new_counts       boolean;
  v_item             jsonb;
  v_arabic           text;
  v_french           text;
  v_root             text;
  v_title            text;
  v_content          text;
  v_hw_id            uuid;
  v_hw_status        public.homework_status;
  v_note_id          uuid;
  v_new_instructions text;
  v_custom_title     text;
BEGIN
  v_teacher_id := private.current_teacher_id();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un enseignant.' USING ERRCODE = '42501';
  END IF;

  v_custom_title := NULLIF(BTRIM(COALESCE(p_custom_title, '')), '');
  IF v_custom_title IS NULL THEN
    RAISE EXCEPTION 'Nom du cours obligatoire.' USING ERRCODE = '23514';
  END IF;

  SELECT student_id, attendance INTO v_student_id, v_old_attendance
  FROM   public.lesson_records
  WHERE  id = p_record_id AND teacher_id = v_teacher_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Séance introuvable ou non autorisée.' USING ERRCODE = '42501';
  END IF;

  -- 1) Séance
  UPDATE public.lesson_records
    SET session_date  = p_session_date,
        attendance    = p_attendance,
        public_recap  = NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
        support_files = COALESCE(p_support_files, '[]'::jsonb),
        custom_title  = v_custom_title
  WHERE id = p_record_id;

  -- 2) Vocabulaire : remplacement complet
  DELETE FROM public.vocabulary WHERE lesson_record_id = p_record_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_vocab, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_word', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_definition', '')), '');
    v_root   := NULLIF(BTRIM(COALESCE(v_item ->> 'root', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.vocabulary (student_id, arabic_word, french_definition, root, lesson_record_id)
      VALUES (v_student_id, v_arabic, v_french, v_root, p_record_id);
    END IF;
  END LOOP;

  -- 3) Grammaire : remplacement complet
  DELETE FROM public.grammar_rules WHERE lesson_record_id = p_record_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_grammar, '[]'::jsonb))
  LOOP
    v_title   := NULLIF(BTRIM(COALESCE(v_item ->> 'title', '')), '');
    v_content := NULLIF(BTRIM(COALESCE(v_item ->> 'content', '')), '');
    IF v_title IS NOT NULL AND v_content IS NOT NULL THEN
      INSERT INTO public.grammar_rules (student_id, title, content, lesson_record_id)
      VALUES (v_student_id, v_title, v_content, p_record_id);
    END IF;
  END LOOP;

  -- 4) Formulations : remplacement complet
  DELETE FROM public.formulations WHERE lesson_record_id = p_record_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_formulations, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_text', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_text', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.formulations (student_id, arabic_text, french_text, lesson_record_id)
      VALUES (v_student_id, v_arabic, v_french, p_record_id);
    END IF;
  END LOOP;

  -- 5) Devoir : jamais écrasé/supprimé silencieusement si déjà touché par l'élève
  v_new_instructions := NULLIF(BTRIM(COALESCE(p_homework_instructions, '')), '');
  SELECT id, status INTO v_hw_id, v_hw_status
  FROM public.homework WHERE lesson_record_id = p_record_id;

  IF v_new_instructions IS NOT NULL THEN
    IF v_hw_id IS NOT NULL THEN
      UPDATE public.homework SET instructions = v_new_instructions WHERE id = v_hw_id;
    ELSE
      INSERT INTO public.homework (student_id, lesson_record_id, instructions, status)
      VALUES (v_student_id, p_record_id, v_new_instructions, 'a_rendre');
    END IF;
  ELSIF v_hw_id IS NOT NULL AND v_hw_status = 'a_rendre' THEN
    DELETE FROM public.homework WHERE id = v_hw_id;
  END IF;

  -- 6) Note privée : upsert / delete simple
  SELECT id INTO v_note_id FROM public.session_private_notes WHERE lesson_record_id = p_record_id;
  IF NULLIF(BTRIM(COALESCE(p_private_note, '')), '') IS NOT NULL THEN
    IF v_note_id IS NOT NULL THEN
      UPDATE public.session_private_notes SET content = BTRIM(p_private_note) WHERE id = v_note_id;
    ELSE
      INSERT INTO public.session_private_notes (lesson_record_id, teacher_id, content)
      VALUES (p_record_id, v_teacher_id, BTRIM(p_private_note));
    END IF;
  ELSIF v_note_id IS NOT NULL THEN
    DELETE FROM public.session_private_notes WHERE id = v_note_id;
  END IF;

  -- 7) Règle d'absence (§8) : ré-évalue le compteur si la présence a changé
  v_old_counts := v_old_attendance IN ('absent_unjustified', 'late');
  v_new_counts := p_attendance IN ('absent_unjustified', 'late');

  IF v_old_counts AND NOT v_new_counts THEN
    UPDATE public.students
      SET unjustified_absences_count = GREATEST(0, unjustified_absences_count - 1),
          status = CASE
            WHEN status = 'suspended_absences' AND unjustified_absences_count - 1 < 3
            THEN 'active'::public.student_status
            ELSE status
          END
    WHERE id = v_student_id;
  ELSIF NOT v_old_counts AND v_new_counts THEN
    UPDATE public.students
      SET unjustified_absences_count = unjustified_absences_count + 1,
          status = CASE
            WHEN unjustified_absences_count + 1 >= 3 THEN 'suspended_absences'::public.student_status
            ELSE status
          END
    WHERE id = v_student_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_session_record(
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb, text
) TO authenticated;
