/**
 * Gestionnaire de recherche et filtrage pour la carte
 * Contient les fonctionnalités liées à la recherche et au filtrage des marqueurs
 */

// Tableau global pour stocker les valeurs uniques pour l'autocomplétion
let proprietors = [];
let societes = [];
let referents = [];

// Utiliser la variable globale allMarkers déjà définie dans map.html


/**
 * Initialise le gestionnaire de recherche avec les marqueurs disponibles
 * @param {Array} markers - Tableau de marqueurs avec leurs données
 */
function initSearchHandler(markers) {
    // Stocker les marqueurs dans la variable globale
    allMarkers = markers;
    
    // Générer les listes dynamiques après l'ajout des marqueurs
    proprietors = getUniqueValues(markers, "agriculteur");
    societes = getUniqueValues(markers, "nom_societe");
    referents = getUniqueValues(markers, "referent");

    // Initialiser l'autocomplétion
    initAutocomplete();
}

// Exposer la fonction au niveau global pour qu'elle soit accessible depuis d'autres scripts
window.initSearchHandler = initSearchHandler;

/**
 * Génère une liste de valeurs uniques à partir d'une clé spécifique
 * @param {Array} markers - Tableau de marqueurs avec leurs données
 * @param {string} key - Clé à extraire
 * @returns {Array} - Tableau de valeurs uniques
 */
function getUniqueValues(markers, key) {
    const uniqueSet = new Set(); // Utiliser un Set pour éviter les doublons
    markers.forEach(item => {
        if (item.data[key]) { // Vérifie si la clé existe et a une valeur
            uniqueSet.add(item.data[key].trim());
        }
    });
    return Array.from(uniqueSet); // Convertir le Set en tableau
}

/**
 * Retarde l'exécution d'une fonction
 * @param {Function} func - Fonction à exécuter
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} - Fonction avec délai
 */
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Divise un terme de recherche en nom et prénom
 * @param {string} searchTerm - Terme de recherche
 * @returns {Object} - Objet contenant le nom et le prénom
 */
function splitSearchTerm(searchTerm) {
    const parts = searchTerm.trim().split(/\\s+/);
    
    if (parts.length === 0) return { nom: '', prenom: '' };
    if (parts.length === 1) return { nom: parts[0], prenom: '' };
    
    const nom = parts[0];
    const prenom = parts.slice(1).join(' ');
    
    return { nom, prenom };
}

/**
 * Initialise l'autocomplétion pour les champs de recherche
 */
function initAutocomplete() {
    // Appliquer l'autocomplétion avec debounce sur les propriétaires
    autocomplete(
        document.getElementById("searchNom"),
        document.getElementById("suggestionsNom"),
        proprietors
    );

    // Exemple pour les sociétés
    autocomplete(
        document.getElementById("searchSociete"),
        document.getElementById("suggestionsSociete"),
        societes
    );

    // Exemple pour les référents
    autocomplete(
        document.getElementById("searchReferent"),
        document.getElementById("suggestionsReferent"),
        referents
    );
}

// Exposer initAutocomplete au niveau global
window.initAutocomplete = initAutocomplete;

/**
 * Configure l'autocomplétion pour un champ de saisie
 * @param {HTMLElement} input - Élément input
 * @param {HTMLElement} suggestionsList - Élément liste de suggestions
 * @param {Array} data - Données pour l'autocomplétion
 */
function autocomplete(input, suggestionsList, data) {
    input.addEventListener("input", debounce(function () {
        const value = this.value.toLowerCase().trim();
        suggestionsList.innerHTML = "";

        if (!value) return;

        const matches = data.filter(item => item.toLowerCase().includes(value)).slice(0, 10); // Max 10 résultats

        if (matches.length === 0 && input.id === "searchNom") {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item list-group-item-action";
            const { nom, prenom } = splitSearchTerm(value);
            listItem.innerHTML = `<i class="fas fa-plus-circle me-2"></i>Ajouter un(e) nouvel exploitant(e)`;
            listItem.addEventListener("click", function () {
                const addModal = new bootstrap.Modal(document.getElementById('addModal'));
                addModal.show();
                
                // Pré-remplir les champs avec le terme de recherche séparé
                const searchInput = document.getElementById('search_agriculteur');
                const nomInput = document.getElementById('nom_agri');
                const prenomInput = document.getElementById('prenom_agri');
                
                if (searchInput && nomInput && prenomInput) {
                    searchInput.value = '';
                    nomInput.value = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
                    prenomInput.value = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
                    nomInput.disabled = false;
                    prenomInput.disabled = false;
                }
                
                suggestionsList.innerHTML = "";
            });
            suggestionsList.appendChild(listItem);
        }

        matches.forEach(match => {
            const listItem = document.createElement("li");
            listItem.className = "list-group-item list-group-item-action";
            listItem.textContent = match;
            listItem.addEventListener("click", function () {
                input.value = match;
                suggestionsList.innerHTML = "";
                input.dispatchEvent(new Event('change')); // Trigger change event for filtering
                // Ne pas appliquer automatiquement le filtre
            });

            listItem.innerHTML = match.replace(new RegExp(value, "gi"), (m) => `<strong>${m}</strong>`);
            suggestionsList.appendChild(listItem);
        });
    }, 300)); // Retarde l'exécution de 300ms

    document.addEventListener("click", function (e) {
        if (e.target !== input) suggestionsList.innerHTML = "";
    });
}

