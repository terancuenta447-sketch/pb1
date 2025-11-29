/**
 * Módulo: MemoryManager
 * Categoría: pipeline
 * Optimización de memoria y gestión de recursos
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { PipelineMetricsInstance } from './PipelineMetrics.js';
import { PipelineCacheInstance } from './PipelineCache.js';

class MemoryManager {
        constructor() {
            this.memoryThreshold = 100 * 1024 * 1024; // 100MB
            this.cleanupInterval = 60000; // 1 minuto
            this.monitors = new Map();
            this.cleanupTimer = null;
            this.stats = {
                cleanups: 0,
                memoryFreed: 0,
                objectsCollected: 0
            };
            
            this.startMonitoring();
        }
        
        // Iniciar monitoreo de memoria
        startMonitoring() {
            this.cleanupTimer = setInterval(() => {
                this.checkMemoryUsage();
                this.performCleanup();
            }, this.cleanupInterval);
            
            DebugLogger.log('🧠 Memory Manager iniciado', 'success');
        }
        
        // Detener monitoreo
        stopMonitoring() {
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
                DebugLogger.log('🛑 Memory Manager detenido', 'info');
            }
        }
        
        // Verificar uso de memoria
        checkMemoryUsage() {
            if (performance.memory) {
                const used = performance.memory.usedJSHeapSize;
                const total = performance.memory.totalJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                
                const usagePercent = (used / limit * 100).toFixed(2);
                
                PipelineMetricsInstance.setGauge('memory_used_mb', Math.round(used / 1024 / 1024));
                PipelineMetricsInstance.setGauge('memory_usage_percent', parseFloat(usagePercent));
                
                if (used > this.memoryThreshold) {
                    DebugLogger.log(`⚠️ Umbral de memoria excedido: ${Math.round(used / 1024 / 1024)}MB`, 'warning');
                    this.performCleanup();
                }
                
                DebugLogger.log(`🧠 Memoria: ${Math.round(used / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB (${usagePercent}%)`, 'info');
            }
        }
        
        // Realizar limpieza de memoria
        performCleanup() {
            const beforeMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Limpiar caché expirada
            const cacheCleaned = PipelineCacheInstance.cleanup();
            
            // Limpiar métricas antiguas (mantener solo últimas 1000 entradas)
            this.cleanupMetrics();
            
            // Forzar garbage collection si está disponible
            if (window.gc) {
                window.gc();
                DebugLogger.log('🗑️ Garbage collection forzada', 'info');
            }
            
            const afterMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryFreed = beforeMemory - afterMemory;
            
            if (memoryFreed > 0) {
                this.stats.memoryFreed += memoryFreed;
                this.stats.objectsCollected += cacheCleaned;
                DebugLogger.log(`🧹 Memoria liberada: ${Math.round(memoryFreed / 1024 / 1024)}MB`, 'success');
            }
            
            this.stats.cleanups++;
        }
        
        // Limpiar métricas antiguas
        cleanupMetrics() {
            // Mantener solo las últimas 1000 entradas por histogram
            for (const [name, values] of PipelineMetricsInstance.histograms) {
                if (values.length > 1000) {
                    PipelineMetricsInstance.histograms.set(name, values.slice(-1000));
                }
            }
        }
        
        // Monitorear objeto específico
        monitorObject(key, object) {
            this.monitors.set(key, {
                object,
                created: Date.now(),
                size: this.estimateObjectSize(object)
            });
        }
        
        // Estimar tamaño de objeto
        estimateObjectSize(obj) {
            try {
                return JSON.stringify(obj).length;
            } catch (error) {
                return 0;
            }
        }
        
        // Liberar objeto monitoreado
        releaseObject(key) {
            if (this.monitors.has(key)) {
                this.monitors.delete(key);
                DebugLogger.log(`🗑️ Objeto liberado: ${key}`, 'info');
            }
        }
        
        // Obtener estadísticas
        getStats() {
            return {
                ...this.stats,
                monitoredObjects: this.monitors.size,
                cacheStats: PipelineCacheInstance.getStats(),
                metricsStats: {
                    histogramsCount: PipelineMetricsInstance.histograms.size,
                    timersCount: PipelineMetricsInstance.timers.size,
                    countersCount: PipelineMetricsInstance.counters.size
                }
            };
        }
        
        // Resetear estadísticas
        resetStats() {
            this.stats = {
                cleanups: 0,
                memoryFreed: 0,
                objectsCollected: 0
            };
            DebugLogger.log('🧹 Estadísticas de Memory Manager reseteadas', 'info');
        }
    }

// Instancia global de memory manager
const MemoryManagerInstance = new MemoryManager();

// Exports
export { MemoryManager, MemoryManagerInstance };
export default MemoryManagerInstance;