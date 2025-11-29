/**
 * Módulo: ClozeEngine
 * Categoría: processing
 * Extraído de: Flashgen.js (líneas 3933-4020)
 * Generado automáticamente: 2025-11-28 11:46:46
 * 
 * Dependencias: DebugLogger
 */

import { DebugLogger } from '../ui/debug_logger.js';

const ClozeEngine = {
    extractEntities(answer) {
        if (typeof nlp === 'undefined') return [];
        try {
            const doc = nlp(answer);
            const people = doc.people().out('array') || [];
            const places = doc.places().out('array') || [];
            const dates = doc.dates().out('array') || [];
            return [...people, ...places, ...dates].filter(Boolean);
        } catch (error) {
            DebugLogger.log(`⚠️ Error extrayendo entidades para cloze: ${error.message}`, 'warning');
            return [];
        }
    },
    extractNumbers(answer) {
        return answer.match(/\b\d{4}\b|\b\d+\s*(años|km|millones|%|kg)\b/gi) || [];
    },
    extractKeywords(answer) {
        return Array.from(new Set(
            (answer.match(/\b[A-ZÁÉÍÓÚ][a-záéíóú]+\b/g) || []).filter(word => word.length > 4)
        ));
    },
    createCloze(answer, phrase) {
        if (!phrase) return null;
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (!regex.test(answer)) return null;
        return answer.replace(regex, `{{c1::${phrase}}}`);
    },
    apply(cards, config = {}) {
        if (!Array.isArray(cards) || cards.length === 0) return cards;
        const maxVariants = config.maxVariantsPerCard || 2;
        const clozeEntities = config.clozeEntities !== false;
        const clozeNumbers = !!config.clozeNumbers;
        const clozeDates = !!config.clozeDates;
        const clozeKeywords = !!config.clozeKeywords;
        const enhanced = [];
        for (const card of cards) {
            const variants = [card];
            const answer = card.answer || '';
            if (answer.length < 10) {
                enhanced.push(...variants);
                continue;
            }
            if (clozeEntities) {
                this.extractEntities(answer).forEach(entity => {
                    if (!entity) return;
                    const cloze = this.createCloze(answer, entity);
                    if (cloze) {
                        variants.push({
                            ...card,
                            id: `${card.id}_cloze_entity_${entity}`,
                            question: cloze,
                            type: 'cloze'
                        });
                    }
                });
            }
            if (clozeNumbers || clozeDates) {
                this.extractNumbers(answer).forEach(num => {
                    const cloze = this.createCloze(answer, num);
                    if (cloze) {
                        variants.push({
                            ...card,
                            id: `${card.id}_cloze_num_${num}`,
                            question: cloze,
                            type: 'cloze'
                        });
                    }
                });
            }
            if (clozeKeywords) {
                this.extractKeywords(answer).forEach(keyword => {
                    const cloze = this.createCloze(answer, keyword);
                    if (cloze) {
                        variants.push({
                            ...card,
                            id: `${card.id}_cloze_kw_${keyword}`,
                            question: cloze,
                            type: 'cloze'
                        });
                    }
                });
            }
            enhanced.push(...variants.slice(0, 1 + maxVariants));
        }
        return enhanced;
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.ClozeEngine = ClozeEngine;
}

// Exports
export { ClozeEngine };
export default ClozeEngine;
