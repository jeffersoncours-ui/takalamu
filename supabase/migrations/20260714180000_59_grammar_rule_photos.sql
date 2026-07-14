-- Photos propres à chaque règle de grammaire (fiche de fin de cours) : distinctes
-- des « Supports » génériques de séance. Additif, rétrocompatible base partagée :
-- nouvelle colonne avec défaut, clé jsonb supplémentaire dans p_grammar (le client
-- encore déployé n'envoie jamais cette clé, COALESCE/->> gèrent son absence).

-- ── 1) Colonne ───────────────────────────────────────────────────────────────
ALTER TABLE public.grammar_rules ADD COLUMN IF NOT EXISTS photos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── 2) Bucket privé + policies (calqué sur formulation-audio, migration 48) ──
-- Chemins : {student_id}/{timestamp}_{rand}_{nom}.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('grammar-photos', 'grammar-photos', false, 20971520)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "grammar_photos_teacher_all" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'grammar-photos'
    AND private.current_teacher_id() IS NOT NULL
    AND private.owns_student(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'grammar-photos'
    AND private.current_teacher_id() IS NOT NULL
    AND private.owns_student(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "grammar_photos_student_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'grammar-photos'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

-- ── 3) submit_session_record / update_session_record : photos lues dans p_grammar
CREATE OR REPLACE FUNCTION public.submit_session_record(
  p_student_id uuid,
  p_session_date timestamp with time zone,
  p_attendance attendance_status DEFAULT 'present',
  p_public_recap text DEFAULT NULL::text,
  p_private_note text DEFAULT NULL::text,
  p_homework_instructions text DEFAULT NULL::text,
  p_vocab jsonb DEFAULT '[]'::jsonb,
  p_grammar jsonb DEFAULT '[]'::jsonb,
  p_support_files jsonb DEFAULT '[]'::jsonb,
  p_formulations jsonb DEFAULT '[]'::jsonb,
  p_custom_title text DEFAULT NULL::text,
  p_course_group_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_teacher_id uuid;
  v_record_id uuid;
  v_item jsonb;
  v_arabic text;
  v_french text;
  v_audio text;
  v_title text;
  v_content text;
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

  INSERT INTO public.lesson_records
    (student_id, teacher_id, session_date, attendance, public_recap, support_files, custom_title, course_group_id)
  VALUES
    (p_student_id, v_teacher_id, p_session_date, p_attendance,
     NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
     COALESCE(p_support_files, '[]'::jsonb),
     v_custom_title,
     COALESCE(p_course_group_id, gen_random_uuid()))
  RETURNING id INTO v_record_id;

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

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_grammar, '[]'::jsonb))
  LOOP
    v_title := NULLIF(BTRIM(COALESCE(v_item ->> 'title', '')), '');
    v_content := NULLIF(BTRIM(COALESCE(v_item ->> 'content', '')), '');
    IF v_title IS NOT NULL AND v_content IS NOT NULL THEN
      INSERT INTO public.grammar_rules
        (student_id, title, content, lesson_record_id, photos)
      VALUES (p_student_id, v_title, v_content, v_record_id,
              COALESCE(v_item -> 'photos', '[]'::jsonb));
    END IF;
  END LOOP;

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

  IF NULLIF(BTRIM(COALESCE(p_homework_instructions, '')), '') IS NOT NULL THEN
    INSERT INTO public.homework (student_id, lesson_record_id, instructions, status)
    VALUES (p_student_id, v_record_id, BTRIM(p_homework_instructions), 'a_rendre');
  END IF;

  IF NULLIF(BTRIM(COALESCE(p_private_note, '')), '') IS NOT NULL THEN
    INSERT INTO public.session_private_notes (lesson_record_id, teacher_id, content)
    VALUES (v_record_id, v_teacher_id, BTRIM(p_private_note));
  END IF;

  RETURN v_record_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_session_record(
  p_record_id uuid,
  p_session_date timestamp with time zone,
  p_attendance attendance_status DEFAULT 'present',
  p_public_recap text DEFAULT NULL::text,
  p_private_note text DEFAULT NULL::text,
  p_homework_instructions text DEFAULT NULL::text,
  p_vocab jsonb DEFAULT '[]'::jsonb,
  p_grammar jsonb DEFAULT '[]'::jsonb,
  p_support_files jsonb DEFAULT '[]'::jsonb,
  p_formulations jsonb DEFAULT '[]'::jsonb,
  p_custom_title text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_teacher_id       uuid;
  v_student_id       uuid;
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

  SELECT student_id INTO v_student_id
  FROM   public.lesson_records
  WHERE  id = p_record_id AND teacher_id = v_teacher_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Séance introuvable ou non autorisée.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.lesson_records
    SET session_date  = p_session_date,
        attendance    = p_attendance,
        public_recap  = NULLIF(BTRIM(COALESCE(p_public_recap, '')), ''),
        support_files = COALESCE(p_support_files, '[]'::jsonb),
        custom_title  = v_custom_title
  WHERE id = p_record_id;

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

  DELETE FROM public.grammar_rules WHERE lesson_record_id = p_record_id;
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_grammar, '[]'::jsonb))
  LOOP
    v_title   := NULLIF(BTRIM(COALESCE(v_item ->> 'title', '')), '');
    v_content := NULLIF(BTRIM(COALESCE(v_item ->> 'content', '')), '');
    IF v_title IS NOT NULL AND v_content IS NOT NULL THEN
      INSERT INTO public.grammar_rules (student_id, title, content, lesson_record_id, photos)
      VALUES (v_student_id, v_title, v_content, p_record_id,
              COALESCE(v_item -> 'photos', '[]'::jsonb));
    END IF;
  END LOOP;

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
END;
$function$;
