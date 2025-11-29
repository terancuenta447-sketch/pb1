/**
 * Módulo: PipelineMetrics
 * Categoría: pipeline
 * Sistema de métricas y profiling de rendimiento
 */

import { DebugLogger } from '../ui/debug_logger.js';

class PipelineMetrics {
        constructor() {
            this.metrics = new Map();
            this.timers = new Map();
            this.counters = new Map();
            this.gauges = new Map();
            this.histograms = new Map();
        }
        
        // Iniciar timer para medir tiempo de ejecución
        startTimer(name) {
            const timer = {
                startTime: performance.now(),
                endTime: null,
                duration: null
            };
            this.timers.set(name, timer);
            DebugLogger.log(`⏱️ Timer iniciado: ${name}`, 'info');
            return timer;
        }
        
        // Detener timer y registrar métrica
        endTimer(name) {
            const timer = this.timers.get(name);
            if (!timer) {
                DebugLogger.log(`⚠️ Timer no encontrado: ${name}`, 'warning');
                return null;
            }
            
            timer.endTime = performance.now();
            timer.duration = timer.endTime - timer.startTime;
            
            // Registrar en histogram para estadísticas
            if (!this.histograms.has(name)) {
                this.histograms.set(name, []);
            }
            this.histograms.get(name).push(timer.duration);
            
            DebugLogger.log(`⏱️ Timer completado: ${name} (${timer.duration.toFixed(2)}ms)`, 'success');
            return timer;
        }
        
        // Incrementar contador
        incrementCounter(name, value = 1) {
            const current = this.counters.get(name) || 0;
            this.counters.set(name, current + value);
            DebugLogger.log(`📊 Contador ${name}: ${current + value}`, 'info');
        }
        
        // Establecer gauge (valor actual)
        setGauge(name, value) {
            this.gauges.set(name, value);
            DebugLogger.log(`📈 Gauge ${name}: ${value}`, 'info');
        }
        
        // Registrar métrica personalizada
        setMetric(name, value) {
            this.metrics.set(name, {
                value,
                timestamp: Date.now(),
                type: typeof value
            });
        }
        
        // Obtener estadísticas de histogram
        getHistogramStats(name) {
            const values = this.histograms.get(name) || [];
            if (values.length === 0) return null;
            
            const sorted = [...values].sort((a, b) => a - b);
            const sum = values.reduce((a, b) => a + b, 0);
            
            return {
                count: values.length,
                min: sorted[0],
                max: sorted[sorted.length - 1],
                mean: sum / values.length,
                median: sorted[Math.floor(sorted.length / 2)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            };
        }
        
        // Generar reporte completo
        generateReport() {
            const report = {
                timestamp: new Date().toISOString(),
                counters: Object.fromEntries(this.counters),
                gauges: Object.fromEntries(this.gauges),
                metrics: Object.fromEntries(this.metrics),
                histograms: {}
            };
            
            // Agregar estadísticas de histogramas
            for (const [name] of this.histograms) {
                report.histograms[name] = this.getHistogramStats(name);
            }
            
            return report;
        }
        
        // Resetear todas las métricas
        reset() {
            this.metrics.clear();
            this.timers.clear();
            this.counters.clear();
            this.gauges.clear();
            this.histograms.clear();
            DebugLogger.log('🧹 Métricas reseteadas', 'info');
        }
    }

// Instancia global de métricas
const PipelineMetricsInstance = new PipelineMetrics();

// Exports
export { PipelineMetrics, PipelineMetricsInstance };
export default PipelineMetricsInstance;
