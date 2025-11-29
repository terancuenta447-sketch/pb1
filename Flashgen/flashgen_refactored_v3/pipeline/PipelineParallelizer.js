/**
 * Módulo: PipelineParallelizer
 * Categoría: pipeline
 * Sistema de paralelización y ejecución concurrente
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { PipelineMetricsInstance } from './PipelineMetrics.js';
import { PipelineStepHandlers } from './pipeline_step_handlers.js';
import { State } from '../core/state.js';

class PipelineParallelizer {
        constructor() {
            this.maxConcurrency = navigator.hardwareConcurrency || 4;
            this.workerPool = [];
            this.taskQueue = [];
            this.activeJobs = new Map();
            this.jobId = 0;
        }
        
        // Determinar si los pasos pueden ejecutarse en paralelo
        canParallelize(steps) {
            // Reglas de dependencia:
            // - extract-entities y preprocess pueden ejecutarse en paralelo
            // - chunk depende de preprocess
            // - context-inject depende de chunk
            // - generate depende de context-inject
            // - quality, difficulty-balance, cloze-generator pueden ejecutarse en paralelo
            // - score depende de los anteriores
            // - dedupe depende de score
            
            const dependencyMap = {
                'extract-entities': [],
                'preprocess': [],
                'chunk': ['preprocess'],
                'context-inject': ['chunk'],
                'generate': ['context-inject'],
                'quality': ['generate'],
                'difficulty-balance': ['generate'],
                'cloze-generator': ['generate'],
                'score': ['quality', 'difficulty-balance', 'cloze-generator'],
                'dedupe': ['score']
            };
            
            const parallelGroups = [];
            const processed = new Set();
            
            while (processed.size < steps.length) {
                const currentGroup = [];
                
                for (const step of steps) {
                    if (processed.has(step.id)) continue;
                    
                    const dependencies = dependencyMap[step.id] || [];
                    const canRun = dependencies.every(dep => 
                        processed.has(dep) || !steps.find(s => s.id === dep)
                    );
                    
                    if (canRun) {
                        currentGroup.push(step);
                    }
                }
                
                if (currentGroup.length === 0) {
                    DebugLogger.log('⚠️ No se puede resolver dependencias, ejecutando secuencialmente', 'warning');
                    return [steps]; // Fallback a ejecución secuencial
                }
                
                parallelGroups.push(currentGroup);
                currentGroup.forEach(step => processed.add(step.id));
            }
            
            return parallelGroups;
        }
        
        // Ejecutar pasos en paralelo
        async executeParallel(steps, data, executionContext) {
            const parallelGroups = this.canParallelize(steps);
            DebugLogger.log(`🔄 Ejecutando ${steps.length} pasos en ${parallelGroups.length} grupos`, 'info');
            
            let currentData = data;
            
            for (let i = 0; i < parallelGroups.length; i++) {
                const group = parallelGroups[i];
                
                if (group.length === 1) {
                    // Ejecución secuencial para grupo individual
                    const step = group[0];
                    DebugLogger.log(`▶️ Grupo ${i + 1}/${parallelGroups.length}: ${step.name} (secuencial)`, 'info');
                    
                    const timer = PipelineMetricsInstance.startTimer(`step-${step.id}`);
                    currentData = await this.executeStep(step, currentData, executionContext);
                    PipelineMetricsInstance.endTimer(`step-${step.id}`);
                    
                } else {
                    // Ejecución paralela para grupo múltiple
                    DebugLogger.log(`⚡ Grupo ${i + 1}/${parallelGroups.length}: ${group.map(s => s.name).join(', ')} (paralelo)`, 'info');
                    
                    const groupTimer = PipelineMetricsInstance.startTimer(`group-${i}`);
                    
                    try {
                        const results = await Promise.all(
                            group.map(step => 
                                this.executeStepWithTimeout(step, currentData, executionContext, 30000) // 30s timeout
                            )
                        );
                        
                        // Para pasos de post-processing, combinar resultados
                        if (this.isPostProcessingGroup(group)) {
                            currentData = await this.combinePostProcessingResults(results, group, currentData);
                        } else {
                            // Para pre-processing, usar el último resultado (el que modifica datos)
                            currentData = results[results.length - 1] || currentData;
                        }
                        
                        PipelineMetricsInstance.endTimer(`group-${i}`);
                        DebugLogger.log(`✅ Grupo ${i + 1} completado`, 'success');
                        
                    } catch (error) {
                        PipelineMetricsInstance.endTimer(`group-${i}`);
                        PipelineMetricsInstance.incrementCounter('parallel_group_errors');
                        DebugLogger.log(`❌ Error en grupo ${i + 1}: ${error.message}`, 'error');
                        
                        // Fallback a ejecución secuencial para este grupo
                        DebugLogger.log(`🔄 Fallback a ejecución secuencial para grupo ${i + 1}`, 'warning');
                        for (const step of group) {
                            currentData = await this.executeStep(step, currentData, executionContext);
                        }
                    }
                }
            }
            
            return currentData;
        }
        
        // Ejecutar paso con timeout
        async executeStepWithTimeout(step, data, executionContext, timeoutMs) {
            const stepTimer = PipelineMetricsInstance.startTimer(`step-detail-${step.id}`);
            
            try {
                const handler = PipelineStepHandlers[step.id];
                if (!handler) {
                    throw new Error(`Handler no encontrado para paso ${step.id}`);
                }
                
                DebugLogger.log(`🔧 Ejecutando paso: ${step.name} (timeout: ${timeoutMs}ms)`, 'info');
                
                // Crear Promise con timeout - manejar handlers async y sync
                const promise = new Promise(async (resolve, reject) => {
                    try {
                        const result = handler(data, step);
                        // Si el handler retorna una Promise, esperarla
                        if (result && typeof result.then === 'function') {
                            resolve(await result);
                        } else {
                            resolve(result);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Timeout en ${step.name} (${timeoutMs}ms)`)), timeoutMs);
                });
                
                const result = await Promise.race([promise, timeoutPromise]);
                
                PipelineMetricsInstance.incrementCounter(`step-${step.id}-success`);
                return result;
                
            } catch (error) {
                PipelineMetricsInstance.incrementCounter(`step-${step.id}-error`);
                DebugLogger.log(`❌ Error en paso ${step.name}: ${error.message}`, 'error');
                throw error;
            } finally {
                PipelineMetricsInstance.endTimer(`step-detail-${step.id}`);
            }
        }
        
        // Ejecutar paso individual (legacy)
        async executeStep(step, data, executionContext) {
            return this.executeStepWithTimeout(step, data, executionContext, 60000); // 60s default
        }
        
        // Determinar si es un grupo de post-processing
        isPostProcessingGroup(group) {
            const postProcessingSteps = ['quality', 'difficulty-balance', 'cloze-generator'];
            return group.every(step => postProcessingSteps.includes(step.id));
        }
        
        // Combinar resultados de post-processing paralelo
        async combinePostProcessingResults(results, group, originalData) {
            let combinedData = originalData;
            
            for (let i = 0; i < results.length; i++) {
                const step = group[i];
                const result = results[i];
                
                if (Array.isArray(result)) {
                    combinedData = result; // Cada paso de post-processing modifica el array completo
                }
            }
            
            return combinedData;
        }
        
        // Ejecutar con timeout (método utilitario)
        async executeWithTimeout(promise, timeoutMs, stepName) {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Timeout en ${stepName} (${timeoutMs}ms)`)), timeoutMs);
            });
            
            return Promise.race([promise, timeoutPromise]);
        }
    }

// Instancia global de paralelizador
const PipelineParallelizerInstance = new PipelineParallelizer();

// Exports
export { PipelineParallelizer, PipelineParallelizerInstance };
export default PipelineParallelizerInstance;
