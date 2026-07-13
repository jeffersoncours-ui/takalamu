-- 54 — Cours rangés par livre (anti pollution visuelle)
--
-- Demande propriétaire : regrouper les cours par livre sur l'accueil élève. 3 livres :
--   • العربية بين يديك (arabe entre tes mains) — contient des cours
--   • تهذيب قصص النبيين (récits des prophètes) — contient des cours
--   • النحو الميسّر (grammaire) — SPÉCIAL : rassemble automatiquement toutes les règles
--     de grammaire de l'élève (kind='grammar'), pas des cours.
--
-- Rien à voir avec les anciennes tables `books` du cours de groupe (supprimées) : ici
-- c'est une simple étiquette de rangement, rattachée à l'enseignant (N livres possibles).

-- ── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title       text NOT NULL,               -- titre arabe
  subtitle    text,                         -- libellé français
  cover_url   text,                         -- asset app ou URL bucket public
  kind        text NOT NULL DEFAULT 'courses' CHECK (kind IN ('courses', 'grammar')),
  order_index int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_books_teacher_idx ON public.course_books (teacher_id);

ALTER TABLE public.course_books ENABLE ROW LEVEL SECURITY;

-- Enseignant : gère ses livres. Élève : lit ceux de son enseignant.
CREATE POLICY book_teacher_all ON public.course_books
  FOR ALL TO authenticated
  USING (teacher_id = private.current_teacher_id())
  WITH CHECK (teacher_id = private.current_teacher_id());

CREATE POLICY book_select_student ON public.course_books
  FOR SELECT TO authenticated
  USING (teacher_id = (SELECT s.teacher_id FROM public.students s WHERE s.profile_id = auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.course_books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Rattachement des cours à un livre ────────────────────────────────────────
ALTER TABLE public.lesson_records
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES public.course_books(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS lesson_records_book_idx ON public.lesson_records (book_id);

-- ── Bucket public pour les couvertures ajoutées par l'enseignant ─────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('book-covers', 'book-covers', true, 5242880)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "book_covers_teacher_write" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'book-covers' AND private.current_teacher_id() IS NOT NULL)
  WITH CHECK (bucket_id = 'book-covers' AND private.current_teacher_id() IS NOT NULL);

-- ── Seed des 3 livres de Jefferson (couvertures en assets `public/books/`) ────
INSERT INTO public.course_books (teacher_id, title, subtitle, cover_url, kind, order_index)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'العربية بين يديك', 'L''arabe entre tes mains', '/books/arabiyya-bayna-yadayk.jpg', 'courses', 1),
  ('30000000-0000-0000-0000-000000000001', 'تهذيب قصص النبيين', 'Récits des prophètes',      '/books/qasas-an-nabiyyin.jpg',      'courses', 2),
  ('30000000-0000-0000-0000-000000000001', 'النحو الميسّر',      'La grammaire simplifiée',    '/books/an-nahw-al-muyassar.jpg',    'grammar', 3);

-- ── Backfill des 3 cours existants (par course_group_id) ─────────────────────
-- التحية والتعارف → arabe ; بائع الأصنام + ولد آزر → récits. La grammaire reste
-- automatique (livre kind='grammar' : il agrège les grammar_rules, pas de book_id).
UPDATE public.lesson_records
SET    book_id = (SELECT id FROM public.course_books
                  WHERE teacher_id = '30000000-0000-0000-0000-000000000001'
                    AND subtitle = 'L''arabe entre tes mains')
WHERE  course_group_id = '5066db4f-8e11-405b-bd08-76535ad3e070';

UPDATE public.lesson_records
SET    book_id = (SELECT id FROM public.course_books
                  WHERE teacher_id = '30000000-0000-0000-0000-000000000001'
                    AND subtitle = 'Récits des prophètes')
WHERE  course_group_id IN ('8da8a0d3-ca2b-48de-8574-92013842593f',
                           'a87e75f6-cfa0-4236-bd54-485bdf370e86');
