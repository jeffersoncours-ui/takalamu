-- RPC unique insert_notification : paramètre text avec cast interne vers notification_type.
-- SECURITY DEFINER → peut insérer pour n'importe quel user_id sans service_role.
-- Remplace createAdminClient() dans les server actions de messagerie.
DROP FUNCTION IF EXISTS public.insert_notification(uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.insert_notification(uuid, public.notification_type, jsonb);

CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id uuid,
  p_type    text,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.notifications (user_id, type, payload, read)
  VALUES (p_user_id, p_type::public.notification_type, p_payload, false);
END;
$$;
