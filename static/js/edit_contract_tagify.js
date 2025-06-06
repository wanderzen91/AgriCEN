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

// Initialiser les champs Tagify lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM chargé, initialisation de EditContractTagify');
    EditContractTagify.initialize();
});