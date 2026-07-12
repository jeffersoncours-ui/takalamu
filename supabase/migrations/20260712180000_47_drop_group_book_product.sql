-- Produit B (cours de groupe/livre) abandonné : le propriétaire gère les
-- cours de groupe via Telegram, hors de l'app. Aucun code applicatif ne
-- consommait ces tables (jamais construit depuis le lot 1B) ; les 3 étaient
-- vides au moment du drop.
drop table public.book_enrollments;
drop table public.book_sessions;

-- Ligne de seed orpheline (scope=group, jamais alimentée par l'app)
delete from public.quizzes where scope = 'group';

-- Retire la colonne avant de dropper books (FK quizzes_book_fk)
alter table public.quizzes drop column book_id;

drop table public.books;

-- Nettoyage des valeurs d'enum devenues inutilisées (aucune ligne ne les
-- utilise, aucune fonction/RPC ne les référence — vérifié avant suppression)
alter type quiz_scope rename to quiz_scope_old;
create type quiz_scope as enum ('individual');
alter table public.quizzes alter column scope type quiz_scope using scope::text::quiz_scope;
drop type quiz_scope_old;

alter type quiz_source rename to quiz_source_old;
create type quiz_source as enum ('glossary', 'grammar', 'formulation');
alter table public.quizzes alter column source_type type quiz_source using source_type::text::quiz_source;
drop type quiz_source_old;

alter type payment_product rename to payment_product_old;
create type payment_product as enum ('individual_sub', 'individual_hour');
alter table public.payments alter column product type payment_product using product::text::payment_product;
drop type payment_product_old;
