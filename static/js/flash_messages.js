    // Masquer les alertes après 10 secondes
    setTimeout(function() {
        let flashMessages = document.getElementById('flash-messages');
        if (flashMessages) {
            flashMessages.style.transition = 'opacity 3s ease-out';
            flashMessages.style.opacity = '0';
            setTimeout(() => flashMessages.remove(), 2000); 
        }
    }, 10000);

