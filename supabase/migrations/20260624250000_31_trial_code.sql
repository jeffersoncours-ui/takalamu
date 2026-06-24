-- Migration 31: code d'essai unique envoyé par email à confirmation du cours d'essai

ALTER TABLE public.trial_requests
  ADD COLUMN IF NOT EXISTS trial_code              text,
  ADD COLUMN IF NOT EXISTS trial_code_expires_at   timestamptz,
  ADD COLUMN IF NOT EXISTS trial_code_used         boolean NOT NULL DEFAULT false;

-- Contrainte d'unicité sur le code (partielle : ignorer les NULL)
CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_trial_code_uniq
  ON public.trial_requests (trial_code)
  WHERE trial_code IS NOT NULL;
