-- Retrait du quiz de grammaire rédigé à la main (écran prof /teacher/evaluations)
-- : le propriétaire juge la fonctionnalité inutile (les élèves pratiquent déjà
-- via les quiz auto-générés vocabulaire/formulation, les notes viennent des
-- devoirs). Vérifié avant retrait : 0 quiz de grammaire jamais créé, 0 question
-- jamais écrite, 0 notification eval_due jamais envoyée — jamais utilisé.
-- Code applicatif déjà retiré (écran prof + bloc élève correspondant, devenu
-- orphelin sans plus aucun moyen d'alimenter un quiz de grammaire).
--
-- NE PAS APPLIQUER avant que le code de cette session soit déployé en prod
-- (base partagée : le client encore déployé utilise encore ces RPC/cette table).

DROP FUNCTION public.get_grammar_quiz_questions(uuid);
DROP FUNCTION public.submit_grammar_quiz(uuid, uuid, jsonb);
DROP TABLE public.quiz_questions;

-- Valeurs d'enum orphelines (rename → create → alter → drop, pattern déjà
-- utilisé migrations 47/55)
alter type quiz_source rename to quiz_source_old;
create type quiz_source as enum ('glossary', 'formulation');
alter table public.quizzes alter column source_type type quiz_source using source_type::text::quiz_source;
drop type quiz_source_old;

alter type notification_type rename to notification_type_old;
create type notification_type as enum (
  'new_message',
  'homework_due',
  'homework_corrected',
  'homework_submitted',
  'trial_request',
  'session_reminder'
);
alter table public.notifications alter column type type notification_type using type::text::notification_type;
drop type notification_type_old;
