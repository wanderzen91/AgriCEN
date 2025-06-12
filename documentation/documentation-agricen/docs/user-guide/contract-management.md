# Gestion des contrats


## Création d'un nouveau contrat

Pour créer un nouveau contrat, suivez ces étapes :

1. Depuis l'interface cartographique, cliquez sur le site CEN concerné
2. Vous arriverez sur un formulaire de saisie avec plusieurs onglets
3. Remplissez les informations requises dans chaque onglet
4. Enregistrez le contrat avec le bouton "Enregistrer les données" en bas du formulaire

![Formulaire de création de contrat](../assets/contract-form.png)

## Structure du formulaire

Le formulaire de création/édition de contrat est organisé en plusieurs sections :

### Informations générales

- **Code site** : Code du site CEN concerné
- **Nom du site** : Nom du site CEN concerné

### Exploitation

Cette section regroupe toutes les données relatives à l'exploitation :

- **N° SIRET** : Pour les sociétés, avec récupération automatique des données via l'API SIRENE
- **Nom de la Société** : nom de la société récupéré automatiquement via l'API SIRENE
- **Adresse complète de l'établissement** : adresse de l'établissement récupérée automatiquement via l'API SIRENE
- **Activité principale** : activité principale récupérée automatiquement via l'API SIRENE
- **Catégorie juridique** : catégorie juridique récupérée automatiquement via l'API SIRENE
- **Tranche d'effectif salarié de l'établissement** : tranche d'effectif récupérée automatiquement via l'API SIRENE
- **Contact** : contact (téléphone ou email)
- **Recherche d'un exploitant existant** : champ permettant de récupérer le nom et le prénom d'un exploitant existant ou de créer un nouvel exploitant
- **Nom de l'exploitant** : saisie du nom de l'exploitant si non fait via le champ "Rechercher un exploitant"
- **Prénom de l'exploitant** : saisie du prénom de l'exploitant si non fait via le champ "Rechercher un exploitant"
- **Date de naissance** : date de naissance de l'exploitant
- **Types de production Biologique** : saisie des types de production biologique
- **Types de production Conventional** : saisie des types de production conventionnel

### Partenariat CEN

Cette section regroupe les informations relatives au contrat agricole :

- **Type de contrat** : type de contrat concerné
- **Date de signature** : date de signature du contrat
- **Date de prise d'effet** : date de prise d'effet du contrat
- **Date de fin** : date de fin du contrat

### Types de production

Dans cette section, vous pouvez spécifier :

- **Type de production** : Nature de la production (céréales, élevage, viticulture, etc.)
- **Mode de production** : Conventionnel, biologique, en conversion, etc.

### Produits finis

Cette section permet d'indiquer les produits issus de l'activité agricole :

- **Type de produit** : Sélection multiple possible (viande, lait, céréales, etc.)

### Types de milieu

Cette section permet de caractériser les milieux naturels concernés :

- **Type de milieu** : Sélection multiple possible (prairie, zone humide, forêt, etc.)

## Modification d'un contrat existant

Pour modifier un contrat :

1. Depuis l'interface cartographique, cliquez sur l'icône de modification dans la liste des contrats
2. Ou cliquez sur un site dans la carte puis sélectionnez "Modifier le contrat" dans l'infobulle
3. Le formulaire d'édition s'ouvre avec les données existantes pré-remplies
4. Effectuez vos modifications
5. Cliquez sur "Sauvegarder" pour enregistrer les changements

## Suppression d'un contrat

Pour supprimer un contrat :

1. Depuis l'interface cartographique, cliquez sur l'icône de suppression dans la liste des contrats
2. Une boîte de dialogue de confirmation apparaît
3. Confirmez la suppression en cliquant sur "Supprimer"

!!! warning "Attention"
    La suppression d'un contrat est irréversible. Toutes les données associées au contrat seront supprimées.
    
## Validation des données

Le formulaire intègre plusieurs validations pour garantir la qualité des données :

- Vérification des champs obligatoires
- Validation des formats (dates, nombres)
- Contrôle des relations entre les entités

Les erreurs sont affichées directement sous les champs concernés, avec des explications détaillées pour corriger rapidement les problèmes.
