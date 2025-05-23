/**
 * Gestionnaire de recherche et filtrage pour la carte
 * Contient les fonctionnalités liées à la recherche et au filtrage des marqueurs
 */

// Tableau global pour stocker les valeurs uniques pour l'autocomplétion
let proprietors = [];
let societes = [];
let referents = [];

// Variable globale pour stocker les marqueurs
let allMarkers = [];

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
    // Réinitialiser les champs de filtre
    document.getElementById('searchNom').value = '';
    document.getElementById('searchSociete').value = '';
    document.getElementById('searchReferent').value = '';
    document.getElementById('searchTypeContrat').value = '';
    document.getElementById('searchTypeProduction').value = '';
    document.getElementById('searchProduitFini').value = '';
    document.getElementById('searchTypeAgriculture').value = '';
    document.getElementById('searchSAUOperator').value = '';
    document.getElementById('searchSAUValue').value = '' ;
    document.getElementById('searchSurfaceContractualiseeOperator').value = '';
    document.getElementById('searchSurfaceContractualiseeValue').value = '';    

    // Rendre tous les marqueurs visibles et les replacer correctement
    allMarkers.forEach(item => {
        item.marker.setOpacity(1); // Rendre visible
        item.marker.setLatLng([item.data.latitude, item.data.longitude]); // Replacer au bon endroit
    });

    closeModal('searchModal'); // Fermer la modale après application
}

/**
 * Filtre les marqueurs selon les critères sélectionnés
 */
function filterMarkers() {
    showLoader(); // Afficher le loader

    const nomProprietaire = document.getElementById('searchNom').value.trim().toLowerCase();
    const nomSociete = document.getElementById('searchSociete').value.trim().toLowerCase();
    const referent = document.getElementById('searchReferent').value.trim().toLowerCase();
    const typeContrat = document.getElementById('searchTypeContrat').value.trim().toLowerCase();
    const typeProduction = document.getElementById('searchTypeProduction').value.trim().toLowerCase();
    const produitFini = document.getElementById('searchProduitFini').value.trim().toLowerCase();
    const typeAgriculture = document.getElementById('searchTypeAgriculture').value.trim().toLowerCase();
    
    // Récupérer les valeurs pour le filtre de surface contractualisée
    const surfaceOperator = document.getElementById('searchSurfaceContractualiseeOperator').value;
    const surfaceValue = document.getElementById('searchSurfaceContractualiseeValue').value;
    
    // Récupérer les valeurs pour le filtre de SAU
    const sauOperator = document.getElementById('searchSAUOperator').value;
    const sauValue = document.getElementById('searchSAUValue').value;

    // Afficher les valeurs sélectionnées pour le débogage
    console.log('Filtre Type de production:', typeProduction);
    console.log('Filtre Produit fini:', produitFini);
    console.log('Filtre Surface contractualisée:', surfaceOperator, surfaceValue);
    console.log('Filtre SAU:', sauOperator, sauValue);

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
            if (typeAgriculture && data.type_agriculture && data.type_agriculture.toLowerCase().trim() !== typeAgriculture) match = false;

            if (typeProduction) {
                // Afficher les données pour le débogage
                console.log('Données type_productions:', data.type_productions);
                
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
