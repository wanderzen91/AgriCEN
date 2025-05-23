/**
 * form_handler.js
 * Ce fichier regroupe les fonctions liées à la gestion du formulaire modal d'ajout de données
 */

console.log('Form Handler loaded!');

// Créer un objet global pour éviter les conflits de noms
window.FormHandler = {};

// Fonction pour réinitialiser le formulaire
FormHandler.resetForm = function() {
    try {
        console.log("Début de la fonction resetForm()");
        
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
        if (contact) contact.disabled = false;
        
        // Champs du référent
        const nomReferent = document.getElementById('modal_nom_referent');
        if (nomReferent) nomReferent.disabled = false;
        
        const prenomReferent = document.getElementById('modal_prenom_referent');
        if (prenomReferent) prenomReferent.disabled = false;
        
        // Champs de l'agriculteur
        const nomAgri = document.getElementById('modal_nom_agri');
        if (nomAgri) nomAgri.disabled = false;
        
        const prenomAgri = document.getElementById('modal_prenom_agri');
        if (prenomAgri) prenomAgri.disabled = false;
        
        const dateNaissance = document.querySelector('[name="date_naissance"]');
        if (dateNaissance) dateNaissance.disabled = false;
        
        // Champ SIRET
        const siretElement = document.getElementById('siret');
        if (siretElement) siretElement.disabled = false;
        
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
            searchAgriculteur.value = '';
        }
        
        const searchReferent = document.getElementById('search_referent');
        if (searchReferent) {
            searchReferent.disabled = false;
            searchReferent.value = '';
        }
        
        // Vider le champ SIRET
        if (siretElement) siretElement.value = '';
        
        // Réinitialiser les champs cachés
        const idAgriculteur = document.getElementById('id_agriculteur');
        if (idAgriculteur) idAgriculteur.value = '';
        
        const idReferent = document.getElementById('id_referent');
        if (idReferent) idReferent.value = '';
        
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
        
        console.log("Fin de la fonction resetForm() - succès");
    } catch (error) {
        console.error("Erreur dans la fonction resetForm():", error);
        alert("Une erreur s'est produite lors de la réinitialisation du formulaire: " + error.message);
    }
};

// Ajouter un gestionnaire d'événements pour initialiser les fonctionnalités au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Form Handler: DOMContentLoaded event fired');
    
    // Attacher la fonction resetForm au bouton de réinitialisation
    const resetButton = document.getElementById('reset-form-button');
    if (resetButton) {
        console.log('Form Handler: Reset button found, attaching event listener');
        resetButton.addEventListener('click', FormHandler.resetForm);
    }
});
