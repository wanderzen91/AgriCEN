from typing import List, Optional

from sqlalchemy import Column, Date, DateTime, Float, ForeignKeyConstraint, Integer, Numeric, PrimaryKeyConstraint, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import decimal

class Base(DeclarativeBase):
    pass


class ModeProduction(Base):
    __tablename__ = 'mode_production'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='mode_production_pkey'),
        UniqueConstraint('nom', name='mode_production_nom_key'),
        {'schema': 'referentiel'}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom: Mapped[str] = mapped_column(String(50))

    type_production_mode: Mapped[List['TypeProductionMode']] = relationship('TypeProductionMode', back_populates='mode_production')
    type_production_societe: Mapped[List['TypeProductionSociete']] = relationship('TypeProductionSociete', back_populates='mode_production')


class TypeActivitePrincipale(Base):
    __tablename__ = 'type_activite_principale'
    __table_args__ = (
        PrimaryKeyConstraint('code_type_activite_principale', name='type_activite_principale_pkey'),
        {'schema': 'referentiel'}
    )

    code_type_activite_principale: Mapped[str] = mapped_column(String(6), primary_key=True)
    lib_type_activite_principale: Mapped[Optional[str]] = mapped_column(String(150))


class TypeCategorieJuridique(Base):
    __tablename__ = 'type_categorie_juridique'
    __table_args__ = (
        PrimaryKeyConstraint('code_type_categorie_juridique', name='type_categorie_juridique_pkey'),
        {'schema': 'referentiel'}
    )

    code_type_categorie_juridique: Mapped[str] = mapped_column(String(4), primary_key=True)
    lib_type_categorie_juridique: Mapped[Optional[str]] = mapped_column(String(150))


class TypeContrat(Base):
    __tablename__ = 'type_contrat'
    __table_args__ = (
        PrimaryKeyConstraint('id_type_contrat', name='type_contrat_pkey'),
        {'schema': 'referentiel'}
    )

    id_type_contrat: Mapped[int] = mapped_column(Integer, primary_key=True)
    appellation_contrat: Mapped[str] = mapped_column(String(100))

    contrat: Mapped[List['Contrat']] = relationship('Contrat', back_populates='type_contrat')


class TypeMilieu(Base):
    __tablename__ = 'type_milieu'
    __table_args__ = (
        PrimaryKeyConstraint('id_type_milieu', name='type_milieu_pkey'),
        {'schema': 'referentiel'}
    )

    id_type_milieu: Mapped[int] = mapped_column(Integer, primary_key=True)
    milieu: Mapped[Optional[str]] = mapped_column(String(100))

    contrat: Mapped[List['Contrat']] = relationship('Contrat', secondary='saisie.type_milieu_contrat', back_populates='type_milieu')


class TypeProduction(Base):
    __tablename__ = 'type_production'
    __table_args__ = (
        PrimaryKeyConstraint('id_type_production', name='type_production_pkey'),
        {'schema': 'referentiel'}
    )

    id_type_production: Mapped[int] = mapped_column(Integer, primary_key=True)
    nature_production: Mapped[Optional[str]] = mapped_column(String(50))

    type_production_mode: Mapped[List['TypeProductionMode']] = relationship('TypeProductionMode', back_populates='type_production')
    type_production_societe: Mapped[List['TypeProductionSociete']] = relationship('TypeProductionSociete', back_populates='type_production')


class TypeProduitFini(Base):
    __tablename__ = 'type_produit_fini'
    __table_args__ = (
        PrimaryKeyConstraint('id_type_produit_fini', name='type_produit_fini_pkey'),
        {'schema': 'referentiel'}
    )

    id_type_produit_fini: Mapped[int] = mapped_column(Integer, primary_key=True)
    nature_produit_fini: Mapped[Optional[str]] = mapped_column(String(50))

    contrat: Mapped[List['Contrat']] = relationship('Contrat', secondary='saisie.produit_fini_contrat', back_populates='type_produit_fini')


class TypeTrancheEffectif(Base):
    __tablename__ = 'type_tranche_effectif'
    __table_args__ = (
        PrimaryKeyConstraint('code_type_tranche_effectif', name='type_tranche_effectif_pkey'),
        {'schema': 'referentiel'}
    )

    code_type_tranche_effectif: Mapped[str] = mapped_column(String(2), primary_key=True)
    lib_type_tranche_effectif: Mapped[Optional[str]] = mapped_column(String(150))


class Agriculteur(Base):
    __tablename__ = 'agriculteur'
    __table_args__ = (
        PrimaryKeyConstraint('id_agriculteur', name='agriculteur_pkey'),
        {'schema': 'saisie'}
    )

    id_agriculteur: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom_agri: Mapped[str] = mapped_column(String(100))
    prenom_agri: Mapped[str] = mapped_column(String(50))
    date_naissance: Mapped[Optional[datetime.date]] = mapped_column(Date)

    societe: Mapped[List['Societe']] = relationship('Societe', secondary='saisie.agriculteur_societe', back_populates='agriculteur')


