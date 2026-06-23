# Handoff : Refonte UI Takalamu

## Overview
Takalamu est une app web **mobile-first en français** pour deux enseignants donnant des cours d'**arabe individuel (1-à-1)** et de **récitation coranique**. La refonte couvre deux espaces distincts :

- **Espace élève** — navigation par **barre d'onglets en bas** (bottom tab bar).
- **Espace enseignant** — navigation par **menu en tiroir** (drawer latéral).

L'app doit ressembler à une **vraie app mobile native** (transitions douces, grosse hiérarchie typographique, cartes-stats, états vides soignés), pas à un site responsive. Pas de dark mode. Couleur principale : **vert émeraude**. L'écran le plus critique est la **Fiche de fin de cours** (côté enseignant), saisie après chaque séance.

Le brief fonctionnel d'origine est inclus : `brief-original.md`.

## About the Design Files
Les fichiers `.dc.html` de ce bundle sont des **références de design créées en HTML** — des prototypes haute-fidélité qui montrent l'apparence et le comportement visés. **Ce ne sont pas du code de production à copier tel quel.**

> Format technique : chaque `.dc.html` est un « Design Component » — un template HTML + une classe logique JS, assemblés au runtime par `support.js`. **N'essayez pas de réutiliser `support.js` ni la syntaxe `<sc-if>` / `<sc-for>` / `{{ … }}`** dans le vrai codebase. Servez-vous-en uniquement pour **lire** la structure, les styles exacts, les états et la logique d'interaction, puis **recréez** chaque écran avec les patterns de la stack cible.

La stack cible est **Next.js + Tailwind CSS + Supabase** (déjà en place). Recréez ces designs avec les composants/conventions existants du projet. Les styles des prototypes sont en **CSS inline** : transposez-les en classes Tailwind / tokens du design system.

