-- 48 — Audio de formulation (compréhension orale au quiz)
--
-- Demande propriétaire : enregistrer sa voix (l'expression arabe) pour chaque
-- formulation en fiche de fin de cours. L'audio ne sert QUE dans le quiz de
-- formulation : le sens AR→FR devient exclusivement audio (écouter la voix du
-- prof → choisir la traduction française) ; le sens FR→AR reste en texte avec
-- 4 propositions arabes. Une formulation sans audio ne sort jamais en AR→FR.
-- Les pages de consultation élève n'exposent jamais l'audio (colonnes
-- explicites partout côté client, et le payload AR→FR ne contient pas le
-- texte arabe — anti-triche : rien à lire dans les devtools).

-- ── 1) Colonne ───────────────────────────────────────────────────────────────
ALTER TABLE public.formulations ADD COLUMN IF NOT EXISTS audio_path text;

-- ── 2) Bucket privé + policies ───────────────────────────────────────────────
-- Chemins : {student_id}/{timestamp}_{rand}.{ext} — même convention que
-- session-files. Enseignant scopé à SES élèves (plus strict que le pattern
-- session-files de la migration 19, conforme deny-by-default).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('formulation-audio', 'formulation-audio', false, 5242880)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "formulation_audio_teacher_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'formulation-audio'
    AND private.current_teacher_id() IS NOT NULL
    AND private.owns_student(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'formulation-audio'
    AND private.current_teacher_id() IS NOT NULL
    AND private.owns_student(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "formulation_audio_student_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'formulation-audio'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

-- ── 3) submit_session_record : audio_path lu dans p_formulations ────────────
-- Même signature (le jsonb transporte simplement une clé de plus) → CREATE OR
-- REPLACE sans DROP, compatible avec le client déployé.
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
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.vocabulary
        (student_id, arabic_word, french_definition, root, lesson_record_id)
      VALUES (p_student_id, v_arabic, v_french,
              NULLIF(BTRIM(COALESCE(v_item ->> 'root', '')), ''), v_record_id);
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

  -- 4) Formulations (expressions ar ↔ fr, audio optionnel)
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

-- ── 4) update_session_record : audio_path lu dans p_formulations ────────────
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
  v_audio            text;
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
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.vocabulary (student_id, arabic_word, french_definition, root, lesson_record_id)
      VALUES (v_student_id, v_arabic, v_french,
              NULLIF(BTRIM(COALESCE(v_item ->> 'root', '')), ''), p_record_id);
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

  -- 4) Formulations : remplacement complet (audio_path porté par le payload —
  -- un audio conservé est re-transmis par le client, un retiré disparaît)
  DELETE FROM public.formulations WHERE lesson_record_id = p_record_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_formulations, '[]'::jsonb))
  LOOP
    v_arabic := NULLIF(BTRIM(COALESCE(v_item ->> 'arabic_text', '')), '');
    v_french := NULLIF(BTRIM(COALESCE(v_item ->> 'french_text', '')), '');
    v_audio  := NULLIF(BTRIM(COALESCE(v_item ->> 'audio_path', '')), '');
    IF v_arabic IS NOT NULL AND v_french IS NOT NULL THEN
      INSERT INTO public.formulations (student_id, arabic_text, french_text, audio_path, lesson_record_id)
      VALUES (v_student_id, v_arabic, v_french, v_audio, p_record_id);
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

-- ── 5) generate_formulation_quiz : AR→FR = compréhension orale uniquement ────
-- Le sens AR→FR ne sort que pour une formulation AVEC audio, et le payload ne
-- contient JAMAIS le texte arabe (seulement audio_path) : l'élève doit écouter.
-- Sans audio, la formulation ne sort qu'en FR→AR (texte, comme avant).
CREATE OR REPLACE FUNCTION public.generate_formulation_quiz(
  p_student_id       uuid,
  p_lesson_record_id uuid DEFAULT NULL,
  p_size             int  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student        uuid;
  v_pool_count     int;
  v_effective_size int;
  v_questions      jsonb := '[]'::jsonb;
  v_item           record;
  v_direction      text;
  v_correct        text;
  v_distractors    text[];
  v_choices        text[];
  v_pos            int;
  v_d_idx          int;
  v_question       jsonb;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_pool_count
  FROM   public.formulations f
  WHERE  f.student_id = p_student_id
    AND  (p_lesson_record_id IS NULL OR f.lesson_record_id = p_lesson_record_id);

  v_effective_size := COALESCE(p_size, GREATEST(1, ROUND(v_pool_count / 2.0)::int));

  FOR v_item IN
    SELECT f.id, f.arabic_text, f.french_text, f.audio_path
    FROM   public.formulations f
    WHERE  f.student_id = p_student_id
      AND  (p_lesson_record_id IS NULL OR f.lesson_record_id = p_lesson_record_id)
    ORDER BY random()
    LIMIT v_effective_size
  LOOP
    IF v_item.audio_path IS NOT NULL AND random() < 0.5 THEN
      v_direction := 'ar_to_fr';
      v_correct   := v_item.french_text;
      SELECT ARRAY_AGG(d.french_text)
      INTO   v_distractors
      FROM   (
        SELECT french_text FROM public.formulations
        WHERE  student_id = p_student_id AND id != v_item.id
        ORDER BY random() LIMIT 3
      ) d;
    ELSE
      v_direction := 'fr_to_ar';
      v_correct   := v_item.arabic_text;
      SELECT ARRAY_AGG(d.arabic_text)
      INTO   v_distractors
      FROM   (
        SELECT arabic_text FROM public.formulations
        WHERE  student_id = p_student_id AND id != v_item.id
        ORDER BY random() LIMIT 3
      ) d;
    END IF;

    CONTINUE WHEN array_length(v_distractors, 1) IS NULL
               OR array_length(v_distractors, 1) < 3;

    v_pos    := 1 + (floor(random() * 4))::int;
    v_choices := '{}';
    v_d_idx   := 1;
    FOR i IN 1..4 LOOP
      IF i = v_pos THEN
        v_choices := array_append(v_choices, v_correct);
      ELSE
        v_choices := array_append(v_choices, v_distractors[v_d_idx]);
        v_d_idx   := v_d_idx + 1;
      END IF;
    END LOOP;

    IF v_direction = 'ar_to_fr' THEN
      v_question := jsonb_build_object(
        'form_id',    v_item.id,
        'direction',  v_direction,
        'audio_path', v_item.audio_path,
        'choices',    to_jsonb(v_choices)
      );
    ELSE
      v_question := jsonb_build_object(
        'form_id',   v_item.id,
        'direction', v_direction,
        'prompt',    v_item.french_text,
        'choices',   to_jsonb(v_choices)
      );
    END IF;

    v_questions := v_questions || v_question;
  END LOOP;

  RETURN v_questions;
END;
$$;