class Referent(Base):
    __tablename__ = 'referent'
    __table_args__ = (
        PrimaryKeyConstraint('id_referent', name='referent_pkey'),
        {'schema': 'saisie'}
    )

    id_referent: Mapped[int] = mapped_column(Integer, primary_key=True)
    nom_referent: Mapped[Optional[str]] = mapped_column(String(100))
    prenom_referent: Mapped[Optional[str]] = mapped_column(String(50))

    contrat: Mapped[List['Contrat']] = relationship('Contrat', back_populates='referent')


class SiteCen(Base):
    __tablename__ = 'site_cen'
    __table_args__ = (
        PrimaryKeyConstraint('id_site', name='site_cen_pkey'),
        {'schema': 'saisie'}
    )

    id_site: Mapped[int] = mapped_column(Integer, primary_key=True)
    code_site: Mapped[str] = mapped_column(String(25))
    nom_site: Mapped[str] = mapped_column(String(100))


class Societe(Base):
    __tablename__ = 'societe'
    __table_args__ = (
        PrimaryKeyConstraint('id_societe', name='societe_pkey'),
        UniqueConstraint('siret', name='societe_siret_ukey'),
        {'schema': 'saisie'}
    )

    id_societe: Mapped[int] = mapped_column(Integer, primary_key=True)
    contact: Mapped[str] = mapped_column(String(100))
    nom_societe: Mapped[Optional[str]] = mapped_column(String(100))
    remarques: Mapped[Optional[str]] = mapped_column(String(300))
    siret: Mapped[Optional[str]] = mapped_column(String(14))
    categorie_juridique: Mapped[Optional[str]] = mapped_column(String(150))
    activite_principale: Mapped[Optional[str]] = mapped_column(String(150))
    tranche_effectif: Mapped[Optional[str]] = mapped_column(String(50))
    adresse_etablissement: Mapped[Optional[str]] = mapped_column(String(150))
    commune_etablissement: Mapped[Optional[str]] = mapped_column(String(150))
    nom_etablissement: Mapped[Optional[str]] = mapped_column(String(150))

    agriculteur: Mapped[List['Agriculteur']] = relationship('Agriculteur', secondary='saisie.agriculteur_societe', back_populates='societe')
    contrat: Mapped[List['Contrat']] = relationship('Contrat', back_populates='societe')
    type_production_societe: Mapped[List['TypeProductionSociete']] = relationship('TypeProductionSociete', back_populates='societe')


t_agriculteur_societe = Table(
    'agriculteur_societe', Base.metadata,
    Column('id_agriculteur', Integer, primary_key=True, nullable=False),
    Column('id_societe', Integer, primary_key=True, nullable=False),
    ForeignKeyConstraint(['id_agriculteur'], ['saisie.agriculteur.id_agriculteur'], name='agriculteur_societe_id_agriculteur_fkey'),
    ForeignKeyConstraint(['id_societe'], ['saisie.societe.id_societe'], name='agriculteur_societe_id_societe_fkey'),
    PrimaryKeyConstraint('id_agriculteur', 'id_societe', name='agriculteur_societe_pkey'),
    schema='saisie'
)


class Contrat(Base):
    __tablename__ = 'contrat'
    __table_args__ = (
        ForeignKeyConstraint(['id_referent'], ['saisie.referent.id_referent'], name='contrat_id_referent_fkey'),
        ForeignKeyConstraint(['id_societe'], ['saisie.societe.id_societe'], name='contrat_id_societe_fkey'),
        ForeignKeyConstraint(['id_type_contrat'], ['referentiel.type_contrat.id_type_contrat'], name='contrat_id_type_contrat_fkey'),
        PrimaryKeyConstraint('id_contrat', name='contrat_pkey'),
        {'schema': 'saisie'}
    )

    id_contrat: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_societe: Mapped[int] = mapped_column(Integer)
    surf_contractualisee: Mapped[Optional[float]] = mapped_column(Float)
    date_signature: Mapped[Optional[datetime.date]] = mapped_column(Date)
    date_fin: Mapped[Optional[datetime.date]] = mapped_column(Date)
    date_prise_effet: Mapped[Optional[datetime.date]] = mapped_column(Date)
    latitude: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(8, 5))
    longitude: Mapped[Optional[decimal.Decimal]] = mapped_column(Numeric(8, 5))
    date_ajout_bdd: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime)
    numero_contrat: Mapped[Optional[str]] = mapped_column(String(50))
    id_referent: Mapped[Optional[int]] = mapped_column(Integer)
    id_type_contrat: Mapped[Optional[int]] = mapped_column(Integer)
    remarques: Mapped[Optional[str]] = mapped_column(Text)

    referent: Mapped['Referent'] = relationship('Referent', back_populates='contrat')
    societe: Mapped['Societe'] = relationship('Societe', back_populates='contrat')
    type_contrat: Mapped['TypeContrat'] = relationship('TypeContrat', back_populates='contrat')
    type_produit_fini: Mapped[List['TypeProduitFini']] = relationship('TypeProduitFini', secondary='saisie.produit_fini_contrat', back_populates='contrat')
    type_milieu: Mapped[List['TypeMilieu']] = relationship('TypeMilieu', secondary='saisie.type_milieu_contrat', back_populates='contrat')
    contrat_site_cen: Mapped[List['ContratSiteCen']] = relationship('ContratSiteCen', back_populates='contrat')


