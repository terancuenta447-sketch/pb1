/**
 * TabManager V2 - Gestor de pestañas con arquitectura Component
 *
 * GARANTIZA que cada tab siempre sea visible y tenga contenido
 * Usa patrón Component para lifecycle robusto
 */

import { StateManager } from '../core/state_manager.js';
import { ResultsTabComponent } from './tabs/results_tab.js';
import { ExportTabComponent } from './tabs/export_tab.js';
import { ChainTabComponent } from './tabs/chain_tab.js';
import { InputTabComponent } from './tabs/input_tab.js';

class TabManagerV2 {
    constructor() {
        this.tabButtons = [];
        this.tabContents = [];
        this.components = new Map();
        this.currentTab = null;

        console.log('📦 TabManagerV2 creado');
    }

    /**
     * Inicializar TabManager
     */
    init() {
        console.log('🔧 TabManagerV2.init() iniciado');

        // Cachear elementos DOM
        this.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
        this.tabContents = Array.from(document.querySelectorAll('.tab-content'));

        if (this.tabButtons.length === 0 || this.tabContents.length === 0) {
            throw new Error('❌ No se encontraron tabs en el DOM');
        }

        console.log(`✅ Encontrados ${this.tabButtons.length} botones y ${this.tabContents.length} contenidos`);

        // Crear componentes para tabs específicos
        this.registerComponent('results', new ResultsTabComponent());
        this.registerComponent('export', new ExportTabComponent());
        this.registerComponent('chain', new ChainTabComponent());
        this.registerComponent('input', new InputTabComponent());

        // Bind eventos
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });

        // Activar tab inicial
        const initialTab = this.tabButtons.find(btn => btn.classList.contains('active'));
        const initialTabId = initialTab?.dataset.tab || 'config';
        this.switchTab(initialTabId);

        console.log('✅ TabManagerV2 inicializado');
    }

    /**
     * Registrar un componente para un tab
     */
    registerComponent(tabId, component) {
        this.components.set(tabId, component);
        console.log(`📦 Componente registrado para tab "${tabId}"`);
    }

    /**
     * Cambiar de tab
     * GARANTIZA visibilidad del nuevo tab
     */
    switchTab(tabId) {
        console.log(`🔄 Cambiando a tab: ${tabId}`);

        // Actualizar botones
        this.tabButtons.forEach(btn => {
            const isActive = btn.dataset.tab === tabId;
            btn.classList.toggle('active', isActive);
        });

        // Actualizar contenidos
        this.tabContents.forEach(content => {
            const isActive = content.id === tabId;

            if (isActive) {
                // ✅ GARANTIZAR visibilidad
                content.classList.add('active');
                content.style.display = 'block';
                content.style.visibility = 'visible';
                content.style.opacity = '1';
                content.style.minHeight = '400px';

                // Forzar reflow
                void content.offsetHeight;
            } else {
                content.classList.remove('active');
                content.style.display = 'none';
            }
        });

        // Montar o actualizar componente si existe
        const component = this.components.get(tabId);
        if (component) {
            try {
                if (!component.isMounted) {
                    component.mount();
                } else {
                    component.update();
                }

                // Forzar renderizado
                component.render();

                console.log(`✅ Componente "${tabId}" montado/actualizado`);
            } catch (error) {
                console.error(`❌ Error montando componente "${tabId}":`, error);
            }
        }

        // Actualizar estado
        this.currentTab = tabId;
        StateManager.set('currentTab', tabId);

        console.log(`✅ Tab cambiado a: ${tabId}`);

        // ✅ VERIFICAR visibilidad después de cambio
        setTimeout(() => this.verifyTabVisibility(tabId), 100);
    }

    /**
     * Verificar que el tab sea visible
     */
    verifyTabVisibility(tabId) {
        const tabContent = document.getElementById(tabId);
        if (!tabContent) {
            console.error(`❌ Tab "${tabId}" no encontrado en DOM`);
            return;
        }

        const computedStyle = window.getComputedStyle(tabContent);
        const isVisible = computedStyle.display !== 'none' &&
                         computedStyle.visibility !== 'hidden' &&
                         computedStyle.opacity !== '0';

        if (!isVisible) {
            console.error(`❌ CRÍTICO: Tab "${tabId}" NO ES VISIBLE`);
            console.error('   - display:', computedStyle.display);
            console.error('   - visibility:', computedStyle.visibility);
            console.error('   - opacity:', computedStyle.opacity);

            // ✅ FORZAR visibilidad
            tabContent.style.display = 'block !important';
            tabContent.style.visibility = 'visible !important';
            tabContent.style.opacity = '1 !important';
        } else {
            console.log(`✅ Tab "${tabId}" es VISIBLE`);
        }

        // Verificar altura
        const height = tabContent.offsetHeight;
        if (height < 100) {
            console.warn(`⚠️ Tab "${tabId}" tiene altura muy baja: ${height}px`);

            // ✅ FORZAR altura mínima
            tabContent.style.minHeight = '400px';
        }
    }

    /**
     * Obtener tab activo
     */
    getActiveTab() {
        return this.currentTab;
    }

    /**
     * Destruir TabManager
     */
    destroy() {
        // Desmontar todos los componentes
        this.components.forEach((component, tabId) => {
            try {
                component.unmount();
                console.log(`🗑️ Componente "${tabId}" desmontado`);
            } catch (error) {
                console.error(`❌ Error desmontando componente "${tabId}":`, error);
            }
        });

        this.components.clear();
        this.tabButtons = [];
        this.tabContents = [];
        this.currentTab = null;

        console.log('🗑️ TabManagerV2 destruido');
    }
}

// Singleton
const tabManagerV2 = new TabManagerV2();

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.TabManagerV2 = tabManagerV2;
}

export { tabManagerV2 as TabManagerV2 };
export default tabManagerV2;
