-- Migration 37: ferme une faille RLS découverte en test.
-- bookings_teacher_all vérifiait teacher_id = current_teacher_id() mais JAMAIS
-- que le student_id référencé appartient bien à ce même enseignant : un prof
-- pouvait créer une réservation pour l'élève d'un autre prof tant qu'il posait
-- son propre teacher_id. Exposé par la nouvelle fonctionnalité "prof fixe le
-- créneau" (session 22). Corrigé en base, pas seulement côté app (Principe 1).

DROP POLICY IF EXISTS bookings_teacher_all ON public.bookings;

CREATE POLICY bookings_teacher_all ON public.bookings
  FOR ALL TO authenticated
  USING (teacher_id = private.current_teacher_id())
  WITH CHECK (
    teacher_id = private.current_teacher_id()
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = bookings.student_id
        AND s.teacher_id = private.current_teacher_id()
    )
  );
