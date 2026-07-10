# Lessons

## Session 28 (2026-07-10) — Branche stale + retrait vidéos + domaine tatakalamu.fr

### Décisions
- **Branche de session stale, encore une fois** (déjà rencontré en session 24, cf. plus bas) : `claude/takalamu-development-3bqly8` forkait avant la session 12, donc avant tout le pivot de service et 93 commits de travail. Réinitialisée sur `origin/main` avec `git checkout -B claude/takalamu-development-3bqly8 origin/main`, puis les 2 fichiers modifiés (CLAUDE.md, .env.example) réappliqués à la main sur la base fraîche. Aucune perte : les 14 commits propres à l'ancienne branche dataient tous d'avant le pivot (Bloc 3/4/5/6, quiz Q1, homework D1/D2 — versions pré-pivot, remplacées depuis par des implémentations différentes dans `main`). **Règle à systématiser (déjà notée en session 24, visiblement pas encore automatique)** : `git merge-base HEAD origin/main` + compter les commits `HEAD..origin/main` **avant** de commencer tout travail, pas seulement quand `tasks/todo.md` semble en retard — ici le todo.md de la branche stale ne montrait pas le retard aussi clairement qu'en session 24 car le propriétaire a commencé par une tâche indépendante (retrait vidéos + domaine) qui n'a pas touché aux fichiers produit.
- **Vidéos définitivement hors périmètre** (décision propriétaire, pas un report). `CLAUDE.md` réécrit : plus de mention Bunny Stream, §7.8 "Système de vidéos" supprimé, sous-sections renumérotées. Rien n'était câblé côté app.
- **Suppression DB différée** : nécessite le MCP Supabase, non autorisé dans cette session (OAuth interactif requis). Reporté.
- **Domaine tatakalamu.fr branché en direct avec le propriétaire (non-technique)**, guidage écran-par-écran via captures :
  - Le MCP Vercel n'a **aucun outil** pour ajouter un domaine ou poser une variable d'env (lecture seule sur ces aspects) — tout s'est fait via l'app mobile Vercel + OVH par le propriétaire, moi en copilote.
  - Piège OVH : le domaine avait une redirection par défaut (A + AAAA + TXT `"3|welcome"` sur `www`, TXT `"1|www.tatakalamu.fr"` sur la racine) posée automatiquement à l'achat. Un CNAME ne peut pas coexister avec d'autres types sur le même sous-domaine (erreur explicite d'OVH) → il a fallu supprimer l'A, l'AAAA **et** le TXT sur `www` avant que le CNAME vers `vercel-dns-017.com` passe. La suppression via l'UI OVH mobile n'est pas toujours immédiatement effective : un retry après ~1 min a suffi.
  - Vercel donne désormais des IP/CNAME "nouvelle génération" (`216.198.79.1` pour l'A racine, `<hash>.vercel-dns-0XX.com` pour le CNAME `www`) plutôt que les anciens `76.76.21.21`/`cname.vercel-dns.com` — les deux marchent mais Vercel recommande les nouveaux.
  - Confirmé via `list_deployments` (Vercel) : la Production suit bien la branche `main` (dernier déploiement prod = commit `main`, alias `takalamu-git-main-...vercel.app`, mappé sur `takalamu.vercel.app` + désormais `tatakalamu.fr`/`www.tatakalamu.fr`, tous trois "Valid Configuration").
  - **Le propriétaire n'est pas technique** : préférer un guidage à la question fermée ("clique sur X", "dis-moi ce que tu vois") plutôt que de lister toutes les étapes d'un coup ou d'utiliser du jargon (CNAME/propagation/SSL expliqués en une phrase simple à chaque fois qu'ils apparaissent). Une première réponse trop dense ("guide complet en 4 étapes avec jargon DNS") a dû être reprise après un retour "je ne sais pas faire ça".

## Session 27 (2026-07-10) — Cours numérotés + revue de tentative + quiz par cours

### Décisions
- **Un paramètre de RPC « défunt » est un piège silencieux, pas un no-op.** `generate_individual_quiz` acceptait `p_lesson_id` qui joignait `lesson_records.lesson_id` — colonne devenue toujours NULL depuis la suppression du choix de leçon (session 25). Le filtre « ne plantait pas » mais ne filtrait jamais rien d'utile. Quand une feature dépend d'un paramètre, vérifier qu'il pointe encore vers une donnée vivante, pas juste qu'il compile. Ici rebranché sur `lesson_record_id` (la vraie clé de séance).
- **Changement de nom de paramètre d'une fonction Postgres = DROP + CREATE obligatoire.** `CREATE OR REPLACE FUNCTION` refuse de renommer un paramètre (« cannot change name of input parameter »). Il faut `DROP FUNCTION ... (signature)` puis recréer, et re-`GRANT EXECUTE`. Penser à mettre à jour tous les appels client (ici `generateQuiz` passait `p_lesson_id`).
- **Ne pas stocker ce qui est reconstituable.** `quiz_attempts.answers` stocke `chosen/correct/direction/is_correct` mais pas le « prompt » (mot demandé). Plutôt que d'élargir le schéma, la page de revue reconstruit le prompt à la lecture : c'est l'opposé de `correct` selon `direction`, récupéré via un lookup `vocabulary` par `vocab_id`. Robuste au cas « mot supprimé depuis » (fallback : afficher réponse/bonne réponse sans prompt).
- **Nettoyage de données de test = one-shot MCP, pas une feature.** Le propriétaire avait fait un quiz de test sur le compte d'Anthony. Supprimé via `execute_sql` (+ le quiz auto-généré orphelin créé par la RPC submit). Pas besoin de construire un bouton « supprimer tentative » pour un cas ponctuel.

## Session 26 (2026-07-10) — Bug "0 séances" + regroupement par cours

### Décisions
- **Toujours vérifier `error` sur les requêtes Supabase qui embarquent des relations (`table(...)` imbriquées).** Le bug "0 séances" venait d'un `const { data } = await supabase...` sans check d'erreur — une requête PostgREST cassée (ambiguïté de relation) échoue silencieusement en `data: null`, indiscernable d'un "vraiment aucune ligne". Coûte cher à diagnostiquer a posteriori, coûte rien à préveni : toujours détruire `{ data, error }` et au minimum `console.error` si `error`.
- **Deux FK entre les deux mêmes tables (sens opposés) = embed PostgREST ambigu.** `lessons.audio_asset_id → audio_assets` et `audio_assets.lesson_id → lessons` coexistent depuis la conception initiale (§5 du cahier des charges) — PostgREST ne peut pas deviner laquelle utiliser pour un embed imbriqué sans le hint `!nom_de_contrainte`. Réflexe à généraliser : avant d'écrire un embed à 2+ niveaux, vérifier dans `database.types.ts` → `Relationships` s'il existe plus d'une FK entre les tables concernées.
- **Limite d'environnement confirmée à nouveau, sur un nouveau type de vérification** : `execute_sql` (MCP Supabase) exécute du SQL brut, pas des requêtes PostgREST — il ne peut donc pas reproduire une erreur d'ambiguïté d'embed (qui est une erreur de la couche PostgREST, pas de Postgres lui-même). Le fix a été validé par raisonnement sur le schéma (nom exact de la contrainte `lessons_audio_asset_fk` tiré de `database.types.ts`) et par preuve indirecte (données + RLS confirmées correctes en dessous), mais pas par un appel REST réel. À vérifier par le propriétaire sur l'app déployée.
- **Composant `AccordionGroup` + utilitaire `groupByLesson`** : pattern réutilisable dès qu'une future liste doit se regrouper par séance (déjà utilisé 2x ce jour — vocabulaire et grammaire élève — donc extraction justifiée, pas prématurée).

## Session 25 (2026-07-10) — Photos de profil + nettoyage nav + suppression scheduling/essai

### Décisions
- **Vérifier l'usage réel avant de couper une fonctionnalité, pas juste ses dépendances de code.** Avant de supprimer `bookings`/`teacher_availability`/`trial_requests`, `select count(*)` sur chacune : les 3 étaient vides. Ça a transformé une décision risquée ("est-ce qu'on perd des données ?") en suppression sans arrière-pensée. Réflexe à généraliser : compter avant de couper, pas seulement grep le code.
- **`generate_typescript_types` (MCP) plutôt qu'édition manuelle pour un gros changement de schéma.** Session 24 éditait `database.types.ts` à la main (ciblé, un seul RPC). Ici (3 tables + 2 enums + 4 fonctions supprimées, 1 colonne ajoutée), régénérer le fichier entier via le MCP est plus sûr qu'un montage manuel — élimine tout risque de type orphelin oublié.
- **Colonne partagée `profiles.avatar_url` plutôt qu'une colonne par table (`students.avatar_url` + `teachers.avatar_url`).** Élève et enseignant ont tous deux une ligne `profiles` ; une seule colonne + un seul bucket + un seul composant `AvatarUpload` couvrent les deux rôles sans duplication. Le dossier Storage est scopé par `auth.uid()` (= `profiles.id`), pas par `student_id`/`teacher_id`.
- **Cascade d'une suppression de "tab"** : retirer un onglet de nav n'est jamais neutre si la feature est consommée ailleurs. `Réservations` alimentait 2 sections du Cockpit + toute la page "Préparer le cours" — la suppression du tab sans traiter ces 3 consommateurs aurait laissé des blocs UI en permanence vides. Toujours grep tous les consommateurs d'une table avant de couper son point d'entrée UI, pas seulement supprimer la route.
- **Root cause du "tunnel public dormant"** : `/essai` dépendait de `teacher_availability` (RPC `get_teacher_availability_by_gender`) pour proposer des créneaux. Supprimer `teacher_availability` sans supprimer `/essai` aurait laissé une page publique qui plante silencieusement. Décision : retirer tout le funnel (`/essai`, `/offres`, `/inscription`) d'un coup plutôt que de patcher `/essai` pour qu'il survive sans dispos — cohérent avec le principe "cause racine, pas de patch".

### Pièges
- **`storage.objects` a un trigger `protect_delete()`** qui bloque tout `DELETE` direct, même depuis une session privilégiée MCP — erreur `42501` avec message explicite. Contournement légitime (pas un hack) : `select set_config('storage.allow_delete_query', 'true', false);` avant le `DELETE`, dans le même appel `execute_sql`. Nécessaire pour nettoyer les objets de test après une preuve RLS sur un bucket Storage.
- **Suppression de route group `(public)`** : si une seule page du groupe doit survivre (ici `page.tsx` → redirect `/login`), la sortir du groupe vers `src/app/page.tsx` top-level plutôt que de garder un `(public)/layout.tsx` désormais inutile pour une seule route.

## Session 24 (2026-07-10) — Onglet Révision + profil élève + correctif RLS profiles

### Décisions
- **Branche de session stale, non-ancêtre de `main`** : la branche assignée pour cette session forkait avant la session 12 (10+ sessions manquantes : quiz, homework, pivot service, PayPal, Meet…). `git merge-base --is-ancestor` dans les deux sens a confirmé la divergence avant tout travail. Réinitialisée sur `origin/main` (`git checkout -B <branche> origin/main`) puis repoussée — aucune perte, ses 13 commits étaient déjà dans `main` sous d'autres hash. **Réflexe à garder** : toujours vérifier `git merge-base --is-ancestor HEAD origin/main` en tout début de session avant de lire `tasks/todo.md` — un todo.md qui semble "en retard" par rapport au résumé donné par l'utilisateur est un signal fort de branche périmée, pas d'un todo.md mal tenu.
- **`authenticated` est un rôle Postgres partagé entre élève ET enseignant** (différenciation uniquement via JWT claims + RLS, pas via rôle DB séparé). Conséquence pratique : un `GRANT UPDATE (colonnes...)` restreint par colonne s'applique à TOUT le monde sous ce rôle — utilisable pour `profiles` (élève et enseignant n'éditent que full_name/gender de toute façon) mais **inutilisable** pour `students` (l'enseignant doit pouvoir écrire `status`/`teacher_id`/absences, l'élève jamais). Pour ce 2ᵉ cas, seule une RPC `SECURITY DEFINER` avec vérification explicite d'appartenance permet de restreindre les colonnes par *type d'appelant* plutôt que par rôle DB.
- **Pattern RPC self-service élève** : `update_own_student_info(...)` suit le même moule que `confirm_payment`/`get_teacher_booked_slots`/`get_public_teachers` (SECURITY DEFINER, `search_path=''`, objets qualifiés `public.`, `grant execute ... to authenticated`). Réutilisable pour toute future feature "l'élève édite un sous-ensemble de champs sur une table qui a aussi des colonnes sensibles".
- **Composant partagé extrait après le 2ᵉ usage identique** : `MenuCardLink` créé quand le pattern "carte-lien avec icône" s'est retrouvé dans 2 pages (Plus + Révision) suite au déplacement de contenu — pas avant, conforme au principe anti-sur-ingénierie.

