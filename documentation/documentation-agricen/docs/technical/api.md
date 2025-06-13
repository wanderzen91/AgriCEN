# API

L'application AgriCEN expose plusieurs points d'API pour faciliter l'interaction avec le frontend et l'intégration avec des systèmes externes. Ces API sont principalement utilisées par l'interface JavaScript pour les requêtes AJAX.

## API GeoJSON

### Récupération de tous les sites CEN

```
GET /sites_cen_geojson
```

Cette API renvoie les données de tous les sites du CEN au format GeoJSON pour affichage sur la carte.

#### Exemple de réponse

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [...]
      },
      "properties": {
        "idsite": 1,
        "codesite": "CEN001",
        "nom_site": "Prairie de Montbel"
      }
    },
    // Autres sites...
  ]
}
```

#### Implémentation

```python
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
```

### Récupération d'un site CEN spécifique

```
GET /site_cen_geojson/<int:site_id>
```

Cette API renvoie les données d'un site CEN spécifique au format GeoJSON.

#### Paramètres

- `site_id` : ID du site à récupérer

#### Implémentation

```python
@app.route('/site_cen_geojson/<int:site_id>')
def get_single_site_cen_geojson(site_id):
    """
    Récupère les données GeoJSON pour un seul site CEN spécifié par son ID.
    Cela permet d'optimiser le chargement de la page edit_contract.html.
    """
    site = VueSites.query.filter_by(idsite=site_id).first()
    
    if not site:
        return jsonify({"error": "Site non trouvé"}), 404
        
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
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": [feature]
    }
    
    return jsonify(geojson_data)
```

## API de recherche

### Recherche d'agriculteur

```
POST /api/search_agriculteur
```

Permet de rechercher des agriculteurs par nom ou prénom.

#### Corps de la requête

```json
{
  "search_term": "dupont"
}
```

#### Exemple de réponse

```json
[
  {
    "id": 1,
    "nom": "DUPONT",
    "prenom": "Jean",
    "display": "DUPONT Jean"
  },
  {
    "id": 5,
    "nom": "DUPONT",
    "prenom": "Marie",
    "display": "DUPONT Marie"
  }
]
```

#### Implémentation

```python
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
```

### Recherche de référent

```
POST /api/search_referent
```

Permet de rechercher des référents par nom ou prénom.

#### Corps de la requête

```json
{
  "search_term": "martin"
}
```

#### Exemple de réponse

```json
[
  {
    "nom": "MARTIN",
    "prenom": "Sophie",
    "display": "MARTIN Sophie"
  }
]
```

#### Implémentation

```python
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
```

## API SIRET

### Vérification de contrat existant par SIRET

```
GET /api/check_existing_contract_by_siret/<siret>
```

Vérifie si un SIRET est déjà associé à un contrat existant.

#### Paramètres

- `siret` : Numéro SIRET à vérifier (14 caractères)

#### Exemple de réponse (contrat trouvé)

```json
{
  "exists": true,
  "contract_id": 42,
  "nom_societe": "FERME DES OLIVIERS"
}
```

#### Exemple de réponse (pas de contrat)

```json
{
  "exists": false
}
```

#### Implémentation

```python
@app.route('/api/check_existing_contract_by_siret/<siret>', methods=['GET'])
def check_existing_contract_by_siret(siret):
    """
    Vérifie si un SIRET correspond à un contrat existant et renvoie l'ID du contrat et le nom de la société
    """
    try:
        # Rechercher un contrat associé au SIRET spécifié avec le nom de la société
        result = db.session.query(Contrat.id_contrat, Societe.nom_societe)\
            .join(Societe, Contrat.id_societe == Societe.id_societe)\
            .filter(Societe.siret == siret)\
            .first()
        
        if result:
            return jsonify({
                'exists': True,
                'contract_id': result[0],
                'nom_societe': result[1] or 'Nom non spécifié'
            })
        else:
            return jsonify({'exists': False})
    except Exception as e:
        logging.error(f"Erreur lors de la vérification du SIRET {siret}: {e}")
        return jsonify({
            'exists': False,
            'error': str(e)
        }), 500
