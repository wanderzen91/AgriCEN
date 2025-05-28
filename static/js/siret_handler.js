/**
 * Gestionnaire SIRET - Script unifié pour la gestion des fonctionnalités SIRET
 * Fonctionne à la fois pour edit_contract.html et modal_add_data.html
 */
class SiretHandler {
    constructor() {
        this.initEventListeners();
    }

    /**
     * Initialise les écouteurs d'événements pour les boutons SIRET
     */
    initEventListeners() {
        // Attendre que le DOM soit complètement chargé
        document.addEventListener('DOMContentLoaded', () => {
            // Trouver tous les boutons d'actualisation SIRET dans le document
            const fetchButtons = document.querySelectorAll('[name="fetch_sirene"]');
            
            if (fetchButtons.length > 0) {
                
                fetchButtons.forEach(button => {
                    button.addEventListener('click', this.handleFetchSirene.bind(this));
                });
            } else {
                console.warn('Aucun bouton SIRET trouvé dans la page');
            }
        });
    }

    /**
     * Gère le clic sur le bouton de récupération des données SIRET
     * @param {Event} event - L'événement de clic
     */
    async handleFetchSirene(event) {
        event.preventDefault();

        // Trouver le champ SIRET le plus proche du bouton cliqué ou dans le formulaire parent
        const form = event.target.closest('form');
        const siretInput = form ? form.querySelector('[name="siret"]') : document.querySelector('[name="siret"]');
        
        if (!siretInput) {
            console.error('Champ SIRET non trouvé');
            return;
        }

        const siret = siretInput.value.trim();
        if (!siret) {
            Swal.fire({
                icon: "warning",
                title: "Attention",
                text: "Veuillez saisir un numéro SIRET valide"
            });
            return;
        }

        try {
            // Afficher un indicateur de chargement
            Swal.fire({
                title: 'Chargement...',
                text: 'Récupération des données SIRET en cours',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await fetch("/api/siret", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ siret })
            });

            const data = await response.json();
            
            // Fermer l'indicateur de chargement
            Swal.close();

            if (data.error) {
                console.error('Erreur SIRET:', data.error);
                Swal.fire({
                    icon: "error",
                    title: "Erreur",
                    text: data.error
                });
                return;
            }

            // Champs à mettre à jour
            const fieldsToUpdate = [
                'nom_societe', 
                'adresse_etablissement', 
                'tranche_effectif', 
                'categorie_juridique', 
                'activite_principale'
            ];

            // Mettre à jour les champs du formulaire
            fieldsToUpdate.forEach(field => {
                const element = form ? form.querySelector(`[name="${field}"]`) : document.querySelector(`[name="${field}"]`);
                if (element) {
                    // Utiliser la valeur de data[field] si elle existe, sinon utiliser data.denomination pour nom_societe
                    let value = data[field];
                    if (field === 'nom_societe' && !value && data.denomination) {
                        value = data.denomination;
                    }
                    element.value = value || "Non renseigné";
                }
            });

            // Vérifier si des données supplémentaires sont disponibles dans la base de données
            if (data.exists_in_db) {
                // Afficher un message d'avertissement pour informer l'utilisateur
                const warningDiv = document.createElement('div');
                warningDiv.className = 'alert alert-warning mt-2';
                warningDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>L\'entreprise associée à ce n°SIRET existe déjà dans la base de données, certains champs sont donc verrouillés !';
                
                // Insérer le message après le champ SIRET
                const siretFormGroup = siretInput.closest('.mb-3');
                if (siretFormGroup) {
                    // Vérifier si un message existe déjà pour éviter les doublons
                    const existingWarning = siretFormGroup.querySelector('.alert-warning');
                    if (existingWarning) {
                        existingWarning.remove();
                    }
                    siretFormGroup.appendChild(warningDiv);
                    
                    // Verrouiller tous les champs à l'exception de ceux dans l'onglet contrat-tab
                    this.lockFieldsExceptContractTab(form);
                }
                
                // Si des agriculteurs sont associés, les afficher
                if (data.agriculteurs && data.agriculteurs.length > 0) {
                    const agriculteur = data.agriculteurs[0];
                    const nomAgriInput = document.querySelector('[name="nom_agri"]');
                    const prenomAgriInput = document.querySelector('[name="prenom_agri"]');
                    
                    if (nomAgriInput && prenomAgriInput) {
                        nomAgriInput.value = agriculteur.nom_agri || '';
                        prenomAgriInput.value = agriculteur.prenom_agri || '';
                    }
                    
                    // Si un champ de recherche d'agriculteur existe, le mettre à jour
                    const searchAgriInput = document.getElementById('search_agriculteur');
                    if (searchAgriInput && agriculteur.nom_agri && agriculteur.prenom_agri) {
                        searchAgriInput.value = `${agriculteur.nom_agri} ${agriculteur.prenom_agri}`;
                    }
                }
            }

            Swal.fire({
                icon: "success",
                title: "Succès",
                text: "Les données ont été récupérées avec succès."
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des données SIRET:', error);
            Swal.fire({
                icon: "error",
                title: "Erreur serveur",
                text: "Une erreur s'est produite lors de la récupération des données."
            });
        }
    }

    /**
     * Verrouille tous les champs du formulaire sauf ceux dans l'onglet contrat-tab
     * @param {HTMLElement} form - Le formulaire contenant les champs
     */
    lockFieldsExceptContractTab(form) {
        // Si aucun formulaire n'est fourni, utiliser le formulaire principal
        const targetForm = form || document.getElementById('addForm');
        if (!targetForm) return;

        // Sélectionner tous les onglets sauf l'onglet contrat
        const tabsToLock = ['#infos-general', '#exploitation'];
        
        tabsToLock.forEach(tabId => {
            const tabPane = document.querySelector(tabId);
            if (tabPane) {
                // Verrouiller tous les champs de saisie dans cet onglet
                const inputElements = tabPane.querySelectorAll('input, select, textarea');
                inputElements.forEach(input => {
                    // Ne pas verrouiller les champs cachés ou les boutons
                    if (input.type !== 'hidden' && input.type !== 'button' && input.type !== 'submit') {
                        input.setAttribute('readonly', true);
                        
                        // Pour les selects, on les désactive car readonly ne fonctionne pas bien avec eux
                        if (input.tagName === 'SELECT') {
                            input.setAttribute('disabled', true);
                        }
                        
                        // Ajouter une classe pour indiquer visuellement que le champ est verrouillé
                        input.classList.add('bg-light');
                    }
                });
                
                // Désactiver également les champs Tagify s'ils existent
                const tagifyInputs = tabPane.querySelectorAll('.tagify');
                tagifyInputs.forEach(tagify => {
                    tagify.classList.add('disabled');
                    // Ajouter un style pour montrer que c'est désactivé
                    tagify.style.pointerEvents = 'none';
                    tagify.style.opacity = '0.7';
                });
                
                // Désactiver les boutons dans ces onglets
                const buttons = tabPane.querySelectorAll('button:not([data-bs-toggle="tab"])');
                buttons.forEach(button => {
                    button.setAttribute('disabled', true);
                });
            }
        });
        
        // Afficher un message pour indiquer que seul l'onglet Partenariat CEN est modifiable
        const contractTab = document.querySelector('#contrat-tab');
        if (contractTab) {
            contractTab.classList.add('text-success', 'fw-bold');
            // Ajouter une icône de déverrouillage si elle n'existe pas déjà
            if (!contractTab.querySelector('.bi-unlock')) {
                contractTab.innerHTML = '<i class="bi bi-unlock me-1"></i>' + contractTab.innerHTML;
            }
        }
    }
}

// Initialiser le gestionnaire SIRET
const siretHandler = new SiretHandler();