### Pièges / trouvailles
- **Trou RLS historique découvert par lecture, pas par test** : `profiles_update_own` (migration 01, jamais retouchée) n'avait aucune restriction de colonne — un élève pouvait en théorie s'auto-promouvoir `role=admin` via un PATCH REST direct sur sa propre ligne `profiles`. Passé inaperçu car aucun flux applicatif ne fait `.from("profiles").update(...)` côté client (vérifié par grep avant de corriger). Le correctif (`revoke update ... ; grant update (full_name, gender) ...`) est sans risque de régression justement parce qu'aucun code ne dépendait du comportement large. **Leçon générale** : quand une nouvelle feature touche une policy RLS existante, relire toute la policy (pas seulement l'ajout), pas seulement la partie qu'on modifie.
- **Session bloquée puis débloquée sur les preuves empiriques MCP** : le connecteur Supabase nécessite une autorisation OAuth qui ne peut pas se déclencher en session non-interactive. Le propriétaire a d'abord autorisé une **intégration Vercel-Supabase** (org visible `vercel_icfg_...`, `list_projects` vide, accès direct au projet réel refusé "permission denied") — ce n'est PAS la même chose qu'une connexion Supabase directe. Après re-config côté propriétaire, `list_projects` a vu le vrai projet `takalamu`. **Leçon générale** : si le connecteur Supabase répond mais `list_projects` renvoie `[]` ou refuse l'accès au project_id connu, ce n'est pas un problème d'autorisation générique — c'est probablement le mauvais chemin de connexion (Vercel-managed vs compte Supabase direct). Vérifier avec `list_organizations` : un slug `vercel_icfg_...` est le signal.
- Migration 38 appliquée + RPC/RLS prouvées une fois le bon accès obtenu (voir todo.md session 24). CLAUDE.md §4 respecté in extremis dans la même session plutôt que reporté indéfiniment.

## Session 23 (2026-07-10) — Reset comptes, compte réel Anthony, mot de passe élève, E2E

### Décisions

- **Comptes élèves désormais créés avec mot de passe fixe communiqué directement par l'enseignant** (plus de flux d'invitation email systématique — cohérent avec le pivot bouche-à-oreille de la session 22). Conséquence directe : il fallait un moyen pour l'élève de changer ce mot de passe une fois connecté — construit dans la foulée (`supabase.auth.updateUser()` côté serveur, aucun privilège admin requis, la session courante suffit).
- **Création de compte réel via SQL direct (`crypt()` + `gen_salt('bf')`) plutôt que `inviteUserByEmail`.** Choisi pour donner un accès immédiat (mot de passe fixe connu tout de suite) plutôt que de dépendre de la délivrabilité d'un email d'invitation Supabase Auth (SMTP par défaut, non configuré avec un domaine vérifié). Méthode identique à `seed_test_accounts.sql`, donc déjà « éprouvée » sur le papier — mais voir piège ci-dessous.
- **Suppression complète des comptes de test avant le premier vrai élève.** Propre : `DELETE FROM auth.users` cascade correctement à travers tout le schéma (profils, students, lesson_records, vocabulary, grammar_rules, homework, payments, conversations, messages) — seule une notification a dû être nettoyée manuellement (son `payload.conversation_id` n'est pas une FK, donc pas de cascade sur une donnée JSON qui référence un id supprimé ailleurs — à garder en tête si d'autres tables stockent des références jsonb non-FK).

### Pièges

- **« Vérifié via `crypt()` en SQL » ≠ « le login fonctionne réellement ».** Les comptes de test (session 1) étaient documentés comme `password_ok=true`, mais cette vérification ne faisait que comparer le hash en SQL — jamais un vrai appel à `supabase.auth.signInWithPassword()`. En tentant un test E2E réel cette session, la connexion a échoué avec « Identifiants invalides » — panique de courte durée jusqu'à comprendre que c'est le **réseau du sandbox qui bloque `*.supabase.co`** (confirmé par `curl -v` : `403` sur le tunnel `CONNECT`), pas un problème de compte. **Leçon** : ne jamais interpréter un message d'erreur générique de l'app (« Identifiants invalides », qui `catch`-all toute erreur de `signInWithPassword`) comme une preuve du contenu réel de l'erreur — toujours vérifier la couche réseau en premier avec un test isolé (`curl -v` direct) avant de soupçonner les données.
- **Ce sandbox ne peut PAS lancer le serveur de dev contre la vraie base Supabase pour un test navigateur.** `chromium-cli` n'est pas installé dans cet environnement (malgré la mention dans le skill `run`) ; Playwright global existe (`/opt/node22/lib/node_modules/playwright`, Chromium binaire `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`) et peut piloter un navigateur — mais ça ne sert à rien ici puisque le réseau vers Supabase est bloqué. **Ne plus retenter cette approche** : pour toute vérification de logique métier, utiliser directement le MCP Supabase (`execute_sql` avec impersonation de rôle) — c'est la seule voie qui fonctionne de façon fiable dans ce sandbox, et elle a largement suffi à prouver tout le flux (RPC, anti-triche du quiz, cascade de suppression).
- **Nettoyer les données de test générées pour une vérification n'est pas optionnel quand un vrai compte est concerné.** Contrairement aux comptes de seed (Ali/Omar/etc., purement fictifs), Anthony est un vrai élève — laisser une fausse leçon/quiz dans son historique après un test de vérification aurait été trompeur pour le propriétaire ET pour l'élève. Toujours nettoyer après un test sur un compte réel, même si la vérification elle-même n'était pas destinée à être visible.

## Session 22 (2026-07-10) — Pivot service à la confiance (Session tab, paiement libre, vitrine dormante)

### Décisions

