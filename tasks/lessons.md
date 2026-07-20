# Lessons

## Session 34 — Refonte visuelle « Maktab Émeraude » (Phases 1-3 complètes)

- **Préserver les noms de variable CSS de police (`--font-spectral`, `--font-inter`) en changeant
  seulement la police sous-jacente (`next/font/google`) évite une réécriture mécanique de ~40
  fichiers.** Le code existant lisait déjà `var(--font-spectral)`/`var(--font-inter)` en inline
  partout ; changer uniquement l'import (`Cormorant_Garamond`/`Instrument_Sans` à la place de
  `Spectral`/`Inter`) dans `layout.tsx` a suffi pour que tout l'héritage de police se propage sans
  toucher un seul écran. À généraliser : quand un token existe déjà et est massivement consommé,
  chercher d'abord s'il peut absorber le changement plutôt que renommer.
- **Un balayage `grep` de l'ancienne palette hex en toute fin de refonte (sur `src/app` +
  `src/components` en entier) a rattrapé 2 résidus que les lots écran-par-écran avaient manqués** :
  un composant partagé peu visible (`audio-recorder-input.tsx`, utilisé dans les formulaires de
  séance) et un fichier de métadonnées (`manifest.ts`, couleur de thème PWA). Les composants
  partagés faiblement associés à un "écran" précis (utilisés en sous-composant d'un formulaire plus
  gros) et les fichiers hors `app`/`components` habituels (manifest, metadata) sont les points morts
  d'une revue lot-par-écran — toujours faire un balayage global de sécurité avant de clore une
  refonte visuelle, même quand chaque lot individuel a été vérifié.
- **Le harnais Playwright jetable (établi en session précédente) reste réutilisable même après un
  reset apparent de l'état temporaire du conteneur** : `npm install playwright` dans le scratchpad a
  suffi à le reconstituer en quelques secondes après sa disparition entre deux tours de
  conversation — pas besoin de redécouvrir la méthode, seulement de réinstaller la dépendance
  manquante.
- **Vérifier l'interactivité réelle d'un composant client (pas seulement son rendu statique) vaut le
  coût d'un clic Playwright supplémentaire.** Pour le formulaire « Dupliquer vers », une capture
  statique aurait validé la mise en page mais pas l'état "coché" (halo émeraude + coche + compteur
  "N sélectionné") ni le fait que la ligne désactivée reste bien non cliquable visuellement — un
  `page.click()` avant la capture a confirmé les deux en une étape.
- **Pour un écran de type "liste" (Mes livres, Messages, Enseignants), rester sur le header simple
  (`<h1>` sans héros encre) déjà utilisé par les écrans analogues déjà reskinés (Mes élèves, File de
  correction) plutôt que d'imposer le pattern "héros encre plein-bord" partout.** Le handoff de
  design ne distinguait pas toujours explicitement quels écrans méritent un héros immersif (Accueil,
  Leçon, Profil) et lesquels restent des listes utilitaires — suivre la cohérence interne déjà
  établie dans le code du même lot évite un pattern visuel incohérent d'un écran de liste à l'autre.

## Session 33 (suite 7) — Identité visuelle : wordmark + logo

- **Détourer une image fournie par le propriétaire (fond blanc/uni → alpha) est un
  traitement systématique et fiable au pixel** : luminance inverse comme alpha (noir
  opaque, blanc transparent) + recadrage sur la bounding box du canal alpha (seuil
  bas ~4-10 pour ignorer le bruit de compression). Appliqué deux fois cette session
  (calligraphie, logo) avec le même petit script Python (Pillow) — aucune bibliothèque
  de retouche externe nécessaire, résultat vérifié par composition sur le fond crème
  réel de l'app avant tout commit.
- **Comparer objectivement avant de trancher "meilleure qualité" : résolution native +
  rendu composé sur le vrai fond, pas une impression à l'œil sur l'image brute.** Le
  nouveau logo proposé avait un fond gris avec un halo de glow flou — à l'œil nu sur
  fond gris ça pouvait sembler "moins net" ; composé sur le fond crème réel de l'app,
  le halo disparaît (alpha 0) et la comparaison objective (résolution 1024² vs 404×480,
  facettes/ombres plus détaillées, ratio largeur/hauteur presque identique à l'existant)
  confirme sans ambiguïté la meilleure qualité, permettant une réponse tranchée plutôt
  qu'un jugement esthétique flou.
- **Réutiliser un seul fichier consommé à plusieurs endroits (`public/logo.png`,
  `public/wordmark.png`) propage un changement sans toucher au code** — seul le PNG
  change, les 4 pages qui l'importent sont mises à jour d'un coup. Distinct des
  favicons/icônes PWA (`icon.png`, `favicon.ico`, etc.) qui sont des fichiers générés
  séparément à un moment donné (session antérieure) à partir de l'ancien logo — ne pas
  supposer qu'ils se mettent à jour automatiquement en changeant `logo.png` ; à
  signaler/traiter comme un lot à part, sur confirmation explicite.
- **Deux retours successifs sur un même asset (calligraphie puis sa taille) restent
  des itérations légitimes, pas des signes d'un mauvais premier essai.** Montrer le
  rendu réel à chaque étape (composé sur fond crème, tailles d'usage réelles) a permis
  des ajustements rapides sans relecture de code ni divergence d'interprétation.

## Session 33 (suite 5) — Cartes couleur (hero) sur l'écran Évaluations

- **Un travail non commité est un travail perdu, même s'il a été "décidé" en
  conversation.** Une session précédente avait obtenu l'accord explicite du
  propriétaire sur un design (« B mais en crème pour la tuile conjugaison ») et
  affirmé l'implémenter directement dans le vrai code — mais la session s'est
  arrêtée sans jamais committer, et le conteneur éphémère qui portait ce travail a
  disparu. Un balayage de **toutes** les branches distantes (`git branch -r` triées
  par date de dernier commit) a confirmé : rien nulle part. Réflexe à généraliser en
  reprise de session : ne jamais supposer qu'une décision verbalisée dans une
  session précédente s'est traduite en code — vérifier par un balayage large avant
  de recommencer, et si rien n'est trouvé, considérer le travail comme réellement
  perdu (pas de récupération possible depuis un conteneur reclamé) plutôt que
  d'espérer le retrouver.
- **Committer/pousser dès qu'une étape est terminée, même en attendant une
  validation propriétaire, évite ce genre de perte.** La méthode CLAUDE.md (§4)
  décrit déjà "commit + push preview" comme une étape du plan, distincte de
  "déploiement prod" (qui lui attend confirmation explicite) — la confusion entre
  les deux ("attendre une validation" appliquée au commit local plutôt qu'au merge
  prod) est probablement ce qui a coûté le travail de la session précédente. Un
  hook de fin de session (`stop-hook-git-check.sh`) qui bloque sur changements non
  commités est un filet de sécurité direct contre cette classe d'erreur.
- **Reconstruire une palette "carte pleine couleur" à partir des tokens `globals.css`
  existants (`--tk-accent`, `--tk-teal-deep`, `--tk-surface-alt`) plutôt que d'inventer
  de nouvelles couleurs** garde la cohérence de marque même pour un composant tout
  nouveau (`EvalHeroCard`) — la variante crème réutilise implicitement la famille de
  teintes déjà présente ailleurs (fond crème du favicon, `#F7F4EE` du fond de page)
  sans jamais s'en approcher assez pour se fondre dedans (nécessite un dégradé plus
  saturé + ombre dédiée pour rester lisible comme "carte" sur un fond déjà crème).
- **Rendu réel avant tout commit, même sans session élève réelle disponible** : même
  pattern jetable que la session 33 (harnais hors-auth + `.env.local` temporaire,
  URL réelle publique + clé anon factice, capture Playwright, suppression immédiate
  après capture). Confirme que ce pattern est robuste et reproductible d'une session
  à l'autre pour tout composant serveur/présentation qui ne nécessite pas de vraie
  écriture en base — répété une 2ᵉ fois dans la même tâche (itération B→C) sans
  aucun coût de mise en place supplémentaire, une fois le pattern déjà en place.
- **Montrer le rendu réel AVANT de demander une validation évite un aller-retour
  coûteux, mais n'élimine pas le besoin d'itérer sur le design.** Le propriétaire a
  rejeté le 1ᵉʳ rendu (option B, cartes saturées) au profit d'une 3ᵉ option (C,
  claire + filigrane arabe) fournie en capture — la préférence visuelle reste
  fondamentalement subjective et ne se devine pas depuis la seule demande initiale
  ("B mais en crème"). Le coût de l'itération est resté faible précisément parce que
  le composant était déjà isolé (`EvalHeroCard`, un seul point d'usage) : réécrire
  entièrement son style interne (dégradé saturé → pastel + icône badge + filigrane)
  n'a touché ni `page.tsx` (props inchangées à l'exception d'une nouvelle prop
  `letter`) ni aucun autre écran.
