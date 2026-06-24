-- Migration 24 — Grammar quiz (teacher-authored QCM, anti-cheat)

-- 1. Add 'grammar' source type
ALTER TYPE public.quiz_source ADD VALUE IF NOT EXISTS 'grammar';

-- 2. Track which teacher owns a grammar quiz
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id);

-- 3. Cascade deletes from quizzes → questions/attempts (for clean cleanup)
ALTER TABLE public.quiz_questions
  DROP CONSTRAINT IF EXISTS quiz_questions_quiz_id_fkey;
ALTER TABLE public.quiz_questions
  ADD CONSTRAINT quiz_questions_quiz_id_fkey
    FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey;
ALTER TABLE public.quiz_attempts
  ADD CONSTRAINT quiz_attempts_quiz_id_fkey
    FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- 4. RPC: student reads questions WITHOUT correct_answer (choices shuffled)
CREATE OR REPLACE FUNCTION public.get_grammar_quiz_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_student          uuid;
  v_student_teacher  uuid;
  v_quiz_teacher     uuid;
  v_result           jsonb := '[]'::jsonb;
  v_question         record;
  v_choices          text[];
  v_insert_pos       int;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN RAISE EXCEPTION '42501'; END IF;

  SELECT s.teacher_id INTO v_student_teacher
  FROM public.students s WHERE s.id = v_student;

  SELECT q.teacher_id INTO v_quiz_teacher
  FROM public.quizzes q
  WHERE q.id = p_quiz_id AND q.source_type = 'grammar';

  IF v_quiz_teacher IS NULL OR v_quiz_teacher != v_student_teacher THEN
    RAISE EXCEPTION '42501';
  END IF;

  FOR v_question IN
    SELECT id, prompt, correct_answer, distractors
    FROM public.quiz_questions
    WHERE quiz_id = p_quiz_id
    ORDER BY created_at
  LOOP
    IF array_length(v_question.distractors, 1) IS NULL THEN
      v_choices := ARRAY[v_question.correct_answer];
    ELSE
      v_choices := v_question.distractors;
      v_insert_pos := 1 + (floor(random() * (array_length(v_choices, 1) + 1)))::int;
      v_choices := v_choices[1 : v_insert_pos - 1]
                   || ARRAY[v_question.correct_answer]
                   || v_choices[v_insert_pos :];
    END IF;

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'question_id', v_question.id,
      'prompt',      v_question.prompt,
      'choices',     to_jsonb(v_choices)
    ));
  END LOOP;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_grammar_quiz_questions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_grammar_quiz_questions(uuid) TO authenticated;

-- 5. RPC: submit grammar quiz (server-side score, anti-cheat)
CREATE OR REPLACE FUNCTION public.submit_grammar_quiz(
  p_student_id  uuid,
  p_quiz_id     uuid,
  p_answers     jsonb   -- [{question_id, chosen}]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_student         uuid;
  v_student_teacher uuid;
  v_quiz_teacher    uuid;
  v_total           int;
  v_score           int := 0;
  v_idx             int;
  v_item            jsonb;
  v_question_id     uuid;
  v_chosen          text;
  v_correct         text;
  v_is_correct      bool;
  v_detail          jsonb := '[]'::jsonb;
  v_attempt_id      uuid;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION '42501';
  END IF;

  SELECT s.teacher_id INTO v_student_teacher
  FROM public.students s WHERE s.id = v_student;

  SELECT q.teacher_id INTO v_quiz_teacher
  FROM public.quizzes q
  WHERE q.id = p_quiz_id AND q.source_type = 'grammar';

  IF v_quiz_teacher IS NULL OR v_quiz_teacher != v_student_teacher THEN
    RAISE EXCEPTION '42501';
  END IF;

  v_total := jsonb_array_length(p_answers);

  FOR v_idx IN 0 .. v_total - 1 LOOP
    v_item        := p_answers->v_idx;
    v_question_id := (v_item->>'question_id')::uuid;
    v_chosen      := v_item->>'chosen';

    SELECT correct_answer INTO v_correct
    FROM public.quiz_questions
    WHERE id = v_question_id AND quiz_id = p_quiz_id;

    v_is_correct := v_correct IS NOT NULL AND v_chosen = v_correct;
    IF v_is_correct THEN v_score := v_score + 1; END IF;

    v_detail := v_detail || jsonb_build_array(jsonb_build_object(
      'question_id', v_question_id,
      'chosen',      v_chosen,
      'correct',     v_correct,
      'is_correct',  v_is_correct
    ));
  END LOOP;

  INSERT INTO public.quiz_attempts (student_id, quiz_id, score, answers)
  VALUES (
    v_student,
    p_quiz_id,
    CASE WHEN v_total > 0 THEN v_score::numeric / v_total ELSE 0 END,
    v_detail
  )
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'score',           v_score,
    'total',           v_total,
    'quiz_attempt_id', v_attempt_id,
    'answers',         v_detail
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_grammar_quiz(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_grammar_quiz(uuid, uuid, jsonb) TO authenticated;
