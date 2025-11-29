/**
 * TabManager - VERSIÓN SIMPLIFICADA DEFINITIVA
 * 
 * FILOSOFÍA:
 * - El CSS maneja el layout (display: none/block)
 * - JS solo cambia clases (sin !important, sin estilos inline)
 * - Sin batallas de especificidad CSS vs JS
 * - Sin forzar dimensiones inline
 * - Sin detectar colapsos
 * - Sin requestAnimationFrame complejo
 */

import { DebugLogger } from './debug_logger.js';

export const TabManager = {
    tabButtons: [],
    tabContents: [],
    activeTab: 'config',

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    cacheTabs() {
        console.log('🔍 Cacheando pestañas...');
        
        this.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
        this.tabContents = Array.from(document.querySelectorAll('.tab-content'));
        
        console.log(`✅ Pestañas cacheadas: ${this.tabButtons.length} botones, ${this.tabContents.length} contenidos`);
        
        if (this.tabButtons.length === 0 || this.tabContents.length === 0) {
            console.error('❌ No se encontraron pestañas en el DOM');
            return false;
        }
        
        return true;
    },

    // ========================================
    // CAMBIO DE PESTAÑA (SIMPLIFICADO DEFINITIVO)
    // ========================================

    switchTab(tabId) {
        if (!tabId) {
            console.error('❌ TabId es requerido');
            return;
        }

        // ✅ CRÍTICO: Verificar y corregir contenedor .container ANTES de todo
        const container = document.querySelector('.container');
        if (container) {
            const containerComputed = window.getComputedStyle(container);
            if (containerComputed.display === 'none' || container.style.display === 'none') {
                console.warn('⚠️ .container tiene display: none, corrigiendo...');
                container.style.setProperty('display', 'flex', 'important');
                container.style.setProperty('flex-direction', 'column', 'important');
                void container.offsetHeight; // Forzar reflow
            }
        }

        // 1. Actualizar botones - solo clases, sin estilos inline
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // 2. Actualizar contenidos - solo clases, CSS maneja el display
        this.tabContents.forEach(content => {
            const isActive = content.id === tabId;
            content.classList.toggle('active', isActive);
            
            if (isActive) {
                this.activeTab = tabId;
                // Inicializar contenido si es necesario
                this.initTabContent(tabId);
            }
        });
    },

    // ========================================
    // INICIALIZACIÓN DE CONTENIDO POR TAB
    // ========================================

    initTabContent(tabId) {
        // Lazy init de módulos cuando se abre la tab por primera vez
        
        switch (tabId) {
            case 'input':
                this.initInputTab();
                break;
            case 'chain':
                this.initChainTab();
                break;
            case 'results':
                this.initResultsTab();
                break;
            case 'learning':
                this.initLearningTab();
                break;
            case 'comparison':
                this.initComparisonTab();
                break;
            case 'export':
                this.initExportTab();
                break;
            // Config, Templates, Pipeline se inicializan en app startup
        }
    },

    // ========================================
    // INICIALIZADORES POR TAB
    // ========================================

    initInputTab() {
        console.log('🔄 Inicializando contenido de pestaña Input...');
        
        if (typeof window.UI !== 'undefined') {
            // Actualizar estadísticas de input
            if (typeof window.UI.updateInputStats === 'function') {
                window.UI.updateInputStats();
            }
            
            // Actualizar preview de chunks
            if (typeof window.UI.updateChunkPreview === 'function') {
                window.UI.updateChunkPreview();
            }
            
            // Actualizar controles de chunking
            if (typeof window.UI.updateChunkingControls === 'function') {
                window.UI.updateChunkingControls();
            }
            
            // Actualizar ayuda de método
            if (typeof window.UI.updateMethodHelp === 'function') {
                window.UI.updateMethodHelp();
            }
        }
        
        console.log('✅ Contenido de pestaña Input inicializado');
    },

    initChainTab() {
        console.log('🔄 Inicializando contenido de pestaña Chain...');
        
        if (typeof window.ChainVisualization !== 'undefined') {
            if (typeof window.ChainVisualization.init === 'function') {
                window.ChainVisualization.init();
            }
            if (typeof window.ChainVisualization.render === 'function') {
                window.ChainVisualization.render();
            }
        }
        
        console.log('✅ Contenido de pestaña Chain inicializado');
    },

    initResultsTab() {
        console.log('🔄 Inicializando contenido de pestaña Results...');
        
        if (typeof window.Results !== 'undefined' && typeof window.Results.updateUI === 'function') {
            window.Results.updateUI();
        }
        
        // Exporter se actualiza automáticamente desde Results.updateUI()
        
        console.log('✅ Contenido de pestaña Results inicializado');
    },

    initLearningTab() {
        console.log('🔄 Inicializando contenido de pestaña Learning...');
        
        if (typeof window.Learning !== 'undefined' && typeof window.Learning.updateUI === 'function') {
            window.Learning.updateUI();
        }
        
        console.log('✅ Contenido de pestaña Learning inicializado');
    },

    initComparisonTab() {
        console.log('🔄 Inicializando contenido de pestaña Comparison...');
        
        if (typeof window.Comparison !== 'undefined' && typeof window.Comparison.init === 'function') {
            window.Comparison.init();
        }
        
        console.log('✅ Contenido de pestaña Comparison inicializado');
    },

    initExportTab() {
        console.log('🔄 Inicializando contenido de pestaña Export...');
        
        if (typeof window.Exporter !== 'undefined' && typeof window.Exporter.updatePreview === 'function') {
            window.Exporter.updatePreview();
        }
        
        console.log('✅ Contenido de pestaña Export inicializado');
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.TabManager = TabManager;
}

export default TabManager;
