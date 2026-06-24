-- Create lesson-audio private bucket (50 MB max, audio types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-audio',
  'lesson-audio',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Teacher / admin: full access
CREATE POLICY lesson_audio_teacher_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'lesson-audio'
    AND (private.current_teacher_id() IS NOT NULL OR private.is_admin())
  )
  WITH CHECK (
    bucket_id = 'lesson-audio'
    AND (private.current_teacher_id() IS NOT NULL OR private.is_admin())
  );

-- Student: read-only (audio is shared per lesson, not per-student)
CREATE POLICY lesson_audio_student_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lesson-audio'
    AND private.current_student_id() IS NOT NULL
  );