- **Auditer avant de coder sur un pivot métier — payant.** Le propriétaire a explicitement demandé un audit complet avant tout code sur cette session. L'audit (RLS live, schéma live, comptes réels via MCP) a révélé que `prep_notes` existait en base sans migration fichier correspondante (dérive silencieuse) et a permis de dimensionner correctement chaque décision (ex. confirmer que `teacher_availability` est aussi utilisée par le tunnel `/essai` public, donc à ne pas toucher).
- **Une nouvelle capacité d'écriture peut exposer une policy RLS jamais testée en pratique.** `bookings_teacher_all` existait depuis la session 1 mais n'avait jamais servi à un INSERT réel côté teacher (seul le student insérait). Donner au prof la capacité de créer directement une réservation a immédiatement révélé que le `WITH CHECK` ne vérifiait que `teacher_id`, jamais la cohérence `student_id → teacher_id`. **Leçon générale : chaque fois qu'une policy `FOR ALL` déjà en place devient réellement exercée pour la première fois (nouveau bouton, nouvelle action), la re-tester en conditions d'attaque avant de livrer** — une policy « jamais cassée » peut simplement n'avoir jamais été sollicitée.
- **Défense en profondeur : app + RLS, jamais l'un sans l'autre.** L'action serveur `createBookingByTeacher` faisait déjà l'ownership check via un SELECT scopé RLS (`students_select_teacher`) — donc l'app était déjà sûre. Mais la RLS elle-même restait perméable à un appel direct (Postgrest, mauvais futur refactor, bug applicatif). Corrigé au niveau base (migration 37), conformément au Principe 1 de CLAUDE.md — jamais se reposer uniquement sur l'affichage/l'app.
- **Paiement post-payé, montant libre, initié par l'enseignant seul.** Remplace complètement les formules (1x/2x/3x/12x). `payments.label` (texte libre) ajouté pour ne plus mentir sur la nature du paiement (ne plus afficher « Abonnement individuel » pour un paiement ad-hoc). Fallback vers les anciens libellés de plan conservé uniquement pour l'affichage des 3 paiements seed historiques.
- **« Ne pas dépendre de Claude pour une action répétitive. »** Le propriétaire voulait initialement me demander d'envoyer chaque email de paiement manuellement. Recommandation donnée et acceptée : construire un petit formulaire in-app à la place — plus résilient, pas de single point of failure sur la disponibilité d'une session Claude Code.
- **Vitrine « dormante » ≠ vitrine supprimée.** Pattern déjà établi avec Revolut (session 20) et repris ici : le funnel public (`/offres`, `/essai`, `/inscription`, `trial_requests`, `/teacher/trials`) reste intact et fonctionnel par URL directe, seule la racine `/` redirige vers `/login`. Coût de maintenir ≈ nul, coût de reconstruire un jour ≈ élevé.
- **Contenu remplacé (pas dormant) = supprimé, pas commenté.** `booking-slots.tsx`, `dashboard/bookings/actions.ts` (self-serve), `testimonials.tsx`, le cron d'abonnement session 21 : tous supprimés franchement (pas de code mort laissé), car il n'y a aucun scénario où on les rebrancherait tels quels — contrairement à Revolut/vitrine qui pourraient revenir en l'état.
- **Helper partagé dès la 2ᵉ occurrence.** La requête « prochain cours + contexte pédagogique » était dupliquée entre `dashboard/page.tsx` et la nouvelle page Session → extraite dans `src/lib/next-course.ts` avant que les deux ne divergent silencieusement.

### Pièges

- **Réactivation Supabase (pause plan gratuit) : après `restore_project`, le statut passe par `COMING_UP` avant `ACTIVE_HEALTHY`.** Interroger la base pendant `COMING_UP` renvoie des résultats trompeurs (`auth.users` = 0, `relation "profiles" does not exist`) qui ressemblent à une perte de données mais ne le sont pas — toujours attendre `ACTIVE_HEALTHY` avant de tirer une conclusion.
- **`date-fns-tz` v3 : `fromZonedTime`/`formatInTimeZone`**, pas `zonedTimeToUtc` (API v1/v2). Toujours vérifier la version installée avant d'écrire du code fuseau horaire — les noms de fonctions changent entre versions majeures.
- **Prouver une faille RLS avant de la corriger, pas seulement après.** Insérer réellement (dans une transaction `BEGIN...ROLLBACK`) avec le rôle impersonné AVANT le fix pour confirmer que le trou existe vraiment (ici : 1 ligne insérée), puis re-tester après coup pour confirmer le blocage (42501) ET que le cas légitime n'a pas été cassé au passage. Un seul des deux tests ne suffit pas.

## Session 21 (2026-07-01) — Paiement PayPal.Me (compte perso) + relances cron

### Décisions

- **PayPal compte PERSONNEL = pas d'API Orders ni de webhook** (réservés aux comptes Business). Architecture retenue : liens **PayPal.Me à montant exact** (`paypal.me/{user}/{montant}EUR`) + référence `TK-…` que l'élève met dans la note du paiement + **confirmation manuelle** par l'enseignant (`confirm_payment` existant). Aucune surface d'attaque nouvelle : rien à vérifier cryptographiquement, c'est l'humain qui valide.
- **Échéancier sans table dédiée.** Les échéances 2x/3x/12x se déduisent de `payments` : ancre = `created_at` du 1er versement `paid`, intervalle = `12 / installments` mois, prochaine échéance = ancre + (nb payés × intervalle). Dédup des relances par `period` (YYYY-MM) sur la ligne pending créée par le cron. Zéro migration.
- **Vercel Cron + `CRON_SECRET`** : quand la variable d'env existe, Vercel envoie automatiquement `Authorization: Bearer <secret>` sur les routes déclarées dans `vercel.json` → un simple check d'égalité suffit à fermer la route au public.
- **Le 1er paiement est enregistré à l'invitation** (`inviteStudent`) : l'enseignant vérifie l'argent sur PayPal avant de cliquer « Inviter l'élève », le code crée alors la ligne `payments` paid avec le montant du 1er versement + la référence de la demande. Le verrou « pas payé = pas de résa » est satisfait dès l'entrée de l'élève.
- **Revolut conservé mais dormant** (`revolut.ts` + webhook) : si un compte Business existe un jour, on rebranche sans réécrire.

### Pièges

- **Narrowing TS d'un type predicate via variable aliasée** (`const isAnnual = isAnnualPlanKey(x)`) : fragile sur les propriétés d'objet. Appeler le predicate directement dans la condition (`isAnnualPlanKey(plan) ? … : …`) garantit le narrowing.
- **`createEnrollment` acceptait n'importe quelle string comme plan** (tout non-annuel était traité « hourly »). Toute server action qui reçoit un identifiant de plan doit le valider explicitement contre la liste connue.

## Session 20 (2026-07-01) — Revue complète du code

### Décisions

