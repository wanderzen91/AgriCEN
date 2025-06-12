# Présentation d'AgriCEN

## Qu'est-ce qu'AgriCEN ?

AgriCEN est une application web développée par la DSI du CEN-NA qui permet d'inventorier et de gérer les contrats agricoles liés aux différents sites CEN.
    
L'application centralise les informations sur :
- Les contrats agricoles établis entre le CEN-NA et les exploitants
- Les agriculteurs partenaires et leurs exploitations
- Les types de productions et leurs modes d'exploitation (bio ou conventionnel)
- Les produits finis produits par les agriculteurs partenaires
- Les milieux naturels liés aux différents sites CEN
- Les salariés référents en charge des différents contrats

## Objectifs de l'application

AgriCEN a été développée pour répondre aux besoins suivants :

1. **Centralisation des données** : Regrouper en un seul endroit toutes les informations relatives aux contrats agricoles
2. **Visualisation cartographique** : Permettre une représentation spatiale des sites du CEN et des contrats associés
3. **Simplification de la gestion administrative** : Faciliter la création, modification et suivi des contrats
4. **Intégration des données externes** : Récupérer automatiquement les informations sur les entreprises via l'API SIRENE
5. **Analyse des données** : Produire des indicateurs et tableaux de bord pour le pilotage de l'activité

## Architecture de l'application

AgriCEN est construite selon une architecture web utilisant :

- **Flask** : Framework web Python pour le backend
- **PostgreSQL/PostGIS** : Base de données relationnelle avec extension spatiale
- **Leaflet** : Bibliothèque JavaScript pour les cartes interactives
- **Bootstrap** : Framework CSS pour l'interface utilisateur
- **Microsoft Azure AD** : Système d'authentification
