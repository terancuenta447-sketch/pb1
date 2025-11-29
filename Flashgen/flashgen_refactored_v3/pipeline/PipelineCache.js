/**
 * Módulo: PipelineCache
 * Categoría: pipeline
 * Sistema de caché inteligente con LRU y TTL
 */

import { DebugLogger } from '../ui/debug_logger.js';

class PipelineCache {
        constructor() {
            this.cache = new Map();
            this.maxSize = 100; // Máximo número de entradas
            this.ttl = 30 * 60 * 1000; // 30 minutos TTL
            this.hitCount = 0;
            this.missCount = 0;
        }
        
        // Generar hash clave para caché
        generateKey(text, template, profile, options) {
            const keyData = {
                textHash: this.hashString(text),
                template: template?.name || 'unknown',
                profile,
                options: this.sanitizeOptions(options)
            };
            return JSON.stringify(keyData);
        }
        
        // Hash simple para strings
        hashString(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convertir a 32-bit integer
            }
            return hash.toString(36);
        }
        
        // Sanitizar opciones para clave consistente
        sanitizeOptions(options) {
            if (!options) return {};
            const sanitized = {};
            const keysToKeep = ['chunkMethod', 'chunkSize', 'qualityThreshold', 'temperature'];
            keysToKeep.forEach(key => {
                if (options[key] !== undefined) {
                    sanitized[key] = options[key];
                }
            });
            return sanitized;
        }
        
        // Obtener de caché
        get(key) {
            const entry = this.cache.get(key);
            if (!entry) {
                this.missCount++;
                return null;
            }
            
            // Verificar TTL
            if (Date.now() > entry.expiry) {
                this.cache.delete(key);
                this.missCount++;
                DebugLogger.log(`🕐 Cache entry expired: ${key}`, 'info');
                return null;
            }
            
            this.hitCount++;
            entry.lastAccessed = Date.now();
            DebugLogger.log(`🎯 Cache hit: ${key}`, 'success');
            return entry.data;
        }
        
        // Guardar en caché
        set(key, data) {
            // Evitar caché si hay errores
            if (data.errors && data.errors.length > 0) {
                DebugLogger.log(`⚠️ No cacheando resultado con errores: ${key}`, 'warning');
                return;
            }
            
            // Implementar LRU si excede tamaño
            if (this.cache.size >= this.maxSize) {
                this.evictLRU();
            }
            
            const entry = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + this.ttl,
                lastAccessed: Date.now()
            };
            
            this.cache.set(key, entry);
            DebugLogger.log(`💾 Cache set: ${key}`, 'info');
        }
        
        // Evictar entrada menos usada recientemente (LRU)
        evictLRU() {
            let oldestKey = null;
            let oldestTime = Date.now();
            
            for (const [key, entry] of this.cache) {
                if (entry.lastAccessed < oldestTime) {
                    oldestTime = entry.lastAccessed;
                    oldestKey = key;
                }
            }
            
            if (oldestKey) {
                this.cache.delete(oldestKey);
                DebugLogger.log(`🗑️ Cache evicted (LRU): ${oldestKey}`, 'info');
            }
        }
        
        // Obtener estadísticas
        getStats() {
            const total = this.hitCount + this.missCount;
            return {
                size: this.cache.size,
                maxSize: this.maxSize,
                hitCount: this.hitCount,
                missCount: this.missCount,
                hitRate: total > 0 ? (this.hitCount / total * 100).toFixed(2) + '%' : '0%',
                entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
                    key: key.substring(0, 50) + '...',
                    age: Date.now() - entry.timestamp,
                    lastAccessed: Date.now() - entry.lastAccessed,
                    hasExpiry: entry.expiry > Date.now()
                }))
            };
        }
        
        // Eliminar entrada específica
        delete(key) {
            const deleted = this.cache.delete(key);
            if (deleted) {
                DebugLogger.log(`🗑️ Cache entry deleted: ${key}`, 'info');
            }
            return deleted;
        }
        
        // Limpiar caché completo
        clear() {
            const size = this.cache.size;
            this.cache.clear();
            this.hitCount = 0;
            this.missCount = 0;
            DebugLogger.log(`🧹 Cache limpiada (${size} entradas eliminadas)`, 'info');
        }
        
        // Limpiar entradas expiradas
        cleanup() {
            let cleaned = 0;
            const now = Date.now();
            
            for (const [key, entry] of this.cache) {
                if (now > entry.expiry) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }
            
            if (cleaned > 0) {
                DebugLogger.log(`🧹 Cache cleanup: ${cleaned} entradas expiradas eliminadas`, 'info');
            }
            
            return cleaned;
        }
    }

// Instancia global de caché
const PipelineCacheInstance = new PipelineCache();

// Exports
export { PipelineCache, PipelineCacheInstance };
export default PipelineCacheInstance;
