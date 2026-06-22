# Todo

## Prochaines étapes possibles (après validation preview)

- **Fiche élève enseignant** `/teacher/students/[id]` : position curseur, historique, vocab/grammaire, note de profil épinglée, devoirs à corriger, lien chat.
- **Planning / réservation** : `teacher_availability` + `bookings` (bloqué si `payment.status != paid`).
- **Paiement Revolut** : webhook + choix d'offre + lien facture.
- **Vidéos** (Bunny Stream) : lecteur forcé, welcome + milestone.
- **Messagerie** (Supabase Realtime).

---

## Étape 4 — Espace élève (`/dashboard`)

> **Statut : TERMINÉ.**
> Objectif : 4 onglets en lecture seule — Cours (lesson_records), Vocabulaire (glossaire + recherche), Grammaire, Devoirs (cycle de statut).

### Lot 4A — Garde de rôle + layout
- [x] `requireStudent()` dans `src/lib/auth.ts` — renvoie `{ userId, profile, studentId }`.
- [x] Layout `/dashboard/layout.tsx` : en-tête + `DashboardTabs` (client, active state via `usePathname`).

### Lot 4B — Onglet Cours
- [x] `/dashboard/page.tsx` : liste des `lesson_records` (date, titre de leçon, badge présence, récap public).

### Lot 4C — Onglet Vocabulaire
- [x] `/dashboard/vocabulary/page.tsx` + `vocab-search.tsx` (client) : liste complète + recherche FR↔AR en temps réel.

### Lot 4D — Onglet Grammaire
- [x] `/dashboard/grammar/page.tsx` : règles de grammaire triées par date.

### Lot 4E — Onglet Devoirs
- [x] `/dashboard/homework/page.tsx` : devoirs avec badge de statut, instructions, retour + note du prof.

