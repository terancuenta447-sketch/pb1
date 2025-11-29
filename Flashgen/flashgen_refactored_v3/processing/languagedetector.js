/**
 * Módulo: LanguageDetector
 * Categoría: processing
 * Detección automática de idioma del texto
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { State } from '../core/state.js';

const LanguageDetector = {
        /**
         * Detecta el idioma del texto usando patrones y heurísticas
         * @param {string} text - Texto a analizar
         * @returns {string} - Idioma detectado
         */
        detect(text) {
            if (!text || text.trim().length < 20) {
                return 'Desconocido';
            }
            
            const sample = text.substring(0, 500).toLowerCase();
            const scores = {};
            
            // Patrones para cada idioma
            const patterns = {
                'Español': [
                    /\b(el|la|los|las|un|una|de|del|que|en|y|a|por|con|para|su|al)¸/g,
                    /ñ/g,
                    /á|é|í|ó|ú/g,
                    /\b(está|será|había|tiene|puede|debe|hace)¸/g
                ],
                'Inglés': [
                    /\b(the|a|an|is|are|was|were|have|has|had|will|would|can|could|should)¸/g,
                    /\b(and|or|but|if|when|where|what|who|how)¸/g,
                    /ing\b/g,
                    /\b(this|that|these|those)¸/g
                ],
                'Francés': [
                    /\b(le|la|les|un|une|de|du|que|en|et|à|pour|avec|dans|sur)¸/g,
                    /ç/g,
                    /è|é|ê|ë/g,
                    /\b(est|était|sera|avoir|faire)¸/g
                ],
                'Alemán': [
                    /\b(der|die|das|den|dem|des|ein|eine|und|oder|aber|ist|sind|war|waren)¸/g,
                    /ü|ö|ä|ß/g,
                    /\b(haben|sein|werden|kann|muss)¸/g
                ],
                'Italiano': [
                    /\b(il|lo|la|i|gli|le|un|uno|una|di|del|che|e|a|per|con|da)¸/g,
                    /\b(è|sono|era|erano|ha|hanno|può|deve)¸/g,
                    /zione\b/g
                ],
                'Portugués': [
                    /\b(o|a|os|as|um|uma|de|do|da|que|em|e|para|com|por)¸/g,
                    /ã|õ/g,
                    /\b(é|são|era|tem|pode|deve)¸/g,
                    /ção\b/g
                ]
            };
            
            // Calcular scores
            for (const [lang, langPatterns] of Object.entries(patterns)) {
                scores[lang] = 0;
                for (const pattern of langPatterns) {
                    const matches = sample.match(pattern);
                    scores[lang] += matches ? matches.length : 0;
                }
            }
            
            // Encontrar idioma con mayor score
            let maxScore = 0;
            let detectedLang = 'Desconocido';
            
            for (const [lang, score] of Object.entries(scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    detectedLang = lang;
                }
            }
            
            // Si el score es muy bajo, es desconocido
            if (maxScore < 3) {
                return 'Desconocido';
            }
            
            DebugLogger.log(`🌐 Idioma detectado: ${detectedLang} (score: ${maxScore})`, 'info');
            return detectedLang;
        },
        
        /**
         * Detecta el idioma y actualiza el estado si la autodetección está activada
         * @param {string} text - Texto a analizar
         * @returns {string} - Idioma detectado o configurado
         */
        getSourceLanguage(text) {
            if (State.config.autoDetectLanguage) {
                return this.detect(text);
            }
            // Si no hay autodetección, usar idioma por defecto o desconocido
            return 'Desconocido';
        }
    };

// Exports
export { LanguageDetector };
export default LanguageDetector;
