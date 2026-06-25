# Todo

---

## Session 16 — Refonte tunnel de vente, pricing & règles métier

> **Statut : VALIDÉ PAR LE PROPRIÉTAIRE (2026-06-24) — en cours.**
> Cette session REMPLACE plusieurs décisions de la Session 15 (essai payant→gratuit, mensuel 60€→heure 15€, invite-driven→self-serve via Revolut).

### Décisions validées (propriétaire)
- **Essai = GRATUIT** (déjà fait début de session). Obligatoire AVANT tout paiement.
- **Pricing = 2 produits seulement** :
  - **Abonnement annuel** = 4 séances de 1 h/mois (48 h/an), 4 niveaux dégressifs :
    - 1 paiement : **624 €** (1×624) — 52 €/mois équiv.
    - 2 paiements : **648 €** (2×324) — 54 €/mois
    - 3 paiements : **672 €** (3×224) — 56 €/mois
    - 12 paiements : **696 €** (12×58) — 58 €/mois
  - **Heure à la carte** : **15 €/h**, sans engagement.
  - → Le **mensuel 60 €** disparaît. La carte d'essai n'est PLUS affichée dans les tarifs.
- **Cours de groupe (Produit B)** : RETIRÉ du vitrine (back-end conservé).
- **Tunnel essai** : genre → créneau réel (calendrier 1 mois depuis `teacher_availability`) → fiche (prénom/nom/email/niveau) → le prof confirme le créneau. Anti-doublon : créneaux pris = grisés (verrou base).
- **Code d'essai obligatoire** : à la confirmation/complétion de l'essai, code à usage unique généré + envoyé par email (Resend), à saisir avant de payer.
- **Compte créé UNIQUEMENT au paiement Revolut confirmé** (webhook). Dédup par email (déjà client → rattacher, pas de doublon).
- **Email** : Resend (clé branchée plus tard — TODO dans le code).
- **Paiement** : lien de paiement Revolut (checkout hébergé) + webhook.
- **Règles métier** : retard 5 min → **10 min** ; lien Zoom rejoignable dès **−10 min** ; absence justifiée/créneau impossible → report (`moved`). Seuil 3 absences injustifiées : à rediscuter (laissé tel quel pour l'instant).

### Phase 0 — Vitrine (aucun blocage) ✅
- [x] Hero `/` : titre « Cours d'arabe individuel en distanciel » ; retiré islamique + « enseignant dédié selon ton genre »
- [x] Retiré le tiret dans « cours d'essai gratuit » (partout)
- [x] Étapes : « Laisse tes informations et choisis un créneau. On te recontacte par mail pour confirmer »
- [x] Retiré la carte Produit B de l'accueil (carte A centrée)
- [x] Supprimé la page `/groupe` (back-end conservé ; aucun lien nav/footer ne pointait dessus)

### Phase 1 — Pricing (2 cartes) ✅
- [x] Réécrit `src/lib/pricing.ts` : `ANNUAL_PLANS` (1x 624 / 2x 648 / 3x 672 / 12x 696) + `HOURLY_PRICE` 15 €, mensuel retiré
- [x] Migration `29_hourly_product` appliquée (DB) : `payment_plan += 'hourly'` ; `payment_product += 'individual_hour'` ; types régénérés
- [x] `/offres` : 2 cartes **cliquables** (annuel / heure) → `/essai?offre=…`, sans carte d'essai, bandeau « essai obligatoire »
- [x] 3 consommateurs corrigés (offres, payment-request-form, dashboard actions) + `PLAN_LABEL` teacher/élève + prix vitrine 55→52 €
- [x] Build vert (32 routes)

### Phase 2 — Tunnel d'essai multi-étapes ✅
- [x] Migration 30 : `scheduled_at` + `level` sur `trial_requests` ; RPCs `get_teacher_availability_by_gender` + `get_trial_taken_slots` (SECURITY DEFINER, anon)
- [x] `/essai` : wizard 3 étapes (genre → calendrier créneaux → fiche prénom/nom/email/niveau)
- [x] Expansion des créneaux récurrents `teacher_availability` sur 35 jours UTC côté client
- [x] Anti-double-booking côté serveur (re-vérification avant INSERT)
- [x] Fallback « aucun créneau disponible » (passage direct à l'étape formulaire)
- [x] Côté prof : carte d'essai affiche créneau + niveau

### Phase 3 — Code d'essai ✅
- [x] Migration 31 : `trial_code`, `trial_code_expires_at`, `trial_code_used` + index unique partiel
- [x] `src/lib/resend.ts` : client Resend + `sendTrialCode()` — FROM configurable via `EMAIL_FROM`
- [x] À la confirmation (→ Essai effectué) : code 8 chars généré (crypto.randomBytes, non-ambigu) + email envoyé automatiquement
- [x] `assigned_teacher_id` stocké à la confirmation de l'essai
- [x] Bouton « Renvoyer le code » sur la fiche enseignant
- [x] Code visible côté enseignant (support)
- [ ] **TODO** : domaine OVH → vérifier dans Resend → `EMAIL_FROM=noreply@takalamu.com` dans Vercel

### Phase 4 — Tunnel paiement self-serve ✅ (mode manuel — Revolut différé)
- [x] Migration 32 : `chosen_plan`, `chosen_product`, `revolut_order_id` sur `trial_requests`
- [x] `src/lib/revolut.ts` : `createRevolutOrder()` + `verifyRevolutSignature()` (TODO clés)
- [x] `/inscription` : wizard 3 étapes (code → plan → confirmation) + re-vérification serveur
- [x] Mode auto : si `REVOLUT_MERCHANT_API_KEY` → crée ordre Revolut → redirige élève
- [x] Mode manuel (actuel) : génère référence `TK-XXXXXXXX`, message « lien envoyé par email »
- [x] `/api/webhooks/revolut` : HMAC-SHA256, créé compte auth + students + payments, dedup email
- [x] Nav : lien « J'ai un code » → `/inscription`
- [ ] **TODO (après création société)** : configurer `REVOLUT_MERCHANT_API_KEY` + `REVOLUT_WEBHOOK_SECRET` dans Vercel
- [ ] **TODO** : URL webhook à déclarer dans Revolut Merchant → Webhooks : `/api/webhooks/revolut`
- [ ] **Différé** : email de bienvenue Resend plus riche après création de compte (actuellement Supabase invite)

### Phase 5 — Règles métier mises à jour (timing ✅ ; quota/report différés)
- [x] Module partagé `src/lib/join-window.ts` (constantes centralisées, anti-duplication)
- [x] Lien Zoom dispo dès −10 min (`JOIN_OPEN_MIN`) — `join-button.tsx` + `next-course-hero.tsx`
- [x] Retard 5 → 10 min (`JOIN_LATE_MIN`) + libellé `attendance.ts` « Retard (> 10 min) »
- [ ] **Différé** Quota : heures à la carte vs 48/an (compteur consommé/payé)
- [ ] **Différé** Report `moved` sur absence justifiée / créneau impossible
- [ ] **À rediscuter** seuil 3 absences injustifiées (laissé tel quel)
- [ ] **TODO connu** : le lien Zoom est livré en SSR → fenêtre purement visuelle. Couper réellement = RPC/route gardée temporellement.

### Review Session 16

**Réalisé :**
- **Phase 2** — Tunnel d'essai 3 étapes : migration 30 (créneaux + niveau), RPCs SECURITY DEFINER pour anon, wizard genre→créneau→fiche, expansion récurrente sur 35 jours UTC, anti-double-booking serveur.
- **Phase 3** — Code d'essai : migration 31, `resend.ts`, code 8 chars non-ambigu auto-généré et envoyé à la confirmation, bouton "Renvoyer" côté prof, `assigned_teacher_id` stocké.
- **Phase 4** — Tunnel paiement self-serve : migration 32, `revolut.ts`, wizard `/inscription` (code → plan → confirmation), webhook HMAC-SHA256 `/api/webhooks/revolut`, mode manuel TK-XXXXXXXX actif, nav "J'ai un code".
- **Phase 5 (partiel)** — Timing : module `join-window.ts`, lien Zoom dès −10 min, retard 10 min.
- Build vert, push sur `claude/takalamu-platform-setup-f8szt8`.

**En attente / différé :**
- Domaine OVH → Resend → `EMAIL_FROM=noreply@takalamu.com` dans Vercel.
- Revolut Merchant API (après création société) : clés Vercel + URL webhook.
- Phase 5 quota (heures à la carte vs 48/an), report `moved`, seuil absences.
- Zoom link temporellement gardé côté serveur (actuellement fenêtre SSR visuelle seulement).

---

## Session 15 — Vitrine publique + Parcours d'inscription révisé

> **Statut : PLAN ÉCRIT — en attente de validation du propriétaire.**
> Décisions propriétaire (2026-06-24) :
> - Modèle **B** (essai d'abord, puis self-service paiement). Pas d'achat direct anonyme pour le Produit A.
> - **Produit B (groupe)** : la page est CODÉE mais NON liée dans la nav publique — activée plus tard à la demande.
> - **Paiement = Revolut**, mais l'**intégration réelle (checkout/webhook) est différée**. Pour l'instant : demande de plan → `pending` → l'enseignant confirme manuellement (déjà construit).
> - **Essai = payant, prix unique 10 €, déduit du 1er mois.**
> - **Grille tarifaire validée** (montants à confirmer par le propriétaire au moment de coder) :
>   - Mensuel sans engagement : **60 €/mois** (4 séances)
>   - Annuel payé ×12 : **55 €/mois** (−8 %)
>   - Annuel payé ×3 : **52 €/mois** équiv. (−13 %)
>   - Annuel payé ×2 : **50 €/mois** équiv. (−17 %)
>   - Annuel payé ×1 (comptant) : **576 €/an** (−20 %)

### Phase 0 — Modèle de données (migrations + RLS, testées MCP) ✅
- [x] Migration `26_trial_requests` : table `trial_requests`, RLS anon INSERT / teacher genre / admin all / student 0.
- [x] Migration `27_pricing` : `payment_plan += 'monthly'` ; `payments.amount_cents` + `payments.trial_credit_cents` ; `students.trial_credit_cents`.
- [x] Migration `28_public_read_teachers` : policy publique SELECT sur `teachers` pour la vitrine.
- [x] `src/lib/pricing.ts` : source de vérité unique des plans + prix.
- [x] `database.types.ts` régénéré.

### Phase 1 — Vitrine publique ✅
- [x] Layout public `src/app/(public)/layout.tsx` : header responsive + footer.
- [x] `/` Accueil refait : hero, 3 étapes, offres A+B, CTA essai.
- [x] `/cours-arabe` : Produit A détaillé + CTA essai.
- [x] `/enseignants` : depuis `teachers` table (genre-based, public read).
- [x] `/offres` : grille tarifaire complète depuis `pricing.ts`.
- [x] `/essai` : formulaire `requestTrial` + confirmation.
- [x] `/groupe` : codée, NON liée dans la nav.

### Phase 2 — Parcours d'inscription (onboarding backend) ✅
- [x] Server action `requestTrial` (anon) : INSERT + RPC `notify_teachers_by_gender`.
- [x] Page `/teacher/trials` : liste filtrée par genre, pending en premier.
- [x] `TrialCard` client component : transition de statut + bouton "Inviter".
- [x] Server action `inviteStudent` : `inviteUserByEmail` + INSERT `students` (teacher_id, gender, trial_credit_cents) + mark `converted`.
- [x] Badge "Essais" dans `DrawerNav` (count pending depuis `teacher/layout.tsx`).

### Phase 3 — Paiement révisé ✅
- [x] `PaymentRequestForm` refactorisée : Mensuel / Annuel ×1/×2/×3 depuis `pricing.ts`, crédit essai affiché.
- [x] `requestPayment` : snapshots `amount_cents` + `trial_credit_cents`.
- [x] `/teacher/payments` : libellé `monthly` ajouté.

### Phase 4 — Build ✅
- [x] `npm run build` vert (33 routes, 0 erreur TypeScript).

### Différé (hors session, noté explicitement)
- Intégration Revolut Checkout/webhook (paiement auto, confirmation par webhook).
- Vidéos Bunny Stream (welcome + milestone).
- Mise en avant du Produit B sur la vitrine (à la demande du propriétaire).
- Reset `students.trial_credit_cents = 0` après première confirmation de paiement (dans `confirm_payment` RPC ou trigger).

---

### Review Session 15

**Réalisé :**
- Vitrine complète 6 pages dans le route group `(public)` : `/`, `/cours-arabe`, `/enseignants`, `/offres`, `/essai`, `/groupe`.
- Parcours d'essai de bout en bout : prospect soumet `/essai` → RLS anon INSERT → notify teacher genre → teacher voit `/teacher/trials` → marque statuts → invite l'élève → compte créé avec `trial_credit_cents`.
- 3 migrations appliquées (26, 27, 28) + types régénérés.
- `pricing.ts` = source unique pour toutes les pages et actions.
- Build vert, 33 routes.

### Différé (hors session, noté explicitement)
- Intégration Revolut Checkout/webhook (paiement auto, confirmation par webhook). Pour l'instant confirmation manuelle.
- Vidéos Bunny Stream (welcome + milestone).
- Mise en avant du Produit B sur la vitrine (à la demande du propriétaire).

---

## Session 14 — Audio assets leçons

### Plan ✅
- [x] Migration `25_lesson_audio_bucket` : bucket `lesson-audio` privé (50 Mo, audio MIME), policy `lesson_audio_teacher_all` (ALL) + `lesson_audio_student_select` (SELECT)
- [x] Server actions `uploadLessonAudio` + `removeLessonAudio` dans `teacher/program/actions.ts` : upload → `audio_assets` INSERT → `lessons.audio_asset_id` link ; suppression propre avec nettoyage Storage
- [x] Composant `AudioSection` (`teacher/program/[id]/edit/audio-section.tsx`) : lecteur + "Supprimer" si audio existe, sinon formulaire upload (titre optionnel + fichier)
- [x] Page `/teacher/program/[id]/edit` : fetch `audio_asset_id + audio_assets(storage_path, title)`, URL signée 1h, rendu AudioSection
- [x] Dashboard élève `src/app/dashboard/page.tsx` : query étendue aux `audio_assets`, batch signed URLs via `createSignedUrls`, lecteur `<audio>` inline dans les cartes de séance
- [x] Build vert, migré en base, pushé

### Review (Session 14)
**État au 2026-06-24 — Audio leçons livré de bout en bout.**
- Bucket `lesson-audio` privé créé (migration 25). RLS : teacher=ALL, student=SELECT-only. Pas de restriction par dossier (audio partagé par leçon, pas per-student).
- Côté prof : `AudioSection` sous le formulaire d'édition de leçon. Upload remplace proprement l'ancien fichier (delete Storage + delete audio_assets avant de lier le nouveau). Suppression via cascade `ON DELETE SET NULL` sur `lessons.audio_asset_id`.
- Côté élève : `createSignedUrls` batch (1 appel pour toutes les leçons de la page). Lecteur `<audio controls>` dans chaque carte de séance qui a un audio.
- **Reste** : vitrine publique (le propriétaire a des idées sur l'offre + le paiement), vidéos Bunny Stream.

---

## Session 12 — Q1 Quiz vocabulaire auto-généré

### Plan Q1 — QCM vocabulaire (brique 1/4) ✅
- [x] Migration `21_quiz_rpcs` : RPC `generate_individual_quiz` + `submit_individual_quiz` (SECURITY DEFINER, anti-triche)
- [x] `database.types.ts` : ajouter les 2 nouvelles fonctions
- [x] Server actions `src/app/dashboard/evaluations/actions.ts` : `generateQuiz` + `submitQuiz`
- [x] Page `src/app/dashboard/evaluations/page.tsx` : SSR — compte le vocab, liste les tentatives, rend `QuizRunner`
- [x] Composant client `src/app/dashboard/evaluations/quiz-runner.tsx` : machine d'état idle→playing→done
- [x] `src/app/dashboard/more/page.tsx` : ajouter lien "Évaluations"
- [x] Tests MCP : génération (quiz renvoyé sans bonne réponse), soumission (score recalculé côté serveur, tentative insérée), sécurité (étudiant A ne peut pas générer pour B)
- [x] Build vert + push

### D1 — Soumission de devoir côté élève ✅
- [x] Migration `22` : type notif `homework_submitted`
- [x] Migration `23` : DROP policy `hw_update_student` (faille : élève pouvait modifier grade/feedback/status), RPC `submit_homework` SECURITY DEFINER (restreint à submission_file + status=rendu + submitted_at, notifie le prof), bucket `homework-submissions` + policies
- [x] `database.types.ts` : `submit_homework` + enum `homework_submitted`
- [x] Action `submitHomework` (upload bucket → RPC) + composant `HwSubmitForm`
- [x] Page élève : upload photo sur `a_rendre`, indicateur "envoyé" sur `rendu`
- [x] Page prof : lien URL signée pour voir la copie déposée
- [x] Preuves : UPDATE direct élève = 0 ligne ✅ ; RPC dépose correctement ✅ ; notif prof ✅ ; non-propriétaire 42501 ✅

### D2 — Devoirs audio (voice message WhatsApp) ✅
- [x] `HwSubmitForm` : toggle photo/audio, MediaRecorder (enregistrer→arrêter→réécouter→refaire→envoyer), Blob → `submit_homework` (même RPC/bucket que D1)
- [x] Page prof : détection audio par extension → lecteur `<audio>` inline
- [x] Pas de migration (audio = fichier dans le même bucket, `allowed_mime_types` null)

### Q2 — Évaluations de grammaire rédigées par le prof ✅
> **Reclassement décidé le 2026-06-23** : les exercices de grammaire ne sont PAS des devoirs — ce sont des **évaluations** (comme le quiz), rédigées à la main par le prof (jamais auto-générées), QCM auto-corrigé.
- [x] Migration `24_grammar_quiz` : `ALTER TYPE quiz_source ADD VALUE 'grammar'`, `quizzes.teacher_id`, CASCADE FK quiz→questions/attempts, RPC `get_grammar_quiz_questions` (SECURITY DEFINER, sans bonne réponse, choix mélangés), RPC `submit_grammar_quiz` (anti-triche)
- [x] Côté prof : `/teacher/evaluations` (liste), `/teacher/evaluations/new` (créer), `/teacher/evaluations/[quizId]` (gérer questions + notifier élèves + supprimer). Lien "Évaluations" dans `DrawerNav`.
- [x] Côté élève : `GrammarQuizRunner` (machine d'état idle→playing→done), section "Exercices de grammaire" dans `/dashboard/evaluations` (filtrés par enseignant), historique des tentatives grammaire
- [x] `database.types.ts` : `quiz_source` + 'grammar', `quizzes.teacher_id`, 2 nouvelles fonctions
- [x] Preuves MCP : questions renvoyées sans `correct_answer` ✅ ; score 1/2 recalculé server-side ✅ ; cross-teacher 42501 ✅ ; CASCADE delete questions = 0 ✅ ; build 30 routes vert ✅

### Review (Session 13 — Q2)
**État au 2026-06-23 — Quiz de grammaire prof → élève livré.**
- **Q2** : teacher CRUD complet (`/teacher/evaluations`). 2 RPCs SECURITY DEFINER : `get_grammar_quiz_questions` (masque la bonne réponse, mélange les choix) + `submit_grammar_quiz` (score recalculé server-side, bonne réponse révélée post-soumission). Notification `eval_due` aux élèves. `GrammarQuizRunner` côté élève avec machine d'état identique au quiz vocab. Section grammaire dans `/dashboard/evaluations`, séparée de la section vocabulaire. Historique des tentatives par type.
- **Reste** : vitrine publique (le propriétaire a des idées sur la révision offre/paiement), vidéos Bunny.

### Review (Session 12 — Q1 + D1 + D2)
**État au 2026-06-23 — Quiz vocab + soumission devoirs (photo & audio) livrés.**
- **Q1** : 2 RPCs SECURITY DEFINER `generate_individual_quiz` (FR↔AR, 4 choix mélangés, bonne réponse jamais transmise) + `submit_individual_quiz` (score recalculé server-side). Page `/dashboard/evaluations` + `QuizRunner` + historique. Lien dans Plus.
- **D1** : faille RLS fermée (`hw_update_student` supprimée — l'élève pouvait s'auto-noter). RPC `submit_homework` restreint le dépôt aux bons champs + notifie le prof. Bucket `homework-submissions`. Upload photo côté élève, URL signée côté prof.
- **D2** : enregistrement audio façon WhatsApp (MediaRecorder), réutilise la même RPC/bucket. Lecteur `<audio>` côté prof. Zéro migration.
- **Preuves** : Q1 (génération sans fuite, 42501 cross-élève, score 2/3) ; D1 (UPDATE élève=0 ligne, RPC OK, notif prof, 42501 non-propriétaire). Advisor : nouvelles RPC = même WARN SECURITY DEFINER que les RPC déjà acceptées, chacune auto-gardée.
- Build 27 routes vert. Poussé sur les deux branches.
- **Reste** : Q2 (grammaire prof), vitrine publique (révision offre/paiement — le propriétaire a des idées), vidéos Bunny.

---

## Session 11 — Blocs 3, 4, 5, fin Bloc 6

> **Statut : TERMINÉ.**
> Tous les blocs livrés (3, 4, 5, fin 6). Build vert 26 routes. Poussé sur les deux branches.

### Bloc 3 — Liste chats enseignant ✅
- [x] Ajouter "Messages" dans `DrawerNav` NAV_ITEMS → `/teacher/messages`
- [x] Créer `/teacher/messages/page.tsx` : liste conversations (nom élève + dernier message + badge non-lu), triée par dernière activité

### Fin Bloc 6 — Notifications (suite) ✅
- [x] Migration `18_extend_notification_types` : ajouter `homework_corrected`, `payment_requested`, `payment_confirmed` à l'enum `notification_type`
- [x] `database.types.ts` : mettre à jour `Enums.notification_type`
- [x] Notification `homework_corrected` → student dans `correctHomework` (server action)
- [x] Notification `payment_requested` → teacher dans `requestPayment` (server action)
- [x] Notification `payment_confirmed` → student dans `confirmPayment` (server action)
- [x] `NotifBell` : libellés pour les 3 nouveaux types (déjà présents depuis session 10)

### Bloc 4 — Uploads fichiers ✅
- [x] Migration `19_storage_buckets` : créer buckets `session-files` + `homework-corrections` + 4 policies RLS Storage
- [x] Migration `20_extend_session_rpc` : ajouter `p_support_files jsonb DEFAULT '[]'` à `submit_session_record`
- [x] `database.types.ts` : mettre à jour `Functions.submit_session_record`
- [x] `session-form.tsx` : champ `<input type="file" multiple name="support_files">`
- [x] `actions.ts` (session) : upload fichiers → Storage, passer paths à la RPC
- [x] `hw-correction-form.tsx` : champ `<input type="file" name="correction_file">`
- [x] `actions.ts` (homework) : upload fichier → Storage, stocker path dans `homework.correction_file`

### Bloc 5 — Admin (inviter un enseignant) ✅
- [x] `requireAdmin()` dans `auth.ts` (garde-fou rôle admin)
- [x] Action `inviteTeacher` : `auth.admin.inviteUserByEmail()` (metadata role=teacher → trigger crée le profil) + INSERT ligne `teachers`. Garde si `SUPABASE_SERVICE_ROLE_KEY` absent.
- [x] Page `/teacher/admin/teachers` : liste des enseignants (badge admin/genre) + formulaire d'invitation
- [x] Lien "Enseignants" dans `DrawerNav` visible uniquement si `role === 'admin'`

### Review (Session 11)
**État au 2026-06-23 — Blocs 3, 4, 5, fin Bloc 6 livrés. Build vert (26 routes).**
- **Bloc 3** : `/teacher/messages` liste toutes les conversations avec dernier message, date relative et badge non-lu. "Messages" ajouté dans DrawerNav.
- **Fin Bloc 6** : 3 nouveaux types d'enum (`homework_corrected`, `payment_requested`, `payment_confirmed`). Notifications déclenchées dans `correctHomework`, `confirmPayment` et `requestPayment` via RPC SECURITY DEFINER (pas de createAdminClient).
- **Bloc 4** : Buckets Storage `session-files` + `homework-corrections` (private, 10 Mo), 4 policies (teacher=ALL, student=SELECT/dossier propre). RPC étendue avec `p_support_files`. Champs upload dans le form de séance et dans la correction de devoir. Fichiers nommés `{student_id}/{timestamp}_{nom}`.
- **Bloc 5** : `requireAdmin()` + page `/teacher/admin/teachers` (liste + invitation) + entrée DrawerNav admin-only. Invitation via `inviteUserByEmail` (service_role légitime — seule voie pour créer un compte auth + e-mail). Garde explicite si la clé manque.
- Preuves SQL : enum 7 valeurs ✅, buckets ✅, policies Storage ✅, RPC signature ✅, 3 types insertables ✅, RLS teachers (non-admin bloqué / admin autorisé) ✅, `confirm_payment` étanche élève (§8.1) ✅, advisor 0 nouveau lint ✅.
- **Note exploitation** : la fonctionnalité d'invitation requiert `SUPABASE_SERVICE_ROLE_KEY` dans les env vars Vercel (sinon message d'erreur clair, pas de crash). À vérifier côté propriétaire.
- **Reste possible (prochaines sessions)** : vidéos Bunny Stream, vitrine publique, quiz auto-générés, soumission de devoir côté élève (upload `submission_file`).

---

## Session 10 — Corrections prod + Fonctionnalités manquantes

> **Statut : TERMINÉ (blocs 1, 2, 6-partiel). Blocs 3, 4, 5 à continuer.**
> Audit réalisé en session 10 (2026-06-23) — 4 agents parallèles. Plan en 6 blocs.

### Bloc 1 — Chat lag (UX critique) ✅
- [x] `useOptimistic` : message apparaît instantanément, vrai message retourné par le serveur avant dissipation de l'optimistic
- [x] Debounce `markReadAction` 600 ms : élimine N×UPDATE en rafale
- [x] `createClient()` dans `useRef` (une seule instance par composant)
- [x] Scroll `behavior: 'auto'` au montage, `'smooth'` uniquement pour nouveaux messages
- [x] Actions `sendMessage` / `sendMessageAsTeacher` : ajout `.select().single()` pour retourner le message inséré
- [x] Realtime : skip messages propres (déjà ajoutés via `setMessages` dans la transition)

### Bloc 2 — Corrections rapides ✅
- [x] Label paiement dynamique : `individual_sub` → "Abonnement individuel" / `book` → "Cours de groupe" (3 fichiers)
- [x] Pagination historique séances : lien "Voir tout (N)" / "Voir moins" avec `?all=true`, `count: "exact"` pour vrai total dans stats

### Bloc 3 — Liste chats enseignant
- [ ] Page `/teacher/messages/page.tsx` : liste toutes les conversations du teacher (dernier message + badge non-lu)
- [ ] Lien dans `DrawerNav` vers `/teacher/messages`

### Bloc 4 — Uploads fichiers
- [ ] Bucket Storage `session-files` (si inexistant) + policy RLS
- [ ] `support_files` : champ upload dans `session-form.tsx` + paramètre dans RPC `submit_session_record` + server action
- [ ] Bucket Storage `homework-corrections` + policy RLS
- [ ] `correction_file` : champ upload dans `hw-correction-form.tsx` + champ dans action `correctHomework`

### Bloc 6 — Notifications complètes (cloche) — partiel ✅
> Toutes les notifs se créent via RPC SECURITY DEFINER `insert_notification` (jamais createAdminClient).
> Payload enrichi : `{ url, sender_name }` stockés à la création → NotifBell cliquable sans requête supplémentaire.
> **Pas de notification vidéo** — les vidéos s'affichent automatiquement à la connexion.

- [x] Notification `new_message` → RPC SECURITY DEFINER, payload avec `url` + `sender_name`, `NotifBell` cliquable
- [x] `NotifBell` : libellés lisibles par type, lien cliquable si `payload.url` présent, fermeture auto au clic
- [x] `loading.tsx` sur `/dashboard`, `/dashboard/messages`, `/dashboard/bookings`, `/dashboard/homework` — feedback visuel immédiat au changement d'onglet
- [ ] Notification `homework_submitted` → teacher quand un élève dépose un devoir (Bloc 4)
- [ ] Notification `homework_corrected` → student quand `correctHomework` passe à `corrige`
- [ ] Notification `payment_requested` → teacher quand `requestPayment` crée un pending
- [ ] Notification `payment_confirmed` → student quand `confirm_payment` RPC passe à `paid`

### Bloc 5 — Admin (faible priorité)
- [ ] Page `/teacher/admin/teachers` : liste des enseignants + bouton "Inviter un enseignant"
- [ ] Server action `inviteTeacher` : `supabase.auth.admin.inviteUserByEmail()` + création ligne `teachers` + `profiles(role=teacher)`
- [ ] Lien dans `DrawerNav` visible uniquement si `role === 'admin'`

### Review (Session 10)
**État au 2026-06-23 — Chat lag corrigé, notifications fonctionnelles, UX onglets améliorée.**
- Bloc 1 : `ChatBox` entièrement réécrit — `useOptimistic` + `useTransition`, debounce `markRead`, `createClient` en `useRef`, scroll conditionnel. Zéro lag perçu à l'envoi.
- Bloc 2 : labels paiement dynamiques, pagination historique séances.
- Bloc 6 partiel : RPC `insert_notification` remplace `createAdminClient` (qui échouait silencieusement en prod faute de `SUPABASE_SERVICE_ROLE_KEY`). Payload enrichi avec `url` + `sender_name` → cloche cliquable avec nom de l'expéditeur.
- `loading.tsx` : 4 fichiers → skeleton animé immédiat au clic d'onglet côté élève.
- **Prochaines priorités** : Bloc 3 (liste chats enseignant), Bloc 4 (uploads fichiers), fin Bloc 6 (notifs homework + paiement).

---

## Étape 7 — Messagerie + Paiements

> **Statut : TERMINÉ.**

### Lot 7A — Messagerie temps réel
- [x] Migration 16 : Realtime activé sur `messages` + `notifications`
- [x] Server actions `sendMessage` / `sendMessageAsTeacher` + `markMessagesRead`
- [x] `ChatBox` client (Realtime `postgres_changes`, auto-scroll, reset form, mark-read)
- [x] Page élève `/dashboard/messages` (upsert conv via admin, 50 msgs)
- [x] Page enseignant `/teacher/messages/[studentId]` (upsert conv via teacher policy)
- [x] Lien "Chat" depuis la fiche élève enseignant
- [x] Onglet "Messages" dans DashboardTabs

### Lot 7B — Cloche de notifications
- [x] `NotifBell` client (Realtime INSERT notifs, badge count, liste déroulante, mark-all-read)
- [x] Intégrée dans layout teacher + layout dashboard

### Lot 8A — Paiements élève
- [x] Page `/dashboard/payments` : historique + formulaire demande d'offre
- [x] Server action `requestPayment` (admin client, guard duplicate)
- [x] Onglet "Paiement" dans DashboardTabs

### Lot 8B — Paiements enseignant
- [x] Page `/teacher/payments` : pending en premier, historique
- [x] `PaymentActions` client : Confirmer / Annuler (admin client)
- [x] `confirmPayment` réactive le statut élève `suspended_payment → active`
- [x] Badge pending dans le cockpit `/teacher`
- [x] Lien "Paiements" dans nav enseignant

### Lot 8C — Preuves & déploiement
- [x] Tests MCP : isolation messages (A: Ali voit ses msgs ✓, B: Omar voit 0 ✓), paiements (C: pot commun teacher ✓, D: INSERT élève bloqué 42501 ✓)
- [x] Build verts (21 routes) → push

### Review (Étape 7)
**État au 2026-06-22 — Messagerie temps réel + Paiements livrés.**
- Realtime activé (migration 16) sur `messages` + `notifications`.
- `ChatBox` : Supabase Realtime `postgres_changes`, bulles alignées (moi/eux), heure locale, indicateur "Lu", auto-scroll, reset form post-envoi.
- Notifications `new_message` créées via admin client (RLS bloque INSERT côté client).
- `NotifBell` : badge rouge avec count, dropdown 20 dernières, mark-all-read au clic, Realtime live.
- Paiements : élève demande un plan → `pending` (admin client) ; enseignant confirme → `paid` + réactive `suspended_payment` si besoin.
- **Prochaine étape possible** : vidéos Bunny Stream, vitrine publique, quiz auto-générés.

---

## Étape 6 — Planning & réservation

> **Statut : TERMINÉ.**

### Lot 6A — Dispos enseignant (`/teacher/availability`)
- [x] CRUD créneaux récurrents (day_of_week + heure UTC, formulaire client avec conversion TZ)
- [x] Server actions : `createSlot`, `deleteSlot`

### Lot 6B — Réservations enseignant (`/teacher/bookings`)
- [x] Liste des bookings à venir (statut `booked`)
- [x] Actions : marquer `completed`/`cancelled`, ajouter `zoom_link`

### Lot 6C — Réservation élève (`/dashboard/bookings`)
- [x] Helper `checkBookingEligibility` (statut actif + paiement `paid` + quota 4/mois)
- [x] Génération des créneaux libres côté serveur (4 semaines × dispos − déjà réservés)
- [x] Formulaire de sélection (composant client, affichage heure locale navigateur)
- [x] Server action `createBooking` (re-vérifie l'éligibilité + slot libre)
- [x] Liste des réservations à venir

### Lot 6D — Bouton Rejoindre (composant client)
- [x] Fenêtre H−30min → H+5min : bouton Zoom actif
- [x] Avant : "Rejoindre à HH:MM" ; après : "Accès fermé" (règle §8)
- [x] Re-render toutes les minutes (`useEffect`)

### Lot 6E — Preuves & déploiement
- [x] Tests MCP : isolation bookings (A: élève voit uniquement les siens; B: Khadija ne voit pas les élèves de Youssef; D: Youssef voit les siens; C: INSERT RLS au bon niveau, verrou payment = app-level)
- [x] Build + lint verts → push + sync Vercel

### Review (Étape 6)
**État au 2026-06-22 — Planning & réservation livré.**
- `src/lib/booking.ts` : helpers `generateAvailableSlots` (4 semaines, dédupliqué UTC, ≤20 slots, préavis 2h) + `checkBookingEligibility` (statut actif + paiement paid + quota 4/mois).
- `/teacher/availability` : CRUD créneaux récurrents (heure locale → UTC via `getTimezoneOffset()`), `DeleteSlotButton` client.
- `/teacher/bookings` : liste à venir + passées, `BookingActions` client (zoom inline, marquer terminé/annulé).
- `/dashboard/bookings` : eligibilité, créneaux libres (admin client pour filtrer tous les bookings teacher sans exposer les données), `BookingSlots` client (affichage heure locale navigateur), `JoinButton` (fenêtre H−30min/H+5min, re-render 1 min).
- Nav teacher enrichie (Dispos + Résa), onglet élève Réservations ajouté.
- **RLS tests** : isolation élève↔élève ✓, Khadija ne voit pas les bookings de Youssef ✓, Youssef voit les siens ✓, INSERT guard = app-level (server action `checkBookingEligibility`) ✓.
- **Prochaine étape possible** : paiement Revolut, messagerie temps réel, vidéos Bunny Stream, ou vitrine publique.

---

## Étape 5 — Espace enseignant complet (cockpit + élèves + correction)

> **Statut : EN COURS.**

### Lot 5A — Cockpit `/teacher` (refonte)
- [x] Devoirs à corriger (count + liste rapide, statut `rendu`)
- [x] Élèves suspendus (badge alerte)
- [x] Sessions récentes (5 dernières)

### Lot 5B — Liste des élèves `/teacher/students`
- [x] Table des élèves (RLS filtre au teacher courant)
- [x] Badge statut + nb absences injustifiées
- [x] Liens → fiche élève + raccourci « Nouvelle séance »

### Lot 5C — Fiche élève `/teacher/students/[id]`
- [x] En-tête : nom, statut, absences
- [x] Note de profil privée épinglée (formulaire inline)
- [x] Curseur : leçon en cours (`student_progress`)
- [x] Historique séances (`lesson_records`, 8 dernières)
- [x] Devoirs en attente de correction (statut `rendu`)
- [x] Vocab + grammaire récents (aperçu 5/3)
- [x] Action : modifier statut (actif / suspendu)

### Lot 5D — File de correction `/teacher/homework`
- [x] Tous les `homework` au statut `rendu` (tous élèves)
- [x] Formulaire de correction inline (feedback + note)
- [x] Server action `correctHomework` → statut `corrige`

### Lot 5E — Migration + pré-sélection élève session
- [x] Migration `14_profile_note_unique` : contrainte UNIQUE (student_id, teacher_id)
- [x] Migration `15_fix_profile_note_rls` : correctif RLS (trou découvert en test)
- [x] Session `/teacher/session/new?student_id=…` : pré-sélection depuis fiche élève

### Lot 5F — Preuves & déploiement
- [x] Tests MCP : isolation teacher↔teacher (B,C,D,E,F,G,H — 8 tests)
- [x] Build + lint verts → push + sync branche Vercel

### Review (Étape 5)
**État au 2026-06-22 — Espace enseignant complet livré.**
- Cockpit `/teacher` : grille d'actions rapides + badge compteur devoirs + alerte élèves suspendus + 5 sessions récentes.
- `/teacher/students` : liste RLS-filtrée (Khadija voit 2 élèves, Youssef-admin voit tous) avec badges statut.
- `/teacher/students/[id]` : fiche complète — note privée épinglée (upsert inline, amber), curseur leçon, historique, devoirs `rendu`, aperçu vocab/grammaire, changement de statut.
- `/teacher/homework` : file de correction — formulaire inline feedback + note → passage à `corrige`.
- Pré-sélection élève dans la session via `?student_id=`.
- **Correctif sécurité (migration 15)** : trou RLS découvert en test sur `student_profile_notes` — le WITH CHECK ne vérifiait pas `owns_student()`. Corrigé avant merge.
- **Prochaine étape** : planning/réservation, paiement Revolut, messagerie, ou vitrine publique.

---

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

---

## Refonte UI — Design system Claude Design

### Phase 1 — Fondations (fonts + tokens)
- [x] Remplacer Geist par Spectral + Plus Jakarta Sans + Amiri dans `layout.tsx`
- [x] Mettre à jour `globals.css` : fond page `#F7F4EE`, tokens couleurs warm
- [x] Étendre Tailwind v4 avec les tokens du design system

### Phase 2 — Layouts (navigation)
- [x] Réécrire `dashboard-tabs.tsx` → `BottomTabBar` (bottom tab bar flottante, 5 onglets)
- [x] Créer `/dashboard/more/page.tsx` (Vocabulaire, Grammaire, Paiements, Déconnexion)
- [x] Mettre à jour `dashboard/layout.tsx` (bottom bar, fond warm, pb pour le contenu)
- [x] Créer `DrawerNav` composant enseignant (tiroir teal `#0A4636`, animation)
- [x] Mettre à jour `teacher/layout.tsx` (burger + drawer, fond warm)

### Phase 3 — Pages élève (session suivante)
- [ ] Page Cours/Accueil (hero teal + compte à rebours + historique)
- [ ] Page Réserver (grouper par jour, bouton Réserver → Réservé)
- [ ] Page Devoirs (badges cycle + bottom sheet upload)
- [ ] Page Messages (bulles, barre de saisie)
- [ ] Page Plus (profil hero + menu)

### Phase 4 — Pages enseignant
- [ ] Cockpit (action vedette + grille stats + liste cours du jour)
- [ ] Mes élèves (recherche + filtres + fiche bottom sheet)
- [ ] File de correction
- [ ] Disponibilités (toggle)
- [ ] Paiements (hero teal encaissé)
- [ ] Fiche de fin de cours (l'écran le plus critique)

---

## Session 9 (2026-06-23) — Corrections prod + Cockpit contextuel

> **Statut : TERMINÉ.**

### Fixes déployés
- [x] **Bug `/dashboard/messages`** : suppression admin client — nouvelle RLS policy `conv_student_insert_own` (INSERT élève avec son enseignant) ; page passe par select + insert standard
- [x] **Bug `/dashboard/bookings`** : suppression admin client — nouvelle RPC SECURITY DEFINER `get_teacher_booked_slots()` qui retourne uniquement `scheduled_at/status` des créneaux du prof, visible uniquement pour l'élève de ce prof
- [x] **Bug paiements teacher** : policy `payments_select_admin` ajoutée (compte admin sans ligne `teachers` voyait page vide)
- [x] **Bug validation/annulation paiement** : suppression admin client — deux RPCs SECURITY DEFINER `confirm_payment` / `cancel_payment` (transaction atomique : payment + réactivation élève)
- [x] Types TS mis à jour (`get_teacher_booked_slots`, `prep_notes`, `confirm_payment`, `cancel_payment`)

### Cockpit enseignant refactorisé
- [x] Suppression du bouton "Fiche de fin de cours" permanent
- [x] Section "À documenter" : bookings passés (7j) sans `lesson_record` → bouton "Documenter" (pré-sélectionne l'élève)
- [x] Section "Prochains cours" : bookings à venir (7j) → bouton "Préparer" / "Voir prépa"
- [x] Correction bornes UTC (anti-pattern timezone corrigé, Principe §7)

### Nouvelle page : Préparer le cours
- [x] Migration : colonne `prep_notes text` dans `bookings`
- [x] Page `/teacher/session/prep/[bookingId]` : contexte élève (leçon en cours + dernier récap), textarea libre
- [x] Server action `savePrepNotes` → sauvegarde dans `bookings.prep_notes`, redirect `?prep=ok`

### Audit réalisé (3 agents parallèles)
- [x] Chat lag identifié : 4 causes (pas d'optimistic update, markReadAction en boucle, createClient dans useEffect, scroll smooth au montage) — **correctif chat non encore implémenté**
- [x] Fonctionnalités manquantes identifiées : `support_files` upload, `correction_file` upload, label paiement hardcodé, historique séances tronqué, liste chats enseignant

### Reste à faire (prochaine session)
- [ ] Chat lag : optimistic update + debounce markReadAction
- [ ] `support_files` : upload fichiers après séance (champ absent du formulaire)
- [ ] `correction_file` : upload copie corrigée dans la file de correction
- [ ] Label paiement : afficher "Cours de groupe" vs "Abonnement individuel" selon `product`
- [ ] Liste chats enseignant : page `/teacher/messages` avec liste de toutes les conversations
- [ ] Bouton "Ajouter un enseignant" (admin)
- [ ] Historique séances : pagination / "voir tout" au-delà de 8

### Review (Session 9)
**État au 2026-06-23 — Corrections prod + Cockpit contextuel livrés.**
- Les deux pages élève (`bookings`, `messages`) ne crashent plus — admin client retiré, remplacé par RLS ciblées et RPC SECURITY DEFINER.
- Bug paiements teacher (page blanche pour l'admin) corrigé via policy RLS.
- Cockpit devenu contextuel : boutons apparaissent selon le contexte temporel (à documenter / à préparer) au lieu d'un bouton permanent.
- Nouvelle page "Préparer le cours" : contexte élève + notes libres liées au booking.
- Audit chat lag documenté, correctifs identifiés mais non encore implémentés.

---

## Review — Refonte UI (session du 23 juin)

**Fait & poussé** sur `claude/takalamu-dev-continuation-7u0xw3` :

- **Phase 1 — Fondations** : polices Spectral/Plus Jakarta Sans/Amiri, tokens
  CSS (warm neutrals + emerald), animations, fond `#F7F4EE`.
- **Phase 2 — Navigation** : bottom tab bar élève (5 onglets) + page « Plus » ;
  drawer latéral teal enseignant (DrawerNav).
- **Phase 3 — Espace élève** : Cours (hero teal + compte à rebours live + bouton
  Rejoindre 3 états + stats + historique), Réserver (créneaux groupés par jour),
  Devoirs (badges de cycle), Glossaire (Amiri RTL + recherche), Grammaire,
  Messages (bulles iMessage), Paiement.
- **Phase 4 — Espace enseignant** : Cockpit (action vedette + grille stats +
  alerte + cours du jour), Mes élèves (recherche + filtres), File de correction,
  Disponibilités, Paiements (hero teal), Réservations, **Fiche de fin de cours**
  (présence 2×2 colorée, note privée ambre à cadenas, barre d'enregistrement
  collante), fiche élève détaillée. Login + landing restylés.
- Composants partagés : `StatusBadge` (table sémantique), `NextCourseHero`,
  `DrawerNav`, `StudentsList`.

**Validation** : `npm run build` OK à chaque phase (22 routes, 0 erreur TS).
Logs Supabase API : 200 partout, pas d'erreur serveur.

**Reste / non fait (volontairement, hors périmètre de cette passe)** :
- Pages mode auteur `/teacher/program*` (CRUD leçons) : non restylées — utilitaire
  d'avant-rentrée, faible priorité visuelle.
- Bottom sheet d'upload de devoir (rendu fichier élève) : nécessite un bucket
  Storage + server action de soumission — feature, pas du style.
- Combobox recherchables (élève/leçon) dans la fiche : on a gardé les `<select>`
  natifs (plus rapides à saisir, incassables) — conforme au principe « saisie < 30s ».
- Sélecteur de police/accent du proto : volontairement figé (Spectral + Jakarta +
  #0F9D6E) comme recommandé par le handoff.
