-- 51 — Quiz formulation : 3ᵉ mode « FR → écoute des 4 audios »
--
-- Demande propriétaire : maintenant que tous les audios de formulation existent,
-- ajouter un mode où la QUESTION est en texte français et les 4 PROPOSITIONS sont
-- des audios arabes (la bonne + 3 distracteurs). L'élève écoute et retrouve lequel
-- traduit la phrase française.
--
-- Anti-triche (cohérent avec le mode AR→FR de la migration 48) : le payload d'une
-- question `fr_to_ar_audio` ne contient AUCUN texte arabe NI l'identifiant de la
-- formulation-source — seulement le prompt français (affiché) et 4 audio_choices
-- {id, audio_path} mélangés. Rien à lire ni à corréler dans les devtools : l'élève
-- doit écouter pour répondre.
--
-- Filet de sécurité : le mode ne se déclenche que si la source ET au moins 3 autres
-- formulations ont un audio. Sinon la formulation ne sort qu'en FR→AR texte (ou
-- AR→FR audio si elle a un audio) — exactement comme avant.
--
-- Signatures inchangées → CREATE OR REPLACE sans DROP.

-- ── generate_formulation_quiz : 3 directions possibles ───────────────────────
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
  v_audio_pool     int;   -- nb de formulations de l'élève AVEC audio (tout le glossaire)
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

  -- Distracteurs audio tirés de TOUT le glossaire de l'élève (comme les distracteurs
  -- texte). Le mode audio-choix a besoin de la source + 3 autres → au moins 4 audios.
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
    -- Directions candidates pour cette formulation
    v_dirs := ARRAY['fr_to_ar'];                       -- texte (toujours possible)
    IF v_item.audio_path IS NOT NULL THEN
      v_dirs := array_append(v_dirs, 'ar_to_fr');      -- écoute la source → choix FR texte
      IF v_audio_pool >= 4 THEN
        v_dirs := array_append(v_dirs, 'fr_to_ar_audio'); -- lit le FR → choix audio arabe
      END IF;
    END IF;
    v_direction := v_dirs[1 + (floor(random() * array_length(v_dirs, 1)))::int];

    -- ── Mode audio-choix : FR affiché, 4 audios arabes à écouter ──────────────
    IF v_direction = 'fr_to_ar_audio' THEN
      -- source + 3 distracteurs (autres formulations AVEC audio), mélangés.
      -- Aucun texte arabe ni marquage de la bonne réponse dans le payload.
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

    -- ── Modes texte / audio-question (existant) ───────────────────────────────
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

GRANT EXECUTE ON FUNCTION public.generate_formulation_quiz(uuid, uuid, int) TO authenticated;

-- ── submit_formulation_quiz : scoring des 3 directions ───────────────────────
-- fr_to_ar_audio : la réponse envoyée est l'ID de la formulation choisie + le prompt
-- français (round-trip). Correct si le FR de la formulation choisie == le prompt.
-- Aucun besoin de l'ID-source (leak-free) : on identifie la cible par le prompt.
CREATE OR REPLACE FUNCTION public.submit_formulation_quiz(
  p_student_id uuid,
  p_answers    jsonb   -- [{form_id, direction, chosen}] ou [{direction:'fr_to_ar_audio', chosen:<id>, prompt}]
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
  v_is_correct boolean;
  v_prompt     text;
  v_chosen_fr  text;
  v_chosen_ar  text;
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
    v_direction := v_item->>'direction';
    v_chosen    := v_item->>'chosen';

    IF v_direction = 'fr_to_ar_audio' THEN
      -- La formulation choisie (par son id) : sa version FR doit correspondre au prompt.
      v_prompt := v_item->>'prompt';
      SELECT french_text, arabic_text INTO v_chosen_fr, v_chosen_ar
      FROM   public.formulations
      WHERE  id = (v_chosen)::uuid AND student_id = p_student_id;

      v_is_correct := v_chosen_fr IS NOT NULL
                  AND BTRIM(v_chosen_fr) = BTRIM(COALESCE(v_prompt, ''));

      -- Pour la revue : l'arabe cible = une formulation dont le FR == prompt
      SELECT arabic_text INTO v_correct
      FROM   public.formulations
      WHERE  student_id = p_student_id AND BTRIM(french_text) = BTRIM(COALESCE(v_prompt, ''))
      ORDER BY (audio_path IS NOT NULL) DESC
      LIMIT 1;

      IF v_is_correct THEN v_score := v_score + 1; END IF;

      v_enriched := v_enriched || jsonb_build_object(
        'form_id',    v_chosen,          -- l'id choisi (opaque, pas de texte)
        'direction',  v_direction,
        'chosen',     v_chosen_ar,       -- arabe de la formulation choisie (revue post-quiz)
        'correct',    v_correct,
        'is_correct', v_is_correct
      );
      CONTINUE;
    END IF;

    -- Directions texte / audio-question : chosen = le texte cliqué, form_id = source.
    v_form_id := (v_item->>'form_id')::uuid;
    IF v_direction = 'fr_to_ar' THEN
      SELECT arabic_text INTO v_correct
      FROM   public.formulations
      WHERE  id = v_form_id AND student_id = p_student_id;
    ELSE
      SELECT french_text INTO v_correct
      FROM   public.formulations
      WHERE  id = v_form_id AND student_id = p_student_id;
    END IF;

    v_is_correct := v_correct IS NOT NULL AND v_correct = v_chosen;
    IF v_is_correct THEN v_score := v_score + 1; END IF;

    v_enriched := v_enriched || jsonb_build_object(
      'form_id',    v_form_id,
      'direction',  v_direction,
      'chosen',     v_chosen,
      'correct',    v_correct,
      'is_correct', v_is_correct
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
