/**
 * edit_contract_tagify.js
 * Gestion des champs Tagify dans le formulaire d'édition de contrat
 */

// Créer un namespace dédié
window.EditContractTagify = {};

// Fonction principale d'initialisation des champs Tagify
EditContractTagify.initialize = function() {
    console.log('Initialisation des champs Tagify dans edit_contract.html');
    
    // Récupérer les mappings d'émojis depuis window (définis dans base.html)
    const emojiTypeProductionMapping = window.emojiTypeProductionMapping || {};
    const emojiProduitFiniMapping = window.emojiProduitFiniMapping || {};
    const emojiTypeMilieuMapping = window.emojiTypeMilieuMapping || {};
    
    // Vérifier la disponibilité des mappings
    console.log('Mappings d\'emojis disponibles:', {
        typeProduction: Object.keys(emojiTypeProductionMapping).length,
        produitFini: Object.keys(emojiProduitFiniMapping).length,
        typeMilieu: Object.keys(emojiTypeMilieuMapping).length
    });

    // Créer les options pour chaque select
    this.createTagifyOptions('#produit_fini_tagify', '#produit_fini', emojiProduitFiniMapping);
    this.createTagifyOptions('#type_milieu_tagify', '#type_milieu', emojiTypeMilieuMapping);
    this.createTagifyOptions('.type-production-bio-tagify', '.type-production-bio-select', emojiTypeProductionMapping);
    this.createTagifyOptions('.type-production-conv-tagify', '.type-production-conv-select', emojiTypeProductionMapping);
    
    // Ajouter l'événement de soumission du formulaire
    this.setupFormSubmission();
};

// Fonction pour trouver un emoji en utilisant une correspondance insensible à la casse
EditContractTagify.findEmojiCaseInsensitive = function(label, emojiMapping) {
    if (!label || !emojiMapping) return '';
    
    const textLower = label.toLowerCase().trim();
    
    // Recherche directe en minuscules
    if (emojiMapping[textLower]) {
        return emojiMapping[textLower];
    }
    
    // Parcourir les clés pour une correspondance insensible à la casse
    for (const key in emojiMapping) {
        if (key.toLowerCase() === textLower) {
            return emojiMapping[key];
        }
    }
    
    return '';
};

// Fonction pour créer les options Tagify
EditContractTagify.createTagifyOptions = function(tagifySelector, selectSelector, emojiMapping) {
    const tagifyInput = document.querySelector(tagifySelector);
    const selectElement = document.querySelector(selectSelector);
    
    if (!tagifyInput || !selectElement) {
        console.error(`Élément non trouvé: ${tagifySelector} ou ${selectSelector}`);
        return null;
    }
    
    console.log(`Initialisation de Tagify pour ${tagifySelector}`);
    
    // Créer la liste blanche à partir des options du select
    const whitelist = Array.from(selectElement.options).map(option => {
        const value = option.value;
        const label = option.textContent.trim();
        const emoji = this.findEmojiCaseInsensitive(label, emojiMapping);
        
        return {
            value: value,
            label: label,
            emoji: emoji
        };
    });
    
    // Log pour déboguer
    console.log(`Whitelist pour ${tagifySelector}:`, whitelist);
    
    // Initialiser Tagify
    const tagify = new Tagify(tagifyInput, {
        whitelist: whitelist,
        enforceWhitelist: true,
        dropdown: {
            maxItems: 50,
            enabled: 0,
            closeOnSelect: false
        },
        templates: {
            tag: tagData => `
                <tag title="${tagData.label}" contenteditable="false" class="tagify__tag">
                    <span class="tagify__tag-text">${tagData.emoji || ""} ${tagData.label}</span>
                    <x class="tagify__tag__removeBtn"></x>
                </tag>`,
            dropdownItem: suggestion => `
                <div class="tagify__dropdown__item">
                    ${suggestion.emoji || ""} ${suggestion.label}
                </div>`
        }
    });
    
    // Ajouter les tags initiaux pour les options déjà sélectionnées
    const initialValues = Array.from(selectElement.selectedOptions).map(option => {
        const label = option.textContent.trim();
        return {
            value: option.value,
            label: label,
            emoji: this.findEmojiCaseInsensitive(label, emojiMapping)
        };
    });
    
    if (initialValues.length > 0) {
        console.log(`Valeurs initiales pour ${tagifySelector}:`, initialValues);
        tagify.addTags(initialValues);
    }
    
    // Synchroniser avec le select caché
    this.syncTagifyWithHidden(tagify, selectElement);
    
    return tagify;
};

