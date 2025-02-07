from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
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
# from sqlalchemy import text

app = Flask(__name__)

app.config['WTF_CSRF_ENABLED'] = False
app.config['SECRET_KEY'] = secrets.token_hex(24)

# Configuration de base
app.config.from_object(Config)

# # Création d'un logger pour l'application
# app_logger = logging.getLogger('app_logger')
# app_logger.setLevel(logging.DEBUG)  # Niveau de log pour l'application

# # Handler pour les logs d'application
# app_log_handler = logging.FileHandler('app_logs.log', mode='a')  # Ajout au fichier
# app_log_handler.setLevel(logging.DEBUG)  # Niveau de log pour ce handler
# app_log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
# app_log_handler.setFormatter(app_log_formatter)
# app_logger.addHandler(app_log_handler)

# # Création d'un logger pour SQLAlchemy
# sqlalchemy_logger = logging.getLogger('sqlalchemy.engine')  # Logger intégré à SQLAlchemy
# sqlalchemy_logger.setLevel(logging.DEBUG)  # Niveau de log pour SQLAlchemy

# # Handler pour les logs SQLAlchemy
# sqlalchemy_log_handler = logging.FileHandler('sqlalchemy_logs.log', mode='a')  # Ajout au fichier
# sqlalchemy_log_handler.setLevel(logging.DEBUG)
# sqlalchemy_log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
# sqlalchemy_log_handler.setFormatter(sqlalchemy_log_formatter)
# sqlalchemy_logger.addHandler(sqlalchemy_log_handler)

# Initialisation de la base de données
db.init_app(app)

# Exemple d'utilisation du logger d'application
# app_logger.info("L'application Flask a démarré.")

# print(Config.SQLALCHEMY_DATABASE_URI)

# print(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

# Fonction pour charger les choix dynamiques

def populate_form_choices(form):
    try:
        # Exécuter toutes les requêtes SQL en une seule transaction
        type_milieux = db.session.execute(
            TypeMilieu.query.options(load_only(TypeMilieu.id_type_milieu, TypeMilieu.milieu))
        ).scalars()

        contrats = db.session.execute(
            TypeContrat.query.options(load_only(TypeContrat.id_type_contrat, TypeContrat.appellation_contrat))
        ).scalars()

        productions = db.session.execute(
            TypeProduction.query.options(load_only(TypeProduction.id_type_production, TypeProduction.nature_production))
        ).scalars()

        produits_finis = db.session.execute(
            TypeProduitFini.query.options(load_only(TypeProduitFini.id_type_produit_fini, TypeProduitFini.nature_produit_fini))
        ).scalars()

        # Remplir les choix des champs du formulaire
        form.type_milieu.choices = [(milieu.id_type_milieu, milieu.milieu) for milieu in type_milieux]
        form.appellation_contrat.choices = [(contrat.id_type_contrat, contrat.appellation_contrat) for contrat in contrats]
        form.type_production.choices = [(prod.id_type_production, prod.nature_production) for prod in productions]
        form.produit_fini.choices = [(prod.id_type_produit_fini, prod.nature_produit_fini) for prod in produits_finis]

    except Exception as e:
        logging.error(f"Erreur lors du chargement des choix dynamiques : {e}")
        flash("Erreur lors du chargement des données du formulaire.", "danger")

@app.route('/sites_cen_geojson')
def get_sites_cen_geojson():
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
    
    
@app.route('/api/siret', methods=['POST'])
def siret_lookup():
    siret = request.json.get("siret")
    result, status_code = fetch_siret_data(siret, flash_messages=False)  
    return jsonify(result), status_code
    

