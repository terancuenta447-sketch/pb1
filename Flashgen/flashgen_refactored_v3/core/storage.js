/**
 * Módulo: Storage
 * Categoría: core
 * Extraído de: Flashgen.js (líneas 4348-4395)
 * Generado automáticamente: 2025-11-28 11:46:46
 * 
 * Dependencias: DebugLogger, State
 */

import { DebugLogger } from '../ui/debug_logger.js';
import { State } from './state.js';

const Storage = {
    save() {
        try {
            // Crear snapshot del estado antes de guardar
            const snapshot = {
                config: State.config,
                templates: State.templates,
                activeTemplate: State.activeTemplate,
                pipeline: {
                    steps: State.pipeline.steps || [],
                    options: State.pipeline.options || {}
                },
                customPipelines: State.customPipelines,
                userModifiedChunkMethod: State.userModifiedChunkMethod,
                timestamp: new Date().toISOString()
            };
                
            localStorage.setItem('flashgen_state', JSON.stringify(snapshot));
            DebugLogger.log('✓ Estado guardado en localStorage', 'success');
            DebugLogger.log(`💾 Guardados ${snapshot.pipeline.steps.length} pasos del pipeline`, 'info');
        } catch (e) {
            DebugLogger.log('❌ Error guardando estado: ' + e.message, 'error');
        }
    },
    load() {
        try {
            const saved = localStorage.getItem('flashgen_state');
            if (saved) {
                const snapshot = JSON.parse(saved);
                if (snapshot.config) State.config = { ...State.config, ...snapshot.config };
                if (snapshot.templates) State.templates = snapshot.templates;
                if (snapshot.activeTemplate) State.activeTemplate = snapshot.activeTemplate;
                if (snapshot.pipeline) {
                    State.pipeline.steps = snapshot.pipeline.steps || [];
                    State.pipeline.options = { ...State.pipeline.options, ...(snapshot.pipeline.options || {}) };
                }
                if (snapshot.customPipelines) State.customPipelines = snapshot.customPipelines;
                if (snapshot.userModifiedChunkMethod) State.userModifiedChunkMethod = snapshot.userModifiedChunkMethod;
                    
                DebugLogger.log(`📂 Estado cargado (${snapshot.timestamp})`, 'success');
                return true;
            }
        } catch (e) {
            DebugLogger.log('❌ Error cargando estado: ' + e.message, 'error');
        }
        return false;
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}

// Exports
export { Storage };
export default Storage;
