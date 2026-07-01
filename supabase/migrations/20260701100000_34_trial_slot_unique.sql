-- Migration 34: verrou base anti-double-booking des créneaux d'essai.
-- Un même créneau (gender, scheduled_at) ne peut être tenu que par une seule
-- demande non déclinée. Une demande déclinée libère le créneau.
CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_slot_unique
  ON public.trial_requests (gender, scheduled_at)
  WHERE scheduled_at IS NOT NULL AND status <> 'declined';
