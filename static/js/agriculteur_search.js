/**
 * Gestionnaire de recherche d'agriculteurs
 * Permet de rechercher des agriculteurs existants ou d'en créer un nouveau
 */
class AgriculteurSearch {
    constructor() {
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements après le chargement du DOM
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const searchAgriculteurInput = document.getElementById('search_agriculteur');
            const agriculteurSuggestions = document.getElementById('agriculteur_suggestions');

            if (searchAgriculteurInput && agriculteurSuggestions) {
                
                // Lancer la recherche lors de la saisie
                searchAgriculteurInput.addEventListener('input', () => {
                    const searchTerm = searchAgriculteurInput.value.trim();
                    this.searchAgriculteur(searchTerm, searchAgriculteurInput, agriculteurSuggestions);
                });

                // Masquer les suggestions si on clique à l'extérieur
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
     * Active ou désactive les champs nom/prénom de l'agriculteur
     */
    enableAgriFields(enable) {
        const { nomAgri, prenomAgri } = this.getAgriFields();

        if (nomAgri && prenomAgri) {
            [nomAgri, prenomAgri].forEach(field => {
                field.readOnly = !enable;
                field.classList.toggle('disabled-look', !enable);
            });
        }
    }

    /**
     * Récupère les éléments input du nom et prénom de l'agriculteur
     */
    getAgriFields() {
        const nomAgri = document.getElementById('modal_nom_agri') || document.querySelector('[name="nom_agri"]');
        const prenomAgri = document.getElementById('modal_prenom_agri') || document.querySelector('[name="prenom_agri"]');
        return { nomAgri, prenomAgri };
    }

    /**
     * Sépare une chaîne en prénom et nom
     * Exemple : "Paul Durand" → { prenom: "Paul", nom: "Durand" }
     */
    splitSearchTerm(searchTerm) {
        const parts = searchTerm.trim().split(/\s+/);
        if (parts.length === 1) {
            return { prenom: parts[0], nom: '' };
        } else {
            const prenom = parts.shift();
            const nom = parts.join(' ');
            return { prenom, nom };
        }
    }

    /**
     * Effectue la recherche d'agriculteurs et affiche les suggestions
     */
    async searchAgriculteur(searchTerm, inputElement, suggestionsElement) {
        if (!searchTerm || searchTerm.length < 2) {
            suggestionsElement.style.display = 'none';
            return;
        }

        try {
            const response = await fetch("/api/search_agriculteur", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ search_term: searchTerm })
            });

            const results = await response.json();

            suggestionsElement.innerHTML = '';

            // Si aucun résultat : proposer l'ajout d'un nouvel agriculteur
            if (results.length === 0) {
                const newItem = document.createElement('div');
                newItem.className = 'p-2 border-bottom suggestion-item';
                newItem.style.cursor = 'pointer';
                newItem.innerHTML = `<i class="fas fa-plus-circle me-2"></i>Ajouter un nouvel agriculteur : ${searchTerm}`;

                newItem.addEventListener('click', () => {
                    const { nom, prenom } = this.splitSearchTerm(searchTerm);
                    const { nomAgri, prenomAgri } = this.getAgriFields();

                    if (nomAgri && prenomAgri) {
                        nomAgri.value = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
                        prenomAgri.value = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
                        this.enableAgriFields(false);
                    }

                    inputElement.value = '';
                    suggestionsElement.style.display = 'none';
                });

                suggestionsElement.appendChild(newItem);
                suggestionsElement.style.display = 'block';
                return;
            }

            // Résultats trouvés : afficher la liste
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'p-2 border-bottom suggestion-item';
                item.textContent = result.display;
                item.style.cursor = 'pointer';

                item.addEventListener('click', () => {
                    const { nomAgri, prenomAgri } = this.getAgriFields();

                    if (nomAgri && prenomAgri) {
                        nomAgri.value = result.nom;
                        prenomAgri.value = result.prenom;
                        this.enableAgriFields(false);
                    }

                    inputElement.value = result.display;
                    suggestionsElement.style.display = 'none';
                });

                suggestionsElement.appendChild(item);
            });

            suggestionsElement.style.display = 'block';

        } catch (error) {
            console.error("Erreur lors de la recherche d'agriculteur:", error);
            suggestionsElement.style.display = 'none';
        }
    }
}

// Initialiation du gestionnaire de recherche d'agriculteurs
const agriculteurSearch = new AgriculteurSearch();
