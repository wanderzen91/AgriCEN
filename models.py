from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from geoalchemy2 import Geometry
from sqlalchemy import Index

db = SQLAlchemy()

# Table Agriculteur
class Agriculteur(db.Model):
    __tablename__ = 'agriculteur'
    __table_args__ = {'schema': 'saisie'}
    id_agriculteur = db.Column(db.Integer, primary_key=True)
    nom_agri = db.Column(db.String(100), nullable=False)
    prenom_agri = db.Column(db.String(50), nullable=False)
    date_naissance = db.Column(db.Date)

    # Relation avec AgriculteurSociete
    societes_intermediaires = db.relationship(
        'AgriculteurSociete',
        back_populates='agriculteur',
        cascade='all, delete-orphan'
    )

# Table Société
class Societe(db.Model):
    __tablename__ = 'societe'
    __table_args__ = {'schema': 'saisie'}
    id_societe = db.Column(db.Integer, primary_key=True)
    nom_societe = db.Column(db.String(100))
    contact = db.Column(db.String(100), nullable=False)
    siret = db.Column(db.String(14), unique=True)
    categorie_juridique = db.Column(db.String(4), db.ForeignKey('referentiel.type_categorie_juridique.code_type_categorie_juridique'))
    activite_principale = db.Column(db.String(6), db.ForeignKey('referentiel.type_activite_principale.code_type_activite_principale'))
    tranche_effectif = db.Column(db.String(2), db.ForeignKey('referentiel.type_tranche_effectif.code_type_tranche_effectif'))
    adresse_etablissement = db.Column(db.String(150))
    commune_etablissement = db.Column(db.String(150))
    nom_etablissement = db.Column(db.String(150))
    remarques = db.Column(db.String(300))

    # Relations
    agriculteurs_intermediaires = db.relationship(
        'AgriculteurSociete',
        back_populates='societe',
        cascade='all, delete-orphan'
    )

    contrats = db.relationship(
        'Contrat', 
        back_populates='societe',
        cascade='all, delete-orphan'
    )
    
    types_production_societe = db.relationship(
        'TypeProductionSociete',
        back_populates='societe',
        cascade='all, delete-orphan'
    )

    # Relations avec les tables de référence
    categorie_juridique_obj = db.relationship('TypeCategorieJuridique', back_populates='societes')
    activite_principale_obj = db.relationship('TypeActivitePrincipale', back_populates='societes')
    tranche_effectif_obj = db.relationship('TypeTrancheEffectif', back_populates='societes')

# Table TypeProduction
class TypeProduction(db.Model):
    __tablename__ = 'type_production'
    __table_args__ = {'schema': 'referentiel'}

    id_type_production = db.Column(db.Integer, primary_key=True)
    nature_production = db.Column(db.String(50))

    societes = db.relationship('TypeProductionSociete', back_populates='type_production')

# Modèle ModeProduction
class ModeProduction(db.Model):
    __tablename__ = 'mode_production'
    __table_args__ = {'schema': 'referentiel'}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relation avec TypeProductionSociete
    societes_types_production = db.relationship('TypeProductionSociete', back_populates='mode_production')

# Table TypeProduitFini
class TypeProduitFini(db.Model):
    __tablename__ = 'type_produit_fini'
    __table_args__ = {'schema': 'referentiel'}
    id_type_produit_fini = db.Column(db.Integer, primary_key=True)
    nature_produit_fini = db.Column(db.String(50))

    contrats = db.relationship('ProduitFiniContrat', back_populates='produit_fini')

# Table Référent
class Referent(db.Model):
    __tablename__ = 'referent'
    __table_args__ = {'schema': 'saisie'}
    id_referent = db.Column(db.Integer, primary_key=True)
    nom_referent = db.Column(db.String(100))
    prenom_referent = db.Column(db.String(50))

    contrats = db.relationship('Contrat', back_populates='referent')


# Table TypeMilieu
class TypeMilieu(db.Model):
    __tablename__ = 'type_milieu'
    __table_args__ = {'schema': 'referentiel'}
    id_type_milieu = db.Column(db.Integer, primary_key=True)
    milieu = db.Column(db.String(100))

    contrats = db.relationship('TypeMilieuContrat', back_populates='type_milieu')

# Table TypeContrat
class TypeContrat(db.Model):
    __tablename__ = 'type_contrat'
    __table_args__ = {'schema': 'referentiel'}
    id_type_contrat = db.Column(db.Integer, primary_key=True)
    appellation_contrat = db.Column(db.String(100), nullable=False)

    contrats = db.relationship('Contrat', back_populates='type_contrat')

# Table Contrat
class Contrat(db.Model):
    __tablename__ = 'contrat'
    __table_args__ = {'schema': 'saisie'}
    id_contrat = db.Column(db.Integer, primary_key=True)
    surf_contractualisee = db.Column(db.Numeric(4, 2))
    date_signature = db.Column(db.Date)
    date_fin = db.Column(db.Date)
    date_prise_effet = db.Column(db.Date)
    latitude = db.Column(db.Numeric(8, 5))
    longitude = db.Column(db.Numeric(8, 5))
    date_ajout_bdd = db.Column(db.DateTime, default=datetime.now)
    numero_contrat = db.Column(db.String(50))
    remarques = db.Column(db.Text)

    id_societe = db.Column(db.Integer, db.ForeignKey('saisie.societe.id_societe'), nullable=False)
    id_referent = db.Column(db.Integer, db.ForeignKey('saisie.referent.id_referent'))
    id_type_contrat = db.Column(db.Integer, db.ForeignKey('referentiel.type_contrat.id_type_contrat'))

    societe = db.relationship('Societe', back_populates='contrats')
    referent = db.relationship('Referent', back_populates='contrats')
    type_contrat = db.relationship('TypeContrat', back_populates='contrats')
    
    produits_finis = db.relationship(
        'ProduitFiniContrat',
        back_populates='contrat',
        cascade='all, delete-orphan'
    )
    # Relation avec TypeMilieuContrat
    types_milieu = db.relationship(
        'TypeMilieuContrat',
        back_populates='contrat',
        cascade='all, delete-orphan'
    )
    sites_cen = db.relationship(
        'ContratSiteCEN', 
        back_populates='contrat',
        cascade='all, delete-orphan'
    )

