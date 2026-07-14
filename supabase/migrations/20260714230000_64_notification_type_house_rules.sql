-- Nouvelle valeur d'enum seule dans sa migration : ADD VALUE ne peut pas être
-- utilisée dans la même transaction que son ajout (limitation Postgres).
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'house_rules';
