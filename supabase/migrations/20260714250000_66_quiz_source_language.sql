-- Nouvelle valeur d'enum seule dans sa migration (ADD VALUE ne peut pas être
-- utilisée dans la même transaction que son ajout). Le quiz de langue fusionné
-- (vocabulaire + formulation) enregistre ses tentatives sous cette source.
ALTER TYPE public.quiz_source ADD VALUE IF NOT EXISTS 'language';
