/**
 * init_tabs_v2.js - Script de inicialización para TabManagerV2
 *
 * USO: Importar esto en Flashgen.html después de cargar todos los módulos
 *
 * EJEMPLO:
 * <script type="module">
 *   import './flashgen_refactored_v3/init_tabs_v2.js';
 * </script>
 */

import { TabManagerV2 } from './ui/tab_manager_v2.js';
import { StateManager } from './core/state_manager.js';

console.log('🚀 Inicializando TabManagerV2...');

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTabsV2();
    });
} else {
    initTabsV2();
}

function initTabsV2() {
    try {
        // Inicializar TabManagerV2
        TabManagerV2.init();

        // Exponer globalmente para debugging
        window.TabManagerV2Instance = TabManagerV2;
        window.StateManagerInstance = StateManager;

        console.log('✅ TabManagerV2 inicializado exitosamente');

        // Exportar para que otros módulos puedan acceder
        if (typeof window.ResultsTab === 'undefined' && TabManagerV2.components.has('results')) {
            window.ResultsTab = TabManagerV2.components.get('results');
        }

    } catch (error) {
        console.error('❌ Error inicializando TabManagerV2:', error);
        console.error(error.stack);
    }
}

export { initTabsV2 };
export default initTabsV2;
