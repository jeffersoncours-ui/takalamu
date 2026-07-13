-- 52 — Drapeau de compatibilité pour le mode audio-choix (base partagée preview/prod)
--
-- La migration 51 a fait émettre à generate_formulation_quiz une nouvelle direction
-- `fr_to_ar_audio`. Mais la base est partagée entre la preview et la prod : le client
-- PROD encore déployé (ancien code) ne sait pas rendre ce mode et planterait s'il le
-- recevait. On protège la prod avec un opt-in explicite : le mode audio-choix n'est
-- émis que si l'appelant passe `p_allow_audio_choices => true` — ce que seul le
-- nouveau client fait. L'ancien client prod (2 args) tombe sur le défaut false et ne
-- reçoit jamais le nouveau mode. La preview (nouveau client) l'active. Une fois la
-- prod déployée, ce drapeau devient inoffensif (toujours passé à true).
--
-- Ajout d'un paramètre → DROP + CREATE (pas CREATE OR REPLACE) puis re-GRANT.

DROP FUNCTION IF EXISTS public.generate_formulation_quiz(uuid, uuid, int);

CREATE FUNCTION public.generate_formulation_quiz(
  p_student_id          uuid,
  p_lesson_record_id    uuid    DEFAULT NULL,
  p_size                int     DEFAULT NULL,
  p_allow_audio_choices boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student        uuid;
  v_pool_count     int;
  v_audio_pool     int;
  v_effective_size int;
  v_questions      jsonb := '[]'::jsonb;
  v_item           record;
  v_dirs           text[];
  v_direction      text;
  v_correct        text;
  v_distractors    text[];
  v_choices        text[];
  v_audio_choices  jsonb;
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

  SELECT count(*) INTO v_audio_pool
  FROM   public.formulations
  WHERE  student_id = p_student_id AND audio_path IS NOT NULL;

  v_effective_size := COALESCE(p_size, GREATEST(1, ROUND(v_pool_count / 2.0)::int));

  FOR v_item IN
    SELECT f.id, f.arabic_text, f.french_text, f.audio_path
    FROM   public.formulations f
    WHERE  f.student_id = p_student_id
      AND  (p_lesson_record_id IS NULL OR f.lesson_record_id = p_lesson_record_id)
    ORDER BY random()
    LIMIT v_effective_size
  LOOP
    v_dirs := ARRAY['fr_to_ar'];
    IF v_item.audio_path IS NOT NULL THEN
      v_dirs := array_append(v_dirs, 'ar_to_fr');
      IF p_allow_audio_choices AND v_audio_pool >= 4 THEN
        v_dirs := array_append(v_dirs, 'fr_to_ar_audio');
      END IF;
    END IF;
    v_direction := v_dirs[1 + (floor(random() * array_length(v_dirs, 1)))::int];

    IF v_direction = 'fr_to_ar_audio' THEN
      SELECT jsonb_agg(
               jsonb_build_object('id', c.id, 'audio_path', c.audio_path)
               ORDER BY random()
             )
      INTO   v_audio_choices
      FROM   (
        SELECT v_item.id AS id, v_item.audio_path AS audio_path
        UNION ALL
        SELECT d.id, d.audio_path
        FROM   (
          SELECT id, audio_path
          FROM   public.formulations
          WHERE  student_id = p_student_id
            AND  id != v_item.id
            AND  audio_path IS NOT NULL
          ORDER BY random()
          LIMIT 3
        ) d
      ) c;

      CONTINUE WHEN v_audio_choices IS NULL
                 OR jsonb_array_length(v_audio_choices) < 4;

      v_question := jsonb_build_object(
        'direction',     'fr_to_ar_audio',
        'prompt',        v_item.french_text,
        'audio_choices', v_audio_choices
      );
      v_questions := v_questions || v_question;
      CONTINUE;
    END IF;

    IF v_direction = 'ar_to_fr' THEN
      v_correct := v_item.french_text;
      SELECT ARRAY_AGG(d.french_text)
      INTO   v_distractors
      FROM   (
        SELECT french_text FROM public.formulations
        WHERE  student_id = p_student_id AND id != v_item.id
        ORDER BY random() LIMIT 3
      ) d;
    ELSE
      v_correct := v_item.arabic_text;
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

GRANT EXECUTE ON FUNCTION public.generate_formulation_quiz(uuid, uuid, int, boolean) TO authenticated;
