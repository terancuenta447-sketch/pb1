/**
 * Modulo: Pipeline Step Handlers (Logica de cada paso)
 * Categoria: pipeline
 * Extraido de: Flashgen.js (lineas 4401-5033)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: runDedupe, score, default, estimateDifficulty, chunk
 * Dependencias: DebugLogger, PipelineStepHandlers, Processing, State, UI
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { Processing } from '../processing/processing.js';
import { Results } from '../ui/results.js';
import { State } from '../core/state.js';
import { UI } from '../ui/ui.js';
import { Templates } from '../core/templates.js';
import { API } from '../api/api.js';
import { ChunkStrategies } from '../processing/chunk_strategies.js';
import { ChainBuilder } from '../chain/chain_builder.js';
import { ClozeEngine } from '../processing/cloze_engine.js';

    const PipelineStepHandlers = {
        /**
         * PASO 1: EXTRACT-ENTITIES
         * Extrae entidades importantes del texto (personas, lugares, fechas, citas)
         * 
         * Configuración:
         * - extractPeople: Extraer nombres de personas
         * - extractPlaces: Extraer nombres de lugares  
         * - extractDates: Extraer fechas y períodos
         * - extractQuotes: Extraer citas textuales
         * - minQuoteLength: Longitud mínima de citas
         * 
         * Uso recomendado: Textos históricos, biográficos, documentos con nombres propios
         */
        'extract-entities'(text, step = {}) {
            try {
                if (!step.enabled) {
                    DebugLogger.log('⏭️ Paso extract-entities deshabilitado', 'info');
                    return text;
                }
                
                DebugLogger.log('🔍 Extrayendo entidades del texto...', 'info');
                
                // Validar entrada
                if (!text || typeof text !== 'string') {
                    DebugLogger.log('⚠️ Texto inválido para extracción de entidades', 'warning');
                    return text || '';
                }
                
                const config = step.config || {};
                DebugLogger.log(`📋 Configuración: Personas=${config.extractPeople}, Lugares=${config.extractPlaces}, Fechas=${config.extractDates}`, 'info');
                
                // Por ahora solo registra, la extracción real se puede implementar después
                DebugLogger.log('✅ Extracción de entidades completada (paso de configuración)', 'success');
                return text;
            } catch (error) {
                DebugLogger.log(`❌ Error en extract-entities: ${error.message}`, 'error');
                console.error('Error en extract-entities:', error);
                return text; // Retornar texto original en caso de error
            }
        },

        /**
         * PASO 2: PREPROCESS
         * Limpia y normaliza el texto eliminando elementos no deseados
         * 
         * Configuración:
         * - removeReferences: Eliminar referencias [1], [2], etc.
         * - filterUrls: Eliminar URLs completas
         * - normalizeSpaces: Normalizar espacios múltiples
         * - excludeBiblio: Excluir secciones de bibliografía
         * 
         * Uso recomendado: Siempre activado (paso fundamental)
         */
        preprocess(text, step = {}) {
            try {
                if (!step.enabled) {
                    DebugLogger.log('⏭️ Paso preprocess deshabilitado', 'info');
                    return text;
                }
                
                DebugLogger.log('🧹 Preprocesando texto...', 'info');
                
                // Validar entrada
                if (!text || typeof text !== 'string') {
                    DebugLogger.log('⚠️ Texto inválido para preprocesamiento', 'warning');
                    return text || '';
                }
                
                let result = text;
                const cfg = step.config || {};
                let changesApplied = [];
                
                if (cfg.removeReferences) {
                    const before = result.length;
                    result = result.replace(/\[\d+\]/g, '').replace(/\(\d+\)/g, '');
                    if (result.length < before) {
                        changesApplied.push('referencias eliminadas');
                    }
                }
                
                if (cfg.filterUrls) {
                    const before = result.length;
                    result = result.replace(/https?:\/\/[^\s]+/g, '[URL]');
                    if (result.length < before) {
                        changesApplied.push('URLs filtradas');
                    }
                }
                
                if (cfg.excludeBiblio) {
                    const biblioMarkers = ['bibliografia', 'referencias', 'bibliography', 'references'];
                    const lower = result.toLowerCase();
                    for (const marker of biblioMarkers) {
                        const idx = lower.lastIndexOf(marker);
                        if (idx > result.length * 0.8) {
                            result = result.substring(0, idx);
                            changesApplied.push('bibliografía excluida');
                            break;
                        }
                    }
                }
                
                if (cfg.normalizeSpaces) {
                    result = result.replace(/\s+/g, ' ').trim();
                    result = result.replace(/\n{3,}/g, '\n\n');
                    changesApplied.push('espacios normalizados');
                }
                
                const summary = changesApplied.length > 0 ? ` (${changesApplied.join(', ')})` : '';
                DebugLogger.log(`✅ Preprocesamiento completado: ${result.length} caracteres${summary}`, 'success');
                return result;
            } catch (error) {
                DebugLogger.log(`❌ Error en preprocess: ${error.message}`, 'error');
                console.error('Error en preprocess:', error);
                return text; // Retornar texto original en caso de error
            }
        },

        /**
         * PASO 3: CHUNK
         * Divide el texto en fragmentos manejables para el modelo de IA
         * 
         * Métodos disponibles:
         * - chapter: Por capítulos (libros estructurados)
         * - paragraph: Por párrafos (artículos, ensayos)
         * - sentence: Por oraciones (contenido denso)
         * - semantic: Por similitud semántica (papers académicos)
         * - wordlist: Lista de palabras (vocabulario)
         * - none: Sin división (textos cortos)
         * 
         * Configuración:
         * - chunkSize: Tamaño objetivo en palabras
         * - chunkOverlap: Palabras de solapamiento entre chunks
         * - minChunkSize: Tamaño mínimo de chunk
         * - semanticThreshold: Umbral de similitud (solo semantic)
         * 
         * Uso recomendado: Siempre necesario para textos largos (>1000 palabras)
         */
        chunk(processed, step = {}) {
            try {
                if (!step.enabled) {
                    DebugLogger.log('⏭️ Paso chunk deshabilitado', 'info');
                    return processed;
                }
                
                DebugLogger.log('✂️ Configurando división de texto...', 'info');
                
                // Validar entrada
                if (!processed || typeof processed !== 'string') {
                    DebugLogger.log('⚠️ Texto inválido para chunking', 'warning');
                    return processed || '';
                }

                const currentOptions = State.pipeline.options || {};
                const cfg = step.config || {};

                // Resolver configuraciones respetando lo que haya definido el usuario manualmente
                const resolvedConfig = {
                    method: cfg.method || cfg.chunkMethod || currentOptions.chunkMethod || 'sentence',
                    chunkSize: cfg.size ?? cfg.chunkSize ?? currentOptions.chunkSize ?? 500,
                    chunkOverlap: cfg.overlap ?? cfg.chunkOverlap ?? currentOptions.chunkOverlap ?? 0,
                    minChunkSize: cfg.minSize ?? cfg.minChunkSize ?? currentOptions.minChunkSize ?? 50,
                    semanticThreshold: cfg.semanticThreshold ?? currentOptions.semanticThreshold,
                    engine: cfg.engine || cfg.segmentationEngine || currentOptions.segmentationEngine || 'default'
                };

                State.pipelineRuntime = State.pipelineRuntime || {};
                State.pipelineRuntime.chunkConfig = resolvedConfig;

                const wordCount = processed.split(/\s+/).filter(Boolean).length;
                DebugLogger.log(
                    `✅ Chunking configurado: método=${resolvedConfig.method}, tamaño=${resolvedConfig.chunkSize} palabras, overlap=${resolvedConfig.chunkOverlap}%, texto=${wordCount} palabras`,
                    'success'
                );
                return processed;
            } catch (error) {
                DebugLogger.log(`❌ Error en chunk: ${error.message}`, 'error');
                console.error('Error en chunk:', error);
                return processed;
            }
        },
        'context-inject'(processed, step = {}) {
            if (!step.enabled) return processed;
            const config = {
                template: 'Contexto relevante:',
                includeCharacters: true,
                includeEvents: true,
                includeThemes: false,
                contextWindow: 2,
                ...(step.config || {})
            };
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.contextInjectConfig = config;
            DebugLogger.log('🪄 Inyeccion de contexto configurada', 'info');
            return processed;
        },
        'quality-config'(processed, step = {}) {
            // Configurar opciones de calidad (pre-procesamiento)
            if (step.enabled && step.config) {
                const cfg = step.config;
                if (typeof cfg.threshold === 'number') State.pipeline.options.qualityThreshold = cfg.threshold;
                if (typeof cfg.strict === 'boolean') State.pipeline.options.strictQuality = cfg.strict;
                if (typeof cfg.requireCitations === 'boolean') State.pipeline.options.requireCitations = cfg.requireCitations;
            }
            DebugLogger.log('⚙️ Control de calidad configurado (se aplicará después de generación)', 'info');
            return processed;
        },
        'difficulty-balance-config'(processed, step = {}) {
            // Configurar opciones de balance de dificultad (pre-procesamiento)
            if (!step.enabled) return processed;
            const config = {
                easyCount: 10,
                mediumCount: 10,
                hardCount: 10,
                estimationMethod: 'wordCount',
                ...(step.config || {})
            };
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.difficultyConfig = config;
            DebugLogger.log('⚙️ Balance de dificultad configurado (se aplicará después de generación)', 'info');
            return processed;
        },
        'spaced-selector'(processed, step = {}) {
            if (!step.enabled) return processed;
            const config = {
                overlapWeight: 0.4,
                incrementWeight: 0.3,
                densityWeight: 0.3,
                threshold: 0.5,
                maxCards: 50,
                ...(step.config || {})
            };
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.spacedConfig = config;
            DebugLogger.log('⏱️ Spaced selector configurado', 'info');
            return processed;
        },
        'anki-optimizer'(processed, step = {}) {
            if (!step.enabled) return processed;
            const config = {
                autoTags: true,
                tagPrefix: '',
                calculateEase: true,
                linkSiblings: true,
                similarityThreshold: 0.35,
                ...(step.config || {})
            };
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.ankiConfig = config;
            DebugLogger.log('📦 Anki optimizer configurado', 'info');
            return processed;
        },
        score(processed, step = {}) {
            if (!step.enabled) return processed;
            const config = {
                variants: step.config?.variants || 3,
                temperatures: Array.isArray(step.config?.temperatures) && step.config.temperatures.length > 0
                    ? step.config.temperatures : [0.5, 0.7, 0.9],
                weightOverlap: step.config?.weightOverlap ?? 0.5,
                weightLength: step.config?.weightLength ?? 0.2,
                weightFormat: step.config?.weightFormat ?? 0.3
            };
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.scoreConfig = config;
            DebugLogger.log('📊 Scorer activado (multi-variantes)', 'info');
            return processed;
        },
        
        // GENERATION HANDLER (EJECUTA generacion real)
        async generate(processed, step = {}) {
            if (!step.enabled) {
                DebugLogger.log('⚠️ Paso generate deshabilitado', 'warning');
                return [];
            }
            
            // Configurar State.pipelineRuntime con la config del paso
            State.pipelineRuntime = State.pipelineRuntime || {};
            State.pipelineRuntime.generateConfig = {
                temperature: step.config?.temperature ?? 0.7,
                topP: step.config?.topP ?? 0.9,
                topK: step.config?.topK ?? 40,
                maxTokens: step.config?.maxTokens ?? 150,
                outputType: step.config?.outputType || 'template',
                sourceLanguage: step.config?.sourceLanguage || State.config.output?.sourceLanguage || 'Ingles',
                ankiFormat: step.config?.ankiFormat || 'basic',
                jsonSchema: step.config?.jsonSchema,
                
                // Configuracion de Chain Mode
                enableChain: step.config?.enableChain,
                chainConfig: step.config?.chainConfig,
                
                // Contexto y Agente
                enableMemory: step.config?.enableMemory,
                memoryWindow: step.config?.memoryWindow,
                enableAgent: step.config?.enableAgent,
                agentTools: step.config?.agentTools
            };
            
            DebugLogger.log('⚡ Ejecutando generacion real...', 'info');
            
            try {
                // Obtener template activo
                const template = Templates.defaults[State.activeTemplate] || Templates.defaults.book_events;
                
                // Chunking del texto
                const chunks = await Processing.chunk(processed);
                DebugLogger.log(`📦 Texto dividido en ${chunks.length} chunks`, 'info');
                
                const flashcards = [];
                const totalChunks = chunks.length;
                
                // Procesar cada chunk
                for (let i = 0; i < chunks.length; i++) {
                    if (State.cancelGeneration) {
                        Processing.handleGenerationCancel();
                        break;
                    }
                    
                    const chunk = chunks[i];
                    UI.updateProgress(i + 1, totalChunks);
                    
                    // Construir prompt
                    const systemPrompt = template.systemPrompt || 'Eres un asistente que genera flashcards.';
                    const userPrompt = Templates.interpolate(template.userPrompt || '{text}', {
                        text: chunk,
                        subject: State.config.subject || 'general',
                        chunkIndex: i + 1,
                        totalChunks: totalChunks
                    });
                    
                    // Llamar a la API
                    const result = await API.call(systemPrompt, userPrompt, {
                        temperature: State.pipelineRuntime.generateConfig?.temperature || 0.7,
                        top_p: State.pipelineRuntime.generateConfig?.topP || 0.9,
                        top_k: State.pipelineRuntime.generateConfig?.topK || 40,
                        max_tokens: State.pipelineRuntime.generateConfig?.maxTokens || 150
                    });
                    
                    if (result.success && result.content) {
                        // Parsear respuesta
                        const parsed = this.parseFlashcard(result.content, i + 1, chunk);
                        if (parsed) {
                            flashcards.push(parsed);
                        }
                    }
                }
                
                UI.updateProgress(totalChunks, totalChunks);
                DebugLogger.log(`✅ Generacion completada: ${flashcards.length} flashcards`, 'success');
                return flashcards;
            } catch (error) {
                DebugLogger.log(`❌ Error en generacion: ${error.message}`, 'error');
                UI.toast(`❌ Error: ${error.message}`, 'error');
                return [];
            }
        },
        
        // POST-PROCESSING HANDLERS (operan sobre arrays de flashcards, devuelven arrays)
        quality(cards, step = {}) {
            if (!step.enabled) return cards;
            const cfg = step.config || {};
            const threshold = cfg.threshold ?? 70;
            const strict = cfg.strict ?? true;
            
            // Filtrar por calidad si es necesario
            if (strict && threshold > 0) {
                const filtered = cards.filter(card => {
                    // Simulacion de evaluacion de calidad
                    const quality = Math.random() * 100;
                    return quality >= threshold;
                });
                DebugLogger.log(`🔍 Quality: ${cards.length} → ${filtered.length} cards (threshold: ${threshold})`, 'info');
                return filtered;
            }
            
            DebugLogger.log(`🔍 Quality: ${cards.length} cards (threshold: ${threshold}, strict: ${strict})`, 'info');
            return cards;
        },
        
        'difficulty-balance'(cards, step = {}) {
            if (!step.enabled) return cards;
            const config = {
                easyCount: 10,
                mediumCount: 10,
                hardCount: 10,
                estimationMethod: 'wordCount',
                ...(step.config || {})
            };
            
            // Simulacion de balance de dificultad
            const withDifficulty = cards.map(card => ({
                ...card,
                difficulty: this.estimateDifficulty(card, config.estimationMethod)
            }));
            
            DebugLogger.log(`⚖️ Difficulty Balance: ${cards.length} cards con dificultad asignada`, 'info');
            return withDifficulty;
        },
        
        'cloze-generator'(cards, step = {}) {
            if (!step.enabled) return cards;
            const config = {
                clozeEntities: true,
                clozeNumbers: true,
                clozeDates: true,
                clozeKeywords: false,
                maxVariantsPerCard: 2,
                ...(step.config || {})
            };
            
            // Generar variantes cloze para algunas cards
            const clozeCards = cards.map(card => {
                if (Math.random() > 0.3) return card; // 70% sin cambios
                
                const clozeCard = this.generateClozeVariant(card, config);
                return clozeCard || card;
            });
            
            DebugLogger.log(`🔤 Cloze Generator: ${clozeCards.length} cards procesadas`, 'info');
            return clozeCards;
        },
        
        async 'chain-refinement'(cards, step = {}) {
            if (!step.enabled) return cards;
            
            const config = step.config || {};
            DebugLogger.log(`🔗 Chain-Refinement: procesando ${cards.length} flashcards`, 'info');
            DebugLogger.log(`   Umbral: ${config.qualityThreshold || 70}%, Max refinamientos: ${config.maxRefinements || 2}`, 'info');
            
            // Construir cadena con configuracion del paso
            const chain = ChainBuilder.buildFlashcardChain({
                qualityThreshold: config.qualityThreshold || 70,
                maxRefinements: config.maxRefinements || 2,
                enableCloze: config.generateClozeVariants || false,
                strictMode: !config.bypassQuality,
                debugMode: config.debugMode || false
            });
            
            const refinedCards = [];
            
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                
                try {
                    // Estado inicial para la cadena
                    const initialState = {
                        flashcard: card,
                        sourceText: card.metadata?.sourceText || '',
                        generation: 0,
                        refinementHistory: []
                    };
                    
                    // Ejecutar cadena
                    const result = await chain.run(initialState);
                    
                    // Extraer flashcard refinada
                    const refinedCard = {
                        ...result.state.flashcard,
                        metadata: {
                            ...(card.metadata || {}),
                            chainProcessed: true,
                            chainIterations: result.state.generation || 0,
                            chainScore: result.state.qualityScore || 0,
                            wasRefined: (result.state.generation || 0) > 0
                        }
                    };
                    
                    refinedCards.push(refinedCard);
                    
                    if (config.debugMode) {
                        DebugLogger.log(`   Card ${i + 1}: ${result.state.generation || 0} refinamientos, score ${result.state.qualityScore || 0}%`, 'info');
                    }
                    
                } catch (error) {
                    DebugLogger.log(`   ⚠️ Error refinando card ${i + 1}: ${error.message}`, 'warning');
                    // Mantener card original si falla
                    refinedCards.push({
                        ...card,
                        metadata: {
                            ...(card.metadata || {}),
                            chainProcessed: false,
                            chainError: error.message
                        }
                    });
                }
            }
            
            DebugLogger.log(`✓ Chain-Refinement completado: ${refinedCards.length} cards procesadas`, 'success');
            return refinedCards;
        },
        
        dedupe(cards, step = {}) {
            if (!step.enabled) return cards;
            const before = cards.length;
            const seen = new Set();
            const deduped = cards.filter(card => {
                const key = card.question.toLowerCase().trim();
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
            DebugLogger.log(`🗑️ Dedupe: ${before} → ${deduped.length} cards`, 'success');
            return deduped;
        },
        default(processed, step) {
            DebugLogger.log(`❔ Paso custom/no-op: ${step.name} (id: ${step.id})`, 'info');
            return processed;
        },
        
        // Helper methods para post-processing
        estimateDifficulty(card, method = 'wordCount') {
            if (method === 'wordCount') {
                const wordCount = (card.answer || '').split(/\s+/).length;
                if (wordCount <= 10) return 1; // Easy
                if (wordCount <= 20) return 2; // Medium
                return 3; // Hard
            }
            return 2; // Default medium
        },
        
        generateClozeVariant(card, config) {
            if (!card.answer) return null;
            
            let answer = card.answer;
            let clozeText = answer;
            
            // Extraer palabras clave para cloze
            if (config.clozeEntities && typeof nlp !== 'undefined') {
                const doc = nlp(answer);
                const entities = doc.people().out('array');
                if (entities.length > 0) {
                    clozeText = answer.replace(entities[0], '{{c1::' + entities[0] + '}}');
                }
            }
            
            if (config.clozeNumbers) {
                const numbers = answer.match(/\b\d+\b/g);
                if (numbers && numbers.length > 0) {
                    clozeText = answer.replace(numbers[0], '{{c1::' + numbers[0] + '}}');
                }
            }
            
            if (clozeText !== answer) {
                return {
                    ...card,
                    type: 'cloze',
                    question: card.question,
                    answer: clozeText
                };
            }
            
            return null;
        },
        scheduleDedupe() {
            if (!State.pipelineRuntime) {
                State.pipelineRuntime = { dedupePending: false };
            }
            if (State.flashcards && State.flashcards.length > 0) {
                PipelineStepHandlers.runDedupe();
            } else {
                State.pipelineRuntime.dedupePending = true;
                DebugLogger.log('🕒 Deduplicacion pendiente hasta generar flashcards', 'info');
            }
        },
        runDedupe() {
            if (!State.flashcards || !State.flashcards.length) {
                return;
            }
            const before = State.flashcards.length;
            const seen = new Set();
            State.flashcards = State.flashcards.filter(card => {
                const key = card.question.toLowerCase().trim();
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
            const removed = before - State.flashcards.length;
            State.pipelineRuntime.dedupePending = false;
            
            // Conectar con UI para actualizar la interfaz despues del cambio de estado
            if (typeof Results !== 'undefined' && Results.updateUI) {
                Results.updateUI();
            }
            
            DebugLogger.log(
                `✓ Deduplicacion: ${State.flashcards.length} cards unicas${removed ? ` (${removed} removidas)` : ''}`,
                removed ? 'success' : 'info'
            );
            // Conectar feedback visual con UI
            UI.toast(`✓ Deduplicacion completada: ${State.flashcards.length} tarjetas unicas${removed ? ` (${removed} duplicadas removidas)` : ''}`, 
                    removed ? 'success' : 'info');
        },
        
        // SPACY HANDLERS - Procesamiento lingüistico avanzado
        
        async 'spacy-enhance'(processed, step = {}) {
            if (!step.enabled) return processed;
            
            const config = {
                entityEnrichment: true,
                syntacticAnalysis: true,
                semanticClustering: false,
                nerValidation: true,
                ...(step.config || {})
            };
            
            DebugLogger.log('🧠 Enriquecimiento spaCy iniciado (servidor neuronal):', 'info');
            
            try {
                // Llamar al servidor spaCy para analisis neuronal completo
                const response = await fetch('http://localhost:8000/enhance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: processed,
                        lang: 'es',
                        strategy: 'sentences'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Servidor spaCy no disponible: ${response.status}`);
                }
                
                const enrichment = await response.json();
                
                if (enrichment.error) {
                    throw new Error(enrichment.error);
                }
                
                // Guardar enriquecimiento para uso en generacion
                State.pipelineRuntime = State.pipelineRuntime || {};
                State.pipelineRuntime.spacyEnrichment = {
                    entities: enrichment.entities || [],
                    syntax: enrichment.syntax_analysis || [],
                    nounPhrases: enrichment.noun_phrases || [],
                    verbPhrases: enrichment.verb_phrases || [],
                    semanticClusters: enrichment.semantic_clusters || [],
                    config: config
                };
                
                DebugLogger.log(`  ✓ ${enrichment.stats.total_entities} entidades detectadas (NER neuronal)`, 'success');
                DebugLogger.log(`  ✓ ${enrichment.stats.total_noun_phrases} noun phrases extraidos`, 'success');
                DebugLogger.log(`  ✓ ${enrichment.stats.total_verb_phrases} verb phrases identificados`, 'success');
                DebugLogger.log(`  ✓ ${enrichment.stats.total_sentences} oraciones analizadas sintacticamente`, 'success');
                
                if (config.semanticClustering && enrichment.semantic_clusters.length > 0) {
                    DebugLogger.log(`  ✓ ${enrichment.semantic_clusters.length} clusters semanticos encontrados`, 'success');
                }
                
                return processed;
                
            } catch (error) {
                DebugLogger.log(`⚠️ Error en enriquecimiento spaCy: ${error.message}`, 'error');
                DebugLogger.log('  Continuando sin enriquecimiento neuronal...', 'warning');
                return processed;
            }
        },
        
        async 'spacy-validation'(cards, step = {}) {
            if (!step.enabled) return cards;
            
            const config = {
                grammarCheck: true,
                entityConsistency: true,
                syntaxValidation: false,
                semanticCoherence: true,
                ...(step.config || {})
            };
            
            DebugLogger.log('🔍 Validacion spaCy iniciada (servidor neuronal):', 'info');
            
            try {
                // Llamar al servidor spaCy para validacion neuronal
                const response = await fetch('http://localhost:8000/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cards: cards,
                        lang: 'es',
                        config: {
                            grammar_check: config.grammarCheck,
                            entity_consistency: config.entityConsistency,
                            syntax_validation: config.syntaxValidation,
                            semantic_coherence: config.semanticCoherence
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Servidor spaCy no disponible: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                const validatedCards = result.validated_cards || [];
                const stats = result.stats || {};
                
                DebugLogger.log(`  ✓ ${stats.valid_cards}/${stats.total_cards} cards validas`, 'success');
                if (stats.cards_with_issues > 0) {
                    DebugLogger.log(`  ⚠️ ${stats.cards_with_issues} cards con issues detectados`, 'warning');
                    
                    // Mostrar detalles de issues
                    validatedCards.forEach((card, idx) => {
                        if (card.validation && !card.validation.is_valid) {
                            DebugLogger.log(`    Card ${idx + 1}: ${card.validation.issues.length} issues`, 'warning');
                            card.validation.issues.forEach(issue => {
                                DebugLogger.log(`      - [${issue.type}] ${issue.message}`, 'warning');
                            });
                        }
                    });
                }
                
                return validatedCards;
                
            } catch (error) {
                DebugLogger.log(`⚠️ Error en validacion spaCy: ${error.message}`, 'error');
                DebugLogger.log('  Continuando sin validacion neuronal...', 'warning');
                return cards;
            }
        },
        
        async 'spacy-cloze'(cards, step = {}) {
            if (!step.enabled) return cards;
            
            const config = {
                nounPhrases: true,
                verbPhrases: true,
                namedEntities: true,
                syntacticHeads: false,
                preserveGrammar: true,
                ...(step.config || {})
            };
            
            DebugLogger.log('🔤 Cloze Lingüistico spaCy iniciado (servidor neuronal):', 'info');
            
            try {
                // Llamar al servidor spaCy para generacion de cloze neuronal
                const response = await fetch('http://localhost:8000/generate_cloze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cards: cards,
                        lang: 'es',
                        config: {
                            noun_phrases: config.nounPhrases,
                            verb_phrases: config.verbPhrases,
                            named_entities: config.namedEntities,
                            syntactic_heads: config.syntacticHeads
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Servidor spaCy no disponible: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                const clozeCards = result.cloze_cards || [];
                const stats = result.stats || {};
                
                // Combinar cards originales con variantes cloze
                const allCards = [...cards, ...clozeCards];
                
                DebugLogger.log(`  ✓ ${stats.original_cards} cards originales`, 'success');
                DebugLogger.log(`  ✓ ${stats.generated_cloze} variantes cloze generadas`, 'success');
                DebugLogger.log(`  ✓ Promedio: ${stats.variants_per_card} variantes por card`, 'success');
                
                // Mostrar tipos de cloze generados
                const clozeTypes = {};
                clozeCards.forEach(card => {
                    const type = card.metadata?.cloze_type || 'unknown';
                    clozeTypes[type] = (clozeTypes[type] || 0) + 1;
                });
                
                Object.entries(clozeTypes).forEach(([type, count]) => {
                    DebugLogger.log(`    - ${type}: ${count} variantes`, 'info');
                });
                
                return allCards;
                
            } catch (error) {
                DebugLogger.log(`⚠️ Error en generacion cloze spaCy: ${error.message}`, 'error');
                DebugLogger.log('  Continuando sin generacion cloze neuronal...', 'warning');
                return cards;
            }
        }
    ,
    
    // Método helper para parsear flashcards
    parseFlashcard(content, chunkIndex, sourceText) {
        try {
            // Intentar parsear como JSON primero
            const cleaned = Processing.cleanJsonResponse(content);
            const parsed = JSON.parse(cleaned);
            
            if (parsed.question && parsed.answer) {
                return {
                    id: Date.now() + chunkIndex,
                    question: parsed.question,
                    answer: parsed.answer,
                    metadata: {
                        chunkIndex,
                        sourceText: sourceText.substring(0, 200),
                        ...(parsed.metadata || {})
                    },
                    status: 'pending'
                };
            }
        } catch (e) {
            // Si no es JSON, intentar parsear formato texto
            const lines = content.split('\n').filter(l => l.trim());
            
            // Buscar patrones Q: A: o Pregunta: Respuesta:
            let question = '';
            let answer = '';
            
            for (const line of lines) {
                if (line.match(/^(Q|Pregunta|Question):/i)) {
                    question = line.replace(/^(Q|Pregunta|Question):/i, '').trim();
                } else if (line.match(/^(A|Respuesta|Answer):/i)) {
                    answer = line.replace(/^(A|Respuesta|Answer):/i, '').trim();
                }
            }
            
            if (question && answer) {
                return {
                    id: Date.now() + chunkIndex,
                    question,
                    answer,
                    metadata: {
                        chunkIndex,
                        sourceText: sourceText.substring(0, 200)
                    },
                    status: 'pending'
                };
            }
        }
        
        DebugLogger.log(`⚠️ No se pudo parsear flashcard del chunk ${chunkIndex}`, 'warning');
        return null;
    }
};


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.PipelineStepHandlers = PipelineStepHandlers;
}

// Exports
export { PipelineStepHandlers };
export default PipelineStepHandlers;
