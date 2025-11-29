/**
 * UI SIMPLE - Reemplazo de ui.js (era 2097 líneas)
 *
 * Solo lo esencial:
 * - Inicialización básica
 * - DOM caching simple
 * - Sin complejidad innecesaria
 */

import { State } from '../core/state.js';
import { TabManagerSimple } from './tab_manager_simple.js';

export const UI = {
    initialized: false,

    init() {
        if (this.initialized) {
            console.warn('⚠️ UI ya inicializado');
            return;
        }

        console.log('🚀 UI Simple inicializando...');

        try {
            // Cachear elementos básicos
            this.cacheDom();

            // Inicializar TabManager
            if (TabManagerSimple && TabManagerSimple.init) {
                TabManagerSimple.init();
            }

            // Bind eventos básicos
            this.bindBasicEvents();

            this.initialized = true;
            console.log('✅ UI Simple inicializado');

        } catch (error) {
            console.error('❌ Error inicializando UI:', error);
            this.initialized = false;
        }
    },

    cacheDom() {
        // Elementos básicos
        this.inputText = document.getElementById('inputText');
        this.generateBtn = document.getElementById('generateBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.exportBtn = document.getElementById('exportBtn');
    },

    bindBasicEvents() {
        // Generate button
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', () => {
                this.generate();
            });
        }

        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                State.cancelGeneration = true;
                console.log('⏹️ Generación cancelada');
            });
        }

        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => {
                if (window.Exporter && window.Exporter.download) {
                    window.Exporter.download();
                }
            });
        }
    },

    async generate() {
        const inputText = this.inputText?.value?.trim();

        if (!inputText) {
            alert('Por favor ingresa texto');
            return;
        }

        console.log('🚀 Iniciando generación...');

        try {
            // Guardar texto en State
            State.inputText = inputText;

            // Llamar al procesamiento
            if (window.Processing && window.Processing.run) {
                await window.Processing.run(inputText);
                console.log('✅ Generación completada');

                // Cambiar a tab de resultados
                if (TabManagerSimple && TabManagerSimple.switchTab) {
                    TabManagerSimple.switchTab('results');
                }
            } else {
                console.error('❌ Processing no disponible');
            }

        } catch (error) {
            console.error('❌ Error generando:', error);
            alert('Error al generar flashcards: ' + error.message);
        }
    },

    toast(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    download(filename, content, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.UI = UI;
}

export default UI;
