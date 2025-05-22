/**
 * Gestionnaire de recherche d'agriculteurs - Autocomplétion
 * Permet de rechercher des agriculteurs existants dans la base de données
 */
class AgriculteurSearch {
    constructor() {
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements pour la recherche d'agriculteurs
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const searchAgriculteurInput = document.getElementById('search_agriculteur');
            const agriculteurSuggestions = document.getElementById('agriculteur_suggestions');

            if (searchAgriculteurInput && agriculteurSuggestions) {
                console.log("Initialisation des écouteurs d'événements pour la recherche d'agriculteurs");
                
                // Écouteur d'événement pour la saisie dans le champ de recherche
                searchAgriculteurInput.addEventListener('input', () => {
                    const searchTerm = searchAgriculteurInput.value.trim();
                    this.searchAgriculteur(searchTerm, searchAgriculteurInput, agriculteurSuggestions);
                });
                
                // Masquer les suggestions lorsqu'on clique ailleurs
                document.addEventListener('click', (event) => {
                    if (!searchAgriculteurInput.contains(event.target) && !agriculteurSuggestions.contains(event.target)) {
                        agriculteurSuggestions.style.display = 'none';
                    }
                });
            } else {
                console.warn("Éléments de recherche d'agriculteurs non trouvés dans le document");
            }
        });
    }

    /**
     * Effectue la recherche d'agriculteurs
     * @param {string} searchTerm - Le terme de recherche
     * @param {HTMLElement} inputElement - L'élément input de recherche
     * @param {HTMLElement} suggestionsElement - L'élément pour afficher les suggestions
     */
    /**
     * Active ou désactive les champs agriculteur
     * @param {boolean} enable - Indique si les champs doivent être activés ou désactivés
     */
    enableAgriFields(enable) {
        const nomAgri = document.getElementById('modal_nom_agri') || document.querySelector('[name="nom_agri"]');
        const prenomAgri = document.getElementById('modal_prenom_agri') || document.querySelector('[name="prenom_agri"]');
        
        if (nomAgri && prenomAgri) {
            if (enable) {
                nomAgri.readOnly = false;
                prenomAgri.readOnly = false;
                nomAgri.classList.remove('disabled-look');
                prenomAgri.classList.remove('disabled-look');
            } else {
                nomAgri.readOnly = true;
                prenomAgri.readOnly = true;
                nomAgri.classList.add('disabled-look');
                prenomAgri.classList.add('disabled-look');
            }
        }
    }

    async searchAgriculteur(searchTerm, inputElement, suggestionsElement) {
        // Ne pas rechercher si le terme est trop court
        if (!searchTerm || searchTerm.length < 2) {
            suggestionsElement.style.display = 'none';
            return;
        }
        
        try {
            console.log("Recherche d'agriculteur:", searchTerm);
            const response = await fetch("/api/search_agriculteur", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ search_term: searchTerm })
            });

            const results = await response.json();
            console.log("Résultats de recherche:", results);
            
            // Vider et masquer les suggestions si aucun résultat
            suggestionsElement.innerHTML = '';
            
            if (results.length === 0) {
                suggestionsElement.style.display = 'none';
                return;
            }
            
            // Créer les éléments de suggestion pour chaque résultat
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'p-2 border-bottom suggestion-item';
                item.textContent = result.display;
                item.style.cursor = 'pointer';
                
                // Gérer le clic sur une suggestion
                item.addEventListener('click', () => {
                    // Remplir les champs avec les données de l'agriculteur sélectionné
                    const nomAgriInput = document.getElementById('modal_nom_agri') || document.querySelector('[name="nom_agri"]');
                    const prenomAgriInput = document.getElementById('modal_prenom_agri') || document.querySelector('[name="prenom_agri"]');
                    
                    if (nomAgriInput && prenomAgriInput) {
                        nomAgriInput.value = result.nom;
                        prenomAgriInput.value = result.prenom;
                        // Désactiver les champs après les avoir remplis
                        this.enableAgriFields(false);
                    }
                    
                    // Mettre à jour le champ de recherche et masquer les suggestions
                    inputElement.value = result.display;
                    suggestionsElement.style.display = 'none';
                });
                
                suggestionsElement.appendChild(item);
            });
            
            // Afficher les suggestions
            suggestionsElement.style.display = 'block';
            
        } catch (error) {
            console.error("Erreur lors de la recherche d'agriculteur:", error);
            suggestionsElement.style.display = 'none';
        }
    }
}

// Initialiser le gestionnaire de recherche d'agriculteurs
const agriculteurSearch = new AgriculteurSearch();
