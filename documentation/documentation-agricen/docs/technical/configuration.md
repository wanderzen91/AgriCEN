# Configuration

L'application AgriCEN utilise un système de configuration flexible permettant d'adapter facilement l'environnement d'exécution (développement, production, test) sans modifier le code source.

## Fichier de configuration principal

Le fichier `config.py` centralise toutes les options de configuration de l'application (secrets dans .env) :

```python
class Config:
    # Configuration de la base de données principale
    SQLALCHEMY_DATABASE_URI = (
        f'postgresql://{os.environ.get("DB_USERNAME")}:{os.environ.get("DB_PASSWORD")}'
        f'@{os.environ.get("DB_HOST")}:{db_port}/{os.environ.get("DB_NAME")}'
    )

    
    # Configuration de la base de données secondaire (pour la vue SitesCEN)
    SQLALCHEMY_BINDS = {
        'secondary': (
            f'postgresql://{os.environ.get("DB_USERNAME2")}:{encoded_password}'
            f'@{os.environ.get("DB_HOST2")}:{os.environ.get("DB_PORT2")}/{os.environ.get("DB_NAME2")}'
        )
    }
    # Options SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False

   # Configuration pour l'authentification Microsoft 365
    CLIENT_ID = os.environ.get("AZURE_CLIENT_ID", "")
    CLIENT_SECRET = os.environ.get("AZURE_CLIENT_SECRET", "")
    TENANT_ID = os.environ.get("AZURE_TENANT_ID", "")
    AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
    REDIRECT_PATH = "/auth/callback"  # Route de redirection après authentification
    SCOPE = ["User.Read"]  # Permissions demandées
    SESSION_TYPE = "filesystem"  # Pour stocker les sessions utilisateur
    PERMANENT_SESSION_LIFETIME = 7200  # Durée de vie de la session en secondes


```

La clé secrète de session (SECRET_KEY) est générée dynamiquement au lancement de l’application dans views.py:

```python
app.config['SECRET_KEY'] = secrets.token_hex(24)
```


## Variables d'environnement

Les variables d'environnement sont stockées dans un fichier .env.
```
# .env

# Base principale
DB_USERNAME=agricen_user
DB_PASSWORD=motdepasse123
DB_HOST=serveur-principal.exemple.com
DB_PORT=5432
DB_NAME=agricen_db

# Base secondaire (Vue SitesCEN FoncierCEN)
DB_USERNAME2=sitescen_user
DB_PASSWORD2=motdepasse123
DB_HOST2=serveur-secondaire.exemple.com
DB_PORT2=5432
DB_NAME2=sitescen_db

# Configuration pour l'authentification Microsoft 365 (Entra ID)
AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
AZURE_CLIENT_SECRET=xxxxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_TENANT_ID=11111111-1111-1111-1111-111111111111

```

Les variables d'environnement sont chargées dans l'application à l'aide du module `python-dotenv` 


## Configuration de la base de données

AgriCEN utilise deux bases de données PostgreSQL :

1. **Base principale** : Stocke les données de l'application (contrats, agriculteurs, etc.)
2. **Base secondaire** : pour la vue des sites CEN dispo dans FoncierCEN

La configuration utilise SQLAlchemy avec des "binds" pour gérer ces deux connexions :

```python
# Dans config.py
SQLALCHEMY_DATABASE_URI = 'postgresql://username:password@localhost:5432/agricen'
SQLALCHEMY_BINDS = {
    'secondary': 'postgresql://username:password@localhost:5432/fonciercen'
}

# Dans le code
class VueSites(db.Model):
    __bind_key__ = 'secondary'  # Utilise la base secondaire
    # ...
```

## Scripts d'initialisation

Le fichier `create_db.py` contient les scripts nécessaires pour initialiser la base de données :

```python
from app import app, db

def init_db():
    with app.app_context():
        db.create_all()
        # Insérer les données de référence si nécessaire
        # ...

if __name__ == '__main__':
    init_db()
    print("Base de données initialisée avec succès.")
```

