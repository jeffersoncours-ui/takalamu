# Todo

---

## Session 33 (suite 4) — Tuiles Évaluations + longueur de quiz + déblocage auto des temps

> **Demande (reformulée et validée au fil de l'échange)** :
> 1. Page Évaluations → **tuiles cliquables** (« Quiz de langue » / « Quiz de conjugaison »),
>    chacune renvoie vers son propre écran.
> 2. **Sélecteur de longueur 10/20/30/50** (paliers, défaut 20) sur les DEUX quiz — plus de
>    choix par cours/leçon pour le quiz de langue (retiré). Toujours plafonné par le contenu
>    réel (jamais de répétition pour remplir).
> 3. Conjugaison : le sélecteur de **temps** (Passé/Présent/Impératif/Mix) est conservé, mais
>    restreint aux temps **débloqués**. Déblocage **automatique** (pas de champ ajouté sur la
>    fiche élève) : détecté depuis les `grammar_rules` déjà saisies par le prof (titre
>    contenant le mot-clé du temps, FR ou AR). Si aucun temps débloqué → tuile « Quiz de
>    conjugaison » masquée entièrement.

### Connexions vérifiées avant de coder
- `generate_individual_quiz` et `generate_formulation_quiz` acceptent déjà `p_size` (LIMIT
  SQL, se plafonne naturellement au pool réel sans erreur) → **aucune migration**.
- `generate_conjugation_quiz` accepte déjà `p_tense` ET `p_size` (idem, LIMIT naturel) →
  **aucune migration**. Le "Mix" de plusieurs temps débloqués se fait en appelant la RPC une
  fois par temps puis en combinant/mélangeant côté client (même pattern déjà éprouvé dans
  `generateLanguageQuiz` pour vocab+formulation) — pas de nouveau paramètre RPC.
- **Bug latent trouvé en creusant** : `ensureConjugations()` génère déjà les 3 temps pour
  chaque verbe détecté, dès la 1ʳᵉ visite d'Évaluations — indépendamment de ce que l'élève a
  réellement "vu" en cours. Donc "Tous les temps" (`p_tense=null`) piochait déjà dans des
  temps non enseignés. Le déblocage par grammar_rules corrige ce vrai problème, pas seulement
  la demande du jour.
- Échantillon réel `grammar_rules.title` (les 4 élèves) : tous portent EXACTEMENT
  « الفِعْلُ المَاضِي = le verbe au passé » pour la règle du passé — texte standardisé (dupliqué
  d'élève en élève), donc un matching par mot-clé est fiable. Aucune donnée réelle pour
  présent/impératif pour l'instant (pas encore enseignés) → matching sur plusieurs variantes
  (AR sans harakat + FR) pour rester robuste à la formulation exacte future.
- `QuizPlayer`/`ConjugationQuizPlayer`/`EvaluationsClient` n'ont qu'un seul point d'usage
  (`dashboard/evaluations/`) — aucune référence externe. Le lien de navigation
  `/dashboard/revision` pointe vers `/dashboard/evaluations` (URL inchangée, devient les
  tuiles).

### Review (suite 4 — livrée sur preview)
- Aucune migration : `p_size` était déjà supporté par `generate_individual_quiz`,
  `generate_formulation_quiz` et `generate_conjugation_quiz` (LIMIT SQL, plafonnage naturel).
  Le "Mix" de plusieurs temps se fait par appels RPC multiples combinés côté client (même
  pattern que `generateLanguageQuiz` pour vocab+formulation) — zéro paramètre RPC ajouté.
- `getUnlockedTenses()` (lecture `grammar_rules.title`, `stripHarakat` + regex AR+FR par
  temps) validé contre les 4 vraies fiches élève : détecte `madi` seul (aucune règle
  présent/impératif encore saisie) ; zéro faux positif sur « أمريكي » (le mot-clé impératif
  exige le préfixe défini `الأمر`, pas juste la racine `أمر`).
- Testé au navigateur (Playwright, harnais jetable) : sélecteur de longueur (défaut 20,
  plafonnage réel affiché en direct, `size` transmis tel quel à `generate` — le plafonnage
  final se fait côté RPC comme en prod) ; sélecteur de temps absent quand un seul temps est
  débloqué (appelle directement ce temps) ; "Mix" + options individuelles quand plusieurs
  temps débloqués, chaque choix transmis correctement à `generate(tenses, size)`.
- Routing éclaté en 3 pages (`/evaluations` tuiles, `/evaluations/langue`,
  `/evaluations/conjugaison`) — `evaluations-client.tsx` supprimé (la coordination
  "un seul quiz actif" entre les deux lanceurs n'a plus lieu d'être : ils sont maintenant sur
  des routes séparées, chacune avec son propre wrapper client minimal pour masquer l'en-tête
  pendant le quiz).
- Bug latent corrigé au passage (découvert en creusant, pas demandé explicitement) :
  `ensureConjugations()` génère déjà les 3 temps pour chaque verbe dès la 1ʳᵉ visite, donc
  "Tous les temps" piochait avant dans des temps jamais enseignés — le déblocage par
  grammar_rules corrige ce vrai trou pédagogique, pas seulement l'irritant de longueur.

### Plan d'exécution
- [x] `src/app/dashboard/evaluations/actions.ts` :
      - `generateLanguageQuiz(size)` : remplace `lessonRecordId?` par `size`, passe `p_size`
        aux deux RPC (chacune plafonnée par son propre pool), combine+mélange+tronque à `size`
      - `generateConjugationQuiz(tenses: string[], size)` : 1 appel si `tenses.length<=1`,
        sinon 1 appel RPC par temps (taille répartie) puis combine+mélange+tronque
      - `getUnlockedTenses()` : lit `grammar_rules.title` de l'élève courant, normalise
        (retire les harakat), détecte passé/présent/impératif par mots-clés AR+FR, renvoie
        `Tense[]` dans l'ordre madi→mudari→amr
- [x] `quiz-player.tsx` : retire `courses`/le sélecteur "Réviser", ajoute le sélecteur de
      longueur (boutons 10/20/30/50, défaut 20), `generate` prend `size` au lieu de
      `lessonRecordId`
- [x] `conjugation-player.tsx` : prop `unlockedTenses: Tense[]`, options du sélecteur de temps
      limitées à ces temps (+ "Mix" si >1), ajoute le sélecteur de longueur, `generate` prend
      `(tenses: string[], size)`
- [x] Nouvelles routes :
      - `dashboard/evaluations/page.tsx` → tuiles (server component) ; calcule
        `hasLanguageContent`/`unlockedTenses`/`hasConjugationContent` pour l'affichage/masquage
      - `dashboard/evaluations/langue/page.tsx` (+ client wrapper) : ancien contenu quiz de
        langue, sans le sélecteur de cours
      - `dashboard/evaluations/conjugaison/page.tsx` (+ client wrapper) : quiz de conjugaison,
        `unlockedTenses` calculé côté serveur
      - suppression de `evaluations-client.tsx` (plus nécessaire, un seul quiz par route)
- [x] `dashboard/revision/page.tsx` : met à jour la description de la tuile Évaluations
- [x] Build + lint
- [x] Test navigateur (harnais jetable, mock generate/submit) : tuiles, sélecteurs de
      longueur (10/20/30/50, plafonnage), sélecteur de temps limité aux débloqués + mix
- [x] Vérification empirique via MCP de `getUnlockedTenses` contre les vraies données
      (les 4 élèves : passé détecté, présent/impératif non détectés)
- [x] `tasks/todo.md` (Review) + `tasks/lessons.md`, commit + push preview

---

## Session 33 (suite 3) — Conjugaison AUTOMATIQUE (moteur morphologique complet)

> **Demande** : le quiz de conjugaison doit apparaître TOUT SEUL dans Évaluations, à
> partir des mots déjà saisis (verbes écrits « passé/présent », ex. `جلس/يجلس`), sans
> aucune saisie manuelle du prof. Périmètre « tout » (B) : couvrir aussi les verbes
> irréguliers, pas seulement les sains.

### Découvertes (données réelles, via MCP)
- Le « / » N'EST PAS un marqueur de verbe : il sert aussi aux pluriels (`يوم/أيام`),
  masc/fém (`طبيب/بة`), pronoms (`هو/هي`). Détection fiable d'un verbe = la 2ᵉ forme
  commence par يَ/يُ (préfixe présent), en excluant يّة (adjectif féminin). → 93 candidats
  verbes (dont doublons inter-élèves), ~33 distincts.
- Familles réelles : ~14 sains, ~1 augmenté (تكلّم), 4 hamzés, 3 creux, 2 redoublés,
  1 assimilé, 1 défectueux (صلّى, en fait forme II défectueux).

### Review (suite 3 — livrée sur preview)
- **Moteur morphologique complet réécrit** (`src/lib/conjugation.ts`) : dérive les radicaux
  des DEUX formes fournies (au lieu de supposer un verbe sain). `conjugate(madi, mudari)`
  classe (`sound`/`doubled`/`hollow`/`defective`) et couvre : sains, formes dérivées II–X
  (voyelle de préfixe lue de la forme), assimilés, hamzés (siège de hamza ~cosmétique),
  **redoublés** (مدّ, gémination qui se défait), **creux** (قال/باع, voyelle longue
  raccourcie), **défectueux** (رمى/دعا/نسي, lettre faible finale). Validé visuellement +
  texte contre tables de référence, famille par famille — a attrapé plusieurs vraies fautes
  (préfixe أنا présent en hamza أَ ; voyelles inversées du redoublé مَدَدْتُ ; 1re radicale
  du creux qui porte la voyelle longue أَقُولُ ; shadda gardée au défectueux forme II
  تُصَلِّينَ). Résiduel connu : impératif de أكل (كُل, exception), رأى (hyper-irrégulier) —
  corrigeables par le prof via l'écran de saisie.
- **Détection auto** : `parseVerbForms(arabic_word)` (verbe = 2ᵉ forme يَ/يُ, exclut يّة).
- **Pipeline automatique** : migration 70 = RPC `ensure_conjugations(student, rows)`
  (SECURITY DEFINER, n'insère que les (vocab_id,tense) ABSENTS → n'écrase jamais une
  saisie prof). Action serveur `ensureConjugations()` (moteur TS → RPC) appelée à
  l'ouverture de la page Évaluations. Résultat : le quiz de conjugaison apparaît tout seul
  dès que l'élève a des verbes, zéro saisie prof.
- **Testé empiriquement via MCP** (impersonation Rayan) : ensure a inséré 12 conjugations
  (قرأ hamzé, صلّى forme II défectueux, سلّم forme II, توضّأ forme V) — nisba `يّة`
  correctement ignorée ; idempotence OK ; `generate_conjugation_quiz` a produit 10 questions
  (2 types, 4 choix, aucune fuite). Données de test nettoyées (0 résidu).
- **Testé au navigateur** (Playwright, harnais jetable) : formulaire prof pré-remplit
  correctement un verbe creux (قال → قُلْتُ/أَقُولُ/قُلْ, 33 champs).
- L'écran prof de saisie reste le **filet de correction** pour les rares verbes que le
  moteur approxime.
- Note : la duplication de cours ne copie toujours pas les conjugaisons (liées au vocab_id,
  regénérées automatiquement par `ensureConjugations` côté élève de toute façon).

---

## Session 33 (suite 2) — Quiz de conjugaison (الماضي، المضارع، الأمر)

> **Demande propriétaire (reformulée, maquette validée « vas-y »)** : quiz de conjugaison
> auto-généré pour la leçon la plus importante. Périmètre élargi par le propriétaire aux
> **3 temps d'un coup** (passé, présent, impératif — « autant le faire maintenant »).
> - **13 formes** au passé/présent (أنتما commune masc/fém — corrigé par le propriétaire),
>   **5 formes** à l'impératif (2ᵉ personnes uniquement).
> - **Harakat complètes OBLIGATOIRES partout** (saisie, affichage, choix de quiz).
> - Côté prof : table **pré-remplie automatiquement** (mécanique pour les verbes sains),
>   chaque case modifiable (verbes faibles/hamza). Le présent n'est PAS déductible du
>   passé (voyelle médiane variable : كَتَبَ→يَكْتُبُ mais جَلَسَ→يَجْلِسُ) → le prof saisit
>   la forme هو du présent, et présent + impératif se pré-remplissent depuis elle.
> - Côté élève : 2 types de questions QCM (jamais de saisie arabe libre — sans harakat,
>   كتبت est ambigu entre 4 personnes) : « conjugue X pour [personne] » (distracteurs =
>   autres formes du même verbe) et l'inverse « quelle personne ? » (pronom + trad. FR).
> - Un clic = valide + avance ; Précédent conservé ; correction finale = erreurs seules
>   (flux quiz existant réutilisé).
> - **Preview uniquement** — pas de prod sans validation.

### Connexions vérifiées avant de coder
- **MCP Supabase INDISPONIBLE cette session** (serveur en « permission denied », OAuth
  non refaisable en session non-interactive). Source de vérité utilisée : les migrations
  versionnées du repo (01/03/04/51/66/67 relues). Conséquence assumée : les migrations
  68/69 sont RÉDIGÉES mais PAS appliquées, et les tests empiriques DB (RLS, RPC) sont
  DIFFÉRÉS jusqu'à ré-autorisation du MCP par le propriétaire. Les écrans neufs sont
  gardés pour ne pas crasher tant que la table n'existe pas (erreur → état vide).
- `vocabulary` (migration 03) : id/student_id/arabic_word/french_definition — policies
  `vocab_teacher_all` (owns_student) + `vocab_select_student`. Une table de conjugaison
  liée par vocab_id + student_id peut copier ce pattern exactement.
- `quizzes`/`quiz_attempts` (04, 67) : `submit_language_quiz` = modèle exact à répliquer
  (SECURITY DEFINER, contrôle current_student_id, 1 ligne quizzes + 1 ligne quiz_attempts,
  answers enrichies avec is_correct). Enum `quiz_source` : nouvelle valeur `conjugation`
  SEULE dans sa migration (règle ALTER TYPE ADD VALUE).
- Tuile « Dernière note » (dashboard) : lit `quiz_attempts.answers` et compte les
  `is_correct` → format enrichi identique = compatible sans modification.
- `generate_formulation_quiz` (51) : modèle de génération (tirage random, distracteurs,
  payload sans marquage de la bonne réponse).
- **Ambiguïté du présent à gérer** : تَكْتُبُ est identique pour أنتَ ET هي (idem
  أنتما/هما-fém). Garde-fous : (a) question « quelle personne ? » — les distracteurs
  excluent toute personne dont la forme est identique à la bonne ; scoring = comparaison
  de FORMES (toute personne à forme identique compte juste) ; (b) question « conjugue » —
  distracteurs = formes DISTINCTES en valeur (jamais deux choix identiques).
- Fiche élève prof (`teacher/students/[id]/page.tsx`) : liste vocab par cours → point
  d'entrée « Conjugaison » par mot. La fiche de fin de cours n'est PAS touchée (< 30 s).
- Duplication (`library/[recordId]/actions.ts`) : copie le vocab en re-soumettant la RPC
  (nouvelles lignes) → les conjugaisons doivent SUIVRE (workflow réel : un cours saisi
  une fois puis dupliqué) — copie post-RPC par correspondance arabic_word.
- `database.types.ts` : régénération MCP impossible → édits ciblés (précédent assumé,
  session 31 suite 7), à régénérer verbatim dès le retour du MCP.

### Review (suite 2 — livrée sur preview)
- **MCP Supabase revenu en cours de session** → chantier fait proprement et testé
  empiriquement (méthode §4), pas seulement écrit. Migrations 68 + 69 APPLIQUÉES (base
  partagée, mais 100% additives : nouvelle table + nouvelles RPC, aucun client déployé n'y
  touche → zéro risque prod).
- **Moteur `src/lib/conjugation.ts`** : 13 personnes, 3 temps, pré-remplissage mécanique.
  Une vraie erreur linguistique attrapée par le test (préfixe أنا du présent = hamza أَ, pas
  alif nu اَ) — d'où l'intérêt de tester avant de présenter. Validé par rendu visuel des
  tables complètes de 3 verbes-types (damma/kasra/fatha).
- **DB testée via MCP** (impersonation JWT + ROLLBACK/cleanup) : génération (structure,
  aucune bonne réponse leakée, 2 types, temps mélangés), correction (3/5 dont **ambiguïté
  du présent** تَكْتُبُ = أنتَ/هي acceptée), isolation (Bilel bloqué 42501 en gen+submit pour
  Anthony, lit 0 ligne). Données de test nettoyées (0 résidu).
- **UI testée au navigateur (Playwright, harnais jetable supprimé)** : formulaire prof
  (33 champs pré-remplis, hamza correcte), player élève (2 types de questions, 1-clic,
  ambiguïté acceptée en bout de chaîne, correction erreurs-seules).
- **Écrans** : formulaire prof `/teacher/students/[id]/vocabulary/[vocabId]` (sources passé
  هو + présent هو → pré-remplit les 3 temps, chaque case éditable) ; lien « Conjuguer ce
  verbe » par mot sur la fiche élève (indicateur ✓ si déjà saisi) ; 2ᵉ lanceur « Quiz de
  conjugaison » côté élève (visible seulement si ≥1 conjugaison, un seul quiz actif à la fois).
- **DIFFÉRÉ assumé** : la duplication d'un cours ne copie PAS encore les `verb_conjugations`
  (elles sont liées au `vocab_id`, et la duplication crée de nouveaux vocab). Cas limite
  (dupliquer un cours dont les verbes ont déjà une conjugaison) — à ajouter en suite si le
  besoin se présente (copie par correspondance arabic_word après la RPC).
- `database.types.ts` : édits ciblés (table + 2 RPC + valeur d'enum) copiés depuis la sortie
  MCP `generate_typescript_types` — build vert.

### Plan d'exécution (fait)
- [x] Migration 68 APPLIQUÉE : `ALTER TYPE quiz_source ADD VALUE 'conjugation'` seule
- [ ] Migration 69 (NON appliquée) : table `verb_conjugations` (vocab_id FK cascade,
      student_id FK, tense text check madi|mudari|amr, base_form text, forms jsonb,
      unique(vocab_id,tense)) + RLS (teacher ALL owns_student, student SELECT) + trigger
      updated_at + RPC `generate_conjugation_quiz(p_student_id, p_tense default null)`
      (≤10 questions, combos (verbe,temps,personne,type) distincts, 2 types de questions,
      payload sans bonne réponse marquée, gardes d'ambiguïté) + RPC
      `submit_conjugation_quiz(p_student_id, p_answers)` (modèle 67, source 'conjugation')
- [ ] `src/lib/conjugation.ts` : 13 personnes (codes, pronoms vocalisés, libellés FR,
      ordre d'affichage), 3 temps, algos de pré-remplissage `prefillMadi(base)` /
      `prefillMudari(huwa)` / `prefillAmr(huwa_mudari)` (mécaniques verbes sains,
      défensifs sinon)
- [ ] Test unitaire node des 3 algos : كَتَبَ/يَكْتُبُ (table complète attendue exacte),
      جَلَسَ/يَجْلِسُ (impératif en اِـ), entrée non vocalisée (pas de crash)
- [ ] Écran prof `/teacher/students/[id]/vocabulary/[vocabId]` : page + `conjugation-form.tsx`
      (3 onglets temps, pré-remplissage au clic, 13/13/5 champs harakat éditables, RTL,
      sauvegarde par temps) + `actions.ts` (upsert direct RLS, pas de RPC)
- [ ] Fiche élève prof : lien « Conjugaison » par mot du vocabulaire (+ indicateur si
      des temps sont déjà validés)
- [ ] Élève — `evaluations/actions.ts` : `generateConjugationQuiz`/`submitConjugationQuiz`
      (mapping RPC → QuizQuestion avec champs structurés conjugaison)
- [ ] `quiz-player.tsx` : rendu question « conjugue » (verbe + trad + pronom cible) et
      choix riches « pronom + libellé FR » pour « quelle personne ? » — extension du
      contrat existant (champs optionnels), flux 1-clic/Précédent/correction inchangés
- [ ] `evaluations-client.tsx` + `page.tsx` : 2ᵉ lanceur « Quiz de conjugaison » (visible
      seulement si ≥1 table validée ; requête gardée → invisible tant que la migration
      n'est pas appliquée), un seul quiz actif à la fois (pattern existant)
- [ ] Duplication : copie des `verb_conjugations` par correspondance arabic_word
      source→cible après la RPC (requête gardée si table absente)
- [ ] `database.types.ts` : édits ciblés (table + 2 RPC) — à régénérer verbatim au retour MCP
- [ ] Build + lint + grep connexions résiduelles
- [ ] Tests harnais Playwright (client uniquement) : formulaire prof (pré-remplissage
      réel des 31 formes, édition d'une case), quiz élève (2 types de questions, flux
      1-clic, correction erreurs seules)
- [ ] **DIFFÉRÉ (retour MCP obligatoire)** : appliquer 68 puis 69, régénérer les types
      verbatim, tests empiriques (RLS cross-élève/cross-prof, génération — ambiguïté
      présent, jamais de bonne réponse marquée dans le payload, scoring, advisor)
- [ ] `tasks/todo.md` (Review) + `tasks/lessons.md` + commit + push preview — PAS de prod

---

## Session 33 (suite) — Retrait des boutons Suivant/Terminer (clic = valide + avance)

> **Demande propriétaire (reformulée et validée)** : retour sur la suite précédente — lors
> du quiz, cliquer une option doit **valider directement et passer à la question suivante**,
> sans bouton « Suivant »/« Terminer » à cliquer en plus. Le retour arrière (« Précédent »)
> est **conservé** pour permettre à l'élève de se corriger (main glissée, erreur) : cliquer
> une option sur une question déjà répondue met à jour la réponse et avance directement,
> comme en avançant normalement — aucune validation séparée nulle part, y compris sur la
> dernière question (soumission immédiate au clic).

### Plan d'exécution (`quiz-player.tsx` uniquement, aucune migration)
- [x] Fusion de `select`/`goNext`/`finish` en une seule fonction `choose(chosen)` : met à
      jour `answers[current]`, avance à `current+1` si pas la dernière question, sinon
      soumet directement (plus de garde `hasAnswer`/bouton à part — le clic EST l'action)
- [x] Boutons de choix (texte + audio-choix) : `onClick={() => select(...)}` → `choose(...)`
- [x] Retrait du bloc de boutons « Suivant »/« Terminer le quiz » ; seul « Précédent »
      reste (visible si `current > 0`), plus `isLast`/`hasAnswer` devenus inutiles
- [x] Build (27 routes) + lint verts (seule l'erreur pré-existante `drawer-nav.tsx`)
- [x] Test navigateur réel (Playwright, même harnais jetable que la suite précédente,
      supprimé après test) : 0 bouton Suivant/Terminer nulle part ; clic sur une réponse
      (même fausse) avance directement (progress 1/4 → 2/4 en un clic) ; Précédent invisible
      sur Q1, visible dès Q2 ; retour + clic sur la bonne réponse avance aussi directement
      (pas de validation séparée) ; dernière question : clic soumet directement sans bouton
      Terminer, score final reflète bien la correction (4/4 après avoir corrigé Q1)
- [ ] `tasks/lessons.md` mis à jour
- [ ] Commit + push branche de session (preview) — déploiement prod sur confirmation

---

## Session 33 — Correctifs quiz de langue (correction ciblée, navigation, audio)

> **Demande propriétaire (reformulée et validée)** : 3 correctifs sur le quiz de langue
> (`/dashboard/evaluations`, composant `QuizPlayer` partagé vocab+formulation, seul
> consommateur du fichier) :
> 1. Écran de correction final : n'afficher que les **mauvaises réponses** (plus la liste
>    complète bonnes+mauvaises).
> 2. Navigation arrière — **les deux confirmées par le propriétaire** :
>    a) Sur l'écran de correction final : naviguer les mauvaises réponses **une par une**
>       (Précédent/Suivant) au lieu d'une liste empilée.
>    b) Pendant le quiz (avant validation) : pouvoir revenir sur une question précédente et
>       **changer sa réponse** avant la fin.
> 3. Audio : quand l'élève lance un nouvel audio (mode 4 propositions audio, formulation
>    FR→AR), l'audio précédemment en lecture doit s'arrêter — actuellement ils se
>    superposent.

### Connexions vérifiées avant de coder
- `QuizPlayer`/`AudioPrompt` (`src/app/dashboard/evaluations/quiz-player.tsx`) : un seul
  consommateur, `evaluations-client.tsx` (quiz de langue fusionné vocab+formulation,
  session 32 suite 3). Aucune autre page/composant ne les importe.
- Purement client (`"use client"`) : aucun changement de RPC, de payload `submit`, ni de
  migration nécessaire. `submit(answers: QuizAnswer[])` attend déjà un tableau dans
  l'ordre des questions — inchangé, seule la construction locale de ce tableau change
  (remplacement en place au lieu d'un append).
- Le point 2b change le flux actuel « cliquer une réponse = validée + avance immédiatement »
  vers « cliquer une réponse = sélectionne, boutons Précédent/Suivant pour naviguer,
  Terminer sur la dernière question pour soumettre ». Impact : la structure `Phase`
  (`playing`) passe de `answers: QuizAnswer[]` (append-only) à
  `answers: (QuizAnswer | null)[]` (taille fixe = nb questions, indexé par position) pour
  permettre la modification d'une réponse déjà donnée sans perdre les autres.
- Le mode audio-choix (4 propositions) : bouton « Choisir » devient un état de sélection
  (surbrillance) au lieu d'un envoi immédiat — cohérent avec le nouveau flux point 2b.
- Fix audio (point 3) : un seul `<audio>` doit jouer à la fois sur tout l'écran quiz.
  Solution : variable module-scope `activeAudioEl` dans `quiz-player.tsx` (seul fichier
  consommateur d'`AudioPrompt`) — au clic play, on coupe l'audio précédemment actif (s'il
  diffère) avant de lancer le nouveau ; `onPause` sur chaque `<audio>` remet son propre
  état "en lecture" à faux (couvre le cas où c'est un AUTRE composant qui le coupe).

### Plan d'exécution (`src/app/dashboard/evaluations/quiz-player.tsx` uniquement)
- [x] `AudioPrompt` : coordination via variable module-scope `activeAudioEl` — lancer un
      audio coupe le précédent s'il diffère ; `onPause` synchronise l'état local de chaque
      instance (couvre coupure externe)
- [x] Type `Phase` (`playing`) : `answers` devient `(QuizAnswer | null)[]` taille fixe =
      `questions.length`, initialisé à `null` au démarrage
- [x] `select(chosen)` (remplace `choose`) : met à jour `answers[current]` en place
      (immutable), ne change plus `current` automatiquement, pas de soumission automatique
- [x] Choix (texte ET audio-choix) : bouton en surbrillance si `answers[current]?.chosen`
      correspond déjà (visualise la sélection courante)
- [x] Nouveaux boutons de navigation sous les choix : « Précédent » (visible si
      `current > 0`, ne touche pas `answers`), « Suivant » (si `current < length-1`,
      désactivé tant qu'aucune réponse sélectionnée pour la question courante), « Terminer
      le quiz » (sur la dernière question, désactivé tant qu'aucune réponse sélectionnée,
      déclenche `submit()`)
- [x] Barre de progression : reste `current+1 / length` (position, pas nombre de réponses
      données — cohérent avec la nature "on peut naviguer librement" du nouveau flux)
- [x] Écran « Done » : nouvel état local `reviewIndex`, filtre `result.answers`/`questions`
      sur `!is_correct` uniquement ; si 0 erreur → message « Aucune erreur, bravo ! » sans
      pagination ; sinon carte unique (reprend le contenu actuel : direction, prompt/audio,
      ta réponse, bonne réponse) + Précédent/Suivant + compteur « Erreur X/Y »
- [x] Bouton « Refaire un quiz » inchangé
- [x] Build (27 routes) + lint verts (seule l'erreur pré-existante `drawer-nav.tsx` subsiste)
- [x] Test navigateur réel (Playwright headless, `npm run dev` + harnais temporaire
      `src/app/quiz-test-harness` monté avec des `generate`/`submit` fixtures — contourne
      le besoin d'une session Supabase réelle puisque `QuizPlayer` est purement client ;
      env Supabase factices en `.env.local` local uniquement pour satisfaire le middleware
      d'auth, aucune vraie donnée touchée) : (1) retour arrière pendant le quiz jusqu'à la
      1ʳᵉ question, changement de réponse, ré-avance jusqu'à la fin → **score final reflète
      bien la réponse corrigée** (4/4 au lieu de 3/4) ; (2) sélections des autres questions
      préservées pendant l'aller-retour ; (3) écran de correction : seules les mauvaises
      réponses affichées, navigation « Erreur 1/2 » ↔ « Erreur 2/2 » fonctionnelle, message
      dédié si 0 erreur ; (4) audio 4-propositions : lancer la lecture d'un 2ᵉ audio met
      bien le 1ᵉʳ en pause (`audio.paused` vérifié programmatiquement) et son bouton revient
      à « Écouter ». Harnais + `.env.local` supprimés après test (non commités).
- [x] `tasks/todo.md` (Review) + `tasks/lessons.md` mis à jour
- [x] Commit + push branche de session (preview) — pas de déploiement prod sans
      confirmation explicite

### Review
- 3 correctifs livrés dans un seul fichier (`quiz-player.tsx`), aucune migration/RPC
  touchée : (1) l'écran de correction final n'affiche plus que les mauvaises réponses ;
  (2) navigation Précédent/Suivant ajoutée à deux endroits — dans la correction (entre les
  erreurs, une par une) ET pendant le quiz lui-même (revenir sur une question déjà répondue
  et changer sa réponse avant validation finale) ; (3) un seul audio joue à la fois sur tout
  l'écran quiz (texte, audio unique, 4 propositions) — démarrer une lecture coupe la
  précédente.
- Le flux de jeu change de nature : avant, cliquer une réponse la validait et faisait
  avancer immédiatement (voire soumettait si dernière question) ; maintenant, cliquer une
  réponse la **sélectionne** (surbrillance), et des boutons explicites Précédent/Suivant/
  Terminer pilotent la navigation — nécessaire pour permettre la correction d'une réponse
  déjà donnée sans perdre les autres. `answers` est passé d'un tableau append-only à un
  tableau de taille fixe indexé par position (`(QuizAnswer | null)[]`).
- Testé empiriquement en conditions réelles de clic (Playwright, pas seulement build/lint) :
  seul moyen fiable de vérifier qu'un aller-retour arrière + changement de réponse se
  reflète bien dans le score final envoyé au serveur, et que l'audio coupe correctement —
  deux comportements impossibles à garantir par la seule lecture du code. Harnais de test
  jetable (fixtures locales, pas de vraie session élève) supprimé avant le commit.
- Aucun impact sur les autres écrans : `QuizPlayer`/`AudioPrompt` n'ont qu'un seul
  consommateur (`evaluations-client.tsx`, le quiz de langue fusionné vocab+formulation).

---

## Session 32 (suite 3) — Bibliothèque → livres + règles de grammaire individuelles

> **Demande propriétaire (reformulée et validée en plusieurs allers-retours)** :
> 1. Retirer l'onglet Bibliothèque. Chaque livre (cliquable depuis « Mes livres ») affiche
>    désormais son propre contenu :
>    - Livres de **cours** (Récits des prophètes, L'arabe entre tes mains) : liste des
>      séances de CE livre (tags + Dupliquer), comme l'ancienne Bibliothèque mais filtrée.
>    - Livre **grammaire** : liste des **règles individuelles** (pas de séances — la
>      grammaire n'est jamais rattachée au livre de la séance, elle part automatiquement
>      dans son propre livre). Chaque règle a son **propre bouton Dupliquer** indépendant
>      (un élève peut recevoir une règle isolée sans suivre le même programme qu'un autre).
> 2. **Duplication d'un cours** (livre de cours) : ne doit **plus** copier la règle de
>    grammaire liée à ce cours (séparation stricte confirmée par le propriétaire).
> 3. Carte de règle de grammaire (prof ET élève) : afficher la **date** à laquelle la
>    règle a été dispensée (comme les cartes de cours), en plus du titre.
> 4. Élève : la page du livre grammaire passe d'un affichage "tout le contenu en clair,
>    à la suite" à des **cartes cliquables** (titre + date) → détail complet au clic,
>    comme les cours des autres livres.
> 5. Fiche de fin de cours (+ édition) : chaque règle de grammaire ajoutée peut recevoir
>    **plusieurs photos qui lui sont propres** (comme chaque formulation a son propre
>    audio) — distinctes des « Supports » génériques de séance. Affichées avec la règle
>    dans le livre de grammaire.

### Connexions vérifiées avant de coder (MCP)
- `grammar_rules.lesson_record_id` est **nullable** → une règle dupliquée en standalone
  (sans séance) est possible nativement, pas de migration de schéma nécessaire pour ça.
  Date affichée = `lesson_records.session_date` si lié à une séance, sinon
  `grammar_rules.created_at` (fallback).
- RLS `grammar_rules` : policy `gr_teacher_all` (ALL commands) sur
  `private.owns_student(student_id)` → un prof peut déjà insérer directement une ligne
  `grammar_rules` pour n'importe lequel de ses élèves, sans RPC ni service role.
- Bucket `formulation-audio` (policies `owns_student` sur le prof, lecture élève sur son
  dossier) est le pattern à répliquer pour le nouveau bucket `grammar-photos`.
- `p_grammar` (jsonb) dans `submit_session_record`/`update_session_record` accepte déjà
  des clés arbitraires par item → ajouter `photos` est **additif**, `CREATE OR REPLACE`
  sans DROP, signature inchangée, rétrocompatible base partagée.
- Bibliothèque (`/teacher/library/page.tsx`) groupe par `course_group_id` — ce
  regroupement ne s'applique PAS à la grammaire (pas de séance) : chaque règle reste un
  élément individuel, jamais groupée avec d'autres élèves (cohérent avec la demande "un
  élève peut recevoir une règle isolée").
- Fiche de fin de cours = composant critique (<30s) : upload de photos par règle reste
  en **server action classique** (comme les Supports actuels), pas de refactor vers
  l'upload direct navigateur — cohérent avec la décision déjà actée (session 31 suite 7)
  de ne pas toucher à ce composant au-delà du strict nécessaire. Pas de compression
  d'image ajoutée sur ce composant précis pour la même raison.

### Plan d'exécution
- [x] Migration 59 : colonne `grammar_rules.photos jsonb default '[]'` ; bucket privé
      `grammar-photos` (20 Mo, policies `owns_student` prof + lecture élève, calquées sur
      `formulation-audio`) ; `submit_session_record`/`update_session_record` étendues pour
      lire `photos` dans chaque item de `p_grammar` (additif, pas de DROP)
- [x] `session-form-zip.ts` : `zipGrammar` retourne aussi les nouveaux fichiers photo par
      ligne (champ indexé `grammar_photos_{idx}`, aligné par position de rendu React)
- [x] `session-form.tsx` (fiche de création) : input fichier multiple par ligne de règle
- [x] `session/actions.ts` : upload des photos par règle vers `grammar-photos`, injecte
      `photos` dans le payload `p_grammar`
- [x] `edit-session-form.tsx` : checklist des photos existantes (conserver/retirer) +
      nouvel input par ligne, mêmes principes que les supports de séance existants
- [x] `edit/actions.ts` : fusionne photos conservées + nouvelles, nettoie en Storage les
      photos retirées (même pattern que le nettoyage d'audio de formulation orphelin)
- [x] `library/[recordId]/actions.ts` (`duplicateSession`) : retire la copie de
      `grammar_rules` (vocab + formulations + supports uniquement)
- [x] `library/[recordId]/page.tsx` : retire le bloc « Règles de grammaire » de l'aperçu
      dupliqué, met à jour la mention de ce qui n'est pas copié, lien retour vers le livre
      (au lieu de Bibliothèque)
- [x] `library/[recordId]/duplicate-form.tsx` : généralisé pour accepter une action déjà
      liée en prop (réutilisable pour la duplication de règle de grammaire)
- [x] Nouveau `teacher/books/[bookId]/page.tsx` : branche par `kind`
      - `courses` : liste des séances de ce livre (repris de l'ancienne Bibliothèque,
        filtré par `book_id`), carte → `/teacher/library/[recordId]`
      - `grammar` : liste des règles individuelles (titre, date, élève), carte →
        `/teacher/library/grammar/[ruleId]`
- [x] Nouveau `teacher/library/grammar/[ruleId]/page.tsx` + `actions.ts`
      (`duplicateGrammarRule`) : aperçu de la règle (titre/contenu/photos) + formulaire de
      duplication vers un ou plusieurs élèves (hors élève source), copie des photos en
      Storage vers le dossier de chaque cible, insertion directe `grammar_rules`
      (`lesson_record_id: null`) via la policy `gr_teacher_all`
- [x] `book-manager.tsx` : cartes de livre cliquables vers `/teacher/books/[bookId]`
      (Modifier/Suppr. restent des actions locales, pas de navigation)
- [x] Suppression `teacher/library/page.tsx` (liste globale) + entrée « Bibliothèque »
      du `drawer-nav.tsx`
- [x] Élève : `grammar-search.tsx` → cartes cliquables (titre + date) au lieu du contenu
      complet affiché en continu ; nouveau `dashboard/grammar/[ruleId]/page.tsx` (détail
      complet + photos en URLs signées) ; mise à jour des appelants
      (`dashboard/livres/[bookId]/page.tsx` → `GrammarBookContent`, `dashboard/grammar/page.tsx`)
      pour fournir le champ date à chaque règle
- [x] `database.types.ts` régénéré (collé tel quel, pas retapé à la main)
- [x] Build + lint + grep de connexions résiduelles (`teacher/library` global,
      `Bibliothèque`, imports cassés)
- [x] Tests empiriques MCP (impersonation + transactions rollback) : insertion d'une
      règle avec photos, édition (ajout/retrait photo), duplication de cours (grammaire
      NON copiée), duplication d'une règle seule (photos copiées dans le dossier cible,
      RLS élève source vs cible, teacher cross-cases refusés)
- [x] `tasks/todo.md` (Review) + `tasks/lessons.md` mis à jour en fin de tâche
- [x] Commit + push preview (pas de déploiement prod sans nouvelle confirmation explicite)

### Review
- Bibliothèque globale retirée ; chaque livre porte désormais son propre contenu
  cliquable depuis « Mes livres » : les 2 livres de cours listent leurs séances (tags +
  Dupliquer, repris de l'ancienne Bibliothèque, filtré par `book_id`) ; le livre grammaire
  liste ses règles individuelles (titre, date, élève), chacune avec son propre Dupliquer
  indépendant vers un ou plusieurs élèves (nouvelle route `/teacher/library/grammar/[ruleId]`,
  insertion directe RLS `gr_teacher_all`, pas de RPC).
- Duplication d'un cours : ne copie plus la règle de grammaire (vérifié empiriquement —
  `submit_session_record` sans `p_grammar` → 0 ligne créée) ; l'aperçu « contenu dupliqué »
  et la mention finale mis à jour en conséquence.
- Fiche de fin de cours (création + édition) : chaque règle de grammaire peut recevoir
  plusieurs photos qui lui sont propres (bucket dédié `grammar-photos`, policies calquées
  sur `formulation-audio`), affichées avec la règle dans le livre de grammaire (prof et
  élève). Édition : ajout/retrait testé empiriquement (photo conservée + nouvelle +
  orpheline nettoyée du Storage).
- Élève : le livre de grammaire passe de « tout le contenu affiché en continu » à des
  cartes cliquables (titre + date) → détail complet sur une page dédiée, alignée sur le
  pattern des cours des autres livres.
- `DuplicateForm` généralisé (action pré-liée en prop au lieu d'un import figé) pour être
  réutilisé par la duplication de cours ET de règle de grammaire sans dupliquer le
  composant.
- Migration 59 appliquée directement (additive/rétrocompatible, sans risque pour le
  client encore déployé) — contrairement aux migrations 55/56/58 de cette session
  (destructives, différées jusqu'au prochain déploiement prod).
- `database.types.ts` collé tel quel depuis l'outil (pas retapé), leçon de la session
  précédente appliquée avec succès — aucune faute de frappe cette fois.
- Piège méthodologique rencontré en testant via MCP : un CTE référencé plusieurs fois
  (même avec `MATERIALIZED`) dans des sous-requêtes scalaires corrélées sur la MÊME
  requête ne voit pas toujours les effets de bord d'une fonction volatile insérés par une
  autre branche de la même requête — un premier test a semblé montrer « 0 vocabulaire »
  après un appel RPC qui en créait pourtant un. Recours systématique au pattern fiable
  déjà établi (table temporaire + `INSERT INTO ... SELECT` séquentiels, un appel RPC par
  instruction) dès qu'un test combine appel de fonction avec effet de bord et lecture du
  résultat dans la même requête.

---

## Idée future (non spécifiée, à ne PAS implémenter sans reformulation validée)

> **Quiz de grammaire auto-généré depuis les notes de grammaire de la fiche de fin de
> cours** — sur le même principe que les quiz vocabulaire/formulation (auto-générés
> depuis `vocabulary`/`formulations`, sans rien à écrire à la main). Actuellement, la
> grammaire (`grammar_rules`) n'alimente qu'un livre de consultation côté élève
> (النحو الميسّر), pas de quiz. Le propriétaire n'a pas encore d'idée précise de la
> mécanique de génération (une règle de grammaire n'a pas de structure question/
> réponse/distracteurs évidente comme un mot de vocabulaire ou une formulation
> ar↔fr). Remis à plus tard le temps qu'il affine l'idée — ne pas coder avant
> reformulation + validation explicite.

---

## Session 32 (suite 2) — Retrait du quiz de grammaire rédigé à la main

> **Demande propriétaire** : retirer l'onglet « Évaluations » côté enseignant (capture
> fournie) — jugé inutile, les élèves pratiquent déjà via les quiz auto-générés
> (vocabulaire/formulation) et les notes viennent des devoirs rendus. Demande explicite
> de tracer toutes les connexions et implications avant d'agir.
>
> **Connexion identifiée avant d'agir** : `/teacher/evaluations` sert à rédiger à la main
> des quiz de grammaire (question + bonne réponse + distracteurs), notifiés aux élèves.
> Le bloc élève correspondant (`GrammarQuizRunner`, section « Exercices de grammaire »)
> en dépend **entièrement** — pas de génération automatique côté grammaire (contrairement
> au vocabulaire/formulation). Vérifié MCP avant toute décision : **0 quiz de grammaire
> jamais créé, 0 question écrite, 0 notification `eval_due` envoyée** — jamais utilisé,
> le bloc élève est déjà invisible aujourd'hui. Décision validée par le propriétaire
> (AskUserQuestion) : retirer les deux bouts (écran prof + bloc élève + RPC + table),
> pas seulement l'écran prof visé par la capture.

### Plan
- [x] Suppression `src/app/teacher/evaluations/` (page, actions, `[quizId]/page.tsx`,
      `[quizId]/question-form.tsx`, `new/page.tsx`) — dossier entier
- [x] `drawer-nav.tsx` : retrait de l'entrée « Évaluations »
- [x] Suppression `src/app/dashboard/evaluations/grammar-quiz-runner.tsx` ;
      `evaluations-client.tsx` : retrait de `GrammarQuizRunner`/`grammarQuizzes`/
      variante `"grammar"` du type `ActiveQuiz` ; `page.tsx` : retrait de la requête
      des quiz de grammaire (+ le fetch `teacher_id` qui ne servait qu'à ça) ;
      `actions.ts` : retrait de `fetchGrammarQuizQuestions`/`submitGrammarQuiz` et
      des 4 types associés
- [x] `notif-bell.tsx` : retrait du libellé `eval_due`
- [x] Build (24 routes, les 3 routes `teacher/evaluations` ont disparu) + lint verts
      (9 problèmes au lieu de 12 — les 3 warnings `_formData` de l'ancien
      `teacher/evaluations/actions.ts` ont disparu avec le fichier ; seule l'erreur
      pré-existante `drawer-nav.tsx` subsiste) ; grep final 0 référence résiduelle
- [x] Migration 58 **rédigée** (`DROP FUNCTION get_grammar_quiz_questions/
      submit_grammar_quiz`, `DROP TABLE quiz_questions`, retrait des valeurs
      `grammar` de `quiz_source` et `eval_due` de `notification_type` — pattern
      rename→create→alter→drop) — **PAS appliquée** : pas de déploiement prod prévu
      cette session (accumulation de correctifs sur la preview), gardée pour le
      prochain lot de déploiement
- [ ] Push branche de session (preview) — pas de déploiement prod cette session
      (accumulation de correctifs demandée par le propriétaire)

---

## Session 32 (suite) — Retrait du suivi de présence

> **Demande propriétaire** : ne plus marquer la présence des élèves (captures fournies :
> badge « Présent » sur la liste des cours d'un livre et le détail d'un cours, côté
> élève). Vérifié en base (MCP) avant de coder : **9/9 séances existantes à `present`**,
> 0 absence jamais comptée, 0 élève jamais suspendu pour absence — confirme que la
> fonctionnalité n'est plus utilisée. Décisions validées par le propriétaire
> (AskUserQuestion) : (1) garder un statut manuel générique « Suspendu » (renommé, plus
> lié à un comptage) pour pouvoir suspendre un élève à la main plus tard, (2) nettoyage
> base de données complet (DROP colonne/enum/compteur, pas juste dormant).
>
> **Séquencement en 2 phases** (RPC critique <30s, base partagée) : phase 1 (rétrocompatible
> — `p_attendance` devient optionnel avec défaut `'present'`, comptage d'absences retiré du
> corps des RPC, aucun risque de casse pour l'ancien client) appliquée immédiatement ;
> phase 2 (destructive — DROP colonne/enum/compteur, signature RPC finalement simplifiée)
> **différée** jusqu'à confirmation du déploiement prod de cette session.

### Plan
- [x] Migration 56 (phase 1, rétrocompatible) : `p_attendance` devient optionnel
      (`DEFAULT 'present'`) sur `submit_session_record`/`update_session_record`
      (`CREATE OR REPLACE`, pas de DROP — Postgres autorise l'ajout d'un défaut à un
      paramètre existant, même non terminal) ; logique de comptage d'absences/
      auto-suspension retirée du corps des deux RPC. Testé MCP (impersonation Jefferson,
      transactions auto-rollback via `BEGIN`/`ROLLBACK` + table temporaire — le
      combo CTE+jointure directe ne voyait pas les lignes insérées par la fonction
      dans la même requête, contourné par des `INSERT INTO temp ... SELECT` séquentiels) :
      appel sans `p_attendance` → `present` par défaut ✔ ; appel avec `p_attendance=
      'absent_unjustified'` (ancien client) → toujours accepté, stocké, mais compteur
      et statut inchangés (0/active avant et après) ✔ ; `update_session_record` sans
      `p_attendance` → fonctionne, défaut appliqué ✔
- [x] Fiche de fin de cours (`session-form.tsx`) + édition (`edit-session-form.tsx`) :
      section « Présence » (grille 2×2) retirée, `attendance`/`presence` state retirés
- [x] Actions (`session/actions.ts`, `edit/actions.ts`, `library/[recordId]/actions.ts`) :
      lecture/validation de `attendance` retirée, `p_attendance` retiré des appels RPC
      (repose sur le défaut)
- [x] Affichage du badge « Présent » retiré sur 4 écrans (élève : liste des cours d'un
      livre, détail d'un cours ; prof : historique des séances, détail d'une séance) +
      `attendance` retiré des `.select()` correspondants
- [x] `status-badge.tsx` : `attendanceBadge` retiré ; `src/lib/attendance.ts` supprimé
      (ATTENDANCE_STATUSES/AttendanceStatus/isAttendanceStatus)
- [x] Compteur d'absences retiré : tuile « abs. injust. » (fiche élève prof, grille
      passée à 3 colonnes), ligne "X absences injustifiées" (liste des élèves),
      `unjustified_absences_count` retiré des `.select()`
- [x] Statut « Suspendu (absences) » → libellé générique « Suspendu » (`status-form.tsx`) ;
      widget cockpit (`teacher/page.tsx`) simplifié — plus de sous-ligne « raison »
      (n'avait plus de sens avec un seul statut non-actif restant) ; valeur d'enum
      interne `suspended_absences` **gardée telle quelle** (identifiant technique,
      pattern déjà établi pour `revolut_reference` — seul le libellé affiché change)
- [x] `database.types.ts` régénéré (collé tel quel depuis l'outil, pas retapé à la main
      — leçon de la session précédente) ; build (27 routes) + lint verts (seule l'erreur
      pré-existante `drawer-nav.tsx`) ; grep final 0 référence résiduelle
- [x] Migration 57 (phase 2, destructive) **rédigée** : DROP+CREATE des deux RPC sans
      `p_attendance`, `DROP COLUMN lesson_records.attendance`, `DROP TYPE
      attendance_status`, `DROP COLUMN students.unjustified_absences_count` —
      **PAS encore appliquée** (attend confirmation du déploiement prod)
- [ ] Push branche de session (preview) — validation propriétaire avant merge prod
- [ ] Merge prod (fast-forward `main` **et** branche de prod Vercel réelle
      `claude/new-project-setup-1jcgwf`) + confirmation `READY` via MCP Vercel
- [ ] Une fois confirmé : appliquer la migration 57 + régénérer `database.types.ts` +
      vérification empirique (advisor, colonnes/enum absents, données réelles intactes)

---

## Session 32 — Retrait de la fonctionnalité paiement in-app

> **Demande propriétaire** : retirer entièrement le paiement in-app (écrans « Mes
> paiements » élève / « Paiements » enseignant, captures fournies) — le paiement est
> géré 100% en externe, directement avec l'élève. Retirer aussi les emails (lien
> PayPal.Me via Resend) et toutes les connexions de code liées. Décisions validées par
> le propriétaire (AskUserQuestion) : (1) retirer aussi le statut manuel élève
> « Suspendu (paiement) » (`suspended_payment`), (2) nettoyage base de données complet
> (DROP, pas juste dormant) — table `payments` vide, 0 notification concernée, 0 élève
> à ce statut au moment du retrait (vérifié MCP).
>
> **Séquencement base partagée preview/prod** (rappelé au propriétaire, confirmé) :
> code d'abord (déployé en prod), migration de suppression **seulement après**
> confirmation du déploiement — sinon le code encore déployé en prod casse en
> appelant une table/RPC qui n'existe plus.

### Plan
- [x] Suppression `src/app/teacher/payments/` (page, actions, `send-payment-form.tsx`,
      `payment-actions.tsx`) et `src/app/dashboard/payments/` — dossiers entiers
- [x] Suppression `src/lib/paypal.ts` et `src/lib/resend.ts` (aucun autre consommateur —
      les invitations passent par l'auth Supabase, pas par Resend)
- [x] `drawer-nav.tsx` : retrait de l'entrée « Paiements » ; `dashboard/more/page.tsx` :
      retrait de l'entrée « Mes paiements »
- [x] `status-badge.tsx` : retrait de `paymentBadge` ; `notif-bell.tsx` : retrait des
      libellés `payment_requested`/`payment_confirmed`
- [x] Statut élève `suspended_payment` retiré de 6 fichiers : `status-form.tsx`
      (options + couleurs, type local découplé de `Database`), `teacher/students/actions.ts`
      (`VALID_STATUSES`), `students-list.tsx` (type + `STATUS_META`), `teacher/page.tsx`
      (`STATUS_LABEL` + requête `.eq` au lieu de `.in`), `teacher/students/page.tsx` +
      `[id]/page.tsx` (cast temporaire au point de lecture, retiré une fois la migration
      appliquée)
- [x] `package.json` : dépendance `resend` retirée, lockfile régénéré (`npm install`)
- [x] `.env.example` : blocs Resend + PayPal.Me retirés
- [x] Build (27 routes, les 2 routes paiement ont disparu) + lint verts (seule l'erreur
      pré-existante `drawer-nav.tsx` subsiste) ; grep final : 0 référence résiduelle à
      payment/paypal/resend dans `src/` (hors `database.types.ts`, généré)
- [x] Migration 55 rédigée (`DROP TABLE payments`, `DROP FUNCTION confirm_payment/
      cancel_payment`, `DROP TYPE payment_plan/payment_product/payment_status`, retrait
      des valeurs `payment_requested`/`payment_confirmed` de `notification_type` et
      `suspended_payment` de `student_status` — pattern rename→create→alter→drop,
      cohérent avec migration 47)
- [x] Propriétaire confirme (« vazi envoie en prod ») après clarification du séquencement
      base partagée (« tu testes bien » = flux normal respecté) : push preview → merge
      `main` **et** branche de prod Vercel réelle (`claude/new-project-setup-1jcgwf` —
      identifiée via MCP Vercel, PAS `main` seule) → déploiement prod confirmé `READY`
      sur `www.tatakalamu.fr` (MCP `get_deployment`) → migration 55 appliquée
- [x] Vérification empirique post-migration (MCP) : table `payments`/fonctions
      `confirm_payment`/`cancel_payment`/enums `payment_plan`/`payment_product`/
      `payment_status` tous absents ; 4 élèves réels intacts (statuts/genres/enseignant
      inchangés) ; advisor sécurité — mêmes WARN pré-existants acceptés, 0 nouveau
- [x] `database.types.ts` régénéré (MCP `generate_typescript_types`) ; 2 fautes de
      frappe corrigées lors de la retranscription manuelle (FK `vocabulary_lesson_
      record_id_fkey` pointait à tort vers `students` au lieu de `lesson_records` ;
      `CompositeTypes` helper référençait `CompositeTypeName` au lieu de
      `PublicCompositeTypeNameOrOptions` — attrapée par le build TS) ; casts temporaires
      retirés (enum DB déjà à jour) ; build + lint re-vérifiés verts après coup
- [x] Second cycle push preview → main → branche prod Vercel → déploiement `READY`
      confirmé sur `www.tatakalamu.fr`

### Review
- Fonctionnalité paiement in-app retirée intégralement : écrans (`/teacher/payments`,
  `/dashboard/payments`), formulaires, email PayPal.Me/Resend, statut manuel
  « Suspendu (paiement) », et en base la table `payments` + RPC `confirm_payment`/
  `cancel_payment` + 3 enums `payment_*` + 2 valeurs d'enum orphelines
  (`notification_type`, `student_status`). Le propriétaire gère désormais le paiement
  100% en externe, directement avec l'élève.
- **Découverte en cours de route** : la « branche de prod Vercel » n'est **pas** `main`
  mais `claude/new-project-setup-1jcgwf` (confirmé via l'historique des déploiements
  `target: "production"` du MCP Vercel) — les deux ont toujours été poussées ensemble
  jusqu'ici sans que ce soit vérifié explicitement cette session-ci. À retenir pour
  toute session future : ne pas supposer que `main` seule déclenche la prod, vérifier
  via `list_deployments`/`target` si le doute existe.
- Séquencement base partagée respecté à la lettre : code déployé et confirmé `READY`
  en prod (MCP `get_deployment`) **avant** l'exécution de la migration destructive —
  aucune fenêtre de casse.
- Deux petites fautes de frappe introduites en retranscrivant manuellement le fichier
  `database.types.ts` généré (au lieu d'un diff exact) — toutes deux attrapées par le
  build TypeScript avant tout commit/push, donc sans impact, mais confirme qu'un
  générateur devrait idéalement être appliqué tel quel plutôt que retapé.

---

## Session 31 (suite 8b) — Retouches livres/devoirs (retour propriétaire)

> Après test de la suite 8 : (1) retirer le lien « → cours » sous les règles du livre de
> grammaire ; (2) retirer le bloc « Devoir » de la présentation d'un cours (l'onglet
> Devoirs, lui, garde le nom du cours — c'est bien) ; (3) onglet Devoirs épuré : menu
> déroulant À faire / Correction en attente / Corrigé (défaut À faire, seuls ceux-là
> visibles) + un devoir corrigé **cliquable pour être revu** (pièces rendues + copie
> corrigée + retour + note, lecture seule) → l'élève suit sa progression.

- [x] `grammar-search.tsx` : lien « → cours » retiré (grammaire autonome)
- [x] `dashboard/cours/[recordId]` : bloc « Devoir » retiré (le devoir vit dans l'onglet
      Devoirs + cloche, pas dans le cours)
- [x] `dashboard/homework` : `page.tsx` (fetch + signature pièces/copie corrigée pour les
      corrigés) + nouveau `homework-tabs.tsx` (menu déroulant, défaut À faire, revue
      lecture seule des corrigés). Corrige au passage le manque « correction_file jamais
      affichée côté élève » (audit suite 4)
- [x] Build + lint verts (seule l'erreur pré-existante `drawer-nav.tsx`)
- [x] Vérif MCP : devoirs corrigés d'Anthony (2-3 pièces, feedback, note 18/20 ; pas encore
      de copie corrigée uploadée → lien masqué, pièces affichées) ; aucune migration
- [x] Push preview → validation propriétaire (capture accueil Anthony conforme) →
      **déployé** en prod (avec la suite 8) + tuiles d'accueil cliquables (vocab /
      expressions / dernière note → onglet Devoirs « Corrigé »)

---

## Session 31 (suite 8) — Cours rangés par livre (anti pollution visuelle)

> **Demande propriétaire (validée après plusieurs allers-retours)** : ranger les cours
> par **livre** sur l'accueil élève. 3 livres : العربية بين يديك (arabe), تهذيب قصص النبيين
> (récits), النحو الميسّر (grammaire, spécial). Accueil épuré. Clic sur une couverture →
> **page dédiée** au livre. Grammaire **automatique** (toute règle saisie va au livre
> grammaire, retirée du détail du cours côté élève). Fiche de fin de cours : radio
> « Livre » obligatoire (arabe/récits). Écran « Gérer mes livres ». Accueil : salutation
> + « En évolution depuis le [1ᵉʳ cours en lettres] » + 3 tuiles (Mots / Expressions /
> Dernière note), plus de tuiles séances/assiduité.

### Plan
- [ ] Migration 54 : table `course_books` (teacher, titre, sous-titre, cover_url, kind
      courses|grammar, order) + RLS (prof gère, élève lit ceux de son prof) ;
      `lesson_records.book_id` (FK, ON DELETE SET NULL) ; bucket public `book-covers` ;
      seed des 3 livres de Jefferson (couvertures en assets `public/books/`) ; backfill
      des 3 cours (التحية→arabe, بائع الأصنام+ولد آزر→récits ; grammaire = auto)
- [ ] Couvertures copiées dans `public/books/`
- [ ] `database.types.ts` : `course_books` + `lesson_records.book_id`
- [ ] Accueil élève (`dashboard/page.tsx`) : salutation + « En évolution depuis … » +
      3 tuiles (Mots/Expressions/Dernière note) + « Reprendre mes cours » + couvertures
      des livres où l'élève a du contenu → lien page dédiée
- [ ] Page livre `dashboard/livres/[bookId]` : cours du livre (courses) OU règles de
      grammaire (grammar) — épurée, en-tête couverture
- [ ] Détail cours élève (`dashboard/cours/[recordId]`) : retirer la grammaire (auto → livre)
- [ ] Fiche fin de cours (`session-form` + `new/page` + `actions`) : radio « Livre »
      obligatoire (livres kind=courses) → book_id posé après enregistrement (pas de RPC)
- [ ] Édition de cours (edit-session-form + page + actions) : radio prérempli + book_id
- [ ] Duplication (`library/[recordId]/actions`) : le cours dupliqué garde le book_id source
- [ ] « Gérer mes livres » (`teacher/books`) : liste + ajouter/renommer/couverture/supprimer
      (upload couverture direct + compressé) + entrée nav
- [x] Build (compilation OK, routes `/dashboard/livres/[bookId]` + `/teacher/books`) + lint
      (seule l'erreur pré-existante `drawer-nav.tsx`)
- [x] Tests MCP : backfill (arabe 1 cours / récits 2 cours / grammaire 0 = agrège les règles),
      0 fiche sans livre ; RLS — Anthony voit 3 livres (ceux de Jefferson) et **jamais** le
      livre d'une autre prof (inséré en test → toujours 3) ; Khadija voit 0 livre de Jefferson,
      1 des siens ; rangement `book_id` : Khadija bloquée (0 ligne), Jefferson autorisé (1) ;
      advisor 0 nouvelle catégorie
- [x] Push preview → validation → **déployé** en prod (fast-forward main + branche Vercel)

### Review
- Accueil élève repensé et épuré : salutation + « En évolution depuis le [1ᵉʳ cours en
  lettres] » + 3 tuiles (Mots / Expressions / Dernière note) + « Reprendre mes cours » avec
  les **couvertures des livres** (seulement ceux où l'élève a du contenu). Clic sur une
  couverture → **page dédiée** au livre.
- 3 livres seedés (arabe / récits / grammaire). La **grammaire est automatique** : le livre
  النحو agrège toutes les règles de l'élève (kind='grammar'), et la grammaire est retirée du
  détail du cours côté élève. Les 2 livres de cours affichent la liste de leurs cours.
- Fiche de fin de cours + édition + duplication : **livre obligatoire** (radio, arabe/récits),
  posé par simple mise à jour après la RPC (aucune RPC critique touchée). La duplication
  hérite du livre source.
- Écran **« Gérer mes livres »** (nav prof) : ajouter / modifier / supprimer un livre, avec
  upload de couverture (compressé + direct). Suppression bloquée si le livre contient des cours.
- Rétrocompat base partagée : `course_books` + `lesson_records.book_id` **additifs** ; l'ancien
  client prod ignore la colonne. Backfill par `course_group_id` (pas de doublon).

---

## Session 31 (suite 7) — Dépôt de devoir robuste (élève) + upload direct fiche de cours

> **Bug remonté (élève Anthony, capture)** : page 500 « server error » en rendant un
> devoir (photo) ; impossible de déposer +1 photo ; impossible de modifier/supprimer
> après coup. **Rapport validé par le propriétaire** (« je valide tout »).
> Cause racine : l'upload passe par un server action Next → plafond 1 Mo (et **Vercel
> plafonne le corps serverless à ~4,5 Mo**), donc une photo iPhone plante avant même
> d'exécuter le code. Fix : **upload direct navigateur → Supabase Storage** (le fichier
> ne transite plus par le serveur), multi-fichiers, édition/suppression tant que non
> corrigé. Même correctif appliqué à la fiche de fin de cours (même piège latent).

### Plan
- [x] Migration 53 : `homework.submission_files jsonb` (liste, comme `support_files`) +
      backfill depuis `submission_file` (gardé + synchronisé pour l'ancien client prod) ;
      buckets `homework-submissions`/`session-files` → 20 Mo ; policy student DELETE sur
      son dossier `homework-submissions` (nettoyage) ; nouvelle RPC
      `submit_homework(uuid, jsonb)` (remplace la liste, statut rendu/à_rendre, verrou
      après correction, valide chemins dans le dossier de l'élève, notifie au 1ᵉʳ dépôt) —
      **coexiste** avec l'ancienne `(uuid, text)` (ancien client prod, resynchronisée aussi)
- [x] `database.types.ts` : `submission_files` + surcharge RPC (union) — édits ciblés
- [x] Helper client `src/lib/upload-files.ts` (`uploadFilesToBucket`/`removeFilesFromBucket`)
- [x] Devoir élève : `hw-submit-form` multi-photos + audio, upload direct navigateur, liste
      éditable (ajouter/retirer/miniatures), re-soumission ; `actions.ts` (`saveHomeworkSubmission`)
      ne reçoit que les chemins ; `page.tsx` affiche le formulaire tant que `a_rendre`/`rendu`
      (verrou après correction) + compteur de pièces
- [x] Vue prof `teacher/homework` : signe et affiche plusieurs pièces (image/audio/fichier)
- [x] Fiche de fin de cours : **choix de portée** — plutôt qu'un refactor risqué du composant
      critique <30s (non testable en navigateur ici), plafond server action relevé à 20 Mo
      (`next.config.ts`) → lève le blocage 1 Mo. Audios de formulation déjà minuscules (64 kbps) ;
      supports couverts jusqu'au plafond plateforme Vercel (~4,5 Mo). Direct-upload complet
      de la fiche = follow-up dédié + testé si souhaité.
- [x] Build (compilation OK) + lint verts (seule l'erreur pré-existante `drawer-nav.tsx`)
- [x] Vérif MCP (impersonation Anthony, transactions ROLLBACK, données réelles intactes) :
      dépôt 2 fichiers → rendu + liste + 1ʳᵉ pièce compat + 1 notif ✔ ; chemin d'un autre
      élève → rejeté (42501) ✔ ; verrou après correction → rejeté ✔ ; liste vide → retour
      à_rendre + submitted_at NULL ✔ ; ancienne surcharge texte alimente aussi submission_files ✔
- [x] Push preview — validation propriétaire avant merge prod
- [x] Test manuel propriétaire → **tout fonctionne** (dépôt, correction, retour vu par l'élève).
      Seul retour : envoi **trop lent**. Correctif : **compression d'image navigateur** avant
      upload (`src/lib/compress-image.ts` : ~1800 px, JPEG 0,8, orientation EXIF respectée,
      audio/PDF/HEIC-non-décodable passent tels quels) → poids ÷5–15 ; + uploads **parallélisés**
      (`uploadFilesToBucket` en `Promise.all`). Build + lint verts.
- [x] Test manuel propriétaire sur la preview (vitesse d'envoi désormais correcte) → validé
- [x] **Déployé** : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- Dépôt de devoir refait à neuf côté élève : **plusieurs photos et/ou un audio** par devoir,
  **upload direct navigateur → Storage** (le fichier ne transite plus par le server action,
  fini le crash 500 sur les photos iPhone), **liste éditable** (ajouter/retirer) et
  **re-soumission tant que non corrigé** (verrouillé une fois corrigé — le travail de
  correction du prof est protégé).
- Côté prof, la file de correction affiche **toutes les pièces** déposées (image / audio /
  fichier), plus une seule.
- Fiche de fin de cours : plafond relevé à 20 Mo (lève le blocage 1 Mo) sans toucher au
  composant critique. Direct-upload complet possible en follow-up dédié.
- Rétrocompatible base partagée : colonne + RPC **additives**, ancienne RPC conservée et
  resynchronisée → l'ancien client prod continue de fonctionner pendant la fenêtre preview/prod.

---

## Session 31 (suite 6) — Quiz formulation : 3ᵉ mode « FR → écoute des 4 audios »

> **Demande propriétaire (reformulée + validée)** : maintenant que TOUS les audios de
> formulation existent, ajouter au quiz un 3ᵉ mode dans le sens FR→AR mais avec les
> réponses en audio : la **question est en texte français**, les **4 propositions sont
> des audios arabes** (la bonne + 3 distracteurs audio), l'élève écoute et retrouve
> lequel traduit la phrase. Filet de sécurité validé : ce mode ne se déclenche que si
> la source ET assez de distracteurs ont un audio ; sinon on retombe sur le FR→AR texte.
> Anti-triche : aucun texte arabe ni identifiant-source dans le payload (rien à lire/
> corréler en devtools) — cohérent avec le mode AR→FR existant.

### Plan
- [x] Migration 51 : `generate_formulation_quiz` gagne la direction `fr_to_ar_audio`
      (source AVEC audio + ≥3 autres formulations AVEC audio → 4 audio_choices {id,
      audio_path} mélangés, prompt = texte FR, PAS de form_id source dans le payload) ;
      `submit_formulation_quiz` score `fr_to_ar_audio` par correspondance du FR de la
      formulation choisie avec le prompt (leak-free), renvoie l'arabe choisi/cible pour
      la revue. CREATE OR REPLACE (signatures inchangées).
- [x] `database.types.ts` : inchangé (signatures RPC identiques → aucun diff)
- [x] `actions.ts` : `QuizQuestion.audio_choices?`, `QuizAnswer.prompt?`, direction
      `fr_to_ar_audio` ; signature des URLs des audios de choix (batch), drop d'une
      question audio si une signature échoue ; mapping submit spécifique au nouveau mode
- [x] `quiz-player.tsx` : rendu des choix audio (écouter + « Choisir »), label question,
      revue (arabe = réponses des 2 sens FR→AR) ; `AudioPrompt` variante neutre
- [x] `formulation-quiz-runner.tsx` : intro + label du 3ᵉ mode
- [x] Build (30 routes, compilation OK) + lint verts (seule l'erreur pré-existante
      `drawer-nav.tsx` subsiste, mes fichiers 0 problème)
- [x] Vérif MCP (impersonation Hamza/Anthony, transactions/auto-rollback, données réelles
      intactes 14/14) : mode `fr_to_ar_audio` apparaît (120/210 tirages), **4** choix audio
      toujours, bonne réponse toujours présente parmi les 4, clés des choix = {id,
      audio_path} uniquement, **0** caractère arabe et **0** form_id-source dans le payload ;
      scoring 1/2 (bonne puis mauvaise réponse) ✔ ; Anthony (1 formulation/0 audio) →
      quiz vide sans crash (fallback) ✔ ; advisor 0 nouvelle catégorie ; test non persisté
- [x] **Migration 52 (drapeau de compatibilité)** : base partagée preview/prod → le
      client PROD actuel (ancien code) planterait s'il recevait une question audio-choix.
      Ajout de `p_allow_audio_choices boolean DEFAULT false` (DROP+CREATE) : seul le
      nouveau client passe `true`, l'ancien tombe sur le défaut et ne reçoit jamais le
      nouveau mode. Vérifié MCP : appel 2-args → 0/105 audio ✔ ; appel avec flag → 45/105 ✔.
      `database.types.ts` mis à jour (édit ciblé), client passe le flag.
- [x] Push branche de session (preview) — merge prod après validation propriétaire
- [x] Test manuel du propriétaire sur la preview (écoute réelle des 4 audios + choix) → validé
- [x] **Déployé** : fast-forward `main` + branche de prod Vercel depuis la branche de session

### Review
- Le quiz formulation a désormais **3 modes** au lieu de 2 : AR→FR (écoute la voix du
  prof → choix FR texte), FR→AR texte (lis le FR → choix arabe texte), et le nouveau
  **FR→AR audio** (lis la phrase française → écoute les **4 propositions audio arabes** et
  choisis celle qui la traduit). Chaque proposition = un bouton « Écouter » + « Choisir ».
- Filet de sécurité respecté : le mode audio-choix ne se déclenche que si la source ET
  au moins 3 autres formulations ont un audio ; sinon on retombe sur les modes texte
  (Anthony, sans audio, ne le voit jamais — quiz vide sans planter).
- Anti-triche **leak-free** prouvé empiriquement : le payload d'une question FR→AR audio
  ne contient ni texte arabe ni identifiant-source (seulement le prompt FR affiché + 4
  audios {id opaque, url signée} mélangés). Le scoring serveur passe par la correspondance
  du français choisi avec le prompt — aucun id-source à corréler dans les devtools.
- Aucun changement de signature RPC (CREATE OR REPLACE), aucune nouvelle table/colonne —
  purement de la logique de génération/scoring + le rendu client des choix audio.

---

## Session 31 (suite 5) — Un seul quiz visible à la fois

> **Bug remonté par le propriétaire** (capture d'écran) : sur `/dashboard/evaluations`,
> les 3 quiz (vocabulaire, formulation, grammaire) restent tous visibles pendant qu'on
> en fait un — au point de pouvoir lancer deux quiz simultanément (les deux fonctionnent
> en parallèle). Demande : dès qu'un quiz démarre, le reste de la page ne doit plus rien
> afficher que ce quiz.

### Plan
- [x] `QuizPlayer` (`quiz-player.tsx`, partagé vocab+formulation) : prop
      `onActiveChange?(active: boolean)`, déclenchée **dès le clic** sur « Commencer »
      (avant même la réponse serveur — empêche tout lancement concurrent, pas seulement
      un masquage visuel après coup) et à `false` sur retour à l'état idle (`restart`)
- [x] `GrammarQuizRunner` : même prop `onActiveChange`, mêmes points de déclenchement
      (`start`/`reset`)
- [x] `QuizRunner`/`FormulationQuizRunner` : relaient simplement la prop à `QuizPlayer`
- [x] Nouveau `evaluations-client.tsx` (composant client) : état partagé
      `active: "vocab" | "formulation" | "grammar" | null`, masque le titre "Évaluations"
      et les 2 autres sections dès qu'un quiz est actif, les réaffiche au retour à idle
- [x] `page.tsx` simplifié : ne fait plus que le fetch serveur, délègue l'affichage à
      `EvaluationsClient`
- [x] Build (30 routes, 0 erreur) + lint verts (aucune régression, seule l'erreur
      pré-existante `drawer-nav.tsx` subsiste)
- [x] Push branche de session (preview) — merge prod après validation propriétaire

### Review
- Dès qu'un quiz démarre (n'importe lequel des 3), la page ne montre plus que lui — plus
  de contenu résiduel, plus de lancement simultané possible (le clic sur « Commencer »
  masque immédiatement les autres boutons de lancement, avant même la réponse serveur).
- Aucune migration, aucun changement de RPC — purement un état client remonté d'un
  niveau, les 3 lanceurs existants sont inchangés dans leur logique interne.

---

## Session 31 (suite 4) — Audit code mort + lag

> **Demande propriétaire** : "vérifie tout le code pour retirer le code mort et le lag,
> ne corrige que ce qui est utile, ne casse rien, vérifie toutes les connexions avant de
> supprimer quoi que ce soit." 2 sous-agents en parallèle (code mort / performance),
> chaque finding re-vérifié personnellement (grep + MCP) avant toute action.

### Code mort retiré (vérifié : 0 référence code + 0 dépendance DB avant suppression)
- [x] `isPaypalConfigured()` (`src/lib/paypal.ts`) : export jamais appelé, retiré
- [x] `students.gender` retiré des `.select()` de `teacher/students/page.tsx` et `[id]/page.tsx`
      (sélectionné mais jamais lu dans le mapping — sur-fetch, pas une suppression DB)
- [x] `profile` déstructuré non utilisé dans `dashboard/layout.tsx` (déjà signalé par ESLint)
- [x] Migration 50 : `DROP FUNCTION get_public_teachers()` (résidu de la vitrine publique/tunnel
      d'essai, supprimés en bloc session 31 — la RPC avait survécu) ; `DROP COLUMN`
      `students.trial_credit_cents`, `students.onboarding_completed`,
      `payments.trial_credit_cents`, `payments.period` (résidus tunnel d'essai/cron de
      relances abandonnés). Vérifié avant coup : 0 référence code (grep), 0 valeur
      non-défaut sur TOUTES les lignes réelles, 0 policy/index/fonction dépendante (MCP).
- [x] `database.types.ts` : édits ciblés (colonnes + fonction retirées)

### Signalé, PAS touché (incertain — décision propriétaire requise)
- Valeurs d'enum `notification_type` orphelines (`trial_request`, `session_reminder`) —
  retrait d'enum invasif (rename→create→alter→drop), laissé tel quel.
- `homework.seen_at` + statut `'vu'` : jamais positionné par le code — feature prévue
  jamais câblée (comme `homework_due` avant son fix session 29), ou vestige ? À trancher.
- `payment_status = 'failed'` : jamais positionné, probablement gardé pour un futur webhook.
- **`homework.correction_file` non affiché côté élève** (`dashboard/homework/page.tsx` ne le
  sélectionne pas) : bug fonctionnel réel (pas du code mort), le prof peut uploader une
  correction que l'élève ne voit jamais. Hors périmètre de cette session (fix de contenu,
  pas nettoyage) — signalé au propriétaire pour une prochaine session.

### Performance : correctifs appliqués (comportement inchangé, gain de vitesse uniquement)
- [x] `teacher/session/actions.ts` (fiche de fin de cours, écran <30s) : uploads supports +
      audios de formulation parallélisés (`Promise.all`) par élève au lieu de séquentiels
- [x] `teacher/library/[recordId]/actions.ts` (duplication) : copies Storage (supports +
      audios) parallélisées par élève cible
- [x] `sessions/[recordId]/edit/actions.ts` : mêmes uploads parallélisés + requêtes
      indépendantes (`oldForms`, `existingHomework`) regroupées en un seul `Promise.all`
- [x] Checks d'erreur manquants ajoutés (`console.error`) sur 3 requêtes à jointure
      embarquée sans check : `teacher/session/new/page.tsx` (`studentRows`, oubli antérieur
      à cette session), `library/[recordId]/page.tsx` (`record`), `library/[recordId]/actions.ts`
      (`groupMembers`)

### Signalé, PAS appliqué (changerait un comportement, décision produit)
- Paralléliser la boucle EXTERNE sur les élèves (fiche multi-élèves + duplication) irait
  plus loin en vitesse, mais changerait la sémantique d'erreur : aujourd'hui un échec sur
  l'élève 2 arrête l'élève 3 (fail-fast) ; en parallèle, tous seraient tentés et les erreurs
  agrégées après coup. Probablement préférable (un échec isolé ne devrait pas priver les
  autres élèves), mais c'est un choix produit, pas un pur gain "sûr" — non appliqué sans
  validation propriétaire.

### Vérification
- [x] Build (30 routes, 0 erreur TS) + lint (14 problèmes au lieu de 15 — le fix `profile`
      inutilisé en a résorbé un ; seule l'erreur pré-existante `drawer-nav.tsx` subsiste)
- [x] MCP : advisor sécurité après migration 50 — `get_public_teachers` absent de la liste,
      0 nouveau WARN, mêmes acceptés qu'avant ; 4 élèves réels (Anthony/Bilel/Hamza/Rayan)
      intacts, statuts et compteurs d'absences inchangés
- [x] Push branche de session (preview) — merge prod après validation propriétaire

### Review
- Nettoyage ciblé : 1 RPC morte + 4 colonnes orphelines (résidus tunnel d'essai/cron déjà
  déclarés abandonnés en session 31) retirées de la base, 3 petits exports/champs de code
  mort retirés côté app. Aucune table/fonctionnalité active touchée.
- Gain de vitesse concret sur les 3 écrans qui uploadent des fichiers (fiche de fin de
  cours, duplication, édition) : uploads/copies indépendants désormais parallèles au lieu
  de séquentiels, sans changement de comportement visible.
- 4 points restent signalés sans action (2 ambigus, 1 bug fonctionnel hors périmètre, 1
  optimisation supplémentaire qui changerait un comportement) — décisions propriétaire.

---

## Session 31 (suite 3) — Anti-doublon bibliothèque (course_group_id)

> **Retour propriétaire après test** : la bibliothèque affichait chaque cours en
> double (une fiche par élève). Décision validée (AskUserQuestion) : **regrouper par
> identifiant de cours partagé** — un cours = une carte, même donné à plusieurs
> élèves. Options écartées : bibliothèque de modèles séparée (trop lourd),
> dédoublonnage par titre seul (fragile si 2 cours même titre).

### Plan
- [x] Migration 49 : `lesson_records.course_group_id uuid NOT NULL DEFAULT gen_random_uuid()`
      (chaque INSERT obtient un groupe frais automatiquement) + rattrapage des cours
      existants (même `(teacher_id, custom_title)` → même groupe : 6 fiches → 3 groupes) +
      `submit_session_record` gagne `p_course_group_id` (DROP+CREATE, nouveau param à la fin,
      `COALESCE(p_course_group_id, gen_random_uuid())` à l'insert)
- [x] `database.types.ts` : `course_group_id` sur lesson_records (Row/Insert/Update) +
      `p_course_group_id?` sur submit_session_record
- [x] Fiche multi-élèves (`session/actions.ts`) : `crypto.randomUUID()` unique partagé par
      tous les élèves cochés d'une même saisie
- [x] Duplication (`library/[recordId]/actions.ts`) : les cibles rejoignent le
      `course_group_id` du cours source ; ignore (serveur + UI) les élèves déjà dans le groupe
- [x] Bibliothèque (`library/page.tsx`) : regroupe par `course_group_id`, représentant = la
      fiche la plus récemment modifiée, carte « Donné à X, Y » au lieu d'une par élève
- [x] Page duplication : élèves ayant déjà le cours marqués « a déjà ce cours » (désactivés)
- [x] Build (31 routes) + lint verts (mêmes pré-existants) ; MCP (impersonation, rollback) :
      fiche multi + duplication → 1 groupe de 3 élèves ✔ ; fiche solo → groupe distinct de 1 ✔ ;
      rattrapage confirmé (3 titres = 3 groupes) ✔ ; advisor 0 nouveau
- [x] Push branche de session (preview) — merge prod après validation propriétaire
- [ ] Test manuel du propriétaire sur la preview (bibliothèque = 3 cartes, pas 6)
- [ ] Après validation : fast-forward `main` + branche de prod Vercel

### Review
- La bibliothèque affiche désormais **un cours = une carte** (« Donné à Bilel, Rayan »),
  fini les doublons par élève. Repose sur un `course_group_id` partagé, posé
  automatiquement à la saisie multi-élèves et à la duplication ; les fiches existantes
  ont été regroupées par (enseignant, titre).
- Une fiche mono-élève reste un cours à part entière (groupe de 1). Deux saisies séparées
  du même titre restent deux cours distincts (choix assumé : le regroupement suit la
  saisie/duplication réelle, pas le titre — cohérent avec l'option choisie).

---

## Session 31 (suite 2) — Dupliquer un cours (bibliothèque enseignant)

> **Demande propriétaire (validée après reformulation)** : pouvoir dupliquer un cours
> déjà donné à un élève vers un ou plusieurs autres élèves, pour éviter de tout
> réécrire/réenregistrer. Copie **indépendante** (le cours dupliqué vit sa vie, aucun
> lien avec l'original). Nouvel onglet enseignant listant TOUS les cours donnés, d'où
> on peut les « dispatcher ». Cette fois les **audios sont copiés aussi** (l'action
> tourne en prod, accès Storage réel via `.copy()` — la limite du sandbox ne s'applique pas).
>
> **Noté pour PLUS TARD (pas dans ce périmètre)** : organiser les cours par livre —
> le propriétaire s'appuie sur 2 livres (étude de texte / expression orale), tous les
> élèves ne suivent pas les deux (Anthony = 1 livre, Rayan = l'autre, Bilel = les deux).
> Étiqueter/filtrer les cours par livre pour aider à la répartition. À faire dans une
> session future, pas maintenant.

### Plan
- [x] Nouvel onglet `Bibliothèque` dans `drawer-nav.tsx` (après « Fin de cours »)
- [x] `/teacher/library/page.tsx` : catalogue de tous les `lesson_records` de l'enseignant
      (RLS), carte par cours = titre + élève d'origine + date + compteurs (mots / règles /
      formulations dont N audios / supports), lien « Dupliquer » + bandeau de confirmation
- [x] `/teacher/library/[recordId]/page.tsx` : aperçu lecture seule du contenu +
      `DuplicateForm` (cases à cocher élèves cibles, badge « cours d'origine »)
- [x] `/teacher/library/[recordId]/actions.ts` : `duplicateSession` — pour chaque cible,
      copie Storage `.copy()` des audios de formulation (→ dossier de la cible) et des
      supports (→ dossier de la cible), puis réutilise `submit_session_record`
      (attendance=present, mêmes titre/récap/date/vocab/grammaire/formulations+nouveaux
      audios/supports ; PAS de devoir ni note privée — spécifiques à l'élève d'origine)
- [x] Build (31 routes, 0 erreur TS) + lint verts (0 nouvelle erreur/warning sur les
      fichiers library — seuls les pré-existants subsistent)
- [x] Vérification MCP (impersonation Jefferson, transaction ROLLBACK, aucune donnée réelle
      modifiée) : duplication du cours audio de Bilel (14 formulations/14 audios) vers
      Anthony → 14 formulations créées, 14 audios, tous les audio_path dans le dossier
      d'Anthony ✔ ; source Bilel intacte (14 forms, audios dans SON dossier) ✔ ; nouveau
      cours sans devoir ni note privée ✔ ; attendance=present ne compte pas d'absence ✔.
      Limite assumée : le `.copy()` Storage lui-même n'est testable qu'au runtime (API
      Storage, pas SQL) — sa RLS sous-jacente (teacher scopé à ses élèves des deux côtés du
      copy) a été prouvée session précédente.
- [x] Push branche de session (preview) — merge prod après validation propriétaire
- [ ] Test manuel du propriétaire sur la preview (dupliquer un vrai cours + vérifier que
      l'audio est lisible chez la cible)
- [ ] Après validation : fast-forward `main` + branche de prod Vercel

### Review
- Nouvel onglet **Bibliothèque** listant tous les cours donnés (tous élèves confondus),
  d'où on duplique un cours vers un ou plusieurs autres élèves en une fois.
- Copie **indépendante** : nouveau `lesson_record` chez la cible avec vocabulaire,
  grammaire, formulations **et leurs audios** (fichiers réellement recopiés dans le
  dossier Storage de la cible via `.copy()`, pour que la RLS lui en donne l'accès), plus
  les fichiers supports. Devoir et note privée volontairement exclus.
- Réutilise `submit_session_record` (aucune nouvelle RPC/migration) — le contenu source
  est relu puis re-soumis, les fichiers recopiés avant l'appel.
- **Déféré / noté pour plus tard** (demande explicite du propriétaire) : organisation des
  cours par livre (2 livres : étude de texte / expression orale ; répartition variable
  selon l'élève). Pas construit cette session.

---

## Session 31 (suite) — Audio de formulation (compréhension orale au quiz)

> **Demande propriétaire (validée après reformulation)** : pouvoir enregistrer sa voix
> (expression arabe) pour chaque formulation en fiche de fin de cours. L'audio ne sert
> QUE dans le quiz de formulation : le sens AR→FR devient exclusivement audio (écoute
> ma voix → choisis la traduction FR) ; le sens FR→AR reste en texte. Une formulation
> sans audio ne peut plus apparaître en AR→FR (filet de sécurité — il prévoit de tout
> enregistrer). Jamais d'audio sur les pages de consultation élève.

### Plan
- [x] Migration 48 : `formulations.audio_path text` ; bucket privé `formulation-audio`
      (policies : teacher scopé à SES élèves via `owns_student` — plus strict que le
      pattern session-files —, élève SELECT son dossier) ;
      `submit_session_record`/`update_session_record` (CREATE OR REPLACE, même
      signature — `audio_path` lu dans le jsonb existant, compatible client déployé) ;
      `generate_formulation_quiz` : AR→FR seulement si `audio_path` présent
      (payload avec `audio_path`, SANS texte arabe ni prompt), sinon toujours FR→AR
- [x] `database.types.ts` : édit ciblé (colonne `audio_path` sur formulations)
- [x] Composant `AudioRecorderInput` (MediaRecorder → input file caché via
      DataTransfer, préférence audio/mp4 puis webm pour compat lecture iOS/Android ;
      toujours rendu même vide pour garder l'alignement d'index des lignes)
- [x] Fiche de fin de cours : micro par ligne de formulation, upload par élève
      coché dans `formulation-audio/{student_id}/…`, `audio_path` passé à la RPC
- [x] Édition de séance : audio existant (conserver / réenregistrer / retirer via
      hidden `form_audio_existing`), nettoyage Storage best-effort des orphelins
- [x] `deleteSession` : nettoyage best-effort des audios de formulation du cours
- [x] Quiz élève : `generateFormulationQuiz` signe les URLs (1h, RLS Storage fait
      autorité) et écarte une question AR→FR dont la signature échoue ; `QuizPlayer`
      affiche un bouton Écouter au lieu du texte (+ réécoute dans le récap de fin) ;
      libellés compréhension orale
- [x] Pages de consultation élève : vérifié — colonnes explicites partout,
      `audio_path` ne fuit nulle part (aucun changement nécessaire)
- [x] Build + lint verts (29 routes, 0 nouvelle erreur — seule `drawer-nav.tsx`
      pré-existante)
- [x] Vérification MCP (impersonation Jefferson/Anthony/Bilel/Khadija, transactions
      ROLLBACK, données réelles intactes — 28 formulations/0 audio/0 objet bucket
      reconfirmés après) :
      - submit : 3 formulations avec audio + 2 sans persistées ✔
      - 20 tirages × 5 questions : 34 AR→FR / 66 FR→AR, **0** AR→FR issue d'une
        formulation sans audio, **0** fuite prompt/texte arabe, **0** AR→FR sans
        audio_path ✔
      - update : audio remplacé (A→B) ✔, retiré (NULL) ✔ ; scoring quiz audio
        1/2 (bonne puis mauvaise réponse) ✔
      - RLS bucket : Jefferson écrit chez son élève ✔, Khadija bloquée (42501) sur
        l'élève d'autrui ✔, Anthony lit son fichier ✔, Bilel voit 0 ligne du
        dossier d'Anthony ✔
      - Advisor sécurité : mêmes WARN pré-existants, 0 nouveau
- [x] Push branche de session (preview) — merge prod après validation propriétaire
- [ ] Test manuel du propriétaire sur la preview (enregistrement micro réel depuis
      son téléphone + lecture côté élève — non testable depuis ce sandbox)
- [ ] Après validation : fast-forward `main` + branche de prod Vercel

---

## Session 31 — Clôture des intégrations abandonnées + nettoyage `.env.example`

> **Demande propriétaire** : ne garder dans le todo qu'un seul point en attente
> (domaine OVH → Resend, remis à plus tard) ; tout le reste des anciens
> « reste à faire » (PayPal.Me/cron de relance, Revolut Merchant, Bunny Stream,
> enforcement serveur Zoom/visio) est **abandonné**. Vérifier qu'aucun code
> mort ne traîne encore en lien avec ces sujets avant de les rayer.

### Vérification code (avant clôture)
- [x] `revolut.ts` / webhook `/api/webhooks/revolut` / `CRON_SECRET` : 0 fichier, 0 référence — déjà supprimés en session 21 (suite) et 22. `revolut_reference`/`revolut_order_id` restent en base **intentionnellement** comme nom de colonne générique de référence de paiement (décision déjà actée session 21, pas un résidu à corriger).
- [x] Bunny Stream : 0 référence dans `src/` (tables `videos`/`milestone_video_assignments`/`video_views` déjà droppées migration 41, session 29). Seul résidu trouvé : `.env.example` listait encore `BUNNY_STREAM_LIBRARY_ID`/`_API_KEY`/`_CDN_HOSTNAME` → **retiré**.
- [x] Zoom/visio enforcement serveur : 0 référence (`join-window.ts`, `NextCourseHero`, `/teacher/bookings`, tout le système de réservation ont été supprimés en bloc session 25 avec `bookings`/`teacher_availability`). Résidu trouvé : commentaire `.env.example` pointant vers `/teacher/bookings` (route inexistante) → réécrit pour refléter la réalité actuelle (lien Meet partagé à la main via la messagerie, aucun champ dédié).
- [x] PayPal.Me : toujours **actif** (pas abandonné) — `paypal.ts`, `/teacher/payments`, `/dashboard/payments` l'utilisent en production. Seule la ligne « renseigner `PAYPAL_ME_USERNAME` dans Vercel » était obsolète (fonctionnalité déjà en usage réel depuis plusieurs sessions, forcément déjà configurée) → retirée du todo.
- [x] Quota heures à la carte / report `moved` sur absence justifiée (§8 CLAUDE.md, différés session 16) : dépendaient tous deux du système de réservation (`bookings`), supprimé en bloc session 25 — désormais sans objet.

### Point signalé, non tranché (pas d'action prise)
- **Produit B (cours de groupe/livre)** : les tables `books`/`book_sessions`/`book_enrollments` (+ colonne `book_sessions.zoom_link`, valeurs d'enum `payment_product='book'`/`quiz_source='book'`) existent toujours en base depuis le tout premier lot (session 1, `05_group_product`) mais **aucun code applicatif** (page, server action, RPC dédiée) n'a jamais été construit dessus en 30 sessions — ce n'est pas un pivot/abandon documenté comme les autres, juste une partie du périmètre jamais démarrée. Toujours dans le périmètre CLAUDE.md (§1, §5, §7.4). **Non touché** : décision produit (garder en attente vs. dropper) qui appartient au propriétaire, pas déduite ici.

### Nettoyage
- [x] `.env.example` : bloc Bunny Stream retiré, commentaire Visio réécrit (route `/teacher/bookings` n'existe plus)
- [x] `todo.md` : seul point « reste à faire » encore ouvert désormais = domaine OVH → Resend → `EMAIL_FROM` (voir sessions 16/19/20/21/29, toujours en attente). Les anciennes occurrences historiques (PayPal.Me/CRON_SECRET/Revolut/Bunny/Zoom) sont laissées telles quelles dans leurs sections de session d'origine (journal chronologique, pas réécrit) mais ne constituent plus un todo actif — ce point de clôture fait foi.

### Suite de session — vitrine (question propriétaire) + Produit B (décision : drop)
> Propriétaire confirme : les cours de groupe se géreront **via Telegram**, hors app — donc Produit B (books/book_sessions/book_enrollments) est lui aussi abandonné, pas juste "jamais démarré". Demande aussi confirmation : la vitrine publique est-elle complètement supprimée ?

- [x] **Vitrine publique** : confirmé **entièrement supprimée** (pas dormante). `src/app/page.tsx` redirige directement vers `/login` (aucune page marketing). Aucun groupe de routes `(public)`, aucun composant `vitrine-*`, aucune page `/essai`/`/offres`/`/inscription` (tout supprimé en bloc session 25). Seul résidu trouvé : un commentaire dans `teacher/admin/teachers/actions.ts` (« Créer la fiche enseignant (vitrine) ») qui documente juste l'origine du champ `teachers` — pas du code de vitrine, laissé tel quel.
- [x] Migration 47 (`drop_group_book_product`) : `DROP TABLE book_enrollments, book_sessions, books` (les 3 vides, vérifié avant coup) ; suppression de la ligne de seed orpheline `quizzes` (scope=group, jamais consommée par l'app) ; colonne `quizzes.book_id` retirée (portait la FK vers `books`) ; nettoyage des valeurs d'enum devenues inutilisées : `quiz_scope` (`group` retiré, ne reste que `individual`), `quiz_source` (`book` retiré), `payment_product` (`book` retiré) — vérifié au préalable qu'aucune ligne ni aucune fonction/RPC ne les utilisait (`prosrc` grep sur toutes les fonctions `public.*` = 0 résultat).
- [x] `database.types.ts` régénéré via MCP (`generate_typescript_types`) — reflète exactement le schéma post-migration.
- [x] Vérification MCP : `list_tables` confirme les 3 tables absentes, `quizzes` passé de 6 à 5 lignes (seed orpheline retirée), advisor sécurité inchangé (mêmes WARN pré-existants acceptés, 0 nouvelle catégorie).
- [x] Build + lint verts (29 routes, 0 nouvelle erreur — seule l'erreur pré-existante `drawer-nav.tsx` subsiste).

### Review
- Seul reste ouvert : domaine OVH → Resend → `EMAIL_FROM` (remis à plus tard, propriétaire).
- Aucun code mort actif trouvé pour Revolut/Bunny/Zoom-enforcement — les pivots précédents (sessions 21, 22, 25, 29) avaient déjà fait le ménage ; seul `.env.example` avait deux résidus documentaires, corrigés.
- **Vitrine publique confirmée entièrement supprimée** (pas dormante) — la racine `/` redirige directement vers `/login`, aucune page/composant marketing ne subsiste.
- **Produit B (cours de groupe/livre) supprimé** sur confirmation propriétaire (gestion via Telegram, hors app) : tables `books`/`book_sessions`/`book_enrollments` droppées, colonne `quizzes.book_id` retirée, valeurs d'enum `group`/`book` nettoyées (`quiz_scope`, `quiz_source`, `payment_product`). Migration 47 appliquée + prouvée par MCP, types régénérés, build/lint verts.

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
- [x] Validation propriétaire → déployé : fast-forward `main` + branche de prod Vercel

### Review
- Audit complet par 3 sous-agents (code mort / perf / bugs d'affichage), rapport
  validé par le propriétaire, corrections appliquées en un lot : cache des gardes
  d'auth (gain perf sur toute navigation), retrait définitif des vestiges
  « Programme » (code + base), checks `error` généralisés sur 11 pages.
- Incident évité de justesse documenté : la base étant partagée preview/prod,
  la migration 46 a cassé l'affichage prod (3 écrans vides) entre son
  application et le merge — résolu en déployant immédiatement après validation.
- **Déployé en production.**

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

## Session 32 (suite 4) — 3 correctifs "Mes livres" / grammaire

Reformulation validée (propriétaire : "quoi que ce soit, je valide") :
1. **Retirer Modifier/Suppr sur "Mes livres"** : les fiches restent cliquables
   (entrée dans le contenu du livre), seul "Ajouter un livre" reste. Suppression
   complète du code mort associé (EditRow, updateBook, deleteBook) — plus
   personne ne les appelle.
2. **Bug groupement grammaire** : une règle donnée à 3 élèves dans une même
   fiche de fin de cours apparaît comme 3 cartes séparées côté enseignant, au
   lieu d'une carte groupée "Donné à X, Y, Z" comme pour les cours. Cause
   racine : `grammar_rules` n'a pas d'équivalent à `course_group_id`. Le
   `p_course_group_id` généré une fois par soumission (déjà envoyé à la RPC)
   n'est actuellement appliqué qu'aux `lesson_records`. Correctif : nouvelle
   colonne `grammar_rules.rule_group_id` (additive, `DEFAULT gen_random_uuid()`),
   stampée avec `p_course_group_id` dans `submit_session_record`/
   `update_session_record`, regroupement dans `GrammarRulesContent`. La
   duplication d'une règle individuelle NE rejoint PAS le groupe d'origine
   (nouvelle ligne indépendante, cohérent avec "je peux dispenser une règle
   sans suivre le même programme" — pas de garde "a déjà cette règle").
3. **Bug crash "Dupliquer" sur une règle de grammaire** : confirmé via les logs
   runtime Vercel (`get_runtime_errors`, digest `4195018424` = celui remonté
   par le propriétaire) : `/teacher/library/grammar/[ruleId]/page.tsx` passe
   une fonction JS brute (`submitLabelPlural={(n) => ...}`) d'un Server
   Component vers `DuplicateForm` (Client Component) — interdit par
   React/Next (une fonction ne peut traverser cette frontière sans être une
   Server Action). Le flux "cours" ne passe jamais cette prop (le défaut de
   `DuplicateForm` produit déjà exactement le même texte). Correctif : retirer
   la prop, garder le défaut.

### Plan
- [x] Retirer Modifier/Suppr de `book-manager.tsx` (+ `EditRow`, `editing`
      state, `run` helper, imports `updateBook`/`deleteBook`)
- [x] Supprimer `updateBook`/`deleteBook` de `teacher/books/actions.ts` (plus
      aucun appelant)
- [x] Migration `60_grammar_rule_group_id` (additive) : colonne
      `grammar_rules.rule_group_id uuid NOT NULL DEFAULT gen_random_uuid()` ;
      `submit_session_record`/`update_session_record` lisent une clé
      `rule_group_id` optionnelle dans chaque item de `p_grammar` (portée par
      le client, comme `p_course_group_id` — PAS générée côté RPC pour ne pas
      fusionner à tort plusieurs règles distinctes d'une même fiche)
- [x] Client : `session/actions.ts` génère un groupe par ligne de règle
      (`grammarGroupIds`), partagé entre tous les élèves cochés ; formulaire
      d'édition thread le `rule_group_id` existant via un hidden input
      (`grammar_rule_group_existing_{idx}`, même pattern que les photos
      existantes) pour le préserver après modification
- [x] `GrammarRulesContent` (`teacher/books/[bookId]/page.tsx`) : regroupe par
      `rule_group_id`, une carte par groupe, "Donné à X, Y, Z" comme les cours
- [x] Root cause du crash "Dupliquer" trouvée via les logs runtime Vercel
      (`get_runtime_errors`, digest `4195018424` = celui du propriétaire) :
      `submitLabelPlural={(n) => ...}` passait une fonction JS brute d'un
      Server Component vers `DuplicateForm` (Client Component) — interdit.
      Prop supprimée entièrement de `DuplicateForm` (plus aucun appelant ne
      l'utilisait, le défaut produisait déjà le même texte)
- [x] `database.types.ts` régénéré et collé verbatim
- [x] Testé via MCP (impersonation Jefferson, transactions ROLLBACK) :
      soumission 3 élèves (Anthony/Bilel/Hamza) avec le même `rule_group_id`
      → un seul groupe confirmé ; ancien client sans la clé → groupes
      distincts par ligne (rétrocompatible) ; duplication (insert sans
      `rule_group_id`) → nouveau groupe indépendant via le DEFAULT ; édition
      avec `rule_group_id` renvoyé → conservé après le DELETE+INSERT ;
      Khadija ne peut lire aucune règle d'un élève de Jefferson (0 ligne)
- [x] `npm run build` + `npm run lint` : verts (seule erreur = `drawer-nav.tsx`,
      pré-existante, déjà documentée, sans rapport)
- [x] Commit + push preview (pas de déploiement prod demandé)
- [x] **Correctif complémentaire** : le propriétaire a signalé que la règle
      "Le mot = الكَلِمَةُ" (donnée à Hamza, Bilel, Anthony le 11-12/07, donc
      AVANT la migration 60) restait affichée en 3 cartes distinctes. Cause :
      la migration 60 a donné à chaque ligne EXISTANTE son propre
      `rule_group_id` indépendant via le `DEFAULT gen_random_uuid()` — seules
      les lignes créées APRÈS le déploiement du nouveau code (qui envoie la clé
      `rule_group_id`) sont groupées par le client. Corrigé par un backfill
      ponctuel (migration 61) : les 3 lignes historiques partagent déjà le même
      `lesson_records.course_group_id` (créées par la même boucle d'origine) —
      fusion par `(course_group_id, title, content)`. Vérifié avant/après via
      MCP : exactement 1 groupe à fusionner détecté et fusionné, 0 fusion
      erronée après coup sur l'ensemble de la table.
- [x] **Correctif complémentaire 2** : retrait du nom des élèves affiché sur
      les cartes (cours ET grammaire) dans "Mes livres" — demande explicite du
      propriétaire ("à terme ça peut porter préjudice"), jugé redondant avec
      l'écran "Dupliquer" qui montre déjà l'attribution via les cases cochées/
      grisées. Ne conserve que titre + date sur la carte. Suppression complète
      de l'embed `students(profiles(full_name))` des deux requêtes (plus
      seulement non-affiché : plus du tout récupéré ni tenu en mémoire).

### Review
- Les 3 correctifs demandés sont en place : plus de Modifier/Suppr sur "Mes
  livres" (fiches purement cliquables) ; une règle de grammaire donnée à
  plusieurs élèves dans une même fiche s'affiche désormais comme une seule
  carte groupée côté enseignant ; la page de duplication d'une règle de
  grammaire ne crashe plus (cause racine confirmée par les logs Vercel, pas
  une supposition).
- Le regroupement des règles est porté par le client (une valeur générée par
  ligne de règle, jamais côté RPC) car une même fiche peut contenir plusieurs
  règles distinctes pour un même élève — les regrouper par soumission entière
  aurait fusionné à tort des règles différentes.
  (Formulations), après validation manuelle du propriétaire sur la preview.

## Session 32 (suite 4 quater) — 3 ajustements après test manuel

Reformulation validée à partir des captures d'écran et retours du propriétaire :
1. **Retirer l'attribution ("Cours de X" / "Règle de X") en haut des fiches**
   `/teacher/library/[recordId]` et `/teacher/library/grammar/[ruleId]` —
   même rationale que le retrait des noms sur les cartes (redondant, risque à
   terme). Ne garde que le titre + la date.
2. **Bug réel trouvé en testant** : sur la page de duplication d'une règle de
   grammaire groupée, les élèves qui possèdent DÉJÀ la règle (même
   `rule_group_id`) apparaissaient comme sélectionnables au lieu d'être
   grisés — contrairement aux cours, qui ont toujours ce garde-fou via
   `course_group_id`. Corrigé en calculant `alreadyHas` à partir de
   `rule_group_id` (même schéma que les cours), avec un label générique sur
   `DuplicateForm` (`alreadyHasLabel`, string — donc sans risque de
   redéclencher le bug "fonction passée à un Client Component" du correctif
   précédent). Décision cohérente qui en découle : `duplicateGrammarRule`
   fait désormais rejoindre le `rule_group_id` de la règle source aux
   nouvelles cibles (au lieu d'un groupe indépendant) + revérifie côté
   serveur qui possède déjà la règle, exactement comme `duplicateSession`.
3. **"Mes livres" — livre de grammaire** : affichait un libellé statique
   "Grammaire" au lieu d'un compte, contrairement aux livres de cours
   ("N cours"). Affiche maintenant "N règle(s)" (nombre de `rule_group_id`
   distincts, calculé dans `teacher/books/page.tsx`).

### Plan
- [x] Retirer "Cours de {nom}" / "Règle de {nom}" des deux pages détail,
      supprimer les embeds `students(profiles(full_name))` désormais inutiles
- [x] `DuplicateForm` : généraliser le label "a déjà ce cours" en prop
      `alreadyHasLabel` (string, safe cross Server/Client)
- [x] `library/grammar/[ruleId]/page.tsx` : calculer `alreadyHas` via
      `rule_group_id`, passer `alreadyHasLabel="a déjà cette règle"`
- [x] `duplicateGrammarRule` (actions.ts) : filtre serveur des cibles déjà
      dans le groupe (comme `duplicateSession`) + rejoint le `rule_group_id`
      source au lieu d'un groupe indépendant
- [x] `teacher/books/page.tsx` : calcule `ruleGroupCount` (distinct
      `rule_group_id`) pour le livre de grammaire
- [x] `book-manager.tsx` : affiche "N règle(s)" au lieu de "Grammaire" pour le
      livre de grammaire
- [x] Testé via MCP (impersonation Jefferson, ROLLBACK) : le groupe "Le mot"
      contient bien Hamza/Bilel/Anthony (pas Rayan) ; simulation du filtre
      serveur → Bilel exclu, Rayan retenu ; `count(DISTINCT rule_group_id)` =
      1, conforme à l'attente du propriétaire
- [x] `npm run build` + `npm run lint` : verts (seule erreur = `drawer-nav.tsx`,
      pré-existante, sans rapport)
- [ ] Commit + push preview

### Review
- Le bug de la garde "a déjà" pour la grammaire n'était pas visible avant
  cette session car il n'existait aucun regroupement (`rule_group_id`) avant
  aujourd'hui — dès qu'il a existé, l'absence de garde est devenue visible au
  premier test manuel du propriétaire. Bien noter pour la suite : toute
  nouvelle notion de "groupe" doit immédiatement s'accompagner de sa garde
  "déjà membre", pas seulement de l'affichage groupé.

## Session 32 (suite 4 quinquies) — Hamza absent de la liste de duplication

- **Bug** : sur `/teacher/library/grammar/[ruleId]`, la représentante du
  groupe (Hamza, dont la ligne `grammar_rules` sert de source à cette page)
  était filtrée hors de la liste `students` (`.filter((s) => s.id !==
  rule.student_id)`), donc absente au lieu d'être grisée avec "a déjà cette
  règle". Le même code pour les cours (`library/[recordId]/page.tsx`) ne
  filtre jamais le représentant — il apparaît toujours dans la liste, disabled
  via `alreadyHas`. Incohérence héritée du filtre pré-groupement (avant
  `rule_group_id`, exclure la source évitait juste un item inutile ; depuis le
  groupement, cette exclusion cache un membre légitime du groupe).
- **Correctif** : retrait du `.filter(...)` — la liste `students` inclut
  maintenant tous les élèves, `alreadyHas` (déjà basé sur `rule_group_id`)
  s'occupe seul de griser qui a déjà la règle, source comprise. Aligné avec le
  pattern des cours à l'identique.
- `npm run build` : vert.

## Session 32 (suite 5) — Photos de profil dans messages/listes

Demande : afficher la vraie photo de profil (déjà uploadable via `AvatarUpload`,
bucket privé `avatars`) à la place du rond avec l'initiale, dans :
1. En-tête de conversation côté élève (photo de son enseignant)
2. En-tête + liste de conversations côté enseignant (photo de l'élève)
3. Liste "Enseignants" (admin) — photo de chaque enseignant
4. Liste "Mes élèves" côté enseignant — photo de chaque élève

### Plan
- [x] **RLS d'abord** : le bucket `avatars` n'était lisible que par son
      propriétaire (`avatars_owner_all`, dossier = son propre `auth.uid()`).
      Migration additive (62) : 3 policies SELECT-only en plus (OR, n'enlèvent
      aucun droit d'écriture) — `avatars_teacher_read_students` (un enseignant
      lit l'avatar de SES élèves via `students.teacher_id`),
      `avatars_student_read_teacher` (un élève lit l'avatar de SON enseignant
      via `students.teacher_id → teachers.profile_id`), `avatars_admin_read_all`
      (`private.is_admin()`, pour la liste Enseignants).
- [x] Testé la RLS AVANT de coder l'UI (impersonation + objets factices en
      transaction ROLLBACK) : Hamza voit l'avatar de Jefferson (son prof) et le
      sien, PAS celui de Khadija ; Khadija (aucun élève) ne voit que le sien ;
      Jefferson (admin) voit son avatar ET celui de Khadija via `is_admin()`.
- [x] `dashboard/messages/page.tsx` : avatar de l'enseignant dans l'en-tête
- [x] `teacher/messages/[studentId]/page.tsx` : avatar de l'élève dans l'en-tête
- [x] `teacher/messages/page.tsx` : avatar de chaque élève dans la liste de
      conversations (signature groupée `createSignedUrls`, pas un appel par
      élève)
- [x] `teacher/admin/teachers/page.tsx` : avatar de chaque enseignant
- [x] `teacher/students/page.tsx` + `students-list.tsx` : avatar de chaque
      élève dans "Mes élèves" (prop `avatarUrl` threadée jusqu'au composant
      client)
- [x] `npm run build` + `npm run lint` : verts après correction d'un type
      predicate incompatible (`createSignedUrls` renvoie `path`/`signedUrl`
      potentiellement `null` même après filtre `!!`, TS ne l'infère pas —
      filter + map plutôt que filter avec type predicate)
- [ ] Commit + push preview

### Review
- Toujours vérifier la RLS du bucket Storage concerné AVANT d'écrire le code
  d'affichage — ici, sans les 3 nouvelles policies, tous les `createSignedUrl`
  auraient simplement échoué silencieusement (pas d'erreur visible, juste pas
  de photo affichée), ce qui aurait pu passer pour "ça ne marche pas" sans
  cause évidente.
- Cohérent avec le principe deny-by-default (§6 CLAUDE.md) : les 3 nouvelles
  policies sont strictement scoped à une relation réelle existante
  (enseignant↔élève via `teacher_id`, admin via `role`), jamais un accès
  généralisé à tous les avatars.
- Non touché (hors périmètre de la demande) : `teacher/students/[id]/page.tsx`
  (fiche élève détaillée) et `teacher/homework/page.tsx` (file de correction)
  ont le même rond-avec-initiale — à traiter si le propriétaire le demande.

## Session 32 (suite 6) — 2 bugs remontés après test manuel des photos/messages

1. **Photo du prof toujours absente côté élève** : cause racine trouvée par
   test SQL direct (impersonation Hamza) — `SELECT ... FROM profiles WHERE
   id = <jefferson>` renvoyait **0 ligne**. La migration 62 (policies sur le
   bucket Storage `avatars`) était nécessaire mais pas suffisante : encore
   fallait-il que la ligne `profiles` (portant `avatar_url`) elle-même soit
   lisible par l'élève pour que l'embed PostgREST
   `students→teachers→profiles` ne s'arrête pas en route. Aucune policy
   n'autorisait un élève à lire le profil de son propre enseignant (seul le
   sens inverse existait : `profiles_select_teacher_students`). Migration 63 :
   policy symétrique `profiles_select_own_teacher`. Revérifié après coup :
   Hamza voit le profil de Jefferson (son prof), toujours pas celui de
   Khadija (pas la sienne).
2. **Rayan absent de la liste "Messages" côté enseignant** : la page partait
   de la table `conversations` (une ligne par paire déjà initiée) au lieu de
   `students` — un élève jamais contacté (aucune ligne `conversations`
   créée) disparaissait purement et simplement de la liste, au lieu
   d'apparaître comme Anthony/Bilel avec "Démarrer la conversation →".
   Confirmé en base : Rayan est le seul élève actif de Jefferson avec
   `conv_count = 0`. `teacher/messages/page.tsx` réécrit pour partir de
   `students` (RLS déjà scopée au teacher courant) avec un embed
   `conversations(...)` — chaque élève apparaît désormais, avec ou sans
   conversation déjà démarrée. Revérifié via MCP : les 4 élèves (dont Rayan)
   sont bien retournés par la nouvelle requête.

### Plan
- [x] Migration 63 (`profiles_select_own_teacher`), testée avant/après via
      MCP (positif : Hamza voit Jefferson ; négatif : pas Khadija)
- [x] `teacher/messages/page.tsx` réécrit : source `students` + embed
      `conversations`, tri par dernier message conservé, libellé "X élève(s)"
      (plus précis que "X conversations" puisque ce n'en sont pas toutes)
- [x] Testé via MCP : requête équivalente retourne bien les 4 élèves dont
      Rayan
- [x] `npm run build` + `npm run lint` : verts (seule erreur pré-existante,
      sans rapport)
- [ ] Commit + push preview

### Review
- Les deux bugs partagent une leçon commune : une correction "visible" (UI ou
  policy Storage) peut être invalidée par une couche invisible en amont (RLS
  table, ou source de la requête) — d'où l'importance de vérifier chaque
  correctif via une requête SQL directe reproduisant exactement le chemin de
  données réel (embed PostgREST inclus), pas seulement "la policy existe".

## Session 32 (suite 7) — Règlement intérieur (élève)

Reformulation validée (2 questions tranchées : notification envoyée aussi aux
4 élèves déjà existants ; contenu unique pour toute la plateforme, pas
éditable par enseignant) :
- Nouvelle tuile "Règlement intérieur" dans l'onglet "Plus" côté élève.
- Page dédiée : toujours la liste numérotée des 6 règles visible ; en plus,
  soit un bandeau vert "déjà validé" avec date/heure (si déjà signé), soit une
  case à cocher + bouton pour valider (si pas encore signé). Une fois signé,
  irréversible côté UI ET côté serveur (RPC idempotente).
- 6 règles : caméra obligatoire, position de cours, nom/prénom obligatoire,
  retard non toléré, interdiction d'enregistrer, **rendre les devoirs avant le
  prochain cours** (nouvelle, ajoutée à la demande).
- Notification automatique (cloche) pour toute nouvelle fiche `students`
  (déclencheur DB, pas une simple case dans le formulaire de création — fiable
  quel que soit le point d'entrée de création) + backfill pour les 4 élèves
  actuels.

### Plan
- [ ] Migration A : `ALTER TYPE notification_type ADD VALUE 'house_rules'`
      (seule dans sa migration — ne peut pas être utilisée dans la même
      transaction que son ajout)
- [ ] Migration B : colonne `students.house_rules_accepted_at timestamptz
      NULL` ; RPC `accept_house_rules()` (SECURITY DEFINER, idempotente —
      `COALESCE(house_rules_accepted_at, now())`) ; trigger
      `AFTER INSERT ON students` qui insère la notification `house_rules`
      pour `NEW.profile_id` ; backfill one-shot de la notification pour les
      élèves actuels sans `house_rules_accepted_at`
- [ ] `dashboard/more/page.tsx` : nouvelle tuile "Règlement intérieur"
- [ ] `dashboard/reglement/page.tsx` (NEW) : header + liste des 6 règles +
      bandeau validé (avec date/heure) OU formulaire de validation
- [ ] `dashboard/reglement/accept-form.tsx` + `actions.ts` (NEW) : case à
      cocher, appelle `accept_house_rules()` via RPC
- [ ] `notif-bell.tsx` : libellé `house_rules` → "Règlement intérieur à
      valider"
- [ ] Tester via MCP (impersonation, ROLLBACK) : trigger déclenche bien la
      notification à la création d'un élève ; RPC idempotente (2 appels
      successifs ne changent pas la date après le 1er) ; backfill couvre bien
      les 4 élèves actuels sans dupliquer si rejoué
- [ ] `database.types.ts` régénéré (nouvelle colonne + nouvelle valeur d'enum
      + nouvelle RPC)
- [ ] `npm run build` + `npm run lint`
- [ ] Commit + push preview

### Review
- Contenu des 6 règles fixé en code (`RULES` dans `dashboard/reglement/page.tsx`),
  pas de table dédiée ni d'interface d'auteur — décision validée (un seul
  règlement pour toute la plateforme).
- Le déclencheur DB (`AFTER INSERT ON students`) garantit qu'aucun futur point
  d'entrée de création de compte élève (admin, self-service à venir, script...)
  ne puisse oublier d'envoyer la notification — testé via `pg_trigger`
  (attaché, activé) plutôt que reconstruit "à l'aveugle".
- `accept_house_rules()` idempotente côté SERVEUR (`COALESCE`), pas seulement
  via la case décochée côté UI — testé explicitement (2 appels successifs,
  même timestamp) et testé en négatif (un enseignant ne peut pas l'appeler).
- Testé via MCP avant tout code UI : backfill confirmé sur les 4 élèves
  actuels, idempotence RPC confirmée, garde-fou "réservé à un élève" confirmé.

## Session 32 (suite 8) — Fusion quiz vocab+formulation + tuile dernière note

Reformulation validée (tuile = score brut X/Y non cliquable ; aucune liste
d'historique de quiz nulle part ; quiz déjà aléatoires, à confirmer) :

### Plan
- [ ] Migration 66 : `ALTER TYPE quiz_source ADD VALUE 'language'` (seule, tx à part)
- [ ] Migration 67 : RPC `submit_language_quiz(p_student_id, p_answers)` —
      correction unifiée d'un tableau hétérogène (vocab si clé `vocab_id`,
      sinon formulation), une seule ligne `quiz_attempts`. Réutilise à
      l'identique la logique de scoring des 2 RPC existantes. Les 2 RPC de
      GÉNÉRATION restent inchangées (éprouvées, audio signé).
- [ ] `evaluations/actions.ts` : `generateLanguageQuiz` (appelle les 2 generate
      RPC, tague `source`, concatène + mélange Fisher-Yates) + `submitLanguageQuiz`
      (route chaque réponse vers la bonne clé selon `source`). Retire les 4
      anciens exports.
- [ ] `QuizPlayer` : ajoute `source` sur question+réponse ; header par question
      choisi sur (direction + présence audio) pour couvrir vocab-texte ET
      formulation-audio dans le même quiz ; unités "élément(s)".
- [ ] `evaluations-client.tsx` : une seule section "Quiz de langue" (count =
      vocab+form, options de cours fusionnées par lesson_record_id).
- [ ] `evaluations/page.tsx` : fusionne les options de cours des deux types.
- [ ] Supprime `quiz-runner.tsx` + `formulation-quiz-runner.tsx` (remplacés).
- [ ] `revision/page.tsx` : "Quiz vocabulaire auto-généré" → "Quiz de langue
      auto-généré".
- [ ] `dashboard/page.tsx` : tuile "Dernière note" = dernier `quiz_attempts`
      (X/Y recalculé depuis `answers` jsonb), NON cliquable (plus de href).
      Retire la lecture `homework.grade`.
- [ ] `database.types.ts` régénéré (nouvelle RPC + enum).
- [ ] Tests MCP : quiz mixte scoré correctement (vocab+formulation+audio dans
      une même soumission), aléatoire confirmé (2 générations ≠), isolation
      (élève ne score que ses propres items), tuile lit bien le dernier attempt.
- [ ] build + lint, commit + push preview.

### Review
- Fusion réalisée en gardant les 2 RPC de génération intactes (aléatoire +
  audio + distracteurs par type éprouvés) et en unifiant SEULEMENT la
  correction : plus faible risque qu'une méga-RPC réécrite. Concaténation +
  mélange Fisher-Yates côté serveur.
- Les 2 particularités respectées : distracteurs jamais mélangés entre types
  (générés par les RPC d'origine), audio des formulations préservé (compréhension
  orale + audio-choix) au sein du même quiz.
- Tuile "Dernière note" : X/Y recalculé depuis `quiz_attempts.answers[].is_correct`
  → aucune migration nécessaire pour la tuile, et fonctionne sur les anciens
  quiz déjà passés (vérifié : Hamza 7/7, Anthony 23/25). Non cliquable.
- Aléatoire confirmé via MCP (3 générations successives toutes différentes) —
  répond à la demande "jamais les mêmes".
- Aucune liste d'historique de quiz nulle part (il n'en existait aucune ; rien
  ajouté).
- Testé via MCP avant l'UI : quiz mixte scoré 2/4 correctement, isolation
  (item d'un autre élève → 0), tuile lit le dernier attempt.

## Déploiement production — session 32 (suites 3 à 8)

- **Déployé en production** : fast-forward de `main` ET de la branche de prod
  Vercel (`claude/new-project-setup-1jcgwf`) depuis la branche de session,
  après validation manuelle du propriétaire sur la preview.
- Contenu déployé : correctifs "Mes livres"/grammaire (groupement, duplication,
  retrait Modifier/Suppr, retrait des noms d'élèves sur les cartes), photos de
  profil dans messages/listes (+ RLS avatars/profiles), correctif élève absent
  des messages, règlement intérieur élève (5 règles + notification auto),
  fusion des quiz vocab+formulation en quiz de langue, tuile "Dernière note" en
  X/Y non cliquable.
- **Base partagée** : toutes les migrations nécessaires (59→67) étaient déjà
  appliquées via MCP au fil de la session — aucune action DB au moment du
  déploiement.
- **Migrations 57/58 toujours différées** (attendance phase 2 + drop ancien
  quiz grammaire) : destructives, elles suppriment des colonnes/types encore
  référencés par les RPC courantes (`submit_session_record` insère toujours
  `attendance`). À traiter dans un lot dédié « nettoyage schéma » avec la mise
  à jour simultanée des RPC, jamais isolément.
