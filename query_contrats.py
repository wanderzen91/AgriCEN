from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Contrat
from config import Config

# Créer une connexion à la base de données
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

# ID du contrat de référence
id_contrat_ref = 934

# Sous-requête pour obtenir l'id_societe du contrat de référence
subquery = (
    session.query(Contrat.id_societe)
    .filter(Contrat.id_contrat == id_contrat_ref)
    .scalar_subquery()
)

# Requête principale pour trouver tous les contrats de la même société
results = (
    session.query(Contrat)
    .filter(
        Contrat.id_societe == subquery,
        Contrat.id_contrat != id_contrat_ref
    )
    .all()
)

# Afficher les résultats
print(f"Contrat de référence: #{id_contrat_ref}")

# Récupérer l'id_societe pour affichage
id_societe = session.query(Contrat.id_societe).filter(Contrat.id_contrat == id_contrat_ref).scalar()
print(f"ID de société: {id_societe}")

# Afficher les contrats trouvés
print(f"Nombre de contrats trouvés: {len(results)}")
for contrat in results:
    type_contrat_nom = contrat.type_contrat.appellation_contrat if contrat.type_contrat else "Non spécifié"
    print(f"Contrat #{contrat.id_contrat} - Type: {type_contrat_nom} - Société: {contrat.id_societe}")

session.close()