/**
 * Modulo: Estado Global
 * Categoria: core
 * Extraido de: Flashgen.js (lineas 5892-6123)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: resetPipeline
 * Dependencias: DebugLogger, State, UI
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { PipelineManager } from '../pipeline/pipeline_manager.js';
import { UI } from '../ui/ui.js';

    const MAX_CHAIN_STEPS = 500;

    const State = {
        config: {
            api: {
                profile: 'local',
                endpoint: 'http://127.0.0.1:8080/v1/chat/completions',
                key: '',
                model: 'local-model'
            },
            hyperparams: {
                temperature: 0.7,
                top_p: 0.9
            },
            hyperparamsPreset: 'balanced',
            features: {
                chain: false,
                preprocess: true,
                batch: true,
                autoQuality: true,
                fewShot: false,
                fewShotNegatives: true,
                negativeExamplesInline: false,
                chainOfThoughtPrompt: false,
                jsonSchemaMode: false,
                lexicalFilter: false
            },
            output: {
                type: 'standard'
            },
            autoDetectLanguage: true,
            targetLanguage: 'Español'
        },
        pipeline: {
            steps: [
                { id: 'extract-entities', name: 'Extraccion de Entidades', enabled: true, config: { extractPeople: true, extractPlaces: true, extractDates: true, extractQuotes: true, minQuoteLength: 30 } },
                { id: 'preprocess', name: 'Preprocesamiento', enabled: true, config: { removeReferences: true, filterUrls: true, normalizeSpaces: true, excludeBiblio: true } },
                { id: 'chunk', name: 'Chunking', enabled: true, config: { method: 'sentence', size: 500, overlap: 10, minSize: 100 } },
                { id: 'context-inject', name: 'Inyeccion de Contexto', enabled: true, config: { template: 'Contexto relevante:', includeCharacters: true, includeEvents: true, includeThemes: false, contextWindow: 2 } },
                { id: 'generate', name: 'Generacion LLM', enabled: true, config: { 
                    temperature: 0.7, 
                    topP: 0.9,
                    topK: 40,
                    maxTokens: 150, 
                    outputType: 'template', 
                    sourceLanguage: 'Ingles', 
                    ankiFormat: 'basic',
                    enableMemory: false,
                    memorySize: 4,
                    enableAgent: false,
                    agentTools: ['dictionary', 'web_search', 'calculator']
                } },
                { id: 'chain-refinement', name: 'Refinamiento LangChain', enabled: true, config: {
                    qualityThreshold: 70,
                    maxRefinements: 2,
                    enableAutoRefinement: true,
                    bypassQuality: false,
                    debugMode: false,
                    generateClozeVariants: false,
                    prompts: {
                        generate: {
                            system: 'Generador de flashcards. Crea flashcards concisas y precisas basadas en el texto.',
                            user: 'Genera una flashcard del siguiente texto:\n{text}'
                        },
                        evaluate: {
                            system: 'Evaluador de calidad. Analiza flashcards segun criterios de claridad, relevancia y concision.',
                            user: 'Evalua esta flashcard:\nQ: {question}\nA: {answer}\n\nPuntua de 0-100 y explica.'
                        },
                        refine: {
                            system: 'Refinador de flashcards. Mejora flashcards basandote en feedback especifico.',
                            user: 'Mejora esta flashcard segun el feedback:\nQ: {question}\nA: {answer}\nFeedback: {feedback}'
                        },
                        finalize: {
                            system: 'Finalizador. Consolida y formatea la mejor version de la flashcard.',
                            user: 'Consolida esta flashcard:\nQ: {question}\nA: {answer}'
                        }
                    }
                } },
                { id: 'quality', name: 'Control de Calidad', enabled: true, config: { threshold: 70, strict: true } },
                { id: 'difficulty-balance', name: 'Balance de Dificultad', enabled: true, config: { easyCount: 10, mediumCount: 10, hardCount: 10, estimationMethod: 'wordCount' } },
                { id: 'cloze-generator', name: 'Generador Cloze', enabled: true, config: { clozeEntities: true, clozeNumbers: true, clozeDates: true, clozeKeywords: false, maxVariantsPerCard: 2 } },
                { id: 'score', name: 'Re-ranking (Scorer)', enabled: true, config: { variants: 3, temperatures: [0.5, 0.7, 0.9], weightOverlap: 0.5, weightLength: 0.2, weightFormat: 0.3 } },
                { id: 'dedupe', name: 'Deduplicacion', enabled: false, config: {} }
            ],
            options: {
                chunkMethod: 'sentence',
                chunkSize: 300,
                chunkOverlap: 10,
                minChunkSize: 100,
                semanticThreshold: 0.75,
                qualityThreshold: 70,
                strictQuality: true,
                requireCitations: false,
                avoidGeneralizations: true,
                chainQualityThreshold: 70,
                maxRefinements: 2,
                enableAutoRefinement: true,
                showChainVisualization: true,
                chainDebugMode: false,
                chainBypassQuality: false,
                batchSize: 0,
                batchDelay: 200
            },
            resetPipeline() {
                State.pipeline.steps = [];
                State.pipeline.options = {
                    chunkMethod: 'langchain',
                    chunkSize: 500,
                    chunkOverlap: 10,
                    minChunkSize: 50,
                    semanticThreshold: 0.3,
                    extractionMethod: 'entities',
                    contextMethod: 'auto',
                    qualityThreshold: 0.7,
                    maxRefinements: 2
                };
                // Resetear flag de modificacion del usuario
                State.userModifiedChunkMethod = false;
                // ✅ FIX #14: Evitar imports circulares - usar callbacks
                if (typeof window !== 'undefined' && window.PipelineManagerCallback) {
                    window.PipelineManagerCallback.renderPipeline();
                }
                if (typeof UI !== 'undefined' && UI.toast) {
                    UI.toast('🔄 Pipeline reseteado');
                }
                DebugLogger.log('🔄 userModifiedChunkMethod reseteado a false', 'info');
            }
        },
        pipelineRuntime: {
            dedupePending: false,
            contextInjectConfig: null
        },
        userModifiedChunkMethod: false,
        cancelGeneration: false,
        templates: {},
        activeTemplate: null,
        flashcards: [],
        agentTasks: [],
        chainSteps: [],
        memory: [],
        stats: {
            total: 0,
            approved: 0,
            rejected: 0,
            pending: 0
        },
        customPipelines: [
            {
                id: 'preset-default',
                name: 'Estandar',
                description: 'Configuracion equilibrada para uso general',
                stepsConfig: [
                    { id: 'extract-entities', name: 'Extraccion de Entidades', enabled: true, order: 0 },
                    { id: 'preprocess', name: 'Preprocesamiento', enabled: true, order: 1 },
                    { id: 'chunk', name: 'Chunking', enabled: true, order: 2 },
                    { id: 'context-inject', name: 'Inyeccion de Contexto', enabled: true, order: 3 },
                    { id: 'generate', name: 'Generacion LLM', enabled: true, order: 4 },
                    { id: 'quality', name: 'Control de Calidad', enabled: true, order: 5 },
                    { id: 'difficulty-balance', name: 'Balance de Dificultad', enabled: true, order: 6 },
                    { id: 'cloze-generator', name: 'Generador Cloze', enabled: true, order: 7 },
                    { id: 'score', name: 'Re-ranking (Scorer)', enabled: true, order: 8 },
                    { id: 'dedupe', name: 'Deduplicacion', enabled: false, order: 9 }
                ],
                options: { chunkSize: 500, chunkOverlap: 10, qualityThreshold: 70, strictQuality: true },
                variables: {},
                apiConfig: { temperature: 0.7, top_p: 0.9, top_k: 40, max_tokens: 150 },
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 'preset-spacy-optimized',
                name: 'spaCy Optimizado',
                description: 'Maxima calidad lingüistica con analisis spaCy completo',
                stepsConfig: [
                    { id: 'extract-entities', name: 'Extraccion de Entidades', enabled: true, order: 0 },
                    { id: 'preprocess', name: 'Preprocesamiento', enabled: true, order: 1 },
                    { id: 'chunk', name: 'Chunking', enabled: true, order: 2 },
                    { id: 'spacy-enhance', name: 'Enriquecimiento spaCy', enabled: true, order: 3 },
                    { id: 'context-inject', name: 'Inyeccion de Contexto', enabled: true, order: 4 },
                    { id: 'generate', name: 'Generacion LLM', enabled: true, order: 5 },
                    { id: 'quality', name: 'Control de Calidad', enabled: true, order: 6 },
                    { id: 'difficulty-balance', name: 'Balance de Dificultad', enabled: true, order: 7 },
                    { id: 'spacy-validation', name: 'Validacion spaCy', enabled: true, order: 8 },
                    { id: 'cloze-generator', name: 'Generador Cloze', enabled: true, order: 9 },
                    { id: 'spacy-cloze', name: 'Cloze Lingüistico', enabled: true, order: 10 },
                    { id: 'score', name: 'Re-ranking (Scorer)', enabled: true, order: 11 },
                    { id: 'dedupe', name: 'Deduplicacion', enabled: true, order: 12 }
                ],
                options: { chunkSize: 600, chunkOverlap: 15, qualityThreshold: 75, strictQuality: true },
                variables: {},
                apiConfig: { temperature: 0.6, top_p: 0.85, top_k: 35, max_tokens: 180 },
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 'preset-speed-focused',
                name: 'Enfoque Velocidad',
                description: 'Minimo procesamiento para generacion rapida',
                stepsConfig: [
                    { id: 'preprocess', name: 'Preprocesamiento', enabled: true, order: 0 },
                    { id: 'chunk', name: 'Chunking', enabled: true, order: 1 },
                    { id: 'generate', name: 'Generacion LLM', enabled: true, order: 2 },
                    { id: 'dedupe', name: 'Deduplicacion', enabled: true, order: 3 }
                ],
                options: { chunkSize: 400, chunkOverlap: 5, qualityThreshold: 50, strictQuality: false },
                variables: {},
                apiConfig: { temperature: 0.8, top_p: 0.95, top_k: 50, max_tokens: 120 },
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            },
            {
                id: 'preset-quality-focused',
                name: 'Enfoque Calidad',
                description: 'Maximo refinamiento con todos los controles activados',
                stepsConfig: [
                    { id: 'extract-entities', name: 'Extraccion de Entidades', enabled: true, order: 0 },
                    { id: 'preprocess', name: 'Preprocesamiento', enabled: true, order: 1 },
                    { id: 'chunk', name: 'Chunking', enabled: true, order: 2 },
                    { id: 'context-inject', name: 'Inyeccion de Contexto', enabled: true, order: 3 },
                    { id: 'generate', name: 'Generacion LLM', enabled: true, order: 4 },
                    { id: 'quality', name: 'Control de Calidad', enabled: true, order: 5 },
                    { id: 'difficulty-balance', name: 'Balance de Dificultad', enabled: true, order: 6 },
                    { id: 'cloze-generator', name: 'Generador Cloze', enabled: true, order: 7 },
                    { id: 'score', name: 'Re-ranking (Scorer)', enabled: true, order: 8 },
                    { id: 'dedupe', name: 'Deduplicacion', enabled: true, order: 9 }
                ],
                options: { chunkSize: 550, chunkOverlap: 12, qualityThreshold: 80, strictQuality: true },
                variables: {},
                apiConfig: { temperature: 0.5, top_p: 0.8, top_k: 30, max_tokens: 200 },
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
            }
        ],
        pipelineVariables: {},
        activePipeline: null
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.State = State;
}

// Exports
export { State };
export default State;
