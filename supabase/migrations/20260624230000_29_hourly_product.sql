-- Migration 29: produit « heure à la carte »
-- Nouveau modèle tarifaire (Session 16) : abonnement annuel (1x/2x/3x/12x) + heure à l'unité 15 €.
-- Le mensuel 60 € est abandonné (valeur enum 'monthly' conservée mais plus utilisée).

ALTER TYPE public.payment_plan    ADD VALUE IF NOT EXISTS 'hourly';
ALTER TYPE public.payment_product ADD VALUE IF NOT EXISTS 'individual_hour';