```

### Récupération des données SIRET

```
POST /siret_lookup
```

Récupère les informations d'une entreprise via l'API SIRENE à partir d'un numéro SIRET.

#### Corps de la requête

```json
{
  "siret": "12345678901234"
}
```

#### Exemple de réponse

```json
{
  "success": true,
  "data": {
    "nom_societe": "FERME DES OLIVIERS",
    "categorie_juridique": "5499",
    "activite_principale": "0111Z",
    "tranche_effectif": "11",
    "adresse_etablissement": "123 ROUTE DE LA COLLINE",
    "commune_etablissement": "AIX-EN-PROVENCE",
    "existe_en_base": false
  }
}
```


## Intégration API externe : SIRENE (INSEE)

L'application AgriCEN s'intègre avec l'API SIRENE de l'INSEE pour récupérer automatiquement les informations des entreprises agricoles à partir de leur numéro SIRET.

### Description de l'intégration

L'API SIRENE permet d'accéder à la base SIRENE (Système Informatique pour le Répertoire des Entreprises et des Établissements) qui contient les informations sur toutes les entreprises et établissements français.

### Implémentation dans AgriCEN

L'application utilise la fonction `fetch_siret_data` dans `views.py` qui encapsule les appels à l'API SIRENE :

```python
def fetch_siret_data(siret, flash_messages = False):
    """
    Récupère les informations d'une entreprise via l'API SIRENE en fonction du numéro SIRET.
    """
    # Validation du SIRET (14 chiffres)
    if not siret or len(siret) != 14 or not siret.isdigit():
        return {"error": "Le numéro SIRET est invalide."}, 400

    url = f"https://api.insee.fr/api-sirene/3.11/siret/{siret}"
    headers = {
        "accept": "application/json",
        "X-INSEE-Api-Key-Integration": "[API_KEY]",  # Clé masquée dans la documentation
    }
    
    # Appel à l'API et traitement de la réponse
    # ...
```

### Données récupérées

La fonction extrait et structure les informations suivantes de l'API SIRENE :

- **SIREN** : Identifiant de l'entreprise
- **Dénomination** : Nom officiel de l'entreprise
- **Activité principale** : Code NAF/APE
- **Catégorie juridique** : Forme juridique (SARL, SA, etc.)
- **Tranche d'effectif** : Nombre approximatif d'employés
- **Adresse complète** : Adresse formatée de l'établissement

### Format de réponse

Une réponse réussie renvoie un objet structuré avec les informations de l'entreprise :

```json
{
  "siren": "123456789",
  "denomination": "EXPLOITATION AGRICOLE EXEMPLE",
  "activite_principale": "01.11Z",
  "categorie_juridique": "5499",
  "tranche_effectif": "11",
  "adresse_etablissement": "123 ROUTE DES CHAMPS, 33000 BORDEAUX"
}
```

### Utilisation dans l'application

Cette API est principalement utilisée pour :

1. Pré-remplir automatiquement les informations de l'exploitation agricole lors de la création/modification de contrats
2. Vérifier et valider les numéros SIRET saisis par les utilisateurs
3. S'assurer de la cohérence des données enregistrées

### Gestion des erreurs

La fonction gère plusieurs cas d'erreur :

- SIRET invalide (format incorrect)
- Établissement non trouvé
- Erreurs d'API (problèmes d'autorisation, timeout, etc.)
- Erreurs de communication réseau

## Appel des API depuis le frontend

Exemple d'appel d'API depuis JavaScript :

```javascript
// Recherche d'agriculteur
async function searchAgriculteur(searchTerm) {
    try {
        const response = await fetch('/api/search_agriculteur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ search_term: searchTerm })
        });
        
        if (!response.ok) {
            throw new Error('Erreur réseau');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        return [];
    }
}
```