/**
 * Réinitialise tous les filtres et affiche tous les marqueurs
 */
function resetFilters() {
    // Réinitialiser les champs de filtre - vérifier l'existence avant d'accéder
    const elements = [
        'searchNom', 'searchSociete', 'searchReferent', 'searchTypeContrat',
        'searchTypeProduction', 'searchProduitFini', 'searchSurfaceContractualiseeOperator',
        'searchSurfaceContractualiseeValue'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    // Rendre tous les marqueurs visibles et les replacer correctement
    if (allMarkers && allMarkers.length > 0) {
        allMarkers.forEach(item => {
            item.marker.setOpacity(1); // Rendre visible
            item.marker.setLatLng([item.data.latitude, item.data.longitude]); // Replacer au bon endroit
        });
    }

    closeModal('searchModal'); // Fermer la modale après application
}

// Expose to global
window.resetFilters = resetFilters;

/**
 * Filtre les marqueurs selon les critères sélectionnés
 */
function filterMarkers() {
    showLoader(); // Afficher le loader

    // Fonction utilitaire pour récupérer la valeur d'un élément s'il existe
    function getElementValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value.trim().toLowerCase() : defaultValue;
    }

    const nomProprietaire = getElementValue('searchNom');
    const nomSociete = getElementValue('searchSociete');
    const referent = getElementValue('searchReferent');
    const typeContrat = getElementValue('searchTypeContrat');
    const typeProduction = getElementValue('searchTypeProduction');
    const produitFini = getElementValue('searchProduitFini');
    
    // Récupérer les valeurs pour le filtre de surface contractualisée
    const surfaceOperator = getElementValue('searchSurfaceContractualiseeOperator', '>');
    const surfaceValue = getElementValue('searchSurfaceContractualiseeValue');
    
    // Ne pas utiliser les filtres SAU s'ils n'existent pas dans le DOM
    const sauOperator = getElementValue('searchSAUOperator', '>');
    const sauValue = getElementValue('searchSAUValue');
    
    // Vérifier si la case à cocher "Contrats en cours" est cochée
    const contratsEnCours = document.getElementById('searchContratsEnCours')?.checked || false;
    const currentDate = new Date();

    let hasResults = false;

    // Simuler un chargement de 500ms avant d'afficher les résultats
    setTimeout(() => {
        allMarkers.forEach(item => {
            let match = true;
            let data = item.data;

            if (nomProprietaire && data.agriculteur.toLowerCase().trim() !== nomProprietaire) match = false;
            if (typeContrat && data.type_contrat.toLowerCase().trim() !== typeContrat) match = false;
            if (nomSociete && data.nom_societe.toLowerCase().trim() !== nomSociete) match = false;
            if (referent && data.referent.toLowerCase().trim() !== referent) match = false;

            if (typeProduction) {

                // Vérifier que type_productions existe et est un tableau
                if (!data.type_productions || !Array.isArray(data.type_productions) || data.type_productions.length === 0) {
                    console.log('Type productions invalide ou vide');
                    match = false;
                } else {
                    let found = false;
                    // Parcourir chaque type de production et vérifier s'il correspond à la valeur sélectionnée
                    for (let i = 0; i < data.type_productions.length; i++) {
                        // Vérifier si l'élément est un objet avec une propriété 'type'
                        const productionObj = data.type_productions[i];
                        if (productionObj && typeof productionObj === 'object' && productionObj.type) {
                            const productionType = productionObj.type.toLowerCase();
                            console.log(`Comparaison: "${productionType}" === "${typeProduction}"`);
                            if (productionType === typeProduction) {
                                found = true;
                                console.log('Correspondance trouvée!');
                                break;
                            }
                        } else {
                            // Essayer comme une chaîne simple au cas où
                            const production = String(productionObj).toLowerCase();
                            console.log(`Comparaison (string): "${production}" === "${typeProduction}"`);
                            if (production === typeProduction) {
                                found = true;
                                console.log('Correspondance trouvée (string)!');
                                break;
                            }
                        }
                    }
                    if (!found) {
                        console.log('Aucune correspondance trouvée pour le type de production');
                        match = false;
                    }
                }
            }

            if (produitFini) {
                // Vérifier que produits_finis existe et est un tableau
                if (!data.produits_finis || !Array.isArray(data.produits_finis) || data.produits_finis.length === 0) {
                    match = false;
                } else {
                    // Parcourir chaque produit fini et vérifier s'il correspond à la valeur sélectionnée
                    let found = false;
                    for (let i = 0; i < data.produits_finis.length; i++) {
                        const product = String(data.produits_finis[i]).toLowerCase();
                        if (product === produitFini) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        match = false;
                    }
                }
            }
            
            // Filtrage par surface contractualisée
            if (surfaceValue && !isNaN(parseFloat(surfaceValue))) {
                const surfaceNum = parseFloat(surfaceValue);
                const dataSurface = parseFloat(data.surface_contractualisee);
                
                if (!isNaN(dataSurface)) {
                    if (surfaceOperator === '>' && dataSurface <= surfaceNum) match = false;
                    if (surfaceOperator === '<' && dataSurface >= surfaceNum) match = false;
                } else if (surfaceValue) {
                    // Si la valeur de surface n'est pas un nombre valide dans les données mais qu'un filtre est appliqué
                    match = false;
                }
            }
            
            // Filtrage par SAU (Surface Agricole Utile)
            if (sauValue && !isNaN(parseFloat(sauValue))) {
                const sauNum = parseFloat(sauValue);
                const dataSAU = parseFloat(data.sau || 0); // Utiliser 0 si la SAU n'est pas définie
                
                if (!isNaN(dataSAU)) {
                    if (sauOperator === '>' && dataSAU <= sauNum) match = false;
                    if (sauOperator === '<' && dataSAU >= sauNum) match = false;
                } else if (sauValue) {
                    // Si la valeur de SAU n'est pas un nombre valide dans les données mais qu'un filtre est appliqué
                    match = false;
                }
            }
            
            // Filtrage des contrats en cours
            if (contratsEnCours && match) {
                // Convertir les dates de string (YYYY-MM-DD) en objets Date
                let datePriseEffet = null;
                let dateFin = null;
                
                if (data.date_prise_effet) {
                    datePriseEffet = new Date(data.date_prise_effet);
                }
                
                if (data.date_fin) {
                    dateFin = new Date(data.date_fin);
                }
                
                // Vérifier si le contrat est en cours (date actuelle est comprise entre date_prise_effet et date_fin)
                const contratEnCours = (
                    datePriseEffet && dateFin && 
                    currentDate >= datePriseEffet && 
                    currentDate <= dateFin
                );
                
                if (!contratEnCours) {
                    match = false;
                }
            }

            // Plutôt que de supprimer les marqueurs, on les rend invisibles
            if (match) {
                item.marker.setOpacity(1); // Visible
                item.marker.setLatLng([data.latitude, data.longitude]); // Remet à sa position réelle
                hasResults = true;
            } else {
                item.marker.setOpacity(0); // Invisible
                item.marker.setLatLng([0, 0]); // Déplace en dehors de la vue pour éviter l'interaction
            }
        });

        if (!hasResults) {
            Swal.fire({
                icon: 'error',
                title: 'Aucun résultat trouvé',
                text: 'Aucun contrat ne correspond aux filtres sélectionnés.'
            });
        }
        
        closeModal('searchModal'); // Fermer la modale après application

        hideLoader(); 
    }, 500); // Délai de 500ms avant d'afficher les résultats
}

// Expose to global
window.filterMarkers = filterMarkers;

/**
 * Affiche le loader pendant le chargement
 */
function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

/**
 * Cache le loader après le chargement
 */
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

/**
 * Ferme une modale Bootstrap
 * @param {string} modalId - ID de la modale à fermer
 */
function closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
    if (modal) {
        modal.hide();
    }
}