## Fidelity
**Haute-fidélité (hifi).** Couleurs, typographie, espacements, rayons, ombres et interactions sont définitifs. À recréer au pixel près avec les libs du codebase. Les données affichées (noms d'élèves, leçons, montants) sont des **exemples** ; à brancher sur Supabase.

---

## Design Tokens

### Couleurs — Émeraude (marque)
| Token | Hex | Usage |
|---|---|---|
| emerald-50 | `#ECFAF4` | fonds de pastilles, halos d'icônes |
| emerald-100 | `#D2F2E5` | |
| emerald-200 | `#A6E5CC` | |
| emerald-300 | `#6FD3AE` | |
| emerald-400 | `#2FB888` | |
| **emerald-500** | **`#0F9D6E`** | **couleur signature** : CTA, onglet actif, accents |
| emerald-600 (pressed) | `#0A8560` | état pressé des boutons |
| emerald-700 | `#086B4E` | |
| emerald-800 | `#0A553F` | **hero teal profond** (cartes vedettes à filigrane) |
| teal-drawer | `#0A4636` | fond du tiroir enseignant |

### Couleurs — Neutres chauds (jamais de gris froid)
| Token | Hex | Usage |
|---|---|---|
| page-bg | `#F7F4EE` | fond d'écran de l'app |
| surface | `#FFFFFF` | cartes / surfaces |
| surface-alt | `#FBF9F5` | champs de saisie, fonds secondaires |
| border | `#E9E3D8` | bordures (variantes : `#EFEAE0`, `#EDE7DC`, `#E2DBCD`) |
| ink (texte fort) | `#1C1A17` | titres, texte principal |
| ink-soft | `#4A463F` | corps de texte |
| muted | `#8B857A` | texte secondaire / méta |
| faint | `#A8A29E` | texte très discret, icônes inactives |
| device-bezel | `#0c0a08` | cadre du mockup téléphone (non utilisé en prod) |

### Couleurs — Sémantique / statuts (logique unique partout)
| Hue | Dot/plein | Bordure | Fond | Texte | Signification |
|---|---|---|---|---|---|
| Vert | `#0F9D6E` | `#9FE3C8` | `#ECFAF4` | `#0A6B4E` | valide · présent · payé · actif · vu |
| Ambre | `#F59E0B` | `#F4D193` | `#FDF4E3` | `#9A6206` | attente · retard |
| Rouge | `#E5484D` | `#F3B0B2` | `#FDECEC` | `#B4292E` | échec · absent injustifié · suspendu |
| Bleu | `#3E63DD` | `#AEBEF2` | `#EAEFFD` | `#2C49B8` | rendu · en cours |
| Violet | `#8E4EC6` | `#D4B0EC` | `#F6EDFC` | `#7233A8` | corrigé |
| Ardoise | `#A8A29E` | `#C7C0B4` | `#F4F1EB` | `#6B6459` | à faire · annulé · absent justifié |

### Typographie
- **Titres** : `Spectral` (serif chaleureux), poids 600/700. Display 40px, H1 27-28px, H2 19-22px.
- **Corps & UI** : `Plus Jakarta Sans`, poids 400-800. Corps 14-15px / line-height 1.5-1.6 ; petit 12-13px ; label 11px UPPERCASE letter-spacing .06-.07em ; chiffres-clés 800 (28-52px).
- **Arabe (RTL)** : `Amiri`, poids 700, `dir="rtl"`, `text-align:right`.
- Échelle min : jamais sous 11px (labels). Corps ≥ 14px. Cibles tactiles ≥ 44px (boutons 46-56px).

> Les prototypes exposent un **tweak** permettant de changer la police de titre (`Spectral` / `Cormorant Garamond` / `Playfair Display` / `Libre Baskerville`), la police de corps (`Plus Jakarta Sans` / `Manrope` / `Mulish`) et la couleur d'accent en direct, via des variables CSS `--tk-accent`, `--tk-title`, `--tk-body`. **En prod, n'implémentez ce sélecteur que si le produit le demande** — sinon, figez Spectral + Plus Jakarta Sans + `#0F9D6E`. C'était un outil d'exploration, pas une exigence.

### Rayons, ombres, espacement
- **Rayons** : champs 13-15px ; cartes 16-20px ; cartes vedettes / hero 20-24px ; téléphone (mockup) 35-46px ; pastilles `999px`.
- **Ombres** (douces, ressenti iOS) :
  - carte : `0 6px 16px rgba(28,26,23,.04)`
  - carte surélevée : `0 10px 26px rgba(28,26,23,.09)`
  - hero teal : `0 16px 32px rgba(10,85,63,.32)`
  - CTA émeraude : `0 8px 18px rgba(15,157,110,.30)`
  - barre de nav flottante : `0 12px 30px rgba(28,26,23,.12)`
- **Espacement** : padding écran 18px horizontal ; gap entre cartes 10-12px ; gap entre sections 18-24px ; padding interne des cartes 14-22px.

### Iconographie
Style **linéaire** (outline, type Lucide), `stroke-width` 2-2.4, `stroke-linecap/linejoin: round`. Icônes 18-23px. Remplacer les SVG inline par les icônes de la lib du codebase (Lucide recommandé).

---

## Principes transverses
1. **Distinguer l'actionnable de l'informatif.** Carte actionnable = blanche, **ombrée**, avec chevron `›` (et souvent un halo d'icône émeraude). Carte informative = fond `#FBF9F5`, **bordée**, sans ombre.
2. **Badges de statut = bordure colorée + pastille** (jamais de pâle illisible). Voir table sémantique.
3. **Tout contenu de liste est scrollable et, quand pertinent, recherchable** (champ de recherche + liste filtrée en temps réel).
4. **Navigation native** : onglets en bas (élève) / tiroir (enseignant). Jamais d'onglets horizontaux scrollables.
5. **Hero teal à filigrane géométrique** (`#0A553F` + losanges `#9FE3C8` opacité ~.14) pour les blocs vedettes (prochain cours, profil, encaissement).

---

## Screens / Views

### A. ESPACE ÉLÈVE — bottom tab bar
Barre flottante en bas, fond blanc, rayon 22px, ombre `0 12px 30px rgba(28,26,23,.12)`. 5 onglets ; l'onglet **actif** devient une **pilule émeraude** (`#0F9D6E`, hauteur 46px, padding 0 15px, icône blanche + label) ; les inactifs sont des icônes seules 46×46 (`#A8A29E`). Ordre : **Cours · Réserver · Devoirs · Messages · Plus**.

#### A1. Cours (accueil)
- **But** : voir le prochain cours et son parcours.
- **Layout** : header (salutation « Salâm 'alaykoum, {prénom} » en muted + prénom en Spectral 27px ; cloche notifications avec point rouge) → **hero teal** → stats parcours → historique.
- **Hero prochain cours** : carte `#0A553F` rayon 24px, filigrane losanges en haut-droite. Contient : pill « Prochain cours · aujourd'hui » (point vert pulsé), titre leçon (Spectral 24px blanc), « avec {prof} » (`#9FE3C8`), **compte à rebours live** 3 blocs (Heures/Minutes/Secondes, fond `rgba(255,255,255,.10)`), bouton « Disponible à {heure} » désactivé (le bouton devient « Rejoindre le cours » actif quand la fenêtre s'ouvre — voir Interactions).
- **Parcours** : 2 cartes-stats (Séances suivies = 24 ; Assiduité = 92% en émeraude).
- **Historique** : liste de cartes (titre leçon + badge présence + date · récap).

#### A2. Réserver
- **But** : réserver un créneau proposé par le prof.
- **Layout** : titre « Réserver » + sous-titre. Créneaux **groupés par jour** (label uppercase). Chaque créneau = carte avec icône horloge, heure + durée, et bouton **« Réserver »** (émeraude plein) qui bascule en **« Réservé »** (pill vert bordé + check) au tap.

#### A3. Devoirs
- **But** : consulter et rendre ses devoirs.
- **Layout** : titre « Mes devoirs » + liste de cartes actionnables. Chaque carte : titre + leçon + **badge de cycle** (À rendre → Rendu → Corrigé → Vu, voir hues ardoise/bleu/violet/vert) + ligne « À rendre {échéance} » + chevron.
- **Détail (bottom sheet, 86% hauteur)** : poignée, en-tête (titre + leçon + badge), **Consignes** (carte), **Support du cours** (carte fichier PDF téléchargeable), **Mon rendu** = zone d'**upload** (photos → vignettes 74×74 ; fichiers → chips 128×74 avec nom + taille ; bouton supprimer en pastille noire), bouton bas collant « Rendre mon devoir ».

#### A4. Messages
- **But** : discuter avec le prof.
- **Layout** : en-tête (avatar prof + « En ligne »), fil de bulles (reçues = blanches bordées, radius `18 18 18 5` ; envoyées = émeraude, texte blanc, radius `18 18 5 18`, heure en `#CFF0E2`), barre de saisie en bas (champ + bouton envoyer émeraude).

#### A5. Plus
- **But** : accès profil et réglages.
- **Layout** : **hero teal profil** (avatar initiale, nom Spectral, niveau) → liste de menu (Mon glossaire, Mes paiements [badge], Règlement intérieur, Paramètres) chaque ligne = halo d'icône coloré + label + chevron → bouton « Se déconnecter » (rouge, fond `#FDECEC`, bordure `#F3B0B2`).

### B. ESPACE ENSEIGNANT — drawer
Top bar : **burger** ☰ (44×44, carte blanche) + titre de page (Spectral 21px) + cloche. Le burger ouvre un **tiroir** glissant depuis la gauche (82% largeur, fond `#0A4636`, rayon 28px côté droit, animation translateX 0.28s `cubic-bezier(.22,1,.36,1)`, scrim `rgba(28,26,23,.45)`).
- **Tiroir** : profil (avatar + « Ustadh Amine · Enseignant · arabe »), label « MON ESPACE », items de nav (icône `#9FE3C8` / label `#DCEFE7` ; actif = fond `rgba(255,255,255,.14)`, icône+label blancs ; badge violet `7` sur File de correction), « Déconnexion » en bas (`#F5A9AB`). Items : **Cockpit · Mes élèves · File de correction · Disponibilités · Paiements**.

#### B1. Cockpit
- **But** : tableau de bord du jour.
- **Layout** : sous-titre date + nb cours → **action vedette** « Fiche de fin de cours » (carte émeraude pleine, halo blanc translucide, chevron) → **grille 2 stats** (Cours aujourd'hui = 3 ; À corriger = 7, halo violet, cliquable → File de correction) → **bandeau alerte** ambre « 2 élèves suspendus » (cliquable → Mes élèves) → « Cours du jour » : liste planning (heure+durée | élève + leçon | badge statut).

#### B2. Mes élèves
- **But** : retrouver et ouvrir un élève.
- **Layout** : **champ de recherche** (filtre live sur le nom) → **chips filtres** (Tous / Actifs / Suspendus ; actif = pill noire `#1C1A17`) → liste de cartes élève (avatar teal initiale + nom + niveau + badge statut).
- **Fiche élève (bottom sheet 84%)** : en-tête (avatar 58px + nom Spectral 22px + niveau + badge) → 3 mini-stats (Séances=18, Présence=94% émeraude, Leçon=L14) → CTA émeraude « Nouvelle fiche de fin de cours » → « Dernières séances » (liste compacte avec badges présence).

#### B3. File de correction
- **But** : corriger les devoirs rendus.
- **Layout** : sous-titre compteur → liste de cartes (avatar + élève + titre devoir + badge « Rendu » bleu) avec **2 boutons** : « Voir le rendu » (secondaire, bordé) + « Corriger » (émeraude plein).

#### B4. Disponibilités
- **But** : ouvrir/fermer les créneaux à la réservation.
- **Layout** : sous-titre → liste par jour (jour + créneaux) avec **interrupteur** (toggle émeraude on / `#E2DBCD` off).

#### B5. Paiements
- **But** : suivi des encaissements.
- **Layout** : **hero teal** « Encaissé en juin · 1 240 € » + « 2 paiements en attente · 80 € » → liste (élève + détail forfait | montant + badge payé/en attente).

---

## Interactions & Behavior
- **Navigation onglets/tiroir** : changement d'écran instantané (state `tab` / `page`). Tiroir : ouverture animée + scrim cliquable pour fermer.
- **Bottom sheets** : animation `translateY(100%)→0` en 0.26s `cubic-bezier(.22,1,.36,1)`, scrim `rgba(28,26,23,.42)` en fondu 0.2s, fermeture au tap sur le scrim. Poignée 40×5px en haut.
- **Compte à rebours (Cours)** : décrémente chaque seconde (`setInterval`). ⚠️ **Ne pas piloter d'animation d'entrée par CSS sur un sous-arbre qui re-render chaque seconde** (l'animation se relancerait sans cesse) — réserver les animations d'entrée aux écrans statiques.
- **Bouton « Rejoindre »** — 3 états selon l'heure du cours :
  1. *À venir* : désactivé, fond grisé, « Disponible à {heure} ».
  2. *Fenêtre ouverte* : émeraude plein, point blanc pulsé, « Rejoindre le cours », actif.
  3. *Terminé* : désactivé, « Séance terminée » + cadenas.
- **Présence (Fiche de fin de cours)** : 4 choix exclusifs (Présent / En retard / Absent justifié / Absent injustifié) en grille 2×2, sélection = bordure colorée + halo + icône remplie ; retour visuel immédiat.
- **Recherche** : filtrage en temps réel (insensible à la casse) sur la liste (élèves, leçons).
- **Upload** : `<input type="file" multiple accept="image/*,application/pdf,…">`. Images → vignette `object-fit:cover` ; autres → chip (icône doc + nom tronqué en ellipsis + taille formatée o/Ko/Mo). Bouton supprimer = pastille noire `-7px` en coin. Zone d'ajout = label pointillé `1.6px dashed #CFC6B5`.
- **Toggles** (devoir on/off, disponibilités) : piste 48×28, pastille 22px, on = émeraude / off = `#E2DBCD`.
- **Enregistrement Fiche** : bouton collant en bas (dégradé de masque par-dessus le scroll), au tap → **toast** « Fiche enregistrée » (fond `#1C1A17`, check vert) auto-masqué après ~2.2s.

## State Management
Par espace (état local d'écran, à brancher sur Supabase pour les données réelles) :
- **Fiche de fin de cours** : `eleve`, `presence` (present/retard/absj/absi), `leconIdx`, `leconOpen`/`leconQuery`, `eleveOpen`/`eleveQuery`, `vocab[]` (paires ar/fr) + `newAr`/`newFr`, `regleTitle`/`regleBody`, `devoirOn`/`devoirText`, `recap`, `note` (privée), `supports[]`, `devoirFiles[]`, `saved`.
- **Espace élève** : `tab`, `secs` (countdown), `booked{}` (réservations), `selDevoir` + `rendu[]`.
- **Espace enseignant** : `page`, `drawerOpen`, `query`, `filter` (tous/actifs/suspendus), `selEleve`, `dispoOn{}`.

Données à fournir par Supabase : élèves (nom, niveau, statut), leçons (programme), séances/historique (présence, récap public, note privée), devoirs (statut de cycle, consignes, fichiers), vocabulaire, créneaux/réservations, paiements, messages.

## Champs « public » vs « privé » (important — métier)
Dans la Fiche de fin de cours, distinguer clairement :
- **Récap public** : visible par l'élève (badge bleu « Vu par l'élève »).
- **Note privée** : **jamais** visible par l'élève (zone ambre `#FFFBF2` / bordure `#F2E3C2`, badge cadenas). À traiter comme tel côté permissions Supabase (RLS).

## Assets
- **Icônes** : SVG inline style Lucide → remplacer par la lib d'icônes du codebase.
- **Polices** : Google Fonts — `Spectral`, `Plus Jakarta Sans`, `Amiri` (RTL). (Alternatives du tweak : Cormorant Garamond, Playfair Display, Libre Baskerville, Manrope, Mulish — optionnel.)
- **Logo / wordmark** : un « ت » (Amiri) dans un carré émeraude + « Takalamu ». La police display **QIBLA** évoquée par le client est un caractère **payant (Adobe Stock)** non fourni — à acquérir séparément si souhaité pour le logo, sinon garder Spectral.
- **Aucune image bitmap** dans les protos (avatars = initiales sur fond teal). Le filigrane des hero est du SVG (losanges).
- Pas d'assets de marque Anthropic.

## Files
Prototypes de référence (dans ce bundle) :
- `Fondations.dc.html` — design system complet : palette, badges de statut, échelle typo, composants de base (boutons/champs/segmenté/chips/switch), cartes & états vides, **les 2 modèles de navigation**.
- `Fiche de fin de cours.dc.html` — écran héros enseignant (présence, leçon recherchable, vocabulaire ar/fr, règle, devoir, **uploads** support & devoir, récap public, note privée, enregistrement + toast).
- `Espace élève.dc.html` — app complète bottom-tab (Cours, Réserver, Devoirs + sheet/upload, Messages, Plus).
- `Espace enseignant.dc.html` — app complète drawer (Cockpit, Mes élèves + fiche, File de correction, Disponibilités, Paiements).
- `support.js` — runtime des prototypes (**référence uniquement, ne pas porter en prod**).
- `brief-original.md` — brief fonctionnel d'origine du client.

> Pour lire un proto : ouvrez le `.dc.html` dans un navigateur. Le HTML utile est entre `<x-dc>…</x-dc>` (template, styles inline = source de vérité visuelle) et la classe `Component extends DCLogic` (logique/états/interactions).
