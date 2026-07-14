-- Correction unifiée d'un quiz de langue mêlant vocabulaire ET formulation.
-- Le tableau de réponses est hétérogène : une réponse porte 'vocab_id' (mot)
-- OU 'form_id' (formulation) OU direction 'fr_to_ar_audio' (formulation audio).
-- On réutilise à l'identique la logique de scoring des RPC d'origine, mais on
-- n'écrit qu'UNE seule ligne quiz_attempts (un quiz = un score, un historique).
-- Les distracteurs restent générés côté génération (par type), jamais mélangés.
CREATE OR REPLACE FUNCTION public.submit_language_quiz(p_student_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_student    uuid;
  v_score      int   := 0;
  v_total      int;
  v_quiz_id    uuid;
  v_attempt_id uuid;
  v_enriched   jsonb := '[]'::jsonb;
  v_idx        int;
  v_item       jsonb;
  v_direction  text;
  v_chosen     text;
  v_correct    text;
  v_is_correct boolean;
  v_vocab_id   uuid;
  v_form_id    uuid;
  v_prompt     text;
  v_chosen_fr  text;
  v_chosen_ar  text;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL OR v_student != p_student_id THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.quizzes (scope, source_type, title)
  VALUES ('individual', 'language', 'Langue auto')
  RETURNING id INTO v_quiz_id;

  v_total := jsonb_array_length(p_answers);

  FOR v_idx IN 0..v_total - 1 LOOP
    v_item      := p_answers->v_idx;
    v_direction := v_item->>'direction';
    v_chosen    := v_item->>'chosen';

    -- ── Vocabulaire (identifié par la clé vocab_id) ──────────────────────────
    IF v_item ? 'vocab_id' THEN
      v_vocab_id := (v_item->>'vocab_id')::uuid;
      IF v_direction = 'fr_to_ar' THEN
        SELECT arabic_word INTO v_correct
        FROM public.vocabulary WHERE id = v_vocab_id AND student_id = p_student_id;
      ELSE
        SELECT french_definition INTO v_correct
        FROM public.vocabulary WHERE id = v_vocab_id AND student_id = p_student_id;
      END IF;
      v_is_correct := v_correct IS NOT NULL AND v_correct = v_chosen;
      IF v_is_correct THEN v_score := v_score + 1; END IF;
      v_enriched := v_enriched || jsonb_build_object(
        'source', 'vocab', 'vocab_id', v_vocab_id, 'direction', v_direction,
        'chosen', v_chosen, 'correct', v_correct, 'is_correct', v_is_correct);
      CONTINUE;
    END IF;

    -- ── Formulation audio (fr → écoute des 4 audios) ─────────────────────────
    IF v_direction = 'fr_to_ar_audio' THEN
      v_prompt := v_item->>'prompt';
      SELECT french_text, arabic_text INTO v_chosen_fr, v_chosen_ar
      FROM   public.formulations
      WHERE  id = (v_chosen)::uuid AND student_id = p_student_id;

      v_is_correct := v_chosen_fr IS NOT NULL
                  AND BTRIM(v_chosen_fr) = BTRIM(COALESCE(v_prompt, ''));

      SELECT arabic_text INTO v_correct
      FROM   public.formulations
      WHERE  student_id = p_student_id AND BTRIM(french_text) = BTRIM(COALESCE(v_prompt, ''))
      ORDER BY (audio_path IS NOT NULL) DESC
      LIMIT 1;

      IF v_is_correct THEN v_score := v_score + 1; END IF;
      v_enriched := v_enriched || jsonb_build_object(
        'source', 'formulation', 'form_id', v_chosen, 'direction', v_direction,
        'chosen', v_chosen_ar, 'correct', v_correct, 'is_correct', v_is_correct);
      CONTINUE;
    END IF;

    -- ── Formulation texte (fr_to_ar / ar_to_fr) ──────────────────────────────
    v_form_id := (v_item->>'form_id')::uuid;
    IF v_direction = 'fr_to_ar' THEN
      SELECT arabic_text INTO v_correct
      FROM public.formulations WHERE id = v_form_id AND student_id = p_student_id;
    ELSE
      SELECT french_text INTO v_correct
      FROM public.formulations WHERE id = v_form_id AND student_id = p_student_id;
    END IF;
    v_is_correct := v_correct IS NOT NULL AND v_correct = v_chosen;
    IF v_is_correct THEN v_score := v_score + 1; END IF;
    v_enriched := v_enriched || jsonb_build_object(
      'source', 'formulation', 'form_id', v_form_id, 'direction', v_direction,
      'chosen', v_chosen, 'correct', v_correct, 'is_correct', v_is_correct);
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
$function$;
