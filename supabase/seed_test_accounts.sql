-- Seed des comptes & données de TEST (persistants, pour tests manuels du propriétaire).
-- ⚠️ Données de démonstration uniquement. Mot de passe commun : Takalamu2026!
-- Appliqué une fois sur le projet via MCP. Conservé ici pour reproductibilité.
--
-- Comptes :
--   prof.hommes@takalamu.test  → role admin + enseignant (Youssef, élèves hommes)
--   prof.femmes@takalamu.test  → role teacher (Khadija, élèves femmes)
--   ali@takalamu.test          → élève (m) rattaché à Youssef  [paiement: paid]
--   omar@takalamu.test         → élève (m) rattaché à Youssef  [paiement: pending]
--   fatima@takalamu.test       → élève (f) rattachée à Khadija [paiement: paid]
--   aisha@takalamu.test        → élève (f) rattachée à Khadija

-- 1) Utilisateurs auth + identités (le trigger handle_new_user crée les profils).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','prof.hommes@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"admin","full_name":"Youssef (prof hommes + admin)","gender":"m"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated','prof.femmes@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"teacher","full_name":"Khadija (prof femmes)","gender":"f"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-0000-0000-000000000001','authenticated','authenticated','ali@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Ali","gender":"m"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-0000-0000-000000000002','authenticated','authenticated','omar@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Omar","gender":"m"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-0000-0000-000000000003','authenticated','authenticated','fatima@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Fatima","gender":"f"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','20000000-0000-0000-0000-000000000004','authenticated','authenticated','aisha@takalamu.test', crypt('Takalamu2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"student","full_name":"Aisha","gender":"f"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.email, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u where u.email like '%@takalamu.test';

-- 2) Enseignants & élèves
insert into public.teachers (id, profile_id, display_name, bio) values
  ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Youssef','Enseignant cours hommes.'),
  ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Khadija','Enseignante cours femmes.');

insert into public.students (id, profile_id, teacher_id, gender, status) values
  ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','m','active'),
  ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','m','active'),
  ('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','f','active'),
  ('40000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','30000000-0000-0000-0000-000000000002','f','active');

-- 3) Programme, séances, glossaire, grammaire
insert into public.lessons (id, order_index, title, objective, phase) values
  ('50000000-0000-0000-0000-000000000001',1,'Les lettres (1)','Reconnaître l''alphabet','dechiffrage'),
  ('50000000-0000-0000-0000-000000000002',2,'Lecture de syllabes','Lire des syllabes simples','lecture_oral');

insert into public.student_progress (student_id, current_lesson_id) values
  ('40000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003','50000000-0000-0000-0000-000000000001');

insert into public.lesson_records (id, student_id, teacher_id, lesson_id, session_date, attendance, public_recap) values
  ('60000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001', now() - interval '7 days','present','Bon début, revoir les lettres.'),
  ('60000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001', now() - interval '6 days','present','Séance d''Omar.'),
  ('60000000-0000-0000-0000-000000000003','40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001', now() - interval '5 days','present','Séance de Fatima.');

insert into public.vocabulary (student_id, arabic_word, french_definition, lesson_record_id) values
  ('40000000-0000-0000-0000-000000000001','كتاب','livre','60000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001','قلم','stylo','60000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002','باب','porte','60000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003','بيت','maison','60000000-0000-0000-0000-000000000003');

insert into public.grammar_rules (student_id, title, content, lesson_record_id) values
  ('40000000-0000-0000-0000-000000000001','Le défini','La particule al- marque le défini.','60000000-0000-0000-0000-000000000001');

-- 4) Notes PRIVÉES (jamais visibles côté élève)
insert into public.student_profile_notes (student_id, teacher_id, content) values
  ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','PRIVÉ: Ali manque parfois de régularité.'),
  ('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','PRIVÉ: Fatima progresse vite.');
insert into public.session_private_notes (lesson_record_id, teacher_id, content) values
  ('60000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','PRIVÉ: à pousser sur la prononciation.');

-- 5) Paiements (pot commun)
insert into public.payments (student_id, product, plan, status) values
  ('40000000-0000-0000-0000-000000000001','individual_sub','12x','paid'),
  ('40000000-0000-0000-0000-000000000002','individual_sub','12x','pending'),
  ('40000000-0000-0000-0000-000000000003','individual_sub','1x','paid');

-- 6) Quiz de groupe (démo) — quiz_questions inaccessibles aux élèves (réponses)
insert into public.quizzes (id, scope, source_type, title)
values ('70000000-0000-0000-0000-000000000001','group','book','Quiz livre test');
insert into public.quiz_questions (quiz_id, prompt, correct_answer, distractors)
values ('70000000-0000-0000-0000-000000000001','Question test ?','BONNE_REPONSE', array['faux1','faux2','faux3']);
