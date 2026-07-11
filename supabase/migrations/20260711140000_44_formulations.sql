-- 44 — Formulations (expressions) : 3ᵉ jumeau du vocabulaire/grammaire
--
-- Demande propriétaire : à côté du vocabulaire (mots) et de la grammaire (règles),
-- une catégorie « Formulation » = expressions/phrases complètes en paire arabe ↔
-- français (ex. « من أين أنت؟ » / « d'où viens-tu ? »). Saisies en fin de cours,
-- consultables par l'élève, et testables via un quiz auto-généré identique au quiz
-- vocabulaire (comment dit-on…, distracteurs tirés des autres formulations).
--
-- Structure et RLS calquées sur `vocabulary`. Nouvelle valeur d'enum `formulation`
-- pour `quiz_source` (utilisée uniquement au runtime dans submit_formulation_quiz,
-- jamais dans le même transaction que le ALTER TYPE → sûr).

-- ── 1) Enum ──────────────────────────────────────────────────────────────────
ALTER TYPE public.quiz_source ADD VALUE IF NOT EXISTS 'formulation';

-- ── 2) Table ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.formulations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  arabic_text      text NOT NULL,
  french_text      text NOT NULL,
  lesson_record_id uuid REFERENCES public.lesson_records(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS formulations_student_idx ON public.formulations (student_id);
CREATE INDEX IF NOT EXISTS formulations_record_idx ON public.formulations (lesson_record_id);

ALTER TABLE public.formulations ENABLE ROW LEVEL SECURITY;

-- Élève : lecture seule des siennes. Enseignant : gère celles de ses élèves.
CREATE POLICY form_select_student ON public.formulations
  FOR SELECT TO authenticated USING (student_id = private.current_student_id());
CREATE POLICY form_teacher_all ON public.formulations
  FOR ALL TO authenticated
  USING (private.owns_student(student_id))
  WITH CHECK (private.owns_student(student_id));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.formulations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3) submit_session_record : + p_formulations ─────────────────────────────
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
  p_support_files jsonb DEFAULT '[]'::jsonb,
  p_formulations jsonb DEFAULT '[]'::jsonb
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
  uuid, timestamptz, public.attendance_status, uuid, boolean, text, text, text, jsonb, jsonb, jsonb, jsonb
) TO authenticated;

-- ── 4) update_session_record : + p_formulations ────────────────────────────
DROP FUNCTION IF EXISTS public.update_session_record(
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb
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
  p_formulations          jsonb DEFAULT '[]'::jsonb
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
BEGIN
  v_teacher_id := private.current_teacher_id();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un enseignant.' USING ERRCODE = '42501';
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
        support_files = COALESCE(p_support_files, '[]'::jsonb)
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
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb, jsonb
) TO authenticated;

