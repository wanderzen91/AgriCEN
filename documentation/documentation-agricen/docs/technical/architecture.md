# Architecture de l'application

## Composants principaux

### Backend

Le backend est développé avec Flask :

- **Flask** : Framework web principal
- **SQLAlchemy** : ORM (Object-Relational Mapping) pour interagir avec la base de données
- **Flask-WTF** : Gestion des formulaires
- **Flask-Login** : Gestion de l'authentification
- **Flask-Migrate** : Gestion des migrations de la base de données
- **GeoAlchemy2** : Extension SQLAlchemy pour gérer les données spatiales

### Frontend

Le frontend utilise des technologies web standard avec quelques bibliothèques spécialisées :

- **HTML5/CSS3** : Structure et mise en page
- **Bootstrap** : Framework CSS pour une interface responsive
- **JavaScript** : Logique côté client
- **Leaflet** : Bibliothèque JavaScript pour les cartes interactives

### Base de données

La base de données repose sur PostgreSQL et son extension PostGIS :

- **PostgreSQL** : BDD relationnelle
- **PostGIS** : Extension spatiale pour PostgreSQL

### Authentification

L'authentification utilise Microsoft Entra ID pour une sécurité renforcée :

- **MSAL** (Microsoft Authentication Library) : Intégration avec Entra ID
- **Flask-Login** : Gestion des sessions utilisateurs
- **OAuth 2.0** : Protocole d'autorisation
- **HTTPS** : Communications sécurisées

### APIs

L'application s'intègre avec plusieurs APIs :

- **API SIRENE** : Récupération des informations des entreprises
- **API internes** : Points d'entrée REST pour les données dynamiques

## Organisation du code

Le code source est organisé selon la structure suivante :

```
Flask-Leaflet/
├── views.py            # Point d'entrée principal (initialisation de l'app Flask et routes)
├── auth.py             # Gestion de l'authentification
├── config.py           # Configuration de l'application
├── create_db.py        # Script d'initialisation de la base de données
├── forms.py            # Définition des formulaires
├── models.py           # Modèles de données
├── static/             # Ressources statiques (CSS, JS, images)
│   ├── css/            # Feuilles de style
│   ├── js/             # Scripts JavaScript
│   └── images/         # Images
├── templates/          # Templates HTML (Jinja2)
└── documentation/      # Documentation du projet
```

