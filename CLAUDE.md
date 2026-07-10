# CLAUDE.md — Plateforme de cours d'arabe & d'étude de texte

> **À lire au début de chaque session, avant toute action.** Ce fichier est le dossier de construction destiné à Claude Code : il décrit *quoi* construire et *comment travailler*. Lis-le en entier avant d'écrire du code.
> **Langue** : prose en français, identifiants techniques (tables, champs, variables) en anglais.
> En cas de doute, la **Méthode de travail** ci-dessous et les **Principes directeurs (§3)** priment.

---

## Méthode de travail (System Instructions)

**1. Principes fondamentaux**
- **Simplicité** : la solution la plus simple et efficace. Minimum de code et de complexité architecturale.
- **Cause racine, pas de patch** : corriger le problème de fond, jamais le contourner. Standard d'un ingénieur senior.
- **Impact minimal** : ne modifier que le strict nécessaire. Éviter les régressions et les effets de bord.

*(Ces principes régissent ta façon de **travailler**. Les règles propres au **produit** sont dans les Principes directeurs, §3.)*

**2. Planification & workflow**
- Pour toute tâche non triviale (3+ étapes ou changement d'architecture) : écrire le plan dans `tasks/todo.md` en items actionnables et cochables, puis **exécuter immédiatement** — pas de pause pour approbation.
- Cocher les items au fil de l'avancement.
- Si l'exécution dévie du plan : **STOP**, réévaluer, re-planifier. Ne pas forcer une approche qui échoue.
- En fin de tâche : ajouter une section **« Review »** à `tasks/todo.md`.

**3. Exécution**
- Utiliser des **subagents** pour la recherche, l'analyse parallèle et l'exploration (garder le contexte principal propre).
- Résoudre les erreurs CI/CD de façon **autonome** : analyser les logs, tracer la cause racine, corriger sans demander d'aide.

**4. Qualité & validation empirique (obligatoire)**
- Ne jamais marquer une tâche « terminée » sans **preuve empirique** (logs, tests, démo).
- Auto-relecture avant de présenter : *« Un staff engineer validerait-il ça ? »*
- Après toute implémentation (migration SQL, RPC, **RLS**, composant) et **avant** de présenter : tester réellement via le **MCP Supabase (`execute_sql`)** —
  - appeler les fonctions/RPC, vérifier les **RLS**, contrôler les données retournées ;
  - créer des données de test pour le cas nominal, les cas limites et les cas d'erreur attendus ;
  - **mettre la conception en défaut** — tester ce qui ne *doit pas* fonctionner. Cas propres à ce projet : *un élève peut-il lire les données d'un autre élève ? Les tables `*_private_notes` fuient-elles vers un compte élève ? Un élève non payé (`payment.status != paid`) peut-il réserver ? Un enseignant voit-il les élèves d'un autre ?* (voir aussi les priorités de test au §11) ;
  - nettoyer les données de test après, sauf si utiles aux tests manuels du propriétaire ;
  - inclure les requêtes SQL et les valeurs retournées comme **preuve** dans la réponse.

**5. Amélioration continue**
- Après toute correction du propriétaire : mettre à jour `tasks/lessons.md` immédiatement.
- En tirer des règles concrètes pour prévenir les erreurs récurrentes.

**6. Rituel de fin de chaque session (obligatoire)**
Avant de clôturer une session de travail, toujours :
- Mettre à jour `tasks/todo.md` : cocher ce qui est fait, ajuster les tâches restantes, écrire une courte section **« Review »** de ce qui a été accompli et de l'état du projet.
- Mettre à jour `tasks/lessons.md` : consigner les décisions, enseignements et pièges rencontrés, pour que la session suivante reparte avec ce contexte.
- **Committer** ces deux fichiers (et le travail validé) sur le repo.

---

## 1. Vue d'ensemble & mission

Plateforme web (mobile-first) pour **deux enseignants** qui vendent **deux produits** :

- **Produit A — Cours d'arabe individuel** : 1-à-1 en visio, abonnement mensuel, suivi pédagogique complet.
- **Produit B — Étude de texte islamique en groupe** : conférence en groupe liée à un livre, série de séances, paiement unique.

Un enseignant (homme) gère les élèves hommes, l'autre (femme) les élèves femmes. La plateforme sert à : présenter l'offre, inscrire les élèves, planifier et encaisser les cours, et assurer tout le suivi pédagogique. **L'objectif n'est pas un MVP** : tout le périmètre décrit ici doit être construit. Mais construire ≠ tout réinventer (voir §3).

---

## 2. Stack technique & décisions clés

| Brique | Choix | Rôle |
|---|---|---|
| Frontend / app | **Next.js (App Router) + TypeScript**, déployé sur **Vercel** | UI, routing, API routes/server actions |
| Auth + Base + Stockage | **Supabase** (Postgres, Auth, Storage, RLS, Realtime) | Identité, données, fichiers (docs/audio), chat temps réel |
| Visio individuelle | **Zoom / Google Meet** (lien externe) | Cours 1-à-1 |
| Visio groupe | **Zoom Webinaire** | Conférence (caméras masquées, micros coupés, animateur seul) |
| Paiement | **Revolut Business** | Encaissement, abonnements, factures |
| Styling | **Tailwind CSS** | UI propre, moderne, responsive |

**À ASSEMBLER, jamais à recoder** : la visio (Zoom), l'encaissement et les factures (Revolut). On les intègre via leurs API ; on ne reconstruit pas leur logique.

**À CODER (le cœur de valeur)** : le suivi pédagogique, le carnet, le glossaire, la grammaire, les quiz, la progression, la messagerie, le planning, les règles métier.

---

## 3. Principes directeurs (guardrails)

Ces principes priment. Applique-les partout.

1. **Sécurité d'abord, au niveau base.** Toute isolation de données passe par les **RLS policies Postgres (Supabase)**, jamais seulement par l'affichage. Politique **deny-by-default** : aucune ligne accessible sans policy explicite. Un élève ne doit jamais pouvoir recevoir, même via une requête manuelle, les données d'un autre élève ni aucune donnée privée enseignant.
2. **Ne reconstruis pas la commodité.** Zoom, Revolut = intégrations. N'écris pas de visio, ni de moteur de paiement.
3. **Conçu pour N enseignants**, pas exactement 2. Toute donnée « appartient à » un enseignant via une clé étrangère. N'écris jamais « si homme/femme » en dur : utilise les rôles et les relations.
4. **Mobile-first, qualité moderne, zéro gamification.** Pas de badges, pas de streaks. Interface sobre, rapide, lisible sur un écran de téléphone.
5. **Performance de saisie = priorité absolue sur la fiche de fin de cours.** Cet écran (§7.6) doit pouvoir être rempli en moins de 30 secondes. C'est le composant le plus critique de tout le produit.
6. **Pas de sur-ingénierie.** À l'échelle visée (quelques dizaines d'élèves), pas de microservices, pas de cache distribué, pas de complexité inutile. Une app Next.js + Supabase suffit.
7. **Temps & fuseaux horaires** : stocke **toutes les dates/heures en UTC** en base. Convertis à l'affichage avec une vraie librairie de fuseaux (date-fns-tz / Luxon). Ne code **jamais** un décalage horaire en dur (le Maroc change d'heure pendant le Ramadan).
8. **Un compte élève est polyvalent** : il peut avoir un parcours d'arabe seul, une inscription au cours de groupe seule, ou les deux. Ne suppose jamais qu'un élève a un parcours d'arabe.
9. **Couper l'accès ≠ effacer.** Voir §8. Les suspensions retirent le droit de réserver, jamais l'accès en lecture aux contenus déjà acquis.

