/**
 * tagify_handler.js
 * Ce fichier regroupe toutes les fonctions liées à l'initialisation et la gestion des champs Tagify
 * pour les types de production, produits finis et types de milieu.
 */


// Vérifier que Tagify est disponible
if (typeof Tagify === 'undefined') {
    console.error('Tagify library not loaded! Make sure it is included before this script.');
}

// Créer un objet global pour éviter les conflits de noms
window.TagifyHandler = {};

// Fonction pour créer des choix avec des emojis
TagifyHandler.createChoicesWithIcons = function(choices, emojiMapping) {
    return choices.map(choice => {
        const emoji = emojiMapping[choice.label.toLowerCase()];
        return {
            ...choice,
            emoji: emoji || '❓'
        };
    });
};

// Fonction pour initialiser Tagify avec un template personnalisé incluant des émojis
TagifyHandler.initializeTagify = function(selector, choices, emojiMapping) {

    const input = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!input) {
        console.error('Input element not found for selector:', selector);
        return null;
    }
    
    // Vérifier si Tagify est déjà initialisé
    if (input._tagify) {
        return input._tagify;
    }

    try {
        const tagify = new Tagify(input, {
            whitelist: choices.map(choice => ({
                value: choice.value,
                label: choice.label,
                emoji: emojiMapping[choice.label] || emojiMapping[choice.label.toLowerCase()] || "❓"
            })),
            enforceWhitelist: true,
            dropdown: { 
                enabled: 0,
                maxItems: 1000
            },
            templates: {
                tag: tagData => `
                    <tag title="${tagData.label}" contenteditable="false" class="tagify__tag">
                        <span class="tagify__tag-text">${tagData.emoji} ${tagData.label}</span>
                        <x class="tagify__tag__removeBtn"></x>
                    </tag>`,
                dropdownItem: suggestion => `
                    <div class="tagify__dropdown__item">
                        ${suggestion.emoji} ${suggestion.label}
                    </div>`
            }
        });
                
        // Ajouter un gestionnaire d'événements pour afficher tous les tags au clic
        input.addEventListener('click', function() {
            tagify.dropdown.show.call(tagify);
        });
        
        // S'assurer que le dropdown s'ouvre également lors de la saisie
        tagify.on('input', function(e) {
            tagify.dropdown.show.call(tagify);
        });
        
        return tagify;
    } catch (error) {
        console.error("Error initializing Tagify:", error);
        return null;
    }
}

