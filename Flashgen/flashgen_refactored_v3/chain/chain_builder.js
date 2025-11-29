/**
 * Módulo: ChainBuilder
 * Categoría: chain
 * Extraído de: Flashgen.js (líneas 5817-5885)
 * Generado: 2025-11-28
 * 
 * Descripción: Construye cadenas de procesamiento LangChain configurables
 * Dependencias: TrueLangChain, ChainHandlers, DebugLogger, State
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { State } from '../core/state.js';

class ChainBuilder {
    static buildFlashcardChain(options = {}) {
        // ✅ Validar TrueLangChain antes de usar
        if (typeof window === 'undefined' || !window.TrueLangChain) {
            DebugLogger.log('⚠️ TrueLangChain no disponible en window', 'warning');
            throw new Error('TrueLangChain no está cargado. Asegúrate de incluir langchain-core.js');
        }

        // ✅ Validar ChainHandlers antes de usar
        if (typeof window === 'undefined' || !window.ChainHandlers) {
            DebugLogger.log('⚠️ ChainHandlers no disponible en window', 'warning');
            throw new Error('ChainHandlers no está cargado');
        }

        const TrueLangChain = window.TrueLangChain;
        const ChainHandlers = window.ChainHandlers;
        const chain = new TrueLangChain();
        
        // Configuración desde GUI (State.pipeline.options)
        const config = {
            qualityThreshold: options.qualityThreshold || State.pipeline.options.qualityThreshold || 70,
            maxRefinements: options.maxRefinements || State.pipeline.options.maxRefinements || 2,
            enableCloze: options.enableCloze !== false && State.pipeline.options.enableCloze !== false,
            strictMode: options.strictMode !== false && State.pipeline.options.strictQuality !== false,
            bypassQuality: State.pipeline.options.chainBypassQuality || false,
            debugMode: State.pipeline.options.chainDebugMode || false
        };
        
        chain
            .addNode('content_analysis', '🔍 Análisis de Contenido', 
                ChainHandlers.contentTypeAnalysis, {})
            
            .addNode('quality_filter', '🎯 Filtrado de Calidad', 
                ChainHandlers.qualityFilter, {})
            
            .addNode('generate_initial', '🎨 Generación Inicial', 
                ChainHandlers.generateInitial, {})
            
            .addNode('evaluate_quality', '📊 Evaluación de Calidad', 
                ChainHandlers.evaluateQuality, 
                { threshold: config.qualityThreshold })
            
            .addNode('refine_with_feedback', '🔄 Refinamiento', 
                ChainHandlers.refineWithFeedback, {})
            
            .addNode('generate_cloze', '🧩 Variantes Cloze', 
                ChainHandlers.generateClozeVariants, 
                { enabled: config.enableCloze })
            
            .addNode('finalize', '✅ Finalización', 
                ChainHandlers.finalize, {})
            
            .setEntryPoint('content_analysis')
            
            .addEdge('content_analysis', 'quality_filter')
            .addEdge('quality_filter', 'generate_initial')
            .addEdge('generate_initial', 'evaluate_quality')
            
            // CONDICIONAL: Refinar si calidad baja Y no exceder max refinamientos
            .addConditionalEdge('evaluate_quality', 
                (state) => {
                    if (!state.needsRefinement) return 'approved';
                    if ((state.generation || 1) >= config.maxRefinements) return 'max_attempts';
                    return 'needs_refinement';
                },
                {
                    'approved': 'generate_cloze',
                    'needs_refinement': 'refine_with_feedback',
                    'max_attempts': 'generate_cloze' // Continuar aunque no sea perfecta
                }
            )
            
            // LOOP: Refinar → Re-evaluar
            .addEdge('refine_with_feedback', 'evaluate_quality')
            
            .addEdge('generate_cloze', 'finalize');
        
        DebugLogger.log('🔗 Cadena construida:', 'success');
        if (chain.visualize) {
            DebugLogger.log(chain.visualize(), 'info');
        }
        
        return chain;
    }
}

// ✅ Exportar como módulo
export { ChainBuilder };
export default ChainBuilder;

// ✅ También exponer en window para compatibilidad con código legacy
if (typeof window !== 'undefined') {
    window.ChainBuilder = ChainBuilder;
}

