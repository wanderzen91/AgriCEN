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
            
            // Ajouter un écouteur d'événement sur le champ SIRET dans edit_contract.html
            // pour vérifier si le SIRET existe déjà dans un autre contrat
            const siretInput = document.querySelector('[name="siret"]');
            if (siretInput && window.location.pathname.includes('edit_contract')) {
                // Sauvegarder la valeur initiale sur focus
                siretInput.addEventListener('focus', (e) => {
                    this.initialSiret = e.target.value;
                });
                siretInput.addEventListener('change', this.checkExistingContractBySiret.bind(this));
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
                // Vérifier si nous sommes sur la page modal_add_data.html et non sur edit_contract.html
                const isModalAddData = !window.location.pathname.includes('edit_contract');
                
                if (isModalAddData) {
                    // Afficher un message d'avertissement uniquement dans modal_add_data.html
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'alert alert-warning mt-2';
                    warningDiv.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i>L\'entreprise associée à ce n°SIRET existe déjà dans la base de données ! Seul la saisie d\'un nouveau contrat dans le champ "Partenariat CEN" est possible !';
                    
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
                }
                
                // Remplir tous les champs du formulaire avec les données existantes
                this.fillFormWithExistingData(data, form);
                
                // Mettre à jour le numéro de contrat en fonction du nombre de contrats existants
                this.updateContractNumber(data);
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
     * Remplit le formulaire avec les données existantes de la société
     * @param {Object} data - Les données de la société
     * @param {HTMLElement} form - Le formulaire à remplir
     */
    fillFormWithExistingData(data, form) {
        console.log("Remplissage du formulaire avec les données:", data);
        
        // Remplir le champ contact explicitement
        const contactInput = form.querySelector('[name="contact"]');
        if (contactInput && data.contact) {
            console.log("Remplissage du champ contact avec:", data.contact);
            contactInput.value = data.contact;
        }
        
        // Remplir les informations de l'agriculteur
        if (data.agriculteurs && data.agriculteurs.length > 0) {
            const agriculteur = data.agriculteurs[0];
            const nomAgriInput = form.querySelector('[name="nom_agri"]');
            const prenomAgriInput = form.querySelector('[name="prenom_agri"]');
            
            if (nomAgriInput && prenomAgriInput) {
                nomAgriInput.value = agriculteur.nom_agri || '';
                prenomAgriInput.value = agriculteur.prenom_agri || '';
            }
            
            // Si un champ de recherche d'agriculteur existe, le mettre à jour
            const searchAgriInput = form.querySelector('#search_agriculteur');
            if (searchAgriInput && agriculteur.nom_agri && agriculteur.prenom_agri) {
                searchAgriInput.value = `${agriculteur.nom_agri} ${agriculteur.prenom_agri}`;
            }
            
            // Si date de naissance est disponible
            const dateNaissanceInput = form.querySelector('[name="date_naissance"]');
            if (dateNaissanceInput && agriculteur.date_naissance) {
                dateNaissanceInput.value = agriculteur.date_naissance;
            }
        }
        
        // Remplir les types de production
        if (data.productions && data.productions.length > 0) {
            console.log("Données de production disponibles:", data.productions);
            
            const typeProductionSelect = form.querySelector('.type-production-select');
            const modeProductionInput = form.querySelector('[name="mode_production"]');
            
            if (typeProductionSelect && modeProductionInput) {
                // Sélectionner les types de production dans le select caché
                data.productions.forEach(production => {
                    const option = typeProductionSelect.querySelector(`option[value="${production.id_type_production}"]`);
                    if (option) {
                        option.selected = true;
                    }
                });
                
                // Mettre à jour le mode de production (utiliser le premier trouvé)
                if (data.productions[0].id_mode_production) {
                    modeProductionInput.value = data.productions[0].id_mode_production;
                }
                
                // Séparer les productions bio et conventionnelles
                const productionsBio = [];
                const productionsConv = [];
                
                data.productions.forEach(production => {
                    const option = typeProductionSelect.querySelector(`option[value="${production.id_type_production}"]`);
                    if (option) {
                        const productionInfo = {
                            id: production.id_type_production,
                            label: option.textContent,
                            mode: production.id_mode_production
                        };
                        
                        // Mode 1 = Bio, Mode 2 = Conventionnel
                        if (production.id_mode_production == 1) {
                            productionsBio.push(productionInfo);
                        } else {
                            productionsConv.push(productionInfo);
                        }
                    }
                });
                
                // Cacher les champs Tagify pour les types de production
                const bioTagifyContainer = form.querySelector('.type-production-bio-tagify').closest('.mb-3');
                const convTagifyContainer = form.querySelector('.type-production-conv-tagify').closest('.mb-3');
                
                // Créer et afficher les badges pour les productions bio
                if (productionsBio.length > 0) {
                    // Cacher le champ Tagify
                    const bioTagify = bioTagifyContainer.querySelector('.type-production-bio-tagify');
                    if (bioTagify) {
                        bioTagify.style.display = 'none';
                    }
                    
                    // Créer un conteneur pour les badges s'il n'existe pas déjà
                    let badgesContainer = bioTagifyContainer.querySelector('.production-badges-bio');
                    if (!badgesContainer) {
                        badgesContainer = document.createElement('div');
                        badgesContainer.className = 'production-badges-bio mt-2';
                        bioTagifyContainer.appendChild(badgesContainer);
                    } else {
                        badgesContainer.innerHTML = '';
                    }
                    
                    // Ajouter les badges
                    productionsBio.forEach(prod => {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-success me-2 mb-2';
                        badge.textContent = prod.label;
                        badgesContainer.appendChild(badge);
                    });
                }
                
                // Créer et afficher les badges pour les productions conventionnelles
                if (productionsConv.length > 0) {
                    // Cacher le champ Tagify
                    const convTagify = convTagifyContainer.querySelector('.type-production-conv-tagify');
                    if (convTagify) {
                        convTagify.style.display = 'none';
                    }
                    
                    // Créer un conteneur pour les badges s'il n'existe pas déjà
                    let badgesContainer = convTagifyContainer.querySelector('.production-badges-conv');
                    if (!badgesContainer) {
                        badgesContainer = document.createElement('div');
                        badgesContainer.className = 'production-badges-conv mt-2';
                        convTagifyContainer.appendChild(badgesContainer);
                    } else {
                        badgesContainer.innerHTML = '';
                    }
                    
                    // Ajouter les badges
                    productionsConv.forEach(prod => {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-secondary me-2 mb-2';
                        badge.textContent = prod.label;
                        badgesContainer.appendChild(badge);
                    });
                }
            }
        } else {
            console.log("Aucune donnée de production disponible");
        }
        
        // Remplir les produits finis si disponibles
        if (data.contrats && data.contrats.length > 0) {
            console.log("Données de contrats disponibles:", data.contrats);
            
            const produitFiniSelect = form.querySelector('#produit_fini');
            if (produitFiniSelect) {
                // Récupérer tous les produits finis uniques de tous les contrats
                const allProduitsFinis = [];
                data.contrats.forEach(contrat => {
                    if (contrat.produits_finis) {
                        console.log(`Produits finis pour contrat ${contrat.id_contrat}:`, contrat.produits_finis);
                        contrat.produits_finis.forEach(produitId => {
                            if (!allProduitsFinis.includes(produitId)) {
                                allProduitsFinis.push(produitId);
                            }
                        });
                    }
                });
                
                console.log("Produits finis uniques à sélectionner:", allProduitsFinis);
                
                // Sélectionner les produits finis
                allProduitsFinis.forEach(produitId => {
                    const option = produitFiniSelect.querySelector(`option[value="${produitId}"]`);
                    if (option) {
                        option.selected = true;
                    }
                });
                
                // Déclencher un événement de changement pour mettre à jour Tagify
                const event = new Event('change');
                produitFiniSelect.dispatchEvent(event);
                
                // Mettre à jour directement le champ Tagify si possible
                const tagifyInput = form.querySelector('#produit_fini_tagify');
                if (tagifyInput) {
                    console.log("Tentative de mise à jour directe du Tagify pour les produits finis");
                    
                    // Créer les tags au format attendu par Tagify
                    const tags = [];
                    Array.from(produitFiniSelect.selectedOptions).forEach(option => {
                        tags.push({
                            value: option.value,
                            label: option.textContent
                        });
                    });
                    
                    // Mettre à jour Tagify de façon différente selon si Tagify est déjà initialisé
                    if (tagifyInput._tagify) {
                        tagifyInput._tagify.removeAllTags();
                        tagifyInput._tagify.addTags(tags);
                    } else {
                        // Si Tagify n'est pas encore initialisé, essayer de mettre directement la valeur
                        const tagValues = tags.map(tag => tag.label).join(', ');
                        tagifyInput.value = tagValues;
                        
                        // Essayer de créer un événement d'input pour déclencher l'initialisation de Tagify
                        const inputEvent = new Event('input', { bubbles: true });
                        tagifyInput.dispatchEvent(inputEvent);
                    }
                }
            }
        } else {
            console.log("Aucun contrat disponible dans data.contrats");
        }
    }
    
    /**
     * Met à jour le numéro de contrat en fonction du nombre de contrats existants
     * @param {Object} data - Les données de la société
     */
    updateContractNumber(data) {
        // Mettre à jour le numéro de contrat en fonction du nombre de contrats existants
        if (data.contrats) {
            const contractTitle = document.querySelector('#contrat h5');
            if (contractTitle) {
                const nextContractNumber = data.contrats.length + 1;
                contractTitle.textContent = `Contrat #${nextContractNumber}`;
                
                // Ajouter un message d'information à côté du titre du contrat
                const contractTitleContainer = contractTitle.parentElement;
                
                // Vérifier si un message existe déjà pour éviter les doublons
                const existingInfo = contractTitleContainer.querySelector('.alert-info');
                if (existingInfo) {
                    existingInfo.remove();
                }
                
                // Créer le message d'information
                const infoDiv = document.createElement('div');
                infoDiv.className = 'alert alert-info mt-2';
                infoDiv.innerHTML = `<i class="bi bi-info-circle-fill me-2"></i>Vous vous apprêtez à associer un ${nextContractNumber}${this.getOrdinalSuffix(nextContractNumber)} contrat à la société ${data.nom_societe}. Veuillez remplir les champs ci-dessous.`;
                
                // Insérer le message après le titre du contrat
                contractTitle.insertAdjacentElement('afterend', infoDiv);
            }
        }
    }
    
    /**
     * Retourne le suffixe ordinal en français pour un nombre
     * @param {Number} number - Le nombre
     * @returns {String} Le suffixe ordinal
     */
    getOrdinalSuffix(number) {
        if (number === 1) {
            return 'er';
        } else {
            return 'ème';
        }
    }
    
    /**
     * Verrouille les champs du formulaire selon le contexte de la page
     * - Pour modal_add_data.html: verrouille tous les champs sauf ceux dans l'onglet contrat-tab
     * - Pour edit_contract.html: verrouille uniquement la section "Informations Entreprise"
     * @param {HTMLElement} form - Le formulaire contenant les champs
     */
    lockFieldsExceptContractTab(form) {
        // Si aucun formulaire n'est fourni, utiliser le formulaire principal
        const targetForm = form || document.getElementById('addForm');
        if (!targetForm) return;

        // Détecter la page actuelle
        const isEditContractPage = window.location.pathname.includes('edit_contract');
        
        if (isEditContractPage) {
            // Pour edit_contract.html: verrouiller uniquement la section "Informations Entreprise"
            const entrepriseSection = document.querySelector('.card-header:has(h5:contains("Informations Entreprise"))');
            
            // Utiliser la méthode alternative si :has n'est pas supporté
            let entrepriseCard;
            document.querySelectorAll('.card-header h5').forEach(h5 => {
                if (h5.textContent.includes('Informations Entreprise')) {
                    entrepriseCard = h5.closest('.card');
                }
            });
            
            if (entrepriseCard) {
                // Verrouiller tous les champs de saisie dans cette section
                const inputElements = entrepriseCard.querySelectorAll('input, select, textarea');
                inputElements.forEach(input => {
                    // Ne pas verrouiller le champ SIRET et le bouton de recherche
                    if (input.name === 'siret' || input.name === 'fetch_sirene') {
                        return;
                    }
                    
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
                
                // Désactiver les boutons dans cette section sauf le bouton de recherche SIRET
                const buttons = entrepriseCard.querySelectorAll('button:not([name="fetch_sirene"])');
                buttons.forEach(button => {
                    button.setAttribute('disabled', true);
                });
                
                // Ajouter un message d'information
                const infoDiv = document.createElement('div');
                infoDiv.className = 'alert alert-info mt-2';
                infoDiv.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i>Les informations de l\'entreprise sont verrouillées car elles proviennent de la base SIRENE.';
                
                // Insérer le message après la section entreprise si ce n'est pas déjà fait
                if (!entrepriseCard.querySelector('.alert-info')) {
                    entrepriseCard.querySelector('.card-body').appendChild(infoDiv);
                }
            }
        } else {
            // Pour modal_add_data.html: verrouiller tous les champs sauf ceux dans l'onglet contrat-tab
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
    
    // Variable pour stocker le dernier SIRET vérifié
    lastCheckedSiret = null;
    
    // Variable pour empêcher les vérifications simultanées
    isCheckingContract = false;
    
    /**
     * Vérifie si un SIRET est déjà associé à un contrat existant
     * Si oui, propose de rediriger vers ce contrat
     * @param {Event} event - L'événement de changement du champ SIRET
     */
    async checkExistingContractBySiret(event) {
        const siret = event.target.value.trim();
        
        // Vérifier que le SIRET a la bonne longueur
        if (siret.length !== 14) {
            return;
        }
        
        // Éviter les vérifications simultanées ou répétées du même SIRET
        if (this.isCheckingContract || siret === this.lastCheckedSiret) {
            console.log('Vérification déjà en cours ou SIRET déjà vérifié:', siret);
            return;
        }
        
        // Marquer comme en cours de vérification
        this.isCheckingContract = true;
        this.lastCheckedSiret = siret;
        
        // Récupérer l'ID du contrat actuel depuis l'URL
        const currentUrl = window.location.pathname;
        const currentContractId = currentUrl.split('/').pop();
        
        console.log(`Vérification du SIRET ${siret} pour le contrat ${currentContractId}`);
        
        // Fermer toute alerte SweetAlert existante
        if (Swal.isVisible()) {
            Swal.close();
            // Attendre que l'alerte soit fermée
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        try {
            // Afficher un indicateur de chargement
            Swal.fire({
                title: 'Vérification du SIRET...',
                text: 'Veuillez patienter...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Appeler l'API pour vérifier si le SIRET existe déjà
            const response = await fetch(`/api/check_existing_contract_by_siret/${siret}`);
            
            // Vérifier si la réponse est OK
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Réponse API:', data);
            
            // Fermer l'indicateur de chargement
            Swal.close();
            
            // Attendre que l'alerte soit fermée
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Si le SIRET est associé à un contrat existant différent du contrat actuel
            if (data.exists && data.contract_id != currentContractId) {
                // Demander confirmation à l'utilisateur
                await Swal.fire({
                    title: 'Contrat existant détecté',
                    text: `Un contrat existe déjà avec ce SIRET (${data.nom_societe}). Souhaitez-vous éditer ce contrat existant à la place ?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Oui, éditer ce contrat',
                    cancelButtonText: 'Annuler',
                    allowOutsideClick: false
                }).then((result) => {
                    const siretInput = document.querySelector('[name="siret"]');
                    if (result.isConfirmed) {
                        // Rediriger vers le contrat existant
                        window.location.href = `/edit_contract/${data.contract_id}`;
                    } else {
                        // Si Annuler, restaurer la valeur initiale du SIRET
                        if (siretInput && typeof this.initialSiret !== 'undefined') {
                            siretInput.value = this.initialSiret;
                        }
                        // Permettre une nouvelle vérification sur le même SIRET
                        this.lastCheckedSiret = undefined;
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du SIRET:', error);
            
            // Fermer toute alerte existante
            if (Swal.isVisible()) {
                Swal.close();
                // Attendre que l'alerte soit fermée
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // Afficher un message d'erreur convivial
            await Swal.fire({
                title: 'Erreur',
                text: 'Impossible de vérifier ce SIRET. Veuillez réessayer ou contacter l\'administrateur.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            // Marquer comme terminé
            this.isCheckingContract = false;
        }
    }
}

// Initialiser le gestionnaire SIRET
const siretHandler = new SiretHandler();
