-- 40 — Quiz vocabulaire filtrable par séance (cours)
--
-- L'ancien filtre p_lesson_id pointait vers lessons.id (notion de "leçon de
-- programme"), défunte depuis la suppression de l'onglet Programme (session 25)
-- + le retrait du choix de leçon dans la fiche de fin de cours. Le vocabulaire
-- est en réalité rattaché à une SÉANCE (lesson_records) via lesson_record_id.
-- On rebranche donc le filtre sur p_lesson_record_id → "quiz d'un cours précis"
-- ou, si NULL, "quiz sur tout le glossaire".
--
-- Changement de signature (rename de paramètre) → drop + recreate obligatoire.

DROP FUNCTION IF EXISTS public.generate_individual_quiz(uuid, uuid, int);

CREATE OR REPLACE FUNCTION public.generate_individual_quiz(
  p_student_id       uuid,
  p_lesson_record_id uuid DEFAULT NULL,
  p_size             int  DEFAULT 10
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
      AND  (p_lesson_record_id IS NULL OR v.lesson_record_id = p_lesson_record_id)
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

    -- Passe si pas assez de distracteurs (glossaire total < 4)
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

GRANT EXECUTE ON FUNCTION public.generate_individual_quiz(uuid, uuid, int) TO authenticated;
