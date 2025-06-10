/**
 * date_format_handler.js
 * Script pour corriger le format des dates (DD-MM-YYYY → YYYY-MM-DD) pour les autres contrats d'une même société
 * pour les champs de type date dans les formulaires
 */

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour convertir le format de date
    function reformatDateValue(dateField) {
        if (!dateField || !dateField.value) return;
        
        // Si la valeur existe et correspond au format DD-MM-YYYY
        const match = dateField.value.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (match) {
            const day = match[1];
            const month = match[2];
            const year = match[3];
            // Format YYYY-MM-DD pour l'attribut value des champs date HTML5
            dateField.value = `${year}-${month}-${day}`;
        }
    }
    
    // Appliquer aux champs de date
    document.querySelectorAll('.date-input').forEach(reformatDateValue);
    
});
