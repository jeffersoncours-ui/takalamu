# Lessons

## Session 11 (2026-06-23) — Liste chats enseignant + Storage uploads + Notifications complètes

### Décisions
- **Storage RLS via helpers `private.current_teacher_id()` / `private.current_student_id()`** : les policies Storage s'appuient sur les mêmes helpers que les tables Postgres. Teacher=ALL, student=SELECT uniquement sur son dossier (`storage.foldername(name))[1] = student_id`). Cohérent avec le reste du modèle d'accès.
- **Path Storage = `{student_id}/{timestamp}_{nom_nettoyé}`** : le premier segment est le student_id pour que la policy student puisse filtrer via `foldername`. Pas de session_id dans le path pour simplifier (le lien DB → storage_path dans `lesson_records.support_files` fait la jointure).
- **Upload avant la RPC** : les fichiers sont uploadés dans la server action avant d'appeler `submit_session_record`. Si l'upload échoue, on ignore le fichier silencieusement (pas d'erreur bloquante) et on continue. Si la RPC échoue après upload, les fichiers orphelins restent dans le bucket — acceptable à cette échelle.
- **`DROP FUNCTION IF EXISTS` par signature exacte** pour remplacer une fonction avec une nouvelle signature. `CREATE OR REPLACE` seul échoue si plusieurs surcharges coexistent (erreur 42725). Pattern à retenir pour toutes les futures évolutions de RPC.
- **Notification `payment_requested` via client standard (session élève)** : `requestPayment` utilise déjà `createAdminClient()` pour l'INSERT payment (RLS bloque élève). La notification elle, passe par `createClient()` (session élève authentifiée) pour appeler le RPC `insert_notification` SECURITY DEFINER. Les deux clients coexistent dans la même action — pas de problème.
- **Liste chats enseignant** : query avec `messages(...)` embedded, tri JS côté serveur par date du dernier message. Unread count calculé en JS (filtre `sender_id !== userId && !read_at`). Suffisant à cette échelle.

### Pièges
- **`CREATE OR REPLACE FUNCTION` sur une fonction avec plusieurs surcharges existantes** → erreur `42725 function name is not unique`. Résoudre avec `DROP FUNCTION IF EXISTS <sig_exacte>` avant le `CREATE OR REPLACE`. Spécifier tous les types d'argument dans la signature DROP.
- **`git cherry-pick` après merge dans todo.md** : si `tasks/todo.md` a été modifié par le cherry-pick lui-même (Auto-merging), ne pas re-lire le fichier — il a déjà l'état voulu. L'outil Edit détecte le conflit si on tente d'éditer sur l'ancien contenu.



> Décisions, enseignements et pièges. À lire au début de chaque session.

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
