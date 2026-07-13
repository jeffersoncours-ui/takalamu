-- 53 — Dépôt de devoir robuste : multi-fichiers + upload direct + édition
--
-- Bug remonté (élève) : page 500 en rendant un devoir photo, une seule photo possible,
-- pas d'édition après coup. Cause racine : l'upload transitait par un server action
-- Next (plafond 1 Mo, et Vercel plafonne le corps serverless à ~4,5 Mo) → une photo
-- iPhone plantait avant même d'exécuter le code. Le nouveau flux uploade en direct
-- depuis le navigateur vers Storage (le fichier ne passe plus par le serveur) et ne
-- transmet que les chemins.
--
-- Ce fichier : (a) colonne liste `submission_files`, (b) buckets à 20 Mo, (c) policy
-- de suppression élève (nettoyage des pièces retirées), (d) nouvelle RPC
-- submit_homework(uuid, jsonb) qui remplace la liste — coexiste avec l'ancienne
-- (uuid, text) pour ne pas casser le client prod encore déployé (base partagée).

-- ── (a) Colonne liste (jumelle de lesson_records.support_files) ───────────────
ALTER TABLE public.homework
  ADD COLUMN IF NOT EXISTS submission_files jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill des dépôts existants (le cas échéant) : le fichier unique devient une
-- liste d'un élément. `submission_file` est conservé et resynchronisé pour que
-- l'ancien client prod (qui le lit encore) continue de fonctionner.
UPDATE public.homework
SET    submission_files = jsonb_build_array(
         jsonb_build_object('path', submission_file, 'name', submission_file)
       )
WHERE  submission_file IS NOT NULL
  AND  submission_files = '[]'::jsonb;

-- ── (b) Buckets à 20 Mo (photos pleine résolution) ───────────────────────────
UPDATE storage.buckets
SET    file_size_limit = 20971520
WHERE  id IN ('homework-submissions', 'session-files');

-- ── (c) L'élève peut supprimer ses propres pièces (nettoyage des retirées) ────
CREATE POLICY "hw_submissions_student_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'homework-submissions'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

-- ── (d) RPC submit_homework(uuid, jsonb) : remplace la liste ─────────────────
-- Coexiste avec l'ancienne submit_homework(uuid, text) : PostgREST distingue par les
-- noms de paramètres (p_files vs p_submission_file), donc l'ancien client prod reste
-- fonctionnel pendant la fenêtre preview/prod.
CREATE OR REPLACE FUNCTION public.submit_homework(
  p_homework_id uuid,
  p_files       jsonb   -- [{path, name}] (chemins déjà uploadés côté navigateur)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student         uuid;
  v_hw_student      uuid;
  v_status          public.homework_status;
  v_teacher_profile uuid;
  v_file            jsonb;
  v_path            text;
  v_count           int;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT student_id, status INTO v_hw_student, v_status
  FROM   public.homework
  WHERE  id = p_homework_id;

  IF v_hw_student IS NULL OR v_hw_student != v_student THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- Verrou : une fois corrigé (ou vu), l'élève ne peut plus toucher son dépôt.
  IF v_status NOT IN ('a_rendre', 'rendu') THEN
    RAISE EXCEPTION 'Devoir déjà corrigé — modification impossible.' USING ERRCODE = '42501';
  END IF;

  -- Chaque chemin doit être dans le dossier de l'élève (défense en profondeur).
  FOR v_file IN SELECT * FROM jsonb_array_elements(COALESCE(p_files, '[]'::jsonb))
  LOOP
    v_path := v_file ->> 'path';
    IF v_path IS NULL OR v_path NOT LIKE v_student::text || '/%' THEN
      RAISE EXCEPTION 'Fichier non autorisé.' USING ERRCODE = '42501';
    END IF;
  END LOOP;

  v_count := jsonb_array_length(COALESCE(p_files, '[]'::jsonb));

  UPDATE public.homework
  SET    submission_files = COALESCE(p_files, '[]'::jsonb),
         submission_file  = p_files -> 0 ->> 'path',   -- 1ʳᵉ pièce : compat ancien lecteur
         status           = CASE WHEN v_count > 0 THEN 'rendu' ELSE 'a_rendre' END::public.homework_status,
         submitted_at     = CASE WHEN v_count > 0 THEN now() ELSE NULL END
  WHERE  id = p_homework_id;

  -- Notifier l'enseignant uniquement au passage à_rendre → rendu (pas à chaque édition).
  IF v_status = 'a_rendre' AND v_count > 0 THEN
    SELECT t.profile_id INTO v_teacher_profile
    FROM   public.students s
    JOIN   public.teachers t ON t.id = s.teacher_id
    WHERE  s.id = v_student;

    IF v_teacher_profile IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, payload, read)
      VALUES (
        v_teacher_profile,
        'homework_submitted',
        jsonb_build_object('url', '/teacher/homework'),
        false
      );
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_homework(uuid, jsonb) TO authenticated;

-- L'ancienne submit_homework(uuid, text) est resynchronisée pour alimenter AUSSI
-- submission_files (au cas où un ancien client prod dépose pendant la fenêtre) —
-- cohérence des deux colonnes quel que soit le client.
CREATE OR REPLACE FUNCTION public.submit_homework(
  p_homework_id     uuid,
  p_submission_file text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student         uuid;
  v_hw_student      uuid;
  v_teacher_profile uuid;
BEGIN
  v_student := private.current_student_id();
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT student_id INTO v_hw_student
  FROM   public.homework
  WHERE  id = p_homework_id;

  IF v_hw_student IS NULL OR v_hw_student != v_student THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  UPDATE public.homework
  SET    submission_file  = p_submission_file,
         submission_files = jsonb_build_array(
           jsonb_build_object('path', p_submission_file, 'name', p_submission_file)
         ),
         status           = 'rendu',
         submitted_at     = now()
  WHERE  id = p_homework_id;

  SELECT t.profile_id INTO v_teacher_profile
  FROM   public.students s
  JOIN   public.teachers t ON t.id = s.teacher_id
  WHERE  s.id = v_student;

  IF v_teacher_profile IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload, read)
    VALUES (
      v_teacher_profile,
      'homework_submitted',
      jsonb_build_object('url', '/teacher/homework'),
      false
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_homework(uuid, text) TO authenticated;
