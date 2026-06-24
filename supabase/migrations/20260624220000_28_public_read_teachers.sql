-- Migration 28: lecture publique des fiches enseignants (vitrine)
-- Les données teachers/profiles sont publiques pour la page /enseignants.

CREATE POLICY teachers_public_select ON public.teachers
  FOR SELECT TO anon, authenticated
  USING (true);
