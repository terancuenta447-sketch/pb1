/**
 * Modulo: Debug Logger
 * Categoria: ui
 * Extraido de: Flashgen.js (lineas 7-171)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: render, onStateChange, ensureVisible, init, openTemplateImportDialog
 * Dependencias: DebugLogger, State
 */

import { State } from '../core/state.js';
import { Templates } from '../core/templates.js';

const DebugLogger = {
    logs: [],
    enabled: false,

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const colors = {
            info: 'var(--color-gray-300)',
            success: 'var(--color-success)',
            error: 'var(--color-error)',
            warning: 'var(--color-warning)',
            api: 'var(--color-teal-300)'
        };

        const entry = {
            timestamp,
            message,
            type,
            color: colors[type] || colors.info
        };
        this.logs.push(entry);
        if (this.logs.length > 500) {
            this.logs = this.logs.slice(-500);
        }
        this.render();
    },

        toggle(forceState) {
            if (typeof forceState === 'boolean') {
                this.enabled = forceState;
            } else {
                this.enabled = !this.enabled;
            }
            const consoleEl = document.getElementById('debugConsole');
            if (consoleEl) {
                consoleEl.style.display = this.enabled ? 'block' : 'none';
            }
            this.render();
            return this.enabled;
        },

        ensureVisible(reason) {
            if (this.enabled) return;
            this.toggle(true);
            if (reason) {
                this.log(`🔔 Debug activado automaticamente: ${reason}`, 'info');
            }
        },

        clear() {
            this.logs = [];
            this.render();
        },

        render() {
            const output = document.getElementById('debugOutput');
            if (!output) return;
            if (!this.enabled) {
                output.innerHTML = '<p style="color: var(--color-gray-500);">(Debug desactivado)</p>';
                return;
            }
            if (!this.logs.length) {
                output.innerHTML = '<p style="color: var(--color-gray-500);">(Sin logs aun)</p>';
                return;
            }
            output.innerHTML = this.logs.map(entry => (
                `<div class="debug-entry" style="margin-bottom: 2px; color: ${entry.color};">
                    <span style="color: var(--color-gray-400);">[${entry.timestamp}]</span> ${this.escapeHtml(entry.message)}
                </div>`
            )).join('\n');
            output.scrollTop = output.scrollHeight;
        },

        init() {
            try {
                console.log('🔄 Inicializando DebugLogger...');
                this.cacheDom();
                this.bindControls();
                this.render();
                console.log('✅ DebugLogger inicializado correctamente');
                
                // NO activar automáticamente, el usuario debe hacerlo manualmente
            } catch (error) {
                console.error('❌ Error inicializando DebugLogger:', error);
            }
        },

        cacheDom() {
            this.consoleEl = document.getElementById('debugConsole');
            this.outputEl = document.getElementById('debugOutput');
            this.clearBtn = document.getElementById('clearDebugLog');
        },

        bindControls() {
            const headerToggle = document.getElementById('debugToggle');
            if (headerToggle) {
                headerToggle.addEventListener('click', () => {
                    this.toggle();
                    console.log(`Debug log ${this.enabled ? 'activado' : 'desactivado'}`);
                });
            }
            
            // El botón "Cerrar Debug" debe CERRAR el debug log, no limpiarlo
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => {
                    this.toggle(false); // Cerrar el debug log
                    console.log('Debug log cerrado');
                });
            }
            
            // Atajo de teclado: Ctrl+Shift+D
            document.addEventListener('keydown', event => {
                if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'd') {
                    event.preventDefault();
                    this.toggle();
                }
            });
        },

        openTemplateImportDialog() {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = `debugTemplateImportInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            input.name = input.id;
            input.accept = 'application/json,.json';
            input.addEventListener('change', event => {
                const file = event.target.files?.[0];
                if (!file) return;
                Templates.importAll(file);
            }, { once: true });
            input.click();
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = String(str ?? '');
            return div.innerHTML;
        },

        // Nueva funcion para conectar validacion del pipeline con UI
        updateGenerateButton(enabled) {
            const generateBtn = document.getElementById('generateBtn');
            if (generateBtn) {
                generateBtn.disabled = !enabled;
                generateBtn.style.opacity = enabled ? '1' : '0.6';
                
                // Actualizar tooltip/title
                generateBtn.title = enabled 
                    ? 'Generar flashcards con el pipeline configurado'
                    : 'Corrige los errores del pipeline antes de generar';
                    
                DebugLogger.log(`🔘 Boton generar ${enabled ? 'habilitado' : 'deshabilitado'} segun validacion del pipeline`, 'info');
            }
        },

        // Nueva funcion para indicadores visuales de features
        updateFeatureIndicators() {
            // Actualizar contadores de features activas
            const activeFeatures = Object.values(State.config.features || {}).filter(Boolean).length;
            const totalFeatures = Object.keys(State.config.features || {}).length;
            
            const indicator = document.getElementById('activeFeaturesIndicator');
            if (indicator) {
                indicator.textContent = `${activeFeatures}/${totalFeatures}`;
                indicator.style.color = activeFeatures > totalFeatures / 2 ? 'var(--color-success)' : 'var(--color-text-secondary)';
            }
            
            // Actualizar badges en toggles
            const toggles = document.querySelectorAll('.feature-toggle input[type="checkbox"]');
            toggles.forEach(toggle => {
                const label = toggle.closest('label');
                if (label) {
                    label.classList.toggle('feature-active', toggle.checked);
                }
            });
            
            DebugLogger.log(`📊 Features activas: ${activeFeatures}/${totalFeatures}`, 'info');
        },

        // Funcion para manejar cambios de estado (para futuras expansiones)
        onStateChange(eventType, data) {
            DebugLogger.log(`📊 Cambio de estado: ${eventType}`, 'info');
            // Aqui se pueden añadir mas conexiones GUI-logica en el futuro
        }
    };


// Exponer globalmente
if (typeof window !== 'undefined') {
    window.DebugLogger = DebugLogger;
}

// Exports
export { DebugLogger };
export default DebugLogger;
