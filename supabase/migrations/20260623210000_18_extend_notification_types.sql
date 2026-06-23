-- 18 — Extend notification_type enum
-- Ajout des types pour les notifications manquantes : correction devoir, demande et confirmation paiement
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'homework_corrected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_requested';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_confirmed';
