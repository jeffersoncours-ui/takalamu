-- 19 — Buckets Storage pour fichiers de séance et corrections de devoirs

-- Bucket session-files : fichiers déposés par l'enseignant après une séance (support_files)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('session-files', 'session-files', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Bucket homework-corrections : copie corrigée renvoyée par l'enseignant
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('homework-corrections', 'homework-corrections', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- ── Policies session-files ────────────────────────────────────────────────────
-- Teacher : lecture et écriture sur tous les fichiers
CREATE POLICY "session_files_teacher_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'session-files' AND private.current_teacher_id() IS NOT NULL)
  WITH CHECK (bucket_id = 'session-files' AND private.current_teacher_id() IS NOT NULL);

-- Student : lecture uniquement des fichiers dont le chemin commence par son student_id
CREATE POLICY "session_files_student_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'session-files'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );

-- ── Policies homework-corrections ────────────────────────────────────────────
-- Teacher : lecture et écriture
CREATE POLICY "hw_corrections_teacher_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'homework-corrections' AND private.current_teacher_id() IS NOT NULL)
  WITH CHECK (bucket_id = 'homework-corrections' AND private.current_teacher_id() IS NOT NULL);

-- Student : lecture uniquement des fichiers dont le chemin commence par son student_id
CREATE POLICY "hw_corrections_student_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'homework-corrections'
    AND private.current_student_id() IS NOT NULL
    AND (storage.foldername(name))[1] = private.current_student_id()::text
  );
