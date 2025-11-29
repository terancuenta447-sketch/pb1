/**
 * Modulo: Chain Handlers (Orquestacion Real)
 * Categoria: chain
 * Extraido de: Flashgen.js (lineas 5106-5811)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: _analyzeContentType, _filterQualityIssuesByContent, _separateContentByType, _applyContentTypeRules, _filterQualityIssues
 * Dependencias: API, DebugLogger, Processing, State
 */

import { API } from '../api/api.js';
import { ClozeEngine } from '../processing/cloze_engine.js';
import { DebugLogger } from '../ui/debug_logger.js';
import { Processing } from '../processing/processing.js';
import { State } from '../core/state.js';
import { Templates } from '../core/templates.js';

const ChainHandlers = {
        // === PREPROCESAMIENTO: Filtrado por tipo de contenido ===

        // 0. Analisis y separacion de contenido por tipo
        async contentTypeAnalysis(state, config, context) {
            const { chunkText, chunkIndex } = state;

            DebugLogger.log(`🔍 Analizando tipo de contenido del chunk ${chunkIndex}`, 'info');

            // Detectar tipo de contenido
            const contentAnalysis = this._analyzeContentType(chunkText);

            DebugLogger.log(`📋 Contenido detectado: ${contentAnalysis.type} (${contentAnalysis.confidence}% confianza)`, 'info');

            // Separar contenido por tipo
            const separatedContent = this._separateContentByType(chunkText, contentAnalysis);

            return {
                ...state,
                contentAnalysis,
                separatedContent,
                originalContent: chunkText,
                filteredContent: separatedContent.javascript || chunkText // Usar JS si existe, sino todo
            };
        },

        // 0.1. Filtrado de falsos positivos para analisis de calidad
        async qualityFilter(state, config, context) {
            const { separatedContent, contentAnalysis } = state;

            if (!separatedContent) {
                DebugLogger.log('⚠️ No hay contenido separado, continuando sin filtrado', 'warning');
                return state;
            }

            // Simular issues de calidad (en produccion vendrian del analisis real)
            const mockQualityIssues = [
                { category: 'quality_global_variables', description: 'Variable global implicita detectada', code: '<html lang="es">' },
                { category: 'quality_scope', description: 'Posible fuga de variable', code: 'var x = 5;' }
            ];

            // Filtrar issues basado en tipo de contenido
            const filteredResult = this._filterQualityIssuesByContent(mockQualityIssues, contentAnalysis);

            DebugLogger.log(`🎯 Issues filtrados: ${filteredResult.removedCount} falsos positivos eliminados (${filteredResult.remainingCount} validos)`, 'success');

            return {
                ...state,
                filteredQualityIssues: filteredResult.filteredIssues,
                filterStats: filteredResult.stats,
                qualityAnalysisReady: true
            };
        },

        // === HELPERS PARA PREPROCESAMIENTO ===

        _analyzeContentType(text) {
            const lines = text.split('\n');
            let htmlTags = 0, cssRules = 0, jsStatements = 0, totalLines = lines.length;

            for (const line of lines) {
                const trimmed = line.trim();

                // Detectar HTML mas especificamente
                if (trimmed.startsWith('<') && trimmed.includes('>')) {
                    // HTML tags especificos
                    if (trimmed.match(/^<\w+.*>$/) || trimmed.match(/^<\w+.*\/>$/)) {
                        htmlTags++;
                    }
                    // HTML con atributos
                    else if (trimmed.includes('class=') || trimmed.includes('id=') || 
                            trimmed.includes('lang=') || trimmed.includes('charset=') ||
                            trimmed.includes('href=') || trimmed.includes('src=')) {
                        htmlTags++;
                    }
                }
                // Detectar CSS mas especificamente
                else if ((trimmed.startsWith('.') || trimmed.startsWith('#') || 
                        trimmed.includes('{')) && trimmed.includes(':') && trimmed.includes(';')) {
                    // Solo contar como CSS si no tiene elementos JS
                    if (!trimmed.includes('function') && !trimmed.includes('var ') && 
                        !trimmed.includes('let ') && !trimmed.includes('const ')) {
                        cssRules++;
                    }
                }
                // Detectar JavaScript mas especificamente
                else if (trimmed.includes('function') || trimmed.includes('var ') ||
                        trimmed.includes('let ') || trimmed.includes('const ') ||
                        trimmed.includes('if ') || trimmed.includes('for ') ||
                        trimmed.includes('return ') || trimmed.includes('=>') ||
                        trimmed.includes('console.log') || trimmed.includes('addEventListener')) {
                    jsStatements++;
                }
            }

            // Determinar tipo principal con logica mejorada
            const maxCount = Math.max(htmlTags, cssRules, jsStatements);
            let type = 'mixed';
            let confidence = 0;

            // Si mas del 70% del contenido es de un tipo, considerarlo ese tipo
            if (maxCount / totalLines > 0.7) {
                confidence = Math.round((maxCount / totalLines) * 100);
                if (htmlTags === maxCount) type = 'html';
                else if (cssRules === maxCount) type = 'css';
                else if (jsStatements === maxCount) type = 'javascript';
            } 
            // Si entre 40-70%, considerar mixto pero con tipo principal
            else if (maxCount / totalLines > 0.4) {
                confidence = Math.round((maxCount / totalLines) * 100);
                type = 'mixed';
            }
            // Menos del 40%, definitivamente mixto
            else {
                confidence = Math.round((maxCount / totalLines) * 100);
                type = 'mixed';
            }

            return {
                type,
                confidence,
                breakdown: { htmlTags, cssRules, jsStatements, totalLines }
            };
        },

        _separateContentByType(text, analysis) {
            const lines = text.split('\n');
            const separated = {
                html: [],
                css: [],
                javascript: [],
                unknown: []
            };

            for (const line of lines) {
                const trimmed = line.trim();

                // HTML
                if (trimmed.startsWith('<') && trimmed.includes('>') &&
                    (trimmed.includes('class=') || trimmed.includes('id=') ||
                    trimmed.match(/^<\w+.*>$/))) {
                    separated.html.push(line);
                }
                // CSS
                else if (trimmed.includes('{') && trimmed.includes(':') && trimmed.includes(';') &&
                        !trimmed.includes('function') && !trimmed.includes('var ')) {
                    separated.css.push(line);
                }
                // JavaScript
                else if (trimmed.includes('function') || trimmed.includes('var ') ||
                        trimmed.includes('let ') || trimmed.includes('const ') ||
                        trimmed.includes('if ') || trimmed.includes('for ') ||
                        trimmed.includes('return ')) {
                    separated.javascript.push(line);
                }
                else {
                    separated.unknown.push(line);
                }
            }

            // Unir lineas separadas
            return {
                html: separated.html.join('\n'),
                css: separated.css.join('\n'),
                javascript: separated.javascript.join('\n'),
                unknown: separated.unknown.join('\n')
            };
        },

        _filterQualityIssues(separatedContent, contentAnalysis) {
            // Esta funcion se ejecutaria despues del analisis de calidad
            // para filtrar falsos positivos basados en el tipo de contenido

            const filterStats = {
                originalCount: 0, // Se llenara cuando se ejecute el analisis
                filteredCount: 0,
                removedCount: 0,
                removedByType: {
                    html_tags: 0,
                    css_rules: 0,
                    mixed_content: 0
                }
            };

            return filterStats; // Placeholder - se implementara en el handler de calidad
        },

        _filterQualityIssuesByContent(issues, contentAnalysis) {
            const filteredIssues = [];
            let removedCount = 0;
            const stats = {
                originalCount: issues.length,
                filteredCount: 0,
                removedCount: 0,
                removedByType: {
                    html_tags: 0,
                    css_rules: 0,
                    non_javascript: 0,
                    global_vars_in_html: 0,
                    mixed_content_confusion: 0
                }
            };

            const contentType = contentAnalysis?.type || 'unknown';

            for (const issue of issues) {
                let shouldKeep = true;
                const code = issue.code || '';
                const category = issue.category || '';
                const description = issue.description || '';

                // FILTRADO AGRESIVO DE FALSOS POSITIVOS

                // 1. Variables globales en HTML = SIEMPRE falso positivo
                if (category === 'quality_global_variables' && 
                    (code.startsWith('<') || 
                    code.includes('<html') || code.includes('<meta') || 
                    code.includes('<div') || code.includes('<button') ||
                    code.includes('<script') || code.includes('<link'))) {
                    shouldKeep = false;
                    stats.removedByType.global_vars_in_html++;
                    removedCount++;
                    continue;
                }

                // 2. Cualquier issue con codigo que empiece con '<' en contenido no-HTML
                if (code.startsWith('<') && contentType !== 'html') {
                    shouldKeep = false;
                    stats.removedByType.html_tags++;
                    removedCount++;
                    continue;
                }

                // 3. Issues de alcance en HTML/CSS puro
                if ((contentType === 'html' || contentType === 'css') && 
                    (category === 'quality_scope' || description.toLowerCase().includes('alcance'))) {
                    shouldKeep = false;
                    stats.removedByType.non_javascript++;
                    removedCount++;
                    continue;
                }

                // 4. Variables globales con atributos HTML comunes
                if (category === 'quality_global_variables' && 
                    (code.includes('class=') || code.includes('id=') || 
                    code.includes('lang=') || code.includes('charset=') ||
                    code.includes('href=') || code.includes('src=') ||
                    code.includes('style='))) {
                    shouldKeep = false;
                    stats.removedByType.html_tags++;
                    removedCount++;
                    continue;
                }

                // 5. Contenido mixto: ser mas estricto
                if (contentType === 'mixed' && category === 'quality_global_variables') {
                    // Solo mantener si parece codigo JS real
                    if (!code.includes('function') && !code.includes('var ') && 
                        !code.includes('let ') && !code.includes('const ') &&
                        !code.includes('if ') && !code.includes('for ')) {
                        shouldKeep = false;
                        stats.removedByType.mixed_content_confusion++;
                        removedCount++;
                        continue;
                    }
                }

                // 6. Filtrado especifico por descripcion
                if (description.includes('Variable global implicita') && 
                    !code.includes('function') && !code.includes('var ') && 
                    !code.includes('let ') && !code.includes('const ')) {
                    // Si dice "variable global implicita" pero no hay declaracion de variable, es falso positivo
                    shouldKeep = false;
                    stats.removedByType.global_vars_in_html++;
                    removedCount++;
                    continue;
                }

                if (shouldKeep) {
                    filteredIssues.push(issue);
                }
            }

            stats.filteredCount = filteredIssues.length;
            stats.removedCount = removedCount;

            return {
                filteredIssues,
                stats,
                removedCount,
                remainingCount: filteredIssues.length
            };
        },

        _applyContentTypeRules(flashcard, contentAnalysis) {
            let scoreAdjustment = 0;
            const details = [];

            if (!contentAnalysis) {
                return { scoreAdjustment: 0, details: ['Sin analisis de contenido disponible'] };
            }

            const contentType = contentAnalysis.type;
            const confidence = contentAnalysis.confidence;

            // Aplicar reglas especificas por tipo de contenido
            switch (contentType) {
                case 'javascript':
                    // Bonus por usar contenido JavaScript real
                    scoreAdjustment += 10;
                    details.push('✅ Bonus por contenido JavaScript valido (+10)');
                    
                    // Penalizacion si parece HTML/CSS confundido
                    if (flashcard.question.includes('<') || flashcard.answer.includes('class=')) {
                        scoreAdjustment -= 20;
                        details.push('❌ Penalizacion: contenido parece HTML/CSS en pregunta/respuesta (-20)');
                    }
                    break;

                case 'html':
                    // Penalizacion por confundir HTML con codigo ejecutable
                    scoreAdjustment -= 15;
                    details.push('⚠️ Penalizacion por contenido HTML: no es codigo ejecutable (-15)');
                    
                    // Verificar si la flashcard trata sobre HTML especificamente
                    if (flashcard.question.toLowerCase().includes('html') || 
                        flashcard.answer.toLowerCase().includes('etiqueta')) {
                        scoreAdjustment += 10;
                        details.push('✅ Bonus por tratar especificamente sobre HTML (+10)');
                    }
                    break;

                case 'css':
                    // Penalizacion similar por CSS
                    scoreAdjustment -= 15;
                    details.push('⚠️ Penalizacion por contenido CSS: no es codigo ejecutable (-15)');
                    
                    if (flashcard.question.toLowerCase().includes('css') || 
                        flashcard.answer.toLowerCase().includes('estilo')) {
                        scoreAdjustment += 10;
                        details.push('✅ Bonus por tratar especificamente sobre CSS (+10)');
                    }
                    break;

                case 'mixed':
                    // Penalizacion por contenido mixto confuso
                    scoreAdjustment -= 10;
                    details.push('⚠️ Penalizacion por contenido mixto: analisis mas complejo (-10)');
                    break;

                default:
                    details.push('ℹ️ Tipo de contenido no reconocido');
            }

            // Ajuste por confianza del analisis
            if (confidence < 70) {
                scoreAdjustment -= 5;
                details.push('⚠️ Baja confianza en deteccion de tipo (-5)');
            } else if (confidence > 90) {
                scoreAdjustment += 5;
                details.push('✅ Alta confianza en deteccion de tipo (+5)');
            }

            return {
                scoreAdjustment,
                details,
                contentType,
                confidence
            };
        },

        // 1. Generacion inicial de flashcard
        async generateInitial(state, config, context) {
            const { filteredContent, chunkIndex, metadata, contentAnalysis } = state;
            const chunkText = filteredContent || state.chunkText; // Fallback al original
            
            context.apiCallCount++;
            const startTime = Date.now();
            
            const template = State.templates[State.activeTemplate];
            
            // Soporte para Custom Chain Prompts
            const customPrompts = State.pipelineRuntime?.generateConfig?.chainConfig?.prompts?.generate;
            // Construir system prompt base con memoria si esta activa
            let baseSystemPrompt = State.config.features.contextMemory && context.memory.length > 0
                ? `${template.systemPrompt}\n\nContexto de conversaciones previas:\n${context.memory.map(m => `- ${m}`).join('\n')}`
                : template.systemPrompt;
            
            // Añadir ejemplos Few-Shot si estan activados
            if (template.fewShotEnabled?.positive && template.fewShotExamples?.length > 0) {
                const positiveExamples = template.fewShotExamples
                    .map(ex => `Ejemplo correcto:\nPregunta: ${ex.question}\nRespuesta: ${ex.answer}`)
                    .join('\n\n');
                baseSystemPrompt += `\n\n📚 Ejemplos de flashcards bien hechas:\n${positiveExamples}`;
            }
            
            if (template.fewShotEnabled?.negative && template.fewShotExamplesNegative?.length > 0) {
                const negativeExamples = template.fewShotExamplesNegative
                    .map(ex => `Ejemplo incorrecto:\nPregunta: ${ex.question}\nRespuesta: ${ex.answer}\n❌ Problema: ${ex.issue || 'No especificado'}`)
                    .join('\n\n');
                baseSystemPrompt += `\n\n❌ Ejemplos de errores a evitar:\n${negativeExamples}`;
            }

            const systemPrompt = Templates.interpolate(baseSystemPrompt, {
                ...metadata,
                contentType: contentAnalysis?.type || 'unknown',
                contentConfidence: contentAnalysis?.confidence || 0
            });
            const userPrompt = Templates.interpolate(template.userPrompt, {
                ...metadata,
                text: chunkText
            });
            
            const result = await API.call(systemPrompt, userPrompt);
            context.totalLatency += (Date.now() - startTime);
            
            if (!result.success) {
                throw new Error(result.error || 'API call failed');
            }
            
            const flashcard = Processing.parseFlashcard(result.content, chunkIndex, metadata);
            
            return {
                ...state,
                flashcard,
                rawResponse: result.content,
                generation: 1,
                usedFilteredContent: !!filteredContent
            };
        },
        
        // 2. Evaluacion de calidad con criterios especificos
        async evaluateQuality(state, config, context) {
            if (State.pipeline.options.chainBypassQuality) {
                DebugLogger.log('⚡ Bypass: Asumiendo calidad 100%', 'warning');
                return {
                    ...state,
                    qualityScore: 100,
                    needsRefinement: false,
                    evaluationDetails: { bypassed: true }
                };
            }
            
            // Obtener configuracion de evaluacion (Heuristica vs LLM)
            const evalConfig = State.pipelineRuntime?.generateConfig?.chainConfig || {};
            const evalMode = evalConfig.evalMode || 'heuristic';
            
            const { flashcard, filteredContent, contentAnalysis, separatedContent } = state;
            const chunkText = filteredContent || state.chunkText; // Usar contenido filtrado

            // MODO LLM (IA COMO JUEZ)
            if (evalMode === 'llm') {
                DebugLogger.log('⚖️ Evaluando calidad con LLM...', 'info');
                context.apiCallCount++;
                const startTime = Date.now();
                
                const criteria = evalConfig.prompts?.evaluate?.criteria || 
                    'Evalua la calidad de la flashcard (0-100) basandote en: 1. Claridad de la pregunta. 2. Exactitud de la respuesta respecto al texto original. 3. Concision.';

                const systemPrompt = `Actua como un Juez de Calidad estricto para flashcards educativas.
Tu tarea es evaluar una flashcard generada a partir de un texto fuente.

CRITERIOS DE EVALUACIoN:
${criteria}

Debes responder en formato JSON:
{
    "score": number (0-100),
    "reason": "breve explicacion",
    "needsRefinement": boolean,
    "suggestions": "sugerencias especificas si necesita mejora"
}`;

                const userPrompt = `TEXTO FUENTE:
${chunkText}

FLASHCARD GENERADA:
Pregunta: ${flashcard.question}
Respuesta: ${flashcard.answer}

Evalua ahora.`;

                try {
                    const result = await API.call(systemPrompt, userPrompt, { jsonSchema: true }); // Forzar JSON si es posible o confiar en prompt
                    context.totalLatency += (Date.now() - startTime);
                    
                    let evaluation;
                    try {
                        // Intento simple de parsear JSON (API.call ya deberia devolver content, a veces string)
                        const content = result.content.replace(/```json/g, '').replace(/```/g, '').trim();
                        evaluation = JSON.parse(content);
                    } catch (e) {
                        // Fallback si falla el parseo
                        DebugLogger.log('⚠️ Fallo al parsear evaluacion LLM, usando heuristica fallback', 'warning');
                        evaluation = { score: 70, needsRefinement: false, reason: "Parse error" };
                    }

                    DebugLogger.log(`⚖️ Juez LLM: ${evaluation.score}/100 - ${evaluation.reason}`, evaluation.score < (config.threshold || 75) ? 'warning' : 'success');

                    return {
                        ...state,
                        qualityScore: evaluation.score,
                        needsRefinement: evaluation.needsRefinement || evaluation.score < (config.threshold || 75),
                        evaluationDetails: {
                            mode: 'llm',
                            reason: evaluation.reason,
                            suggestions: evaluation.suggestions,
                            finalScore: evaluation.score
                        }
                    };

                } catch (error) {
                    DebugLogger.log(`❌ Error en evaluacion LLM: ${error.message}. Usando heuristica.`, 'error');
                    // Fallback a heuristica
                }
            }
            
            // MODO HEURiSTICO (Codigo original)
            
            // Aplicar reglas especificas por tipo de contenido
            const contentTypeRules = this._applyContentTypeRules(flashcard, contentAnalysis);
            
            const avgQuality = (flashcard.quality.clarity + 
                            flashcard.quality.relevance + 
                            flashcard.quality.conciseness) / 3;
            
            // Bonus/penalizacion por tipo de contenido
            let contentTypeScore = contentTypeRules.scoreAdjustment;
            
            // Evaluacion adicional especifica del template
            const template = State.templates[State.activeTemplate];
            let templateSpecificScore = 0;
            
            // Para templates de libro: verificar si menciona el capitulo/libro
            if (template.name.includes('Libro') || template.name.includes('Book')) {
                const hasBookReference = flashcard.metadata?.bookTitle && 
                    (flashcard.question.includes(flashcard.metadata.bookTitle) || 
                    flashcard.question.includes(flashcard.metadata.chapter));
                templateSpecificScore = hasBookReference ? 10 : -15;
            }
            
            // Para idiomas: verificar estructura traduccion
            if (template.name.includes('Idioma') || template.name.includes('Language')) {
                const hasTranslation = /traduccion:|translation:/i.test(flashcard.answer);
                templateSpecificScore = hasTranslation ? 10 : -10;
            }
            
            const finalScore = Math.max(0, Math.min(100, avgQuality + templateSpecificScore + contentTypeScore));
            
            DebugLogger.log(`📊 Evaluacion (${contentAnalysis?.type || 'unknown'}): ${finalScore.toFixed(0)}% (base: ${avgQuality.toFixed(0)}%, tipo: ${contentTypeScore}, especifica: ${templateSpecificScore})`, 'info');
            
            return {
                ...state,
                qualityScore: finalScore,
                needsRefinement: finalScore < (config.threshold || 70),
                evaluationDetails: {
                    avgQuality,
                    templateSpecificScore,
                    contentTypeScore,
                    finalScore,
                    contentTypeRules: contentTypeRules.details
                }
            };
        },
        
        // 3. Refinamiento con feedback especifico
        async refineWithFeedback(state, config, context) {
            const { flashcard, chunkText, qualityScore, generation, evaluationDetails } = state;
            
            // Generar feedback especifico basado en la evaluacion
            const feedback = [];
            
            if (flashcard.quality.clarity < 70) {
                feedback.push('La pregunta es vaga o generica. Hazla mas especifica al contenido del texto.');
            }
            
            if (flashcard.quality.relevance < 70) {
                feedback.push('La respuesta no esta bien conectada con el texto original. Incluye detalles o citas directas.');
            }
            
            if (evaluationDetails.templateSpecificScore < 0) {
                const template = State.templates[State.activeTemplate];
                if (template.name.includes('Libro')) {
                    feedback.push(`Menciona explicitamente "${flashcard.metadata.bookTitle}" o "${flashcard.metadata.chapter}" en la pregunta.`);
                } else if (template.name.includes('Idioma')) {
                    feedback.push('Asegurate de incluir tanto la palabra/frase original como su traduccion claramente etiquetadas.');
                }
            }
            
            if (flashcard.answer.length < 50) {
                feedback.push('La respuesta es demasiado corta. Expande con mas contexto o ejemplos.');
            }
            
            const feedbackText = feedback.join(' ');
            
            DebugLogger.log(`🔄 Refinamiento (gen ${generation + 1}): ${feedbackText.substring(0, 80)}...`, 'info');
            
            context.apiCallCount++;
            const startTime = Date.now();
            
            // Soporte Custom Prompts para Refinamiento
            const template = State.templates[State.activeTemplate];
            const customPrompts = State.pipelineRuntime?.generateConfig?.chainConfig?.prompts?.refine;
            
            let systemPrompt;
            if (customPrompts?.system && customPrompts.system.trim()) {
                 // Si es custom, interpolamos metadata y añadimos el feedback (asumiendo que el usuario quiere feedback)
                 systemPrompt = `${Templates.interpolate(customPrompts.system, flashcard.metadata)}
    
    IMPORTANTE: Esta es una version refinada. Mejora basandote en este feedback:
    ${feedbackText}`;
            } else {
                 systemPrompt = `${Templates.interpolate(template.systemPrompt, flashcard.metadata)}
    
    IMPORTANTE: Esta es una version refinada. Mejora basandote en este feedback:
    ${feedbackText}`;
            }
            
            const userPrompt = `Texto original:
    ${chunkText}

    Flashcard anterior (calidad: ${qualityScore.toFixed(0)}%):
    Pregunta: ${flashcard.question}
    Respuesta: ${flashcard.answer}

    Genera una version MEJORADA siguiendo el feedback. Manten el formato:
    Pregunta: [mejorada]
    Respuesta: [mejorada y expandida]`;
            
            const result = await API.call(systemPrompt, userPrompt);
            context.totalLatency += (Date.now() - startTime);
            
            if (!result.success) {
                // Si falla el refinamiento, retornar flashcard original
                DebugLogger.log('⚠️ Refinamiento fallo, usando original', 'warning');
                return state;
            }
            
            // Mejorar declaracion conectando con estado de GUI
            let refinedFlashcard = Processing.parseFlashcard(
                result.content, 
                flashcard.id, 
                flashcard.metadata
            );
            
            // Preservar metadata original conectando con UI state
            refinedFlashcard.metadata = flashcard.metadata;
            refinedFlashcard.refinementHistory = [
                ...(flashcard.refinementHistory || []),
                {
                    generation,
                    previousScore: qualityScore,
                    feedback: feedbackText,
                    previousQuestion: flashcard.question
                }
            ];
            
            return {
                ...state,
                flashcard: refinedFlashcard,
                rawResponse: result.content,
                generation: generation + 1
            };
        },
        
        // 4. Generacion de variantes Cloze (opcional)
        async generateClozeVariants(state, config, context) {
            if (!config.enabled) return state;
            
            const { flashcard } = state;
            const clozeConfig = State.pipelineRuntime?.clozeConfig || config;
            
            const variants = ClozeEngine.apply([flashcard], clozeConfig);
            
            return {
                ...state,
                flashcards: variants // Array de variantes
            };
        },
        
        // 5. Finalizacion - preparar para resultados
        async finalize(state, config, context) {
            const { flashcard, flashcards } = state;
            
            // Si hay variantes cloze, retornar todas; si no, solo la flashcard principal
            const finalCards = flashcards || [flashcard];
            
            // Mejorar asignacion conectando con estado de GUI
            finalCards.forEach(card => {
                // Asegurar que card tenga todas las propiedades necesarias
                const cardMetadata = card.chainMetadata || {};
                card.chainMetadata = {
                    ...cardMetadata,
                    generations: state.generation || 1,
                    finalQualityScore: state.qualityScore,
                    apiCallsUsed: context.apiCallCount,
                    refinementHistory: card.refinementHistory || [],
                    // Conectar con configuracion de UI
                    uiConfig: State.config || {},
                    timestamp: Date.now()
                };
            });
            
            return finalCards;
        }
    };


// Exports
export { ChainHandlers };
export default ChainHandlers;

// ✅ Exponer globalmente ANTES de que ChainBuilder lo necesite
if (typeof window !== 'undefined') {
    window.ChainHandlers = ChainHandlers;
}
