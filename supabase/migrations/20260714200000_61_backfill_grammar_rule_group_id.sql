-- Backfill unique : les grammar_rules créées AVANT la migration 60 ont chacune
-- reçu un rule_group_id indépendant (DEFAULT gen_random_uuid() par ligne), donc
-- une règle donnée à N élèves dans la même fiche historique apparaît comme N
-- cartes séparées. On peut reconstituer le regroupement d'origine : ces lignes
-- ont été créées par le même appel RPC en boucle (une fois par élève) avec le
-- même p_course_group_id -> leurs lesson_records partagent déjà course_group_id.
-- On fusionne donc les grammar_rules qui partagent (course_group_id, title,
-- content) sous un seul rule_group_id (celui de la ligne la plus ancienne du
-- groupe). Migration de données ponctuelle, sans effet sur les lignes créées
-- après la 60 (déjà correctement groupées par le client).
WITH ranked AS (
  SELECT
    gr.id,
    first_value(gr.rule_group_id) OVER (
      PARTITION BY lr.course_group_id, gr.title, gr.content
      ORDER BY gr.created_at, gr.id
    ) AS new_group_id
  FROM public.grammar_rules gr
  JOIN public.lesson_records lr ON lr.id = gr.lesson_record_id
  WHERE gr.lesson_record_id IS NOT NULL
)
UPDATE public.grammar_rules gr
SET rule_group_id = ranked.new_group_id
FROM ranked
WHERE gr.id = ranked.id AND gr.rule_group_id <> ranked.new_group_id;
