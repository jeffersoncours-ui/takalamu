-- 50 — Nettoyage résidus morts du tunnel d'essai / cron de relances (abandonnés
-- session 31 "Clôture des intégrations abandonnées"). Vérifié avant coup :
-- 0 référence code, 0 valeur non-défaut en base, 0 policy/index/fonction dépendante.

DROP FUNCTION IF EXISTS public.get_public_teachers();

ALTER TABLE public.students DROP COLUMN IF EXISTS trial_credit_cents;
ALTER TABLE public.students DROP COLUMN IF EXISTS onboarding_completed;
ALTER TABLE public.payments DROP COLUMN IF EXISTS trial_credit_cents;
ALTER TABLE public.payments DROP COLUMN IF EXISTS period;
