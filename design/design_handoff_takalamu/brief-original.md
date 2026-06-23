# Brief refonte UI — Takalamu

App web **mobile-first** pour deux enseignants : cours d'**arabe individuel (1-à-1)** et **étude de texte islamique en groupe**. Deux espaces distincts : **Élève** et **Enseignant**. Le produit est déjà codé et fonctionnel (Next.js + Tailwind + Supabase) — **on refait UNIQUEMENT l'UI**. Sers-toi de ce brief comme référence fonctionnelle, pas comme contrainte visuelle : le design est à refaire de zéro.

## Direction & contraintes
- **Mobile-first** : la majorité des usages = téléphone. Tout doit être pensé pour un petit écran d'abord.
- **Sobre, moderne, zéro gamification** (pas de badges ludiques, pas de streaks, pas de confettis).
- **Pas de dark mode** à ce stade.
- **Couleur principale : vert émeraude** — à conserver ou harmoniser.
- **Langue : français.** Public : adultes (débutants) côté élève, enseignants côté pro.
- Le mot arabe s'affiche en **RTL**.

## ⭐ Navigation & fluidité — le point le plus important
L'app doit ressembler à une **vraie app mobile**, fluide et intuitive, pas à un site web responsive. Référence de *feel* (structure et fluidité, PAS le thème — on reste clair/émeraude) : un SaaS à navigation verticale, grosse hiérarchie typo, cockpit en cartes-stats, états vides soignés.

- **Bannir la navigation horizontale scrollable** (les 7 onglets actuels sont un anti-pattern mobile). À remplacer par :
  - **Espace élève → barre d'onglets en bas (bottom tab bar)**, à portée de pouce, pour les sections principales (ex. Cours · Réservations · Devoirs · Messages), le reste (Vocabulaire, Grammaire, Paiement) dans un onglet « Plus » ou un menu. Icône + label, indicateur d'actif net.
  - **Espace enseignant → menu en tiroir (☰ qui glisse depuis le côté)**, liste verticale lisible avec icônes. C'est ce qui remplace les liens texte horizontaux illisibles.
- **Tout en vertical, pleine largeur, empilé.** Cartes arrondies, généreusement espacées. Cibles tactiles larges.
- **Fluidité** : transitions douces entre pages/onglets, retours visuels immédiats au tap, micro-animations sobres. Ça doit « glisser ».
- **Hiérarchie forte** : gros titres, chiffres-clés mis en valeur (gros et gras), texte secondaire discret. Fini le « tout en petit ».
- **États vides soignés** : icône + message + bouton d'action (pas juste une phrase grise).
- **CTA proéminents** : boutons pleins, émeraude, évidents.

## Système de statuts (à transformer en système de couleurs cohérent et lisible)
- **Présence** : Présent · Absent justifié · Absent injustifié · En retard
- **Devoir** (cycle) : À rendre → Rendu → Corrigé → Vu
- **Paiement** : En attente · Payé · Échoué · Annulé
- **Élève** : Actif · Suspendu (paiement) · Suspendu (absences)
- **Bouton « Rejoindre »** (visio) : à venir (désactivé) · fenêtre ouverte (actif) · accès fermé

## ESPACE ÉLÈVE
Shell commun : cloche de notifications (badge rouge + dropdown des dernières notifs) et **navigation par barre d'onglets en bas** (voir section Navigation) — surtout pas d'onglets horizontaux scrollables.