// Synchroniser Tagify avec un champ caché
EditContractTagify.syncTagifyWithHidden = function(tagify, selectElement) {
    tagify.on("change", e => {
        // Désélectionner toutes les options
        Array.from(selectElement.options).forEach(option => {
            option.selected = false;
        });
        
        // Sélectionner les options correspondant aux tags
        if (tagify.value && tagify.value.length) {
            tagify.value.forEach(tag => {
                const option = selectElement.querySelector(`option[value="${tag.value}"]`);
                if (option) option.selected = true;
            });
        }
        
        console.log(`Valeurs sélectionnées dans ${selectElement.id}:`, 
            Array.from(selectElement.selectedOptions).map(o => o.value));
    });
};

// Fonction pour préparer les données de production au format JSON attendu par le backend
EditContractTagify.prepareProductionData = function() {
    console.log('Préparation des données de production...');
    const productionData = [];
    
    // Récupérer les données de production Bio
    const bioSelect = document.querySelector('.type-production-bio-select');
    console.log('Select Bio trouvé:', !!bioSelect);
    
    if (bioSelect) {
        const selectedBioOptions = Array.from(bioSelect.selectedOptions).map(option => option.value);
        console.log('Options Bio sélectionnées:', selectedBioOptions);
        if (selectedBioOptions.length > 0) {
            productionData.push({
                mode_production: "1", // 1 pour Bio
                type_production: selectedBioOptions
            });
            console.log('Données Bio ajoutées au tableau productionData');
        }
    }
    
    // Récupérer les données de production Conventionnelle
    const convSelect = document.querySelector('.type-production-conv-select');
    console.log('Select Conventionnel trouvé:', !!convSelect);
    
    if (convSelect) {
        const selectedConvOptions = Array.from(convSelect.selectedOptions).map(option => option.value);
        console.log('Options Conventionnelles sélectionnées:', selectedConvOptions);
        if (selectedConvOptions.length > 0) {
            productionData.push({
                mode_production: "2", // 2 pour Conventionnel
                type_production: selectedConvOptions
            });
            console.log('Données Conventionnelles ajoutées au tableau productionData');
        }
    }
    
    console.log('Données de production finales:', productionData);
    return productionData;
};

// Fonction pour configurer la soumission du formulaire
EditContractTagify.setupFormSubmission = function() {
    console.log('Configuration de la soumission du formulaire...');
    const form = document.querySelector('form');
    
    if (!form) {
        console.error('Formulaire non trouvé');
        return;
    }
    
    console.log('Formulaire trouvé:', form);
    
    form.addEventListener('submit', function(event) {
        console.log('Événement de soumission du formulaire déclenché');
        
        // Inspecter les selects de type de production avant de collecter les données
        const bioSelect = document.querySelector('.type-production-bio-select');
        const convSelect = document.querySelector('.type-production-conv-select');
        
        console.log('Status des selects de production:');
        console.log('- Bio select trouvé:', !!bioSelect);
        if (bioSelect) {
            console.log('  - Options sélectionnées:', bioSelect.selectedOptions.length);
            console.log('  - Valeurs:', Array.from(bioSelect.selectedOptions).map(opt => opt.value));
        }
        
        console.log('- Conv select trouvé:', !!convSelect);
        if (convSelect) {
            console.log('  - Options sélectionnées:', convSelect.selectedOptions.length);
            console.log('  - Valeurs:', Array.from(convSelect.selectedOptions).map(opt => opt.value));
        }
        
        // Préparer les données de production
        const productionData = EditContractTagify.prepareProductionData();
        
        // Vérifier qu'au moins un type de production est sélectionné
        if (productionData.length === 0) {
            console.warn('ATTENTION: Aucun type de production sélectionné');
            // Empêcher la soumission si aucun type de production n'est sélectionné
            // event.preventDefault();
            // return false;
        } else {
            console.log('Données de production préparées avec succès:', JSON.stringify(productionData));
        }
        
        // Vérifier si un champ all_productions existe déjà
        const existingInput = form.querySelector('input[name="all_productions"]');
        if (existingInput) {
            console.log('Champ all_productions existant trouvé, mise à jour de la valeur');
            existingInput.value = JSON.stringify(productionData);
        } else {
            console.log('Création d\'un nouveau champ all_productions');
            // Ajouter les données au formulaire
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'all_productions';
            hiddenInput.value = JSON.stringify(productionData);
            form.appendChild(hiddenInput);
            console.log('Champ all_productions ajouté au formulaire');
        }
    });
    
    console.log('Gestionnaire d\'événement de soumission ajouté au formulaire');
};

// Initialiser les champs Tagify lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de EditContractTagify');
    EditContractTagify.initialize();
});