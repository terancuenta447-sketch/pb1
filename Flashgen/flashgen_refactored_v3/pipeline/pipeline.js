/**
 * Módulo: Pipeline (Orquestación Principal)
 * Categoría: pipeline
 * Extraído de: Flashgen.js (líneas 10125-10430)
 * Generado: 2025-11-28
 * 
 * Descripción: Orquestador principal del pipeline de generación de flashcards
 * Dependencias: State, Templates, PipelineExecutionContextInstance, PipelineStepHandlers, Results, UI, DebugLogger
 */

import { State } from '../core/state.js';
import { Templates } from '../core/templates.js';
import { PipelineExecutionContextInstance } from '../core/execution_context.js';
import { GenerationProfiles } from '../core/generation_profiles.js';
import { PipelineStepHandlers } from './pipeline_step_handlers.js';
import { Results } from '../ui/results.js';
import { UI } from '../ui/ui.js';
import { DebugLogger } from '../ui/debug_logger.js';

const Pipeline = {
    async generate(text) {
        DebugLogger.log('🚀 Pipeline True Pattern iniciado', 'success');
        DebugLogger.log(`Texto length: ${text.length}`, 'info');
        DebugLogger.log(`Template activo: ${State.activeTemplate}`, 'info');
        
        // ✅ Obtener perfil actual desde State o default a 'balanced'
        const currentProfile = State.config?.profile || 'balanced';
        const profileConfig = GenerationProfiles[currentProfile]?.config || {};
        DebugLogger.log(`🎚️ Perfil activo: ${GenerationProfiles[currentProfile]?.name || 'Desconocido'}`, 'info');

        // Crear ExecutionContext unificado
        const template = Templates.defaults[State.activeTemplate] || Templates.defaults.book_events;
        const executionContext = PipelineExecutionContextInstance.create(template, currentProfile, State.pipeline.steps || []);
        
        // Resetear estado
        State.flashcards = [];
        State.pipelineRuntime = {}; // Inicializar vacío, se llenará durante ejecución
        if (typeof Results !== 'undefined' && Results.resetChainMetrics) {
            Results.resetChainMetrics();
        }

        try {
            // FASE 1: PRE-PROCESSING (string → string)
            DebugLogger.log('📥 FASE 1: PRE-PROCESSING', 'info');
            
            let processed = text;
            const preSteps = (State.pipeline.steps || []).filter(s => 
                ['extract-entities', 'preprocess', 'chunk', 'context-inject'].includes(s.id) && s.enabled
            );
            
            // Validar que haya pasos para ejecutar
            if (preSteps.length === 0) {
                DebugLogger.log('⚠️ No hay pasos de pre-processing activos - usando texto original', 'warning');
            }
            
            // Ejecución secuencial
            for (const step of preSteps) {
                DebugLogger.log(`▶️ Pre: ${step.name}`, 'info');
                
                const handler = PipelineStepHandlers[step.id];
                if (!handler) {
                    DebugLogger.log(`⚠️ Handler no encontrado para ${step.id}`, 'warning');
                    continue;
                }
                
                try {
                    processed = await handler(processed, step, executionContext);
                } catch (error) {
                    DebugLogger.log(`❌ Error en paso ${step.name}: ${error.message}`, 'error');
                    throw error;
                }
            }
            
            DebugLogger.log(`✓ Pre-processing completado: ${processed.length} chars`, 'success');

            // FASE 2: GENERATION (string → flashcards)
            DebugLogger.log('⚡ FASE 2: GENERATION', 'info');
            
            // Verificar que haya paso generate activo
            const generateStep = (State.pipeline.steps || []).find(s => s.id === 'generate' && s.enabled);
            if (!generateStep) {
                throw new Error('Pipeline requiere paso "generate" activo');
            }
            
            // Ejecutar generación
            const generatedCards = await PipelineStepHandlers.generate(processed, generateStep, executionContext);
            State.flashcards = generatedCards || [];
            
            DebugLogger.log(`✓ Generación completada: ${State.flashcards.length} flashcards`, 'success');

            // FASE 3: POST-PROCESSING (flashcards → flashcards)
            DebugLogger.log('📤 FASE 3: POST-PROCESSING', 'info');
            
            const postSteps = (State.pipeline.steps || []).filter(s => 
                ['chain-refinement', 'quality', 'difficulty-balance', 'cloze-generator', 'score', 'dedupe'].includes(s.id) && s.enabled
            );
            
            // Validar que haya pasos para ejecutar
            if (postSteps.length === 0) {
                DebugLogger.log('⚠️ No hay pasos de post-processing activos - omitiendo fase', 'warning');
            } else {
                // Ejecución secuencial
                for (const step of postSteps) {
                    DebugLogger.log(`▶️ Post: ${step.name}`, 'info');
                    
                    const handler = PipelineStepHandlers[step.id];
                    if (!handler) {
                        DebugLogger.log(`⚠️ Handler no encontrado para ${step.id}`, 'warning');
                        continue;
                    }
                    
                    try {
                        State.flashcards = await handler(State.flashcards, step, executionContext);
                    } catch (error) {
                        DebugLogger.log(`❌ Error en paso ${step.name}: ${error.message}`, 'error');
                        // No lanzar error, continuar con el siguiente paso
                    }
                }
            }
            
            DebugLogger.log(`🎉 Pipeline completado: ${State.flashcards.length} cards finales`, 'success');
            
            // Actualizar UI
            if (typeof Results !== 'undefined' && Results.updateUI) {
                Results.updateUI();
            }
            if (typeof UI !== 'undefined' && UI.switchTab) {
                UI.switchTab('results');
            }
            
            return State.flashcards;

        } catch (error) {
            DebugLogger.log(`❌ Pipeline falló: ${error.message}`, 'error');
            DebugLogger.log(error.stack, 'error');
            
            // Resetear estado en caso de error
            State.cancelGeneration = false;
            
            throw error;
        }
    },

    reset() {
        State.flashcards = [];
        State.cancelGeneration = false;
        State.pipelineRuntime = {};
        
        if (typeof Results !== 'undefined' && Results.resetChainMetrics) {
            Results.resetChainMetrics();
        }
        
        if (typeof Results !== 'undefined' && Results.updateUI) {
            Results.updateUI();
        }
        
        DebugLogger.log('🔄 Pipeline reseteado', 'info');
        UI.toast('🔄 Pipeline reseteado', 'info');
    }
};

// Exportar
export { Pipeline };
export default Pipeline;

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
    window.Pipeline = Pipeline;
}