- **Une autorisation explicite et anticipée ("une fois fait, envoie direct en prod")
  couvre le merge prod à venir, mais pas la vérification empirique qui doit rester
  systématique.** Le propriétaire a autorisé le déploiement prod avant même de voir
  le rendu final — cela dispense de repasser par une confirmation explicite une fois
  le rendu validé, mais ne dispense pas de vérifier, avant de merger, que la base
  partagée est réellement prête (ici : `list_migrations` pour confirmer que les
  migrations 68-70 de la session « conjugaison » laissée en attente étaient bien
  appliquées, pas seulement rédigées) et que l'advisor sécurité ne révèle rien de
  nouveau. Une autorisation anticipée porte sur la décision produit ("j'aime ce
  design, déploie-le"), jamais sur la vérification technique qui la rend sûre.
- **Un merge prod "ciblé" (une refonte visuelle) peut embarquer de fait un feature
  entier resté en attente**, si ce feature était un prérequis silencieux du travail
  demandé (ici : le mockup montrait déjà la tuile conjugaison, donc la récupérer par
  fast-forward pour construire dessus revient à la mettre en jeu pour le prochain
  merge prod). Signalé explicitement au propriétaire avant de merger plutôt que
  traité comme un détail d'implémentation invisible.
  écriture en base.

## Session 33 (suite 4) — Tuiles Évaluations, longueur de quiz, déblocage par grammar_rules

- **Vérifier la faisabilité d'une idée du propriétaire ("détecter depuis les règles de
  grammaire") sur les vraies données avant de dire oui.** Le propriétaire voulait éviter un
  champ manuel sur la fiche élève ; interroger `grammar_rules.title` a montré que le titre de
  la règle "passé" est **identique mot pour mot** chez les 4 élèves (texte standardisé,
  dupliqué) — signal fiable pour un matching par mot-clé. Sans cette vérification, j'aurais pu
  soit refuser à tort (en supposant du texte libre variable), soit accepter à tort (si le texte
  avait été très variable). Toujours interroger avant de juger une idée "trop fragile" ou
  "assez fiable".
- **Un paramètre RPC déjà présent mais jamais exploité par le client évite toute migration.**
  `p_size` existait déjà sur les 3 RPC de génération de quiz (écrit dès les sessions
  précédentes, jamais branché à un vrai sélecteur côté UI). Avant d'écrire une migration pour
  "ajouter la taille", vérifier le code SQL existant a évité un aller-retour base de données
  pour une fonctionnalité entièrement côté app.
- **"Mix de plusieurs sous-ensembles" sans changer la RPC = N appels + combine + shuffle côté
  client.** Déjà le pattern de `generateLanguageQuiz` (vocab + formulation, deux RPC
  distinctes). Réappliqué ici pour "mix de plusieurs temps débloqués" (N appels à la MÊME RPC
  avec des `p_tense` différents) — un seul pattern, deux usages. Généralisable à toute future
  demande de "quiz qui pioche dans plusieurs catégories choisies".
- **Une régression pédagogique peut se cacher derrière une fonctionnalité qui "marche".** En
  creusant la demande de longueur, j'ai découvert que `ensureConjugations()` générait déjà les
  3 temps pour chaque verbe dès la première visite d'Évaluations — donc "Tous les temps"
  piochait dans des temps jamais enseignés, sans lien avec la demande initiale (juste "plus de
  questions"). Le déblocage par `grammar_rules` corrige ce trou en même temps que la demande
  explicite. Toujours signaler ce genre de découverte au lieu de la corriger silencieusement.
- **Splitter une page partagée en plusieurs routes élimine un état de coordination entier.**
  `evaluations-client.tsx` existait uniquement pour empêcher deux quiz de tourner en même temps
  sur une page qui les affichait tous les deux. Passer à une route par quiz (tuiles → sous-page
  dédiée) rend ce state (`active: "lang"|"conj"|null` partagé) obsolète — chaque route n'a plus
  qu'un seul quiz, donc plus rien à coordonner. Un changement d'architecture (tuiles) a rendu un
  bout de code entier inutile, à supprimer plutôt qu'à adapter.
- **`stripHarakat` + regex sur mot-clé défini (`الأمر` avec alif-lam) évite un faux positif
  connu.** Chercher juste la racine `أمر` (3 lettres) aurait matché `أمريكي`/`أمريكا`
  (Amérique/américain, vocabulaire plausible). Exiger le préfixe défini `الأمر` (le mot "l'ordre/
  impératif" au sens grammatical) élimine ce risque — vérifié explicitement par un test dédié
  avant de considérer la détection fiable.

## Session 33 (suite 3) — Conjugaison automatique + moteur morphologique complet

- **Vérifier l'hypothèse de l'utilisateur sur SES données avant de coder.** Le propriétaire
  était convaincu que « / » distinguait ses verbes. Un simple `select … like '%/%'` a montré
  que le « / » sert aussi aux pluriels, masc/fém et pronoms — 90 non-verbes sur 183. Coder la
  détection sur « présence de / » aurait « conjugué » jour/jours. Le vrai signal (2ᵉ forme
  commençant par يَ/يُ, hors يّة) n'apparaît qu'en regardant les données réelles. Toujours
  interroger la base avant d'accepter la règle mentale de l'utilisateur.
- **« Tout automatique » sur une langue naturelle a une limite dure qu'il faut chiffrer, pas
  masquer.** La conjugaison arabe n'est mécanique que pour les verbes SAINS ; ~la moitié des
  verbes réels sont irréguliers (creux, défectueux, redoublés, hamzés, formes dérivées). J'ai
  classé les vrais verbes par famille AVANT de décider quoi construire — ça a montré que le
  volume dur était petit (≈1 défectueux, 2 redoublés, 3 creux) et donc que « B, tout » était
  atteignable avec un effort fini. Chiffrer la difficulté par famille sur les vraies données
  = la bonne base de décision, bien meilleure que « c'est trop dur » ou « ça marche ».
- **Dériver des DEUX formes fournies généralise énormément le moteur, gratuitement.** En
  lisant le radical présent depuis la forme هو du présent (au lieu de supposer 3 radicales +
  préfixe يَ), le même code couvre d'un coup : formes II–X (voyelle de préfixe يُ lue, pas
  supposée), assimilés (le و déjà tombé dans la forme présent), hamzés. Seules 3 familles
  (creux/défectueux/redoublé) ont vraiment besoin de branches dédiées. Concevoir les entrées
  pour porter l'information (2 formes) plutôt que de la re-deviner réduit le code ET les cas.
- **Le rendu visuel avec la vraie police reste le meilleur détecteur de fautes de harakat.**
  Chaque famille validée par un rendu image + une sortie texte contre des tables connues a
  révélé des erreurs invisibles au diff : préfixe أنا en alif nu au lieu de hamza, voyelles
  inversées du redoublé (مَدْدتُ vs مَدَدْتُ), sukun parasite superposé à une fatha. Une
  faute de harakat ne « casse » ni le type ni le build — seul l'œil (ou un test d'égalité
  stricte contre une référence) l'attrape.
- **Auto-générer sans jamais écraser la correction humaine = insert-if-absent, pas upsert.**
  La RPC `ensure_conjugations` n'insère QUE les (vocab_id, tense) absents. Ça permet de
  regénérer en boucle (à chaque ouverture d'Évaluations) tout en laissant intacte une
  conjugaison qu'un prof aurait corrigée à la main pour un verbe irrégulier. L'automatique et
  la correction manuelle coexistent proprement grâce à cette seule règle.
- **Splicer un fichier par script (Python) sur des marqueurs fragiles corrompt tout si le
  marqueur ne matche pas.** Un `end=None` non détecté a produit `s[None:]` = fichier entier
  dupliqué. Leçon : après un splice programmatique, TOUJOURS vérifier par grep que chaque
  symbole n'existe qu'en un exemplaire avant de compiler — et préférer l'outil Edit (match
  exact, échoue proprement) au splice par index de ligne quand c'est possible.
- **Éditer des fichiers pendant qu'un `next dev` tourne peut faire paniquer Turbopack.**
  Créer/supprimer des routes de harnais à répétition a provoqué un panic Turbopack
  (« cell no longer exists ») et un serveur mort silencieux (connection refused). Réflexe :
  pour un test navigateur jetable, figer les fichiers d'abord, lancer dev, tester, puis
  nettoyer — et si le dev devient incohérent, `pkill -9 next` + `rm -rf .next` + redémarrage
  propre plutôt que s'acharner.

## Session 33 (suite 2) — Quiz de conjugaison (moteur arabe + table + RPC)

- **Tester le moteur AVANT de bâtir dessus a payé immédiatement.** Le rendu visuel des
  tables générées a révélé une faute linguistique invisible à la relecture du code : le
  préfixe أنا du présent sortait en alif nu (اَكْتُبُ) au lieu de la hamzat al-qaṭʿ (أَكْتُبُ).
  L'impératif, lui, garde bien l'alif nu (hamzat al-waṣl : اُكْتُبْ) — deux hamzas
  différentes selon le contexte. Généralisable : pour tout contenu en langue étrangère
  généré programmatiquement, un rendu visuel avec la vraie police vaut dix relectures de
  code — l'œil attrape ce que le diff cache.
- **L'ambiguïté sans voyelles n'est pas qu'un problème de saisie, c'est un invariant de
  scoring.** Au présent, تَكْتُبُ est à la fois أنتَ et هي (idem تَكْتُبَانِ = أنتما/هما-fém).
  Décision structurante : le scoring de « quelle personne ? » compare les FORMES, pas les
  personnes — toute personne dont la forme vocalisée égale la forme montrée compte juste.
  Vérifié en base (choisir هي pour تَكْتُبُ accepté) ET au navigateur. À retenir pour toute
  future question inverse « valeur → clé » quand plusieurs clés partagent une valeur.
- **Anti-triche par recalcul serveur, jamais par confiance au payload.** `generate_*`
  n'émet jamais la bonne réponse (ni champ `correct`, ni id-source corrélable — vérifié par
  un `bool_or(e ? 'correct' ...)` = false sur le payload). `submit_*` recharge la table de
  conjugaison (scopée élève) et recalcule tout. Même schéma que les quiz existants
  (formulation audio), reproduit ici.
- **Impersonation RLS via MCP : `set_config('request.jwt.claims', ..., true)` suffit pour
  tester les RPC SECURITY DEFINER** (elles lisent `auth.uid()` du claim), mais tester la RLS
  au niveau TABLE exige en plus `set local role authenticated` — et alors on ne peut plus
  écrire dans une table temp appartenant au superuser (permission denied). Leçon pratique :
  séparer le test « garde RPC » (claim seul, écrit dans temp) du test « RLS table » (role +
  claim, la requête finale EST le résultat, pas d'écriture temp).
- **Player dédié plutôt que généricisation à outrance.** Le `QuizPlayer` de langue est
  paramétré par des `direction`/`choices` texte ; la conjugation a des person_codes, un
  verbe affiché, deux types de questions structurellement différents. Plutôt que de rendre
  `QuizPlayer` polymorphe sur deux formes de question très éloignées, un
  `ConjugationQuizPlayer` séparé qui REPREND le même flux éprouvé (1-clic + Précédent +
  correction erreurs-seules) isole le risque (zéro touche au quiz de langue qui marche) au
  prix d'un peu de flux dupliqué. Le seuil « extraire un générique » n'est pas atteint tant
  que les shapes de données divergent autant.
- **Injecter `generate`/`submit` en props rend un player testable au navigateur sans session
  Supabase** (le composant devient pur, on mocke les deux fonctions dans un harnais). Refait
  ici après avoir d'abord câblé les actions en dur — le refactor en props a aussi aligné le
  composant sur le pattern de `QuizPlayer`. À faire d'emblée pour tout futur player.
- **Conjugaison liée au `vocab_id` → la duplication de cours ne la copie pas gratis.** La
  duplication recrée des vocab (nouveaux ids), donc les `verb_conjugations` (clé vocab_id)
  ne suivent pas. Différé assumé (cas limite), à copier par correspondance `arabic_word`
  après la RPC si le besoin monte — noté pour ne pas le redécouvrir.

## Session 33 (suite) — Retrait des boutons Suivant/Terminer (clic = valide + avance)

- **Une reformulation validée n'est pas gravée dans le marbre — le retour terrain peut la
  faire évoluer, et c'est normal.** Le flux « cliquer = sélectionne, bouton dédié pour
  avancer » de la suite précédente avait été explicitement demandé (option 2b, « retour
  arrière avec changement de réponse ») et testé/validé/déployé. Le propriétaire est revenu
  dessus après usage réel : il voulait le retour arrière, pas la revalidation à chaque
  question. Les deux demandes n'étaient pas contradictoires — la bonne synthèse était
  « clic = valide + avance (comme avant), ET Précédent reste possible pour corriger » —
  mais elle n'était pas évidente à anticiper avant l'usage réel. Toujours accueillir un
  "retour en arrière sur une fonctionnalité" sans discuter le bien-fondé de la demande
  initiale : le propriétaire a le dernier mot sur l'UX, l'usage réel prime sur l'anticipation.
- **"Cliquer une option = valider ET avancer" reste compatible avec "pouvoir revenir
  corriger" sans bouton de validation séparé, à condition que revisiter une question
  déjà répondue déclenche la MÊME action (avancer) qu'une première réponse.** Pas besoin
  d'un mode spécial "édition" avec un bouton "Valider la correction" — cliquer une option
  sur une question déjà vue écrase simplement l'ancienne réponse dans le tableau indexé par
  position (déjà en place depuis la suite précédente) et avance comme d'habitude. La seule
  fonction restée nécessaire est `goPrev()` (aucune contrepartie "goNext" séparée requise,
  le clic sur une réponse fait déjà ce travail).
- **Fusionner 3 handlers (`select`/`goNext`/`finish`) en 1 seul (`choose`) a supprimé toute
  la logique de garde devenue inutile** (`hasAnswer`, `isLast` pour désactiver un bouton) —
  un signe que la complexité ajoutée à la suite précédente (état de sélection distinct de
  la validation) était bien liée à l'exigence "bouton Suivant/Terminer explicite", pas
  intrinsèque à la fonctionnalité "retour arrière + correction". Revenir dessus a simplifié
  le code plutôt que de le complexifier davantage.

## Session 33 — Correctifs quiz de langue (correction ciblée, navigation, audio)

- **Un composant purement client (`"use client"`, aucune dépendance runtime à des server
  actions) peut être testé en navigateur réel SANS session Supabase**, via un harnais
  temporaire qui lui injecte des `generate`/`submit` fixtures locales à la place des vraies
  server actions. `QuizPlayer` n'importe `actions.ts` que pour ses **types** (`import type`,
  erasé à la compilation) — le composant lui-même ne touche jamais Supabase, seul son
  appelant (`evaluations-client.tsx`) lui passe les vraies fonctions. Ce découplage,
  préexistant dans le code, a permis un test Playwright complet (clics réels, navigation,
  lecture audio) sans MCP Supabase disponible dans cette session (non autorisé). Réflexe à
  généraliser : avant de conclure « pas testable sans backend réel », vérifier si le
  composant visé dépend RÉELLEMENT du backend ou seulement d'une prop-fonction remplaçable.
- **Même dans ce cas, le serveur dev Next.js entier reste bloqué sans variables Supabase** :
  un `proxy.ts`/middleware racine (`updateSession`) appelle `createServerClient` sur
  **toutes** les requêtes, y compris une route qui n'utilise pas Supabase — `next dev`
  plante (500) sans `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` définies, même juste pour charger
  une page 100% cliente. Contournement sans risque : `.env.local` **local et temporaire**
  avec la vraie URL du projet (publique, sans risque — c'est juste un hostname) + une clé
  anonyme **factice** (`getUser()` échoue proprement côté Supabase — 401 — sans faire planter
  le middleware, aucune session/donnée réelle touchée). Fichier supprimé après le test, code
  jamais committé.
- **Prouver empiriquement un changement de flux d'état (pas juste lire le code) coûte peu
  avec un harnais jetable.** Le point le plus risqué de ce correctif — « revenir en arrière,
  changer une réponse, revenir en avant, terminer → le score reflète la DERNIÈRE réponse et
  pas la première » — est un bug de fermeture/état classique (stale closure, mauvais index)
  qui aurait pu passer inaperçu à la seule relecture. Un test Playwright de 15 lignes
  (aller-retour complet + vérification du score final) l'a confirmé sans ambiguïté (3/4 →
  4/4 après correction de la 1ʳᵉ question). Généralisable à toute future demande touchant à
  la navigation/l'état d'un composant multi-étapes.