-- ── 5) delete_session_record : + suppression formulations ───────────────────
CREATE OR REPLACE FUNCTION public.delete_session_record(p_record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_teacher_id uuid;
  v_student_id uuid;
  v_attendance public.attendance_status;
BEGIN
  v_teacher_id := private.current_teacher_id();
  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un enseignant.' USING ERRCODE = '42501';
  END IF;

  SELECT student_id, attendance INTO v_student_id, v_attendance
  FROM   public.lesson_records
  WHERE  id = p_record_id AND teacher_id = v_teacher_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Séance introuvable ou non autorisée.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.vocabulary     WHERE lesson_record_id = p_record_id;
  DELETE FROM public.grammar_rules  WHERE lesson_record_id = p_record_id;
  DELETE FROM public.formulations   WHERE lesson_record_id = p_record_id;

  DELETE FROM public.homework WHERE lesson_record_id = p_record_id AND status = 'a_rendre';
  UPDATE public.homework SET lesson_record_id = NULL WHERE lesson_record_id = p_record_id;

  IF v_attendance IN ('absent_unjustified', 'late') THEN
    UPDATE public.students
      SET unjustified_absences_count = GREATEST(0, unjustified_absences_count - 1),
          status = CASE
            WHEN status = 'suspended_absences' AND unjustified_absences_count - 1 < 3
            THEN 'active'::public.student_status
            ELSE status
          END
    WHERE id = v_student_id;
  END IF;

  DELETE FROM public.lesson_records WHERE id = p_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_session_record(uuid) TO authenticated;

-- ── 6) Quiz formulation auto-généré (mirror generate_individual_quiz, moitié) ─
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
  v_prompt         text;
  v_correct        text;
  v_distractors    text[];
  v_choices        text[];
  v_pos            int;
  v_d_idx          int;
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
    SELECT f.id, f.arabic_text, f.french_text
    FROM   public.formulations f
    WHERE  f.student_id = p_student_id
      AND  (p_lesson_record_id IS NULL OR f.lesson_record_id = p_lesson_record_id)
    ORDER BY random()
    LIMIT v_effective_size
  LOOP
    IF random() < 0.5 THEN
      v_direction := 'fr_to_ar';
      v_prompt    := v_item.french_text;
      v_correct   := v_item.arabic_text;
      SELECT ARRAY_AGG(d.arabic_text)
      INTO   v_distractors
      FROM   (
        SELECT arabic_text FROM public.formulations
        WHERE  student_id = p_student_id AND id != v_item.id
        ORDER BY random() LIMIT 3
      ) d;
    ELSE
      v_direction := 'ar_to_fr';
      v_prompt    := v_item.arabic_text;
      v_correct   := v_item.french_text;
      SELECT ARRAY_AGG(d.french_text)
      INTO   v_distractors
      FROM   (
        SELECT french_text FROM public.formulations
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

    v_questions := v_questions || jsonb_build_object(
      'form_id',   v_item.id,
      'direction', v_direction,
      'prompt',    v_prompt,
      'choices',   to_jsonb(v_choices)
    );
  END LOOP;

  RETURN v_questions;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_formulation_quiz(uuid, uuid, int) TO authenticated;

-- ── 7) submit_formulation_quiz (mirror submit_individual_quiz, anti-triche) ──
CREATE OR REPLACE FUNCTION public.submit_formulation_quiz(
  p_student_id uuid,
  p_answers    jsonb   -- [{form_id, direction, chosen}]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student    uuid;
  v_score      int   := 0;
  v_total      int;
  v_quiz_id    uuid;
  v_attempt_id uuid;
  v_enriched   jsonb := '[]'::jsonb;
  v_idx        int;
  v_item       jsonb;
  v_form_id    uuid;
  v_direction  text;
  v_chosen     text;
  v_correct    text;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.quizzes (scope, source_type, title)
  VALUES ('individual', 'formulation', 'Formulation auto')
  RETURNING id INTO v_quiz_id;

  v_total := jsonb_array_length(p_answers);

  FOR v_idx IN 0..v_total - 1 LOOP
    v_item      := p_answers->v_idx;
    v_form_id   := (v_item->>'form_id')::uuid;
    v_direction := v_item->>'direction';
    v_chosen    := v_item->>'chosen';

    IF v_direction = 'fr_to_ar' THEN
      SELECT arabic_text INTO v_correct
      FROM   public.formulations
      WHERE  id = v_form_id AND student_id = p_student_id;
    ELSE
      SELECT french_text INTO v_correct
      FROM   public.formulations
      WHERE  id = v_form_id AND student_id = p_student_id;
    END IF;

    IF v_correct IS NOT NULL AND v_correct = v_chosen THEN
      v_score := v_score + 1;
    END IF;

    v_enriched := v_enriched || jsonb_build_object(
      'form_id',    v_form_id,
      'direction',  v_direction,
      'chosen',     v_chosen,
      'correct',    v_correct,
      'is_correct', (v_correct IS NOT NULL AND v_correct = v_chosen)
    );
  END LOOP;

  INSERT INTO public.quiz_attempts (student_id, quiz_id, score, answers, taken_at)
  VALUES (
    p_student_id,
    v_quiz_id,
    CASE WHEN v_total > 0 THEN (v_score::numeric / v_total) ELSE 0::numeric END,
    v_enriched,
    now()
  )
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'score',           v_score,
    'total',           v_total,
    'quiz_attempt_id', v_attempt_id,
    'answers',         v_enriched
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_formulation_quiz(uuid, jsonb) TO authenticated;