// Fonction pour synchroniser Tagify avec un champ caché
TagifyHandler.syncTagifyWithHidden = function(tagifyInstance, hiddenSelector) {
    
    if (!tagifyInstance) {
        console.error("Tagify instance not provided");
        return;
    }

    // Accepter soit un sélecteur CSS soit un élément DOM directement
    let hiddenInput;
    if (typeof hiddenSelector === 'string') {
        hiddenInput = document.querySelector(hiddenSelector);
    } else {
        hiddenInput = hiddenSelector;
    }
    
    if (!hiddenInput) {
        console.error(`Hidden input not found: ${hiddenSelector}`);
        return;
    }

    tagifyInstance.on('change', function(e) {
        
        // Vérifier si c'est un select multiple ou un input
        if (hiddenInput.tagName === 'SELECT' && hiddenInput.multiple) {
            // Pour les select multiples, mettre à jour les options sélectionnées
            const values = tagifyInstance.value.map(tag => tag.value);
            
            // D'abord, désélectionner toutes les options
            for (let option of hiddenInput.options) {
                option.selected = false;
            }
            
            // Ensuite, sélectionner les options correspondant aux valeurs
            for (let value of values) {
                for (let option of hiddenInput.options) {
                    if (option.value === value) {
                        option.selected = true;
                        break;
                    }
                }
            }
            
            // Déclencher un événement change pour que le formulaire détecte le changement
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
            // Pour les inputs simples ou les select simples, mettre à jour la valeur
            if (tagifyInstance.value.length > 0) {
                hiddenInput.value = tagifyInstance.value[0].value;
            } else {
                hiddenInput.value = '';
            }
                        
            // Déclencher un événement change pour que le formulaire détecte le changement
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

// Initialiser Tagify pour les types de production (bio et conventionnel)
TagifyHandler.initializeTypeProductionTagify = function() {
    
    // Initialiser les deux types de production
    const bioTagify = initializeTypeProductionBio();
    const convTagify = initializeTypeProductionConv();
    
    // Récupérer le champ caché original pour la validation du formulaire
    const originalTypeProductionSelect = document.querySelector('.type-production-select[name="type_production"]');
    
    if (originalTypeProductionSelect) {
        
        // Fonction pour mettre à jour le champ caché original
        const updateOriginalTypeProduction = function() {
            // Récupérer toutes les valeurs sélectionnées (bio et conventionnelle)
            const bioSelect = document.querySelector('.type-production-bio-select');
            const convSelect = document.querySelector('.type-production-conv-select');
            
            let selectedValues = [];
            
            // Ajouter les valeurs bio sélectionnées
            if (bioSelect) {
                Array.from(bioSelect.selectedOptions).forEach(option => {
                    selectedValues.push(option.value);
                });
            }
            
            // Ajouter les valeurs conventionnelles sélectionnées
            if (convSelect) {
                Array.from(convSelect.selectedOptions).forEach(option => {
                    selectedValues.push(option.value);
                });
            }
                        
            // Désélectionner toutes les options du select original
            Array.from(originalTypeProductionSelect.options).forEach(option => {
                option.selected = false;
            });
            
            // Sélectionner les options correspondantes dans le select original
            if (selectedValues.length > 0) {
                selectedValues.forEach(value => {
                    const option = Array.from(originalTypeProductionSelect.options).find(opt => opt.value === value);
                    if (option) {
                        option.selected = true;
                    }
                });
            } else {
                // Si aucune valeur n'est sélectionnée, sélectionner au moins la première option
                // pour éviter l'erreur de validation "This field is required"
                if (originalTypeProductionSelect.options.length > 0) {
                    originalTypeProductionSelect.options[0].selected = true;
                }
            }
            
            // Déclencher un événement de changement sur le select original
            originalTypeProductionSelect.dispatchEvent(new Event('change', { bubbles: true }));
        };
        
        // Configurer les écouteurs d'événements pour les deux champs Tagify
        if (bioTagify) {
            bioTagify.on('change', updateOriginalTypeProduction);
        }
        
        if (convTagify) {
            convTagify.on('change', updateOriginalTypeProduction);
        }
        
        // Appeler la fonction une fois au démarrage pour initialiser le champ
        setTimeout(updateOriginalTypeProduction, 100);
    } else {
        console.error('Original type_production select not found for validation');
    }
    
    return {
        bioTagify: bioTagify,
        convTagify: convTagify
    };
    
    // Fonction interne pour initialiser le champ des types de production bio
    function initializeTypeProductionBio() {
        const typeProductionBioInput = document.querySelector('.type-production-bio-tagify');
        const typeProductionBioSelect = document.querySelector('.type-production-bio-select');
        
        if (typeProductionBioInput && typeProductionBioSelect) {
            
            const typeProductionChoices = Array.from(typeProductionBioSelect.options).map(option => ({
                value: option.value,
                label: option.textContent
            }));
                        
            const tagify = TagifyHandler.initializeTagify(typeProductionBioInput, typeProductionChoices, window.emojiTypeProductionMapping);
            TagifyHandler.syncTagifyWithHidden(tagify, '.type-production-bio-select');
            return tagify;
        } else {
            console.error('Type production Bio Tagify elements not found');
            return null;
        }
    }
    
    // Fonction interne pour initialiser le champ des types de production conventionnelle
    function initializeTypeProductionConv() {
        const typeProductionConvInput = document.querySelector('.type-production-conv-tagify');
        const typeProductionConvSelect = document.querySelector('.type-production-conv-select');
        
        if (typeProductionConvInput && typeProductionConvSelect) {
            
            const typeProductionChoices = Array.from(typeProductionConvSelect.options).map(option => ({
                value: option.value,
                label: option.textContent
            }));
                        
            const tagify = TagifyHandler.initializeTagify(typeProductionConvInput, typeProductionChoices, window.emojiTypeProductionMapping);
            TagifyHandler.syncTagifyWithHidden(tagify, '.type-production-conv-select');
            return tagify;
        } else {
            console.error('Type production Conv Tagify elements not found');
            return null;
        }
    }
}

// Initialiser Tagify pour les produits finis
TagifyHandler.initializeProduitFiniTagify = function() {
    
    const produitFiniInput = document.getElementById('produit_fini_tagify');
    const produitFiniSelect = document.getElementById('produit_fini');
    
    if (produitFiniInput && produitFiniSelect) {
        const produitFiniChoices = Array.from(produitFiniSelect.options).map(option => ({
            value: option.value,
            label: option.textContent
        }));
        
        const tagify = TagifyHandler.initializeTagify(produitFiniInput, produitFiniChoices, window.emojiProduitFiniMapping);
        TagifyHandler.syncTagifyWithHidden(tagify, '#produit_fini');
        return tagify;
    } else {
        console.error("Produit fini Tagify elements not found");
        return null;
    }
}

// Initialiser Tagify pour les types de milieu

// Initialiser Tagify pour les types de milieu
TagifyHandler.initializeTypeMilieuTagify = function() {
    
    // Maintenant nous n'avons qu'un seul champ pour le type de milieu
    const typeMilieuInput = document.querySelector('.type-milieu-tagify');
    const typeMilieuSelect = document.querySelector('.type-milieu-select');
    
    if (typeMilieuInput && typeMilieuSelect) {
        
        // Créer des choix à partir du mapping global d'emojis
        const typeMilieuChoices = [];
        
        // D'abord, ajouter toutes les options du select
        Array.from(typeMilieuSelect.options).forEach(option => {
            typeMilieuChoices.push({
                value: option.value,
                label: option.textContent
            });
        });
                
        const tagify = TagifyHandler.initializeTagify(typeMilieuInput, typeMilieuChoices, window.emojiTypeMilieuMapping);
        
        // S'assurer que la synchronisation fonctionne correctement
        tagify.on('change', function(e) {
            
            // Désélectionner toutes les options actuelles
            Array.from(typeMilieuSelect.options).forEach(option => {
                option.selected = false;
            });
            
            // Sélectionner les options correspondant aux tags sélectionnés
            if (tagify.value && tagify.value.length > 0) {
                tagify.value.forEach(tag => {
                    const option = Array.from(typeMilieuSelect.options).find(opt => opt.value === tag.value || opt.textContent === tag.value);
                    if (option) {
                        option.selected = true;
                    }
                });
            }
            
            // Déclencher un événement de changement sur le select pour que le formulaire le détecte
            const event = new Event('change', { bubbles: true });
            typeMilieuSelect.dispatchEvent(event);
        });
        
        return tagify;
    } else {
        console.error('Type milieu Tagify elements not found');
        return null;
    }
}


// Ajouter un gestionnaire d'événements pour initialiser les Tagify au chargement de la page
document.addEventListener('DOMContentLoaded', function() {    
    // Initialiser les champs Tagify avec un léger délai pour s'assurer que le DOM est complètement chargé
    setTimeout(function() {
        // Initialiser les champs de type de production (bio et conventionnel)
        if (document.querySelector('.type-production-bio-tagify') || document.querySelector('.type-production-conv-tagify')) {
            const tagifyInstances = TagifyHandler.initializeTypeProductionTagify();
        } else if (document.querySelector('.type-production-tagify')) {
            // Compatibilité avec l'ancien format si nécessaire
            window.typeProductionTagify = TagifyHandler.initializeTypeProductionTagify();
        }
        
        // Initialiser le champ des produits finis
        if (document.getElementById('produit_fini_tagify')) {
            window.produitFiniTagify = TagifyHandler.initializeProduitFiniTagify();
        }
        
        // Initialiser le champ des types de milieu
        if (document.querySelector('.type-milieu-tagify')) {
            window.typeMilieuTagify = TagifyHandler.initializeTypeMilieuTagify();
        }
    }, 300); // Délai réduit pour une meilleure réactivité
});
