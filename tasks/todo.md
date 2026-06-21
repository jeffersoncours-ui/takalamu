# Todo

## Étape 1 — Socle (auth, rôles, RLS, modèle de données)

> **Statut : EN ATTENTE DE VALIDATION DU PLAN.** Ne rien exécuter avant le feu vert du propriétaire.
> Contraintes propriétaire : livraison incrémentale (sous-lots + checkpoints), preview Vercel pour tests, comptes de test **conservés** avec identifiants+mots de passe fournis, nouveau projet Supabase.

### Lot 1A — Scaffold & câblage (checkpoint : app déployée sur Vercel)
- [x] `create-next-app` : Next.js 16 (App Router) + TypeScript + Tailwind v4, ESLint.
- [x] Structure de dossiers : `src/app`, `src/lib/supabase` (client browser + server + admin + proxy session).
- [x] Dépendances : `@supabase/supabase-js`, `@supabase/ssr`, `date-fns` + `date-fns-tz` (fuseaux, Principe 7).
- [x] `.env.example` (commité, exception gitignore) listant **toutes** les variables ; `.env.local` (non commité) renseigné avec URL + anon key.
- [x] Page d'accueil + page `/login` (server action `signIn`/`signOut`) + `/dashboard` protégé.
- [x] `proxy.ts` (ex-`middleware`, renommé pour Next 16) : rafraîchissement de session Supabase.
- [x] `.gitignore` correct (`.env*` sauf `.env.example`, `node_modules`, `.next`).
- [x] **Projet Supabase créé** (`takalamu`, ref `xowdsbszhdhigootlhmm`, région eu-west-3). *Créé en 1A car l'app a besoin des creds pour tourner.*
- [x] Build + lint OK ; smoke test local : `/` 200, `/login` 200, `/dashboard` → 307 redirect /login (auth wiring prouvé contre le vrai projet).
- [ ] **Déploiement Vercel** — BLOQUÉ : pas de token Vercel dans l'env, MCP Vercel ne sait pas créer de projet/env. → setup git-integration côté propriétaire (instructions fournies au checkpoint).

### Lot 1B — Modèle de données + RLS (migrations versionnées, RLS écrite AVEC chaque table)
- [x] Création du **nouveau projet Supabase** via MCP (`takalamu`, ref `xowdsbszhdhigootlhmm`, eu-west-3).
- [x] `00_extensions_enums` : pgcrypto + 15 types enum + fonction `set_updated_at()`.
- [x] `01_identity` : `profiles`, `teachers`, `students` + helpers (`is_admin`, `current_teacher_id`, `current_student_id`, `owns_student`) + trigger `handle_new_user` + RLS.
- [x] `02_program` : `lessons`, `audio_assets` + RLS.
- [x] `03_individual_tracking` : `student_progress`, `lesson_records`, `vocabulary`, `grammar_rules`, `homework` + RLS.
- [x] `04_evaluations` : `quizzes`, `quiz_questions` (réponses non lisibles élève), `quiz_attempts` + RLS.
- [x] `05_group_product` : `books`, `book_sessions`, `book_enrollments` + RLS (`price` nullable).
- [x] `06_scheduling` : `teacher_availability`, `bookings` (UTC) + RLS.
- [x] `07_videos` : `videos`, `milestone_video_assignments`, `video_views` + RLS.
- [x] `08_communication` : `conversations`, `messages`, `notifications` + RLS.
- [x] `09_payments` : `payments` + RLS (lecture tout teacher = pot commun ; écriture = service_role only).
- [x] `10_private_notes` : `student_profile_notes`, `session_private_notes` — aucune policy student.
- [x] `11_security_hardening` : helpers déplacés en schéma `private` (hors API), search_path figé → **advisor sécurité = 0 lint**.
- [x] `12_fix_owns_student_ref` : correctif référence interne après déplacement de schéma.
- [x] `generate_typescript_types` → `src/lib/supabase/database.types.ts`.

### Lot 1C — Seed comptes de test + PREUVE RLS (checkpoint : preuves SQL + identifiants)
- [x] Comptes **persistants** créés : 1 admin+teacher (Youssef), 1 teacher (Khadija), 4 students (Ali/Omar→Youssef, Fatima/Aisha→Khadija). Mot de passe : `Takalamu2026!`.
- [x] Seed pédagogique (lessons, lesson_records, vocabulary, grammar_rules, private_notes, payments, quiz).
- [x] **Preuves RLS via `execute_sql`** (simulation de rôle via `request.jwt.claims`) :
  - (a) Ali ne voit que ses 2 mots / Omar que le sien → isolation élève↔élève ✔
  - (b) élève → 0 ligne sur `student_profile_notes` & `session_private_notes` ✔
  - (c) Khadija ne voit que Fatima/Aisha, jamais Ali/Omar ni leurs notes → isolation teacher↔teacher ✔
  - (d) anon → vitrine teachers visible, élèves/vocab/paiements/quiz = 0 ✔
  - (e) tout teacher lit `payments` (=3, pot commun) ; élève bloqué en écriture (`new row violates RLS`) ✔
  - (f) élève → `quiz_questions`=0, `answers_leaked=null` (réponses protégées) ✔
- [x] Vérif login : 6 comptes `password_ok=true`, email confirmé, identité présente.
- [ ] Vercel : import GitHub côté propriétaire (en cours) — projet pas encore visible via MCP.

### Review
**État au 2026-06-21 — Socle (étape 1) terminé et prouvé.**
- App Next.js 16 + TS + Tailwind v4 câblée à Supabase (clients browser/server/admin + proxy session). Build & lint verts.
- 27 tables, RLS deny-by-default sur toutes, helpers RLS isolés en schéma `private`. Advisor sécurité Supabase : **0 lint**.
- Isolation prouvée empiriquement (élève↔élève, teacher↔teacher, notes privées étanches, verrou paiement, réponses de quiz protégées, pot commun).
- Comptes de test persistants livrés au propriétaire (voir réponse de session).
- **Reste à finaliser hors-code** : import du repo sur Vercel + variables d'env (instructions fournies) pour la preview.
- **Prochaine étape (après feu vert)** : Lot 2 — mode auteur / programme (UI CRUD `lessons`).

### Hors périmètre de l'étape 1 (étapes suivantes, après feu vert)
- Mode auteur / programme (UI CRUD lessons), fiche de fin de cours, espaces, planning, paiement, vidéos, chat.

### Review
_(à remplir en fin d'étape)_
