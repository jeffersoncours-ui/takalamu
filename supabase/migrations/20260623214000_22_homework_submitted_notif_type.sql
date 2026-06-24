-- 22 — Ajoute le type de notification homework_submitted (élève dépose un devoir)
-- ALTER TYPE ADD VALUE doit vivre dans sa propre migration (transaction séparée)
-- avant toute utilisation de la nouvelle valeur.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'homework_submitted';
