/**
 * init_simple.js - Inicialización SIMPLE
 *
 * Carga y expone solo los módulos esenciales
 * Elimina toda la complejidad innecesaria
 */

// Importar módulos simples
import { UI } from './ui/ui_simple.js';
import { TabManagerSimple } from './ui/tab_manager_simple.js';

// Importar módulos core necesarios
import { State } from './core/state.js';
import { Processing } from './processing/processing.js';

// Importar módulos UI necesarios
import { Results } from './ui/results.js';
import { Exporter } from './ui/exporter.js';
import { ChainVisualization } from './ui/chain_visualization.js';
import { Learning } from './ui/learning.js';
import { Comparison } from './ui/comparison.js';

// Exponer en window
if (typeof window !== 'undefined') {
    // Módulos simples
    window.UI = UI;
    window.TabManagerSimple = TabManagerSimple;

    // Módulos core
    window.State = State;
    window.Processing = Processing;

    // Módulos UI
    window.Results = Results;
    window.Exporter = Exporter;
    window.ChainVisualization = ChainVisualization;
    window.Learning = Learning;
    window.Comparison = Comparison;

    console.log('✅ Módulos simples cargados en window');
}

// Inicialización automática
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Inicialización simple automática...');
        });
    }
}

export { UI, TabManagerSimple, State, Processing, Results, Exporter, ChainVisualization, Learning, Comparison };
export default { UI, TabManagerSimple, State, Processing, Results, Exporter, ChainVisualization, Learning, Comparison };
