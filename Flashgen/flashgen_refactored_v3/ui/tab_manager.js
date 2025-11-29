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

// ========================================
// CONFIGURACIÓN CENTRAL DE SECCIONES
// ========================================
export const SECTIONS = [
    { id: "config", label: "Configuración", icon: "ri-settings-3-line" },
    { id: "templates", label: "Plantillas", icon: "ri-file-list-3-line" },
    { id: "pipeline", label: "Pipeline", icon: "ri-node-tree" },
    { id: "input", label: "Entrada", icon: "ri-edit-2-line" },
    { id: "chain", label: "Cadena", icon: "ri-links-line" },
    { id: "results", label: "Resultados", icon: "ri-bar-chart-box-line" },
    { id: "learning", label: "Aprendizaje", icon: "ri-graduation-cap-line" },
    { id: "comparison", label: "Comparación", icon: "ri-scales-3-line" },
    { id: "export", label: "Exportar", icon: "ri-save-3-line" }
];

export const TabManager = {
    tabButtons: [],
    tabContents: [],
    activeTab: 'config',

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    cacheTabs() {
        console.log('🔍 Cacheando pestañas...');

        // Buscar botones del sidebar (nuevo sistema)
        this.tabButtons = Array.from(document.querySelectorAll('#sidebar button[data-go]'));

        // Si no hay botones en sidebar, intentar sistema antiguo para compatibilidad
        if (this.tabButtons.length === 0) {
            console.warn('⚠️ No se encontraron botones en sidebar, intentando sistema antiguo (.tab-btn)');
            this.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
        }

        // Buscar secciones (nuevo sistema: section.section-content)
        this.tabContents = Array.from(document.querySelectorAll('section.section-content'));

        // Si no hay secciones, intentar sistema antiguo para compatibilidad
        if (this.tabContents.length === 0) {
            console.warn('⚠️ No se encontraron section.section-content, intentando sistema antiguo (.tab-content)');
            this.tabContents = Array.from(document.querySelectorAll('.tab-content'));
        }

        console.log(`✅ Pestañas cacheadas: ${this.tabButtons.length} botones, ${this.tabContents.length} contenidos`);

        if (this.tabButtons.length === 0 || this.tabContents.length === 0) {
            console.error('❌ No se encontraron pestañas en el DOM');
            return false;
        }

        return true;
    },

    // ========================================
    // GENERACIÓN DE SIDEBAR
    // ========================================

    generateSidebar() {
        console.log('🔧 Generando sidebar dinámicamente...');

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('❌ No se encontró elemento #sidebar en el DOM');
            return false;
        }

        // Generar HTML de botones desde SECTIONS
        const buttonsHTML = SECTIONS.map(section => `
            <button class="sidebar-btn" data-go="${section.id}">
                <i class="${section.icon}"></i> ${section.label}
            </button>
        `).join('');

        sidebar.innerHTML = buttonsHTML;

        console.log(`✅ Sidebar generado con ${SECTIONS.length} botones`);

        // Re-cachear botones después de generar
        this.cacheTabs();

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

        console.log(`🔄 Cambiando a sección: ${tabId}`);

        // 1. Actualizar botones del sidebar
        this.tabButtons.forEach(btn => {
            // Soportar tanto data-go (nuevo) como data-tab (antiguo)
            const btnId = btn.dataset.go || btn.dataset.tab;
            btn.classList.toggle('active', btnId === tabId);
        });

        // 2. Buscar la sección objetivo
        const section = document.getElementById(tabId);
        if (!section) {
            console.error(`❌ No se encontró sección con id="${tabId}"`);
            return;
        }

        // 3. Hacer scroll suave a la sección
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // 4. Actualizar estado activo
        this.activeTab = tabId;

        // 5. Inicializar contenido lazy si es necesario
        this.initTabContent(tabId);

        console.log(`✅ Sección "${tabId}" activada`);
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