1. **Cours** — historique des séances (antéchronologique) : leçon + date, badge de présence, récap public éventuel.
2. **Vocabulaire** — glossaire perso enrichi séance après séance : barre de recherche temps réel, liste mot arabe (RTL) + définition FR + racine.
3. **Grammaire** — carnet de règles : titre + date + contenu libre.
4. **Devoirs** — cycle du devoir : consignes, badge de statut, bloc « retour enseignant » (feedback + note). *(À venir : bouton « Rendre » avec upload photo.)*
5. **Réservations** — « Mes cours à venir » avec bouton **Rejoindre** dynamique (selon l'heure), et « Réserver » = grille de créneaux disponibles (cliquables) ou bandeau d'inéligibilité.
6. **Messages** — chat temps réel 1-à-1 avec l'enseignant (bulles, horodatage, « lu »).
7. **Paiement** — demander un abonnement (choix de plan : unique / 2× / 3× réduit / 12× mensuel) + historique des paiements avec badges.

## ESPACE ENSEIGNANT
Shell commun : même cloche. Navigation par **menu en tiroir (☰)** vertical et lisible — remplace les liens texte horizontaux actuels, illisibles sur mobile.

- **Cockpit (tableau de bord)** — doit ressembler à un **vrai poste de pilotage**, pas à une liste de liens : actions rapides (avec « Fin de cours » mise en avant), bandeau élèves suspendus, devoirs à corriger, séances récentes, compteurs.
- **Mes élèves** — annuaire : nom, statut, compteur d'absences, accès fiche.
- **Fiche élève** — vue complète : indicateurs (séances / absences / mots / règles), **note privée épinglée** (zone distincte, jamais visible par l'élève), leçon en cours, devoirs à corriger, historique, vocab/grammaire récents.
- **⭐ Fiche de fin de cours — LA page reine.** Saisie ultra-rapide (< 30 s) après chaque séance : élève, date, présence, leçon travaillée, vocab du jour (paires arabe/français ajoutables), règle, devoir, récap public, note privée. **À sublimer** : rapide, fluide, satisfaisante. C'est l'écran le plus utilisé du produit, il ne doit surtout pas ressembler à un formulaire banal.
- **File de correction** — tous les devoirs rendus : consignes + champ feedback + note.
- **Programme** — bibliothèque de leçons ordonnée (numéro, titre, phase : Déchiffrage / Lecture-Oral / Grammaire) + créer/éditer.
- **Disponibilités** — ajout de créneaux récurrents (jour + horaires).
- **Réservations** — gérer les cours à venir (saisir le lien Zoom, marquer terminé).
- **Chat** — avec un élève (même composant que côté élève).
- **Paiements** — confirmer / annuler les paiements en attente + historique.

## Composants clés à particulièrement soigner
- **Fiche de fin de cours** (la star — voir ci-dessus).
- **Cloche de notifications** (badge + dropdown).
- **Chat** (bulles, temps réel, « lu »).
- **Bouton Rejoindre** (3 états visuels selon l'heure).
- **Grille de créneaux** réservables.
- **Badges de statut** (présence / devoir / paiement / élève) — clairs, lisibles, pas trop pâles.

## Ce qui cloche aujourd'hui (à corriger en priorité)
- Tout est blanc avec une bordure grise → **aucune hiérarchie visuelle**.
- **Aucune distinction** entre une carte *actionnable* et une carte *informative*.
- Navigation enseignant en liens texte → **illisible sur mobile**.
- Onglets élève scrollables mais **sans indice visuel** qu'il y en a plus.
- La **fiche de fin de cours** (page la plus critique) ressemble à un formulaire ordinaire.
- **Typographie plate** : tout en petit, peu de hiérarchie de taille/poids.
- **Badges** de statut trop pâles.
- **Cockpit** enseignant = liste de liens, pas un dashboard.
- Manque : **états de chargement** (skeletons) et **transitions** entre pages.

## Priorités de design
1. Une **hiérarchie visuelle** nette (taille, poids, espacement, profondeur).
2. **Mobile** : repenser les deux navigations (onglets élève + nav enseignant).
3. Distinguer clairement **actionnable vs informatif**.
4. **Sublimer la fiche de fin de cours** : c'est le héros.
5. Transformer le **cockpit** en vrai tableau de bord opérationnel.
6. Un **système de couleurs de statut** cohérent et lisible partout.

## À anticiper (fonctionnalités à venir — laisser la place)
Upload photo de devoir (élève) + fichier corrigé (enseignant) · vidéos forcées de bienvenue et de palier · quiz / évaluations · cours de groupe (étude de livre) · vitrine publique.
