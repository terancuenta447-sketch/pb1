/**
 * Módulo: EntityUtils
 * Categoría: processing
 * Utilidades para extracción y protección de entidades
 */

import { DebugLogger } from '../ui/debug_logger.js';

const EntityUtils = {
        tokenPrefix: '__FG_ENTITY_',
        escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        protectPhrases(text, phrases = []) {
            let protectedText = text;
            const replacements = [];
            const seen = new Set();
            phrases.forEach((phrase) => {
                if (!phrase || phrase.length < 2) return;
                const normalized = phrase.toLowerCase();
                if (seen.has(normalized)) return;
                seen.add(normalized);
                const regex = new RegExp(this.escapeRegExp(phrase), 'gi');
                protectedText = protectedText.replace(regex, (match) => {
                    const token = `${this.tokenPrefix}${replacements.length}__`;
                    replacements.push({ token, value: match });
                    return token;
                });
            });
            return { text: protectedText, replacements };
        },
        restoreTokens(text, replacements = []) {
            if (!text) return '';
            return replacements.reduce((acc, { token, value }) => acc.replace(new RegExp(this.escapeRegExp(token), 'g'), value), text);
        },
        extract(text, config = {}) {
            const entities = {
                people: [],
                places: [],
                dates: [],
                quotes: []
            };
            if (typeof nlp === 'undefined') {
                DebugLogger.log('⚠️ NLP (Compromise.js) no disponible; omitiendo extracción de entidades', 'warning');
                return { text, entities, replacements: [] };
            }
            const doc = nlp(text);
            const safeDocArray = (methodName, label) => {
                if (typeof doc[methodName] !== 'function') {
                    DebugLogger.log(`⚠️ Plugin NLP '${label}' no disponible; omitiendo ${label}`, 'warning');
                    return [];
                }
                try {
                    return doc[methodName]().out('array') || [];
                } catch (error) {
                    DebugLogger.log(`⚠️ Error extrayendo ${label}: ${error.message}`, 'warning');
                    return [];
                }
            };

            if (config.extractPeople !== false) {
                entities.people = safeDocArray('people', 'personas');
            }
            if (config.extractPlaces !== false) {
                entities.places = safeDocArray('places', 'lugares');
            }
            if (config.extractDates !== false) {
                entities.dates = safeDocArray('dates', 'fechas');
            }
            if (config.extractQuotes !== false) {
                const minLen = config.minQuoteLength || 30;
                entities.quotes = text.match(/"[^"]+"/g)?.filter(q => q.length >= minLen) || [];
            }
            const phrases = [
                ...(entities.people || []),
                ...(entities.places || []),
                ...(entities.dates || []),
                ...(entities.quotes || [])
            ];
            const { text: protectedText, replacements } = this.protectPhrases(text, phrases);
            return { text: protectedText, entities, replacements };
        }
    };

// Exports
export { EntityUtils };
export default EntityUtils;
