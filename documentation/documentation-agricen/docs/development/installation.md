# Installation

Ce guide détaille les étapes nécessaires pour installer et configurer l'environnement de développement de l'application AgriCEN.

## Prérequis

Avant de commencer, assurez-vous que les composants suivants sont installés sur votre système :

- Python 3.8 ou supérieur
- PostgreSQL 12 ou supérieur avec l'extension PostGIS
- Git

## Récupération du code source

Clonez le dépôt Git de l'application :

```bash
git clone https://github.com/CEN-Nouvelle-Aquitaine/AgriCEN.git
cd AgriCEN/Flask-Leaflet
```

## Création de l'environnement virtuel Python

Il est recommandé d'utiliser un environnement virtuel pour isoler les dépendances de l'application :

### Sous Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Sous Linux/macOS

```bash
python -m venv venv
source venv/bin/activate
```

## Installation des dépendances

Installez toutes les dépendances nécessaires au fonctionnement de l'application :

```bash
pip install -r requirements.txt
```


## Configuration de la base de données

### Création des bases de données PostgreSQL

L'application nécessite deux bases de données PostgreSQL :

1. Une base principale pour les données applicatives
2. Une base secondaire pour les données spatiales

```sql
-- Se connecter à PostgreSQL en tant qu'utilisateur avec des privilèges administratifs
CREATE DATABASE agricen;
CREATE DATABASE fonciercen;

-- Activer l'extension PostGIS sur les deux bases
\c agricen
CREATE EXTENSION postgis;

\c fonciercen
CREATE EXTENSION postgis;

-- Créer un utilisateur dédié (optionnel mais recommandé)
CREATE USER agricen_user WITH PASSWORD 'mot_de_passe_sécurisé';
GRANT ALL PRIVILEGES ON DATABASE agricen TO agricen_user;
GRANT ALL PRIVILEGES ON DATABASE fonciercen TO agricen_user;
```

Après avoir créé les bases de données et configuré la connexion, utilisez le script `create_db.py` pour générer automatiquement toutes les tables et schémas nécessaires :

```bash
python create_db.py
```

Ce script va automatiquement :

1. Créer les schémas nécessaires (`saisie`, `referentiels`, etc.)
2. Générer toutes les tables à partir des modèles définis dans `models.py`
3. Configurer les relations entre les tables et les contraintes
4. Initialiser les extensions spatiales requises pour GeoAlchemy2

Aucune manipulation manuelle des schémas ou tables n'est nécessaire.

### Fichier .env

Créez un fichier `.env` à la racine du projet pour configurer les variables d'environnement :

```
# Environnement
FLASK_ENV=development
FLASK_APP=app.py

# Base de données
DATABASE_URL=postgresql://agricen_user:mot_de_passe_sécurisé@localhost:5432/agricen
SECONDARY_DATABASE_URL=postgresql://agricen_user:mot_de_passe_sécurisé@localhost:5432/fonciercen

# Sécurité
SECRET_KEY=générer_une_clé_aléatoire_ici

# Azure AD (à remplacer par vos propres valeurs)
CLIENT_ID=votre_client_id_azure
CLIENT_SECRET=votre_client_secret_azure
TENANT_ID=votre_tenant_id_azure

```

!!! tip "Génération de clé secrète"
    Pour générer une clé secrète sécurisée, vous pouvez utiliser la commande suivante :
    ```python
    python -c "import secrets; print(secrets.token_hex(32))"
    ```

### Configuration Microsoft Entra ID

Pour utiliser l'authentification Microsoft, vous devez enregistrer votre application dans Microsoft Entra ID :

1. Connectez-vous au [Portail Microsoft Entra ID](https://entra.microsoft.com)
2. Accédez à Entra ID > Applications > Inscriptions d'applications > Nouvelle inscription
3. Donnez un nom à votre application
4. Configurez les URI de redirection (ex: `https://localhost:8000/auth/callback` pour le développement local)
5. Notez l'ID client (client_id)
6. Dans Certificats et secrets, créez un nouveau secret client
7. Notez la valeur du secret (client_secret)


## Lancement du serveur de développement

Une fois l'installation et la configuration terminées, activez votre environnement virtuel et lancez le serveur de développement :

```bash
 waitress-serve --listen=localhost:8800 views:app  
```

L'application est maintenant accessible à l'adresse [http://localhost:8800](http://localhost:8800).

## Résolution des problèmes courants

### Problèmes de connexion à la base de données

- Vérifiez que le service PostgreSQL est bien démarré
- Vérifiez que les identifiants dans le fichier `.env` sont corrects
- Assurez-vous que l'utilisateur a les droits sur les schémas `saisie` et `referentiel`

### Erreurs lors de l'authentification Microsoft

- Vérifiez que les identifiants Entra ID sont corrects
- Assurez-vous que les URLs de redirection sont bien configurées dans le portail Azure
- Vérifiez que les permissions requises sont activées pour votre application

### Problèmes avec les données spatiales

- Confirmez que l'extension PostGIS est bien installée
- Vérifiez la connection à la base de données secondaire
