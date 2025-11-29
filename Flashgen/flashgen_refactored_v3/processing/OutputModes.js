/**
 * Módulo: OutputModes
 * Categoría: processing
 * Modos de salida para diferentes tipos de generación
 */

import { LanguageDetector } from './languagedetector.js';
import { State } from '../core/state.js';

const OutputModes = {
        word_translation: {
            parseStrategy: 'single_line',
            buildPrompts(chunkText) {
                return {
                    system: 'Eres un traductor bilingüe. Devuelve SOLO la palabra traducida al español.',
                    user: chunkText.trim()
                };
            },
            parse(content, sourceText) {
                const cleaned = (content || '').replace(/^[^:]*:\s*/, '').trim();
                const fallback = (content || '').trim();
                return {
                    question: (sourceText || '').trim(),
                    answer: cleaned || fallback,
                    type: 'basic'
                };
            }
        },
        sentence_translation: {
            parseStrategy: 'single_line',
            buildPrompts(chunkText, _metadata, outputConfig) {
                const source = LanguageDetector.getSourceLanguage(chunkText);
                const target = State.config.targetLanguage || 'Español';
                return {
                    system: `Eres un traductor experto de ${source} a ${target}.`,
                    user: `Traduce al ${target} (mantén sentido literal): ${chunkText.trim()}`
                };
            },
            parse(content, sourceText) {
                const cleaned = (content || '').replace(/^[^:]*:\s*/, '').trim();
                return {
                    question: sourceText || '',
                    answer: cleaned || (content || ''),
                    type: 'basic'
                };
            }
        },
        word_with_sentence: {
            parseStrategy: 'multifield',
            buildPrompts(chunkText, _metadata, outputConfig) {
                const source = LanguageDetector.getSourceLanguage(chunkText);
                const target = State.config.targetLanguage || 'Español';
                return {
                    system: `Genera traducción a ${target} y ejemplo contextual.`,
                    user: `Palabra: ${chunkText.trim()}\nFormato:\nTranslation: [${target.toLowerCase()}]\nExample (${source}): [oración natural]\nTranslation Example: [${target.toLowerCase()}]`
                };
            },
            parse(content, sourceText) {
                const lines = (content || '').split('\n').filter(line => line.trim());
                let translation = '';
                let example = '';
                let exampleTranslation = '';

                lines.forEach(line => {
                    const lower = line.toLowerCase();
                    if (lower.includes('translation example') || lower.includes('example translation')) {
                        exampleTranslation = line.replace(/^[^:]+:\s*/i, '').trim();
                    } else if (lower.includes('example')) {
                        example = line.replace(/^[^:]+:\s*/i, '').trim();
                    } else if (lower.includes('translation')) {
                        translation = line.replace(/^[^:]+:\s*/i, '').trim();
                    }
                });

                const answerParts = [];
                if (translation) answerParts.push(translation);
                if (example) answerParts.push(`Ejemplo: ${example}`);
                if (exampleTranslation) answerParts.push(`Traducción: ${exampleTranslation}`);

                return {
                    question: sourceText || '',
                    answer: answerParts.join('\n\n') || (content || ''),
                    type: 'basic'
                };
            }
        },
        sentence_generation: {
            parseStrategy: 'sentence_pair',
            buildPrompts(chunkText, _metadata, outputConfig) {
                const source = LanguageDetector.getSourceLanguage(chunkText);
                const target = State.config.targetLanguage || 'Español';
                return {
                    system: `Crea una oración en ${source} usando la palabra dada y tradúcela al ${target}.`,
                    user: `Palabra: ${chunkText.trim()}\nFormato:\nSentence (${source}): [oración]\nTranslation: [${target.toLowerCase()}]`
                };
            },
            parse(content, sourceText) {
                const lines = (content || '').split('\n').filter(line => line.trim());
                let sentence = '';
                let translation = '';

                lines.forEach(line => {
                    const lower = line.toLowerCase();
                    if (lower.includes('sentence') && !lower.includes('translation')) {
                        sentence = line.replace(/^[^:]+:\s*/i, '').trim();
                    } else if (lower.includes('translation')) {
                        translation = line.replace(/^[^:]+:\s*/i, '').trim();
                    }
                });

                return {
                    question: sentence || sourceText || '',
                    answer: translation || (content || ''),
                    type: 'basic'
                };
            }
        }
    };

// Exports
export { OutputModes };
export default OutputModes;
