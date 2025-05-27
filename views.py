from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, session
from forms import CombinedForm
from models import *
from config import Config
from datetime import datetime  
import json
import secrets
import logging
import requests
from shapely.geometry import mapping
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import load_only, selectinload
from flask_migrate import Migrate
from flask_login import login_required, current_user
import flask_session
from auth import init_auth

app = Flask(__name__)

app.config['WTF_CSRF_ENABLED'] = False
app.config['SECRET_KEY'] = secrets.token_hex(24)

# Configuration de base
app.config.from_object(Config)

# Initialisation de la session
app.config['SESSION_TYPE'] = Config.SESSION_TYPE
flask_session.Session(app)

# Initialisation de l'authentification
init_auth(app)

# Initialisation de la base de données
db.init_app(app)

# Exemple d'utilisation du logger d'application
# app_logger.info("L'application Flask a démarré.")

# print(Config.SQLALCHEMY_DATABASE_URI)

# print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Fonction pour charger les choix dynamiques

# Configuration de Flask-Migrate
migrate = Migrate(app, db)

def populate_form_choices(form):
    try:
        # Exécuter toutes les requêtes SQL en une seule transaction
        type_milieux = db.session.execute(
            TypeMilieu.query.options(load_only(TypeMilieu.id_type_milieu, TypeMilieu.milieu))
        ).scalars()

        contrats = db.session.execute(
            TypeContrat.query.options(load_only(TypeContrat.id_type_contrat, TypeContrat.appellation_contrat))
        ).scalars()

        produits_finis = db.session.execute(
            TypeProduitFini.query.options(load_only(TypeProduitFini.id_type_produit_fini, TypeProduitFini.nature_produit_fini))
        ).scalars()

                # Ajout du chargement des modes de production
        modes_production = db.session.execute(
            ModeProduction.query.options(load_only(ModeProduction.id, ModeProduction.nom))
        ).scalars()

        # Chargement des types de production
        productions = db.session.execute(
            TypeProduction.query.options(
                load_only(TypeProduction.id_type_production, TypeProduction.nature_production)
            )
        ).scalars()

        # Remplir les choix des champs du formulaire
        form.type_milieu.choices = [(milieu.id_type_milieu, milieu.milieu) for milieu in type_milieux]
        form.appellation_contrat.choices = [(contrat.id_type_contrat, contrat.appellation_contrat) for contrat in contrats]
        form.produit_fini.choices = [(prod.id_type_produit_fini, prod.nature_produit_fini) for prod in produits_finis]
        form.type_production.choices = [(prod.id_type_production, prod.nature_production) for prod in productions]
        form.mode_production.choices = [(mode.id, mode.nom) for mode in modes_production]

    except Exception as e:
        logging.error(f"Erreur lors du chargement des choix dynamiques : {e}")
        flash("Erreur lors du chargement des données du formulaire.", "danger")



@app.route('/sites_cen_geojson')
def get_all_sites_cen_geojson():
    """Récupère les données GeoJSON pour TOUS les sites CEN.
    Utilisé pour afficher tous les sites sur la carte principale."""
    sites = VueSites.query.all()
    features = []
    
    for site in sites:
        # Convertir la géométrie PostGIS en GeoJSON
        shape = to_shape(site.geom)
        geojson = mapping(shape)
        
        feature = {
            "type": "Feature",
            "geometry": geojson,
            "properties": {
                "idsite": site.idsite,
                "codesite": site.codesite,
                "nom_site": site.nom_site
            }
        }
        features.append(feature)
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return jsonify(geojson_data)



@app.route('/site_cen_geojson/<int:site_id>')
def get_single_site_cen_geojson(site_id):
    """
    Récupère les données GeoJSON pour un seul site CEN spécifié par son ID.
    Cela permet d'optimiser le chargement de la page edit_contract.html.
    """
    # Récupérer uniquement le site spécifié
    site = VueSites.query.filter_by(idsite=site_id).first()
    
    if not site:
        return jsonify({"type": "FeatureCollection", "features": []}), 404
    
    # Convertir la géométrie PostGIS en GeoJSON
    shape = to_shape(site.geom)
    geojson = mapping(shape)
    
    feature = {
        "type": "Feature",
        "geometry": geojson,
        "properties": {
            "codesite": site.codesite,
            "nom_site": site.nom_site
        }
    }
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": [feature]
    }
    
    return jsonify(geojson_data)