- **Un SELECT côté serveur avec le client anon sur une table deny-by-default ne renvoie jamais d'erreur — juste 0 ligne.** C'est le piège le plus sournois du modèle RLS : le contrôle anti-double-booking de `requestTrial` « fonctionnait » (aucune erreur, tests passants) mais ne détectait jamais rien. Règle : toute vérification serveur faite pour un utilisateur anon DOIT passer par une RPC SECURITY DEFINER (ou l'admin client) — jamais par un SELECT direct. Auditer ce pattern à chaque nouvelle action anon.
- **Après un pivot technique, purger les dépendances de la piste abandonnée.** `three` + `@react-three/fiber` + `@types/three` sont restés dans package.json après l'abandon de Three.js (session 19) au profit de `@paper-design/shaders-react`. Vérifier `package.json` en fin de session quand une approche a été essayée puis remplacée.
- **`next/font` ne charge que les poids déclarés.** Utiliser `fontWeight: 600` alors que la police est chargée en `["700","800","900"]` produit un faux gras synthétisé par le navigateur, silencieusement. Toute nouvelle valeur de `fontWeight` doit exister dans la déclaration du layout.
- **Les erreurs `react-hooks/set-state-in-effect` ne sont pas toutes à corriger.** L'init d'horloge client (`setNow(new Date())` dans un effect au montage) est le pattern anti-hydration-mismatch documenté ici depuis la refonte UI. Restructurer pour satisfaire le linter réintroduirait le crash d'hydration React 19. Les laisser, les documenter.

### Pièges

- **`.map()` retournant un fragment `<>...</>` : la key doit être sur le fragment**, pas sur le premier enfant. `<Fragment key={...}>` (import explicite) est obligatoire — un fragment court `<>` ne peut pas porter de key. Le warning React n'apparaît qu'à l'exécution, pas au build.
- **Le dossier `design/` (handoff HTML/JS statique) était linté** et générait des erreurs parasites dans le rapport. `globalIgnores` dans `eslint.config.mjs` règle ça proprement.

## Session 19 (2026-06-26) — Refonte visuelle vitrine + design system public

### Décisions

- **Fond animé : `@paper-design/shaders-react` Warp, pas CSS.** Les `radial-gradient` avec `background-position` animation ne produisent aucun effet visible. Les blobs CSS (`position: fixed`, `filter: blur`, `opacity < 0.15`) sont invisibles sur fond blanc. Le Warp WebGL avec couleurs crème est la seule solution qui fonctionne réellement.
- **`zIndex: -1` sur le conteneur fixe**, pas `0`. Avec `zIndex: 0`, le contenu de la page peut passer derrière selon le contexte d'empilement. `-1` garantit que le shader est toujours derrière tout.
- **Wrapper `"use client"` + `dynamic(..., { ssr: false })`** obligatoire pour WebGL en Next.js 16 App Router. Le Server Component parent ne peut pas faire le `dynamic()` lui-même.
- **VitrineBg dans le layout public** (pas dans chaque page). Une seule instance `position: fixed` couvre toutes les pages sous `(public)/layout.tsx`. Évite la duplication et l'apparition/disparition du fond à chaque navigation.
- **Surpiqûre = `outline` + `outlineOffset` négatif**, pas de pseudo-élément. `outline: "1.5px dashed #0F9D6E"; outlineOffset: "-7px"` crée le trait intérieur en respectant le `border-radius` dans tous les navigateurs modernes.
- **Couleurs inversées selon le fond** : bouton/carte vert → surpiqûre blanche. Bouton/carte blanc → surpiqûre verte. Règle systématique à appliquer à tous les nouveaux éléments.
- **Connecteurs lacet** : SVG avec `strokeLinecap="round"` et `strokeDasharray="3 7"`. CSS `border-dashed` donne des tirets plats ; le SVG avec `round` donne des points ronds, effet lacet/corde.

### Pièges

- **`replace_all` sur une couleur partagée** : remplacer `#EDE0C0` par `#0F9D6E` a aussi changé le fond du bouton "Mon espace" car la même valeur était utilisée deux fois dans le fichier. Toujours cibler la chaîne de contexte complète, pas juste la couleur.
- **Extraction d'image Pillow sans numpy** : utiliser des boucles Python pures pour trouver la bounding box et rendre les pixels blancs transparents. Le boucle sur chaque pixel est lente mais fonctionne sans dépendances supplémentaires.
- **`border` dans `className` + `style`** : le bouton "Mon espace" avait `className="... border"` (Tailwind) ET `style={{ border: ... }}` (inline). Le style inline écrase Tailwind mais le `className` reste. Toujours supprimer le `border` du className quand le style inline le redéfinit.

---

## Session 18 (2026-06-25) — Corrections visuelles vitrine

### Décisions

- **ColorTweaker : CSS custom props sur `:root` (jamais inline React state propagé en arbre).** Pour permettre des changements couleur/taille en temps réel sans re-render de toute la page, on écrit dans `document.documentElement.style.setProperty("--site-*", val)`. La page consomme ces vars via `var(--site-*)` dans ses `style` inline. Zéro propagation React : une seule mise à jour DOM native.
- **GreenLast helper : split sur le dernier espace, pas de regex.** `title.lastIndexOf(" ")` → `slice(0, idx)` + `slice(idx + 1)`. Simple, robuste, pas de cas limit pour les titres français 2-4 mots.
- **Boutons CTA : wrapper conteneur + `w-full` sur chaque bouton.** Plutôt que de fixer une largeur sur le bouton lui-même (qui casse le responsive), on enveloppe les deux dans `<div style={{ maxWidth: 360 }} className="w-full flex flex-col gap-3">` et chaque bouton prend `w-full`. Le wrapper est `items-center` dans son parent → centré sur desktop, pleine largeur sur mobile.
- **`borderWidth: 2` sur le bouton outline.** Un `border` Tailwind applique `border-width: 1px`. Visuellement, un bouton outline 1 px paraît plus fin qu'un bouton plein de même hauteur. Passer à 2 px équilibre la perception sans changer le padding ni la hauteur.
- **Police des notes secondaires : Outfit Semi-Bold (600) sans italique.** L'italique en gris donne un aspect "disclamer" peu premium. Outfit 600 dans la même couleur muted (#6B6560 / #8B857A) reste subtil mais cohérent avec les sous-titres du design system.

### Pièges

- **`clamp()` + `whitespace-nowrap` pour les titres de phases.** Sur mobile < 360 px, "Phase 3 : Grammaire et expression" déborde si on laisse `font-size` fixe. La combinaison `clamp(13px, 3.8vw, 18px)` + `whitespace-nowrap overflow-hidden text-ellipsis` force tout sur une ligne en réduisant la taille. Sans `whitespace-nowrap`, le `clamp()` ne suffit pas.
- **Ne pas mettre `inline-block` sur un bouton `w-full`.** `Link` rend un `<a>` qui est inline par défaut. `inline-block` + `w-full` → la largeur est 100% du parent inline, pas du conteneur block. Supprimer `inline-block` laisse `w-full` agir correctement (display block).

---

## Session 16 (2026-06-25) — Tunnel essai multi-étapes, code d'essai, tunnel paiement self-serve

### Décisions

- **SECURITY DEFINER pour l'accès anon aux créneaux.** La table `teacher_availability` a une policy `SELECT` pour `authenticated` uniquement. Pour permettre au formulaire d'essai (anon) d'afficher les créneaux, on crée des RPCs SECURITY DEFINER (`get_teacher_availability_by_gender`, `get_trial_taken_slots`) grantées à `anon, authenticated`. Pattern systématique : ne jamais ouvrir la table brute à `anon` → encapsuler dans une RPC avec SECURITY DEFINER qui projette exactement ce qu'on veut exposer.
- **`createAdminClient()` pour la vérification de code côté serveur.** `verifyTrialCode` dans `/inscription/actions.ts` utilise `createAdminClient()` (service_role) car `trial_requests` n'a aucune policy SELECT pour `anon`. Légitime : c'est une server action (jamais côté client), la clé service_role reste serveur-only. Pattern : toujours préférer la RPC SECURITY DEFINER quand l'opération est un SELECT simple ; recourir à `createAdminClient()` uniquement quand la RPC serait disproportionnée ou impossible.
- **Expansion des créneaux UTC en JS.** `teacher_availability` stocke `day_of_week` (0=dim) et `start_time`/`end_time` en UTC. L'expansion sur 35 jours utilise `getUTCDay()` (jamais `getDay()`) pour matcher le jour stocké. Calcul du prochain occurrence : itérer j de 0..34, pour chaque j construire `Date.UTC(year, month, day+j, h, m)`, filtrer par `getUTCDay() === slot.day_of_week`. Anti-doublon par clé UTC ISO.
- **Mode manuel Revolut.** Revolut Merchant API configuré côté code mais clés absentes tant que la société n'est pas créée. Comportement branché : si `REVOLUT_MERCHANT_API_KEY` présent → appel API → URL checkout Revolut. Si absent → génère référence `TK-{randomHex8}`, stocke sur `trial_requests.revolut_order_id`, affiche instructions de virement manuel. Zéro if/else dans l'UI : la logique est dans la server action.
- **`assigned_teacher_id` stocké à la confirmation de l'essai.** Dans `updateTrialStatus` (côté teacher, quand on marque "Essai effectué"), on stocke `assigned_teacher_id = teacher.id`. Le webhook Revolut peut ainsi retrouver le teacher_id sans requête supplémentaire, même semaines plus tard.
- **Resend : lazy singleton + FROM configurable.** `src/lib/resend.ts` : `new Resend(process.env.RESEND_API_KEY)` instantié au module level (singleton sans coût côté client car server-only). `FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev"` permet de tester sans domaine vérifié ; sera mis à jour quand OVH → Resend domain verification sera faite.
- **Code d'essai : `crypto.randomBytes` + alphabet non-ambigu.** `chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"` (sans 0/O/I/1/L/B). 8 chars via `randomBytes(8).map(b => chars[b % chars.length])`. Index unique partiel `WHERE trial_code IS NOT NULL` → collision impossible sans bloquer le schema. Expiration 30 jours.
- **Webhook HMAC-SHA256 Revolut.** Header `Revolut-Signature: v1=<hex>`. Vérification : lire le body en `text()` AVANT `json()` pour avoir la string exacte signée, puis `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`. Une fois confirmé : `inviteUserByEmail` (admin) → INSERT `students` + `payments` → marquer `trial_code_used = true` + `status = converted`.
- **Dédup email au webhook.** Avant `inviteUserByEmail`, lister les users auth (`admin.auth.admin.listUsers()`) et vérifier si l'email existe. Si oui, rattacher la ligne `students` à l'user existant plutôt que de créer un doublon. Pattern nécessaire pour re-soumissions Revolut ou tests répétés.
- **Wizard 3 étapes : wrapper serveur + funnel client.** `page.tsx` (server) exporte uniquement les `metadata` et rend `<Funnel />`. `funnel.tsx` (client) porte tout l'état de l'assistant (étape, données collectées). Server actions dans `actions.ts` séparé. Ce split évite le bug "metadata interdit en client component" tout en gardant le formulaire interactif.

### Pièges

- **`getDay()` vs `getUTCDay()` pour les créneaux.** `teacher_availability.day_of_week` est en UTC (ex. jeudi UTC peut être mercredi soir Paris). Utiliser `getDay()` sur une date JavaScript prend la timezone locale du serveur Vercel (potentiellement Paris, potentiellement UTC). Toujours utiliser `getUTCDay()` pour matcher exactement ce qui est en base.
- **`rawBody` avant `json()` dans le handler webhook.** Si on fait `request.json()` puis essaie de relire le body, le stream est consommé → erreur. Toujours `const rawBody = await request.text(); const payload = JSON.parse(rawBody)` dans l'ordre. Ensuite seulement vérifier la signature.
- **`inviteUserByEmail` dans le webhook = double email.** Supabase envoie un email d'invitation automatiquement. Si le webhook est appelé deux fois (retry Revolut), le second appel sera bloqué par le dédup email → pas de doublon. Mais l'élève reçoit deux emails d'invitation si le retry est très rapide (avant le dédup). Acceptable à cette échelle.
- **`revolut_order_id` = mode manuel reference.** La référence `TK-XXXXXXXX` est stockée dans `trial_requests.revolut_order_id`. En mode Revolut réel, ce champ contiendra l'UUID Revolut. Ne pas mélanger les deux formats dans les requêtes de lookup webhook.
- **`RESEND_API_KEY` ne doit jamais être committé.** Stocker dans `.env.local` (gitignored) et dans Vercel Env Vars. Si jamais committé par erreur : révoquer immédiatement dans le dashboard Resend et générer une nouvelle clé.

---

## Session 15 (2026-06-24) — Vitrine publique + parcours d'essai + paiement révisé

### Décisions

- **Route group `(public)` sans impact URL** : `src/app/(public)/page.tsx` sert bien `/`. Mais `src/app/page.tsx` (ancienne home) DOIT être supprimé — Next.js App Router interdit deux `page.tsx` au même segment, même avec route group. Supprimer l'ancien fichier avant de créer le nouveau.
- **`notify_teachers_by_gender` (RPC SECURITY DEFINER GRANT TO anon)** : permet à une server action publique d'alerter les enseignants du bon genre sans `createAdminClient()`. Pattern : INSERT table (RLS anon allowed) + RPC SECURITY DEFINER pour traverser la barrière RLS en écriture.
- **Migration 28 séparée pour `teachers_public_select`** : politique de lecture publique sur `teachers` nécessaire pour la page `/enseignants` (vitrine). À ajouter dès qu'on crée des pages publiques qui lisent des tables par défaut deny.
- **`pricing.ts` comme source unique** : tous les libellés, montants et calculs passent par `src/lib/pricing.ts`. Évite la duplication entre la vitrine, le formulaire élève, et les server actions. Les types (`PlanKey`, `Plan`) sont définis ici, pas dans les types Supabase.
- **Badge de count dans `DrawerNav`** : la prop `pendingTrials?: number` est fournie par le layout serveur (qui fait le `.count` Supabase). Le composant client `DrawerNav` ne fait que l'afficher conditionnellement sur l'item `/teacher/trials`. Pattern : count serveur → prop → composant client.
- **`inviteStudent` = pattern identique à `inviteTeacher`** : `inviteUserByEmail(role='student', full_name, gender)` → trigger `handle_new_user` crée le profil → on INSERT manuellement la ligne `students` (teacher_id, gender, trial_credit_cents). TOUJOURS vérifier `SUPABASE_SERVICE_ROLE_KEY` en amont.
- **`essai/page.tsx` en "use client"** : le formulaire `/essai` utilise `useActionState` (état React), donc "use client". Impossible d'exporter `metadata` depuis un composant client. La metadata SEO est portée par le layout parent. Pas de problème à ne pas avoir de metadata sur cette page spécifique.

### Pièges

- **`npm run build` échoue si `next` n'est pas installé** → `npm install` d'abord. En environnement remote (CI/container), les `node_modules` peuvent être absents même si `package.json` est là.
- **`Record<PaymentPlan, string>` exhaustif** : dès qu'un nouveau membre est ajouté à l'enum `payment_plan` (ex. `monthly`), TOUTES les pages qui utilisent un `Record<PaymentPlan, string>` doivent être mises à jour. Chercher toutes occurrences de `Record<PaymentPlan` pour ne pas en rater.
- **`useActionState` nécessite "use client"** mais `requestTrial` (server action) reste dans `actions.ts` séparé. La page est client, l'action est serveur. Pattern correct — ne pas mettre "use server" dans le composant client, l'import suffit.

---

## Session 14 (2026-06-24) — Audio assets leçons

### Décisions
- **`createSignedUrls` (pluriel) pour le batch.** La page dashboard élève liste N séances, chacune pouvant avoir un audio. Un appel `createSignedUrls(paths[], ttl)` remplace N appels `createSignedUrl`. Les `item.path` retournés peuvent être `string | null` (type Supabase) → guard `if (item.signedUrl && item.path)` avant `map.set(item.path, item.signedUrl)`.
- **Upload remplace l'ancien asset de façon atomique.** Ordre : upload nouveau → INSERT `audio_assets` → UPDATE `lessons.audio_asset_id` → delete ancien asset + fichier. En cas d'échec entre les deux derniers, l'ancien est perdu mais le nouveau est lié. Acceptable à cette échelle.
- **`ON DELETE SET NULL` sur `lessons.audio_asset_id`** : supprimer la ligne `audio_assets` dissocie automatiquement la leçon. `removeLessonAudio` n'a donc pas besoin de faire le `UPDATE lessons SET audio_asset_id = NULL` explicitement.
- **Section audio séparée du `LessonForm`** : `AudioSection` est un composant client indépendant, rendu sous le formulaire de leçon. Évite d'alourdir le formulaire existant (qui gère déjà `useActionState`) avec un deuxième champ à état complexe.
- **Audio côté élève = lecture seule, bucket-level.** Contrairement aux `homework-submissions` (dossier = student_id), les fichiers audio sont partagés (1 audio par leçon, visible pour tous les élèves de la même leçon). La policy `lesson_audio_student_select` n'a pas besoin de restriction par dossier.

### Pièges
- **`item.path` typé `string | null` dans `createSignedUrls`** — TypeScript refuse `audioUrlMap.set(item.path, ...)` sans le guard `&& item.path`. Le type Supabase est conservateur même si en pratique path n'est jamais null si l'item a un signedUrl.
- **`encType="multipart/form-data"` obligatoire** sur un `<form>` avec `<input type="file">` dans un composant client avec `action={formAction}` (`useActionState`). Sans `encType`, le fichier n'est pas transmis dans le `FormData`.

---

## Session 11 (2026-06-23) — Liste chats enseignant + Storage uploads + Notifications + Admin invite

### Décisions (Bloc 5 — admin invite)
- **`auth.admin.inviteUserByEmail()` = seul usage légitime de `createAdminClient()`.** Créer un compte Supabase Auth + envoyer l'e-mail d'invitation n'a AUCUNE alternative RLS/RPC (on ne peut pas insérer dans `auth.users` ni déclencher l'e-mail depuis une fonction SECURITY DEFINER). Le commentaire de `admin.ts` le prévoit déjà ("création de comptes par l'admin"). Contrairement aux notifications/paiements, ici l'admin client est inévitable.
- **Garde explicite `if (!process.env.SUPABASE_SERVICE_ROLE_KEY)`** avant d'appeler l'admin API → message d'erreur clair au lieu du crash silencieux décrit en sessions 9/10. Transforme le piège récurrent en feedback utilisateur.
- **Le trigger `handle_new_user` fait le travail de création de profil.** En passant `data: { role: 'teacher', full_name, gender }` à `inviteUserByEmail`, ces valeurs deviennent `raw_user_meta_data` → le trigger `on_auth_user_created` crée le profil avec `role=teacher`. Il ne reste qu'à INSERT la ligne `teachers` (le profil n'est pas à créer à la main). Pattern réutilisable pour inviter des élèves.
- **`requireAdmin()` réutilise `homePathForRole()`** pour rediriger proprement (teacher→/teacher, élève→/dashboard) au lieu d'un simple /login.
- **Nav admin-only via prop + filtre** : `NavItem.adminOnly?: boolean` + `NAV_ITEMS.filter(i => !i.adminOnly || isAdmin)`. La prop `isAdmin` vient du layout serveur (`profile?.role === 'admin'`). Garder la logique de rôle côté serveur, le composant client ne fait que filtrer l'affichage.

