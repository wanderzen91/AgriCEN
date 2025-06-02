/**
 * form_handler.js
 * Ce fichier regroupe les fonctions liées à la gestion du formulaire modal d'ajout de données
 */


// Créer un objet global pour éviter les conflits de noms
window.FormHandler = {};

// Fonction pour réinitialiser le formulaire
FormHandler.resetForm = function() {
    try {
        // Stocker les valeurs des champs de l'onglet "Informations générales"
        const nomSiteElement = document.getElementById('modal_nom_site');
        const codeSiteElement = document.getElementById('modal_code_site');
        
        const nomSite = nomSiteElement ? nomSiteElement.value : '';
        const codeSite = codeSiteElement ? codeSiteElement.value : '';
        
        // Supprimer l'input caché id_societe s'il existe
        const idSocieteInput = document.querySelector('[name="id_societe"]');
        if (idSocieteInput) idSocieteInput.remove();
        
        // Réactiver tous les champs avant de les réinitialiser
        // Champs de base
        const dateSignature = document.querySelector('[name="date_signature"]');
        if (dateSignature) dateSignature.disabled = false;
        
        const datePriseEffet = document.querySelector('[name="date_prise_effet"]');
        if (datePriseEffet) datePriseEffet.disabled = false;
        
        const dateFin = document.querySelector('[name="date_fin"]');
        if (dateFin) dateFin.disabled = false;
        
        const surfContractualisee = document.querySelector('[name="surf_contractualisee"]');
        if (surfContractualisee) surfContractualisee.disabled = false;
        
        const contact = document.querySelector('[name="contact"]');
        if (contact) {
            contact.disabled = false;
            contact.readOnly = false;
            contact.classList.remove('bg-light');
        }
        
        // Champs du référent
        const nomReferent = document.getElementById('modal_nom_referent');
        if (nomReferent) nomReferent.disabled = false;
        
        const prenomReferent = document.getElementById('modal_prenom_referent');
        if (prenomReferent) prenomReferent.disabled = false;
        
        // Champs de l'agriculteur
        const nomAgri = document.getElementById('modal_nom_agri');
        if (nomAgri) {
            nomAgri.disabled = false;
            nomAgri.readOnly = false;
            nomAgri.classList.remove('bg-light');
        }
        
        const prenomAgri = document.getElementById('modal_prenom_agri');
        if (prenomAgri) {
            prenomAgri.disabled = false;
            prenomAgri.readOnly = false;
            prenomAgri.classList.remove('bg-light');
        }
        
        const dateNaissance = document.querySelector('[name="date_naissance"]');
        if (dateNaissance) {
            dateNaissance.disabled = false;
            dateNaissance.readOnly = false;
            dateNaissance.classList.remove('bg-light');
        }
        
        // Champ SIRET et bouton de recherche
        const siretElement = document.querySelector('[name="siret"]');
        if (siretElement) {
            siretElement.disabled = false;
            siretElement.readOnly = false;
            siretElement.classList.remove('bg-light');
            siretElement.value = '';
        }
        
        // Réactiver le bouton de recherche SIRET
        const fetchSireneButton = document.querySelector('[name="fetch_sirene"]');
        if (fetchSireneButton) {
            fetchSireneButton.disabled = false;
        }
        
        // Réinitialiser le formulaire
        const addForm = document.getElementById('addForm');
        if (addForm) addForm.reset();
        
        // Restaurer les valeurs des champs de l'onglet "Informations générales"
        if (nomSiteElement) nomSiteElement.value = nomSite;
        if (codeSiteElement) codeSiteElement.value = codeSite;
        
        // Réinitialiser les sélecteurs Tagify
        if (typeof produitFiniTagify !== 'undefined' && produitFiniTagify) {
            produitFiniTagify.setReadonly(false);
            produitFiniTagify.removeAllTags();
        }
        if (typeof typeMilieuTagify !== 'undefined' && typeMilieuTagify) {
            typeMilieuTagify.setReadonly(false);
            typeMilieuTagify.removeAllTags();
        }
        if (typeof typeContratTagify !== 'undefined' && typeContratTagify) {
            typeContratTagify.setReadonly(false);
            typeContratTagify.removeAllTags();
        }
        
        // Réactiver et réinitialiser les champs Tagify pour les types de production
        const typeProductionBioTagify = document.querySelector('.type-production-bio-tagify');
        if (typeProductionBioTagify && typeProductionBioTagify._tagify) {
            typeProductionBioTagify._tagify.setReadonly(false);
            typeProductionBioTagify._tagify.removeAllTags();
            typeProductionBioTagify.style.pointerEvents = '';
            typeProductionBioTagify.style.opacity = '';
        }
        
        const typeProductionConvTagify = document.querySelector('.type-production-conv-tagify');
        if (typeProductionConvTagify && typeProductionConvTagify._tagify) {
            typeProductionConvTagify._tagify.setReadonly(false);
            typeProductionConvTagify._tagify.removeAllTags();
            typeProductionConvTagify.style.pointerEvents = '';
            typeProductionConvTagify.style.opacity = '';
        }
        
        // Réactiver tous les champs Tagify
        const allTagifyInputs = document.querySelectorAll('.tagify');
        allTagifyInputs.forEach(tagify => {
            tagify.classList.remove('disabled');
            tagify.style.pointerEvents = '';
            tagify.style.opacity = '';
        });
        
        // Supprimer toutes les entrées de production sauf la première
        const productionContainer = document.getElementById('production-container');
        if (productionContainer) {
            while (productionContainer.children.length > 1) {
                productionContainer.removeChild(productionContainer.lastChild);
            }
            
            // Réinitialiser et réactiver la première entrée de production
            const firstEntry = productionContainer.firstElementChild;
            if (firstEntry) {
                const modeSelect = firstEntry.querySelector('.mode-production');
                if (modeSelect) {
                    modeSelect.disabled = false;
                    modeSelect.selectedIndex = 0;
                }
                
                // Réinitialiser et réactiver Tagify pour les types de production
                const typeProductionInput = firstEntry.querySelector('.type-production-tagify');
                if (typeProductionInput && typeProductionInput._tagify) {
                    typeProductionInput._tagify.setReadonly(false);
                    typeProductionInput._tagify.removeAllTags();
                }
                
                // Réactiver le bouton de suppression
                const removeButton = firstEntry.querySelector('.remove-production');
                if (removeButton) removeButton.disabled = false;
            }
        }
        
        // Réactiver le bouton d'ajout de production
        const addProductionBtn = document.getElementById('add-production');
        if (addProductionBtn) addProductionBtn.disabled = false;
        
        // Réactiver la recherche d'agriculteur et de référent
        const searchAgriculteur = document.getElementById('search_agriculteur');
        if (searchAgriculteur) {
            searchAgriculteur.disabled = false;
            searchAgriculteur.readOnly = false;
            searchAgriculteur.classList.remove('bg-light');
            searchAgriculteur.value = '';
        }
        
        const searchReferent = document.getElementById('search_referent');
        if (searchReferent) {
            searchReferent.disabled = false;
            searchReferent.readOnly = false;
            searchReferent.classList.remove('bg-light');
            searchReferent.value = '';
        }
        
        // Réactiver tous les selects qui ont été désactivés
        const allSelects = document.querySelectorAll('select');
        allSelects.forEach(select => {
            select.disabled = false;
        });
        
        // Réactiver tous les boutons qui ont été désactivés
        const allButtons = document.querySelectorAll('button:not([data-bs-toggle="tab"])');
        allButtons.forEach(button => {
            if (button.id !== 'reset-form-button' && 
                button.className.indexOf('btn-close') === -1 && 
                button.className.indexOf('btn-secondary') === -1) {
                button.disabled = false;
            }
        });
        
        // Supprimer les alertes d'avertissement ajoutées par le siret_handler
        const warningAlerts = document.querySelectorAll('.alert-warning');
        warningAlerts.forEach(alert => {
            alert.remove();
        });
        
        // Supprimer les alertes d'information ajoutées par le siret_handler
        const infoAlerts = document.querySelectorAll('.alert-info');
        infoAlerts.forEach(alert => {
            alert.remove();
        });
        
        // Réinitialiser les champs cachés
        const idAgriculteur = document.getElementById('id_agriculteur');
        if (idAgriculteur) idAgriculteur.value = '';
        
        const idReferent = document.getElementById('id_referent');
        if (idReferent) idReferent.value = '';
        
        // Réinitialiser le titre du contrat
        const contractTitle = document.querySelector('#contrat h5');
        if (contractTitle) {
            contractTitle.textContent = 'Contrat #1';
        }
        
        // Réinitialiser l'apparence des onglets
        const contractTab = document.querySelector('#contrat-tab');
        if (contractTab) {
            contractTab.classList.remove('text-success', 'fw-bold');
            // Supprimer l'icône de déverrouillage si elle existe
            const unlockIcon = contractTab.querySelector('.bi-unlock');
            if (unlockIcon) {
                contractTab.innerHTML = contractTab.innerHTML.replace('<i class="bi bi-unlock me-1"></i>', '');
            }
        }
        
        // Afficher un message de confirmation si SweetAlert2 est disponible
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: "success",
                title: "Formulaire réinitialisé",
                text: "Vous pouvez maintenant saisir de nouvelles données.",
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        } else {
            console.log("Formulaire réinitialisé");
            alert("Formulaire réinitialisé");
        }
        
    } catch (error) {
        console.error("Erreur dans la fonction resetForm():", error);
        alert("Une erreur s'est produite lors de la réinitialisation du formulaire: " + error.message);
    }
};

// Ajouter un gestionnaire d'événements pour initialiser les fonctionnalités au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    
    // Attacher la fonction resetForm au bouton de réinitialisation
    const resetButton = document.getElementById('reset-form-button');
    if (resetButton) {
        resetButton.addEventListener('click', FormHandler.resetForm);
    }
});
