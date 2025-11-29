/**
 * Módulo: DifficultyEngine
 * Categoría: processing
 * Motor de balance de dificultad para flashcards
 */

import { State } from '../core/state.js';
import { UI } from '../ui/ui.js';
import { DebugLogger } from '../ui/debug_logger.js';

const DifficultyEngine = {
        estimate(card, method = 'wordCount') {
            const answer = card.answer || '';
            switch (method) {
                case 'sentenceComplexity': {
                    const sentences = answer.split(/[.!?]/).filter(Boolean).length || 1;
                    return sentences * 10;
                }
                case 'entityDensity': {
                    const entitiesCount = (card.metadata?.entities?.people?.length || 0) +
                        (card.metadata?.entities?.places?.length || 0) +
                        (card.metadata?.entities?.dates?.length || 0);
                    return entitiesCount * 15;
                }
                case 'wordCount':
                default: {
                    const words = answer.split(/\s+/).filter(Boolean).length;
                    return words;
                }
            }
        },
        apply(config) {
            if (!config || !Array.isArray(State.flashcards) || State.flashcards.length === 0) return;
            const method = config.estimationMethod || 'wordCount';
            const scored = State.flashcards.map(card => ({ card, difficulty: this.estimate(card, method) }));
            scored.sort((a, b) => a.difficulty - b.difficulty);
            const tercile = Math.floor(scored.length / 3) || 1;
            const easy = scored.slice(0, tercile);
            const medium = scored.slice(tercile, tercile * 2);
            const hard = scored.slice(tercile * 2);
            const pick = (arr, count) => count > 0 ? arr.slice(0, Math.min(count, arr.length)) : [];
            const selection = [
                ...pick(easy, config.easyCount || tercile),
                ...pick(medium, config.mediumCount || tercile),
                ...pick(hard, config.hardCount || tercile)
            ];
            if (selection.length > 0) {
                State.flashcards = selection.map(entry => entry.card);
                UI.toast(`⚖️ Balance de dificultad aplicado (${selection.length} tarjetas)`, 'info');
                DebugLogger.log('⚖️ Balance de dificultad reordenó las tarjetas', 'info');
            }
            if (State.pipelineRuntime?.difficultyConfig) {
                delete State.pipelineRuntime.difficultyConfig;
            }
        }
    };

// Exports
export { DifficultyEngine };
export default DifficultyEngine;