class TypeProductionMode(Base):
    __tablename__ = 'type_production_mode'
    __table_args__ = (
        ForeignKeyConstraint(['id_mode_production'], ['referentiel.mode_production.id'], ondelete='CASCADE', name='fk_mode_production'),
        ForeignKeyConstraint(['id_type_production'], ['referentiel.type_production.id_type_production'], ondelete='CASCADE', name='fk_type_production'),
        PrimaryKeyConstraint('id', name='type_production_mode_pkey'),
        UniqueConstraint('id_type_production', 'id_mode_production', name='uq_type_mode'),
        {'schema': 'saisie'}
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_type_production: Mapped[int] = mapped_column(Integer)
    id_mode_production: Mapped[int] = mapped_column(Integer)

    mode_production: Mapped['ModeProduction'] = relationship('ModeProduction', back_populates='type_production_mode')
    type_production: Mapped['TypeProduction'] = relationship('TypeProduction', back_populates='type_production_mode')


class TypeProductionSociete(Base):
    __tablename__ = 'type_production_societe'
    __table_args__ = (
        ForeignKeyConstraint(['id_mode_production'], ['referentiel.mode_production.id'], name='type_production_societe_id_mode_production_fkey'),
        ForeignKeyConstraint(['id_societe'], ['saisie.societe.id_societe'], name='type_production_societe_id_societe_fkey'),
        ForeignKeyConstraint(['id_type_production'], ['referentiel.type_production.id_type_production'], name='type_production_societe_id_type_production_fkey'),
        PrimaryKeyConstraint('id_societe', 'id_type_production', name='type_production_societe_pkey'),
        {'schema': 'saisie'}
    )

    id_societe: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_type_production: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_mode_production: Mapped[Optional[int]] = mapped_column(Integer)

    mode_production: Mapped['ModeProduction'] = relationship('ModeProduction', back_populates='type_production_societe')
    societe: Mapped['Societe'] = relationship('Societe', back_populates='type_production_societe')
    type_production: Mapped['TypeProduction'] = relationship('TypeProduction', back_populates='type_production_societe')


class ContratSiteCen(Base):
    __tablename__ = 'contrat_site_cen'
    __table_args__ = (
        ForeignKeyConstraint(['id_contrat'], ['saisie.contrat.id_contrat'], name='contrat_site_cen_id_contrat_fkey'),
        PrimaryKeyConstraint('id_site', 'id_contrat', name='contrat_site_cen_pkey'),
        {'schema': 'saisie'}
    )

    id_site: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_contrat: Mapped[int] = mapped_column(Integer, primary_key=True)

    contrat: Mapped['Contrat'] = relationship('Contrat', back_populates='contrat_site_cen')


t_produit_fini_contrat = Table(
    'produit_fini_contrat', Base.metadata,
    Column('id_type_produit_fini', Integer, primary_key=True, nullable=False),
    Column('id_contrat', Integer, primary_key=True, nullable=False),
    ForeignKeyConstraint(['id_contrat'], ['saisie.contrat.id_contrat'], name='produit_fini_contrat_id_contrat_fkey'),
    ForeignKeyConstraint(['id_type_produit_fini'], ['referentiel.type_produit_fini.id_type_produit_fini'], name='produit_fini_contrat_id_type_produit_fini_fkey'),
    PrimaryKeyConstraint('id_type_produit_fini', 'id_contrat', name='produit_fini_contrat_pkey'),
    schema='saisie'
)


t_type_milieu_contrat = Table(
    'type_milieu_contrat', Base.metadata,
    Column('id_type_milieu', Integer, primary_key=True, nullable=False),
    Column('id_contrat', Integer, primary_key=True, nullable=False),
    ForeignKeyConstraint(['id_contrat'], ['saisie.contrat.id_contrat'], name='type_milieu_contrat_id_contrat_fkey'),
    ForeignKeyConstraint(['id_type_milieu'], ['referentiel.type_milieu.id_type_milieu'], name='type_milieu_contrat_id_type_milieu_fkey'),
    PrimaryKeyConstraint('id_type_milieu', 'id_contrat', name='type_milieu_contrat_pkey'),
    schema='saisie'
)
