from dotenv import load_dotenv
import os
from urllib.parse import quote
# Charger le fichier .env
load_dotenv()

class Config:

    try:
        db_port = int(os.environ.get("DB_PORT", 5432))  # Default to 5432 if not set
    except ValueError:
        raise ValueError("DB_PORT environment variable must be an integer")

    # Base de données principale
    SQLALCHEMY_DATABASE_URI = (
        f'postgresql://{os.environ.get("DB_USERNAME")}:{os.environ.get("DB_PASSWORD")}'
        f'@{os.environ.get("DB_HOST")}:{db_port}/{os.environ.get("DB_NAME")}'
    )

    encoded_password = quote(os.environ.get("DB_PASSWORD2", ""))  # Encodage du mot de passe

    # Configuration de la base de données secondaire
    SQLALCHEMY_BINDS = {
        'secondary': (
            f'postgresql://{os.environ.get("DB_USERNAME2")}:{encoded_password}'
            f'@{os.environ.get("DB_HOST2")}:{os.environ.get("DB_PORT2")}/{os.environ.get("DB_NAME2")}'
        )
    }

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuration pour l'authentification Microsoft 365
    CLIENT_ID = os.environ.get("AZURE_CLIENT_ID", "")
    CLIENT_SECRET = os.environ.get("AZURE_CLIENT_SECRET", "")
    TENANT_ID = os.environ.get("AZURE_TENANT_ID", "")
    AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
    REDIRECT_PATH = "/auth/callback"  # Route de redirection après authentification
    SCOPE = ["User.Read"]  # Permissions demandées
    SESSION_TYPE = "filesystem"  # Pour stocker les sessions utilisateur
    PERMANENT_SESSION_LIFETIME = 3600  # Durée de vie de la session en secondes
