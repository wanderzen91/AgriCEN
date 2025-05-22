// Gestionnaire pour la fonctionnalité SIRET
document.addEventListener('DOMContentLoaded', function() {
    // Trouver le bouton d'actualisation SIRET
    const fetchSireneBtn = document.querySelector('[name="fetch_sirene"]');
    
    if (fetchSireneBtn) {
        console.log('Bouton SIRET trouvé, ajout de l\'écouteur d\'événement');
        
        fetchSireneBtn.addEventListener("click", async function(event) {
            event.preventDefault();
            console.log('Bouton SIRET cliqué');

            const siret = document.querySelector('[name="siret"]').value.trim();
            if (!siret) {
                console.log('SIRET vide');
                return;
            }

            try {
                console.log('Envoi de la requête SIRET:', siret);
                const response = await fetch("/api/siret", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ siret })
                });

                const data = await response.json();
                if (data.error) {
                    console.error('Erreur SIRET:', data.error);
                    Swal.fire({ icon: "error", title: "Erreur", text: data.error });
                } else {
                    console.log('Données SIRET reçues:', data);
                    ['nom_societe', 'adresse_etablissement', 'tranche_effectif', 'categorie_juridique', 'activite_principale'].forEach(field => {
                        const element = document.querySelector(`[name="${field}"]`);
                        if (element) {
                            element.value = data[field] || "Non renseigné";
                        }
                    });
                    Swal.fire({ icon: "success", title: "Succès", text: "Les données ont été récupérées avec succès." });
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données SIRET:', error);
                Swal.fire({ icon: "error", title: "Erreur serveur", text: "Une erreur s'est produite lors de la récupération des données." });
            }
        });
    } else {
        console.warn('Bouton SIRET non trouvé');
    }
});
