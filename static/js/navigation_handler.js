/**
 * navigation_handler.js
 * Fonctions pour gérer la navigation entre les pages de l'application
 */


window.NavigationHandler = {};

/**
 * Gestion du retour intelligent (retour à la page précédente ou redirection vers la carte)
 * Cette fonction vérifie s'il y a une page précédente dans l'historique de navigation
 * et y retourne si elle existe, sinon redirige vers la page de carte principale
 */
NavigationHandler.goBackOrRedirect = function() {
    if (document.referrer && document.referrer !== window.location.href) {
        history.back(); // Retour à la page précédente si elle existe
    } else {
        // La redirection vers la carte est gérée dans chaque template qui utilise cette fonction
        // car l'URL de la page de carte doit être générée côté serveur avec url_for
        if (window.mapPageUrl) {
            window.location.href = window.mapPageUrl;
        } else {
            console.error("URL de la page de carte non définie");
        }
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Rechercher tous les boutons de retour sur la page
    const backButtons = document.querySelectorAll('.back-button, #backButton');
    
    // Ajouter l'événement à chaque bouton trouvé
    backButtons.forEach(function(button) {
        button.addEventListener('click', NavigationHandler.goBackOrRedirect);
    });
});
