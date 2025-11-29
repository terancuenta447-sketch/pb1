/**
 * Módulo: ContextEngine
 * Categoría: processing
 * Motor de contextualización para chunks
 */

const ContextEngine = {
        summarizeContext(chunks, index, config = {}) {
            const window = config.contextWindow || 2;
            const includeCharacters = config.includeCharacters !== false;
            const includeEvents = config.includeEvents !== false;
            const includeThemes = !!config.includeThemes;
            const start = Math.max(0, index - window);
            const contextChunks = chunks.slice(start, index);
            const aggregate = {
                people: new Set(),
                events: [],
                themes: []
            };
            contextChunks.forEach(chunk => {
                if (includeCharacters && Array.isArray(chunk.entities?.people)) {
                    chunk.entities.people.forEach(person => aggregate.people.add(person));
                }
                if (includeEvents && chunk.metadata?.events) {
                    aggregate.events.push(chunk.metadata.events);
                }
                if (includeThemes && chunk.metadata?.themes) {
                    aggregate.themes.push(chunk.metadata.themes);
                }
            });
            return {
                people: Array.from(aggregate.people).join(', ') || 'N/A',
                events: aggregate.events.join(' | ') || 'Contexto no disponible',
                themes: aggregate.themes.join(', ') || 'N/A'
            };
        }
    };

// Exports
export { ContextEngine };
export default ContextEngine;