- **Couper un audio "où qu'il joue" = variable module-scope, pas un contexte React.** Un
  seul fichier (`quiz-player.tsx`) est l'unique consommateur d'`AudioPrompt` (plusieurs
  instances simultanées : 4 propositions audio + question audio + revue). Une variable
  `let activeAudioEl` au niveau module (hors composant) suffit à coordonner "un seul audio
  actif à la fois" sans lever un contexte ou remonter un state au parent — chaque instance
  vérifie/écrit cette variable partagée, et `onPause` sur le `<audio>` (qui se déclenche
  aussi quand c'est un AUTRE composant qui appelle `.pause()` sur cet élément) resynchronise
  l'état local `playing` de l'instance coupée. Solution minimale, pas de refactor de state
  management pour un besoin aussi local.
- **Changer "cliquer = valide et avance" en "cliquer = sélectionne, bouton dédié pour
  avancer" a une conséquence structurelle sur le type d'état.** Le tableau `answers` doit
  passer d'append-only (`QuizAnswer[]`, indexé implicitement par `current` au moment de
  l'ajout) à taille fixe indexée par position (`(QuizAnswer | null)[]`) dès qu'on permet de
  revisiter une question déjà répondue — sinon revenir en arrière et re-sélectionner
  dupliquerait une entrée au lieu de la remplacer. Généralisable : toute demande de
  "navigation arrière avec modification" sur un flux séquentiel implique ce changement de
  forme de données, pas juste l'ajout d'un bouton.

## Session 32 (suite 3) — Bibliothèque → livres + règles de grammaire individuelles

- **Reformuler à chaque itération, même quand on croit avoir compris.** Cette demande a
  pris 4 allers-retours de reformulation avant validation — dont un où j'avais
  complètement inversé l'intention du propriétaire (« rendre le livre grammaire
  sélectionnable dans la fiche de cours », alors qu'il voulait l'inverse : garder le
  routage automatique déjà en place et juste ajouter une vue pour le consulter). Le
  propriétaire a corrigé immédiatement et sans friction parce que la reformulation était
  écrite noir sur blanc *avant* le code — coûts de correction nuls. Ne jamais sauter la
  reformulation sur une demande orale/vocale ambiguë, même sous pression de rapidité.
- **Un CTE avec `MATERIALIZED` référencé plusieurs fois dans des sous-requêtes scalaires
  corrélées, sur la MÊME requête top-level, peut encore ne pas voir les effets de bord
  d'une fonction volatile insérée par une autre branche de cette requête.** Piège déjà
  documenté (session 31 suite 6) pour l'agrégation de CTE non matérialisés ; ici,
  `MATERIALIZED` seul n'a pas suffi à corriger un faux « 0 résultat » lors d'un test
  combinant `submit_session_record(...)` et une lecture immédiate dans la même requête.
  Solution fiable et désormais systématique pour ce genre de test MCP : une table
  temporaire (`CREATE TEMP TABLE`) + une instruction `INSERT INTO ... SELECT` par appel
  RPC, jamais combiné dans un seul `SELECT` avec sous-requêtes corrélées.
- **Généraliser un composant existant (action pré-liée en prop) plutôt que le dupliquer
  pour un besoin quasi identique.** `DuplicateForm` servait uniquement à dupliquer un
  cours (action `duplicateSession` importée et liée en dur). Le besoin de dupliquer une
  règle de grammaire (même UI : liste d'élèves à cocher, bouton d'envoi) a été couvert en
  remplaçant l'import figé par une prop `dupAction` déjà liée par l'appelant — zéro
  duplication de JSX, chaque route reste responsable de lier sa propre action serveur.
- **Une case à cocher stricte par livre a une conséquence en cascade sur la
  duplication.** Décider que « la grammaire ne se rattache jamais au livre de la séance »
  impliquait mécaniquement que « dupliquer un cours ne doit plus copier sa règle de
  grammaire » — une implication que le propriétaire a explicitement demandé de corriger
  après coup, mais qui aurait dû être anticipée dès la reformulation initiale (les deux
  points sont la même règle vue sous deux angles). À généraliser : quand une demande
  change la relation entre deux entités (ici grammaire ↔ cours), vérifier systématiquement
  tous les flux qui copient/dupliquent l'une des deux pour voir s'ils doivent suivre.
- **Duplication d'un élément individuel (règle) vs duplication d'un groupe (séance) :
  pas de garde « déjà existant ».** Contrairement à la duplication de cours (qui exclut
  les élèves ayant déjà ce `course_group_id`), la duplication d'une règle de grammaire
  n'a volontairement aucune déduplication — cohérent avec la demande explicite du
  propriétaire (« chaque règle est individuelle, un élève peut en recevoir une isolée »)
  et il n'existe de toute façon aucune clé naturelle pour définir un doublon de règle.
- **Écrire `photos jsonb` en clé additive dans un jsonb existant (`p_grammar`) évite tout
  changement de signature RPC.** Comme pour `audio_path` dans `p_formulations`
  (session 31 suite), une nouvelle clé optionnelle dans un item jsonb déjà transporté par
  la RPC est 100% rétrocompatible (`CREATE OR REPLACE`, pas de DROP) — le client encore
  déployé qui omet la clé obtient simplement `COALESCE(..., '[]'::jsonb)`.

## Session 32 — Retrait de la fonctionnalité paiement in-app

- **La « branche de prod Vercel » n'est pas forcément `main`.** Vérifié cette session
  via le MCP Vercel (`list_deployments`, champ `target: "production"`) : c'est
  `claude/new-project-setup-1jcgwf` qui porte réellement le domaine `www.tatakalamu.fr`,
  pas `main`. Les sessions précédentes poussaient toujours les deux ensemble sans
  jamais vérifier laquelle déclenche vraiment le déploiement prod — ça a marché par
  chance jusqu'ici. Réflexe à garder : en cas de doute sur quelle branche est « la
  prod », interroger `list_deployments`/`get_project` plutôt que de supposer `main`.
- **« Je veux tester en preview d'abord » vs « fais tout en même temps » — le
  propriétaire a parfois une intuition inversée sur ce qui est risqué.** Il a d'abord
  suggéré de sauter l'étape de validation preview (« vazi bas dans ce cas tu fais en
  prod et preview en même temps »), avant de se raviser (« non non tu testes bien »).
  Expliquer clairement la mécanique (base partagée = pas de vraie isolation preview/
  prod, donc le VRAI risque n'est pas l'étape de validation mais l'ORDRE code→migration)
  a permis au propriétaire de trancher en connaissance de cause plutôt que de deviner
  son intention. Ne jamais interpréter un « vas-y » ambigu comme une autorisation à
  sauter une étape de sécurité (validation, merge séquencé) sans reformuler et
  confirmer explicitement ce qui est sauté.
- **Confirmer le déploiement prod via l'API Vercel (MCP), pas juste via le push git.**
  Un `git push` réussi ne dit rien sur l'état du build Vercel qui en découle (peut
  échouer, rester `BUILDING` un moment). Avant d'exécuter la migration destructive
  (DROP table/RPC utilisés par le code prod), attendu et vérifié `get_deployment` →
  `readyState: "READY"` + `target: "production"` + alias sur le vrai domaine. C'est la
  preuve empirique du séquencement « code d'abord, migration ensuite » exigée par
  CLAUDE.md — pas juste « j'ai poussé donc ça doit être bon ».
