-- Règlement intérieur (élève) : contenu fixe (code), pas de table dédiée —
-- une seule ligne "accepté le" par élève suffit, une seule version de règles
-- pour toute la plateforme (cf. reformulation validée).

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS house_rules_accepted_at timestamptz;

-- Validation par l'élève courant. Idempotente (COALESCE) : un second appel ne
-- change jamais la date déjà enregistrée — garantie côté serveur, pas
-- seulement via la case grisée côté UI.
CREATE OR REPLACE FUNCTION public.accept_house_rules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  v_student_id := private.current_student_id();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Action réservée à un élève.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.students
  SET house_rules_accepted_at = COALESCE(house_rules_accepted_at, now())
  WHERE id = v_student_id;
END;
$$;

-- Notification automatique à la création de toute nouvelle fiche élève —
-- déclencheur DB plutôt qu'un appel dans le code de création, pour ne jamais
-- l'oublier quel que soit le point d'entrée (admin, self-service futur...).
CREATE OR REPLACE FUNCTION private.notify_house_rules_on_student_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload, read)
  VALUES (NEW.profile_id, 'house_rules', jsonb_build_object('url', '/dashboard/reglement'), false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_house_rules_on_student_insert ON public.students;
CREATE TRIGGER trg_notify_house_rules_on_student_insert
AFTER INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION private.notify_house_rules_on_student_insert();

-- Backfill ponctuel : les élèves déjà existants reçoivent aussi la
-- notification (décision validée par le propriétaire), sans dupliquer si la
-- migration est rejouée.
INSERT INTO public.notifications (user_id, type, payload, read)
SELECT s.profile_id, 'house_rules', jsonb_build_object('url', '/dashboard/reglement'), false
FROM public.students s
WHERE s.house_rules_accepted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = s.profile_id AND n.type = 'house_rules'
  );
