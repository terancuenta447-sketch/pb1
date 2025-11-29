/**
 * Módulo: ScoreEngine
 * Categoría: processing
 * Motor de puntuación para variantes de flashcards
 */

const ScoreEngine = {
        normalize(value, min = 0, max = 1) {
            if (max === min) return 0;
            return Math.max(0, Math.min(1, (value - min) / (max - min)));
        },
        overlapScore(content, chunkText) {
            if (!content || !chunkText) return 0;
            const chunkTokens = new Set(chunkText.toLowerCase().split(/\W+/).filter(Boolean));
            const contentTokens = content.toLowerCase().split(/\W+/).filter(Boolean);
            if (!contentTokens.length || !chunkTokens.size) return 0;
            const matches = contentTokens.filter(tok => chunkTokens.has(tok));
            return this.normalize(matches.length / contentTokens.length, 0, 0.6);
        },
        lengthScore(answer) {
            if (!answer) return 0;
            const len = answer.length;
            if (len < 80) return this.normalize(len, 0, 80) * 0.5;
            if (len > 400) return this.normalize(500 - len, 0, 100);
            return 1;
        },
        formatScore(content) {
            if (!content) return 0;
            let score = 0;
            if (/pregunta:/i.test(content)) score += 0.4;
            if (/respuesta:/i.test(content)) score += 0.4;
            if (/relevancia:/i.test(content)) score += 0.2;
            if (/\n- /.test(content)) score += 0.1;
            return Math.min(1, score);
        },
        scoreVariant({ card, rawContent, chunkText }, weights) {
            const overlap = this.overlapScore(rawContent, chunkText) * (weights.weightOverlap ?? 0.5);
            const length = this.lengthScore(card?.answer) * (weights.weightLength ?? 0.2);
            const format = this.formatScore(rawContent) * (weights.weightFormat ?? 0.3);
            return overlap + length + format;
        }
    };

// Exports
export { ScoreEngine };
export default ScoreEngine;
