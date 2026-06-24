-- Migration 30: tunnel d'essai — scheduled_at, level, RPCs publics pour les créneaux

ALTER TABLE public.trial_requests
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS level text;

-- RPC public: règles de dispo d'un enseignant par genre (pour que le prospect voie les créneaux)
CREATE OR REPLACE FUNCTION public.get_teacher_availability_by_gender(
  p_gender public.gender_type
)
RETURNS TABLE (
  day_of_week smallint,
  start_time  time,
  end_time    time
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT ta.day_of_week, ta.start_time, ta.end_time
  FROM public.teacher_availability ta
  JOIN public.teachers t ON t.id = ta.teacher_id
  JOIN public.profiles p ON p.id = t.profile_id
  WHERE p.gender = p_gender;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teacher_availability_by_gender TO anon, authenticated;

-- RPC public: créneaux déjà réservés par essai pour un genre (pour griser les créneaux occupés)
CREATE OR REPLACE FUNCTION public.get_trial_taken_slots(
  p_gender public.gender_type
)
RETURNS TABLE (slot_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT tr.scheduled_at
  FROM public.trial_requests tr
  WHERE tr.gender = p_gender
    AND tr.scheduled_at IS NOT NULL
    AND tr.scheduled_at >= now()
    AND tr.scheduled_at <= now() + interval '45 days'
    AND tr.status <> 'declined';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_trial_taken_slots TO anon, authenticated;