def fetch_siret_data(siret, flash_messages = False):
    """
    Récupère les informations d'une entreprise via l'API SIRENE en fonction du numéro SIRET.
    """
    if not siret or len(siret) != 14 or not siret.isdigit():
        if flash_messages:
            flash("Le numéro SIRET est invalide. Assurez-vous qu'il contient exactement 14 chiffres.", "danger")
        return {"error": "Le numéro SIRET est invalide."}, 400

    url = f"https://api.insee.fr/api-sirene/3.11/siret/{siret}"
    headers = {
        "accept": "application/json",
        "X-INSEE-Api-Key-Integration": "3f98f3ce-54c4-42eb-98f3-ce54c4f2eb52",
    }

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            etablissement = data.get("etablissement")

            if etablissement:
                adresse = etablissement.get("adresseEtablissement", {})
                result = {
                    "siren": etablissement.get("siren", "Non renseigné"),
                    "denomination": etablissement.get("uniteLegale", {}).get("denominationUniteLegale", "Non renseigné"),
                    "activite_principale": etablissement.get("uniteLegale", {}).get("activitePrincipaleUniteLegale", "Non renseigné"),
                    "categorie_juridique": etablissement.get("uniteLegale", {}).get("categorieJuridiqueUniteLegale", "Non renseigné"),
                    "tranche_effectif": etablissement.get("trancheEffectifsEtablissement", "Non renseigné"),
                    "adresse_etablissement": ", ".join(filter(
                        None, [
                            adresse.get('numeroVoieEtablissement', ''),
                            adresse.get('typeVoieEtablissement', ''),
                            adresse.get('libelleVoieEtablissement', ''),
                            adresse.get('codePostalEtablissement', ''),
                            adresse.get('libelleCommuneEtablissement', '')
                        ]))
                }
                if flash_messages:
                    flash("Les données ont été récupérées avec succès depuis l'API SIRENE !", "success")
                return result, 200
        
            if flash_messages:
                flash("Aucun établissement trouvé pour ce SIRET.", "danger")
            return {"error": "Aucun établissement trouvé."}, 404

        if flash_messages:
            flash(f"Erreur API : {response.status_code}, {response.text}", "danger")
        return {"error": f"Erreur API : {response.status_code}, {response.text}"}, response.status_code

    except Exception as e:
        if flash_messages:
            flash(f"Erreur de communication avec l'API SIRENE : {str(e)}", "danger")
        return {"error": f"Erreur serveur : {str(e)}"}, 500
    
    
def check_siret_in_database(siret):
    """
    Vérifie si un SIRET existe déjà dans la base de données et retourne les données associées.
    """
    if not siret or len(siret) != 14 or not siret.isdigit():
        return None
    
    try:
        # Recherche de la société par SIRET
        societe = Societe.query.filter_by(siret=siret).first()
        
        if societe:
            # Récupération des données de la société
            societe_data = {
                "id_societe": societe.id_societe,
                "nom_societe": societe.nom_societe,
                "contact": societe.contact,
                "siret": societe.siret,
                "categorie_juridique": societe.categorie_juridique,
                "activite_principale": societe.activite_principale,
                "tranche_effectif": societe.tranche_effectif,
                "adresse_etablissement": societe.adresse_etablissement,
                "commune_etablissement": societe.commune_etablissement,
                "nom_etablissement": societe.nom_etablissement,
                "exists_in_db": True
            }
            
            # Récupération des agriculteurs associés
            agriculteurs = []
            for rel in societe.agriculteurs_intermediaires:
                agriculteur = rel.agriculteur
                agriculteurs.append({
                    "id_agriculteur": agriculteur.id_agriculteur,
                    "nom_agri": agriculteur.nom_agri,
                    "prenom_agri": agriculteur.prenom_agri,
                    "date_naissance": agriculteur.date_naissance.strftime('%Y-%m-%d') if agriculteur.date_naissance else None
                })
            
            # Récupération des types de production associés
            productions = []
            for rel in societe.types_production_societe:
                productions.append({
                    "id_type_production": rel.id_type_production,
                    "id_mode_production": rel.id_mode_production
                })
            
            # Récupération des contrats associés
            contrats = []
            for contrat in societe.contrats:
                contrat_data = {
                    "id_contrat": contrat.id_contrat,
                    "surf_contractualisee": float(contrat.surf_contractualisee) if contrat.surf_contractualisee else None,
                    "date_signature": contrat.date_signature.strftime('%Y-%m-%d'),
                    "date_fin": contrat.date_fin.strftime('%Y-%m-%d'),
                    "date_prise_effet": contrat.date_prise_effet.strftime('%Y-%m-%d'),
                    "latitude": float(contrat.latitude) if contrat.latitude else None,
                    "longitude": float(contrat.longitude) if contrat.longitude else None,
                    "numero_contrat": contrat.numero_contrat,
                    "remarques": contrat.remarques,
                    "id_type_contrat": contrat.id_type_contrat,
                    "id_referent": contrat.id_referent,
                    "referent": {
                        "nom_referent": contrat.referent.nom_referent,
                        "prenom_referent": contrat.referent.prenom_referent
                    }
                }
                
                # Récupération des types de milieu associés au contrat
                milieux = []
                for rel in contrat.types_milieu:
                    milieux.append(rel.id_type_milieu)
                contrat_data["types_milieu"] = milieux
                
                # Récupération des produits finis associés au contrat
                produits = []
                for rel in contrat.produits_finis:
                    produits.append(rel.id_type_produit_fini)
                contrat_data["produits_finis"] = produits
                
                # Récupération des sites CEN associés au contrat
                sites = []
                for rel in contrat.sites_cen:
                    # Accès direct aux attributs de ContratSiteCEN
                    sites.append({
                        "id_site": rel.id_site,
                        "code_site": rel.code_site,
                        "nom_site": rel.nom_site
                    })
                contrat_data["sites_cen"] = sites
                
                contrats.append(contrat_data)
            
            societe_data["agriculteurs"] = agriculteurs
            societe_data["productions"] = productions
            societe_data["contrats"] = contrats
            
            return societe_data
        
        return None
    
    except Exception as e:
        print(f"Erreur lors de la recherche du SIRET dans la base de données : {str(e)}")
        return None