### Pièges (Bloc 5)
- **Impersonation SQL + table temp** : sous `set_config('role','authenticated')`, le rôle `authenticated` ne peut pas écrire dans une table TEMP créée par `postgres` (permission denied). Solution : capturer le résultat dans une variable PL/pgSQL **pendant** l'impersonation, **remettre** `role=postgres`, **puis** INSERT dans la table de résultats.
- **Preuve RLS d'un INSERT admin sans données valides** : utiliser un `profile_id` factice → si la RLS passe, l'INSERT échoue sur la FK (`teachers_profile_id_fkey`), ce qui PROUVE que la policy `teachers_admin_all` a autorisé l'écriture (l'erreur n'est pas RLS mais FK). Astuce pour tester une policy WITH CHECK sans seed complet.

### Décisions (Blocs 3, 4, 6)
- **Storage RLS via helpers `private.current_teacher_id()` / `private.current_student_id()`** : les policies Storage s'appuient sur les mêmes helpers que les tables Postgres. Teacher=ALL, student=SELECT uniquement sur son dossier (`storage.foldername(name))[1] = student_id`). Cohérent avec le reste du modèle d'accès.
- **Path Storage = `{student_id}/{timestamp}_{nom_nettoyé}`** : le premier segment est le student_id pour que la policy student puisse filtrer via `foldername`. Pas de session_id dans le path pour simplifier (le lien DB → storage_path dans `lesson_records.support_files` fait la jointure).
- **Upload avant la RPC** : les fichiers sont uploadés dans la server action avant d'appeler `submit_session_record`. Si l'upload échoue, on ignore le fichier silencieusement (pas d'erreur bloquante) et on continue. Si la RPC échoue après upload, les fichiers orphelins restent dans le bucket — acceptable à cette échelle.
- **`DROP FUNCTION IF EXISTS` par signature exacte** pour remplacer une fonction avec une nouvelle signature. `CREATE OR REPLACE` seul échoue si plusieurs surcharges coexistent (erreur 42725). Pattern à retenir pour toutes les futures évolutions de RPC.
- **Notification `payment_requested` via client standard (session élève)** : `requestPayment` utilise déjà `createAdminClient()` pour l'INSERT payment (RLS bloque élève). La notification elle, passe par `createClient()` (session élève authentifiée) pour appeler le RPC `insert_notification` SECURITY DEFINER. Les deux clients coexistent dans la même action — pas de problème.
- **Liste chats enseignant** : query avec `messages(...)` embedded, tri JS côté serveur par date du dernier message. Unread count calculé en JS (filtre `sender_id !== userId && !read_at`). Suffisant à cette échelle.

### Pièges
- **`CREATE OR REPLACE FUNCTION` sur une fonction avec plusieurs surcharges existantes** → erreur `42725 function name is not unique`. Résoudre avec `DROP FUNCTION IF EXISTS <sig_exacte>` avant le `CREATE OR REPLACE`. Spécifier tous les types d'argument dans la signature DROP.
- **`git cherry-pick` après merge dans todo.md** : si `tasks/todo.md` a été modifié par le cherry-pick lui-même (Auto-merging), ne pas re-lire le fichier — il a déjà l'état voulu. L'outil Edit détecte le conflit si on tente d'éditer sur l'ancien contenu.



## Session 13 (2026-06-23) — Quiz de grammaire prof→élève (Q2)

### Décisions
- **`quiz_source = 'grammar'` plutôt qu'un nouveau scope.** Le scope `individual` est réutilisé ; seul `source_type` change (`glossary` vs `grammar`). `quizzes.teacher_id` (nullable) identifie l'auteur du quiz pour le filtrage côté élève et la vérification de propriété côté prof. Les quiz `book` continuent via `books.teacher_id` — pas de collision.
- **`get_grammar_quiz_questions` : RPC SECURITY DEFINER pour masquer `correct_answer`.** La RLS `quiz_questions_teacher_all` interdit l'accès direct aux élèves. Le RPC vérifie `student.teacher_id == quiz.teacher_id` (cloisonnement prof/élève), mélange les choix à la volée (insert position aléatoire 1..N+1), retourne `[{ question_id, prompt, choices[] }]` — jamais `correct_answer`.
- **`submit_grammar_quiz` : même anti-triche que Q1.** Relit `correct_answer` depuis la DB pour chaque réponse. Le client envoie `{ question_id, chosen }` — il ne connaît pas les bonnes réponses. Résultat `{ score, total, answers[] }` révèle la bonne réponse post-soumission pour la review pédagogique.
- **CASCADE sur `quiz_questions.quiz_id` et `quiz_attempts.quiz_id`.** ALTER FOREIGN KEY → ON DELETE CASCADE. La suppression d'un quiz depuis la page prof nettoie questions + tentatives automatiquement. Plus sûr qu'une suppression manuelle en ordre dans le server action.
- **Clé `ver` dans l'état `useActionState` pour reset du formulaire.** Incrémenter `state.ver` après succès → `<form key={state.ver}>` → React démonte/remonte le formulaire, effaçant tous les inputs. Plus propre que `formRef.current.reset()` et évite un `useEffect`.
- **Grammar quizzes visibles à tous les élèves du prof sans assignation.** Pas de notion d'assignation individuelle (contrairement aux milestone videos). Visible dès création ; le bouton "Notifier mes élèves" envoie `eval_due` aux élèves actifs — notification optionnelle, pas un verrou d'accès.
- **Historique grammar séparé du historique vocab** sur la page `/dashboard/evaluations`. Deux sections distinctes, chacune avec son propre historique de tentatives filtré par `source_type`. `quizzes.title` est affiché dans l'historique grammaire (le vocab n'a pas de titre lisible).

