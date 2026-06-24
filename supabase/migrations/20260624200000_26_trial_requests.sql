-- Migration 26: trial_requests — parcours d'essai public

-- Enum statut de la demande d'essai
CREATE TYPE public.trial_status AS ENUM (
  'pending',
  'contacted',
  'completed',
  'converted',
  'declined'
);

-- Table des demandes d'essai (remplie par des prospects anonymes)
CREATE TABLE public.trial_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  email               text NOT NULL,
  gender              public.gender_type NOT NULL,
  message             text,
  status              public.trial_status NOT NULL DEFAULT 'pending',
  trial_paid          boolean NOT NULL DEFAULT false,
  assigned_teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.trial_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

-- Prospect (anon ou authentifié) peut créer une demande
CREATE POLICY trial_requests_public_insert ON public.trial_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Enseignant voit les demandes du même genre que lui
CREATE POLICY trial_requests_teacher_select ON public.trial_requests
  FOR SELECT TO authenticated
  USING (
    private.current_teacher_id() IS NOT NULL
    AND gender = (
      SELECT p.gender FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Enseignant met à jour les demandes de son genre (statut, trial_paid, assigned_teacher_id)
CREATE POLICY trial_requests_teacher_update ON public.trial_requests
  FOR UPDATE TO authenticated
  USING (
    private.current_teacher_id() IS NOT NULL
    AND gender = (
      SELECT p.gender FROM public.profiles p WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    private.current_teacher_id() IS NOT NULL
    AND gender = (
      SELECT p.gender FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

-- Admin : accès total
CREATE POLICY trial_requests_admin_all ON public.trial_requests
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- RPC SECURITY DEFINER : notifie les enseignants d'un genre donné
-- Appelable par anon pour qu'une soumission publique puisse alerter le bon prof.
CREATE OR REPLACE FUNCTION public.notify_teachers_by_gender(
  p_gender      public.gender_type,
  p_type        public.notification_type,
  p_payload     jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  FOR v_profile_id IN
    SELECT t.profile_id
    FROM public.teachers t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE p.gender = p_gender
  LOOP
    PERFORM public.insert_notification(v_profile_id, p_type, p_payload);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_teachers_by_gender TO anon, authenticated;

-- Ajouter le type de notification 'trial_request'
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'trial_request';
