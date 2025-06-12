# Configuration pour le développement

Ce guide décrit les différentes options de configuration disponibles pour le développement de l'application AgriCEN.

## Structure de la configuration

La configuration de l'application est centralisée dans le fichier `config.py`. Ce fichier définit la classe `Config` qui contient toutes les variables de configuration utilisées par l'application.

## Variables d'environnement

Pour faciliter le développement et éviter de stocker des informations sensibles dans le code source, l'application utilise des variables d'environnement chargées depuis un fichier `.env`. Ce fichier doit être créé à la racine du projet et ne doit pas être versionné (il est listé dans `.gitignore`).

### Exemple de fichier .env complet

```
# Environnement Flask
FLASK_ENV=development
FLASK_APP=app.py
FLASK_DEBUG=1

# Base de données
DATABASE_URL=postgresql://username:password@localhost:5432/agricen
SECONDARY_DATABASE_URL=postgresql://username:password@localhost:5432/fonciercen

# Sécurité
SECRET_KEY=your_secret_key_here
WTF_CSRF_SECRET_KEY=your_csrf_secret_key_here

# Azure AD
CLIENT_ID=your_azure_client_id
CLIENT_SECRET=your_azure_client_secret
TENANT_ID=your_azure_tenant_id

# API SIRENE
SIRENE_API_URL=https://api.insee.fr/entreprises/sirene/V3
SIRENE_TOKEN=your_sirene_token

# Options de débogage
SQLALCHEMY_ECHO=true
```

## Mode de développement

En mode développement (`FLASK_ENV=development`), l'application active automatiquement certaines fonctionnalités :

- Mode débogage activé (messages d'erreur détaillés)
- Rechargement automatique du code modifié
- Journalisation plus verbeuse
- Affichage des requêtes SQL dans la console (`SQLALCHEMY_ECHO=true`)
- Désactivation optionnelle de la protection CSRF pour faciliter les tests

## Configuration de la base de données

### Structure à deux bases

L'application utilise deux bases de données PostgreSQL :

1. **Base principale** (`agricen`) : Stocke les données métier (contrats, agriculteurs, etc.)
2. **Base secondaire** (`fonciercen`) : Stocke les données géospatiales des sites

Cette séparation est gérée par SQLAlchemy grâce à la configuration `SQLALCHEMY_BINDS`.

### Créer un environnement de développement local

Pour simplifier le développement, vous pouvez créer un fichier `local_db.sh` pour initialiser rapidement des bases de données locales :

```bash
#!/bin/bash

# Créer les bases de données
psql -U postgres -c "CREATE DATABASE agricen;"
psql -U postgres -c "CREATE DATABASE fonciercen;"

# Activer PostGIS
psql -U postgres -d agricen -c "CREATE EXTENSION postgis;"
psql -U postgres -d fonciercen -c "CREATE EXTENSION postgis;"

# Créer les schémas nécessaires
psql -U postgres -d agricen -c "CREATE SCHEMA saisie;"
psql -U postgres -d agricen -c "CREATE SCHEMA referentiel;"

echo "Bases de données créées avec succès"
```

### Migration de la base de données

Flask-Migrate est utilisé pour gérer les migrations de schéma. Pour initialiser ou mettre à jour votre base de données :

```bash
# Initialisation (première fois uniquement)
flask db init

# Création d'une migration après modification des modèles
flask db migrate -m "Description des changements"

# Application des migrations
flask db upgrade
```

## Configuration de l'authentification Microsoft

### Création d'une application de test

Pour le développement, vous pouvez créer une application de test dans Azure AD :

1. Accédez au [Portail Azure](https://portal.azure.com) > Azure Active Directory
2. Sélectionnez "Inscriptions d'applications" > "Nouvelle inscription"
3. Nommez votre application (ex: "AgriCEN Dev")
4. Pour "Types de comptes pris en charge", choisissez "Comptes dans cet annuaire organisationnel uniquement"
5. Définissez l'URI de redirection : `http://localhost:8000/auth/callback`
6. Notez l'ID d'application (client) et l'ID de l'annuaire (tenant)
7. Créez un secret client dans "Certificats et secrets"

### Configuration de l'authentification locale

Pour éviter d'utiliser l'authentification Microsoft pendant le développement, vous pouvez créer un mode de développement simplifié :

1. Ajoutez une option `USE_LOCAL_AUTH` dans votre fichier `.env`
2. Dans `auth.py`, implémentez une logique conditionnelle pour utiliser une authentification locale en développement

```python
# Exemple d'implémentation dans auth.py
if os.environ.get('USE_LOCAL_AUTH') == 'true':
    @app.route('/login')
    def login():
        user = User(id='dev-user', name='Développeur', email='dev@example.com')
        login_user(user)
        session['user'] = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
        }
        return redirect(url_for('map_page'))
```

## Configuration des API externes

### API SIRENE

Pour le développement, vous pouvez obtenir un token de test pour l'API SIRENE :

1. Créez un compte sur [api.insee.fr](https://api.insee.fr)
2. Souscrivez à l'API "Sirene V3"
3. Générez un token d'accès
4. Ajoutez ce token dans votre fichier `.env`

### Mock des réponses API

Pour développer sans dépendre des API externes, vous pouvez créer des "mocks" de réponses :

```python
# Exemple de mock pour la fonction fetch_siret_data
def fetch_siret_data_mock(siret, flash_messages=False):
    # Données fictives pour le développement
    mock_data = {
        "success": True,
        "data": {
            "nom_societe": "FERME DE TEST",
            "categorie_juridique": "5499",
            "activite_principale": "0111Z",
            "tranche_effectif": "11",
            "adresse_etablissement": "123 RUE DE TEST",
            "commune_etablissement": "VILLE TEST",
            "nom_etablissement": "FERME DE TEST"
        }
    }
    return mock_data

# Utiliser le mock en développement
if os.environ.get('FLASK_ENV') == 'development' and os.environ.get('USE_MOCK_API') == 'true':
    app.config['USE_MOCK_API'] = True
    # Remplacer la fonction réelle par le mock
    import views
    views.fetch_siret_data = fetch_siret_data_mock
```

## Configuration des logs

Pour faciliter le débogage, configurez les logs en mode développement :

```python
# Dans app.py ou views.py
import logging

if os.environ.get('FLASK_ENV') == 'development':
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
else:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
```

## Configuration des tests

Pour configurer l'environnement de test :

1. Créez un fichier `.env.test` spécifique pour les tests
2. Utilisez une base de données dédiée aux tests

```
# Fichier .env.test
FLASK_ENV=testing
DATABASE_URL=postgresql://username:password@localhost:5432/agricen_test
SECONDARY_DATABASE_URL=postgresql://username:password@localhost:5432/fonciercen_test
USE_LOCAL_AUTH=true
USE_MOCK_API=true
```

Pour lancer les tests avec cette configuration :

```bash
export $(cat .env.test | xargs) && pytest
```

## Profils de configuration

Vous pouvez créer plusieurs profils de configuration pour différents scénarios de développement :

- `.env.local` : Configuration locale standard
- `.env.test` : Configuration pour les tests
- `.env.docker` : Configuration pour le développement avec Docker

Pour utiliser un profil spécifique :

```bash
export ENV_FILE=.env.docker
flask run
```

Dans le code de l'application :

```python
# app.py
from dotenv import load_dotenv
import os

env_file = os.environ.get('ENV_FILE', '.env')
load_dotenv(env_file)
```
