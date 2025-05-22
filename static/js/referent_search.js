/**
 * Gestionnaire de recherche de référents - Autocomplétion
 * Permet de rechercher des référents existants dans la base de données
 * ou d'en créer de nouveaux
 */
class ReferentSearch {
    constructor() {
        this.debounceTimers = {};
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements pour tous les champs de recherche de référents
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Recherche pour le formulaire principal (edit_contract.html)
            const mainSearchReferent = document.getElementById('search_referent');
            if (mainSearchReferent) {
                this.setupSingleReferentSearch(mainSearchReferent);
            }
            
            // Recherche pour les contrats dans modal_add_data.html
            this.setupAllContractReferents();
        });
    }

    /**
     * Configure la recherche pour tous les contrats existants
     */
    setupAllContractReferents() {
        // Trouver tous les champs de recherche de référents pour les contrats
        const contractSearchInputs = document.querySelectorAll('[id^="search_referent_"]');
        
        if (contractSearchInputs.length > 0) {
            console.log(`Configuration de ${contractSearchInputs.length} champs de recherche de référents`);
            
            contractSearchInputs.forEach(input => {
                this.setupSingleReferentSearch(input);
            });
        }
    }

    /**
     * Configure un champ de recherche de référent spécifique
     * @param {HTMLElement} searchInput - L'élément input de recherche
     */
    setupSingleReferentSearch(searchInput) {
        // Trouver l'élément de suggestions associé
        const referentSuggestionsDiv = searchInput.nextElementSibling || 
                                      document.getElementById('referent_suggestions');
        
        if (!referentSuggestionsDiv) {
            console.error("Élément de suggestions non trouvé pour", searchInput.id);
            return;
        }
        
        // Extraire l'index du contrat à partir de l'ID (si applicable)
        const idMatch = searchInput.id.match(/search_referent_(\d+)/);
        const contractIndex = idMatch ? parseInt(idMatch[1]) : null;
        
        // Initialiser avec les valeurs actuelles si elles existent
        this.initializeWithExistingValues(searchInput, contractIndex);
        
        // Écouteur d'événement pour la saisie dans le champ de recherche
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.trim();
            const inputId = searchInput.id;
            
            // Effacer le timer de debounce précédent pour cet input
            clearTimeout(this.debounceTimers[inputId]);
            
            if (searchTerm.length < 2) {
                referentSuggestionsDiv.style.display = 'none';
                return;
            }
            
            // Définir un nouveau timer de debounce
            this.debounceTimers[inputId] = setTimeout(() => {
                this.searchReferent(searchTerm, searchInput, referentSuggestionsDiv, contractIndex);
            }, 300);
        });
        
        // Fermer les suggestions si on clique ailleurs
        document.addEventListener('click', (event) => {
            if (!referentSuggestionsDiv.contains(event.target) && event.target !== searchInput) {
                referentSuggestionsDiv.style.display = 'none';
            }
        });
    }

    /**
     * Initialise le champ de recherche avec les valeurs existantes
     * @param {HTMLElement} searchInput - L'élément input de recherche
     * @param {number|null} contractIndex - L'index du contrat (si applicable)
     */
    initializeWithExistingValues(searchInput, contractIndex) {
        let nomReferent, prenomReferent;
        
        if (contractIndex) {
            // Pour les contrats dans modal_add_data.html
            nomReferent = document.getElementById(`modal_nom_referent_${contractIndex}`);
            prenomReferent = document.getElementById(`modal_prenom_referent_${contractIndex}`);
        } else {
            // Pour le formulaire principal dans edit_contract.html
            nomReferent = document.getElementById('modal_nom_referent') || document.querySelector('[name="nom_referent"]');
            prenomReferent = document.getElementById('modal_prenom_referent') || document.querySelector('[name="prenom_referent"]');
        }
        
        if (nomReferent && prenomReferent && nomReferent.value && prenomReferent.value) {
            searchInput.value = `${nomReferent.value} ${prenomReferent.value}`;
            this.enableReferentFields(contractIndex, false);
        }
    }

    /**
     * Active ou désactive les champs de référent
     * @param {number|null} contractIndex - L'index du contrat (si applicable)
     * @param {boolean} enable - Indique si les champs doivent être activés ou désactivés
     */
    enableReferentFields(contractIndex, enable) {
        let nomReferent, prenomReferent;
        
        if (contractIndex) {
            // Pour les contrats dans modal_add_data.html
            nomReferent = document.getElementById(`modal_nom_referent_${contractIndex}`);
            prenomReferent = document.getElementById(`modal_prenom_referent_${contractIndex}`);
        } else {
            // Pour le formulaire principal dans edit_contract.html
            nomReferent = document.getElementById('modal_nom_referent') || document.querySelector('[name="nom_referent"]');
            prenomReferent = document.getElementById('modal_prenom_referent') || document.querySelector('[name="prenom_referent"]');
        }
        
        if (nomReferent && prenomReferent) {
            if (enable) {
                nomReferent.readOnly = false;
                prenomReferent.readOnly = false;
                nomReferent.classList.remove('disabled-look');
                prenomReferent.classList.remove('disabled-look');
            } else {
                nomReferent.readOnly = true;
                prenomReferent.readOnly = true;
                nomReferent.classList.add('disabled-look');
                prenomReferent.classList.add('disabled-look');
            }
        }
    }

    /**
     * Sépare un terme de recherche en nom et prénom
     * @param {string} searchTerm - Le terme de recherche
     * @returns {Object} Un objet contenant le nom et le prénom
     */
    splitSearchTerm(searchTerm) {
        const parts = searchTerm.split(' ');
        if (parts.length === 1) {
            return { nom: parts[0], prenom: '' };
        } else {
            const prenom = parts.pop();
            const nom = parts.join(' ');
            return { nom, prenom };
        }
    }

    /**
     * Effectue la recherche de référents
     * @param {string} searchTerm - Le terme de recherche
     * @param {HTMLElement} inputElement - L'élément input de recherche
     * @param {HTMLElement} suggestionsElement - L'élément pour afficher les suggestions
     * @param {number|null} contractIndex - L'index du contrat (si applicable)
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
                // Ajouter la suggestion pour créer un nouveau référent
                const newReferentItem = document.createElement('div');
                newReferentItem.className = 'p-2 hover-bg-light cursor-pointer border-bottom';
                newReferentItem.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Ajouter un(e) nouvel(le) référent(e) : ' + searchTerm;
                
                newReferentItem.addEventListener('click', () => {
                    // Pré-remplir les champs avec le terme de recherche séparé
                    const { nom, prenom } = this.splitSearchTerm(searchTerm);
                    let nomReferent, prenomReferent;
                    
                    if (contractIndex) {
                        nomReferent = document.getElementById(`modal_nom_referent_${contractIndex}`);
                        prenomReferent = document.getElementById(`modal_prenom_referent_${contractIndex}`);
                    } else {
                        nomReferent = document.getElementById('modal_nom_referent') || document.querySelector('[name="nom_referent"]');
                        prenomReferent = document.getElementById('modal_prenom_referent') || document.querySelector('[name="prenom_referent"]');
                    }
                    
                    if (nomReferent && prenomReferent) {
                        nomReferent.value = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
                        prenomReferent.value = prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase();
                        // Désactiver les champs après les avoir remplis
                        this.enableReferentFields(contractIndex, false);
                    }
                    
                    inputElement.value = '';
                    suggestionsElement.style.display = 'none';
                });
                
                suggestionsElement.appendChild(newReferentItem);
                suggestionsElement.style.display = 'block';
            } else {
                // Afficher les référents existants
                data.forEach(referent => {
                    const div = document.createElement('div');
                    div.className = 'p-2 hover-bg-light cursor-pointer border-bottom';
                    div.textContent = `${referent.nom} ${referent.prenom}`;
                    
                    div.addEventListener('click', () => {
                        let nomReferent, prenomReferent;
                        
                        if (contractIndex) {
                            nomReferent = document.getElementById(`modal_nom_referent_${contractIndex}`);
                            prenomReferent = document.getElementById(`modal_prenom_referent_${contractIndex}`);
                        } else {
                            nomReferent = document.getElementById('modal_nom_referent') || document.querySelector('[name="nom_referent"]');
                            prenomReferent = document.getElementById('modal_prenom_referent') || document.querySelector('[name="prenom_referent"]');
                        }
                        
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

// Initialiser le gestionnaire de recherche de référents
const referentSearch = new ReferentSearch();