@app.route('/api/siret', methods=['POST'])
@login_required
def siret_lookup():
    siret = request.json.get("siret")
    
    # Vérifier d'abord si le SIRET existe dans la base de données
    db_result = check_siret_in_database(siret)
    if db_result:
        return jsonify(db_result), 200
    
    # Si le SIRET n'existe pas dans la base de données, interroger l'API SIRENE
    api_result, status_code = fetch_siret_data(siret, flash_messages=False)
    
    # Ajouter un indicateur pour signaler que les données proviennent de l'API
    if status_code == 200:
        api_result["exists_in_db"] = False
    
    return jsonify(api_result), status_code
    



@app.route('/', methods=['GET', 'POST'])
@login_required
def map_page():
    print("Route map_page appelée")  # Vérifie que la route est exécutée
    form = CombinedForm()

    # Charger les choix dynamiques
    populate_form_choices(form)

    # Charger le GeoJSON pour la carte
    try:
        with open('static/sig/depts_na.geojson') as geojson_file:
            geojson = json.load(geojson_file)
    except FileNotFoundError:
        flash("Erreur : Fichier GeoJSON introuvable.", "danger")
        geojson = {}


    # 🔹 Si l'utilisateur clique sur "Rechercher via l'API"
    if form.fetch_sirene.data:
        siret_data, status_code = fetch_siret_data(form.siret.data, flash_messages=True)
        if status_code == 200:
            form.adresse_etablissement.data = siret_data["adresse_etablissement"]
            form.tranche_effectif.data = siret_data["tranche_effectif"]
            form.categorie_juridique.data = siret_data["categorie_juridique"]
            form.activite_principale.data = siret_data["activite_principale"]
            form.nom_societe.data = siret_data["denomination"]
        return render_template('map.html', form=form, geojson=geojson)

    if form.submit.data and form.validate_on_submit():  # Si "Enregistrer les données" est cliqué
        try:
            # Debug prints
            print("Form Data:", request.form)
            print("Type Production Data:", request.form.getlist('type_production'))
            print("Type Production Field:", form.type_production.data)
            print("Type Production Errors:", form.type_production.errors)
            # Logique pour enregistrer les données

            # Vérifier si la société existe déjà (par SIRET ou nom)
            societe = None
            if form.siret.data:
                societe = Societe.query.filter_by(siret=form.siret.data).first()
            if not societe:
                societe = Societe.query.filter_by(nom_societe=form.nom_societe.data).first()

            # Si la société n'existe pas, la créer
            if not societe:
                societe = Societe(
                    nom_societe=form.nom_societe.data,
                    contact=form.contact.data,
                    siret=form.siret.data, 
                    adresse_etablissement=form.adresse_etablissement.data,  
                    tranche_effectif=form.tranche_effectif.data, 
                    categorie_juridique=form.categorie_juridique.data,
                    activite_principale=form.activite_principale.data
                )

                db.session.add(societe)
                db.session.commit()

            # Ajouter un agriculteur
            agriculteur = Agriculteur(
                nom_agri=form.nom_agri.data,
                prenom_agri=form.prenom_agri.data,
                date_naissance=form.date_naissance.data,
            )
            db.session.add(agriculteur)
            db.session.commit()

            # Ajouter une association dans AgriculteurSociete
            agriculteur_societe = AgriculteurSociete(
                id_agriculteur=agriculteur.id_agriculteur,
                id_societe=societe.id_societe
            )
            db.session.add(agriculteur_societe)
            db.session.commit()

            # Vérifier si le référent existe déjà
            referent = Referent.query.filter_by(
                nom_referent=form.nom_referent.data,
                prenom_referent=form.prenom_referent.data
            ).first()
            if not referent:
                referent = Referent(
                    nom_referent=form.nom_referent.data,
                    prenom_referent=form.prenom_referent.data
                )
                db.session.add(referent)
                db.session.commit()

            # Nous n'avons plus besoin de créer un SiteCEN séparé car les informations sont maintenant directement dans ContratSiteCEN

            # Ajouter un contrat
            contrat = Contrat(
                surf_contractualisee=form.surf_contractualisee.data,
                date_signature=form.date_signature.data,
                date_fin=form.date_fin.data,
                date_prise_effet=form.date_prise_effet.data,
                latitude=form.latitude.data,
                longitude=form.longitude.data,
                remarques=form.remarques.data,
                id_societe=societe.id_societe,
                id_referent=referent.id_referent,
                id_type_contrat=form.appellation_contrat.data
            )
            db.session.add(contrat)
            db.session.commit()


            # Rechercher le site correspondant dans VueSites par son code
            vue_site = VueSites.query.filter_by(codesite=form.code_site.data).first()
            
            # Si le site existe dans VueSites, utiliser son idsite
            # Sinon, générer un nouvel ID
            site_id = vue_site.idsite if vue_site else db.session.query(db.func.nextval('saisie.site_cen_id_site_seq')).scalar()
            
            # Créer directement une entrée ContratSiteCEN avec les informations du site
            contrat_site_cen = ContratSiteCEN(
                id_site=site_id,
                id_contrat=contrat.id_contrat,
                code_site=form.code_site.data,
                nom_site=form.nom_site.data
            )
            db.session.add(contrat_site_cen)
            db.session.commit()

            # Associer des types de milieu, productions, et produits finis
            for milieu_id in request.form.getlist('type_milieu'):
                type_milieu_contrat = TypeMilieuContrat(
                    id_type_milieu=int(milieu_id),
                    id_contrat=contrat.id_contrat
                )
                db.session.add(type_milieu_contrat)
                db.session.commit()

            # Récupérer les types de production bio et conventionnelle
            type_production_bio = request.form.getlist('type_production_bio[]')
            type_production_conv = request.form.getlist('type_production_conv[]')
            
            print("Types de production bio:", type_production_bio)
            print("Types de production conventionnelle:", type_production_conv)
            
            # Définir les IDs des modes de production
            mode_production_bio_id = 1  # ID pour le mode Bio
            mode_production_conv_id = 2  # ID pour le mode Conventionnelle

            # Traiter les types de production bio
            for production_id in type_production_bio:
                if production_id:  # Vérifier que l'ID n'est pas vide
                    # Créer directement l'association TypeProductionSociete
                    type_production_societe = TypeProductionSociete(
                        id_societe=societe.id_societe,
                        id_type_production=int(production_id),
                        id_mode_production=mode_production_bio_id
                    )
                    db.session.add(type_production_societe)
            
            # Traiter les types de production conventionnelle
            for production_id in type_production_conv:
                if production_id:  # Vérifier que l'ID n'est pas vide
                    # Créer directement l'association TypeProductionSociete
                    type_production_societe = TypeProductionSociete(
                        id_societe=societe.id_societe,
                        id_type_production=int(production_id),
                        id_mode_production=mode_production_conv_id
                    )
                    db.session.add(type_production_societe)

            for produit_fini_id in request.form.getlist('produit_fini'):
                produit_fini_contrat = ProduitFiniContrat(
                    id_type_produit_fini=int(produit_fini_id),
                    id_contrat=contrat.id_contrat
                )
                db.session.add(produit_fini_contrat)

            db.session.commit()
            flash('Les données ont été ajoutées avec succès !', 'success')
            return redirect('/')

        except Exception as e:
            db.session.rollback()
            flash(f"Erreur : {str(e)}", 'danger')
    else:
        # Afficher les erreurs spécifiques
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"Erreur dans {getattr(form, field).label.text} : {error}", "danger")


    # Préparer les données pour la visualisation avec yield_per()
    contrats_query = (
        db.session.query(Contrat)
        .options(
            selectinload(Contrat.societe).selectinload(Societe.activite_principale_obj),
            selectinload(Contrat.societe).selectinload(Societe.categorie_juridique_obj),
            selectinload(Contrat.societe).selectinload(Societe.tranche_effectif_obj),
            selectinload(Contrat.societe).selectinload(Societe.types_production_societe).selectinload(TypeProductionSociete.type_production),
            selectinload(Contrat.societe).selectinload(Societe.types_production_societe).selectinload(TypeProductionSociete.mode_production),
            selectinload(Contrat.types_milieu).selectinload(TypeMilieuContrat.type_milieu),
            selectinload(Contrat.produits_finis).selectinload(ProduitFiniContrat.produit_fini),
            selectinload(Contrat.sites_cen),
            selectinload(Contrat.referent)
        )
    )

    contrat_data = []

    # Charger les contrats par lots de 50
    for contrat in contrats_query.yield_per(50):

        # Types de milieu
        type_milieux = [milieu.type_milieu.milieu for milieu in contrat.types_milieu] if contrat.types_milieu else []

        # Traitement des types de production avec leurs modes
        type_productions = []
        if contrat.societe and contrat.societe.types_production_societe:
            for tps in contrat.societe.types_production_societe:
                type_productions.append({
                    'type': tps.type_production.nature_production,
                    'mode_production': tps.mode_production.nom if tps.mode_production else None
                })

        # Récupérer le premier mode de production (s'il existe)
        mode_production = type_productions[0]['mode_production'] if type_productions else "Non spécifié"
                
        # Produits finis
        produits_finis = [
            produit.produit_fini.nature_produit_fini if produit.produit_fini else "Non spécifié"
            for produit in contrat.produits_finis
        ]


        contrat_data.append({
            "id": contrat.id_contrat,
            "latitude": float(contrat.latitude) if contrat.latitude else None,
            "longitude": float(contrat.longitude) if contrat.longitude else None,
            "nom_site": contrat.sites_cen[0].nom_site if contrat.sites_cen and len(contrat.sites_cen) > 0 else "Non spécifié",
            "code_site": contrat.sites_cen[0].code_site if contrat.sites_cen and len(contrat.sites_cen) > 0 else "Non spécifié",
            "nom_societe": contrat.societe.nom_societe if contrat.societe else "Non spécifié",
            "agriculteur": f"{contrat.societe.agriculteurs_intermediaires[0].agriculteur.prenom_agri} {contrat.societe.agriculteurs_intermediaires[0].agriculteur.nom_agri}" if contrat.societe and contrat.societe.agriculteurs_intermediaires else "Non spécifié",
            "contact": contrat.societe.contact if contrat.societe else "Non spécifié",
            "siret": contrat.societe.siret,
            "adresse_etablissement": contrat.societe.adresse_etablissement,
            "tranche_effectif": contrat.societe.tranche_effectif_obj.lib_type_tranche_effectif if contrat.societe and contrat.societe.tranche_effectif_obj else "Non spécifié",
            "categorie_juridique": contrat.societe.categorie_juridique_obj.lib_type_categorie_juridique if contrat.societe and contrat.societe.categorie_juridique_obj else "Non spécifié",
            "activite_principale": contrat.societe.activite_principale_obj.lib_type_activite_principale if contrat.societe and contrat.societe.activite_principale_obj else "Non spécifié",
            "date_naissance": contrat.societe.agriculteurs_intermediaires[0].agriculteur.date_naissance if contrat.societe and contrat.societe.agriculteurs_intermediaires else "Non spécifié",
            "mode_production": mode_production,
            "type_productions": type_productions,
            "produits_finis": produits_finis,
            "type_contrat": contrat.type_contrat.appellation_contrat if contrat.type_contrat else "Non spécifié",
            "date_signature": contrat.date_signature.strftime("%Y-%m-%d") if contrat.date_signature else "Non spécifié",
            "date_prise_effet": contrat.date_prise_effet.strftime("%Y-%m-%d") if contrat.date_prise_effet else "Non spécifié",
            "date_fin": contrat.date_fin.strftime("%Y-%m-%d") if contrat.date_fin else "Non spécifié",
            "date_ajout_bdd": contrat.date_ajout_bdd.strftime("%Y-%m-%d %H:%M:%S") if contrat.date_ajout_bdd else "Non spécifié",
            "referent": f"{contrat.referent.prenom_referent} {contrat.referent.nom_referent}" if contrat.referent else "Non spécifié",
            "surface_contractualisee": contrat.surf_contractualisee if contrat.surf_contractualisee else 'Non spécifié',
            "type_milieux": type_milieux,
        })

    # Envoyer les données au template après la boucle
    return render_template('map.html', form=form, geojson=geojson, contrats=contrat_data)

    
