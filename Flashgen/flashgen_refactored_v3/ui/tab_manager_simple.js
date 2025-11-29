/**
 * TabManager SIMPLE - Sin complejidad innecesaria
 *
 * GARANTIZA:
 * - Visibilidad de todos los tabs
 * - Sin bugs
 * - Código mínimo y mantenible
 */

export const TabManagerSimple = {
    currentTab: 'config',

    init() {
        console.log('🚀 TabManager Simple inicializando...');

        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabButtons.length === 0 || tabContents.length === 0) {
            console.error('❌ No se encontraron tabs');
            return;
        }

        // Bind eventos
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });

        console.log(`✅ TabManager Simple iniciado (${tabButtons.length} tabs)`);
    },

    switchTab(tabId) {
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Actualizar contenidos
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        this.currentTab = tabId;
        console.log(`✅ Tab cambiado a: ${tabId}`);

        // Inicializar contenido del tab si es necesario
        this.initTabContent(tabId);
    },

    initTabContent(tabId) {
        // Inicialización lazy de módulos
        switch (tabId) {
            case 'results':
                if (window.Results && window.Results.updateUI) {
                    window.Results.updateUI();
                }
                break;
            case 'export':
                if (window.Exporter && window.Exporter.updatePreview) {
                    window.Exporter.updatePreview();
                }
                break;
            case 'chain':
                if (window.ChainVisualization && window.ChainVisualization.render) {
                    window.ChainVisualization.render();
                }
                break;
            case 'learning':
                if (window.Learning && window.Learning.updateUI) {
                    window.Learning.updateUI();
                }
                break;
            case 'comparison':
                if (window.Comparison && window.Comparison.init) {
                    window.Comparison.init();
                }
                break;
        }
    }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
    window.TabManagerSimple = TabManagerSimple;
}

export default TabManagerSimple;