# Association Table: Agriculteur - Société
class AgriculteurSociete(db.Model):
    __tablename__ = 'agriculteur_societe'
    __table_args__ = {'schema': 'saisie'}
    id_agriculteur = db.Column(db.Integer, db.ForeignKey('saisie.agriculteur.id_agriculteur'), primary_key=True)
    id_societe = db.Column(db.Integer, db.ForeignKey('saisie.societe.id_societe'), primary_key=True)

    # Relation avec Societe
    societe = db.relationship('Societe', back_populates='agriculteurs_intermediaires')
    # Relation avec Agriculteur
    agriculteur = db.relationship('Agriculteur', back_populates='societes_intermediaires')

# Association Table: TypeProduction - Société
class TypeProductionSociete(db.Model):
    __tablename__ = 'type_production_societe'
    __table_args__ = {'schema': 'saisie'}

    id_societe = db.Column(db.Integer, db.ForeignKey('saisie.societe.id_societe'), primary_key=True)
    id_type_production = db.Column(db.Integer, db.ForeignKey('referentiel.type_production.id_type_production'), primary_key=True)
    id_mode_production = db.Column(db.Integer, db.ForeignKey('referentiel.mode_production.id'))

    type_production = db.relationship('TypeProduction', back_populates='societes')
    societe = db.relationship('Societe', back_populates='types_production_societe')
    mode_production = db.relationship('ModeProduction', back_populates='societes_types_production')
    
# Association Table: ProduitFini - Contrat
class ProduitFiniContrat(db.Model):
    __tablename__ = 'produit_fini_contrat'
    __table_args__ = {'schema': 'saisie'}
    id_type_produit_fini = db.Column(db.Integer, db.ForeignKey('referentiel.type_produit_fini.id_type_produit_fini'), primary_key=True)
    id_contrat = db.Column(db.Integer, db.ForeignKey('saisie.contrat.id_contrat'), primary_key=True)

    produit_fini = db.relationship('TypeProduitFini', back_populates='contrats')
    contrat = db.relationship('Contrat', back_populates='produits_finis')

# Association Table: TypeMilieu - Contrat
class TypeMilieuContrat(db.Model):
    __tablename__ = 'type_milieu_contrat'
    __table_args__ = {'schema': 'saisie'}
    id_type_milieu = db.Column(db.Integer, db.ForeignKey('referentiel.type_milieu.id_type_milieu'), primary_key=True)
    id_contrat = db.Column(db.Integer, db.ForeignKey('saisie.contrat.id_contrat'), primary_key=True)

    type_milieu = db.relationship('TypeMilieu', back_populates='contrats')
    contrat = db.relationship('Contrat', back_populates='types_milieu')

# Association Table: SiteCEN - Contrat
class ContratSiteCEN(db.Model):
    __tablename__ = 'contrat_site_cen'
    __table_args__ = {'schema': 'saisie'}
    id_site = db.Column(db.Integer, primary_key=True)
    id_contrat = db.Column(db.Integer, db.ForeignKey('saisie.contrat.id_contrat'), primary_key=True)
    code_site = db.Column(db.String(25))
    nom_site = db.Column(db.String(250))

    # Plus de relation avec SiteCEN car cette table a été supprimée
    # Les données du site sont maintenant stockées directement dans cette table
    contrat = db.relationship('Contrat', back_populates='sites_cen')

# Tables de référence
class TypeActivitePrincipale(db.Model):
    __tablename__ = 'type_activite_principale'
    __table_args__ = {'schema': 'referentiel'}

    code_type_activite_principale = db.Column(db.String(6), primary_key=True)
    lib_type_activite_principale = db.Column(db.String(150))

    # Relation avec Societe
    societes = db.relationship('Societe', back_populates='activite_principale_obj')

class TypeCategorieJuridique(db.Model):
    __tablename__ = 'type_categorie_juridique'
    __table_args__ = {'schema': 'referentiel'}

    code_type_categorie_juridique = db.Column(db.String(4), primary_key=True)
    lib_type_categorie_juridique = db.Column(db.String(150))

    # Relation avec Societe
    societes = db.relationship('Societe', back_populates='categorie_juridique_obj')

class TypeTrancheEffectif(db.Model):
    __tablename__ = 'type_tranche_effectif'
    __table_args__ = {'schema': 'referentiel'}

    code_type_tranche_effectif = db.Column(db.String(2), primary_key=True)
    lib_type_tranche_effectif = db.Column(db.String(150))

    # Relation avec Societe
    societes = db.relationship('Societe', back_populates='tranche_effectif_obj')

# Vue depuis BDD FoncierCEN
class VueSites(db.Model):
    __bind_key__ = 'secondary'  # Associe ce modèle à la base secondaire
    __tablename__ = 'site_geojson'
    __table_args__ = {'schema': 'saisie'}  
    
    idsite = db.Column(db.Integer, primary_key=True)
    codesite = db.Column(db.String(10))
    nom_site = db.Column(db.String(150))
    geom = db.Column(Geometry('MultiPolygon'))
    
Index('idx_site_geom', VueSites.geom, postgresql_using='gist')

db.configure_mappers()