@app.route('/edit_contract/<int:contract_id>', methods=['GET', 'POST'])
def edit_contract(contract_id):

    # Charger uniquement le GeoJSON du site associé au contrat (optimisation)
    site_id = None
    # Vérifier si le contrat a un site CEN associé
    contrat = Contrat.query.options(selectinload(Contrat.sites_cen)).filter(Contrat.id_contrat == contract_id).first()
    
    if contrat and contrat.sites_cen and len(contrat.sites_cen) > 0:
        # Récupérer le code du site pour faire la correspondance
        code_site = contrat.sites_cen[0].code_site
        
        # Rechercher le site correspondant dans VueSites par son code
        vue_site = VueSites.query.filter_by(codesite=code_site).first()
        
        if vue_site:
            # Utiliser l'idsite de VueSites
            site_id = vue_site.idsite
            # Charger uniquement le site spécifique
            sites_geojson = get_single_site_cen_geojson(site_id).json
        else:
            # Si le site n'est pas trouvé dans VueSites, renvoyer un GeoJSON vide
            sites_geojson = {"type": "FeatureCollection", "features": []}
    else:
        # Si pas de site associé, renvoyer un GeoJSON vide
        sites_geojson = {"type": "FeatureCollection", "features": []}

    # Charger un formulaire unique contenant tous les champs
    form = CombinedForm()
    populate_form_choices(form)

    # Charger le contrat avec toutes ses relations en une seule requête
    contrat = (
        db.session.query(Contrat)
        .options(
            selectinload(Contrat.societe).selectinload(Societe.activite_principale_obj),
            selectinload(Contrat.societe).selectinload(Societe.categorie_juridique_obj),
            selectinload(Contrat.societe).selectinload(Societe.tranche_effectif_obj),
            selectinload(Contrat.societe).selectinload(Societe.types_production_societe).selectinload(TypeProductionSociete.type_production),
            selectinload(Contrat.societe).selectinload(Societe.types_production_societe).selectinload(TypeProductionSociete.mode_production),
            selectinload(Contrat.types_milieu).selectinload(TypeMilieuContrat.type_milieu),
            selectinload(Contrat.produits_finis).selectinload(ProduitFiniContrat.produit_fini),
            selectinload(Contrat.sites_cen),
            selectinload(Contrat.referent)
        )
        .filter(Contrat.id_contrat == contract_id)
        .first()
    )
    
    # Vérification si le contrat existe
    if not contrat:
        flash("Contrat introuvable.", "danger")
        return redirect(url_for('map_page'))


    # 🟢 Pré-remplissage du formulaire en mode GET
    if request.method == 'GET':
        # Vérifier que sites_cen existe et qu'il contient au moins un élément
        if contrat.sites_cen and len(contrat.sites_cen) > 0:
            form.nom_site.data = contrat.sites_cen[0].nom_site
            form.code_site.data = contrat.sites_cen[0].code_site
        else:
            form.nom_site.data = ""
            form.code_site.data = ""

        # Société
        if contrat.societe:
            form.siret.data = contrat.societe.siret
            form.nom_societe.data = contrat.societe.nom_societe
            form.activite_principale.data = contrat.societe.activite_principale
            form.categorie_juridique.data = contrat.societe.categorie_juridique
            form.tranche_effectif.data = contrat.societe.tranche_effectif
            form.adresse_etablissement.data = contrat.societe.adresse_etablissement
            form.contact.data = contrat.societe.contact

        # Contrat
        form.surf_contractualisee.data = contrat.surf_contractualisee
        form.date_signature.data = contrat.date_signature
        form.date_prise_effet.data = contrat.date_prise_effet
        form.date_fin.data = contrat.date_fin
        form.appellation_contrat.data = contrat.id_type_contrat

        # Référent
        if contrat.referent:
            form.nom_referent.data = contrat.referent.nom_referent
            form.prenom_referent.data = contrat.referent.prenom_referent

        # Agriculteur
        if contrat.societe and contrat.societe.agriculteurs_intermediaires:
            form.nom_agri.data = contrat.societe.agriculteurs_intermediaires[0].agriculteur.nom_agri
            form.prenom_agri.data = contrat.societe.agriculteurs_intermediaires[0].agriculteur.prenom_agri
            form.date_naissance.data = contrat.societe.agriculteurs_intermediaires[0].agriculteur.date_naissance

        # Sélection multiple
        form.type_milieu.data = [milieu.type_milieu.id_type_milieu for milieu in contrat.types_milieu]
        form.produit_fini.data = [produit.produit_fini.id_type_produit_fini for produit in contrat.produits_finis]
        
        # Récupérer tous les types de production
        form.type_production.data = [prod.type_production.id_type_production for prod in contrat.societe.types_production_societe]
        
        # Séparer les types de production par mode (bio et conventionnel)
        type_production_bio = []
        type_production_conv = []
        
        # ID des modes de production
        mode_production_bio_id = 1  # ID pour le mode Bio
        mode_production_conv_id = 2  # ID pour le mode Conventionnelle
        
        # Parcourir les types de production associés à la société
        if contrat.societe and contrat.societe.types_production_societe:
            for tps in contrat.societe.types_production_societe:
                if tps.id_mode_production == mode_production_bio_id:
                    type_production_bio.append(tps.id_type_production)
                elif tps.id_mode_production == mode_production_conv_id:
                    type_production_conv.append(tps.id_type_production)
        
        # Ajouter ces listes au contexte pour le template
        form.type_production_bio = type_production_bio
        form.type_production_conv = type_production_conv
        
        # Mode de production par défaut
        if contrat.societe.types_production_societe:
            form.mode_production.data = contrat.societe.types_production_societe[0].id_mode_production

        # Récupérer les productions existantes
        existing_productions = {}
        for prod in contrat.societe.types_production_societe:
            mode_id = prod.id_mode_production
            if mode_id not in existing_productions:
                existing_productions[mode_id] = []
            existing_productions[mode_id].append(prod.id_type_production)
        
        # Convertir en format JSON pour le template
        initial_productions = [
            {
                'type_production': type_prods,
                'mode_production': str(mode_id)
            }
            for mode_id, type_prods in existing_productions.items()
        ]
        
        return render_template('edit_contract.html', 
                            contrat=contrat, 
                            form=form, 
                            initial_productions=json.dumps(initial_productions),
                            geojson=sites_geojson)

    # 🟢 Traitement du formulaire soumis
    elif request.method == 'POST':
        try:
            # Mise à jour des informations générales
            if contrat.sites_cen and len(contrat.sites_cen) > 0:
                contrat.sites_cen[0].nom_site = form.nom_site.data
                contrat.sites_cen[0].code_site = form.code_site.data

            # Mise à jour de la société
            if contrat.societe:
                contrat.societe.nom_societe = form.nom_societe.data
                contrat.societe.contact = form.contact.data
                contrat.societe.siret = form.siret.data
                contrat.societe.activite_principale = form.activite_principale.data
                contrat.societe.categorie_juridique = form.categorie_juridique.data
                contrat.societe.tranche_effectif = form.tranche_effectif.data
                contrat.societe.adresse_etablissement = form.adresse_etablissement.data

            # Mise à jour de l'agriculteur
            if contrat.societe and contrat.societe.agriculteurs_intermediaires:
                agriculteur = contrat.societe.agriculteurs_intermediaires[0].agriculteur
                agriculteur.nom_agri = form.nom_agri.data
                agriculteur.prenom_agri = form.prenom_agri.data
                agriculteur.date_naissance = form.date_naissance.data

            # Mise à jour du contrat
            contrat.surf_contractualisee = form.surf_contractualisee.data
            contrat.date_signature = form.date_signature.data
            contrat.date_prise_effet = form.date_prise_effet.data
            contrat.date_fin = form.date_fin.data
            contrat.id_type_contrat = form.appellation_contrat.data

            # Mise à jour du référent
            if contrat.referent:
                contrat.referent.nom_referent = form.nom_referent.data
                contrat.referent.prenom_referent = form.prenom_referent.data

            # Mise à jour des relations
            contrat.types_milieu = [TypeMilieuContrat(id_type_milieu=mid, id_contrat=contrat.id_contrat) for mid in form.type_milieu.data]
            contrat.produits_finis = [ProduitFiniContrat(id_type_produit_fini=pid, id_contrat=contrat.id_contrat) for pid in form.produit_fini.data]
            
            # Récupérer les données de production du formulaire
            try:
                all_productions = json.loads(request.form.get('all_productions', '[]'))
                
                # Vérifier que nous avons des données valides
                if not all_productions:
                    flash("Veuillez ajouter au moins un type de production avec son mode.", "danger")
                    return render_template('edit_contract.html', contrat=contrat, form=form, geojson=sites_geojson)
                
                # Vérifier que chaque entrée a un mode de production
                for prod in all_productions:
                    if not prod.get('mode_production'):
                        flash("Veuillez sélectionner un mode de production pour chaque type de production.", "danger")
                        return render_template('edit_contract.html', contrat=contrat, form=form, geojson=sites_geojson)
                
                # Créer une nouvelle liste de TypeProductionSociete
                new_types_production = []
                for prod in all_productions:
                    type_productions = prod.get('type_production', [])
                    mode_production = prod.get('mode_production')
                    
                    if type_productions and mode_production:
                        for type_prod in type_productions:
                            new_types_production.append(
                                TypeProductionSociete(
                                    id_type_production=int(type_prod),
                                    id_societe=contrat.societe.id_societe,
                                    id_mode_production=int(mode_production)
                                )
                            )
                
                # Remplacer la liste existante par la nouvelle liste
                contrat.societe.types_production_societe = new_types_production
                
            except json.JSONDecodeError:
                flash("Erreur lors de la lecture des données de production.", "danger")
                return render_template('edit_contract.html', contrat=contrat, form=form, geojson=sites_geojson)

            db.session.commit()
            flash("Les modifications ont été enregistrées avec succès.", "success")
            return redirect(url_for('map_page'))

        except Exception as e:
            db.session.rollback()
            flash(f"Erreur lors de la mise à jour : {str(e)}", "danger")

    # Récupérer les données GeoJSON pour la carte
    sites_geojson = get_geojson_data()
    
    return render_template('edit_contract.html', contrat=contrat, form=form, geojson=sites_geojson)