### Pièges
- **`array_length(arr, 1)` retourne NULL sur un tableau vide** (pas 0). Guard `IF array_length(...) IS NULL` avant le calcul de position d'insertion — sinon `floor(random() * (NULL + 1))` renvoie NULL et la position devient NULL → erreur de découpage.
- **`quizzes.teacher_id` vs `books.teacher_id`** : les quiz de groupe utilisent `books.teacher_id` via FK `book_id`. Les quiz de grammaire utilisent `quizzes.teacher_id` directement. Ne pas confondre les deux chemins lors de requêtes de vérification de propriété.

## Session 12 (2026-06-23) — Quiz vocabulaire auto-généré (Q1)

### Décisions
- **`generate_individual_quiz` retourne `{ vocab_id, direction, prompt, choices[] }` sans champ `correct`.** La bonne réponse est mélangée dans les choix à une position aléatoire. Le client ne peut pas déterminer quelle option est juste sans relire la DB. Anti-triche côté base, pas côté app.
- **`submit_individual_quiz` relit la DB pour calculer le score.** Même si le client envoie `chosen`, le RPC SELECT la vraie valeur (`arabic_word` ou `french_definition`) depuis `vocabulary` pour comparer. Le client ne peut pas inflater le score.
- **Une ligne `quizzes` créée à chaque soumission** (`scope=individual`, `source_type=glossary`). Pas de quiz "template" persistant par élève — chaque tentative = quiz unique. Simple et suffisant à cette échelle. Le lien `quiz_attempt.quiz_id` reste cohérent avec le schéma existant.
- **`SECURITY DEFINER` pour contourner la policy `quizzes_write_teacher`** (INSERT dans `quizzes` interdit aux élèves). Le RPC vérifie lui-même `private.current_student_id() = p_student_id` en tête.
- **Minimum 4 mots** pour générer un quiz (1 correct + 3 distracteurs). Contrôle via `CONTINUE WHEN array_length < 3` dans le loop SQL. La page affiche un état vide explicatif sous ce seuil.
- **Résultat affiché en fin de quiz uniquement** (pas par question). Mais review complète à la fin : bonne réponse révélée pour chaque mauvaise réponse — utile pédagogiquement sans être de la gamification.
- **Évaluations accessibles via le menu "Plus"** (pas un 6e onglet). La barre de navigation mobile est à 5 onglets max — au-delà c'est trop dense. Le menu Plus est prévu pour les fonctionnalités secondaires.

### Décisions (D1 — soumission devoir + D2 — audio)
- **Distinction produit clarifiée par le propriétaire** : la **grammaire** (former/analyser des phrases) n'est PAS un devoir — c'est une **évaluation** comme le quiz, **rédigée à la main par le prof** (jamais auto-générée). Seul le **vocabulaire** est auto-généré. Les **devoirs** (D1/D2) = rendu photo/audio corrigé à la main, sans score auto. Ne pas mélanger les deux dans l'UI : grammaire → section Évaluations, photo/audio → section Devoirs.
- **Faille RLS `hw_update_student` fermée.** La policy d'origine laissait l'élève UPDATE n'importe quelle colonne de SES devoirs (y compris `grade`, `feedback`, `status`). Remplacée par RPC `submit_homework` SECURITY DEFINER qui ne touche que `submission_file/status/submitted_at`. **Leçon** : une policy UPDATE `USING (student_id = me)` sans restriction de colonnes est une faille — Postgres RLS ne sait pas restreindre les colonnes, il faut une RPC pour ça.
- **D2 sans migration** : l'audio est juste un fichier `.webm`/`.mp4` dans le **même bucket** `homework-submissions` (pas de bucket `homework-audio` séparé — policies identiques, mime non restreint, 10 Mo suffisent). Réutilise la RPC `submit_homework` de D1. La distinction photo/audio se fait à l'affichage par extension. Principe « impact minimal » respecté.
- **Blob MediaRecorder → server action** : un Blob enregistré ne peut pas peupler un `<input type=file>` programmatiquement de façon fiable. Solution : construire `FormData` à la main côté client (`fd.append("submission_file", blob, "recording.webm")`) et appeler la server action **directement** (`submitHomework(id, {}, fd)`) via `useTransition`, sans `<form action>`/`useActionState`. Le même composant gère photo (input file) et audio (blob) par cette voie unifiée.
- **MIME MediaRecorder cross-navigateur** : Chrome=`audio/webm`, Safari=`audio/mp4`. Tester `MediaRecorder.isTypeSupported("audio/webm")` et nommer le fichier selon le type réel pour que la détection prof par extension marche.

### Pièges
- **`RAISE NOTICE` dans `DO $$` n'est pas capturé par `execute_sql` MCP.** Utiliser des `SELECT` avec `FROM function()` à la place pour les tests empiriques.
- **Prouver qu'une faille UPDATE est fermée** : impersonner l'élève, tenter l'`UPDATE ... RETURNING id` dans un CTE et compter les lignes (`SELECT COUNT(*) FROM upd`). 0 ligne = aucune policy ne l'autorise = faille fermée. Plus parlant qu'attendre une erreur (un UPDATE sans policy ne lève pas d'erreur, il affecte juste 0 ligne).
- **`FOR var IN SELECT value FROM jsonb_array_elements(...)` retourne un RECORD** avec un champ `.value`, pas un scalaire jsonb. Pour accéder directement à l'élément jsonb, utiliser `FOR idx IN 0..jsonb_array_length(arr)-1 LOOP` puis `arr->idx`. Plus lisible et sans ambiguïté.
- **Loop variable `i` dans `FOR i IN 1..4`** : dans un block PL/pgSQL imbriqué dans un autre FOR LOOP, `i` est automatiquement déclaré par le FOR loop — pas besoin de `DECLARE i int`. Évite une erreur "variable already declared".

> Décisions, enseignements et pièges. À lire au début de chaque session.

## Session 10 (2026-06-23) — Chat lag + Notifications cliquables + UX onglets

### Décisions
- **RPC SECURITY DEFINER pour toutes les notifications.** `insert_notification` est le seul endroit où on insère dans `notifications`. N'importe quel utilisateur authentifié peut l'appeler. Élimine définitivement la dépendance à `createAdminClient()` / `SUPABASE_SERVICE_ROLE_KEY` pour les notifications. Pattern à généraliser : INSERT multi-table bloqué par RLS → RPC SECURITY DEFINER.
- **Enrichir le payload dès la création, pas à l'affichage.** Stocker `{ url, sender_name }` dans le payload au moment de l'INSERT (server action) plutôt que de requêter la DB au moment de l'affichage (NotifBell client). Évite une requête Supabase supplémentaire côté client et fonctionne pour les notifs historiques sans migration.
- **`loading.tsx` = levier de performance perçue le moins coûteux dans App Router.** Un fichier de 8 lignes donne un feedback visuel immédiat au changement d'onglet pendant que le serveur rend la page. À ajouter sur toutes les routes à fort transit utilisateur.
- **`requireStudent()` retourne `{ userId, profile, studentId }`** — le profil complet est disponible sans requête supplémentaire. Utiliser directement `profile.full_name` dans les actions pour enrichir les payloads.
- **Branche vercel-sync : stratégie cherry-pick = acceptable mais fragile.** Les conflits répétés (commentaire seulement) viennent de commits différents entre les deux branches. À terme : ne garder qu'une seule branche active et utiliser Vercel Preview Deployments sur la branche de travail principale.

### Pièges
- **`createAdminClient()` en prod = échec silencieux.** Pas de log, pas d'erreur visible côté client. Le premier symptôme est "la fonctionnalité ne marche pas en prod mais marche en local". Root cause systématique : `SUPABASE_SERVICE_ROLE_KEY` absent en prod. Diagnostic : vérifier la table `notifications` (ou la table cible) directement via MCP `execute_sql`.
- **Cherry-pick + commentaires différents → conflit trivial à répétition.** Résoudre avec `git checkout --ours <file>` quand le code est identique et seul le commentaire diffère. Ne pas rejeter le cherry-pick entier pour ça.
- **`loading.tsx` scope** : un `loading.tsx` à la racine `/dashboard/` couvre uniquement la page `/dashboard`, pas les enfants `/dashboard/messages`, `/dashboard/bookings`, etc. Chaque sous-route a besoin de son propre fichier.

## Session 9 (2026-06-23) — Corrections prod + Cockpit contextuel

### Décisions
- **Ne jamais utiliser `createAdminClient()` dans un Server Component/Action qui n'a pas `SUPABASE_SERVICE_ROLE_KEY` en prod.** Sur Vercel, seules les variables explicitement ajoutées dans les env vars sont disponibles. Toute page qui appelle `createAdminClient()` explose au runtime si la clé manque — même si elle fonctionne en local avec `.env.local`.
- **Corriger via RLS + RPC SECURITY DEFINER, jamais en ajoutant la clé service_role au client.** Pour `dashboard/bookings` : RPC `get_teacher_booked_slots` (`SECURITY DEFINER`) expose uniquement `scheduled_at` + `status` des créneaux du teacher de l'élève, sans révéler les autres élèves. Pour `dashboard/messages` : policy `conversations_insert_student` permet à l'élève de créer sa propre conversation.
- **Cockpit contextuel** : afficher "À documenter" uniquement si un cours passé n'a pas de `lesson_record`. Computed via jointure composite `${student_id}-${YYYY-MM-DD}` entre `bookings` (passés) et `lesson_records` (même fenêtre). Évite un bouton permanent qui pollue l'interface.
- **Bouton "Préparer le cours"** sur les bookings à venir : lien vers `/teacher/session/prep/${bookingId}`, badge vert si `prep_notes` existe déjà. Charge le contexte élève (leçon en cours + dernière séance) pour que l'enseignant ne perde pas de temps.
- **UTC borders pour fenêtre du jour** : `new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))` au lieu de `setHours(0,0,0,0)` (local). Le cockpit vit sur un serveur Vercel dont le fuseau n'est pas garanti.
- **`prep_notes`** : colonne `text null` ajoutée à `bookings` via migration `add_prep_notes_to_bookings`. Valeur nullable — distinction entre "jamais préparé" et "notes vides".
- **Policy `payments_select_admin`** : admin sans ligne dans `teachers` avait `current_teacher_id() = null` → toutes les lignes de paiement bloquées. Ajout d'une policy séparée `USING (private.is_admin())` pour que le compte admin+teacher accède aux paiements même sans teacher row (ou en complément de sa teacher row).

