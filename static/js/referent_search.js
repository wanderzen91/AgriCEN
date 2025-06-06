/**
 * Gestionnaire de recherche de référents
 * Gère la recherche dynamique, la sélection ou la création de référents
 */
class ReferentSearch {
    constructor() {
        // Stocke les timers pour la fonctionnalité de "debounce"
        this.debounceTimers = {};
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements à la fin du chargement du DOM
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Champ de recherche principal
            const mainSearchReferent = document.getElementById('search_referent');
            if (mainSearchReferent) {
                this.setupSingleReferentSearch(mainSearchReferent);
            }

            // Recherche dans les contrats
            this.setupAllContractReferents();
        });
    }

    /**
     * Initialise la recherche pour tous les contrats existants
     */
    setupAllContractReferents() {
        const contractSearchInput = document.getElementById('search_referent');
        if (contractSearchInput) {
            this.setupSingleReferentSearch(contractSearchInput);
        }
    }

    /**
     * Configure un champ de recherche spécifique
     * @param {HTMLElement} searchInput - Le champ input de recherche
     */
    setupSingleReferentSearch(searchInput) {
        const referentSuggestionsDiv = searchInput.nextElementSibling || 
                                      document.getElementById('referent_suggestions');

        if (!referentSuggestionsDiv) {
            console.error("Élément de suggestions non trouvé pour", searchInput.id);
            return;
        }

        const contractIndex = null;

        // Remplit automatiquement le champ avec les données existantes 
        this.initializeWithExistingValues(searchInput, contractIndex);

        // Événement de saisie dans le champ
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim();
            const inputId = searchInput.id;

            // Réinitialise le timer précédent (fonction debounce)
            clearTimeout(this.debounceTimers[inputId]);

            if (searchTerm.length < 2) {
                referentSuggestionsDiv.style.display = 'none';
                return;
            }

            // Lance une recherche après un délai de 300 ms
            this.debounceTimers[inputId] = setTimeout(() => {
                this.searchReferent(searchTerm, searchInput, referentSuggestionsDiv, contractIndex);
            }, 300);
        });

        // Ferme la liste de suggestions si on clique à l'extérieur
        document.addEventListener('click', (event) => {
            if (!referentSuggestionsDiv.contains(event.target) && event.target !== searchInput) {
                referentSuggestionsDiv.style.display = 'none';
            }
        });
    }

    /**
     * préremplit le champ de recherche avec les valeurs déjà existantes
     */
    initializeWithExistingValues(searchInput, contractIndex) {
        const { nomReferent, prenomReferent } = this.getReferentFields(contractIndex);

        if (nomReferent && prenomReferent && nomReferent.value && prenomReferent.value) {
            searchInput.value = `${nomReferent.value} ${prenomReferent.value}`;
            this.enableReferentFields(contractIndex, false);
        }
    }

    /**
     * Active ou désactive les champs nom/prénom du référent
     */
    enableReferentFields(contractIndex, enable) {
        const { nomReferent, prenomReferent } = this.getReferentFields(contractIndex);

        if (nomReferent && prenomReferent) {
            [nomReferent, prenomReferent].forEach(field => {
                field.readOnly = !enable;
                field.classList.toggle('disabled-look', !enable);
            });
        }
    }

    /**
     * Récupère les champs nom/prénom du référent en fonction du contexte
     */
    getReferentFields(contractIndex = null) {
        let nomReferent, prenomReferent;

        if (contractIndex !== null) {
            nomReferent = document.getElementById(`modal_nom_referent_${contractIndex}`);
            prenomReferent = document.getElementById(`modal_prenom_referent_${contractIndex}`);
        } else {
            nomReferent = document.getElementById('modal_nom_referent') || document.querySelector('[name="nom_referent"]');
            prenomReferent = document.getElementById('modal_prenom_referent') || document.querySelector('[name="prenom_referent"]');
        }

        return { nomReferent, prenomReferent };
    }

    /**
     * Sépare une chaîne en nom et prénom
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
     * Effectue une requête de recherche de référents et gère les suggestions
     */
    async searchReferent(searchTerm, inputElement, suggestionsElement, contractIndex) {
        try {
            console.log("Recherche de référent:", searchTerm);
            const response = await fetch('/api/search_referent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search_term: searchTerm })
            });

            const data = await response.json();
            suggestionsElement.innerHTML = '';

            if (data.length === 0) {
                // Aucun résultat trouvé alors proposition de création
                const newReferentItem = document.createElement('div');
                newReferentItem.className = 'p-2 hover-bg-light cursor-pointer border-bottom';
                newReferentItem.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Ajouter un(e) nouvel(le) référent(e) : ' + searchTerm;

                newReferentItem.addEventListener('click', () => {
                    const { nom, prenom } = this.splitSearchTerm(searchTerm);
                    const { nomReferent, prenomReferent } = this.getReferentFields(contractIndex);

                    if (nomReferent && prenomReferent) {
                        nomReferent.value = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
                        prenomReferent.value = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
                        this.enableReferentFields(contractIndex, false);
                    }

                    inputElement.value = '';
                    suggestionsElement.style.display = 'none';
                });

                suggestionsElement.appendChild(newReferentItem);
                suggestionsElement.style.display = 'block';
            } else {
                // Affiche les référents trouvés
                data.forEach(referent => {
                    const div = document.createElement('div');
                    div.className = 'p-2 hover-bg-light cursor-pointer border-bottom';
                    div.textContent = `${referent.nom} ${referent.prenom}`;

                    div.addEventListener('click', () => {
                        const { nomReferent, prenomReferent } = this.getReferentFields(contractIndex);

                        if (nomReferent && prenomReferent) {
                            nomReferent.value = referent.nom;
                            prenomReferent.value = referent.prenom;
                        }

                        this.enableReferentFields(contractIndex, false);
                        inputElement.value = `${referent.nom} ${referent.prenom}`;
                        suggestionsElement.style.display = 'none';
                    });

                    suggestionsElement.appendChild(div);
                });

                suggestionsElement.style.display = 'block';
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de référent:', error);
            suggestionsElement.style.display = 'none';
        }
    }
}

// Initialise l'objet de recherche une fois le script chargé
const referentSearch = new ReferentSearch();
