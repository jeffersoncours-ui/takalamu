-- Migration 27: mises à jour tarifaires
-- - Ajouter 'monthly' au plan de paiement (mensuel sans engagement, distinct de 12x = annuel mensualisé)
-- - Ajouter amount_cents + trial_credit_cents sur payments (snapshot prix + déduction essai)
-- - Ajouter trial_credit_cents sur students (crédit essai porté jusqu'au 1er paiement)

ALTER TYPE public.payment_plan ADD VALUE IF NOT EXISTS 'monthly';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS amount_cents       integer,
  ADD COLUMN IF NOT EXISTS trial_credit_cents integer NOT NULL DEFAULT 0;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS trial_credit_cents integer NOT NULL DEFAULT 0;