@app.route('/', methods=['GET', 'POST'])
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

    ## Méthode pour utiliser requete brute (méthode suivante avec la vue à privilégier)
    # try:
    #         # Obtenez le moteur pour la base secondaire
    #     engine = db.get_engine(app, bind='secondary')
    #     # Requête brute pour charger uniquement les colonnes nécessaires
    #     # Requête brute
    #     # Créez une connexion explicite
    #     with engine.connect() as connection:
    #         # Requête brute
    #         sql = """
    #             SELECT codesite, nom_site
    #             FROM saisie.site_geojson
    #         """
    #         result = connection.execute(text(sql))

    #         for row in result:
    #             print(row)

    # except FileNotFoundError:
    #     flash("Erreur : Fichier GeoJSON introuvable.", "danger")
   

    # # Charger les choix pour les champs code_site et nom_site dans le cas où l'utilisateur voudrait chercher par autocompletion un site (rechercher pour zoom automatique sur le site par exemple)
    # try:
    #     # Charger uniquement les colonnes nécessaires
    #     sites = VueSites.query.options(load_only(VueSites.codesite, VueSites.nom_site)).all()
    #     site_choices = [(site.codesite, site.nom_site) for site in sites]
    #     # Remplir les choix pour les champs dans le formulaire
    #     form.nom_site.choices = [(nom, nom) for _, nom in site_choices]
    #     form.code_site.choices = [(code, code) for code, _ in site_choices]
    # except Exception as e:
    #     app.logger.error(f"Erreur lors du chargement des sites : {e}")
    #     flash("Erreur lors du chargement des sites CEN.", "danger")

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
            # Logique pour enregistrer les données

            # Ajouter une société
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

            # Ajouter un Site CEN
            site_cen = SiteCEN(
                nom_site=form.nom_site.data,
                code_site=form.code_site.data
            )
            db.session.add(site_cen)
            db.session.commit()

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


            # Associer le contrat au Site CEN
            contrat_site_cen = ContratSiteCEN(
                id_site=site_cen.id_site,
                id_contrat=contrat.id_contrat
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

            for production_id in request.form.getlist('type_production'):
                type_production_societe = TypeProductionSociete(
                    id_societe=societe.id_societe,
                    id_type_production=int(production_id),
                    type_agriculture=form.type_agriculture.data  # Récupéré séparément depuis un autre champ
                )
                db.session.add(type_production_societe)
                db.session.commit()

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
            selectinload(Contrat.types_milieu).selectinload(TypeMilieuContrat.type_milieu),
            selectinload(Contrat.produits_finis).selectinload(ProduitFiniContrat.produit_fini),
            selectinload(Contrat.sites_cen).selectinload(ContratSiteCEN.site_cen),
            selectinload(Contrat.referent)
        )
    )

    contrat_data = []

    # Charger les contrats par lots de 50
    for contrat in contrats_query.yield_per(50):

        # Types de milieu
        type_milieux = [milieu.type_milieu.milieu for milieu in contrat.types_milieu] if contrat.types_milieu else []

        # Types de production
        type_productions = [
            prod.type_production.nature_production
            for prod in (contrat.societe.types_production_societe if contrat.societe else [])
            if prod.type_production
        ]

        # Produits finis
        produits_finis = [
            produit.produit_fini.nature_produit_fini if produit.produit_fini else "Non spécifié"
            for produit in contrat.produits_finis
        ]

        type_agriculture = (
            contrat.societe.types_production_societe[0].type_agriculture
            if contrat.societe and contrat.societe.types_production_societe
            else "Non spécifié"
        )

        contrat_data.append({
            "id": contrat.id_contrat,
            "latitude": float(contrat.latitude) if contrat.latitude else None,
            "longitude": float(contrat.longitude) if contrat.longitude else None,
            "nom_site": contrat.sites_cen[0].site_cen.nom_site if contrat.sites_cen and contrat.sites_cen[0].site_cen else "Non spécifié",
            "code_site": contrat.sites_cen[0].site_cen.code_site if contrat.sites_cen and contrat.sites_cen[0].site_cen else "Non spécifié",
            "nom_societe": contrat.societe.nom_societe if contrat.societe else "Non spécifié",
            "agriculteur": f"{contrat.societe.agriculteurs_intermediaires[0].agriculteur.prenom_agri} {contrat.societe.agriculteurs_intermediaires[0].agriculteur.nom_agri}" if contrat.societe and contrat.societe.agriculteurs_intermediaires else "Non spécifié",
            "contact": contrat.societe.contact if contrat.societe else "Non spécifié",
            "siret": contrat.societe.siret,
            "adresse_etablissement": contrat.societe.adresse_etablissement,
            "tranche_effectif": contrat.societe.tranche_effectif_obj.lib_type_tranche_effectif if contrat.societe and contrat.societe.tranche_effectif_obj else "Non spécifié",
            "categorie_juridique": contrat.societe.categorie_juridique_obj.lib_type_categorie_juridique if contrat.societe and contrat.societe.categorie_juridique_obj else "Non spécifié",
            "activite_principale": contrat.societe.activite_principale_obj.lib_type_activite_principale if contrat.societe and contrat.societe.activite_principale_obj else "Non spécifié",
            "date_naissance": contrat.societe.agriculteurs_intermediaires[0].agriculteur.date_naissance if contrat.societe and contrat.societe.agriculteurs_intermediaires else "Non spécifié",
            "type_agriculture": type_agriculture,
            "type_productions": type_productions,
            "produits_finis": produits_finis,
            "type_contrat": contrat.type_contrat.appellation_contrat if contrat.type_contrat else "Non spécifié",
            "date_signature": contrat.date_signature.strftime("%Y-%m-%d") if contrat.date_signature else "Non spécifié",
            "date_prise_effet": contrat.date_prise_effet.strftime("%Y-%m-%d") if contrat.date_prise_effet else "Non spécifié",
            "date_fin": contrat.date_fin.strftime("%Y-%m-%d") if contrat.date_fin else "Non spécifié",
            "referent": f"{contrat.referent.prenom_referent} {contrat.referent.nom_referent}" if contrat.referent else "Non spécifié",
            "surface_contractualisee": contrat.surf_contractualisee if contrat.surf_contractualisee else 'Non spécifié',
            "type_milieux": type_milieux,
        })

    # Envoyer les données au template après la boucle
    return render_template('map.html', form=form, geojson=geojson, contrats=contrat_data)