---

## 4. Rôles & modèle d'accès

Trois rôles (champ `role` sur `profiles`) :

- **admin** : peut créer/gérer les comptes enseignants. (Toi.) Un même compte peut être `admin` ET `teacher`.
- **teacher** : voit et gère **uniquement ses propres élèves** (fiches, chats, devoirs, planning). Vue **commune** sur l'argent (le pot est partagé).
- **student** : voit uniquement son propre espace (lecture seule sur la pédagogie ; dépose ses devoirs).

**Aiguillage** : à la réservation du cours d'essai, le prospect indique homme/femme → l'inscription sera rattachée à l'enseignant correspondant. Le genre se capte **avant** la création de compte.

---

## 5. Modèle de données

Schéma Postgres (Supabase). Tout `id` est un `uuid` par défaut. Tout a `created_at`/`updated_at`. **Chaque table porte une RLS policy** (voir §6).

### Identité & acteurs
- **profiles** — extends `auth.users`. `role` (admin|teacher|student), `full_name`, `gender` (m|f), `email`.
- **teachers** — `profile_id`, `bio`, `display_name`. (Données publiques de l'enseignant pour la vitrine.)
- **students** — `profile_id`, `teacher_id` (FK, l'enseignant rattaché), `gender`, `status` (active|suspended_payment|suspended_absences), `onboarding_completed` (bool), `unjustified_absences_count` (int, dérivé/maintenu).

### Programme (mode auteur — partagé entre enseignants)
- **lessons** — la bibliothèque maîtresse, ordonnée. `order_index`, `title`, `objective`, `phase` (dechiffrage|lecture_oral|grammaire). Cases **optionnelles** : `reading_support` (réf. fichiers), `audio_asset_id` (FK, nullable), `grammar_point` (text, nullable), `homework_template` (text, nullable), `quiz_id` (nullable). Une leçon de phase « dechiffrage » peut n'avoir que `reading_support`.
- **audio_assets** — `lesson_id`, `storage_path` (Supabase Storage), `title`. (Audios existants liés à certaines leçons. Hébergés sur Supabase, fichiers légers.)

### Suivi individuel (Produit A)
- **student_progress** — `student_id`, `current_lesson_id` (le curseur). Un seul fil commun, position individuelle.
- **lesson_records** (séances) — **la table centrale du carnet**. `student_id`, `teacher_id`, `lesson_id` (leçon du programme travaillée), `session_date`, `attendance` (present|absent_justified|absent_unjustified|late), `public_recap` (text — visible élève), `support_files` (réfs Storage déposés après la séance). *La note privée de séance est dans une table séparée (voir Notes privées).*
- **vocabulary** — le glossaire, **par élève**. `student_id`, `arabic_word`, `french_definition`, `root` (nullable), `lesson_record_id` (où vu), `created_at`. Sert aussi de banque de quiz (§7.12).
- **grammar_rules** — **par élève**. `student_id`, `title`, `content`, `lesson_record_id`. (Jumeau du glossaire.)
- **homework** — `student_id`, `lesson_record_id` (nullable), `instructions`, `status` (a_rendre|rendu|corrige|vu), `submission_file` (photo manuscrit déposée par l'élève), `correction_file` (copie corrigée renvoyée), `feedback` (text), `grade`, timestamps de chaque transition.

### Évaluations
- **quizzes** — `scope` (individual|group), `source_type` (glossary|book), `book_id` (nullable, si group).
- **quiz_questions** — pour les quiz **de groupe** (saisis à la main, liés au livre). `quiz_id`, `prompt`, `correct_answer`, `distractors` (array). *Pour les quiz individuels, les questions sont **générées** depuis `vocabulary` à la volée (voir §7.12), pas stockées.*
- **quiz_attempts** — `student_id`, `quiz_id`, `score`, `answers` (jsonb), `taken_at`.

### Produit B — cours de groupe (livre)
- **books** — un cours-livre réutilisable. `title`, `description`, `shared_notes` (notes de cours partagées), `teacher_id` (toi seul pour l'instant), `price` (**À DÉFINIR**, voir §10), `total_sessions` (~15). Lié à un `quiz` de scope group.
- **book_sessions** — une exécution d'un livre. `book_id`, `session_number`, `scheduled_at` (UTC), `zoom_link`. Heures **fixées par l'enseignant**.
- **book_enrollments** — `student_id`, `book_id`, `payment_id`, `enrolled_at`. (Inscription = paiement unique pour toute la série.)

### Planning & réservations
- **teacher_availability** — `teacher_id`, règles de dispo récurrentes (ex. jeudi/vendredi). Stockées en UTC.
- **bookings** — `student_id`, `teacher_id`, `type` (individual|group), `scheduled_at` (UTC), `status` (booked|completed|cancelled|moved), `zoom_link`, `linked_book_session_id` (nullable). Pour l'individuel : l'élève place ses 4 créneaux/mois dans les dispos, **uniquement si le paiement est confirmé**.

### Communication
- **conversations** — `teacher_id`, `student_id` (1 par paire, cloisonnée).
- **messages** — `conversation_id`, `sender_id`, `body`, `sent_at`, `read_at`. Temps réel via Supabase Realtime.
- **notifications** — `user_id`, `type` (new_message|homework_due|eval_due), `payload` (jsonb), `read` (bool). **In-app uniquement** (pas d'email).

### Paiement
- **payments** — `student_id`, `product` (individual_sub|book), `revolut_reference`, `plan` (1x|2x|3x|12x pour l'individuel ; single pour le groupe), `status` (pending|paid|failed|cancelled), `period` (nullable). La **réservation est débloquée uniquement quand `status = paid`** (confirmé par webhook Revolut). Les factures vivent chez Revolut ; on stocke la référence + un lien.

### Notes privées (ENSEIGNANT UNIQUEMENT — tables isolées)
- **student_profile_notes** — `student_id`, `teacher_id`, `content` (note de profil permanente, épinglée). 
- **session_private_notes** — `lesson_record_id`, `teacher_id`, `content` (observation datée de la séance).
> Ces deux tables ont une RLS qui **interdit toute lecture au rôle student**. Elles ne doivent jamais transiter vers un client élève.

---

## 6. Sécurité (RLS & accès)

- **RLS activée sur toutes les tables**, deny-by-default.
- Un **student** ne lit que les lignes où `student_id = auth.uid()` (via `students.profile_id`). Aucun accès aux tables `*_private_notes`.
- Un **teacher** ne lit/écrit que les lignes de **ses** élèves (`teacher_id` = le sien). Exception : les tables financières (`payments`) sont lisibles par tout teacher (pot commun).
- Un **admin** peut créer des comptes teacher.
- **Auth Supabase** : jamais de mot de passe géré à la main. L'invitation envoie un lien sécurisé ; l'élève **choisit son mot de passe**. Reset géré par Supabase.
- **Aucune donnée de carte** stockée : tout passe par Revolut.

---

## 7. Spécifications fonctionnelles (décomposées)

### 7.1 Vitrine publique
- Pages : accueil/présentation, l'offre (Produit A + Produit B), les deux enseignants, réservation d'un cours d'essai, bouton **« Mon espace »** (→ login).
- Annonce claire « cours hommes avec X / cours femmes avec Y ».
- Présente **occasionnellement** le cours de groupe (livre) pour qu'un prospect puisse s'inscrire **rien que pour le livre**.
- Pas de page de pub. (Emplacement prévu pour témoignages — contenu fourni plus tard.)

### 7.2 Parcours d'inscription (onboarding)
1. Prospect réserve un **cours d'essai** (1 h), choisit homme/femme → rattaché au bon enseignant.
2. Essai **hors app** : un **mail transactionnel** envoie le lien Zoom.
3. Si l'enseignant valide → bouton **« inviter »** (manuel) → mail d'invitation.
4. L'élève crée son compte (choisit mot de passe) → entre.
- Conséquence : l'app ne contient que de **vrais élèves** invités.

### 7.3 Produit A — cours individuel
- 1-à-1 strict (jamais de groupe pour la langue).
- Abonnement mensuel **60 €/mois** (1 h/sem). Offres : annuel avec réduction, payable **1 / 2 / 3 fois**, ou **12 fois** (mensuel).
- L'élève **place ses 4 créneaux/mois** dans les dispos de son enseignant — **si payé**.

### 7.4 Produit B — cours de groupe (livre)
- Étude de texte islamique uniquement (jamais la langue).
- **Série liée à un livre** (~15 séances), **heures fixes** posées par l'enseignant.
- **Paiement unique, non fractionnable.**
- **Animé par toi seul** pour l'instant ; **mixte** autorisé (la séparation est assurée par la config **Zoom Webinaire** : caméras masquées, micros coupés de bout en bout, animateur seul, Q&A à la fin avec réouverture micro à la demande — **config Zoom, pas du code**).
- **Direct uniquement, pas de replay.** Mais **notes de cours partagées** + **évaluations**.
- **Contenu réutilisable** : le livre (`books`) + ses notes + son quiz s'écrivent une fois ; rejouer = créer une nouvelle `book_session` (dates + inscrits). Mêmes règles d'absence/retard que l'individuel.

### 7.5 Espace élève (onglets)
- **Tableau de bord** : accueil.
- **Cours déjà vus** : `lesson_records` triés par date ; supports téléchargeables.
- **Vocabulaire** : `vocabulary` de l'élève, recherche FR↔AR.
- **Règles de grammaire** : `grammar_rules` de l'élève.
- **Devoirs** : cycle `a_rendre → rendu → corrige → vu` ; dépose une **photo**, reçoit retour + note + copie corrigée.
- **Évaluations** : quiz auto-corrigés (§7.12).
- **Messagerie** : chat temps réel.
- **Paiement** : ses paiements, choix d'offre, lien vers facture Revolut.
> Les 3 vues (cours vus / vocabulaire / grammaire) sont alimentées par **une seule saisie** de fin de cours (§7.6).

### 7.6 Espace enseignant
- **Cockpit (accueil)** : liste de ce qui attend — cours du jour, devoirs à corriger, messages non lus, élèves en attente.
- **Fiche de fin de cours** *(critique, < 30 s — voir Principe 5)* : sélection élève → présence (present/absent/late) → leçon vue (avance le curseur `student_progress`) → dépôt supports → ajout vocab + règle du jour → devoir → **récap public** + **note privée de séance**. Une soumission alimente `lesson_records`, `vocabulary`, `grammar_rules`, `homework`.
- **Fiche élève** : position (curseur), historique, vocab/grammaire accumulés, devoirs à corriger, le chat, **note de profil privée épinglée en haut**.
- **Mon programme (mode auteur)** : CRUD ordonné des `lessons` (gabarit § Modèle de données). Bâti en pré-rentrée.
- **File de correction** : tous les `homework` au statut `rendu`, regroupés.
- **Admin** (toi) : bouton **« ajouter un enseignant »**.

### 7.7 Planning & réservation
- Codé **maison** (pas d'outil externe), mais avec une **librairie de fuseaux** robuste (Principe 7).
- Individuel : l'élève réserve dans `teacher_availability`, **bloqué tant que `payment.status != paid`**.
- Groupe : l'enseignant crée des `book_sessions` à heures fixes ; les inscrits payés s'y rattachent.
- **Bouton « Rejoindre »** : c'est lui qui livre le lien Zoom. Il **cesse de le livrer à H+5 min** (règle de retard, §8).

### 7.8 Messagerie
- Chat **temps réel** (Supabase Realtime), **cloisonné** par paire enseignant↔élève. Pas de numéro de téléphone échangé.
- Alertes **in-app uniquement** (la cloche), pas d'email.

### 7.9 Notifications
- Une **cloche** unique, plusieurs déclencheurs : nouveau message, devoir à rendre, éval à faire.
- **In-app uniquement.** Ne reflètent que des statuts déjà existants (pas de sous-système lourd).
- À distinguer des **mails transactionnels** (lien Zoom d'essai, invitation de compte, factures) qui, eux, partent par email.

### 7.10 Paiement (intégration Revolut)
- Le **choix d'offre** se fait dans l'app ; l'encaissement, l'historique et les **factures** restent chez Revolut.
- **Règle d'or** : `booking` impossible tant que `payment.status != paid`. La confirmation arrive via **webhook Revolut**.
- Offres individuelles : 1x / 2x / 3x (réduction) / 12x. Groupe : paiement **unique**.

### 7.11 Quiz / évaluations
- **Individuel (auto-généré)** : à partir du `vocabulary` de l'élève. Question = « que veut dire [arabic_word] ? », bonne réponse = `french_definition`, **distracteurs = 3 autres définitions tirées du glossaire de l'élève**. Aucune saisie manuelle. QCM uniquement (ne JAMAIS demander de taper la réponse en arabe : non corrigeable de façon fiable).
- **Groupe** : `quiz_questions` saisies à la main, liées au livre.
- Résultats dans `quiz_attempts`.

---

## 8. Moteur de règles métier (house rules)

Logique à implémenter précisément, côté serveur :

1. **Pas payé = pas de réservation.** Le bouton « réserver » reste fermé tant que le paiement courant n'est pas `paid`.
2. **Annulation** : une séance ratée est **déplaçable** sur un créneau de dispo restant (statut `moved`).
3. **Comptage d'absences** : seules les **absences injustifiées** comptent (`absent_unjustified`). Les justifiées ne comptent pas.
4. **Retard** : un retard **> 5 min** ⇒ (a) le bouton « Rejoindre » ne livre plus le lien, (b) **compte comme une absence** (et donc compte dans les 3 si injustifié).
5. **Seuil** : **3 absences injustifiées ⇒ `status = suspended_absences`** → plus de **nouvelles** réservations possibles, **même si payé**.
6. **Non-paiement ⇒ `status = suspended_payment`** → plus de nouvelles réservations.
7. **Couper ≠ effacer** : dans les deux cas de suspension, l'élève **garde en lecture seule** ses cours passés, son glossaire, sa grammaire. Il perd **uniquement** le droit de réserver. *Un seul mécanisme (verrou de réservation), deux déclencheurs.*

---

## 9. Hors périmètre / différé

- **RGPD** : **ne rien construire** maintenant (mentions légales, CGV, consentement, suppression). Mais **garde le modèle de données propre** pour qu'un ajout futur (ex. supprimer toutes les données d'un élève) ne nécessite pas de tout reprendre. Prévois simplement *où* afficher ces pages plus tard.
- **Structure légale / entité de facturation** : externe au code (décision comptable). Voir §10.
- Pas de microservices, pas d'app mobile native, pas de gamification.

---

## 10. Points ouverts nécessitant une décision (du propriétaire)

À renseigner avant ou pendant le build ; à ne pas inventer :

1. **Prix du cours de groupe (`books.price`)** — décidé « paiement unique », **montant non fixé**.
2. **Entité de facturation** — quelle structure facture (impacte la config Revolut et les mentions de facture). Le pot est commun aux deux enseignants. Décision comptable, liée au passage France → Maroc.

---

## 11. Conventions de dev & mise en route

- **Next.js App Router + TypeScript**, server actions/route handlers pour la logique sensible (jamais de règle métier critique côté client uniquement).
- **Tailwind**, mobile-first. Composants simples, accessibles, sobres.
- **Variables d'environnement** (à prévoir, non commitées) : clés Supabase, identifiants Revolut Business + secret de webhook, config Zoom.
- **Migrations Supabase** versionnées ; **RLS policies** écrites en même temps que chaque table (jamais après coup).
- **Toutes les dates en UTC** en base ; conversion à l'affichage via librairie de fuseaux.
- ⚠️ **Branche de production Vercel = `claude/new-project-setup-1jcgwf`, PAS `main`.** Découvert et corrigé en session 28 (2026-07-10) : ce réglage (Project Settings → Git → Production Branch, sur vercel.com uniquement — absent de l'app mobile Vercel) n'a jamais été aligné sur `main`, malgré tout le workflow "développe sur une branche de session, merge sur `main`". Résultat : `tatakalamu.fr`/`takalamu.vercel.app` ont servi une version figée au 23 juin (avant tout le pivot de service) jusqu'à ce que ce soit repéré. **Avant de considérer un merge sur `main` comme "livré en prod"**, soit (a) vérifier/changer ce réglage Vercel une bonne fois pour toutes vers `main`, soit (b) tant que ce n'est pas fait, resynchroniser manuellement après chaque merge : `git push origin main:claude/new-project-setup-1jcgwf` (force si besoin — c'est sans risque tant que `main` est bien la version à jour). Ne jamais supposer qu'un push sur `main` est allé en prod sans vérifier via `list_deployments` (Vercel MCP) qu'un déploiement `target: "production"` récent correspond au bon commit.
- **Tester en priorité** : (a) l'isolation RLS entre élèves et l'inaccessibilité des notes privées, (b) le verrou « pas payé = pas de résa », (c) la rapidité de la fiche de fin de cours.

---

*Fin du dossier. Construis d'abord le socle (auth, rôles, RLS, modèle de données), puis le mode auteur (programme), puis la fiche de fin de cours, puis les espaces élève/enseignant, puis planning/paiement/chat. En cas d'ambiguïté : applique les Principes directeurs (§3).*
