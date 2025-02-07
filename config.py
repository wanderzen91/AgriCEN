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


    # Debugging: afficher la valeur actuelle de l'URI
    print(SQLALCHEMY_DATABASE_URI)
    print(SQLALCHEMY_BINDS)