@app.route('/delete_contract/<int:contract_id>', methods=['POST'])
def delete_contract(contract_id):
    try:
        # Récupérer le contrat principal
        contrat = Contrat.query.get(contract_id)
        if not contrat:
            flash("Contrat introuvable.", "danger")
            return redirect(url_for('map_page'))

        # Récupérer les IDs associés
        societe_id = contrat.id_societe
        referent_id = contrat.id_referent

        # Supprimer les associations avec les sites CEN
        # Comme les informations des sites sont maintenant directement dans ContratSiteCEN,
        # il suffit de supprimer les enregistrements associés au contrat
        ContratSiteCEN.query.filter_by(id_contrat=contract_id).delete()

        # Supprimer les associations avec les types de milieu
        db.session.query(TypeMilieuContrat).filter_by(id_contrat=contract_id).delete()

        # Supprimer les associations avec les produits finis
        db.session.query(ProduitFiniContrat).filter_by(id_contrat=contract_id).delete()

        # Supprimer les associations dans TypeProductionSociete (types de production)
        db.session.query(TypeProductionSociete).filter_by(id_societe=societe_id).delete()


        # Supprimer le contrat principal
        db.session.delete(contrat)
        db.session.commit()

        # Supprimer les associations dans AgriculteurSociete
        db.session.query(AgriculteurSociete).filter_by(id_societe=societe_id).delete()

        # Supprimer les agriculteurs orphelins
        agriculteurs = db.session.query(Agriculteur).all()
        for agriculteur in agriculteurs:
            # Vérifier si l'agriculteur est lié à d'autres sociétés
            if not db.session.query(AgriculteurSociete).filter_by(id_agriculteur=agriculteur.id_agriculteur).first():
                db.session.delete(agriculteur)


        # Supprimer la société si elle est orpheline
        if not Contrat.query.filter_by(id_societe=societe_id).first():
            societe = Societe.query.get(societe_id)
            if societe:
                db.session.delete(societe)

        # Supprimer le référent si orphelin
        if not Contrat.query.filter_by(id_referent=referent_id).first():
            referent = Referent.query.get(referent_id)
            if referent:
                db.session.delete(referent)

        db.session.commit()

        flash("Contrat et toutes les données associées ont été supprimés avec succès.", "success")
        return redirect(url_for('map_page'))

    except Exception as e:
        db.session.rollback()
        flash(f"Erreur lors de la suppression du contrat : {str(e)}", "danger")
        return redirect(url_for('map_page'))


