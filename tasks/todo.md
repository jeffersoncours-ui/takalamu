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
- [ ] Création du **nouveau projet Supabase** via MCP.
- [ ] Migration `00_extensions_enums` : extensions + types enum (`role`, `gender`, `student_status`, `lesson_phase`, `attendance`, `homework_status`, `quiz_scope`, `quiz_source`, `payment_product`, `payment_plan`, `payment_status`, `booking_type`, `booking_status`, `video_type`, `notification_type`).
- [ ] Migration `01_helpers` : fonctions `SECURITY DEFINER` anti-récursion RLS — `is_admin()`, `current_teacher_id()`, `current_student_id()` ; trigger générique `set_updated_at()`.
- [ ] Migration `02_identity` : `profiles`, `teachers`, `students` (+ trigger `handle_new_user` qui crée le `profile` à l'inscription auth) — **RLS deny-by-default + policies** par table.
- [ ] Migration `03_program` : `lessons`, `audio_assets` (programme partagé entre enseignants) + RLS.
- [ ] Migration `04_individual_tracking` : `student_progress`, `lesson_records`, `vocabulary`, `grammar_rules`, `homework` + RLS.
- [ ] Migration `05_evaluations` : `quizzes`, `quiz_questions`, `quiz_attempts` + RLS.
- [ ] Migration `06_group_product` : `books`, `book_sessions`, `book_enrollments` + RLS (`price` nullable — §10 non câblé).
- [ ] Migration `07_scheduling` : `teacher_availability`, `bookings` (UTC) + RLS.
- [ ] Migration `08_videos` : `videos`, `milestone_video_assignments`, `video_views` + RLS.
- [ ] Migration `09_communication` : `conversations`, `messages`, `notifications` + RLS.
- [ ] Migration `10_payments` : `payments` + RLS (lecture pour tout teacher = pot commun ; écriture réservée au service role).
- [ ] Migration `11_private_notes` : `student_profile_notes`, `session_private_notes` + RLS **interdisant toute lecture au rôle student**.
- [ ] `generate_typescript_types` → `src/lib/supabase/database.types.ts`.

### Lot 1C — Seed comptes de test + PREUVE RLS (checkpoint : preuves SQL + identifiants)
- [ ] Créer via Supabase Auth (service role) des comptes **persistants** :
  - 1 admin (qui est aussi teacher), 2 teachers (1 m / 1 f), 3-4 students répartis sur les 2 teachers.
  - Mots de passe connus → fournis au propriétaire.
- [ ] Seed de données pédagogiques minimales (quelques `lessons`, `vocabulary`, `lesson_records`, `*_private_notes`) pour rendre les tests significatifs.
- [ ] **Preuves RLS via `execute_sql`** (en simulant chaque rôle via JWT/`request.jwt.claims`) :
  - (a) élève A **ne voit pas** les données de l'élève B (vocabulary, lesson_records, homework…).
  - (b) un compte student **ne peut pas lire** `student_profile_notes` ni `session_private_notes` (0 ligne).
  - (c) teacher 1 **ne voit pas** les élèves de teacher 2 ; voit bien les siens.
  - (d) deny-by-default : tester une table sans policy applicable → 0 ligne.
  - (e) tout teacher **lit** `payments` (pot commun) mais ne peut pas l'écrire.
- [ ] Inclure requêtes + valeurs retournées comme preuve dans la réponse.
- [ ] Livrer au propriétaire : URL preview Vercel + tableau des identifiants/mots de passe.

### Hors périmètre de l'étape 1 (étapes suivantes, après feu vert)
- Mode auteur / programme (UI CRUD lessons), fiche de fin de cours, espaces, planning, paiement, vidéos, chat.

### Review
_(à remplir en fin d'étape)_
