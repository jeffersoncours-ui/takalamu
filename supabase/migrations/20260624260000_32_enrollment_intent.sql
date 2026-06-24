-- Migration 32: intention d'inscription — plan choisi + référence Revolut

ALTER TABLE public.trial_requests
  ADD COLUMN IF NOT EXISTS chosen_plan    text,
  ADD COLUMN IF NOT EXISTS chosen_product text,
  ADD COLUMN IF NOT EXISTS revolut_order_id text;

CREATE UNIQUE INDEX IF NOT EXISTS trial_requests_revolut_order_id_uniq
  ON public.trial_requests (revolut_order_id)
  WHERE revolut_order_id IS NOT NULL;
