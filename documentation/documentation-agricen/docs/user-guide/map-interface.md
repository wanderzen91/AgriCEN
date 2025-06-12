# Interface cartographique

L'interface cartographique est le cœur de l'application AgriCEN. Elle permet de visualiser et d'interagir avec les sites du CEN et les contrats associés.

## Vue d'ensemble

![Interface principale](../assets/map-interface.png)

L'interface se compose de :

1. **Carte interactive** : Affiche les sites CEN et les contrats agricoles
2. **Barre de recherche** : Permet de rechercher un contrat selon différents critères via un panel de filtres
3. **Onglet "Dataviz"** : Volet permettant de visualiser le dashboard des données agricoles
4. **Onglet "Carto"** : Volet permettant de retourner sur la carte interactive
5. **Nom utilisateur** : Nom de l'utilisateur connecté avec un bouton de déconnexion


## Navigation sur la carte

La carte utilise la bibliothèque Leaflet et offre les fonctionnalités suivantes :

- **Zoom** : Utilisez la molette de la souris ou les boutons +/- pour zoomer/dézoomer
- **Déplacement** : Cliquez et maintenez pour déplacer la carte
- **Sélection d'un site** : Cliquez sur un site pour afficher ses informations dans un volet latéral
- **Fond de carte** : Changez le fond de carte via le bouton en haut à droite (satellite, OpenStreetMap, etc.)

## Sites du CEN

Les sites du CEN sont représentés par des polygones verts transparents sur la carte. Deux types d'interactions sont possibles :

- Un simple clic permet d'ajouter un contrat sur le site
- un simple passage de la souris sur le site permet de visualiser le nom du site et son code

## Recherche et filtres

Les filtres permettent d'affiner l'affichage des contrats sur la carte selon :

- Nom et/ou prénom de l'agriculteur
- Nom de la société
- Type de contrat
- Nom du référent 
- Type de production
- Type de produit fini
- Contrats en cours
- Surface contractualisée



## Actions disponibles

Depuis l'interface cartographique, vous pouvez :

1. **Créer un nouveau contrat** : en cliquant sur le site CEN concerné (il n'est pas possible de créer un contrat en dehors d'un site CEN)
2. **Modifier un contrat** : clic sur l'icone du contrat puis sur le bouton "Modifier" dans le volet latéral
3. **Supprimer un contrat** : clic sur l'icone du contrat puis sur le bouton "Supprimer" dans le volet latéral
4. **Rechercher un contrat** : en cliquant sur l'onglet "Recherche" et en utilisant les filtres disponibles
5. **Accéder aux statistiques** : en cliquant sur l'onglet "Dataviz"
