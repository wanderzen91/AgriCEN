/**
 * form_validator.js
 * Ce fichier contient les fonctions de validation du formulaire d'ajout de données
 * et gère l'affichage des messages d'erreur pour les champs Tagify.
 */

// Créer un objet global pour éviter les conflits de noms
window.FormValidator = {};

// Fonction pour vérifier si un champ Tagify est vide
FormValidator.isTagifyEmpty = function(tagifyInstance) {
    // Si l'instance n'existe pas ou n'est pas initialisée
    if (!tagifyInstance) return true;
    // Si la valeur n'existe pas ou est un tableau vide
    if (!tagifyInstance.value || !Array.isArray(tagifyInstance.value) || tagifyInstance.value.length === 0) return true;
    return false;
};

// Fonction pour valider les champs Tagify requis
FormValidator.validateTagifyFields = function() {
    let errors = [];
    
    // Vérifier le champ "Types de production"
    // Nous devons vérifier la combinaison des deux champs (bio et conventionnel)
    let typeProductionBioEmpty = true;
    let typeProductionConvEmpty = true;
    
    // Vérifier si les instances existent et ont des valeurs
    if (window.typeProductionBioTagify && window.typeProductionBioTagify.value && 
        Array.isArray(window.typeProductionBioTagify.value) && window.typeProductionBioTagify.value.length > 0) {
        typeProductionBioEmpty = false;
    }
    
    if (window.typeProductionConvTagify && window.typeProductionConvTagify.value && 
        Array.isArray(window.typeProductionConvTagify.value) && window.typeProductionConvTagify.value.length > 0) {
        typeProductionConvEmpty = false;
    }
    
    // Si les deux types de production sont vides, c'est une erreur
    if (typeProductionBioEmpty && typeProductionConvEmpty) {
        errors.push("Veuillez sélectionner au moins un type de production (bio ou conventionnel)");
    }
    
    // Vérifier le champ "produits finis"
    if (FormValidator.isTagifyEmpty(window.produitFiniTagify)) {
        errors.push("Veuillez sélectionner au moins un produit fini");
    }
    
    // Vérifier le champ "types de milieux"
    if (FormValidator.isTagifyEmpty(window.typeMilieuTagify)) {
        errors.push("Veuillez sélectionner au moins un type de milieu");
    }
    
    return errors;
};

// Fonction principale pour valider le formulaire avant soumission
FormValidator.validateForm = function(event) {
    // Vérifier les champs Tagify
    const errors = FormValidator.validateTagifyFields();
    
    // S'il y a des erreurs, afficher un popup et empêcher la validation du formulaire
    if (errors.length > 0) {
        event.preventDefault();
        
        // Créer un message d'erreur formaté pour le popup
        let errorMessage = "<ul>";
        errors.forEach(error => {
            errorMessage += `<li>${error}</li>`;
        });
        errorMessage += "</ul>";
        
        // Afficher le message d'erreur avec SweetAlert2 si disponible
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: "error",
                title: "Validation impossible",
                html: errorMessage,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        } else {
            // Fallback en cas d'absence de SweetAlert2
            alert(errors.join('\n'));
        }
        
        return false;
    }
    
    return true;
};

// Ajouter un gestionnaire d'événements pour initialiser la validation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', FormValidator.validateForm);
    }
});