### Pièges
- **Tout `createAdminClient()` en prod = bombe à retardement.** Si `SUPABASE_SERVICE_ROLE_KEY` n'est pas dans les env vars Vercel, le crash arrive au runtime (pas au build). Pattern systématique de remplacement : INSERT bloqué par RLS → policy ciblée ; UPDATE multi-table → RPC SECURITY DEFINER ; SELECT cross-élève → RPC SECURITY DEFINER. Ne jamais patcher en ajoutant la clé service_role côté client.
- **`generate_typescript_types` et fonctions** : après ajout d'un RPC, `database.types.ts` ne connaît pas la nouvelle fonction → TypeScript refuse `.rpc("get_teacher_booked_slots")`. Mettre à jour le bloc `Functions` dans `database.types.ts` manuellement ou en régénérant.
- **Push non-fast-forward sur la branche Vercel** : si la branche de déploiement a divergé (rebase ou commits différents), `git push` échoue. Solution propre : `git fetch origin`, créer une branche temp depuis l'origine, `git cherry-pick <hash>`, pusher depuis la temp. Ne jamais `--force` sur une branche partagée sans confirmation.
- **Jointure Supabase + guards TypeScript** : `bookings.students.profiles` peut être un objet ou un tableau selon le contexte. Toujours garder `Array.isArray(x) ? x[0] : x`.
- **`suppressHydrationWarning` sur les dates** : tout composant affichant une date locale (format heure) doit porter cet attribut sur le `<p>` ou `<span>` concerné, sinon erreur d'hydratation en production (serveur ≠ client timezone).

## Session 8 (2026-06-22) — Messagerie temps réel + Paiements (Lots 7 & 8)

### Décisions
- **Realtime `postgres_changes`** : nécessite que les tables soient dans la publication `supabase_realtime`. Par défaut vide sur un nouveau projet → migration `ALTER PUBLICATION ... ADD TABLE` obligatoire avant tout abonnement.
- **Création de conversation** : teacher a la policy d'écriture → upsert via client standard côté enseignant. Côté élève (pas de policy INSERT) → upsert via `createAdminClient()` dans le server component. Contrainte UNIQUE `(teacher_id, student_id)` déjà en base.
- **Notifications INSERT** : pas de policy d'écriture côté client → toujours via `createAdminClient()` dans la server action après chaque `sendMessage`.
- **Paiements INSERT** : idem, pas de policy → `createAdminClient()` dans `requestPayment` et les actions de confirmation enseignant.
- **`confirmPayment` réactive l'élève** : si `status = suspended_payment`, le passage en `paid` remet l'élève en `active` automatiquement (même transaction).
- **`ChatBox` partagé** : un seul composant `src/components/chat-box.tsx` avec `sendAction` + `markReadAction` injectés depuis les pages parent. Évite la duplication élève/enseignant.
- **Payload notifs = `any`** : le type Supabase `Json` inclut `null`, incompatible avec `Record<string, unknown>`. Utiliser `any` ou `Json` importé depuis `database.types`.

### Pièges
- **UUID hex-only** : les préfixes de test `m`, `p` ne sont pas des hex valides → erreur `22P02 invalid input syntax for type uuid`. Utiliser uniquement `0-9, a-f` (ex : `ab`, `ba`, `ca`).
- **`@supabase/ssr` Realtime** : `createBrowserClient` supporte bien les canaux Realtime. Ne pas créer le client en dehors de `useEffect` pour éviter les fuites de connexion — créer dans l'effet, nettoyer via `supabase.removeChannel(channel)`.
- **Retrait du canal Realtime** : toujours retourner le cleanup `() => supabase.removeChannel(channel)` dans le `useEffect` pour éviter les multiples abonnements en dev (Strict Mode double-mount).

## Session 7 (2026-06-22) — Planning & réservation (Lot 6)

