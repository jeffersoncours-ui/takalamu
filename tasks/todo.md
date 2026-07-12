# Todo

---

## Session 30 (suite 7) — Audit complet (3 sous-agents) + nettoyage validé

> Audit lancé à la demande du propriétaire (code mort / perf / bugs d'affichage),
> rapport validé, **« Programme » confirmé définitivement abandonné**. Consigne :
> ne rien casser — vérifier toutes les références avant suppression, tester
> empiriquement après.

### Pré-vérifications (faites avant toute suppression)
- [x] Grep exhaustif : `student_progress` = 0 référence code ; `lessons(`/`audio_assets` = 3 fichiers seulement (dashboard, 2× homework) ; `p_lesson_id`/`p_advance_progress` = jamais passés par aucun appelant ; `lessons.ts`/`attendanceLabel`/`shaders-react`/`date-fns-tz` = 0 import
- [x] Données en base : `lessons` = 2 lignes de seed (juin, jamais référencées — `records_with_lesson_id` = 0), `audio_assets` = 0, `student_progress` = 1 (curseur mort), bucket `lesson-audio` = 0 fichier

### Perf
- [x] `src/lib/auth.ts` : `cache()` React sur `getProfile` + lookup `students` (déduplique layout+page à chaque navigation — le plus gros gain)
- [x] `teacher/payments/page.tsx` : 2 requêtes indépendantes → `Promise.all`
- [x] `notif-bell.tsx` : client Supabase mémoïsé (aligné sur le pattern chat-box)

### Retrait « Programme » (validé propriétaire : plus jamais de programme)
- [x] `dashboard/page.tsx` : retrait jointure `lessons`/`audio_assets` + bloc URLs signées `lesson-audio` + lecteur audio (plus jamais alimentés)
- [x] `dashboard/homework/page.tsx` + `teacher/homework/page.tsx` : jointure `lessons(title)` morte remplacée par `custom_title` de la séance (sous-titre plus utile, fini le "Sans leçon")
- [x] Suppression `src/lib/lessons.ts` (orphelin) + `attendanceLabel` (export jamais importé)
- [x] `package.json` : retrait `@paper-design/shaders-react` + `date-fns-tz` (0 import) + lockfile régénéré
- [x] Migration 46 appliquée : DROP `student_progress`, `lessons`, `audio_assets`, colonne `lesson_records.lesson_id`, enum `lesson_phase`, policies+bucket `lesson-audio` ; `submit_session_record` simplifiée (sans `p_lesson_id`/`p_advance_progress`)
- [x] `database.types.ts` : édition ciblée reflétant la migration

### Robustesse
- [x] Vérification `error` (console.error) ajoutée sur les 11 pages à jointures embarquées (même angle mort que le bug session 26) : teacher/homework, teacher/payments, teacher/students, teacher/messages, teacher/evaluations, admin/teachers, dashboard/homework, vocabulary, grammar, formulations, evaluations

### Validation empirique
- [x] Build (29 routes) + lint verts (seule erreur pré-existante drawer-nav.tsx)
- [x] MCP : migration appliquée, `submit_session_record` (nouvelle signature) testée par impersonation + ROLLBACK (création ✔, vocab lié ✔, titre vide toujours rejeté ✔), 3 tables + colonne + bucket confirmés absents, données réelles intactes (7 séances, 177 mots), advisors = mêmes WARN acceptés, 0 nouveau
- [x] Grep final : 0 référence restante aux éléments supprimés
- [x] Push branche de session (preview) — PAS de merge prod sans validation propriétaire
- [ ] Test manuel propriétaire sur la preview → merge `main`/prod

## Session 30 (suite 6) — Grammaire : nom de la règle indépendant du cours

Effet de bord de la suite 5 : `groupByLesson` affichait le `custom_title` du
cours comme étiquette d'accordéon pour la grammaire aussi, masquant le nom
propre de la règle derrière un accordéon à ouvrir. Corrigé en aplatissant
l'affichage (chaque règle = sa propre carte, titrée par son propre nom, avec
le nom du cours d'origine en petit lien "Voir le cours" en dessous).

- [x] `dashboard/grammar/page.tsx` + `grammar-search.tsx` (élève) : liste à
      plat au lieu d'accordéons groupés par cours
- [x] `teacher/students/[id]/page.tsx` section "Règles de grammaire" : même
      aplatissement côté enseignant
- [x] Vocabulaire et Formulations laissés groupés par cours (inchangé,
      volontaire — un mot/une expression n'a pas de nom propre)
- [x] Vérifié sur les vraies données (2 règles réelles "Le mot = الكَلِمَةُ"
      rattachées à des cours nommés "بَائِعُ الأَصْنَامِ") que le rendu
      correspond au besoin
- [x] `npm run build` + `npm run lint` verts
- [x] Test manuel du propriétaire sur la preview → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- Chaque règle de grammaire s'affiche désormais par son propre nom (élève et
  enseignant), avec un simple lien vers le cours d'origine — plus de nom de
  cours utilisé comme étiquette d'accordéon pour la grammaire.
- Vocabulaire et Formulations restent groupés par cours (choix assumé, pas un
  oubli).
- **Déployé en production** avec la suite 5 (nom de cours) et la suite 4
  (Formulations), après validation manuelle du propriétaire sur la preview.

## Session 30 (suite 4) — Formulations (expressions) + quiz auto-généré

> **Demande propriétaire** : ajouter, à côté du vocabulaire et de la grammaire, une
> 3ᵉ catégorie « Formulation » — des expressions/phrases complètes (paire arabe ↔
> français, ex. من أين أنت؟ / « d'où viens-tu ? »). Saisies en fin de cours comme le
> vocabulaire, et donnant lieu à un quiz auto-généré (comment dit-on…, propositions
> tirées des autres formulations de l'élève). Jumeau exact du système vocabulaire.

### Plan
- [x] Migration 44 : table `formulations` (arabic_text/french_text/student_id/lesson_record_id, mirror `vocabulary`) + RLS deny-by-default (élève lit les siennes, prof gère celles de ses élèves) + trigger updated_at + enum `quiz_source += 'formulation'` (appliqué en 2 étapes : valeur d'enum seule puis le reste, pour éviter la contrainte Postgres « unsafe use of new enum value ») + RPC `generate_formulation_quiz` (moitié du pool, distracteurs des autres formulations, anti-triche) + `submit_formulation_quiz` + extension `submit_session_record`/`update_session_record`/`delete_session_record` (DROP+CREATE pour ajouter `p_formulations`, re-GRANT)
- [x] `database.types.ts` : édités ciblés (table formulations, 2 RPC, `p_formulations` sur submit/update, enum)
- [x] `session-form-zip.ts` : `zipFormulation`
- [x] Fiche de fin de cours (`session-form.tsx` + `actions.ts`) : section Formulation (paires ar/fr) appliquée à tous les élèves sélectionnés
- [x] Édition de séance (`edit-session-form.tsx` + `edit/page.tsx` + `edit/actions.ts`) : formulations préremplies + remplacées
- [x] Évaluations élève : `QuizPlayer` générique extrait (partagé vocab+formulation via `item_id`, actions renvoient/acceptent un id générique masquant vocab_id/form_id), lanceurs `QuizRunner` (vocab) + `FormulationQuizRunner`, 2ᵉ section sur la page
- [x] Nouvelle page `/dashboard/formulations` (recherche + accordéons par cours, mirror vocabulaire) + carte violette sur `/dashboard/revision`
- [x] Fiche prof élève : accordéon Formulations (stats laissées à 4 tuiles pour ne pas surcharger le mobile)
- [x] Détail de séance (élève `cours/[recordId]` + prof `sessions/[recordId]` + edit) : bloc formulations
- [x] Build (29 routes, 0 erreur TS) + lint (0 nouvelle erreur, seule `drawer-nav.tsx` pré-existante) verts
- [x] Vérif MCP (impersonation, transactions rollback, aucune donnée réelle persistée) : submit avec 4 formulations → quiz de 2 questions (moitié) ✔, 4 choix/question ✔, score recalculé serveur ✔, isolation RLS (Bilel voit 0 formulation d'Anthony) ✔, update remplace complètement (2→1) ✔, delete supprime tout ✔ ; advisor sécurité : mêmes WARN acceptés, 0 nouveau type, table `formulations` couverte par RLS
- [x] Test manuel du propriétaire sur la preview → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- Nouvelle catégorie « Formulation » = expressions/phrases complètes en paire arabe ↔ français, saisies en fin de cours à côté du vocabulaire et de la grammaire (jumeau exact du système vocabulaire).
- Quiz formulation auto-généré (comment dit-on…, distracteurs tirés des autres formulations de l'élève, moitié du périmètre, anti-triche côté serveur) sur la page Évaluations.
- Consultation élève sur `/dashboard/formulations` (recherche + accordéons par cours) et intégration dans tous les détails de séance (élève + prof) et la fiche prof.
- Refactor : le moteur de quiz vocabulaire a été extrait en `QuizPlayer` générique, réutilisé tel quel pour les formulations (2ᵉ usage → extraction justifiée).
- **Déployé en production** avec la suite 5 (nom de cours) et la suite 6
  (correctif grammaire), après validation manuelle du propriétaire sur la preview.

---

## Session 30 (suite 3) — Compte Bilel + fiche de fin de cours multi-élèves

> **Demande propriétaire** : Bilel (mba.benhamouda@gmail.com), ancien élève plus avancé
> qu'Anthony souhaitant utiliser le site en révision, doit démarrer avec le même
> acquis qu'Anthony (2 cours, vocabulaire, grammaire) pour ne pas tout reprendre à zéro.
> Puis, pour l'usage futur (les deux élèves suivant le même programme), pouvoir remplir
> la fiche de fin de cours une seule fois pour plusieurs élèves à la fois.

### Plan
- [x] Compte Bilel créé en base (SQL direct, méthode identique à la création du compte Anthony session 23) : `mba.benhamouda@gmail.com`, mot de passe temporaire généré, rattaché à Jefferson (même prof qu'Anthony), `role=student`, `gender=m`, `status=active`
- [x] Contenu dupliqué à l'identique depuis l'état réel actuel d'Anthony (relu en base avant copie, pas depuis une version périmée de la conversation) : Cours 1 (24 vocab + 1 grammaire) et Cours 2 (26 vocab), mêmes dates/récaps. Devoirs et notes privées volontairement exclus (demande explicite propriétaire)
- [x] Vérification RLS : impersonation Bilel → 0 ligne d'un autre élève visible ✔
- [x] Photos du Cours 1 d'Anthony (2 images) : **non dupliquées par moi** — hors de portée du MCP Supabase (accès SQL uniquement, pas au Storage backend) ; propriétaire les a réuploadées lui-même manuellement via la page Modifier
- [x] Fiche de fin de cours (`/teacher/session/new`) : sélection élève passée de `<select>` unique à une liste de cases à cocher (`student_ids[]`) — la même fiche (présence, vocabulaire, grammaire, devoir, récap, supports, note privée) est désormais appliquée à chaque élève coché, en une seule saisie
- [x] `submitSession` (actions.ts) : boucle sur `formData.getAll("student_ids")`, appelle `submit_session_record` une fois par élève avec le même contenu (vocab/grammar/support files re-uploadés dans le dossier Storage de chacun) ; notification `homework_due` envoyée à chaque élève concerné si devoir assigné
- [x] Build + lint verts (28 routes, 0 nouvelle erreur — seule l'erreur pré-existante `drawer-nav.tsx` subsiste)
- [x] Vérification MCP : RPC `submit_session_record` appelée deux fois (Anthony + Bilel) avec le même contenu dans une transaction `BEGIN...ROLLBACK` → 2 séances créées, 1 mot de vocabulaire chacune ✔, aucune donnée réelle persistée
- [x] Test manuel du propriétaire sur la preview → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- Bilel peut désormais se connecter avec `mba.benhamouda@gmail.com` (mot de passe temporaire communiqué séparément) et retrouve le même acquis pédagogique qu'Anthony (2 cours, vocabulaire, grammaire).
- La fiche de fin de cours permet de cocher plusieurs élèves suivant le même programme (ex. Anthony + Bilel) : une seule saisie crée une séance identique pour chacun, sans distinction de présence entre eux (choix assumé, demande explicite).
- Limite documentée : la duplication de fichiers (photos/documents) entre comptes élèves n'est pas possible via les outils MCP actuels (accès SQL uniquement, pas au Storage) — reste une action manuelle du propriétaire si besoin à l'avenir.
- **Déployé en production** avec les suites 4, 5 et 6, après validation manuelle du propriétaire sur la preview.

---

## Session 30 (suite 2) — Retrait de la revue des anciennes tentatives de quiz

> **Demande propriétaire**, après test du correctif modifier/supprimer un cours :
> l'élève pouvait revoir ses anciennes tentatives de quiz (vocabulaire cliquable
> vers une page de revue détaillée, grammaire en liste score+date). Décision :
> retirer complètement cette visibilité — l'objectif est la répétition, pas le
> suivi historique par l'élève lui-même (« on s'en fout, le but c'est qu'il en
> fasse un max »).

### Plan
- [x] `/dashboard/evaluations/page.tsx` : retrait de la requête `quiz_attempts` et des deux listes d'historique (vocabulaire cliquable vers la revue, grammaire score+date) — ne reste que les lanceurs de quiz (`QuizRunner`/`GrammarQuizRunner`)
- [x] Suppression de la route désormais morte `/dashboard/evaluations/[attemptId]` (page de revue détaillée d'une tentative, plus aucun lien n'y mène)
- [x] Le score immédiat en fin de quiz (écran "Done" de `QuizRunner`/`GrammarQuizRunner`, juste après avoir terminé) est conservé — feedback pédagogique du quiz qu'on vient de faire, différent du fait de revenir consulter un ancien test plus tard
- [x] `quiz_attempts` reste enregistrée en base (pas de suppression de données, juste plus affichée à l'élève — impact minimal, aucune raison de toucher au schéma)
- [x] Build + lint verts (27 routes, une de moins — `[attemptId]` supprimée — 0 nouvelle erreur)
- [x] Push sur `claude/takalamu-session-30-zwsp29`
- [x] Test manuel du propriétaire sur la preview → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel depuis la branche de session, aucun conflit

### Review
- L'élève ne voit plus aucun historique de ses tentatives passées (ni vocabulaire ni grammaire) — seul reste le lanceur de quiz et le feedback immédiat du quiz qu'il vient de terminer.
- Rien supprimé côté données (`quiz_attempts` continue d'être alimentée normalement par les RPC existantes) — uniquement l'affichage côté élève qui change.
- **Déployé en production** (main + branche Vercel synchronisées, fast-forward propre).

---

## Session 30 (suite) — Modifier / supprimer un cours depuis la fiche prof

> **Contexte** : le propriétaire a testé le Cours 2 d'Anthony en direct sur le site
> et a dû envoyer la fiche avant de l'avoir terminée (bug d'usage réel). Demande :
> pouvoir modifier ou supprimer un cours après coup depuis la fiche prof.
> **Consigne explicite** : développer sur la branche de session (pas de merge
> main/prod avant test manuel du propriétaire lui-même).

### Plan
- [x] Migration 43 : deux nouvelles RPC `SECURITY INVOKER` (s'appuient sur les policies `*_teacher_all` déjà en place, migration 03/10 — aucun changement RLS nécessaire) :
  - `update_session_record(...)` : même signature que `submit_session_record` + `p_record_id`. Remplace intégralement vocab/grammaire liés (comme la création, la fiche envoie toujours la liste complète). Devoir jamais écrasé/supprimé silencieusement si déjà rendu/corrigé par l'élève (`status != 'a_rendre'`) — seul le texte est alors modifiable. Note privée : upsert/delete simple. Recalcule le compteur d'absences injustifiées si la présence change (symétrique à `submit_session_record`), y compris réactivation si ça repasse sous le seuil de suspension.
  - `delete_session_record(p_record_id)` : supprime la séance + vocab/grammaire liés. Devoir jamais touché par l'élève → supprimé ; devoir déjà rendu/corrigé → détaché (`lesson_record_id = NULL`, jamais perdu). Note privée : `ON DELETE CASCADE` déjà en place. Décompte le compteur d'absences si la séance en comptait une, réactive le compte si besoin.
- [x] `database.types.ts` régénéré (2 nouvelles entrées `Functions`)
- [x] `src/lib/session-form-zip.ts` : extraction de `zipVocab`/`zipGrammar` (dupliqués dans `session/actions.ts`, maintenant réutilisés aussi par `edit/actions.ts` — 2ᵉ usage, extraction justifiée)
- [x] Page détail prof (`sessions/[recordId]/page.tsx`) : boutons **Modifier** (lien) et **Supprimer** (`DeleteSessionButton`, confirmation navigateur avant soumission — action destructive avec cascade)
- [x] `sessions/[recordId]/actions.ts` : `deleteSession` (nettoie les fichiers Storage best-effort puis appelle la RPC)
- [x] Nouvelle page `sessions/[recordId]/edit/` : `EditSessionForm` (même look que la fiche de création, préremplie — élève figé en lecture seule, vocab/grammaire préremplis et retirables, supports existants avec case à cocher conserver/retirer + ajout de nouveaux) + `actions.ts` (`updateSession`, notifie l'élève uniquement si un devoir apparaît là où il n'y en avait pas avant)
- [x] Build + lint verts (30 routes, 0 nouvelle erreur — seule l'erreur pré-existante `drawer-nav.tsx` subsiste)
- [x] Vérification MCP exhaustive (impersonation Jefferson/Khadija, tout en transactions `BEGIN...ROLLBACK`, **aucune donnée réelle d'Anthony touchée** — reconfirmé après coup : Cours 1 = 24 vocab/1 grammaire/recap inchangés, Cours 2 = 3 vocab inchangés, compteur d'absences 0/active inchangé) :
  - `update_session_record` : bascule présence → compteur d'absences +1 puis retour à 0 en annulant ✔ ; vocabulaire/grammaire intégralement remplacés (ancien mot disparu, nouveau présent) ✔ ; note privée créée ✔ ; devoir déjà "rendu" → vider les instructions NE le supprime PAS ✔, modifier le texte fonctionne sans toucher au statut/à la pièce jointe ✔
  - `delete_session_record` : séance + vocab/grammaire supprimés ✔ ; devoir "a_rendre" (jamais touché) supprimé avec la séance ✔ ; devoir "corrigé" (avec note + fichier) **détaché mais conservé** (`lesson_record_id = NULL`) ✔ ; compteur d'absences décrémenté ✔, réactivation automatique du compte testée (3 absences + `suspended_absences` → suppression d'une séance comptante → 2 + `active`) ✔
  - Accès refusé : Khadija (autre enseignante) sur le vrai Cours 1 d'Anthony → `42501 Séance introuvable ou non autorisée` sur `update_session_record` ET `delete_session_record` ✔
  - Advisor sécurité : `update_session_record`/`delete_session_record` n'apparaissent PAS dans la liste des fonctions `SECURITY DEFINER` (normal, elles sont `SECURITY INVOKER` — s'appuient sur RLS + vérification interne), aucun nouveau WARN
- [x] Test manuel du propriétaire sur la preview Vercel de la branche de session → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel (`claude/new-project-setup-1jcgwf`) depuis la branche de session, aucun conflit (les deux étaient strictement à jour au démarrage de cette étape)

### Review
- Deux nouvelles actions disponibles sur la fiche de détail prof d'un cours : **Modifier** (formulaire préremplie, mêmes champs que la création) et **Supprimer** (confirmation navigateur, cascade complète).
- Protection des données réelles : un devoir déjà rendu ou corrigé par l'élève ne peut jamais être supprimé/écrasé silencieusement par une modification ou suppression du cours parent — seul son texte de consigne reste modifiable, le reste (statut, fichiers, note, correction) est préservé.
- Le compteur d'absences injustifiées (§8) reste cohérent quelle que soit l'opération : modifier la présence d'un cours existant ou supprimer un cours qui comptait comme absence recalcule et, si besoin, réactive automatiquement un compte suspendu repassé sous le seuil.
- **Déployé en production** (main + branche Vercel synchronisées, fast-forward propre) après validation manuelle du propriétaire sur la preview.

---

## Session 30 — Taille du quiz vocabulaire = moitié du glossaire du périmètre

> **Demande propriétaire** : le quiz vocabulaire générait toujours jusqu'à 10 questions,
> peu importe le nombre de mots réellement disponibles (ex. 24 mots au Cours 1
> d'Anthony → toujours 10). Nouvelle règle : le nombre de questions doit être la
> **moitié** du vocabulaire du périmètre choisi (tout le glossaire, ou un cours
> précis via le sélecteur existant) — 24 mots → 12 questions.

### Plan
- [x] Migration 42 : `generate_individual_quiz` — `p_size` passe de `DEFAULT 10` à `DEFAULT NULL` ; quand NULL, calcule `GREATEST(1, ROUND(count_du_périmètre / 2.0))`. Signature inchangée (mêmes types) → `CREATE OR REPLACE` sans DROP. Reste overridable explicitement si besoin futur.
- [x] `dashboard/evaluations/actions.ts` : `generateQuiz` n'envoie plus `p_size: 10` — laisse le serveur calculer.
- [x] `dashboard/evaluations/quiz-runner.tsx` : appel sans taille fixe ; texte dynamique "N questions pour ce quiz" recalculé côté client selon le périmètre sélectionné (tout le glossaire ou un cours), cohérent avec le calcul serveur.
- [x] `database.types.ts` régénéré via MCP — aucun diff (le paramètre `p_size` avait déjà un défaut donc était déjà typé optionnel avant cette session).
- [x] Vérification MCP (impersonation Anthony, transactions rollback, aucune donnée réelle modifiée) :
  - Tout le glossaire (24 mots) → 12 questions ✔
  - Filtré sur le Cours 1 (24 mots, seul cours existant) → 12 questions ✔
  - Override explicite `p_size=5` toujours fonctionnel → 5 ✔
  - Arrondi sur un total impair (29 mots, insert temporaire dans la même transaction puis rollback) → round(29/2)=15 ✔ (arrondi à l'entier le plus proche, pas de troncature)
  - Après rollback : 24 mots exactement pour Anthony (aucune trace de test) ✔
  - Advisor sécurité : 0 nouveau lint (mêmes WARN pré-existants acceptés) ✔
- [x] Build + lint verts (28 routes, 0 nouvelle erreur — seule l'erreur lint pré-existante de `drawer-nav.tsx` subsiste, non touchée)
- [x] Push sur `claude/takalamu-session-30-zwsp29`

### Review Session 30
- Le quiz vocabulaire (tout le glossaire ou un cours précis via le sélecteur) génère désormais un nombre de questions égal à la moitié (arrondie) du vocabulaire du périmètre choisi, au lieu d'un plafond fixe de 10 déconnecté du contenu réel.
- Les distracteurs restent tirés de l'ensemble du glossaire (décision session 27, inchangée) — seule la **taille** du quiz change.
- `p_size` reste un paramètre optionnel de la RPC (override explicite toujours possible si un besoin futur apparaît), mais plus aucun appel client ne le fixe en dur.
- Pas encore mergé sur `main` — en attente de validation propriétaire avant déploiement (pattern habituel des sessions précédentes).

---

## Session 29 — Correctifs (email, mot de passe, chat, notifications) + nettoyage vidéos

> Session dédiée à des correctifs demandés par le propriétaire, plus un
> reliquat de la session 28 (retrait vidéos) devenu exécutable une fois le
> MCP Supabase autorisé dans cette session.

### Plan
- [x] Email d'authentification du compte Jefferson : `prof.hommes@takalamu.test` → `jeffersoncours@gmail.com` (`auth.users.email`, `auth.identities.identity_data`/`provider_id`, `profiles.email`) — SQL direct, vérifié par relecture des 4 champs après coup.
- [x] Mot de passe oublié : lien sur `/login`, page `/login/forgot-password` (`resetPasswordForEmail`), callback `/auth/confirm` (gère `token_hash`+`type` et `code`), page `/reset-password` (réutilise l'action `changePassword`). **Nécessite une action manuelle du propriétaire** : ajouter l'URL de redirection à l'allow-list Supabase (Authentication → URL Configuration → Redirect URLs) — impossible à faire via MCP.
- [x] Mot de passe : composant `ChangePasswordForm` + action `changePassword` déplacés de `dashboard/more/` (élève uniquement) vers `src/components/` + `src/lib/actions/` (partagés) ; ajouté sur `/teacher/profile` (2ᵉ usage → extraction, pas prématuré).
- [x] Bug chat "Youssef" : root cause trouvée — `teachers.display_name` n'avait pas suivi le renommage `profiles.full_name` (session 25). Page `/dashboard/messages` lit `teachers.display_name` directement. Fix en base : `display_name = 'Jefferson'`.
- [x] Suppression "En ligne" (texte statique, aucun suivi de présence réel derrière) côté chat élève.
- [x] Notifications : RPC `insert_notification` testée en conditions réelles (impersonation Anthony, transaction rollback) — fonctionne, grants et publication realtime corrects. 0 ligne en base car aucun déclencheur réel ne s'était encore produit (0 message envoyé, 0 paiement demandé, 0 devoir corrigé) — **sauf un vrai trou trouvé** : `homework_due` n'était jamais envoyé quand le prof assigne un devoir en fiche de fin de cours. Câblé dans `teacher/session/actions.ts`.
- [x] Reliquat session 28 : migration 41 — `DROP TABLE videos, milestone_video_assignments, video_views` (0 ligne chacune, vérifié avant coupe) + `DROP TYPE video_type` + recréation de `notification_type` sans la valeur `video_assigned` (jamais utilisée en code). `database.types.ts` régénéré via MCP.
- [x] Build + lint : 29 routes, 0 erreur TS (1 erreur ESLint pré-existante non liée dans `drawer-nav.tsx`, non touchée cette session).
- [x] Push sur `claude/takalamu-dev-resume-4t29kz`

### Correctif complémentaire (même session) — mis-tap "mot de passe oublié"
- **Test réel du propriétaire** : changement de mot de passe prof validé (nouveau accepté, ancien rejeté), mais aucun message d'erreur affiché avec l'ancien mot de passe — redirection "automatique" vers `/login/forgot-password`.
- **Root cause** : pas un bug de logique — le lien "Mot de passe oublié ?" était collé juste au-dessus du bouton "Se connecter", aligné à droite. Sur mobile, un tap légèrement décalé activait le lien au lieu du bouton, donnant l'impression d'une redirection automatique sans erreur (confirmé par capture d'écran du propriétaire).
- [x] Lien recentré + déplacé sous le bouton "Se connecter" avec espace de séparation (`login-form.tsx`). Build vérifié vert.
- [x] Push (commit séparé)

### Déploiement
- [x] Validé par le propriétaire → fast-forward `claude/takalamu-dev-resume-4t29kz` vers `main` ET vers `claude/new-project-setup-1jcgwf` (branche de prod Vercel, tant que le réglage "Production Branch" n'est pas corrigé sur vercel.com — voir session 28). Les deux étaient strictement à jour (aucun autre commit entre-temps), fast-forward propre sans conflit ni force.

### Reste à faire par le propriétaire (hors code)
- Ajouter l'URL de callback à l'allow-list Supabase Auth (Authentication → URL Configuration → Redirect URLs) : `https://tatakalamu.fr/auth/confirm` (+ variante preview Vercel si besoin de tester avant le domaine définitif). Sans ça, `resetPasswordForEmail` échoue silencieusement (Supabase ignore un `redirectTo` hors allow-list).
- Vérifier la réception réelle de l'email de reset (dépend du SMTP Supabase par défaut — non testable depuis ce sandbox, réseau `*.supabase.co` bloqué).
- Toujours pas de correctif racine pour la synchronisation branche main ↔ branche de prod Vercel : trouver et corriger le réglage "Production Branch" sur vercel.com (voir session 28) pour qu'un futur merge sur `main` déploie automatiquement, sans resynchronisation manuelle à chaque session.
- Suggestion (non demandée) : activer "Leaked Password Protection" dans Supabase Auth (advisor sécurité WARN pré-existant, sans lien avec cette session mais pertinent puisqu'on touche aux mots de passe).

### Review Session 29
- Les 4 champs identité (auth.users.email, auth.identities, profiles.email, teachers.display_name/profiles.full_name) sont maintenant cohérents pour le compte Jefferson.
- Parcours mot de passe complet : changer (élève + prof, désormais partagé) et oublié (nouveau, bout en bout avec callback serveur).
- Diagnostic notifications documenté avec preuve empirique — ce n'était pas un système cassé, juste un vrai gap (homework_due) + absence de déclencheurs réels pour l'unique élève actuel.
- Nettoyage vidéos (reliquat) exécuté dès que possible, conforme à la décision propriétaire déjà actée en session 28.
- Bug de mis-tap "mot de passe oublié" trouvé et corrigé après test réel du propriétaire sur mobile, avant tout merge.
- **Déployé en production** (main + branche Vercel synchronisées manuellement, fast-forward propre).

## Session 27 — Cours numérotés + revue de tentative + quiz par cours

> **Décisions propriétaire (2026-07-10)**, après rapport + questions :
> - Fiche prof : vocab/grammaire en accordéons par cours (comme côté élève), lien vers le détail de séance.
> - Revue de tentative : vocabulaire seulement pour l'instant.
> - **Nouveau** : l'élève choisit de tester tout le glossaire OU un cours précis (le RPC filtrait déjà par `lesson_id` défunt → rebrancher sur `lesson_record_id`).

### Plan
- [x] Migration 40 : `generate_individual_quiz` — filtre `p_lesson_id` (défunt) → `p_lesson_record_id` (séance). Drop+recreate, re-grant execute. Distracteurs toujours tirés du glossaire entier. Appliquée + testée.
- [x] `database.types.ts` régénéré (signature RPC mise à jour)
- [x] Suppression one-shot de la tentative de test (Anthony, 90 %, 10 juil.) + quiz orphelin associé — 0 restant
- [x] `/dashboard/page.tsx` : « Cours sans leçon » → « Cours N » (numérotation chronologique croissante)
- [x] Revue de tentative : `/dashboard/evaluations/[attemptId]` — rejoue le récap depuis `quiz_attempts.answers`, prompt reconstruit via lookup `vocabulary` par `vocab_id` ; liste des tentatives vocab rendue cliquable
- [x] Quiz par cours : sélecteur `<select>` dans `QuizRunner` (« Tout le glossaire » / « Cours N » avec comptes) ; `generateQuiz` passe `p_lesson_record_id` ; page evaluations fournit `courseOptions` via `groupByLesson`
- [x] Fiche prof `/teacher/students/[id]` : vocab + grammaire en accordéons « Cours N » (`AccordionGroup`/`groupByLesson`) avec lien « Voir le cours → » vers le détail de séance ; historique relibellé « Cours N »
- [x] Vérif MCP : RPC filtré testé (tout=10, cours=10, séance vide=0), garde d'appartenance intacte (42501 sur student_id étranger), suppression tentative confirmée (0 restant), advisor sécurité inchangé (fonction recréée, mêmes WARN acceptés)
- [x] Build + lint verts (26 routes, 0 nouvelle erreur)
- [x] Push

### Review Session 27
- **Cours numérotés** partout : dashboard élève et fiche prof affichent « Cours 1, 2… » (le plus ancien = Cours 1) au lieu de « Cours sans leçon »/dates. La date reste affichée en sous-titre.
- **Revue de tentative de quiz** : chaque quiz vocabulaire passé est cliquable → nouvelle page qui rejoue le récapitulatif (✓/✗, ta réponse vs bonne réponse). Le « mot demandé » n'est pas stocké dans `quiz_attempts.answers` mais reconstruit à la lecture via un lookup du glossaire par `vocab_id` (l'opposé de la bonne réponse selon la direction). Si un mot a été supprimé depuis, on affiche quand même réponse/bonne réponse sans le prompt.
- **Quiz au choix (tout / par cours)** : le RPC `generate_individual_quiz` filtrait par `lesson_id` (notion Programme défunte) → rebranché sur `lesson_record_id` (séance réelle). L'élève choisit « Tout le glossaire » ou un « Cours N » précis via un sélecteur. Les distracteurs restent tirés du glossaire **entier** (variété des choix même pour un mini-quiz de cours).
- **Fiche prof réorganisée** : vocab et grammaire en accordéons par cours (comme côté élève), chaque groupe a un lien « Voir le cours → » vers le détail de séance en lecture seule. Historique des séances relibellé « Cours N ». Suppression de l'ancienne pagination « voir tout » vocab/grammaire (remplacée par les accordéons).
- Migration 40 appliquée + prouvée par impersonation ; tentative de test purgée.

### Correctif complémentaire (même session) — cours passés cliquables côté élève
- **Problème signalé** : les 2 photos uploadées par le prof (texte + traduction vocab) atterrissent dans `lesson_records.support_files` mais **aucun écran élève** ne les affichait — la carte du dashboard ne montrait que l'audio de leçon, jamais les fichiers de séance.
- **Fix** : cartes de cours du dashboard rendues cliquables → nouvelle page `/dashboard/cours/[recordId]` (lecture seule) : récap, **documents du cours** (images affichées en grand + lien, URLs signées `session-files` 1h), vocabulaire, grammaire, devoir. Numérotée « Cours N » comme le reste. Aucune note privée (non requêtée, RLS la bloque de toute façon).
- **Vérif MCP** : les 2 fichiers d'Anthony sont bien visibles via la RLS Storage (`session_files_student_select`, dossier = student_id) → 2 fichiers lisibles par impersonation. Build + lint verts (27 routes).

## Session 26 — Bug "0 séances" + correctifs fiche de cours + regroupement par cours

> **Contexte** : premier vrai cours saisi par le propriétaire pour Anthony. Retours de test manuel + un bug critique trouvé en investigation.
> **Décisions propriétaire (2026-07-10)**, après rapport :
> - Page détail de séance construite (récap + vocab/grammaire du jour + note privée + devoir), accessible en cliquant une fiche d'historique.
> - Glossaire/grammaire élève : groupés par cours, ordre chronologique croissant (Cours 1 = premier), accordéons repliés par défaut, recherche globale qui déplie les groupes avec résultat.

### Plan
- [x] **Bug critique** : `/dashboard` (Cours) — requête `lessons(...).audio_assets(...)` ambiguë (2 FK entre les tables) → PostgREST rejette silencieusement, page affiche toujours 0 séances. Fix : qualifier avec `!lessons_audio_asset_fk`.
- [x] `session-form.tsx` : bouton "+ Mot"/"+ Règle" déplacé en bas de liste (plus besoin de remonter) ; retrait du champ "racine" du vocabulaire (+ nettoyage `zipVocab` dans `actions.ts`)
- [x] `/teacher/students/[id]` : retrait "Leçon en cours" (+ requête `student_progress` associée) ; retrait "Sans leçon" dans l'historique (date + statut en tête, recap en corps) ; stats cliquables (ancres vers les sections) ; ajout "voir tout" sur vocabulaire/grammaire (mirroir du pattern déjà existant sur l'historique) ; fiches d'historique cliquables
- [x] Nouvelle page `/teacher/students/[id]/sessions/[recordId]` : détail lecture seule (récap, présence, vocab du jour, grammaire du jour, devoir éventuel, note privée, supports)
- [x] `/dashboard/vocabulary` + `/dashboard/grammar` : regroupement par séance (`lesson_record_id`), accordéon (`AccordionGroup` partagé + `groupByLesson` util), "Cours 1..N" (ordre chronologique croissant), repliés par défaut, recherche globale auto-déplie les groupes correspondants ; ajout d'une barre de recherche sur la page grammaire (n'en avait pas)
- [x] Vérification MCP : données/RLS reconfirmées par impersonation (Anthony voit sa séance + 24 mots + 1 règle liés) — **la correction PostgREST elle-même (`!lessons_audio_asset_fk`) n'a pas pu être testée en conditions réelles depuis ce bac à sable** (réseau vers `*.supabase.co` bloqué, `execute_sql` ne passe pas par la couche PostgREST) ; advisor sécurité inchangé (aucune migration cette session)
- [x] Build + lint verts (26 routes, 0 nouvelle erreur)
- [x] Push

### Review Session 26
- **Bug critique corrigé** : `/dashboard` affichait "0 séances" pour TOUS les élèves depuis l'ajout de la fonctionnalité audio (pas seulement Anthony) — deux clés étrangères opposées entre `lessons` et `audio_assets` rendaient la requête embarquée ambiguë pour PostgREST, qui la rejetait silencieusement (aucun `error` vérifié dans le code). Premier vrai signal utilisateur qui l'a révélé. **À faire par le propriétaire dès le prochain déploiement Vercel** : recharger le dashboard d'Anthony et confirmer que la séance du 8 juillet apparaît — je n'ai pas pu vérifier la résolution PostgREST elle-même depuis ce sandbox (réseau bloqué).
- Fiche de fin de cours : ajout de vocabulaire/grammaire plus fluide (bouton en bas, pas besoin de remonter), champ racine retiré.
- Fiche élève (prof) : "Leçon en cours"/"Sans leçon" retirés (résidus de Programme) ; stats + fiches d'historique cliquables ; nouvelle page détail de séance en lecture seule (`/teacher/students/[id]/sessions/[recordId]`) avec supports téléchargeables (URLs signées).
- Glossaire et grammaire élève réorganisés en accordéon par séance ("Cours 1, 2…"), recherche globale conservée et auto-dépliante. Nouveau composant partagé `AccordionGroup` + utilitaire `groupByLesson` (réutilisable pour un futur regroupement similaire).
- Aucune migration cette session — tout repose sur des colonnes/FK déjà en place.

---

## Session 25 — Photos de profil + nettoyage nav enseignant + suppression scheduling/essai

> **Décisions propriétaire (2026-07-10)**, actées après investigation + questions :
> - Photo de profil uploadable pour élèves ET enseignants (remplace le rond-lettre).
> - Renommer le compte Youssef → **"Jefferson"** (juste le prénom, `profiles.full_name`).
> - Onglets **Essais, Disponibilités, Réservations** supprimés (nav + code + tables — vérifié 0 ligne dans les 3 tables, suppression sans perte).
> - Cockpit simplifié en conséquence : sections "À documenter"/"Prochains cours" (dépendaient de `bookings`) + fonctionnalité "Préparer le cours" retirées.
> - Tunnel public dormant entier retiré (`/essai`, `/offres`, `/inscription`) puisque `/essai` dépendait de `teacher_availability` qui disparaît — cohérent avec le reste (100% bouche-à-oreille depuis la session 22).
> - **Retour propriétaire** : Programme finalement aussi supprimé (nav + route `/teacher/program`) — aucun autre consommateur dans le code (`lessons` reste lu directement par la fiche de fin de cours, indépendant de cette UI CRUD).

### Plan
- [x] Migration 39 : `profiles.avatar_url text` ; extension grant colonne (`full_name, gender, avatar_url`) ; bucket Storage `avatars` (privé, policy owner-only `(storage.foldername(name))[1] = auth.uid()::text`) ; `DROP TABLE bookings, teacher_availability, trial_requests` (+ enums `booking_status`/`booking_type`) ; `DROP FUNCTION get_teacher_availability_by_gender, get_trial_taken_slots, get_teacher_booked_slots, notify_teachers_by_gender` (tous confirmés dead/vides avant suppression)
- [x] `database.types.ts` régénéré via MCP (`generate_typescript_types`) — reflète exactement le schéma post-migration
- [x] Suppression code mort : `src/app/(public)/*` (essai, inscription, offres, layout, vitrine-bg*), `src/app/teacher/trials/*`, `src/app/teacher/availability/*`, `src/app/teacher/bookings/*`, `src/app/teacher/session/prep/*`, `src/lib/pricing.ts`, `sendTrialCode` (resend.ts)
- [x] Nouveau `src/app/page.tsx` (redirect `/login`, remplace l'ancien `(public)/page.tsx`)
- [x] `src/app/teacher/page.tsx` (Cockpit) : retrait des sections dépendant de `bookings`, garde stat "Devoirs à corriger" + alerte suspendus + bouton "Fiche de fin de cours"
- [x] `drawer-nav.tsx` : retrait Essais/Disponibilités/Réservations + `pendingTrials`, ajout "Mon profil" (Programme conservé, décision propriétaire)
- [x] `teacher/layout.tsx` : retrait requête `pendingTrials`, ajout avatar signé passé à DrawerNav
- [x] Upload avatar : composant partagé `avatar-upload.tsx` + action `avatar-actions.ts`, branché sur `/dashboard/profile` (élève) et nouveau `/teacher/profile` (enseignant, + édition nom) + affichage dans les deux avatars (Plus élève, DrawerNav prof)
- [x] Tests MCP : upload propre dossier ✔, écriture dans le dossier d'un autre élève bloquée (42501) ✔, lecture croisée bloquée (0 ligne visible) ✔, advisor sécurité propre après les DROP (mêmes WARN acceptés, aucune nouvelle catégorie) — compte de test entièrement nettoyé
- [x] Renommage données : `profiles.full_name` Youssef → "Jefferson" (SQL direct, confirmé)
- [x] Build + lint verts (27 routes, 0 nouvelle erreur — seul le lint pré-existant de `drawer-nav.tsx` subsiste)
- [x] Push

### Review Session 25
- **Nav enseignant simplifiée** : Essais, Disponibilités, Réservations retirés (nav + code + tables `bookings`/`teacher_availability`/`trial_requests`, toutes vides — suppression sans perte de données réelles). Programme conservé sur demande explicite (curriculum vivant, pas figé).
- **Cockpit simplifié** : sections "À documenter"/"Prochains cours" (dépendaient de `bookings`, plus jamais alimentées) retirées, ainsi que la fonctionnalité "Préparer le cours". Cockpit réduit à : stat devoirs à corriger, alerte élèves suspendus, raccourci fiche de fin de cours.
- **Tunnel public dormant retiré en bloc** : `/essai`, `/offres`, `/inscription` + toute la chrome marketing (`(public)/layout.tsx`, `vitrine-bg*`) supprimés — `/essai` dépendait de `teacher_availability`, sa suppression rendait le tunnel de toute façon non fonctionnel. Racine `/` redirige toujours vers `/login` via un nouveau `src/app/page.tsx` au niveau racine (plus besoin du groupe de routes `(public)`).
- **Photo de profil** : nouvelle colonne `profiles.avatar_url` + bucket Storage privé `avatars` (5 Mo max), policy propriétaire unique par dossier (`{profile_id}/...`). Composant `AvatarUpload` partagé entre élève (`/dashboard/profile`) et enseignant (nouvelle page `/teacher/profile`). URLs signées 1h, régénérées à chaque chargement de page (même pattern que `lesson-audio`/`session-files`).
- **Renommage** : "Youssef (prof hommes + admin)" → "Jefferson" en base.
- **Nettoyage bonus** : `get_teacher_booked_slots` (déjà mort depuis la session 24) supprimé au passage ; `src/lib/pricing.ts` et `sendTrialCode` (resend.ts) retirés, plus aucun consommateur.
- **Preuve isolation avatars** : élève A upload dans son dossier ✔ ; A tente d'écrire dans le dossier de B → RLS bloque (42501) ✔ ; B tente de lire le fichier de A → 0 ligne visible ✔. Advisor sécurité : mêmes WARN acceptés qu'avant (pattern SECURITY DEFINER + vérif interne), 4 fonctions dead supprimées de la liste, aucune nouvelle catégorie.
- **Piège rencontré** : `storage.objects` a un trigger `protect_delete()` qui bloque tout `DELETE` direct (même en tant que rôle privilégié) sauf si `set_config('storage.allow_delete_query', 'true', false)` est positionné dans la session — nécessaire pour nettoyer les données de test après preuve RLS.
- **Retours propriétaire après livraison** : Programme finalement supprimé aussi (nav + route, aucun autre consommateur — `lessons` reste lu directement par la fiche de fin de cours) ; section "Leçon travaillée" + case "avancer le curseur" retirée de la fiche de fin de cours (liée à Programme). `session-form.tsx`/`session/new/page.tsx`/`session/actions.ts` simplifiés en conséquence — le formulaire n'envoie plus `p_lesson_id`/`p_advance_progress` à `submit_session_record` (tous deux optionnels côté RPC, aucun changement de migration nécessaire).

---

## Session 24 — Onglet Révision + profil élève éditable + suppression rappel auto

> **Décisions propriétaire (2026-07-10)**, actées après échange :
> - Onglet **Session → Révision** : retire l'affichage "prochain cours" (compte à rebours, bouton Rejoindre, lien Meet) — le lien Meet est désormais transmis à la main dans le chat existant. Retrait complet, aucune trace ailleurs.
> - **Révision** héberge à la place ce qui vivait dans **Plus** : Évaluations, Glossaire, Grammaire (cartes cliquables, même pattern qu'aujourd'hui — pas de segmented control).
> - **Paiements reste dans Plus.** Plus s'enrichit d'une nouvelle section **Mon profil** : l'élève peut lui-même saisir/modifier prénom (déjà là), adresse, date de naissance, parcours scolaire.
> - **Cron de rappel du jour (`session-reminders`) supprimé** : redondant avec l'envoi manuel du lien par le prof.

### Plan
- [x] Migration 38 : `students.address text`, `students.birth_date date`, `students.school_background text` (nullable) + RPC `update_own_student_info(...)` SECURITY DEFINER (met à jour `profiles.full_name/gender` + `students.address/birth_date/school_background` pour l'appelant élève uniquement — colonnes sensibles `status/teacher_id/unjustified_absences_count` jamais exposées)
- [x] **Correctif sécurité trouvé en chemin** : `profiles_update_own` autorisait la modification de **toute** colonne de sa propre ligne, y compris `role` et `email` (élévation de privilège possible via PATCH REST direct, aucun flux applicatif n'en dépendait). Restreint via `revoke update on profiles from authenticated; grant update (full_name, gender) to authenticated;` — défense en profondeur, indépendant de la RPC ci-dessus.
- [x] `database.types.ts` : ajouter `update_own_student_info` + colonnes `students`
- [x] Renommer route `/dashboard/bookings` → `/dashboard/revision` : nouvelle page avec 3 cartes (Évaluations/Glossaire/Grammaire), suppression de l'affichage "prochain cours"
- [x] Suppression fichiers devenus morts : `next-course-hero.tsx`, `lib/next-course.ts`, `bookings/join-button.tsx` (déjà non importé), `lib/join-window.ts`, `bookings/loading.tsx`
- [x] `dashboard-tabs.tsx` : label "Session" → "Révision", href → `/dashboard/revision`
- [x] `more/page.tsx` : retirer cartes Évaluations/Glossaire/Grammaire, garder Paiements, ajouter carte "Mon profil" → nouvelle page `/dashboard/profile`
- [x] Nouvelle page `/dashboard/profile` + formulaire (prénom, genre, adresse, date de naissance, parcours scolaire) + server action appelant la RPC
- [x] Suppression cron : `src/app/api/cron/session-reminders/route.ts`, entrée `vercel.json`, `sendSessionReminder` dans `resend.ts` (plus jamais appelée) + `CRON_SECRET` retiré de `.env.example`
- [x] `notification_type = 'session_reminder'` et `bookings.reminder_sent` : laissés en base (impact minimal, migration destructive non justifiée) — documentés comme vestiges
- [x] **Migration 38 appliquée en base** (`apply_migration`, une fois le connecteur Supabase autorisé par le propriétaire en cours de session)
- [x] **Tests MCP** (compte de test jetable créé/nettoyé, aucune donnée réelle touchée) :
  - A. RPC `update_own_student_info` : élève modifie nom/genre/adresse/naissance/parcours → toutes les valeurs écrites correctement, `status`/`teacher_id`/`unjustified_absences_count` inchangés ✔
  - B. PATCH direct élève sur `students.status`/`teacher_id` → RLS filtre silencieusement (0 ligne modifiée, aucune policy self-update n'existe sur `students`) ✔
  - C. PATCH direct élève sur `profiles.role` → rejeté avec `permission denied for table profiles` (grant colonne-level) ✔ preuve du correctif sécurité
  - D. Un compte non-élève (testé avec l'admin) appelle la RPC → rejeté `not a student` (42501) ✔
  - Advisor sécurité post-migration : la nouvelle RPC porte le même WARN "SECURITY DEFINER exécutable par anon/authenticated" que toutes les RPC existantes du projet (pattern accepté, vérification d'appartenance interne) — aucun nouveau type de lint
- [x] Build + lint verts (32 routes, 0 nouvelle erreur — le seul lint error préexistant est dans `drawer-nav.tsx`, non touché)
- [x] Push

### Review Session 24
- Refonte livrée : onglet **Révision** (ex-Session) héberge Évaluations/Glossaire/Grammaire ; onglet **Plus** garde Paiements + nouvelle carte **Mon profil** (adresse, date de naissance, parcours scolaire, en plus de prénom/genre déjà existants).
- Suppression complète de l'affichage "prochain cours" côté élève (NextCourseHero, compte à rebours, bouton Rejoindre, cron de rappel + email) — le lien Meet est désormais transmis à la main par le prof via le chat existant. 6 fichiers morts supprimés (`next-course-hero.tsx`, `lib/next-course.ts`, `lib/join-window.ts`, `bookings/*`, cron route).
- Nouveau composant partagé `src/components/menu-card-link.tsx` (déduplique le pattern carte-menu utilisé par Plus et Révision).
- **RPC `update_own_student_info`** (SECURITY DEFINER) : seul chemin d'écriture pour les nouvelles colonnes élève-éditables. Une policy RLS classique aurait été insuffisante car `students` a des colonnes sensibles (`status`, `teacher_id`, `unjustified_absences_count`) et élève/enseignant partagent le même rôle Postgres `authenticated` — impossible de restreindre par colonne via GRANT dans ce cas précis (contrairement à `profiles`, où élève et enseignant n'ont besoin d'éditer que les 2 mêmes colonnes).
- **Trou de sécurité corrigé au passage** : `profiles_update_own` (migration 01, jamais retouchée depuis) autorisait la modification de n'importe quelle colonne de sa propre ligne `profiles`, y compris `role` et `email` — un élève aurait pu s'auto-promouvoir admin via un PATCH REST direct (aucun flux applicatif ne l'utilisait, donc non détecté jusqu'ici). Corrigé par un `GRANT UPDATE` restreint aux colonnes `full_name`/`gender`.
- **MCP Supabase autorisé en cours de session** (le propriétaire a corrigé la connexion connecteur claude.ai) : migration 38 appliquée en base réelle, RPC + correctif RLS prouvés empiriquement (voir Plan ci-dessus, tests A-D), compte de test nettoyé. Boucle CLAUDE.md §4 refermée.
- **Quiz de test "Hhhh"** (grammaire, source du souci signalé par le propriétaire) : déjà supprimé par le propriétaire lui-même via `/teacher/evaluations` avant vérification — confirmé absent en base. Un autre quiz de seed (`"Quiz livre test"`, scope group/book, `teacher_id` null) reste en base, non demandé à retirer — laissé tel quel.
- Domaine réel communiqué par le propriétaire : **tatakalamu.fr** (pas takalamu.com/.fr) — à utiliser pour `EMAIL_FROM` sur Vercel quand Resend sera branché dessus.

---

## Session 23 — Reset comptes de test, compte réel Anthony, mot de passe élève, vérification E2E

> **Statut : TERMINÉ.** Premier vrai élève sur la plateforme.

### Plan
- [x] Suppression des 4 comptes élèves de test (Ali, Omar, Fatima, Aisha) + toutes leurs données liées (cascade `auth.users` → `profiles`/`students`/`lesson_records`/`vocabulary`/`grammar_rules`/`homework`/`payments`/`conversations`/`messages`) + 1 notification orpheline nettoyée manuellement
- [x] **Changement de mot de passe côté élève** (`/dashboard/more`) : action `changePassword` (`supabase.auth.updateUser`) + `ChangePasswordForm` — nécessaire car les comptes élèves sont désormais créés avec un mot de passe fixe communiqué directement par l'enseignant (session 22 : plus de flux d'invitation email systématique)
- [x] **Création du compte réel « Anthony »** (premier vrai élève) : email temporaire `anthony@takalamu.test` (à mettre à jour dès qu'il fournit sa vraie adresse), mot de passe généré aléatoirement, rattaché à Youssef, méthode SQL identique au script `seed_test_accounts.sql` original (`auth.users` + `auth.identities` + `public.students`, trigger `handle_new_user` vérifié pour la création du profil)
- [x] **Tentative de test E2E navigateur réel** (Playwright + Chromium local) : bloquée par la politique réseau du bac à sable (egress `*.supabase.co` refusé, `403` sur le tunnel CONNECT) — confirmé par `curl -v`, déjà documenté en session 1. Nettoyage : serveur de dev arrêté, `.env.local` temporaire supprimé.
- [x] **Vérification de bout en bout par impersonation SQL** (méthode de repli, conforme à CLAUDE.md §4) : `submit_session_record` (présence, leçon, récap, note privée, devoir, 4 mots de vocabulaire, 1 règle de grammaire, référence de fichier) → `generate_individual_quiz` (4 questions mixées AR↔FR, aucune fuite de réponse) → `submit_individual_quiz` (score 2/4 recalculé serveur, review détaillée correcte)
- [x] Nettoyage des données de test générées pour la vérification (lesson_record, vocab, grammar, homework, quiz_attempt) — le vrai premier cours sera saisi par le propriétaire lui-même
- [x] Connexion réelle d'Anthony **confirmée fonctionnelle** par le propriétaire (test hors sandbox)

### Review Session 23
- Base remise à zéro côté élèves : plus aucun compte de test, uniquement les 2 enseignants + Anthony (premier vrai élève).
- **Limite d'environnement confirmée à nouveau** : ce sandbox ne peut pas atteindre `*.supabase.co` en sortant — tout test nécessitant un vrai aller-retour réseau (login via l'app, appels REST Auth) doit passer soit par le MCP Supabase (`execute_sql`, qui lui fonctionne), soit être vérifié par le propriétaire directement sur la vraie app (Vercel). Ne plus retenter de lancer le serveur de dev local contre la prod dans ce sandbox — le proxy le bloque systématiquement.
- La logique métier (RPC, quiz, anti-triche) est prouvée saine par impersonation SQL — c'est la méthode fiable pour ce type de vérification ici.
- **TODO connu** : remplacer l'email temporaire `anthony@takalamu.test` par sa vraie adresse dès qu'il la communique.

---

## Session 22 — Pivot modèle de service (Session tab, paiement libre, vitrine dormante)

> **Décisions propriétaire (2026-07-01)**, actées après audit + avis donné :
> - **Onglet réservation → « Session ».** Plus d'auto-réservation élève : le créneau est fixé par le prof (arrangement via chat externe), la page n'affiche que le prochain cours (lien Meet, countdown identique à l'existant, rappel du jour, rappel caméra/posture texte).
> - **Paiement 100 % libre, post-payé, montant variable.** Fin de l'abonnement/formules. Le prof envoie lui-même une demande de paiement (montant + élève au choix) depuis un petit formulaire dans l'app — pas de sollicitation de Claude à chaque fois. Élève garde un historique en lecture seule + bouton PayPal.
> - **Cron de relances mensuelles (session 21) supprimé** : incompatible avec « c'est moi qui décide » (aurait pu emailer automatiquement).
> - **Plus de verrou paiement à la création d'un cours.** Suspension gérée manuellement par le prof (statut existant sur la fiche élève).
> - **Vitrine gardée dormante** (code intact, accessible par URL directe) mais **`/` devient une redirection pure vers `/login`** — aucune page d'accueil publique affichée.
> - **Création de compte élève 100 % manuelle**, indépendante du tunnel d'essai : petit formulaire côté `/teacher/students` (prénom/nom/email/genre), plus de notion de « code d'essai ».

### Plan
- [x] Migration 35 : `notification_type` += `session_reminder`
- [x] Migration 36 : `payments.label` (text, nullable) ; `bookings.reminder_sent` (bool, default false)
- [x] Migration 37 (**faille RLS découverte en test, hors plan initial**) : `bookings_teacher_all` ne vérifiait pas que `student_id` appartient à l'enseignant — corrigé
- [x] `database.types.ts` régénéré (enum + 2 colonnes)
- [x] Suppression code mort self-serve élève : `src/lib/booking.ts`, `dashboard/bookings/booking-slots.tsx`, `dashboard/bookings/actions.ts`
- [x] Création de créneau côté prof : `/teacher/bookings` + `createBookingByTeacher` (aucun verrou paiement, ownership re-vérifiée serveur ET RLS)
- [x] Session tab élève : helper partagé `src/lib/next-course.ts`, page réécrite (`NextCourseHero` inchangé + bandeau « aujourd'hui » Europe/Paris + rappel caméra/posture + état vide adapté)
- [x] `dashboard/page.tsx` (« Cours ») simplifié : historique + stats seulement
- [x] `dashboard-tabs.tsx` : « Réserver » → « Session »
- [x] Cron `/api/cron/session-reminders` (Bearer `CRON_SECRET`, fenêtre Europe/Paris via date-fns-tz) → email + notif + `reminder_sent=true`
- [x] Suppression cron abonnement session 21 (route + `vercel.json`)
- [x] Paiement libre côté prof : `SendPaymentForm` sur `/teacher/payments` + `sendPaymentRequest`
- [x] Paiement élève simplifié : retrait `PaymentRequestForm`/`requestPayment`, affichage préfère `payments.label`
- [x] Création manuelle d'élève : `NewStudentForm` sur `/teacher/students` + `createStudentManually`
- [x] Racine publique → `redirect("/login")`, `testimonials.tsx` supprimé, `/offres` `/essai` `/inscription` intacts et dormants
- [x] Preuves MCP (voir Review) + advisor sécurité = 0 nouveau lint
- [x] Build + tsc + lint verts (mêmes 3 erreurs déjà connues, 0 nouvelle)

### Review Session 22

**État au 2026-07-10 — pivot complet vers un modèle de service à la confiance, réalisé.**

- **Session tab** : plus d'auto-réservation élève. Le prof fixe le créneau (`/teacher/bookings`, formulaire « + Fixer une séance », aucun verrou paiement). L'élève voit sur « Session » : le `NextCourseHero` inchangé (countdown, bouton Rejoindre 3 états), un bandeau « C'est aujourd'hui ! » (calculé en Europe/Paris via `date-fns-tz`, jamais un décalage codé en dur — Principe 7), et un rappel statique caméra/posture. État vide renvoie vers Messages plutôt que vers un self-serve disparu.
- **Rappel du jour** : cron quotidien 06:00 UTC (`session-reminders`), fenêtre calculée en jour calendaire Paris, email Resend + notification cloche + `bookings.reminder_sent` pour dédupliquer — prouvé empiriquement (fenêtre correcte, dédup effective à 0 candidat après passage).
- **Paiement 100 % libre** : plus de formule/abonnement. L'enseignant envoie une demande ad-hoc (montant + libellé libres) depuis `/teacher/payments` — aucune sollicitation de Claude nécessaire à l'usage. L'élève garde un historique en lecture seule + bouton PayPal sur les lignes en attente. Cron de relances automatiques de la session 21 **supprimé** (incompatible avec « c'est moi qui décide »).
- **Création manuelle d'élève** : `/teacher/students`, indépendante du tunnel d'essai (`trial_requests`), réutilise le pattern `inviteUserByEmail` déjà éprouvé. Admin peut assigner à n'importe quel enseignant, un enseignant normal ne peut créer que pour lui-même.
- **Vitrine dormante** : `/` redirige vers `/login`, aucune page d'accueil publique affichée. `/offres`, `/essai`, `/inscription` restent pleinement fonctionnels par URL directe (code intact, juste plus liés depuis nulle part).
- **Faille RLS trouvée et corrigée en cours de route** : la nouvelle capacité « le prof crée directement une réservation » exposait un trou préexistant dans `bookings_teacher_all` — la policy vérifiait `teacher_id = current_teacher_id()` mais jamais que le `student_id` visé appartenait à ce même enseignant. Un enseignant aurait pu créer une réservation pour l'élève d'un collègue en indiquant simplement son propre `teacher_id`. Prouvé exploitable (INSERT réussi), corrigé migration 37 (`WITH CHECK` avec `EXISTS` sur `students`), re-prouvé bloqué (42501) puis re-prouvé que le cas légitime fonctionne toujours.

**Preuves MCP (toutes nettoyées après coup)** :
- Booking cross-teacher avant fix : 1 ligne insérée (faille confirmée) → après fix : 42501 (bloqué)
- Booking légitime (Khadija → sa propre élève Fatima) : succès, `teacher_id`/`student_id` cohérents
- Paiement libre avec `label` custom : insert + lecture conformes
- Fenêtre cron du jour (Europe/Paris → bornes UTC) : capture la bonne réservation ; après `reminder_sent=true`, 0 candidat restant (dédup prouvée)
- Advisor sécurité : 0 nouveau lint (mêmes WARN pré-existants, tous déjà acceptés/documentés)

**Différé / à surveiller** :
- Pas de suspension automatique pour impayés répétés — gérée manuellement par le prof (statut existant sur la fiche élève), décision explicite du propriétaire pour rester simple.
- `/teacher/trials` (backend du tunnel d'essai) laissé tel quel — dormant comme le reste de la vitrine, aucune raison de le retirer.
- Build vert (32 routes), poussé sur `claude/takalamu-platform-dev-46gpjg`.

---

## Session 21 — Paiement PayPal (compte perso, liens PayPal.Me + relances mensuelles)

> **Décision propriétaire (2026-07-01)** : PayPal remplace Revolut pour l'encaissement,
> avec le **compte PayPal personnel** du propriétaire (pas de compte Business), l'argent
> étant ensuite reversé sur Revolut manuellement.
> **Conséquence technique** : pas d'API Orders ni de webhook PayPal (réservés aux comptes
> Business) → flux = liens **PayPal.Me à montant exact** + **confirmation manuelle** par
> l'enseignant dans l'app (bouton « Confirmer » existant). Modèle validé : 1er paiement
> immédiat même en 12×, puis **email automatique de relance** à chaque échéance mensuelle.
> Design `/inscription` : à faire APRÈS cette phase, séparément (demande propriétaire).

### Plan
- [x] `src/lib/paypal.ts` : `paypalMeUrl(amountCents)` depuis `PAYPAL_ME_USERNAME` (guard si absent)
- [x] `src/lib/resend.ts` : `sendPaymentLink()` (montant, référence, lien PayPal, échéance)
- [x] `/inscription` : `createEnrollment` ne tente plus Revolut → génère réf `TK-…` + lien PayPal.Me ; écran `PayScreen` = bouton « Payer X € via PayPal » + consigne référence dans la note ; email envoyé au prospect avec le même lien ; validation serveur du plan ajoutée (avant, une valeur arbitraire passait pour « hourly »)
- [x] `inviteStudent` : si `chosen_plan` présent, crée la ligne `payments` (status `paid`, montant 1er versement, référence, `period` = mois courant) — l'enseignant n'invite qu'après avoir vu l'argent arriver sur PayPal
- [x] Cron quotidien Vercel `/api/cron/payment-reminders` (Bearer `CRON_SECRET`) : ancre = 1er versement payé, intervalle = 12/nb versements mois (12x→1, 3x→4, 2x→6) ; à échéance → ligne pending (dédup par `period` YYYY-MM) + email PayPal.Me + notif in-app
- [x] `vercel.json` : cron 08:00 UTC quotidien
- [x] `/dashboard/payments` : bouton « Payer X € via PayPal » + rappel de référence sur les lignes pending
- [x] `.env.example` : `PAYPAL_ME_USERNAME`, `CRON_SECRET` (Revolut marqué DORMANT)
- [x] Build vert + tsc clean + push

### À faire côté propriétaire (hors code)
- [ ] Renseigner `PAYPAL_ME_USERNAME` dans Vercel (pseudo paypal.me du compte perso)
- [ ] Générer et renseigner `CRON_SECRET` dans Vercel (`openssl rand -hex 32`)
- [ ] Toujours en attente : domaine OVH → Resend → `EMAIL_FROM` (sans ça, les emails partent de onboarding@resend.dev, tests uniquement)

### Différé / notes
- Suspension automatique si échéance impayée après N jours (règle §8.6) : le cron pourrait la déclencher — période de grâce à décider par le propriétaire. Pour l'instant suspension manuelle (fiche élève).
- ⚠️ Mise en garde transmise au propriétaire : encaisser une activité commerciale régulière sur un compte PayPal perso = risque de limitation du compte par PayPal (ToS). Assumé à cette échelle.

### Suite de session (2026-07-01) — demandes propriétaire
- [x] **Visio : Google Meet au lieu de Zoom** (décision propriétaire — Zoom gratuit coupe à 45 min ; Meet gratuit ne coupe pas en 1-à-1). Le cahier des charges prévoyait déjà « Zoom / Google Meet » pour l'individuel. Changement purement cosmétique + suppression de variables mortes : libellés enseignant (« Pas de lien Google Meet », placeholder `meet.google.com`), textes vitrine, commentaires `join-window.ts`, bloc `ZOOM_*` de `.env.example` retiré (jamais câblé — Meet = lien collé à la main, aucune API). Colonne `zoom_link` conservée en base (interne, invisible — même logique que `revolut_reference`). Mécanisme inchangé : le prof colle le lien, l'élève rejoint via le bouton fenêtré (−10 min / +10 min).
- [x] **Code Revolut SUPPRIMÉ** (décision propriétaire — plus de mode dormant) : `revolut.ts`, webhook `/api/webhooks/revolut`, section `.env.example`, 4 mentions texte/commentaires mises à jour. Les colonnes `revolut_reference` / `revolut_order_id` restent en base comme référence de paiement générique (renommer = migration sans valeur).
- [x] **Design system appliqué à `/inscription`** : fond transparent (Warp visible), `Card` = bordure verte 1.5px + surpiqûre dashed −7px, boutons pleins verts = surpiqûre blanche −4px (style partagé `primaryBtnStyle`), boîte de référence TK = surpiqûre verte −5px, bouton PayPal = surpiqûre blanche. Cohérent avec `/essai` et `/offres`.
- [x] Build vert + tsc clean + push.

---

## Session 20 — Revue complète du code + simplifications

> **Statut : TERMINÉ.** Revue de l'intégralité de `src/` (110 fichiers) sur branche dupliquée de `main`.

### Plan
- [x] Lire tout le code applicatif (lib, public, dashboard, teacher, composants, webhook, migrations concernées)
- [x] **Bug corrigé — anti-double-booking essai** : `requestTrial` faisait un SELECT direct sur `trial_requests` avec le client anon ; aucune policy SELECT anon n'existe → le contrôle renvoyait toujours « libre » (protection uniquement visuelle). Remplacé par la RPC existante `get_trial_taken_slots` (SECURITY DEFINER, grantée anon).
- [x] Dépendances mortes retirées : `three`, `@react-three/fiber`, `@types/three` (résidus de la tentative Three.js abandonnée en session 19)
- [x] `revolut.ts` : `require("crypto")` → import top-level (erreur lint)
- [x] `drawer-nav.tsx` : `useRouter` importé/instancié jamais utilisé — retiré
- [x] `inscription/funnel.tsx` : prop `onSuccess` jamais appelée, état `codeInput` jamais lu, prop `prospect` inutilisée (`void prospect`) — retirés
- [x] `inscription/actions.ts` : variables `fullName`/`firstName`/`lastName` inutilisées — retirées
- [x] `page.tsx` (home) : fragment sans `key` dans la boucle STEPS (warning React) → `<Fragment key>` ; `idx` inutilisé retiré
- [x] `layout.tsx` : poids Outfit **600** utilisé (notes session 18) mais non chargé — ajouté
- [x] `eslint.config.mjs` : dossier `design/**` (handoff statique) exclu du lint
- [x] Lint : 36 → 21 problèmes (6 → 3 erreurs) ; build vert

### Restes assumés (pas des bugs)
- 3 erreurs lint `react-hooks/set-state-in-effect` (join-button, next-course-hero, drawer-nav) : pattern intentionnel d'init d'horloge côté client (anti-hydration-mismatch) et fermeture du drawer au changement de route. Ne pas « corriger » sans re-tester l'hydration.
- 18 warnings `_prev`/`_formData` unused : signature imposée par `useActionState`.

### Décisions propriétaire (2026-07-01) + exécution
- [x] **ColorTweaker retiré** (accord propriétaire) : import + rendu supprimés de la home, `color-tweaker.tsx` supprimé. Les valeurs par défaut `--site-*` vivent dans `globals.css` — aucun impact visuel.
- [x] **Témoignages placeholder** : le propriétaire les laisse tels quels pour l'instant.
- [x] **Verrou base créneaux d'essai** (accord propriétaire) : migration 34 appliquée — index unique partiel `trial_requests_slot_unique (gender, scheduled_at) WHERE scheduled_at IS NOT NULL AND status <> 'declined'`. `requestTrial` mappe l'erreur 23505 sur le message « créneau vient d'être réservé ». Preuves MCP : insert nominal ✓, doublon même genre = 23505 ✓, même créneau autre genre passe ✓, décliné libère le créneau ✓, données de test nettoyées ✓, advisor 0 nouveau lint ✓.
- [ ] **Factorisation des styles répétés de la vitrine** (carte blanche/verte avec surpiqûre, boutons CTA) en petits composants partagés — zéro delta visuel mais diff étendu. Toujours en attente d'accord.

### Tâches restantes (reprises de la session 19)
- [ ] Page `/inscription` : appliquer design system (cartes + boutons)
- [ ] Domaine OVH → Resend → `EMAIL_FROM=noreply@takalamu.com` (Vercel env vars)
- [ ] Revolut Merchant API keys (après création de l'entité)
- [ ] Bunny Stream : upload vidéos de bienvenue + milestone
- [ ] Zoom : enforcement serveur lien (bouton cesse à H+10 min)

### Review Session 20
- Revue exhaustive : la base est saine — RLS-first respecté partout, server actions correctement gardées (`requireTeacher`/`requireStudent`/`requireAdmin`), aucune règle métier côté client seul, `createAdminClient()` limité aux cas légitimes (invitations auth, webhook, vérif code d'essai).
- Un seul vrai bug trouvé et corrigé (anti-double-booking essai, silencieusement inopérant à cause du deny-by-default RLS). Le reste : code mort et hygiène.
- Build vert (35 routes), poussé sur `claude/takalamu-platform-dev-46gpjg`.

---

## Session 19 — Refonte visuelle vitrine + design system public

> **Statut : TERMINÉ.**

### Plan
- [x] Remplacer badge `ت` par logo oiseau origami (transparent, Pillow)
- [x] Extraire calligraphie "كلموا" → wordmark transparent, placer header/footer/login
- [x] Unifier fond vitrine → blanc (`#ffffff`)
- [x] Cartes : fond blanc + bordure verte `1.5px solid #0F9D6E` (style Izox)
- [x] Fond animé : tenter Three.js (invisible) → CSS blobs (invisible) → `@paper-design/shaders-react` Warp shader en teintes crème ✓
- [x] Surpiqûre (dashed outline inset) sur toutes les cartes blanches (vert) et cartes vertes (blanc)
- [x] Surpiqûre sur tous les boutons (inversée selon la couleur du bouton)
- [x] Ronds étapes avec surpiqûre blanche + connecteurs lacet SVG (`strokeLinecap="round"`)
- [x] Bouton "Mon espace" header → fond sable `#EDE0C0`, sans stitching
- [x] Séparateurs header/footer → `2px solid #0F9D6E`
- [x] Nouvelle calligraphie تكلموا (extraction Pillow, 753×331, transparent)
- [x] VitrineBg déplacé dans public layout (s'applique à toutes les pages publiques)
- [x] Appliquer design system sur `/offres` et `/essai`
- [x] Supprimer carte "Tes données restent chez toi"

### Review Session 19
- **`@paper-design/shaders-react` Warp** : seule solution visible pour le fond animé. CSS `radial-gradient` avec `background-position` animation = invisible. Blobs CSS avec `opacity < 0.12` = invisible sur blanc. Warp WebGL avec couleurs crème opacité élevée = visible et élégant.
- **`ssr: false` en Server Component** : Next.js 16 Turbopack interdit `ssr: false` dans un Server Component. Solution : wrapper `"use client"` qui fait le `dynamic()`. Fichier `vitrine-bg-wrapper.tsx`.
- **`zIndex: -1`** sur le conteneur fixe du shader pour qu'il passe derrière tout le contenu.
- **Surpiqûre** : `outline + outlineOffset` négatif. Moderne, respecte `border-radius`. `-7px` pour les cartes, `-5px` pour les boutons, `-4px` pour les petits boutons.
- **VitrineBg dans le layout** : déplacé de `page.tsx` vers `(public)/layout.tsx` pour couvrir toutes les pages publiques en un seul endroit.
- Build vert, tout pushé sur `main`.

### Tâches restantes (prochaines sessions)
- [ ] Domaine OVH → Resend → `EMAIL_FROM=noreply@takalamu.com` (Vercel env vars)
- [ ] Revolut Merchant API keys (après création de l'entité)
- [ ] Bunny Stream : upload vidéos de bienvenue + milestone
- [ ] Zoom : enforcement serveur lien (bouton cesse à H+5 min)
- [ ] Page `/inscription` : appliquer design system (cartes + boutons)

---

## Session 18 — Corrections visuelles vitrine (polices, boutons, tweaker couleurs)

> **Statut : TERMINÉ.**

### Plan
- [x] Retirer textes en orange (eyebrows, sous-titres, mentions inutiles) signalés en screenshot
- [x] Refonte contenus homepage : titres centrés, dernier mot en vert (`GreenLast`), phases, étapes, features, engagement, CTA
- [x] Supprimer page `/enseignants` + retirer nav/footer links
- [x] Ajouter `ColorTweaker` : panel flottant 🎨 temps réel (fond / texte / accent + slider tailles titres)
- [x] Correctif titres phases mobile : `clamp(13px, 3.8vw, 18px)` + `whitespace-nowrap`
- [x] Audit code mort : retirer `type` field inutilisé du tweaker, ajouter `aria-hidden` décoratifs
- [x] Notes italiques → Outfit Semi-Bold sans italique (après phases + après engagement)
- [x] Boutons CTA : uniformiser largeur (wrapper `maxWidth: 360` + `w-full`) et padding identique (`13px 24px`) + `borderWidth: 2` sur le secondaire pour équilibrer l'épaisseur visuelle

### Review Session 18
- **ColorTweaker** : CSS custom props sur `:root` → reflet instantané sans re-render. Variables `--site-bg/title/accent/h1-size/h2-size` utilisées dans tous les styles inline de la page.
- **GreenLast** : composant minimal, split sur le dernier espace, span vert. Aucune librairie.
- **Boutons CTA égalisés** : les deux boutons partagent désormais `w-full` dans un wrapper `maxWidth: 360`, même padding, même font-size (16px), `borderWidth: 2` sur l'outline pour que l'épaisseur visuelle égale le bouton plein.
- **Phase card titles** : `clamp()` évite le retour à la ligne sur mobile sans truncation artificielle.
- Build vert, pushé sur `claude/takalamu-setup-zun4ou`.

---

## Session 17 — Corrections vitrine (genre profs, fusion présentation, tunnel s'abonner)

> **Statut : TERMINÉ.** Demandes propriétaire (screens fournis).

### Plan
- [x] **Bug genre profs** (`/enseignants`) : cause racine = anon ne peut pas lire `profiles.gender` (RLS deny-by-default) → jointure null → fallback "Cours hommes" pour tous. Fix = RPC `get_public_teachers()` SECURITY DEFINER projetant `id, display_name, bio, gender` (migration 33). Pas d'ouverture de `profiles` à anon. Prouvé en anon : Youssef=m, Khadija=f.
- [x] **Retirer la page `/cours-arabe`** + intégrer ses 6 features directement en page d'accueil. Retirer le bouton "En savoir plus" (hero + carte produit).
- [x] **Ajouter bouton "S'abonner"** en page d'accueil sous "Réserver cours d'essai" (hero + CTA bas) → `/offres`.
- [x] **Cartes `/offres`** : pointent vers `/inscription?offre=annuel|heure`, libellé bouton → "S'abonner →".
- [x] **Funnel `/inscription`** : lit `?offre=` (server page → prop `initialPlan`) et pré-sélectionne le plan (annuel → "1x", heure → "hourly").
- [x] **Retirer accès `/inscription` de la nav** : bouton "J'ai un code" (header) + lien "Inscription" (footer) supprimés. Page accessible uniquement via les cartes tarif.
- [x] **Nettoyer nav** : liens "Cours d'arabe" (header + footer) retirés.
- [x] Build vert (35 routes, /cours-arabe disparue).

### Review Session 17
- **Cause racine du bug genre** identifiée et corrigée à la source (RLS, pas patch d'affichage) : RPC SECURITY DEFINER `get_public_teachers()` — même pattern que les autres RPC anon du projet, auto-gardé (projette uniquement les 4 champs vitrine). Advisor : même WARN accepté que les RPC existantes, 0 nouveau lint structurel.
- **Vitrine simplifiée** : `/cours-arabe` supprimée, ses 6 features remontées en page d'accueil. Plus aucun lien orphelin (grep `cours-arabe` = 0 hors historique todo).
- **Parcours de vente clarifié** : essai (gratuit) et abonnement (avec code) bien séparés. "S'abonner" présent en home (hero + CTA) et sur chaque carte tarif → `/inscription` avec plan pré-sélectionné. `/inscription` retiré de la nav publique.

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

---

## Session 30 (suite 5) — Nom de cours personnalisé (remplace « Cours N »)

Demande propriétaire : remplacer l'affichage auto "Cours 1", "Cours 2"… (calculé
par `groupByLesson` selon la date) par un nom que l'enseignant tape lui-même dans
la fiche de fin de cours, **obligatoire à chaque nouvelle fiche**. Les séances déjà
existantes (déjà affichées "Cours 1"/"Cours 2") gardent leur numérotation
automatique — pas de backfill, l'enseignant les renommera à la main via "Modifier"
s'il le souhaite.

- [x] Migration 45 : colonne `lesson_records.custom_title text` (nullable, pas de
      backfill) + `submit_session_record`/`update_session_record` étendues avec
      `p_custom_title` **obligatoire côté serveur** (RAISE EXCEPTION si vide, pas
      seulement un `required` HTML)
- [x] Champ "Nom du cours" ajouté dans `session-form.tsx` (création) et
      `edit-session-form.tsx` (édition), positionné entre "Date de la séance" et
      "Récap public" comme demandé
- [x] `groupByLesson` : nouveau champ `customTitle` optionnel, prime sur
      `Cours ${idx+1}` quand renseigné (fallback conservé pour les anciennes
      séances)
- [x] Tous les affichages "Cours N" mis à jour pour préférer `custom_title` :
      dashboard élève (historique + détail séance), fiche élève côté enseignant
      (historique + accordéons vocab/grammaire/formulations), détail séance
      enseignant (nouveau sous-titre date), filtre "cours" du quiz (évaluations)
- [x] `database.types.ts` : édition ciblée (vérifiée identique à
      `generate_typescript_types` après coup)
- [x] Testé via MCP (impersonation, transaction ROLLBACK) : titre vide rejeté à
      la création ET à la modification, titre trimé correctement, enseignante
      Khadija bloquée sur une séance de l'élève de Jefferson, renommage légitime
      fonctionnel
- [x] `npm run build` + `npm run lint` : verts (seule erreur = `drawer-nav.tsx`,
      pré-existante, déjà documentée)
- [x] Test manuel du propriétaire sur la preview → validé
- [x] Déployé : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- L'enseignant tape désormais un nom de cours obligatoire à chaque fiche de fin
  de cours (création ET édition), affiché à la place de "Cours N" partout où ça
  apparaissait. Les anciennes séances gardent leur numérotation automatique
  (pas de backfill, renommage manuel possible via "Modifier").
- **Déployé en production** avec la suite 6 (correctif grammaire) et la suite 4
  (Formulations), après validation manuelle du propriétaire sur la preview.