@app.route('/edit_contract/<int:contract_id>', methods=['GET', 'POST'])
def edit_contract(contract_id):
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
            selectinload(Contrat.types_milieu).selectinload(TypeMilieuContrat.type_milieu),
            selectinload(Contrat.produits_finis).selectinload(ProduitFiniContrat.produit_fini),
            selectinload(Contrat.sites_cen).selectinload(ContratSiteCEN.site_cen),
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
        form.nom_site.data = contrat.sites_cen[0].site_cen.nom_site if contrat.sites_cen else ""
        form.code_site.data = contrat.sites_cen[0].site_cen.code_site if contrat.sites_cen else ""

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
        form.type_production.data = [prod.type_production.id_type_production for prod in contrat.societe.types_production_societe]
        form.type_agriculture.data = contrat.societe.types_production_societe[0].type_agriculture if contrat.societe.types_production_societe else ""

    # 🟢 Traitement du formulaire soumis
    elif request.method == 'POST':
        try:
            # Mise à jour des informations générales
            if contrat.sites_cen:
                contrat.sites_cen[0].site_cen.nom_site = form.nom_site.data
                contrat.sites_cen[0].site_cen.code_site = form.code_site.data

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
            contrat.societe.types_production_societe = [
                TypeProductionSociete(id_type_production=tid, id_societe=contrat.societe.id_societe, type_agriculture=form.type_agriculture.data)
                for tid in form.type_production.data
            ]

            db.session.commit()
            flash("Les modifications ont été enregistrées avec succès.", "success")
            return redirect(url_for('map_page'))

        except Exception as e:
            db.session.rollback()
            flash(f"Erreur lors de la mise à jour : {str(e)}", "danger")

    return render_template('edit_contract.html', contrat=contrat, form=form)


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
        contract_sites = ContratSiteCEN.query.filter_by(id_contrat=contract_id).all()
        for contract_site in contract_sites:
            site_id = contract_site.id_site
            db.session.delete(contract_site)

            # Vérifier si le SiteCEN est orphelin
            if not ContratSiteCEN.query.filter_by(id_site=site_id).first():
                site = SiteCEN.query.get(site_id)
                if site:
                    db.session.delete(site)

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





