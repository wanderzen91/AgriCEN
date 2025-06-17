/**
 * form_validator.js
 * Script pour valider les champs Tagify avant la soumission du formulaire
 */

document.addEventListener('DOMContentLoaded', function() {
    const addForm = document.getElementById('addForm');
    
    if (addForm) {
        // Ajouter un gestionnaire d'événements pour valider avant la soumission
        addForm.addEventListener('submit', function(event) {
            // Valider les champs Tagify
            const isValid = validateTagifyFields();
            
            // Si la validation échoue, empêcher la soumission du formulaire
            if (!isValid) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
    
    // Fonction pour valider tous les champs Tagify requis
    function validateTagifyFields() {
        let isValid = true;
        
        // Valider le champ Type de Production
        const typeProductionBioTagify = document.querySelector('.type-production-bio-tagify');
        const typeProductionConvTagify = document.querySelector('.type-production-conv-tagify');
        const typeProductionSelect = document.querySelector('.type-production-select');

        // Valider les types de production (soit bio, soit conventionnel doit être rempli)
        if ((typeProductionBioTagify || typeProductionConvTagify) && typeProductionSelect) {
            const bioTagifyInstance = typeProductionBioTagify ? typeProductionBioTagify._tagify : null;
            const convTagifyInstance = typeProductionConvTagify ? typeProductionConvTagify._tagify : null;
            
            const bioHasValues = bioTagifyInstance && bioTagifyInstance.value && bioTagifyInstance.value.length > 0;
            const convHasValues = convTagifyInstance && convTagifyInstance.value && convTagifyInstance.value.length > 0;
            
            if (!bioHasValues && !convHasValues) {
                showError(typeProductionBioTagify || typeProductionConvTagify, "Veuillez sélectionner au moins un type de production");
                isValid = false;
            } else {
                hideError(typeProductionBioTagify || typeProductionConvTagify);
            }
        }
        
        // Valider le champ Produits Finis
        const produitFiniTagify = document.getElementById('produit_fini_tagify');
        const produitFiniSelect = document.getElementById('produit_fini');
        
        if (produitFiniTagify && produitFiniSelect) {
            const tagifyInstance = produitFiniTagify._tagify;
            if (!tagifyInstance || !tagifyInstance.value || tagifyInstance.value.length === 0) {
                showError(produitFiniTagify, "Veuillez sélectionner au moins un produit fini");
                isValid = false;
            } else {
                hideError(produitFiniTagify);
            }
        }
        
        // Valider le champ Types de Milieu
        const typeMilieuTagify = document.querySelector('.type-milieu-tagify');
        const typeMilieuSelect = document.querySelector('.type-milieu-select');
        
        if (typeMilieuTagify && typeMilieuSelect) {
            const tagifyInstance = typeMilieuTagify._tagify;
            if (!tagifyInstance || !tagifyInstance.value || tagifyInstance.value.length === 0) {
                showError(typeMilieuTagify, "Veuillez sélectionner au moins un type de milieu");
                isValid = false;
            } else {
                hideError(typeMilieuTagify);
            }
        }
        
        return isValid;
    }
    
    // Fonction pour afficher un message d'erreur sous un champ
    function showError(element, message) {
        // Supprimer tout message d'erreur existant
        hideError(element);
        
        // Créer et ajouter le message d'erreur
        const errorDiv = document.createElement('div');
        errorDiv.className = 'tagify-error-message text-danger';
        errorDiv.textContent = message;
        
        // Ajouter la classe error au conteneur parent pour le style
        element.classList.add('is-invalid');
        
        // Ajouter le message d'erreur après l'élément
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
    }
    
    // Fonction pour cacher un message d'erreur
    function hideError(element) {
        // Supprimer la classe error
        element.classList.remove('is-invalid');
        
        // Supprimer tout message d'erreur existant
        const existingError = element.parentNode.querySelector('.tagify-error-message');
        if (existingError) {
            existingError.remove();
        }
    }
});
