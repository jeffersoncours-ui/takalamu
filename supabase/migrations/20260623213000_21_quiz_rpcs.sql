-- 21 — Quiz vocabulaire auto-généré
-- RPCs: generate_individual_quiz, submit_individual_quiz
-- Aucune bonne réponse n'est renvoyée au client ; le score est recalculé côté serveur.

-- ── generate_individual_quiz ─────────────────────────────────────────────────
-- Renvoie un tableau JSON de questions SANS la bonne réponse.
-- Chaque entrée : { vocab_id, direction, prompt, choices[] }
-- direction = 'fr_to_ar' | 'ar_to_fr'
CREATE OR REPLACE FUNCTION public.generate_individual_quiz(
  p_student_id uuid,
  p_lesson_id   uuid DEFAULT NULL,
  p_size        int  DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student     uuid;
  v_questions   jsonb    := '[]'::jsonb;
  v_word        record;
  v_direction   text;
  v_prompt      text;
  v_correct     text;
  v_distractors text[];
  v_choices     text[];
  v_pos         int;
  v_d_idx       int;
BEGIN
  -- Seul l'étudiant lui-même peut générer son quiz
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  FOR v_word IN
    SELECT v.id, v.arabic_word, v.french_definition
    FROM   public.vocabulary v
    WHERE  v.student_id = p_student_id
      AND  (
        p_lesson_id IS NULL
        OR v.lesson_record_id IN (
          SELECT id FROM public.lesson_records
          WHERE  student_id = p_student_id AND lesson_id = p_lesson_id
        )
      )
    ORDER BY random()
    LIMIT p_size
  LOOP
    -- Direction aléatoire
    IF random() < 0.5 THEN
      v_direction := 'fr_to_ar';
      v_prompt    := v_word.french_definition;
      v_correct   := v_word.arabic_word;
      SELECT ARRAY_AGG(d.arabic_word)
      INTO   v_distractors
      FROM   (
        SELECT arabic_word FROM public.vocabulary
        WHERE  student_id = p_student_id AND id != v_word.id
        ORDER BY random() LIMIT 3
      ) d;
    ELSE
      v_direction := 'ar_to_fr';
      v_prompt    := v_word.arabic_word;
      v_correct   := v_word.french_definition;
      SELECT ARRAY_AGG(d.french_definition)
      INTO   v_distractors
      FROM   (
        SELECT french_definition FROM public.vocabulary
        WHERE  student_id = p_student_id AND id != v_word.id
        ORDER BY random() LIMIT 3
      ) d;
    END IF;

    -- Passe si pas assez de distracteurs (vocab total < 4)
    CONTINUE WHEN array_length(v_distractors, 1) IS NULL
               OR array_length(v_distractors, 1) < 3;

    -- Insère la bonne réponse à une position aléatoire parmi 4
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
      'vocab_id',  v_word.id,
      'direction', v_direction,
      'prompt',    v_prompt,
      'choices',   to_jsonb(v_choices)
    );
  END LOOP;

  RETURN v_questions;
END;
$$;

-- ── submit_individual_quiz ────────────────────────────────────────────────────
-- Reçoit les réponses du client, recalcule le score côté serveur (anti-triche),
-- insère un enregistrement dans quiz_attempts et renvoie le résultat enrichi.
CREATE OR REPLACE FUNCTION public.submit_individual_quiz(
  p_student_id uuid,
  p_answers    jsonb   -- [{vocab_id, direction, chosen}]
)
RETURNS jsonb   -- {score, total, quiz_attempt_id, answers}
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student    uuid;
  v_score      int     := 0;
  v_total      int;
  v_quiz_id    uuid;
  v_attempt_id uuid;
  v_enriched   jsonb   := '[]'::jsonb;
  v_idx        int;
  v_item       jsonb;
  v_vocab_id   uuid;
  v_direction  text;
  v_chosen     text;
  v_correct    text;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- Crée une ligne quiz (SECURITY DEFINER contourne la policy write teacher)
  INSERT INTO public.quizzes (scope, source_type, title)
  VALUES ('individual', 'glossary', 'Glossaire auto')
  RETURNING id INTO v_quiz_id;

  v_total := jsonb_array_length(p_answers);

  FOR v_idx IN 0..v_total - 1 LOOP
    v_item      := p_answers->v_idx;
    v_vocab_id  := (v_item->>'vocab_id')::uuid;
    v_direction := v_item->>'direction';
    v_chosen    := v_item->>'chosen';

    -- Récupère la vraie bonne réponse depuis la table vocabulary
    IF v_direction = 'fr_to_ar' THEN
      SELECT arabic_word       INTO v_correct
      FROM   public.vocabulary
      WHERE  id = v_vocab_id AND student_id = p_student_id;
    ELSE
      SELECT french_definition INTO v_correct
      FROM   public.vocabulary
      WHERE  id = v_vocab_id AND student_id = p_student_id;
    END IF;

    IF v_correct IS NOT NULL AND v_correct = v_chosen THEN
      v_score := v_score + 1;
    END IF;

    v_enriched := v_enriched || jsonb_build_object(
      'vocab_id',   v_vocab_id,
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