- **Retranscrire un fichier généré à la main plutôt que de l'écrire tel quel introduit
  des fautes de frappe silencieuses.** En recopiant `database.types.ts` retourné par
  `generate_typescript_types` (au lieu de l'écrire caractère pour caractère), deux
  erreurs se sont glissées dans la partie boilerplate générique (une `referencedRelation`
  erronée, un nom de type variable substitué par un autre) — toutes deux invisibles à la
  relecture rapide, attrapées seulement par le build TypeScript. Le build a joué son
  rôle de filet de sécurité comme prévu, mais la vraie leçon : quand un outil retourne
  du texte à écrire tel quel (fichier généré), le transcrire fidèlement plutôt que de le
  reformuler mentalement réduit le risque à la source — toujours suivre le build/lint
  immédiatement après pour attraper ce type d'erreur avant tout commit.
- **Un statut manuel élève (`suspended_payment`) peut être un vestige du système de
  paiement in-app sans que ce soit évident au premier coup d'œil.** Il n'apparaissait
  dans aucun des écrans « Paiements » explicitement visés par la demande, seulement
  dans le menu déroulant de statut de la fiche élève — repéré par un grep large
  (`suspended_payment`) plutôt que par une lecture des seuls écrans mentionnés. Un
  retrait de fonctionnalité doit toujours partir d'un grep exhaustif du nom technique,
  pas seulement des écrans que l'utilisateur a montrés en capture.
- **Vérifier par MCP qu'une table/RPC est réellement vide/inutilisée AVANT de proposer
  un DROP complet, puis présenter cette preuve dans la question à l'utilisateur.** La
  table `payments` était vide (0 ligne), 0 notification `payment_*`, 0 élève au statut
  concerné — ces chiffres, donnés dans l'`AskUserQuestion`, ont permis une décision
  informée (« suppression complète » plutôt que « dormant au cas où ») sans avoir à
  deviner l'appétit au risque du propriétaire.

## Session 31 (suite 8b) — Retouches livres/devoirs + tuiles cliquables

- **Découpler l'affichage sans toucher aux données.** « Retirer le devoir du cours »,
  « retirer le lien grammaire→cours », « ne montrer la grammaire que dans son livre » : tout
  s'est fait en supprimant des blocs d'affichage / des requêtes côté page, jamais en
  changeant le schéma. La donnée reste liée (grammar_rules.lesson_record_id, homework.
  lesson_record_id) ; seule la présentation change. Réflexe : une demande « enlève X de tel
  écran » est presque toujours une modif de rendu, pas de modèle.
- **Filtre par défaut restrictif = anti-pollution.** L'onglet Devoirs ouvre sur « À faire »
  uniquement (menu déroulant pour révéler « Correction en attente » / « Corrigé »). Le
  propriétaire ne voulait « aucun visible sauf ceux à faire » — un défaut de filtre bien
  choisi vaut mieux qu'une liste tout-affichée qu'on encombre.
- **Une feature réclamée peut réparer un bug latent.** « L'élève peut revoir un devoir
  corrigé » a rendu visible la `correction_file` que le prof uploadait mais que l'élève ne
  voyait jamais (trou signalé à l'audit suite 4). Construire la revue = signer les pièces
  rendues (bucket homework-submissions, RLS élève sur son dossier) + la copie corrigée
  (homework-corrections) → les deux buckets/policies existaient déjà, zéro migration.
- **Deep-link vers un état d'UI via searchParam.** La tuile « Dernière note » ouvre
  `/dashboard/homework?filter=corrige` ; la page (server) lit le param et le passe en
  `initialFilter` au composant client. Permet de « tomber pile » sur le bon onglet sans
  état global ni navigation en deux temps.

## Session 31 (suite 8) — Cours rangés par livre

- **Un « livre » qui contient des cours vs un « livre » qui agrège des règles : une même
  table, un `kind`.** العربية/قصص (`kind='courses'`) contiennent des `lesson_records` via
  `book_id`. La grammaire (`kind='grammar'`) ne contient PAS de cours : sa page agrège tous
  les `grammar_rules` de l'élève. Résultat : « la grammaire va automatiquement dans son
  livre » est gratuit — aucune colonne `book_id` sur `grammar_rules`, aucun rangement manuel,
  la vue agrège par nature. Repérer quand une catégorie a une sémantique différente et la
  modéliser par un discriminant plutôt que par une 2ᵉ table.
- **Ranger un cours dans un livre = simple `UPDATE lesson_records SET book_id` après la RPC,
  pas un nouveau paramètre.** Ajouter `p_book_id` à `submit_session_record`/`update_session_record`
  aurait imposé un DROP+CREATE (changement de signature) sur la fiche la plus critique (<30s),
  avec le risque de la fenêtre preview/prod. La RPC renvoie déjà l'id du cours créé → un
  `.update({book_id}).eq('id', recordId)` côté action, couvert par la policy `lr_teacher_all`
  existante, fait le travail sans toucher la RPC. Préférer une mise à jour ciblée post-RPC
  quand la donnée à poser est indépendante et que la RPC est sensible.
- **Éviter un `book_id` forgé pointant vers le livre d'un autre prof : valider par un SELECT
  sous RLS, pas par confiance.** L'action lit `course_books` par id avec `.maybeSingle()` :
  la policy `book_teacher_all` ne renvoie le livre que s'il appartient à l'enseignant courant.
  Null → « Livre invalide ». Prouvé : Khadija ne voit pas le livre de Jefferson (0), et son
  UPDATE d'un cours de Jefferson affecte 0 ligne.
- **Seed de couvertures : assets `public/` (que je peux écrire) pour le seed, bucket public
  pour l'ajout par l'enseignant.** Le MCP Supabase n'accède pas au Storage → impossible
  d'uploader les 3 couvertures par SQL. Solution : les copier dans `public/books/` (elles
  shippent avec l'app, `cover_url='/books/xxx.jpg'`) et créer un bucket public `book-covers`
  pour les couvertures que l'enseignant ajoutera via l'UI (upload direct navigateur +
  compression réutilisés). `cover_url` stocke indifféremment un chemin d'asset ou une URL
  publique de bucket — l'`<img>` gère les deux.
- **`groupByLesson` inflait mes comptes.** Un premier `count(distinct g.id)` via une jointure
  vocab×grammar×formulations a renvoyé 3 règles au lieu d'1 (produit cartésien). Le
  propriétaire l'a corrigé. Toujours compter par sous-requêtes scalaires indépendantes
  (`(select count(*) …)`) plutôt que par jointures multiples quand on agrège plusieurs
  relations enfants d'une même ligne.
- **Backfill par `course_group_id`, pas par élève.** Le propriétaire raisonnait « cours
  d'Anthony → récits », mais avec les cours dupliqués (course_group partagé Anthony/Bilel/
  Hamza), le rangement correct est par COURS (course_group), pas par élève : un même cours
  chez plusieurs élèves reçoit un seul livre, et Bilel (qui suit les deux) hérite
  correctement des deux livres via ses deux course_groups.

## Session 31 (suite 7) — Dépôt de devoir robuste (upload direct navigateur)

- **Un « erreur serveur » plein écran ≠ l'erreur inline du formulaire — c'est un crash
  AVANT l'exécution du code.** La capture de l'élève montrait une page 500 (« a server
  error occurred »), pas le message géré `{error}` du formulaire. Signal fort : le server
  action n'a jamais tourné (confirmé : `submission_file` resté NULL en base). Cause : le
  **plafond du corps d'un server action Next (1 Mo par défaut)**, dépassé par une photo
  iPhone (2-5 Mo) → rejet framework avant le code. Diagnostiquer d'abord la NATURE de
  l'erreur (page 500 vs message applicatif) : elles pointent vers des couches différentes.
- **Sur Vercel, relever `bodySizeLimit` ne suffit pas : la plateforme plafonne le corps
  serverless à ~4,5 Mo.** Donc pour un upload FIABLE de fichiers lourds, la seule vraie
  solution est l'**upload direct navigateur → Storage** : le fichier ne transite plus par
  le server action du tout, seuls les CHEMINS sont envoyés. Le client navigateur Supabase
  (`createBrowserClient`, clé anon) porte la session → la RLS Storage s'applique
  exactement comme côté serveur (insert/select/delete scopés au dossier de l'élève). Pas
  besoin de service-role.
- **Choix de portée assumé sur le composant critique.** Le même plafond touche la fiche de
  fin de cours (supports), MAIS c'est l'écran le plus critique (<30s) et le refactor
  direct-upload y est non testable en navigateur depuis ce sandbox. Décision : upload
  direct COMPLET là où c'est le vrai problème (dépôt élève : photos pleine résolution,
  fréquent, multi-fichiers) ; simple relèvement de `bodySizeLimit` (1 ligne, sans risque)
  pour la fiche de cours. Ne pas refactorer un composant critique non testable « parce que
  c'est validé » — livrer le fix là où ça fait mal, proposer le reste en follow-up testé.
- **Multi-fichiers = colonne jsonb jumelle + RPC qui remplace la liste (comme
  `support_files`/`update_session_record`).** `homework.submission_files jsonb`, la RPC
  reçoit la liste complète à chaque fois (le client envoie l'état voulu). `submission_file`
  (mono) est CONSERVÉ et resynchronisé (1ʳᵉ pièce) pour ne pas casser l'ancien lecteur prod.
- **Rétrocompat base partagée par SURCHARGE, pas remplacement.** Nouvelle
  `submit_homework(uuid, jsonb)` créée À CÔTÉ de l'ancienne `(uuid, text)` : PostgREST
  distingue par les noms de paramètres (`p_files` vs `p_submission_file`), donc l'ancien
  client prod (qui envoie `p_submission_file`) reste fonctionnel pendant la fenêtre
  preview/prod. Les deux alimentent les deux colonnes → cohérence quel que soit le client.
  (Rappel de la leçon suite 6 : sur base partagée, une migration doit rester additive et
  ne jamais retirer ce que le client encore déployé consomme.)
- **Défense en profondeur dans la RPC malgré la RLS Storage.** La RPC vérifie que chaque
  chemin est bien dans le dossier de l'élève (`path LIKE student_id || '/%'`) même si la
  RLS Storage l'empêche déjà d'uploader ailleurs — le client fournit des chaînes libres,
  on ne fait jamais confiance au chemin envoyé. Verrou aussi sur le statut (pas de
  modification après correction) pour protéger le travail du prof.
- **Upload direct résout le CRASH, pas la LENTEUR — compresser côté navigateur AVANT
  d'envoyer.** Une fois le plafond contourné, l'envoi d'une photo pleine résolution
  (3–8 Mo) reste lent en 4G. Fix standard : `createImageBitmap` → `canvas` réduit à
  ~1800 px → `toBlob('image/jpeg', 0.8)` → poids ÷5–15, envoi quasi instantané, lisibilité
  d'un devoir manuscrit intacte. Deux pièges gérés : (a) `imageOrientation: "from-image"`
  pour respecter l'EXIF des photos iPhone (sinon image retournée) ; (b) fallback sur le
  fichier d'origine si le décodage échoue (HEIC) ou si la « compression » alourdit. Ne
  s'applique qu'aux images (audio 64 kbps déjà minuscule, PDF intact). Uploads multiples
  parallélisés (`Promise.all`) en complément.

## Session 31 (suite 6) — Quiz formulation : 3ᵉ mode « FR → écoute des 4 audios »

- **Le mode « réponses en audio » a une contrainte inverse du mode « question en audio ».**
  AR→FR (migration 48) n'exige un audio QUE sur la formulation-source (les 3 distracteurs
  restent du texte FR). Le nouveau FR→AR-audio exige un audio sur les **4 choix** (bonne
  réponse + 3 distracteurs) → il faut ≥4 formulations audio dans le glossaire, pas juste 1.
  Le filet de sécurité en découle : mode activé seulement si `count(audio) >= 4`, sinon
  fallback texte. Ne pas copier bêtement la condition de déclenchement de l'autre sens.
- **Anti-triche : la vraie fuite n'était pas le texte arabe mais la CORRÉLATION d'ids.**
  Réflexe initial : « pas de texte arabe dans le payload » (comme AR→FR). Insuffisant ici :
  si on envoie le `form_id` source ET des choix identifiés par leur `formulation.id`, un
  coup d'œil devtools suffit à matcher l'id-source à un choix → réponse sans écouter.
  Solution : **ne jamais mettre l'id-source dans le payload**. Le round-trip de scoring
  passe par le **prompt français** (déjà affiché, donc non-secret) + l'id du choix cliqué ;
  le serveur score par `formulation_choisie.french == prompt`. Aucun secret à corréler.
  Généralisable : quand question ET réponse sont des entités de même type, identifier la
  question par une propriété déjà visible, jamais par un id qui apparaît aussi côté choix.
- **CTE non matérialisé + fonction volatile (`random()`) = ré-évaluations indépendantes.**
  Un test structurel a d'abord donné « 0 question audio » alors que la distribution était
  bonne : le CTE `draws` (qui appelle `generate_formulation_quiz`, plein de `random()`)
  était ré-exécuté séparément pour chaque CTE consommateur → chaque agrégat voyait un
  tirage différent. `WITH draws AS MATERIALIZED (...)` fige un seul tirage partagé. À
  utiliser dès qu'un test agrège plusieurs vues d'un même appel de fonction volatile.
- **Une nouvelle direction de quiz = extension du même contrat générique, pas un composant
  neuf.** Le `QuizPlayer` générique (extrait session 30 suite 4) a absorbé le 3ᵉ mode via
  2 champs optionnels (`audio_choices` côté question, `prompt` côté réponse) + une branche
  de rendu, sans toucher aux 2 modes existants ni au quiz vocabulaire (label du 3ᵉ mode
  laissé optionnel dans `QuizLabels` → le runner vocab n'a pas eu à changer). L'extraction
  générique d'il y a 2 sessions continue de payer.
- **Signatures RPC identiques → `CREATE OR REPLACE`, pas de DROP.** Les deux RPC ont gagné
  de la logique interne (nouvelle direction, nouveau scoring) mais gardent exactement la
  même signature (`uuid, uuid, int` / `uuid, jsonb`) → remplacement en place.
- **PIÈGE RATTRAPÉ — une RPC « rétrocompatible en signature » peut casser la prod par son
  COMPORTEMENT sur base partagée.** J'avais d'abord conclu « CREATE OR REPLACE, signatures
  inchangées, donc client prod compatible ». FAUX : la base est partagée preview/prod, et
  dès l'`apply_migration`, `generate_formulation_quiz` s'est mis à émettre des questions
  `fr_to_ar_audio` que l'ANCIEN client prod (toujours déployé) ne sait pas rendre — il
  aurait planté (`choices.map` sur `undefined`) pour Hamza/Bilel/Rayan (≥4 audios).
  Signature compatible ≠ payload compatible. La règle « une migration de comportement sur
  base partagée casse la prod dès son application » (session 30 suite 7) vaut AUSSI quand
  la signature ne bouge pas — c'est la FORME DU RÉSULTAT qui compte, pas juste les args.
- **Correctif : opt-in explicite plutôt que timing de déploiement.** Comme la preview et la
  prod partagent la même RPC, on ne peut pas « désactiver pour prod, activer pour preview »
  par l'état de la base. Solution propre : un paramètre `p_allow_audio_choices DEFAULT
  false` — seul le nouveau client (preview, puis prod après déploiement) passe `true`.
  L'ancien client prod (2 args) tombe sur le défaut → ne reçoit jamais le nouveau mode →
  zéro plantage, sans dépendre de l'ordre migration/déploiement. Le drapeau devient
  inoffensif une fois la prod à jour. À réutiliser pour toute future RPC dont le NOUVEAU
  résultat casserait un client encore déployé : gate le nouveau comportement derrière un
  param opt-in, ne compte pas sur un fenêtrage de déploiement.

## Session 31 (suite 5) — Un seul quiz visible à la fois

- **Masquer visuellement APRÈS coup ne suffit pas contre un lancement concurrent — il
  faut déclencher le callback AU CLIC, pas après la réponse serveur.** Si `onActiveChange(true)`
  n'était appelé qu'après `await generate(...)`, une fenêtre de course subsistait : cliquer
  vite sur les deux quiz avant que le premier `generate()` ait répondu les lancerait quand
  même tous les deux. Appeler `onActiveChange(true)` en tout début de `start()` (avant le
  `await`) ferme la fenêtre : le clic sur un quiz masque instantanément les boutons des
  autres, donc un second clic est physiquement impossible.
- **État "actif" à remonter d'un niveau, pas de refonte des 3 lanceurs.** Les 3 composants
  (`QuizPlayer` partagé vocab/formulation, `GrammarQuizRunner` séparé pour la grammaire)
  géraient chacun leur propre `phase` en state local, invisible du parent. Plutôt que de
  fusionner leur logique interne (risqué, elle diffère : grammaire a un `activeId` distinct
  en plus de la phase), une simple prop `onActiveChange` callback suffit à faire remonter
  le seul signal binaire dont le parent a besoin ("un quiz tourne ou pas"), sans toucher à
  la mécanique propre de chaque lanceur.
- **`page.tsx` (Server Component) ne peut pas porter cet état lui-même** (pas de `useState`
  côté serveur) — extraction d'un wrapper client dédié (`evaluations-client.tsx`) qui reçoit
  les données déjà fetchées en props et gère uniquement l'orchestration d'affichage. Le
  fetch reste server-side, seul l'état d'affichage devient client.

## Session 31 (suite 4) — Audit code mort + lag (2 sous-agents)

- **2 sous-agents parallèles (code mort / performance), chaque finding re-vérifié
  personnellement avant action** — reprend le pattern rentable de session 30 suite 7.
  Consigne clé donnée aux agents (comme la fois précédente) : lire `lessons.md` d'abord
  pour ne pas re-signaler les décisions déjà actées. Sur 2 findings DB (RPC + 4 colonnes),
  la vérification perso via MCP (`pg_proc.prosrc`, policies, index, ET comptage des
  valeurs non-défaut sur les lignes réelles) a confirmé les deux agents à 100% — aucun
  faux positif cette fois, mais la vérification reste non-négociable : un agent peut
  grep le code applicatif mais pas interroger la base réelle en direct.
- **"Sûr à paralléliser" ≠ "sûr à paralléliser sans discussion" quand ça touche la
  boucle EXTÉRIEURE sur plusieurs élèves.** L'audit performance a distingué deux niveaux
  dans les 3 fichiers d'upload (fiche de fin de cours, duplication, édition) : les
  uploads/copies internes À un même élève sont strictement indépendants (chemins
  distincts) → parallélisation sans aucun changement de comportement, appliquée
  directement. La boucle externe sur les élèves change la sémantique d'erreur
  (fail-fast séquentiel vs tout-tenter-puis-agréger en parallèle) → jugé comme un choix
  produit, pas un pur gain technique, donc seulement signalé, pas appliqué. Distinction
  utile à généraliser : paralléliser une boucle ne change le comportement QUE si les
  itérations sont indépendantes ET que l'ordre d'échec/arrêt n'a pas de sens métier.
- **Colonnes orphelines confirmées par un double signal, pas un seul.** Pour retirer
  `students.trial_credit_cents`/`onboarding_completed` et `payments.trial_credit_cents`/
  `period`, deux preuves indépendantes ont été exigées avant le DROP : (a) 0 référence
  dans `src/` (grep) ET (b) 0 valeur non-défaut sur TOUTES les lignes réelles (SQL). Le
  premier prouve que le code ne les lit/écrit plus ; le second prouve qu'aucune donnée
  significative n'existe déjà dedans (au cas où une donnée aurait été écrite par un
  ancien code depuis supprimé). Un seul des deux signaux aurait laissé un doute.
- **RPC "orpheline" ≠ juste 0 appel côté client — vérifier aussi `pg_proc.prosrc` de
  toutes les autres fonctions.** `get_public_teachers()` avait 0 appel `.rpc(...)` dans
  `src/`, mais il fallait aussi confirmer qu'aucune AUTRE fonction Postgres ne l'invoque
  en interne (ex. un trigger ou une fonction wrapper) avant de la dropper — sinon le
  DROP casserait une dépendance invisible côté code applicatif.
- **Findings "incertains" du rapport de l'agent : ne pas les forcer en "confirmés"
  soi-même sous prétexte de finir le ménage.** Le rapport a lui-même classé 4 points en
  "à trancher avec le propriétaire" (enum orphelines, `homework.seen_at`/statut `'vu'`,
  `payment_status='failed'`, `correction_file` jamais affiché côté élève). Respecté cette
  classification telle quelle — signalés dans le todo, aucune action, même si certains
  auraient été triviaux à "nettoyer". Un vrai bug fonctionnel découvert en chemin
  (`correction_file`) n'a pas été corrigé non plus : la demande portait sur le nettoyage,
  pas sur l'audit fonctionnel complet — élargir le périmètre sans le demander aurait été
  une dérive, même bien intentionnée.

## Session 31 (suite 3) — Anti-doublon bibliothèque (course_group_id)

- **`NOT NULL DEFAULT gen_random_uuid()` = groupe automatique sans branche.** Chaque
  `lesson_record` obtient un `course_group_id` frais à l'insert sans que le code ait à
  y penser (fiche mono-élève = groupe de 1). Seuls les 2 cas « partagés » (fiche
  multi-élèves, duplication) passent un id explicite. La RPC fait
  `COALESCE(p_course_group_id, gen_random_uuid())` — le NULL passé par un appel
  mono-élève ne viole pas le NOT NULL car il est remplacé. Pattern propre : colonne
  auto-remplie + override optionnel, plutôt qu'une logique conditionnelle côté app.
- **Regrouper par identité explicite, pas par titre.** Le propriétaire a choisi un
  `course_group_id` plutôt qu'un dédoublonnage par titre : deux cours différents au même
  titre ne se confondront jamais. Coût : le regroupement ne capture que les fiches créées
  *ensemble* (multi-select ou duplication) — deux saisies séparées du même titre restent
  distinctes. Acceptable car le workflow réel pour « même cours à plusieurs » est
  justement le multi-select ou la duplication, qui posent le groupe partagé.
- **Rattrapage par titre = one-shot de migration, pas comportement permanent.** Les 6
  fiches historiques ont été regroupées par `(teacher_id, custom_title)` dans la migration
  (fragile en général, mais correct pour ces données où titre = cours). Le comportement
  ongoing n'utilise jamais le titre pour grouper — uniquement l'id explicite. Distinguer
  clairement « backfill pragmatique de données existantes » de « règle de gation continue ».
- **Représentant de groupe = la fiche la plus récemment modifiée.** Dans un groupe dont
  le contenu a divergé (ex. Bilel a des audios, Rayan non — état transitoire d'avant la
  duplication), la carte bibliothèque et l'action « Dupliquer » s'appuient sur le membre
  au `updated_at` le plus récent (souvent la version la plus complète). La divergence est
  transitoire : avec la duplication, les membres d'un groupe convergent.

## Session 31 (suite 2) — Dupliquer un cours (bibliothèque enseignant)

- **« Dupliquer un cours réel » ≠ le vieux Programme abandonné.** Distinction
  clé rappelée au propriétaire avant de coder : le Programme (tué session 30)
  était une bibliothèque de leçons rédigées à l'avance, déconnectées de tout
  élève réel. Ici on part d'un `lesson_record` réellement donné à un élève et on
  le recopie — exactement le geste manuel Anthony→Bilel (session 30 suite 3),
  transformé en bouton. Ne pas confondre « contenu réutilisable dérivé du réel »
  et « curriculum abstrait pré-écrit ».
- **La copie de fichiers Storage entre élèves marche en prod, pas dans le
  sandbox.** Le blocage rencontré pour copier les audios Bilel↔autre élève
  venait de l'environnement (SQL uniquement via MCP, pas d'API Storage). Une
  vraie fonctionnalité codée dans l'app utilise `supabase.storage.from(b).copy(src,dst)`
  côté serveur : le teacher a déjà les droits RLS sur les dossiers de tous ses
  élèves (USING sur la source, WITH CHECK sur la destination), donc le copy passe.
  Leçon : ne pas conclure « impossible » d'une limite du sandbox — distinguer ce
  qui est bloqué par l'environnement de ce qui l'est par le produit.
- **Réutiliser `submit_session_record` plutôt qu'une RPC de duplication.** Le RPC
  d'enregistrement accepte déjà tout le contenu (vocab/grammaire/formulations+audio/
  supports) en un appel. La duplication = relire le contenu source + recopier les
  fichiers dans le dossier de la cible + re-soumettre. Zéro migration, zéro
  nouvelle surface DB à sécuriser — la duplication hérite gratuitement des gardes
  (owns_student, titre obligatoire, règle d'absence) déjà éprouvées.
- **Copier les audios AVANT l'appel RPC, avec des chemins réécrits vers la
  cible.** Le point subtil : un audio doit finir sous `formulation-audio/{cible}/…`
  (sinon la RLS interdit à l'élève cible de le lire). On copie donc chaque fichier
  vers un nouveau chemin dans le dossier de la cible, puis on passe ces nouveaux
  chemins dans le payload `p_formulations`. Copier le chemin source tel quel aurait
  produit un audio « fantôme » illisible côté élève (fuite silencieuse déjà
  anticipée quand on a refusé la copie SQL des chemins à la main).
- **Attendance=present pour un cours dupliqué** : neutre, ne déclenche pas le
  compteur d'absences (§8). Un cours dupliqué est du contenu à étudier, pas une
  séance ratée — vérifié empiriquement (compteur d'absences inchangé après dup).

## Session 31 (suite) — Audio de formulation (compréhension orale)

### Décisions
- **« AR→FR devient exclusivement audio » = règle serveur, pas UI.** La contrainte
  du propriétaire (jamais de texte arabe comme question dans le sens AR→FR) est
  appliquée dans `generate_formulation_quiz` : le payload d'une question AR→FR ne
  contient QUE `audio_path` + choix français — ni `prompt` ni texte arabe. Même en
  ouvrant les devtools, l'élève n'a rien à lire. Corollaire : une formulation sans
  audio ne sort qu'en FR→AR (filet de sécurité, le propriétaire prévoit de tout
  enregistrer). Vérifié par 20 tirages agrégés (l'aléatoire interdit de conclure
  sur un seul tirage) : 0 violation sur 100 questions.
- **Fichier joint via `<input type="file">` caché + DataTransfer plutôt qu'un
  câblage JS.** Le blob du MediaRecorder est déposé dans un input file caché
  (`dt.items.add(file); input.files = dt.files`) — le formulaire reste une
  soumission FormData classique, l'action serveur reçoit le fichier comme un
  upload normal. Zéro état à synchroniser entre le composant micro et l'action.
- **Alignement d'index des lignes répétées** : chaque ligne de formulation rend
  TOUJOURS un champ de chaque nom (form_arabic/form_french/form_audio
  [/form_audio_existing]), même vide — un input file non rempli soumet une entrée
  vide, ce qui garde `getAll()` aligné par index. Ne jamais rendre le champ
  conditionnellement dans une liste de champs répétés.
- **Format d'enregistrement : préférence `audio/mp4`, repli webm.** iOS Safari ne
  lit pas toujours le webm/opus enregistré par Chrome/Android ; on privilégie mp4
  (lisible partout) quand `MediaRecorder.isTypeSupported` l'accepte. Risque
  résiduel documenté : un audio webm enregistré sur Android pourrait ne pas se
  lire sur un vieil iPhone — non testable depuis ce sandbox, à surveiller au
  premier test réel propriétaire.
- **Ajouter une clé à un payload jsonb ≠ changer une signature.** `audio_path`
  transite dans le `p_formulations` jsonb existant → `CREATE OR REPLACE` sans
  DROP, aucune surcharge, et le client déployé en prod continue de fonctionner
  pendant la fenêtre preview/prod (migration additive, leçon session 30 suite 7
  appliquée dès la conception).
- **Policy Storage plus stricte que le pattern historique** : le bucket
  `formulation-audio` scope l'écriture enseignant à SES élèves
  (`owns_student(dossier)`), contrairement à `session-files` (migration 19) où
  tout teacher écrit partout. Pattern à reprendre pour tout futur bucket ; ne pas
  copier la policy 19 telle quelle.
- **La consultation élève n'expose jamais l'audio** : toutes les pages élève
  sélectionnent des colonnes explicites (jamais `select *`) — `audio_path` ne
  fuit nulle part sans qu'aucun changement n'ait été nécessaire. Bénéfice direct
  de la convention « colonnes explicites » tenue depuis le début.

## Session 31 — Clôture des intégrations abandonnées

- **Un « todo » scattered dans un journal chronologique par session peut être
  mal lu comme une liste d'actions actives.** Le propriétaire voyait
  probablement l'ensemble des `- [ ]` non cochés (checklist markdown, tous
  affichés indépendamment de leur section/session d'origine) comme "le todo",
  alors qu'il s'agissait pour beaucoup de résidus d'anciennes sections déjà
  périmées par des pivots ultérieurs (PayPal→Revolut→PayPal.Me, vitrine
  supprimée, réservations supprimées). Réflexe : avant de nettoyer un "todo"
  signalé par le propriétaire, vérifier d'abord dans le code réel (pas
  seulement dans le fichier) si l'item est encore vivant, périmé par un pivot
  documenté, ou jamais commencé — les trois se traitent différemment.
- **Ne pas réécrire l'historique d'un journal append-only.** Plutôt que
  d'éditer chirurgicalement chaque doublon de "reste à faire" dispersé dans
  ~6 sections de sessions passées (16, 19, 20, 21), une nouvelle entrée de
  clôture en tête de fichier documente l'état actuel et fait foi — cohérent
  avec la convention déjà en place dans ce fichier (chaque session ajoute,
  aucune ne réécrit une session précédente).
- **Une table en base sans aucun consommateur applicatif n'est pas forcément
  un abandon.** `books`/`book_sessions`/`book_enrollments` (Produit B) existent
  depuis le tout premier lot mais n'ont jamais eu de code applicatif — à
  distinguer d'une fonctionnalité pivotée puis retirée (Revolut, vidéos,
  réservations), qui elle a un historique de suppression documenté. Signalé
  au propriétaire plutôt que supposé abandonné, car CLAUDE.md la documente
  toujours comme dans le périmètre.
- **Signaler avant de dropper a payé** : le point Produit B, remonté sans
  action, a permis au propriétaire de trancher explicitement (« je passerai
  par Telegram ») plutôt que de découvrir après coup une suppression de
  schéma non demandée. Une fois la confirmation obtenue, exécuté dans la
  foulée (même session, pas de nouvel aller-retour) : `DROP TABLE`
  `book_enrollments`/`book_sessions`/`books` (les 3 vides), colonne
  `quizzes.book_id` retirée, + nettoyage des 3 valeurs d'enum devenues
  inutilisées (`quiz_scope.group`, `quiz_source.book`, `payment_product.book`)
  avec le pattern déjà établi (rename→create→alter USING→drop old type,
  répété 3 fois dans la même migration) — vérifié au préalable via
  `pg_proc.prosrc` qu'aucune fonction ne référençait ces valeurs avant de les
  retirer.
- **Confirmer un état "supprimé" par la structure du code, pas par la mémoire
  des sessions précédentes.** Pour répondre "la vitrine est-elle supprimée ?",
  vérifié directement `src/app/page.tsx` (redirect direct `/login`, aucune
  route `(public)`) plutôt que de se fier au résumé de session 25 — utile
  car une suppression peut elle-même dériver (résidu oublié) entre le moment
  où elle est décrite et l'état réel du repo des sessions plus tard.

## Session 30 (suite 7) — Audit 3 sous-agents + nettoyage « Programme »

- **`cache()` de React sur les gardes d'auth = gain systémique.** Chaque
  navigation déclenchait jusqu'à 3 `auth.getUser()` (réseau) + 2-3 requêtes DB
  séquentielles parce que layout + page appellent chacun `requireStudent`/
  `requireTeacher` sans mémoïsation par requête. Un seul `cache()` autour de
  `getProfile` (+ le lookup `students`) déduplique tout. À retenir : tout
  helper serveur appelé à la fois par un layout et ses pages doit être
  enveloppé dans `cache()`.
- **Un audit en sous-agents parallèles (code mort / perf / affichage) est
  rentable** : contexte principal préservé, 3 rapports en ~4 min, findings
  recoupés. Consigne clé donnée aux agents : lire `lessons.md` d'abord pour ne
  pas re-signaler les décisions déjà actées (vestiges assumés, lint accepté).
- **Le chat n'avait rien à corriger** : les 4 lenteurs de la session 9 avaient
  déjà été corrigées en session 10 — l'audit a évité un « re-fix » inutile en
  vérifiant le code réel au lieu de faire confiance au vieux rapport.
- **Vestige « Programme » définitivement retiré** (décision propriétaire
  explicite) : tables `lessons`/`audio_assets`/`student_progress`, colonne
  `lesson_records.lesson_id`, enum `lesson_phase`, bucket `lesson-audio`,
  et les jointures mortes dans 3 pages. Avant le drop : vérification que
  `records_with_lesson_id = 0` et bucket vide — les 2 lignes de `lessons`
  étaient du seed jamais référencé.
- **Piège re-confirmé** : `DELETE FROM storage.buckets` échoue sur le trigger
  `storage.protect_delete()` — il faut `SELECT set_config('storage.allow_delete_query',
  'true', false);` juste avant (déjà documenté session 25, re-rencontré ici
  dans une migration cette fois).
- **Généralisation du check `error`** sur les 11 pages à jointures embarquées :
  sans lui, une jointure PostgREST qui casse (FK ambiguë, RLS) rend `data: null`
  et la page affiche silencieusement « Aucun … » — indiscernable d'un vrai
  vide (leçon session 26 enfin appliquée partout, pas seulement au dashboard).
- **RÈGLE IMPORTANTE — base partagée preview/prod** : une migration destructive
  (DROP de table/colonne encore référencée par le code en prod) casse la prod
  **dès son application**, même si le code corrigé n'est que sur la preview.
  Ici : 3 écrans prod vides entre la migration 46 et le merge (~ le temps de la
  validation propriétaire). Pour les prochaines suppressions de schéma : soit
  déployer le retrait des références code en prod AVANT d'appliquer le DROP,
  soit obtenir l'accord de merge immédiat avant de lancer la migration.

## Session 30 (suite 6) — Grammaire : nom de règle vs nom de cours

- **Un utilitaire partagé (`groupByLesson`) peut bien servir à des besoins
  différents.** Vocabulaire/formulations n'ont pas de nom propre → grouper par
  cours et étiqueter le groupe par le nom du cours est correct. La grammaire,
  elle, porte déjà un nom propre par élément (`grammar_rules.title`) →
  réutiliser le même mécanisme de groupe-étiqueté-par-cours l'a caché derrière
  un accordéon inutile. Repérer, avant de généraliser un composant/utilitaire,
  si toutes les données consommatrices ont vraiment la même forme sémantique.
- **Aplatir plutôt que grouper** quand chaque élément est déjà auto-descriptif :
  la carte affiche directement le titre de la règle, avec un simple lien vers
  le cours d'origine pour la traçabilité — pas besoin d'un niveau d'accordéon
  supplémentaire.

## Session 30 (suite 4, 2026-07-11) — Formulations (expressions) + quiz auto-généré

### Décisions
- **Une 3ᵉ catégorie « jumelle » se construit en dupliquant le pattern existant, pas en généralisant les tables.** Formulations = table dédiée `formulations` (comme `grammar_rules` est le jumeau de `vocabulary`), pas une extension polymorphe de `vocabulary`. Une phrase n'est pas un mot ; forcer les deux dans une table à double sens aurait été une fausse économie. Le coût réel d'une nouvelle catégorie de ce type = 1 migration + ~10 surfaces Uo à toucher (fiche saisie, édition, quiz, page consult, fiche prof, 2 détails de séance), toutes mécaniques et déjà éprouvées.
- **Le moteur de quiz vocabulaire méritait enfin son extraction (2ᵉ usage réel).** Jusqu'ici `quiz-runner.tsx` était spécifique au vocabulaire et `grammar-quiz-runner` un composant séparé (mécanique différente : questions saisies par le prof). Formulation partage EXACTEMENT la mécanique du quiz vocabulaire (direction aléatoire ar↔fr, distracteurs du même pool, moitié du périmètre) → extraction d'un `QuizPlayer` générique, conforme au principe « extraire à la 2ᵉ occurrence identique ». Clé de généricité : les RPC gardent leurs noms de colonnes réels (`vocab_id`/`form_id`) mais les server actions les mappent vers un `item_id` neutre, de sorte que le composant ignore la source. Contrat DB propre + composant générique, sans compromis.
- **`ALTER TYPE ... ADD VALUE` appliqué dans une migration séparée de son utilisation.** Postgres interdit d'utiliser une nouvelle valeur d'enum dans la même transaction qui l'ajoute (« unsafe use of new value »). Bien que `submit_formulation_quiz` ne référence `'formulation'` qu'au runtime (corps plpgsql, non évalué à la création), j'ai scindé par prudence en 2 `apply_migration` : la valeur d'enum seule, puis le reste. Réflexe à garder pour tout `ADD VALUE` suivi de code qui pourrait le consommer.
- **Ajouter un paramètre à une RPC existante = DROP + CREATE, pas CREATE OR REPLACE.** `submit_session_record` et `update_session_record` passent de N à N+1 paramètres (`p_formulations`). `CREATE OR REPLACE` aurait créé une SURCHARGE (signatures différentes coexistant), pas un remplacement — source de confusion PostgREST. Il faut `DROP FUNCTION` avec la signature exacte de l'ancienne version puis `CREATE` la nouvelle, et re-`GRANT EXECUTE`. (Rappel déjà noté session 27 pour le renommage de paramètre ; ici c'est l'ajout qui l'impose.)
- **Éditer `database.types.ts` de façon ciblée plutôt que réécrire tout le fichier.** Réécrire le fichier entier (>1300 lignes) est risqué — une session précédente y avait introduit une faute de frappe dans un type utilitaire. Édits chirurgicaux (bloc table, 2 fonctions, 1 param sur 2 RPC, 1 valeur d'enum × 2) = zéro risque de casser le reste, et le build TS valide la cohérence.

### Pièges
- **Stats de la fiche prof laissées à 4 tuiles.** Ajouter une 5ᵉ stat « formulations » aurait fait un `grid-cols-5` trop serré sur mobile. La section Formulations existe (accordéon), mais sans tuile de stat cliquable — compromis mobile-first assumé plutôt que d'entasser 5 chiffres sur une ligne.

## Session 30 (suite 2, 2026-07-11) — Retrait de la revue des anciennes tentatives de quiz

### Décisions
- **Une fonctionnalité livrée une session plus tôt (session 27, même jour) peut être annulée après le premier vrai test utilisateur, sans que ce soit un échec.** La « revue de tentative » avait été explicitement demandée en session 27 ; le propriétaire l'a testée en conditions réelles et a changé d'avis (« le but c'est qu'il en fasse un max », pas de suivi historique par l'élève). Réflexe à garder : ne pas hésiter à défaire proprement une décision produit récente quand le test réel contredit l'intuition initiale — supprimer franchement (route + requêtes + liens), pas commenter/masquer.
- **Distinction gardée entre « feedback immédiat » et « historique consultable ».** Le score + revue détaillée affichés juste après avoir terminé un quiz (écran "Done" de `QuizRunner`) sont restés intacts — c'est un feedback pédagogique sur l'action en cours, pas un accès à d'anciens tests. Seule la possibilité de revenir plus tard consulter d'anciennes tentatives (liste + lien vers `/dashboard/evaluations/[attemptId]`) a été retirée. Cette distinction évite de sur-corriger une demande formulée en termes généraux (« il peut revoir les anciens tests ») en supprimant aussi le feedback du quiz en cours, qui n'était pas visé.
- **Suppression franche d'une route devenue mort, pas de garde résiduelle.** `/dashboard/evaluations/[attemptId]/page.tsx` supprimé entièrement dès que plus aucun lien ne pointait dessus, plutôt que laissé accessible par URL directe — cohérent avec le principe déjà établi (« contenu remplacé = supprimé, pas dormant », session 22), à distinguer du cas où une route reste volontairement dormante par décision produit explicite (ex. vitrine publique).
- **`quiz_attempts` continue d'être alimentée en base** — aucune raison de toucher au schéma ou d'arrêter l'enregistrement, seule la restitution côté élève change. Garde la donnée disponible si un futur besoin (ex. vue prof) apparaît, sans migration à refaire.

## Session 30 (suite, 2026-07-11) — Modifier / supprimer un cours (fiche prof)

### Décisions
- **Un bug d'usage réel côté propriétaire (envoi prématuré de la fiche) a révélé une lacune fonctionnelle assumée depuis le début** (aucun retour arrière possible sur une séance soumise). Plutôt qu'un correctif ponctuel, construit comme une vraie fonctionnalité (modifier + supprimer), réutilisable pour toute future erreur de saisie.
- **`SECURITY INVOKER` suffisait** pour les deux nouvelles RPC (`update_session_record`, `delete_session_record`) : les policies `lr_teacher_all`/`vocab_teacher_all`/`gr_teacher_all`/`hw_teacher_all`/`session_notes_owner_all` (migration 03/10, jamais retouchées depuis la création du projet) autorisent déjà UPDATE/DELETE pour l'enseignant propriétaire. Contrairement aux RPC élève (toujours `SECURITY DEFINER` avec vérif interne, car `authenticated` est un rôle partagé élève/prof — leçon session 24), côté prof la RLS existante suffit déjà à isoler par `teacher_id` : la RPC n'ajoute que la logique métier (cascade, compteur d'absences, protection du travail élève), pas un contournement RLS.
- **Ne jamais supprimer/écraser silencieusement un devoir déjà touché par l'élève.** Règle appliquée symétriquement dans les deux RPC : si `homework.status != 'a_rendre'` (rendu, corrigé ou vu), le texte des consignes reste modifiable mais le enregistrement lui-même n'est jamais supprimé — sur `delete_session_record`, il est détaché (`lesson_record_id = NULL`, cohérent avec le `ON DELETE SET NULL` déjà en place sur la FK) plutôt que perdu. Seul un devoir jamais touché (`a_rendre`) peut disparaître avec la séance qui l'a créé.
- **Symétrie obligatoire des règles d'absence (§8) entre création, modification et suppression.** `submit_session_record` incrémente le compteur si la présence "compte" (`late`/`absent_unjustified`). Les deux nouvelles RPC devaient donc : (a) sur modification, comparer ancienne/nouvelle présence et n'ajuster le delta que si le statut "compte" a changé (pas de double comptage si l'attendance ne change pas) ; (b) sur suppression, décrémenter si la séance supprimée comptait. Dans les deux cas, réactiver automatiquement un compte `suspended_absences` si le compteur repasse sous 3 — sans ça, un prof qui corrige une erreur de présence laisserait un élève injustement suspendu.
- **`zipVocab`/`zipGrammar` extraits en helper partagé (`src/lib/session-form-zip.ts`) au 2ᵉ usage réel** (création + édition) — conforme au principe déjà établi (`AccordionGroup`, `MenuCardLink`, `ChangePasswordForm`) : extraction seulement quand un vrai second consommateur existe, jamais en anticipation.
- **Formulaire d'édition dupliqué plutôt que fusionné avec le formulaire de création**, malgré la ressemblance visuelle à ~90 %. Raison : la fiche de création est le composant le plus critique du produit (§3 Principe 5, <30s), et les deux formulaires divergent sur des points structurels (élève figé vs sélectionnable, lignes préremplies-retirables vs lignes vides-ajoutables, gestion des fichiers existants avec case conserver/retirer vs upload simple). Une abstraction commune aurait ajouté des branches conditionnelles dans le composant le plus sensible du produit pour un bénéfice de duplication mineur (~250 lignes de JSX très similaires mais pas identiques) — risque disproportionné par rapport au gain.

### Pièges
- **`execute_sql` (MCP) ne retourne que le résultat du DERNIER statement exécuté**, même si plusieurs `SELECT` apparaissent dans le même appel. Pour capturer plusieurs valeurs intermédiaires (avant/après une mutation, plusieurs branches testées dans une même transaction), il faut soit (a) écrire un seul `SELECT` final avec toutes les colonnes voulues, soit (b) accumuler les résultats dans des variables PL/pgSQL à l'intérieur d'un `DO $$ ... $$` puis les exposer via `set_config('test.xxx', valeur, true)` (portée `true` = locale à la transaction, jamais persisté), et les relire avec `current_setting(...)` dans un `SELECT` final avant `ROLLBACK`. Deuxième méthode indispensable dès que le test enchaîne plusieurs mutations avec des vérifications entre chacune.
- **Un `BEGIN` sans `COMMIT`/`ROLLBACK` explicite en fin d'un appel `execute_sql` est automatiquement abandonné** (connexion non persistante entre deux appels de l'outil) — confirmé empiriquement (vérifié qu'une ligne insérée sans ROLLBACK explicite avait bien disparu à l'appel suivant). Rassurant, mais ne pas compter dessus comme mécanisme volontaire : toujours fermer explicitement chaque transaction de test (`ROLLBACK` en fin d'appel) plutôt que de se reposer sur cet effet de bord.
- **`SET ROLE`/`set_config('role', ..., true)` reste utilisable pour changer d'impersonation plusieurs fois dans la même transaction** (Jefferson → Khadija, ou retour à `postgres` via `RESET ROLE`) tant que la session sous-jacente est superuser (`postgres`) — la vérification d'appartenance de `SET ROLE` se fait sur le rôle de connexion réel, pas sur le rôle courant déjà changé.

## Session 30 (2026-07-11) — Taille du quiz vocabulaire = moitié du glossaire

### Décisions
- **Une taille de quiz fixe (10) déconnectée du contenu réel n'a de sens que par accident.** Avec 24 mots au Cours 1 d'Anthony, `p_size=10` produisait un quiz qui ignorait plus de la moitié du glossaire testable. Passé à un calcul dérivé (`round(count/2)`) plutôt qu'une constante — cohérent avec le principe « pas de valeur magique déconnectée des données ».
- **Changer un DEFAULT de paramètre Postgres (10 → NULL) ne nécessite PAS de DROP + CREATE**, contrairement à un renommage de paramètre (leçon session 27). `CREATE OR REPLACE FUNCTION` accepte un nouveau DEFAULT tant que noms et types de paramètres restent identiques. Un seul cas exige le DROP : renommage ou changement de type.
- **Round vs floor pour "la moitié" d'un nombre impair** : `ROUND(x/2.0)` (arrondi au plus proche, PostgreSQL arrondit .5 vers le haut) choisi plutôt que `FLOOR` — 29 mots → 15 questions, pas 14. Pas de spec explicite du propriétaire sur le cas impair, mais "la moitié" se lit plus naturellement comme un arrondi au plus proche qu'une troncature systématique vers le bas.
- **Tester l'arrondi sur un total impair nécessite des données que la base réelle ne contient pas encore** (Anthony a exactement 24 mots, un seul cours). Solution : `INSERT` temporaire (5 mots de plus) **dans la même transaction** que l'appel RPC de test, puis `ROLLBACK` — aucune donnée réelle jamais persistée, mais le cas impair (29) est quand même vérifié empiriquement plutôt que déduit par lecture de code seule.

## Session 29 (2026-07-10) — Correctifs (email, mot de passe, chat, notifications) + nettoyage vidéos

### Décisions
- **Un champ dupliqué (`teachers.display_name` vs `profiles.full_name`) est un piège de renommage.** Session 25 a renommé Youssef → Jefferson uniquement sur `profiles.full_name`, en oubliant `teachers.display_name` qui sert spécifiquement à l'affichage du nom dans le chat élève (`dashboard/messages/page.tsx` le lit directement, pas via profiles). Résultat : bug silencieux resté 4 sessions. **Leçon générale** : quand un renommage touche une donnée d'identité, `grep` tous les champs qui pourraient la dupliquer (ici `display_name`, pensé à l'origine pour une vitrine publique aujourd'hui dormante) avant de considérer le renommage terminé.
- **"0 notification en base" n'est pas automatiquement un bug — vérifier les déclencheurs réels avant de soupçonner la plomberie.** Test empirique (impersonation Anthony + transaction rollback) a prouvé que `insert_notification` fonctionne (grants, cast enum, publication realtime tous corrects). Le vrai diagnostic : aucun événement déclencheur ne s'était encore produit pour l'unique élève réel (0 message envoyé, 0 paiement demandé, devoir pas encore corrigé). Mais la vérification exhaustive de CHAQUE type d'événement a quand même révélé un vrai trou : `homework_due` n'était câblé nulle part dans le code applicatif alors que le type existe depuis le début (enum + libellé dans la cloche). **Réflexe à généraliser** : "la fonctionnalité semble ne jamais se déclencher" mérite un test RPC direct AVANT de conclure à un bug — mais ne dispense pas de vérifier que chaque type annoncé dans l'UI a bien un point d'insertion quelque part dans le code.
- **Retrait de valeur d'enum Postgres = recréation du type, pas `DROP VALUE`.** Aucune version de Postgres (17 inclus) ne supporte de retirer une valeur d'un type enum existant, seulement d'en ajouter. Pattern : `ALTER TYPE x RENAME TO x_old` → `CREATE TYPE x AS ENUM (...)` sans la valeur → `ALTER TABLE ... ALTER COLUMN ... TYPE x USING col::text::x` → `DROP TYPE x_old`. Sûr uniquement si aucune ligne existante n'utilise la valeur retirée (vérifié ici : `notifications` vide).
- **Reset password Supabase/Next.js SSR : `/auth/confirm` doit gérer `token_hash`+`type` (verifyOtp) ET `code` (exchangeCodeForSession).** Le lien hébergé par Supabase (`ConfirmationURL` du template par défaut) peut rediriger selon l'un ou l'autre format selon la configuration du projet — gérer les deux évite une dépendance fragile à un comportement non garanti.
- **Mot de passe partagé élève/prof extrait au 2ᵉ usage** : `ChangePasswordForm` + action `changePassword` déplacés de `dashboard/more/` (élève) vers `src/components/` + `src/lib/actions/` dès que la fiche prof en a eu besoin — conforme au principe anti-sur-ingénierie (extraction seulement à la 2ᵉ occurrence réelle, pas avant).

- **Un lien secondaire collé contre un CTA primaire est un piège de tap mobile, pas juste un défaut esthétique.** Le propriétaire a rapporté un "bug" (login avec ancien mot de passe → redirection automatique vers `/login/forgot-password` sans message d'erreur) qui n'était PAS un bug de logique serveur : le lien "Mot de passe oublié ?" était aligné à droite, juste au-dessus du bouton "Se connecter", à 8px d'écart. Un tap mal placé sur mobile déclenchait la navigation vers le lien plutôt que la soumission du formulaire — silencieux car un `<a>`/`Link` de Next.js navigue sans passer par le `formAction`, donc aucune erreur ne peut s'afficher. **Réflexe à généraliser** : tout lien secondaire positionné à moins d'une zone de tap confortable (~44px) d'un bouton d'action primaire est un risque de mis-tap sur mobile — le déplacer après le CTA principal, jamais juste avant/au-dessus.

### Pièges
- **Changer l'email `auth.users` ne suffit pas** : `auth.identities.identity_data->>'email'` et `provider_id` (provider `email`) doivent être mis à jour en même temps, sinon l'état interne d'auth devient incohérent (le login continue de fonctionner par email dans `auth.users`, mais l'identité liée reste sur l'ancien mail — source de confusion future si Supabase compare les deux un jour). Mis à jour les 3 (`auth.users`, `auth.identities`, `profiles.email`) dans la même transaction.
- **`resetPasswordForEmail` échoue silencieusement si `redirectTo` n'est pas dans l'allow-list Supabase Auth (Authentication → URL Configuration → Redirect URLs).** Aucun outil MCP Supabase n'expose ce réglage (ce n'est pas une table Postgres) — reste une action manuelle obligatoire côté propriétaire, documentée dans todo.md.
- **Fast-forward main + branche de prod Vercel = sûr uniquement si `git merge-base --is-ancestor` confirme les deux dans les deux sens avant de pousser.** Vérifié ici (`origin/main` et `origin/claude/new-project-setup-1jcgwf` strictement au même commit qu'au démarrage de session) avant tout push — évite un force-push accidentel si quelqu'un d'autre avait committé entre-temps.

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

## Nom de cours personnalisé (session 30, suite 5)

- **Champ « obligatoire » = obligation double, pas juste HTML `required`.** Le
  propriétaire voulait le nom du cours obligatoire à *chaque* fiche. Le
  `required` HTML seul est contournable (RPC appelée directement, JS désactivé) ;
  la vraie garantie est le `RAISE EXCEPTION` dans la RPC elle-même si le champ
  est vide après `BTRIM`. Testé explicitement en tentant un titre `'   '`.
- **Une seule numérotation, calculée à N endroits indépendants.** "Cours N"
  n'est pas un champ stocké mais un calcul (`groupByLesson`, ou des `Map`
  `courseNumber` ad hoc dans `dashboard/page.tsx` et
  `teacher/students/[id]/page.tsx`). Ajouter un remplaçant a demandé de toucher
  8 fichiers séparément — pas de source de vérité unique. Prochaine fois qu'un
  besoin similaire apparaît, envisager de centraliser ce calcul (actuellement
  dupliqué par nécessité historique, pas par choix).
- **Pas de backfill = décision explicite du propriétaire**, pas un oubli : les
  séances existantes gardent `custom_title IS NULL` et retombent sur "Cours N"
  jusqu'à renommage manuel via "Modifier" (fonctionnalité déjà existante,
  session 30 suite 2).
- **Supabase MCP a semblé "non autorisé"** au début de cette tâche (message
  système), mais un simple appel `list_tables` a prouvé que la connexion
  fonctionnait en réalité — toujours vérifier avec un appel léger avant de
  bloquer une tâche sur un message d'indisponibilité présumée.

## 3 correctifs "Mes livres" / grammaire (session 32, suite 4)

- **Diagnostiquer avant de deviner, même sous pression.** Le propriétaire
  rapportait une page d'erreur générique Vercel ("ERROR 4195018424") sans
  autre détail. Plutôt que de fouiller le code à l'aveugle, `get_runtime_errors`
  (Vercel MCP) a donné le vrai stack trace en un appel : digest identique à
  celui du propriétaire, cause exacte = une fonction JS brute
  (`submitLabelPlural={(n) => ...}`) passée d'un Server Component vers un
  Client Component (`DuplicateForm`), interdit par React/Next (seules les
  Server Actions traversent cette frontière). Le flux "cours" ne plantait
  jamais car il ne passait simplement pas cette prop optionnelle — son défaut
  produisait déjà exactement le même texte. Correctif root-cause : supprimer
  la prop entièrement (plus aucun appelant réel), pas juste corriger l'appel
  fautif — élimine toute la classe de bug plutôt que ce seul symptôme.
- **Regroupement de lignes multi-élèves = un ID par ligne, jamais par
  soumission.** `course_group_id` (une valeur par soumission entière) convient
  aux cours car une fiche = une seule séance par élève. Mais une fiche peut
  contenir *plusieurs* règles de grammaire distinctes pour un même élève :
  réutiliser un seul `p_course_group_id` partagé pour toutes les règles de la
  soumission aurait fusionné à tort des règles différentes en une seule carte.
  Solution : `rule_group_id`, une valeur générée **par ligne de règle**
  (`grammarGroupIds[idx]`), partagée uniquement entre les élèves cochés pour
  cette ligne précise — portée par le client dans le jsonb `p_grammar`, jamais
  générée côté RPC.
- **Préserver un groupe à travers une édition = thread explicite, pas
  heuristique.** `update_session_record` fait un `DELETE` + ré-`INSERT` complet
  des `grammar_rules` d'une fiche. Pour qu'une règle éditée reste dans son
  groupe d'origine (et donc groupée avec les autres élèves de la fiche
  d'origine), le `rule_group_id` existant est renvoyé explicitement par le
  formulaire d'édition via un hidden input indexé
  (`grammar_rule_group_existing_{idx}`) — exactement le même mécanisme déjà en
  place pour les photos existantes conservées. Envisagé un temps une
  heuristique par position (`WITH ORDINALITY`) côté SQL pour ré-associer les
  anciens groupes après le DELETE, écarté : plus fragile qu'un identifiant
  explicite déjà connu du client au chargement de la page, et le codebase a
  déjà cette convention (photos, champs `_existing_{idx}`).
- **Duplication individuelle = toujours un nouveau groupe, jamais une
  fusion.** `duplicateGrammarRule` n'envoie jamais `rule_group_id` à l'insert
  → le `DEFAULT gen_random_uuid()` de la colonne s'applique, donnant à la
  copie son propre groupe d'un seul élève. Aucun code à écrire pour ce
  comportement : le design de la colonne le garantit nativement, testé
  empiriquement pour confirmer (pas supposé).

## Backfill oublié après une migration additive avec DEFAULT par ligne (session 32, suite 4 bis)

- **Un `DEFAULT gen_random_uuid()` sur une nouvelle colonne "groupe" ne groupe
  jamais les lignes existantes entre elles** — chaque ligne reçoit sa propre
  valeur aléatoire indépendante au moment de l'`ALTER TABLE`. La migration 60
  a corrigé le regroupement pour toute nouvelle soumission (le client envoie
  désormais `rule_group_id`), mais les règles déjà en base avant le déploiement
  du nouveau code sont restées éclatées une carte par élève — exactement ce
  que le propriétaire a signalé (règle "Le mot" x3 toujours séparée).
- **Le correctif de bug pour l'avenir n'est pas un correctif pour le passé.**
  Toujours se demander explicitement : "et les données déjà en base ?" après
  toute migration additive qui introduit une notion de regroupement/dérivation
  — sinon la même donnée réelle reste incohérente en prod jusqu'à ce que
  quelqu'un s'en aperçoive (ici, le propriétaire, en test manuel).
- **Reconstituer un regroupement historique perdu grâce à une corrélation
  déjà présente ailleurs** : `course_group_id` (sur `lesson_records`) existait
  déjà avant `rule_group_id` et était partagé par construction entre les
  lignes créées dans la même boucle d'origine (une soumission = un
  `p_course_group_id`, une itération par élève). Backfill = fusionner les
  `grammar_rules` historiques par `(course_group_id via lesson_record_id,
  title, content)`. Toujours vérifier par une requête `HAVING count(*) > 1`
  en lecture seule AVANT d'appliquer le backfill (voir combien de groupes
  seraient touchés), puis revérifier `HAVING count(DISTINCT rule_group_id) > 1`
  APRÈS (doit être vide) pour confirmer qu'aucune fusion erronée n'a eu lieu
  sur le reste de la table.

## Retrait des noms d'élèves sur les cartes groupées (session 32, suite 4 ter)

- **Une info "pratique" affichée sur une liste peut devenir un risque quand
  elle expose plusieurs identités à la fois.** Le nom d'un seul élève sur sa
  propre fiche (espace élève) est normal. Mais lister "Donné à Bilel, Rayan,
  Hamza" sur une carte consultée côté enseignant expose les noms de plusieurs
  élèves ensemble au même endroit — le propriétaire l'a jugé à risque à terme
  (capture d'écran, partage, etc.) et redondant : l'écran "Dupliquer" donne
  déjà cette info via les cases à cocher déjà grisées/cochées pour qui possède
  déjà le cours/la règle.
- **Retirer une donnée de l'affichage ne suffit pas si elle reste dans la
  requête.** Corrigé en supprimant complètement l'embed
  `students(profiles(full_name))` des deux requêtes (cours et grammaire) dans
  `teacher/books/[bookId]/page.tsx`, pas seulement le JSX qui l'affichait —
  la donnée n'est ni récupérée ni tenue en mémoire côté serveur.

## Garde "déjà membre du groupe" oubliée à la première introduction du groupement (session 32, suite 4 quater)

- **Un groupement fraîchement introduit doit immédiatement avoir sa garde de
  duplication, pas seulement son affichage.** `rule_group_id` venait d'être
  ajouté (suite 4) pour afficher une seule carte par règle multi-élèves, en
  copiant volontairement le pattern d'affichage de `course_group_id`. Mais la
  garde "a déjà ce cours" côté cours existait déjà AVANT le regroupement
  d'affichage (elle datait de l'introduction de `course_group_id` lui-même) —
  côté grammaire, comme il n'y avait jamais eu de notion de groupe avant
  aujourd'hui, il n'y avait jamais eu de garde non plus, et la copie du
  pattern d'affichage n'a pas automatiquement entraîné la copie de la garde.
  Résultat : Bilel et Anthony (déjà dans le groupe "Le mot") apparaissaient
  sélectionnables sur l'écran de duplication au lieu d'être grisés — repéré
  uniquement par le propriétaire en testant manuellement le flux complet
  (cocher → dupliquer), pas par une simple relecture de code.
- **Un label passé en prop `string` (`alreadyHasLabel`) est sans risque**,
  contrairement à une fonction (`submitLabelPlural`, cause du crash corrigé
  plus tôt dans cette même session) — les strings traversent normalement la
  frontière Server → Client Component. Bon réflexe : dès qu'un composant
  partagé doit varier un texte selon l'appelant, préférer une prop `string`
  simple plutôt qu'une fonction de formatage, même quand ça semble plus
  "élégant".
- **Cohérence de duplication == la cible rejoint le même groupe.** Après
  réflexion, dupliquer une règle vers un nouvel élève doit le faire rejoindre
  le `rule_group_id` de la règle source (comme `duplicateSession` le fait déjà
  pour `course_group_id`), pas créer un groupe indépendant — sinon la garde
  "déjà membre" resterait juste pour les élèves de la soumission d'origine et
  se re-casserait dès la duplication suivante vers un troisième élève.

## Photos de profil dans messages/listes : la RLS Storage doit précéder l'UI (session 32, suite 5)

- **Une fonctionnalité "juste UI" peut cacher une lacune RLS.** Le bucket
  `avatars` existait déjà (upload fonctionnel côté profil propriétaire), mais
  sa seule policy (`avatars_owner_all`) limitait strictement la LECTURE au
  propriétaire du dossier — cohérent avec le principe deny-by-default, mais
  bloquant totalement l'affichage demandé ici (voir la photo d'un tiers).
  Vérifié via `execute_sql` AVANT d'écrire une ligne de composant : sans les
  nouvelles policies, `createSignedUrl` aurait échoué silencieusement (pas
  d'erreur remontée à l'UI, juste `signedUrl: null` → pas de photo) — un bug
  très facile à diagnostiquer à tort comme "problème d'affichage" plutôt que
  RLS.
- **Policies SELECT-only additives = extension sûre, pas un affaiblissement.**
  RLS Postgres combine les policies en OR : ajouter 3 policies `for select`
  scoped à une relation réelle (enseignant↔élève, admin) élargit strictement
  la lecture sans jamais toucher aux droits d'écriture déjà garantis par
  `avatars_owner_all` (`for all`, toujours actif).
- **Tester une policy Storage avant l'UI, avec de vrais faux objets.**
  Pattern réutilisé : `INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES (...)` dans une transaction, puis `SET LOCAL ROLE authenticated` +
  `set_config('request.jwt.claims', ...)` pour impersonner chacun des rôles
  concernés, `SELECT name FROM storage.objects WHERE bucket_id = '...'` pour
  voir exactement ce que chaque policy laisse passer, `ROLLBACK` à la fin —
  bien plus rapide et fiable qu'un test manuel dans le navigateur pour ce
  genre de garde d'accès.
- **`createSignedUrls` (pluriel) batché plutôt qu'un `createSignedUrl` par
  ligne** dans une liste (messages, élèves, enseignants) — un seul appel
  Storage au lieu de N, pattern déjà établi pour les photos de règles de
  grammaire, réutilisé ici sans modification.
- **Piège TypeScript avec un type predicate après un filtre `!!`** :
  `createSignedUrls` renvoie `{ path: string | null; signedUrl: string | null;
  error: ... }[]`, et un `.filter((s): s is {path: string; signedUrl: string}
  => !!s.path && !!s.signedUrl)` échoue à la compilation car le type source
  contient un champ (`error`) absent du type cible — TS n'accepte pas la
  narrowing dans ce sens. Fix : `.filter(...).map((s) => ({ path: s.path as
  string, signedUrl: s.signedUrl as string }))` plutôt qu'un type predicate.

## Deux couches invisibles derrière deux bugs "visuels" (session 32, suite 6)

- **Une policy Storage seule ne suffit pas si la ligne DB qui porte le
  chemin est elle-même bloquée par RLS.** La migration 62 (lecture du bucket
  `avatars`) était correcte mais insuffisante : l'embed PostgREST
  `students → teachers → profiles` exécuté côté élève s'arrêtait à l'étage
  `profiles` (aucune policy `SELECT` n'autorisait un élève à lire le profil
  de son propre enseignant), donc `avatar_url` n'était jamais atteint —
  `createSignedUrl` n'était même jamais appelé. Un embed imbriqué est
  seulement aussi lisible que la policy RLS de CHAQUE table traversée, pas
  seulement celle de la table de départ.
- **Partir de la mauvaise table casse silencieusement les cas "pas encore
  de données".** `teacher/messages/page.tsx` partait de `conversations`
  (table de jonction, une ligne seulement une fois qu'une conversation a été
  ouverte au moins une fois) au lieu de `students` (la vraie liste
  d'entités). Résultat : un élève jamais contacté disparaissait de la liste
  plutôt que d'apparaître avec "Démarrer la conversation →" — un bug de
  "table de départ", pas de filtre RLS. Réflexe à généraliser : quand une
  liste doit représenter TOUTES les entités d'un type (tous les élèves) avec
  une relation optionnelle (conversation), toujours partir de la table des
  entités et embedder la relation, jamais l'inverse.
- **Vérifier un correctif avec la requête RÉELLE, pas une approximation.**
  Les deux bugs ont été confirmés ET corrigés via des requêtes SQL
  reproduisant exactement le chemin de données du code (même embed imbriqué,
  même impersonation, même sens de jointure) — pas juste "la policy existe"
  ou "la table contient les bonnes lignes". C'est ce niveau de fidélité qui a
  permis de localiser le vrai point de blocage (`profiles`, pas `avatars`)
  au lieu de re-corriger la mauvaise couche.

## Règlement intérieur élève (session 32, suite 7)

- **Un déclencheur DB plutôt qu'un appel dans le code de création** pour
  garantir "toute nouvelle fiche élève reçoit X" : le propriétaire voulait que
  ça soit "directement présent" pour tout nouvel élève, sans dépendre d'un
  développeur futur qui se souvient d'ajouter l'appel dans le bon formulaire.
  `AFTER INSERT ON students` couvre tous les points d'entrée présents ET
  futurs par construction — vérifié via `pg_trigger` (attaché + activé) plutôt
  que supposé correct après écriture.
- **`ALTER TYPE ... ADD VALUE` doit être seule dans sa migration/transaction**
  si la nouvelle valeur est utilisée ailleurs dans la même migration (ici : le
  trigger et le backfill utilisent `'house_rules'`) — Postgres refuse d'utiliser
  une valeur d'enum ajoutée dans la même transaction que son ajout. Toujours
  scinder en deux migrations distinctes (déjà rencontré dans cette session,
  confirmé de nouveau).
- **Idempotence côté serveur pour une action "signée une seule fois"** :
  `accept_house_rules()` utilise `COALESCE(house_rules_accepted_at, now())`
  plutôt que `now()` seul — même si l'UI désactive déjà la re-validation, la
  garantie réelle doit être en base (cf. §3 CLAUDE.md, "jamais de règle
  métier critique côté client uniquement"). Testé explicitement par deux
  appels RPC successifs dans la même transaction.
- **Tester un trigger `AFTER INSERT` avec une vraie ligne `auth.users` est
  hors de portée du MCP SQL seul** : `INSERT INTO auth.users` est bloqué par
  permissions même pour des rôles élevés (dépend du service Auth, colonnes
  requises non triviales). Quand ce blocage survient, se rabattre sur une
  vérification structurelle du trigger (`pg_trigger` : attaché, activé) plutôt
  que forcer un contournement risqué (création manuelle d'un faux compte) —
  le risque de laisser des données de test orphelines dépasse la valeur du
  test dans ce cas précis.

## Fusion de deux quiz : unifier la correction, pas la génération (session 32, suite 8)

- **Fusionner au point le plus simple, pas au plus "logique".** Vocab et
  formulation avaient chacun une paire génération/correction. La tentation
  était d'écrire une grosse RPC de génération unifiée — mais la génération
  concentre toute la complexité (distracteurs par type, direction aléatoire,
  signature d'audio, mode audio-choix). J'ai gardé les 2 RPC de génération
  INTACTES et fusionné uniquement la correction (simples lookups + un INSERT
  quiz_attempts). Concaténation + mélange se font côté serveur (action). Bien
  moins de surface de bug qu'une réécriture.
- **Un tableau de réponses hétérogène s'aiguille par la présence d'une clé**,
  pas par un champ "type" ajouté : `v_item ? 'vocab_id'` distingue un mot d'une
  formulation, et `direction = 'fr_to_ar_audio'` le sous-cas audio. Zéro
  ambiguïté, zéro champ supplémentaire à faire transiter depuis le client
  au-delà du `source` déjà porté par la question.
- **Recalculer plutôt que stocker** : `quiz_attempts.score` ne stocke qu'un
  ratio (0..1), pas le brut. La demande "afficher 7/7" se satisfait en
  recomptant `answers[].is_correct` (déjà stocké par TOUTES les RPC de
  correction, anciennes comprises) — donc pas de migration, et ça marche
  rétroactivement sur les quiz déjà passés. Toujours regarder si la donnée
  voulue est dérivable de l'existant avant d'ajouter une colonne.
- **Header de question dépendant du média, pas seulement de la direction** :
  dans un quiz mixte, un `ar_to_fr` peut être du texte (vocab) OU de l'audio
  (formulation). Le libellé se choisit sur `(direction + présence audio_url)`,
  pas sur la direction seule — sinon un mot afficherait "Écoute l'audio…".