### Décisions
- **Slots disponibles côté serveur** : `generateAvailableSlots()` dans `src/lib/booking.ts` — explose les règles récurrentes sur 4 semaines, déduplique par clé UTC, filtre préavis 2h, max 20 résultats. Le calcul reste en TypeScript (pas de Postgres) : logique purement applicative.
- **Admin client pour slots teacher** : le student ne peut pas lire les bookings des autres élèves (RLS). On utilise `createAdminClient()` côté serveur dans le Server Component pour récupérer tous les créneaux déjà pris chez l'enseignant (seulement les champs `scheduled_at`/`status`, pas les noms d'élèves).
- **Verrou paiement = app-level** : `checkBookingEligibility()` appelé dans la server action `createBooking` (re-vérification serveur). La RLS `bookings_insert_student` ne vérifie que `student_id = current_student_id()`, pas le paiement — intentionnel : la sécurité par couches (RLS bloque un élève d'écrire pour un autre, l'app bloque l'écriture sans paiement).
- **JoinButton temps réel** : `useEffect` + `setInterval(60_000)` pour rafraîchir `now` chaque minute. Affiche heure locale via `getHours()`/`getMinutes()` (pas UTC).
- **Slots en heure locale navigateur** : `toLocaleDateString("fr-FR", {...})` + `toLocaleTimeString("fr-FR", {...})` dans le composant client `BookingSlots`. Serveur-side listings gardent `"HH:mm UTC"` avec label.
- **Conversion heure locale → UTC** dans le formulaire enseignant : `new Date().getTimezoneOffset()` en minutes dans `toUtcTime()`. Gère le wrap minuit avec `% (24*60)`.

### Pièges
- **`typeof upcoming extends Array<infer T> ? T : never`** ne fonctionne pas si `upcoming` est `T[] | undefined` : le type devient `never`. Utiliser `NonNullable<typeof upcoming>[number]` à la place.
- **`teacher_id` nullable** dans `students` table : TypeScript infère `string | null`. Garder `if (!student?.teacher_id)` plutôt que `if (!student)` pour éviter l'erreur de type en passant `null` à `.eq()`.
- **UUID `LIKE` opérateur** : Postgres lève une erreur `operator does not exist: uuid ~~ unknown` quand on utilise `LIKE` avec un uuid. Toujours caster en `::text` ou utiliser `= ANY(ARRAY[...])` pour filtrer plusieurs UUIDs.

## Session 6 (2026-06-22) — Espace enseignant complet (Lot 5)

### Décisions
- **Cockpit dynamique** : données agrégées en 3 requêtes parallèles (`Promise.all`). Pas de cache distribué (§3 Principe 6).
- **Fiche élève** : 6 requêtes parallèles. Les counts Supabase (`count: "exact"`) retournent le total même avec `limit()`.
- **Note de profil** : upsert via `onConflict: "student_id,teacher_id"` après ajout d'une contrainte UNIQUE (migration 14). `teacher_id` dérivé côté serveur — jamais confié au client.
- **Pré-sélection élève** : `?student_id=` dans la session form → `initialStudent = students.find(id) ?? students[0]`.
- **Correction devoir** : server action simple (update status + feedback + grade + corrected_at). RLS bloque côté base.

### Pièges & correctifs
- **Trou RLS `student_profile_notes`** (migration 15) : la policy originale ne vérifiait pas `owns_student()` dans le `WITH CHECK`. Un teacher pouvait insérer une note pour l'élève d'un autre. Corrigé en ajoutant `AND private.owns_student(student_id)`. Découvert grâce aux tests empiriques.
- **Youssef voit tous les élèves** : role `admin` → policy `students_admin_all`. By design. Le test d'isolation pertinent = Khadija (teacher non-admin).
- **Rebase + force-push Vercel** : rebase author-fix change les hashes → branche Vercel rejette le push non-fast-forward. Résolu par `git push --force` sur la branche de déploiement uniquement.
- **Jointure Supabase one-to-one** : `students.profiles` retourne un objet (pas un array) pour un FK one-to-one. Guard `Array.isArray(x) ? x[0] : x` pour la sécurité TypeScript.

## Session 1 (2026-06-21) — Socle (auth, RLS, modèle de données)

### Décisions d'architecture
- **Identité** : `profiles.id = auth.users.id`. `teachers` et `students` ont leur propre `id` (uuid) ; toutes les tables métier référencent `teachers.id` / `students.id` (pas `profile_id`).
- **Helpers RLS en `SECURITY DEFINER`** pour éviter la récursion (une policy sur `profiles` qui relit `profiles`…). Placés dans un schéma **`private`** (non exposé par PostgREST) : `is_admin()`, `current_teacher_id()`, `current_student_id()`, `owns_student(uuid)`.
- **admin = aussi teacher** : représenté par `profiles.role='admin'` + une ligne dans `teachers`. `is_admin()` ET `current_teacher_id()` renvoient vrai pour ce compte.
- **Paiements** : aucune policy d'écriture pour les rôles client → seul le `service_role` (webhook Revolut) écrit. Lecture par tout teacher (pot commun). C'est le socle du verrou « pas payé = pas de résa ».
- **quiz_questions** : pas de policy de lecture élève (contient `correct_answer`). La passation se fera via server action qui masque la réponse.
- **Comptes de test conservés** (demande propriétaire) avec mot de passe commun `Takalamu2026!`.

### Pièges rencontrés (et corrigés)
1. **`create-next-app` refuse un dossier non vide** (CLAUDE.md, tasks/). → scaffolder dans un dossier temp puis fusionner.
2. **Next 16 a renommé `middleware` → `proxy`** : fichier `src/proxy.ts`, fonction exportée `proxy`. Sinon warning de dépréciation au build.
3. **`.env.example` ignoré par `.env*`** : ajouter l'exception `!.env.example` dans `.gitignore`.
4. **`ALTER FUNCTION ... SET SCHEMA private`** ne réécrit PAS les références internes par nom : `owns_student` appelait encore `public.current_teacher_id()` → erreur 42883. Corrigé via `CREATE OR REPLACE` pointant `private.current_teacher_id()`. Les **policies** RLS, elles, référencent par OID → survivent au changement de schéma.
5. **Tests RLS via `execute_sql`** : impersonation avec `set local role authenticated;` + `set_config('request.jwt.claims', '{"sub":"<uuid>"}', true);` dans une transaction. ⚠️ Ne PAS mêler `insert` de seed et `begin;…rollback;` dans le MÊME appel : c'est une seule transaction implicite, le `rollback` annule aussi le seed. Seeder dans un appel séparé (committé).
6. **Linter Supabase** : helpers `SECURITY DEFINER` exposés en RPC `anon` = WARN. Résolu en les sortant du schéma `public`. `set_updated_at` voulait un `search_path` figé.

### Limites d'environnement
- **Egress réseau bloqué** vers `*.supabase.co` depuis le sandbox (allowlist) → impossible de tester le login REST en direct ; vérifié via MCP (`crypt()` match) à la place.
- **Pas de token Vercel** ni login CLI dans le sandbox, et le MCP Vercel ne crée pas de projet / n'écrit pas d'env vars → le déploiement preview passe par l'**intégration Git** côté propriétaire.

## Session 2 (2026-06-21) — Mode auteur / programme (Lot 2)

### Décisions
- **Aiguillage par rôle** centralisé dans `src/lib/auth.ts` (`getProfile`, `requireTeacher`, `homePathForRole`). Le layout `/teacher` appelle `requireTeacher()` → garde unique pour tout l'espace enseignant.
- **CRUD lessons** via server actions (`createLesson`/`updateLesson`/`deleteLesson`/`moveLesson`). Validation serveur (titre requis, `isLessonPhase`). Pas de logique métier côté client (§11).
- **Réordonnancement** : échange d'`order_index` avec le voisin (boutons ↑/↓), choisi pour la sobriété mobile plutôt que drag&drop.
- **Édition** : `updateLesson.bind(null, id)` pour lier l'id de la leçon à l'action — pattern propre pour passer un paramètre fixe à une server action consommée par `useActionState`.

### Pièges
- **Pré-requis Vercel découverts à l'usage** (à refaire pour chaque projet) : (1) la *Deployment Protection* (Vercel Authentication) bloque tout visiteur par un 403 — à désactiver ; (2) repo GitHub public ≠ site public (réglages distincts) ; (3) variables d'env à mettre sur **tous** les environnements + **redéployer** après ajout (un build antérieur ne les a pas).
- **Diagnostic à distance** : quand le projet Vercel est hors du scope du token MCP (compte perso vs team), `list_projects`/`web_fetch_vercel_url` ne le voient pas. Astuce : lire les **logs auth Supabase** (`get_logs auth`) pour savoir si la requête de login arrive — absence de tentative = problème côté app/env, pas côté base.

### Rappels process
- Le propriétaire veut **valider le plan avant tout code** et des **checkpoints** (ne pas tout enchaîner). Respecter ce rythme même si CLAUDE.md dit « exécuter sans pause ».

## Session 5 (2026-06-22) — Déploiement : deux projets Vercel

### Décisions
- **Branche de référence** : `claude/new-project-setup-1jcgwf` → projet `takalamu.vercel.app` (`prj_2gEiNLgY1rcZ8CEUAInkjc`). C'est la branche à pousser pour que les changements arrivent en preview utilisable.
- **Autre projet** (`prj_GdgTgn9VKbkk7fkTxwbzl2aZd6Zg`, URL `takalamu-xbih-...vercel.app`) : ISE inexpliquée (build vert, Supabase 200), projet sous compte personnel non accessible via MCP. Ne pas l'utiliser comme référence.

### Pièges
- **Deux projets Vercel distincts** connectés au même repo. L'un (`takalamu.vercel.app`) fonctionne ; l'autre (preview `takalamu-xbih-...`) lève une ISE à runtime dont la cause n'a pas pu être identifiée (logs inaccessibles, MCP limité au compte équipe).
- **Branche active de travail** ≠ branche du projet fonctionnel. Pousser sur `claude/takalamu-lesson-completion-0tios8` ne met à jour que le projet cassé. Il faut aussi pousser sur `claude/new-project-setup-1jcgwf` (fast-forward si la branche de travail est en avance).
- **Commande de sync** : `git push origin claude/takalamu-lesson-completion-0tios8:claude/new-project-setup-1jcgwf`
- **`__vercel_toolbar_code`** dans une URL preview = token temporaire (Vercel Authentication). Il expire → 403. Toujours utiliser le bouton "Visit" depuis vercel.com pour obtenir un lien frais.
- **MCP Vercel** : accès limité au compte équipe (`team_p96xUWAJNjEQKceK3ukiU2gK`). Les deux projets Vercel sont sous compte **personnel** → `list_projects`, `list_deployments`, `get_runtime_logs` renvoient 403 ou liste vide. Seul `get_project` avec l'ID exact peut parfois fonctionner.

## Session 4 (2026-06-22) — Espace élève (Lot 4)

### Décisions
- **`requireStudent()`** renvoie `{ userId, profile, studentId }`. L'`id` métier de l'élève (`students.id`) est distinct du `profile_id` (`auth.users.id`) — la double résolution est nécessaire pour la passer à d'éventuels composants enfants, même si RLS filtre automatiquement les requêtes Supabase côté serveur.
- **Onglet actif via `usePathname`** dans un composant client `DashboardTabs` isolé — le layout reste un Server Component, seule la nav est client.
- **Recherche vocab client-side** : toute la liste est chargée en SSR puis filtrée dans `VocabSearch` (client). Justifié à cette échelle (quelques dizaines de mots). Pas de Supabase full-text.
- **Arabic `dir="rtl" lang="ar"`** sur les mots arabes pour un rendu correct sur mobile (justification et ligatures).
- **RLS deny-by-default** : aucun `WHERE` explicite dans les pages — les policies filtrent à la source. Preuve empirique obligatoire avant merge.

### Pièges
- La jointure `lesson_records → lessons` via Supabase JS renvoie l'objet `lessons` soit comme objet soit comme tableau selon le contexte (résultat de `select("…, lessons(title)")`). Guard `Array.isArray(r.lessons) ? r.lessons[0] : r.lessons` pour éviter un crash TypeScript.
- `requireStudent()` doit rediriger teacher → `/teacher` (pas `/login`) pour que le compte admin+teacher reste utilisable côté enseignant.

## Session 3 (2026-06-22) — Fiche de fin de cours (Lot 3)

### Décisions
- **Atomicité via RPC Postgres** `submit_session_record` plutôt qu'enchaînement d'`insert` côté serveur : une coupure réseau ne peut pas laisser un `lesson_record` sans son vocab/devoir. Une seule fonction = une seule transaction.
- **SECURITY INVOKER** (pas DEFINER) : les RLS deny-by-default restent le garde-fou — chaque insert est vérifié avec les droits de l'appelant. Un contrôle `private.owns_student()` explicite en tête donne en plus un message d'erreur propre (errcode 42501) et dérive `teacher_id` côté serveur (jamais confié au client).
- **Règle d'absence §8 en base** : `absent_unjustified` ET `late` comptent (le retard >5min = absence, §8.4) ; `absent_justified` ne compte pas. Seuil 3 ⇒ `suspended_absences`, calculé dans la même update.
- **Lignes vocab/grammaire dynamiques** : champs HTML répétés (même `name`), lus côté serveur via `formData.getAll(...)` puis zippés par index. Plus simple que des noms indexés ou un JSON caché.
- **Date en UTC (Principe 7)** : input `datetime-local` (heure locale navigateur) + champ caché `session_date_iso` synchronisé via `new Date(local).toISOString()`. La conversion se fait **côté client** (le serveur ignore le fuseau de l'utilisateur).

### Pièges
- **`generate_typescript_types` renvoie tout le fichier** (~1000 lignes). Inutile de tout réécrire : seul le bloc `Functions` change quand on ajoute une RPC → édition ciblée de ce bloc dans `database.types.ts`.
- **Helpers en schéma `private`** (déplacés au lot 1) : une nouvelle fonction qui les appelle doit écrire `private.current_teacher_id()` / `private.owns_student()`, pas `public.`.
- **`search_path = ''` dans la RPC** : oblige à qualifier tous les objets (`public.lesson_records`, casts `::public.student_status`). Évite les warnings d'advisor sur search_path mutable.
- **Egress bloqué** (rappel) : le roundtrip supabase-js `.rpc()` n'est pas testable depuis le sandbox ; on prouve la fonction via `execute_sql` + simulation de rôle, et on vérifie le wiring sur la preview Vercel.
- **Container frais** : `npm install` nécessaire en début de session (node_modules absent) avant lint/build.

## Refonte UI (23 juin) — enseignements

- **React 19 + dates locales = crash, pas warning.** Tout affichage dépendant du
  fuseau/locale (`toLocaleTimeString`, `format` date-fns) doit porter
  `suppressHydrationWarning`, ou être calculé côté client via
  `useState<Date|null>(null)` + `useEffect`. Sinon erreur serveur en prod.
- **Découpage par phases committables.** Fondations → navigation → pages une par
  une, avec `npm run build` + commit + push à chaque étape. Aucune régression,
  rollback trivial si besoin.
- **Garder les `name` de champs lors d'un restyle de formulaire.** La fiche de fin
  de cours a été refaite visuellement sans toucher à la server action : tous les
  `name=` ont été conservés à l'identique.
- **Tokens en CSS variables + @theme (Tailwind v4).** Couleurs/ombres du design
  system déclarées une fois dans `globals.css`, réutilisées partout. Les valeurs
  hex inline restent acceptables pour coller au pixel près au handoff.
- **Ne pas inventer de données.** Le hero paiements enseignant affiche des
  compteurs (et non des montants en €) car la table `payments` n'a pas de colonne
  montant — rester honnête plutôt que d'afficher un faux « 1 240 € ».
