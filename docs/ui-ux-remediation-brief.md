# ClipScale — prompt maître de correction UX/UI

## Mission

Agis comme un directeur produit, designer SaaS senior, expert en conversion, spécialiste mobile et auditeur accessibilité. Analyse puis améliore ClipScale sans supprimer ses fonctionnalités existantes. Le résultat doit être commercial, immédiatement compréhensible, rassurant et utilisable sur téléphone, tablette et ordinateur.

Ne cherche pas à produire mille remarques artificielles. Recherche systématiquement toutes les occurrences de problèmes dans mille points de contrôle regroupés par familles : contenu, hiérarchie, navigation, actions, formulaires, tableaux, cartes, modales, médias, animations, responsive, accessibilité, performance et confiance. Corrige les causes communes plutôt que d’empiler des exceptions.

## Objectif produit

En moins de cinq secondes, un visiteur doit comprendre que ClipScale permet à une agence de clipping de :

1. centraliser ses missions et ses clips ;
2. estimer et améliorer le potentiel viral d’une vidéo ;
3. préparer une publication sur plusieurs réseaux ;
4. suivre les validations et la charge de son équipe.

La page publique doit conduire naturellement vers la démo. L’application doit rendre chaque prochaine action évidente et distinguer clairement ce qui est réellement actif de ce qui est encore en mode démonstration ou configuration.

## Principes non négociables

- Préserver toutes les fonctionnalités existantes.
- Ne pas inventer de clients, résultats, témoignages, prix ou performances.
- Ne pas présenter la publication externe comme active avant la connexion OAuth.
- Employer un français simple, direct et professionnel.
- Une action principale maximum par zone.
- Tous les contrôles tactiles doivent viser au moins 44 × 44 px.
- Aucun texte utile ne doit être inférieur à 12 px dans l’application ni 13 px sur la page publique, hors micro-étiquette purement décorative.
- Les textes courants doivent viser 15 à 18 px avec une hauteur de ligne de 1,5 à 1,75.
- Les états hover ne doivent jamais être la seule façon de comprendre une action.
- Chaque contrôle doit avoir des états normal, hover, actif, focus, désactivé et chargement si nécessaire.
- Le focus clavier doit être visible avec un contraste net.
- Les animations doivent expliquer une relation, attirer vers une action ou confirmer un état.
- Respecter `prefers-reduced-motion` et supprimer tout mouvement essentiel dans ce mode.
- Éviter les déplacements de mise en page, les effets permanents agressifs et les animations simultanées trop nombreuses.

## Audit de la page commerciale

### Premier écran

- Afficher une promesse spécifique avant tout jargon.
- Expliquer le produit en une phrase courte sous le titre.
- Utiliser un CTA principal orienté essai et un lien secondaire de découverte.
- Expliquer immédiatement que la démo est accessible sans paiement et utilise des données fictives.
- Vérifier que le titre ne dépasse pas quatre lignes à 320 px.
- Empêcher les cartes flottantes de sortir de l’écran.
- Conserver un contraste minimum WCAG AA pour chaque texte.
- Rendre le header lisible sur fond animé et suffisamment haut pour le toucher.
- Masquer la navigation secondaire lorsque l’espace manque sans masquer le CTA principal.

### Démonstration visuelle

- Donner une description accessible à l’aperçu purement visuel.
- Exclure les éléments décoratifs de l’arbre d’accessibilité.
- Rendre la relation entre vidéo, score et réseaux évidente.
- Ne pas utiliser de boutons factices dans les maquettes.
- Si une commande n’agit pas, la présenter comme aperçu visuel et non comme bouton.
- Maintenir des tailles lisibles dans les simulations produit.

### Sections et conversion

- Alterner bénéfices, preuve produit et fonctionnement.
- Remplacer les formulations abstraites par des résultats d’usage concrets.
- Éviter les répétitions de « chaos », « partout », « croissance » et « scaler ».
- Présenter clairement la différence entre analyser, valider et publier.
- Garder les paragraphes sous 75 caractères par ligne.
- Terminer chaque grande séquence par une prochaine action compréhensible.
- Ne pas afficher de chiffre de performance non vérifié.
- Utiliser des chiffres uniquement pour décrire le produit : nombre de réseaux, étapes ou vues.

## Audit de l’application

### Navigation

- Le menu actif doit être identifiable par couleur, fond et libellé.
- Les boutons latéraux doivent avoir une hauteur tactile suffisante.
- La navigation mobile doit rester lisible avec cinq entrées.
- Aucun libellé essentiel ne doit être tronqué sans solution.
- Les icônes ne doivent pas remplacer les mots.
- Le retour au site doit avoir un nom accessible.

### Hiérarchie typographique

- Titre de page : 30 à 38 px sur ordinateur, 26 à 32 px sur mobile.
- Titre de panneau : 16 à 20 px.
- Corps : 14 à 16 px.
- Texte secondaire : 12 à 14 px.
- Étiquette : 11 à 12 px minimum.
- Bouton : 13 à 15 px, graisse suffisante.
- Ne jamais compenser un texte minuscule par des majuscules espacées.

### Boutons