### Lot 4F — Preuves & déploiement
- [x] RLS prouvées : Ali (1 lesson_record, 2 vocab, 1 grammar, 0 homework, 0 private_notes) ; Fatima voit uniquement ses données (0 ligne d'Ali) ; isolation cross-student ✓.
- [x] Build & lint verts. Push → preview.

### Review (Étape 4)
**État au 2026-06-22 — Espace élève livré.**
- Layout `/dashboard` avec 4 onglets (navigation active client-side) protégé par `requireStudent()`.
- Cours : `lesson_records` triés par date DESC, badge coloré par statut de présence, récap public.
- Vocabulaire : `vocabulary` complet avec recherche client-side FR↔AR (Arabic `dir="rtl"`).
- Grammaire : `grammar_rules` avec titre + contenu, triés par date.
- Devoirs : `homework` avec badge de statut (à_rendre → rendu → corrigé → vu) et retour du prof.
- RLS prouvées empiriquement (isolation élève↔élève, notes privées = 0 côté élève).
- **Défauts retenus** : upload de devoir (`submission_file`) non implémenté ; onglet Paiement/Quiz/Messagerie à venir.
- **Prochaine étape** : fiche élève côté enseignant, planning/réservation, ou paiement Revolut.

---

## Étape 3 — Fiche de fin de cours (§7.6, composant critique < 30 s)

> **Statut : TERMINÉ.**
> Objectif : une seule soumission qui alimente `lesson_records` + `vocabulary` + `grammar_rules` + `homework`, avance le curseur `student_progress`, crée la note privée de séance (`session_private_notes`), applique les règles d'absence (§8). Atomicité garantie par une RPC Postgres.
> Défauts retenus (à valider plus tard) : `support_files` reportés ; `session_date` par défaut = maintenant, éditable. `late` compté comme absence injustifiée (§8.4).

### Lot 3A — RPC atomique + règles métier
- [x] Migration `13_session_record_rpc` : fonction `public.submit_session_record(...)` (SECURITY INVOKER → RLS = garde-fou), tout dans une transaction.
- [x] Règles §8 : `absent_unjustified` / `late` ⇒ +1 `unjustified_absences_count` ; seuil 3 ⇒ `status = suspended_absences`.
- [x] Tests MCP : soumission nominale alimente les 6 tables ; compteur d'absences ; seuil ; ownership refusé. Advisor sécurité = 0 nouveau lint.

### Lot 3B — UI fiche `/teacher/session/new`
- [x] Page + formulaire compact (sélecteur élève, présence en boutons, leçon pré-cochée au curseur, récap public, vocab/grammaire dynamiques, devoir optionnel, note privée distincte).
- [x] Server action `submitSession` (appelle la RPC), validation serveur. Date saisie en heure locale → convertie UTC côté client (Principe 7).

### Lot 3C — Lien cockpit
- [x] Bouton « Fin de cours » depuis `/teacher` + entrée de nav + bandeau de succès.

### Lot 3D — Preuves & déploiement
- [x] Preuves RLS (note privée étanche élève, isolation prof↔prof) + build/lint verts + push → preview.
- [x] Docs (todo Review + lessons).

### Review (Étape 3)
**État au 2026-06-22 — Fiche de fin de cours livrée.**
- RPC atomique `submit_session_record` : une soumission alimente `lesson_records` + `vocabulary` + `grammar_rules` + `homework` + `session_private_notes` et avance `student_progress`. SECURITY INVOKER → RLS deny-by-default reste le garde-fou ; contrôle d'appartenance explicite en tête (`private.owns_student`).
- Règles d'absence §8 appliquées en base : `absent_unjustified`/`late` incrémentent le compteur, seuil 3 → `suspended_absences`. Prouvé empiriquement (2 injustifiées + 1 retard = 3 ⇒ suspendu ; la justifiée ne compte pas).
- UI `/teacher/session/new` mobile-first : présence tappable, leçon pré-sélectionnée au curseur de l'élève, lignes vocab/grammaire dynamiques, devoir optionnel, note privée visuellement distincte. Date convertie en UTC côté client.
- Preuves : 6 tables alimentées par une soumission ; ownership refusé (élève d'un autre prof) ; note privée = 0 ligne côté élève ; isolation prof↔prof. Build & lint verts.
- **Limite connue** : roundtrip supabase-js → RPC non testable depuis le sandbox (egress bloqué) ; la RPC elle-même est prouvée via `execute_sql`. À vérifier sur la preview Vercel.
- **Défauts retenus à valider** : `support_files` reportés ; `late` compté comme absence ; `session_date` par défaut = maintenant.
- **Prochaine étape** : espace élève (lecture du carnet/vocab/grammaire/devoirs) ou planning/paiement.

---

## Étape 2 — Mode auteur / programme (§7.6 « Mon programme »)

> **Statut : EN ATTENTE DE VALIDATION DU PLAN.** Ne rien coder avant le feu vert du propriétaire.
> Objectif : CRUD ordonné de la bibliothèque maîtresse `lessons` (partagée entre enseignants), réservée aux rôles teacher/admin. Première vraie Uas-cas métier après le socle.

### Lot 2A — Espace enseignant & garde de rôle
- [x] Helpers serveur : `getProfile()`, `requireTeacher()`, `homePathForRole()` (`src/lib/auth.ts`).
- [x] Layout `/teacher` (nav sobre mobile-first) + redirection post-login selon le rôle.

### Lot 2B — CRUD `lessons` (cœur du lot)
- [x] `/teacher/program` : liste triée par `order_index`, badge de phase, objectif.
- [x] **Créer** (`/teacher/program/new`) : server action `createLesson`, `order_index` = max+1.
- [x] **Éditer** (`/teacher/program/[id]/edit`) : formulaire pré-rempli + `updateLesson` (action liée à l'id).
- [x] **Supprimer** : `deleteLesson`.
- [x] **Réordonner** : boutons ↑/↓ (`moveLesson`, échange d'`order_index`).
- [x] Validation **côté serveur** (titre requis, phase valide via `isLessonPhase`).
- [x] *(Hors lot : audio + `quiz_id` laissés pour plus tard.)*

### Lot 2C — Preuves & déploiement
- [x] Tests MCP : enseignant crée ✓ ; élève bloqué en écriture (`new row violates RLS`) ✓ ; élève lit le programme (2 leçons) ✓.
- [x] Build + lint verts ; push → redeploy preview.
- [x] Docs mises à jour (`todo.md` Review + `lessons.md`).

### Review (Étape 2)
**État au 2026-06-21 — Mode auteur / programme livré.**
- Espace enseignant `/teacher` protégé par `requireTeacher()` ; aiguillage post-login par rôle (enseignant/admin → `/teacher`, élève → `/dashboard`).
- CRUD complet des `lessons` (créer / éditer / supprimer / réordonner ↑↓) via server actions, validation serveur, RLS prouvée (écriture enseignant-only, lecture élève OK).
- Build & lint verts ; poussé sur la branche → redeploy preview Vercel.
- **Prochaine étape (après feu vert)** : Lot 3 — fiche de fin de cours (§7.6, composant critique < 30 s) qui alimente `lesson_records` + `vocabulary` + `grammar_rules` + `homework` et avance le curseur `student_progress`.

---

## Étape 1 — Socle (auth, rôles, RLS, modèle de données) — ✅ TERMINÉ & VALIDÉ (preview OK)

> Socle validé de bout en bout le 2026-06-21 (login fonctionnel sur la preview Vercel, RLS prouvées).
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