@app.route('/dataviz_page')
def dataviz_page():
    return redirect('https://superset.wanderzen.fr/superset/dashboard/ac7ee9d3-0b70-4b5a-ab12-85fa8902ad95/?native_filters_key=1E8OrhaQWKwHkNOL-XNkq3P7SqIrJ31O-dCGuceUos3gXMTbszYVrUmzjDrIZVcE')  


@app.route('/api/search_agriculteur', methods=['POST'])
def search_agriculteur():
    search_term = request.json.get("search_term", "").strip().lower()
    if not search_term:
        return jsonify([]), 200

    # Rechercher les agriculteurs dont le nom ou le prénom contient le terme de recherche
    agriculteurs = Agriculteur.query.filter(
        db.or_(
            db.func.lower(Agriculteur.nom_agri).contains(search_term),
            db.func.lower(Agriculteur.prenom_agri).contains(search_term)
        )
    ).all()

    # Formater les résultats
    results = [{
        'id': agri.id_agriculteur,
        'nom': agri.nom_agri,
        'prenom': agri.prenom_agri,
        'display': f"{agri.nom_agri} {agri.prenom_agri}"
    } for agri in agriculteurs]

    return jsonify(results), 200


@app.route('/api/search_referent', methods=['POST'])
def search_referent():
    search_term = request.json.get("search_term", "").strip().lower()
    if not search_term:
        return jsonify([]), 200

    # Rechercher les référents dont le nom ou le prénom contient le terme de recherche
    referents = Referent.query.filter(
        db.or_(
            db.func.lower(Referent.nom_referent).contains(search_term),
            db.func.lower(Referent.prenom_referent).contains(search_term),
            db.func.lower(db.func.concat(Referent.nom_referent, ' ', Referent.prenom_referent)).contains(search_term)
        )
    ).all()

    # Formater les résultats
    results = [
        {
            'nom': referent.nom_referent,
            'prenom': referent.prenom_referent,
            'display': f"{referent.nom_referent} {referent.prenom_referent}"
        }
        for referent in referents
    ]

    return jsonify(results), 200



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)