- Utiliser un verbe précis : « Analyser le clip », « Créer la mission », « Préparer 4 publications ».
- Éviter « Ouvrir » ou « Voir » sans contexte lorsque plusieurs objets sont visibles.
- Rendre l’état désactivé lisible et expliquer la condition manquante à proximité.
- Ne pas utiliser de lien souligné comme unique action principale.
- Donner au bouton principal un contraste stable et un retour au clic.
- Ajouter `type="button"` aux boutons qui ne soumettent aucun formulaire.

### Formulaires et import vidéo

- Associer chaque champ à un libellé visible.
- Afficher format, taille et orientation attendus avant sélection.
- Afficher le nom du fichier et une action claire pour le remplacer.
- Ne pas compter uniquement sur la couleur pour indiquer une erreur.
- Garder les messages d’aide sous le champ concerné.
- Les zones de dépôt doivent être accessibles au clavier.
- Les dates et heures doivent indiquer le fuseau utilisé.

### Tableaux et listes

- Sur mobile, transformer les tableaux larges en cartes plutôt qu’imposer un défilement horizontal.
- Conserver mission, statut, progression et action dans chaque carte.
- Ne pas masquer une information critique uniquement pour gagner de la place.
- Donner au bouton d’action toute la largeur disponible sur petit écran.
- Maintenir une séparation visuelle nette entre les lignes.

### Analyse virale

- Indiquer que le score est une estimation et non une garantie.
- Expliquer chaque composante du score en langage simple.
- Afficher les recommandations par ordre de priorité.
- Garantir la lisibilité du graphique circulaire sans dépendre de la couleur.
- Garder l’action suivante visible après les résultats.

### Publication multicanale

- Montrer les quatre étapes du parcours sans les rendre encombrantes.
- Permettre de sélectionner chaque réseau sur toute la surface de sa carte.
- Afficher clairement le nombre de destinations.
- Exiger le titre YouTube uniquement lorsque YouTube est sélectionné.
- Exiger une date uniquement lorsque « Programmer » est actif.
- Expliquer que la connexion OAuth intervient avant le premier envoi réel.
- Ne jamais demander les mots de passe des réseaux.
- Sur mobile, placer le résumé après les champs et garder le CTA évident.

### Modales et notifications

- Nommer chaque boîte de dialogue.
- Fournir un bouton de fermeture de 44 px.
- Empêcher la modale de dépasser la hauteur visible.
- Empiler les actions sur les écrans étroits.
- Conserver une action secondaire explicite pour revenir au brouillon.
- Les toasts doivent être annoncés par les technologies d’assistance et rester assez longtemps pour être lus.

## Responsive

Valider au minimum les largeurs logiques 320, 360, 390, 430, 768, 1024, 1280 et 1440 px.

- Aucun défilement horizontal involontaire.
- Aucun texte coupé.
- Aucun bouton sous 44 px.
- Aucun élément flottant hors écran.
- Aucun titre recouvrant une illustration.
- Les grilles passent de quatre à deux puis une colonne selon le contenu.
- Les modales utilisent presque toute la largeur sur mobile avec des marges de 12 à 16 px.
- Les zones fixes respectent `env(safe-area-inset-bottom)`.
- Le contenu principal n’est jamais caché derrière la navigation mobile.
- Les vidéos gardent un ratio cohérent et ne provoquent pas de saut de mise en page.

## Accessibilité

- Ajouter un lien d’évitement vers le contenu principal.
- Utiliser les niveaux de titres dans l’ordre.
- Donner un nom à chaque navigation.
- Utiliser des onglets avec `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls` et `aria-labelledby`.
- Retirer les boucles décoratives répétées de l’arbre d’accessibilité.
- Conserver un texte de remplacement pour les informations visuelles essentielles.
- Garantir un focus visible sur liens, boutons, champs, listes et zones d’import.
- Ne jamais supprimer `outline` sans remplacement.
- Respecter les préférences de réduction de mouvement.
- Tester le parcours intégral au clavier.

## Animations

- Limiter les animations continues à quelques éléments du premier écran.
- Utiliser uniquement `transform` et `opacity` pour les mouvements fréquents.
- Ne pas animer largeur, hauteur ou position de mise en page en continu.
- Mettre en pause le bandeau défilant au survol.
- Éviter les durées inférieures à 150 ms et supérieures à 800 ms pour les interactions.
- Donner un feedback de pression avec une translation maximale de 1 px.
- Ne pas faire pulser plusieurs CTA simultanément.
- Supprimer tout mouvement dans le mode réduit.

## Critères de sortie

- Le build de production et le contrôle TypeScript passent.
- Aucun message d’erreur applicatif n’apparaît dans la console.
- Les trois onglets produit changent réellement de contenu.
- Chaque CTA de la page publique ouvre la démo.
- Les vues Missions, Clips, Viralité et Publier restent accessibles sur mobile.
- Le tableau Missions devient une liste de cartes sur petit écran.
- Les textes utiles sont lisibles sans zoom.
- Le focus clavier est visible partout.
- La page ne déborde pas horizontalement.
- Les fonctions déjà livrées restent opérationnelles.

