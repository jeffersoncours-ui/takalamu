-- 43 — Modifier / supprimer une séance depuis la fiche prof
--
-- Demande propriétaire : une fiche de fin de cours envoyée accidentellement
-- avant d'être complète (bug d'usage réel côté prof) doit pouvoir être
-- corrigée ou effacée après coup. RLS existante (lr_teacher_all,
-- vocab_teacher_all, gr_teacher_all, hw_teacher_all, session_notes_owner_all,
-- toutes migration 03/10) autorise déjà UPDATE/DELETE pour l'enseignant
-- propriétaire — ces RPC encapsulent juste la logique métier (cascade
-- complète, compteur d'absences, protection du travail élève déjà rendu)
-- que RLS seule ne peut pas exprimer.
--
-- Règles :
--  • update_session_record : remplace intégralement vocab/grammar liés
--    (mêmes règles que la création — la fiche envoie toujours la liste
--    complète). Devoir : jamais écrasé silencieusement si l'élève a déjà
--    rendu/corrigé (status != 'a_rendre') — seul le texte peut être mis à
--    jour dans ce cas, jamais supprimé. Note privée : upsert/delete simple
--    (jamais vue par l'élève, pas de risque de perte de travail élève).
--    Recalcule le compteur d'absences injustifiées si la présence change.
--  • delete_session_record : supprime la séance et son vocab/grammaire.
--    Devoir : supprimé seulement si jamais touché par l'élève (a_rendre),
--    sinon détaché (lesson_record_id = NULL, cohérent avec le ON DELETE SET
--    NULL déjà en place sur la FK) pour ne jamais perdre une copie rendue.
--    Note privée : ON DELETE CASCADE déjà en place (migration 10).
--    Décompte le compteur d'absences si la séance supprimée en comptait une,
--    et réactive le compte si ça repasse sous le seuil de suspension (§8).

CREATE OR REPLACE FUNCTION public.update_session_record(
  p_record_id             uuid,
  p_session_date          timestamptz,
  p_attendance            public.attendance_status,
  p_public_recap          text  DEFAULT NULL,
  p_private_note          text  DEFAULT NULL,
  p_homework_instructions text  DEFAULT NULL,
  p_vocab                 jsonb DEFAULT '[]'::jsonb,
  p_grammar               jsonb DEFAULT '[]'::jsonb,
  p_support_files         jsonb DEFAULT '[]'::jsonb
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

  -- 2) Vocabulaire : remplacement complet (la fiche envoie toujours la liste entière)
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

  -- 4) Devoir : jamais écrasé/supprimé silencieusement si déjà touché par l'élève
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

  -- 5) Note privée : upsert / delete simple
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

  -- 6) Règle d'absence (§8) : ré-évalue le compteur si la présence a changé
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
  uuid, timestamptz, public.attendance_status, text, text, text, jsonb, jsonb, jsonb
) TO authenticated;


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

  -- Devoir jamais touché par l'élève → supprimé avec la séance.
  -- Devoir déjà rendu/corrigé → détaché (jamais perdu), cohérent avec ON DELETE SET NULL.
  DELETE FROM public.homework WHERE lesson_record_id = p_record_id AND status = 'a_rendre';
  UPDATE public.homework SET lesson_record_id = NULL WHERE lesson_record_id = p_record_id;

  -- session_private_notes : ON DELETE CASCADE déjà en place (migration 10)

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
