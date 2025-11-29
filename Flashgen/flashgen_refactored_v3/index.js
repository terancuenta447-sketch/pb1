/**
 * FlashGen - Index Central
 * Generado automáticamente: 2025-11-28 11:46:46
 * 
 * Este archivo re-exporta todos los módulos de FlashGen
 * para facilitar las importaciones.
 */

// Importaciones externas
import { TrueLangChain, ChainNode } from './js/langchain-core.js';

if (typeof TrueLangChain === 'undefined' || typeof ChainNode === 'undefined') {
    throw new Error('langchain-core.js no cargado');
}

// Categoría: api
import { API } from './api/api.js';

// Categoría: chain
import { ChainBuilder } from './chain/chain_builder.js';
import { ChainHandlers } from './chain/chain_handlers.js';

// Categoría: core
import { ExecutionContext, PipelineExecutionContext, PipelineExecutionContextInstance } from './core/execution_context.js';
import { GenerationProfiles } from './core/generation_profiles.js';
import { State } from './core/state.js';
import { Storage } from './core/storage.js';
import { Templates } from './core/templates.js';

// Categoría: managers
import { FewShotManager } from './managers/few_shot_manager.js';
import { ParserManager } from './managers/parser_manager.js';
import { ProfileManager } from './managers/profile_manager.js';

// Categoría: pipeline
import { Pipeline } from './pipeline/pipeline.js';
import { PipelineManager } from './pipeline/pipeline_manager.js';
import { PipelineStepHandlers } from './pipeline/pipeline_step_handlers.js';

// Categoría: processing
import { ChunkStrategies } from './processing/chunk_strategies.js';
import { ClozeEngine } from './processing/cloze_engine.js';
import { Processing } from './processing/processing.js';

// Categoría: ui
import { ChainPanelController } from './ui/chain_panel_controller.js';
import { ChainVisualization } from './ui/chain_visualization.js';
import { Comparison } from './ui/comparison.js';
import { DebugLogger } from './ui/debug_logger.js';
import { DomCache } from './ui/dom_cache.js';
import { EventBinder } from './ui/event_binder.js';
import { Exporter } from './ui/exporter.js';
import { Learning } from './ui/learning.js';
import { Results } from './ui/results.js';
import { TabManager } from './ui/tab_manager.js';
import { UI } from './ui/ui.js';

// Re-exportar para uso selectivo
export {
    API,
    ChainBuilder,
    ChainHandlers,
    ChainPanelController,
    ChainVisualization,
    ChunkStrategies,
    ClozeEngine,
    Comparison,
    DebugLogger,
    DomCache,
    EventBinder,
    ExecutionContext,
    Exporter,
    FewShotManager,
    GenerationProfiles,
    Learning,
    ParserManager,
    Pipeline,
    PipelineExecutionContext,
    PipelineExecutionContextInstance,
    PipelineManager,
    PipelineStepHandlers,
    Processing,
    ProfileManager,
    Results,
    State,
    Storage,
    TabManager,
    Templates,
    UI,
    TrueLangChain,
    ChainNode
};

// Exponer módulos en window para compatibilidad
// ✅ CRÍTICO: Esto debe hacerse INMEDIATAMENTE cuando el módulo se carga
// para que estén disponibles cuando Flashgen.html llama a initializeApp()
if (typeof window !== 'undefined') {
    window.UI = UI;
    window.TabManager = TabManager;
    window.DomCache = DomCache;
    window.EventBinder = EventBinder;
    window.DebugLogger = DebugLogger;
    window.Processing = Processing;
    window.State = State;
    window.Storage = Storage;
    window.Templates = Templates;
    window.PipelineManager = PipelineManager;
    window.ChunkStrategies = ChunkStrategies;
    window.Results = Results;
    window.Learning = Learning;
    window.Exporter = Exporter;
    window.Comparison = Comparison;
    window.ChainVisualization = ChainVisualization;
    window.ChainPanelController = ChainPanelController;
    
    console.log('✅ Módulos expuestos en window desde index.js');
}

// ✅ FIX CRÍTICO: NO inicializar aquí porque Flashgen.html tiene su propio initializeApp()
// El HTML maneja la inicialización completa para tener control del orden
// Si inicializamos aquí también, causamos doble inicialización y conflictos
// 
// NOTA: Si necesitas inicialización automática sin HTML, descomenta el código siguiente:
/*
const bootstrap = () => {
    try {
        console.log('🚀 Bootstrap iniciado desde index.js - delegando a UI.init()');
        UI.init();
    } catch (error) {
        console.error('❌ Error inicializando Flashgen:', error);
        console.error('Stack trace:', error.stack);
    }
};

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    } else {
        bootstrap();
    }
}
*/

// Export por defecto (objeto con todos los módulos)
export default {
    API,
    ChainBuilder,
    ChainHandlers,
    ChainPanelController,
    ChainVisualization,
    ChunkStrategies,
    ClozeEngine,
    Comparison,
    DebugLogger,
    DomCache,
    EventBinder,
    ExecutionContext,
    Exporter,
    FewShotManager,
    GenerationProfiles,
    Learning,
    ParserManager,
    Pipeline,
    PipelineExecutionContext,
    PipelineExecutionContextInstance,
    PipelineManager,
    PipelineStepHandlers,
    Processing,
    ProfileManager,
    Results,
    State,
    Storage,
    TabManager,
    Templates,
    UI,
    TrueLangChain,
    ChainNode
};
