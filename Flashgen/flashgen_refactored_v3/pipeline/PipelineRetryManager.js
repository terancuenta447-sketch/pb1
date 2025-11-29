/**
 * Módulo: PipelineRetryManager
 * Categoría: pipeline
 * Sistema de reintentos y recuperación automática
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { PipelineStepHandlers } from './pipeline_step_handlers.js';

class PipelineRetryManager {
        constructor() {
            this.retryConfig = {
                maxRetries: 3,
                baseDelay: 1000, // 1 segundo
                maxDelay: 10000, // 10 segundos
                backoffMultiplier: 2,
                retryableErrors: [
                    'network',
                    'timeout',
                    'rate limit',
                    'temporary',
                    'service unavailable'
                ]
            };
            this.retryStats = {
                totalRetries: 0,
                successfulRetries: 0,
                failedRetries: 0
            };
        }
        
        // Determinar si un error es reintentable
        isRetryableError(error) {
            const errorMessage = error.message.toLowerCase();
            return this.retryConfig.retryableErrors.some(pattern => 
                errorMessage.includes(pattern)
            );
        }
        
        // Calcular delay con backoff exponencial
        calculateDelay(attempt) {
            const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
            return Math.min(delay, this.retryConfig.maxDelay);
        }
        
        // Ejecutar con reintentos
        async executeWithRetry(operation, context, customConfig = {}) {
            const config = { ...this.retryConfig, ...customConfig };
            let lastError;
            
            for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
                try {
                    DebugLogger.log(`🔄 Intento ${attempt}/${config.maxRetries + 1}: ${context.operation}`, 'info');
                    
                    const result = await operation();
                    
                    if (attempt > 1) {
                        this.retryStats.successfulRetries++;
                        DebugLogger.log(`✅ Éxito en reintento ${attempt - 1}: ${context.operation}`, 'success');
                    }
                    
                    return result;
                    
                } catch (error) {
                    lastError = error;
                    
                    // Si es el último intento o el error no es reintentable, lanzar error
                    if (attempt > config.maxRetries || !this.isRetryableError(error)) {
                        if (attempt > config.maxRetries) {
                            this.retryStats.failedRetries++;
                            DebugLogger.log(`❌ Agotados reintentos para: ${context.operation}`, 'error');
                        }
                        throw error;
                    }
                    
                    this.retryStats.totalRetries++;
                    const delay = this.calculateDelay(attempt);
                    
                    DebugLogger.log(`⚠️ Error en intento ${attempt}: ${error.message}`, 'warning');
                    DebugLogger.log(`⏱️ Esperando ${delay}ms antes del reintento...`, 'info');
                    
                    await this.sleep(delay);
                }
            }
            
            throw lastError;
        }
        
        // Sleep helper
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // Ejecutar paso con reintentos
        async executeStepWithRetry(step, data, executionContext) {
            const context = {
                operation: `step-${step.id}`,
                stepName: step.name,
                stepId: step.id
            };
            
            return this.executeWithRetry(
                async () => {
                    // Usar PipelineParallelizer para ejecutar el paso
                    return await PipelineParallelizerInstance.executeStep(step, data, executionContext);
                },
                context,
                {
                    maxRetries: step.maxRetries || this.retryConfig.maxRetries,
                    baseDelay: step.retryDelay || this.retryConfig.baseDelay
                }
            );
        }
        
        // Ejecutar paso individual (extraído para reutilización)
        async executeStep(step, data, executionContext) {
            const handler = PipelineStepHandlers[step.id];
            if (!handler) {
                throw new Error(`Handler no encontrado para paso ${step.id}`);
            }
            
            DebugLogger.log(`🔧 Ejecutando paso: ${step.name}`, 'info');
            const result = handler(data, step);
            
            // Si el handler retorna una Promise, esperarla
            if (result && typeof result.then === 'function') {
                return await result;
            }
            
            return result;
        }
        
        // Obtener estadísticas de reintentos
        getStats() {
            const total = this.retryStats.totalRetries;
            const successful = this.retryStats.successfulRetries;
            const failed = this.retryStats.failedRetries;
            
            return {
                totalRetries: total,
                successfulRetries: successful,
                failedRetries: failed,
                successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%'
            };
        }
        
        // Resetear estadísticas de reintentos
        resetStats() {
            this.retryStats = {
                totalRetries: 0,
                successfulRetries: 0,
                failedRetries: 0
            };
            DebugLogger.log('🧹 Estadísticas de reintentos reseteadas', 'success');
        }
    }

// Instancia global de retry manager
const PipelineRetryManagerInstance = new PipelineRetryManager();

// Exports
export { PipelineRetryManager, PipelineRetryManagerInstance };
export default PipelineRetryManagerInstance;
