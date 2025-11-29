/**
 * Modulo: UI Helpers y Navegacion
 * Categoria: ui
 * Extraido de: Flashgen.js (lineas 735-2885)
 * Generado: 2025-11-28 09:48:59
 * 
 * Metodos: toggleGroup, download, updateElement, updateFeaturePanels, syncChunkInputs
 * Dependencias: API, ChunkStrategies, DebugLogger, FewShotManager, ParserManager, Processing, State, UI
 */

// ✅ FIX: No importar módulos de pestañas para evitar dependencias circulares
// Estos módulos se acceden vía window después de ser cargados por index.js
import { API } from '../api/api.js';
import { ChunkStrategies } from '../processing/chunk_strategies.js';
import { DebugLogger } from './debug_logger.js';
import { FewShotManager } from '../managers/few_shot_manager.js';
import { ParserManager } from '../managers/parser_manager.js';
import { PipelineManager } from '../pipeline/pipeline_manager.js';
import { Processing } from '../processing/processing.js';
import { State } from '../core/state.js';
import { Storage } from '../core/storage.js';
import { Templates } from '../core/templates.js';
import { DomCache } from './dom_cache.js';
import { TabManager } from './tab_manager.js';
import { EventBinder } from './event_binder.js';

const UI = {
    initialized: false,
    activeTab: 'config',
    toastContainer: null,
        
        // Sistema de inicialización lazy para pestañas
        init() {
            try {
                // ✅ FIX: Prevenir doble inicialización
                if (this.initialized) {
                    console.log('✅ UI ya inicializado, omitiendo re-inicialización');
                    return;
                }

                console.log('🔄 Inicializando UI...');
                console.log(`📊 Estado del DOM: readyState="${document.readyState}"`);

                // ✅ FIX: Exponer UI globalmente para que Exporter pueda acceder
                if (typeof window !== 'undefined') {
                    window.__flashgenUI = this;
                    window.UIInstance = this;
                    window.UI = this;
                }

                // ✅ PASO 1: Verificar que el DOM está listo
                // Nota: bootstrap() en index.js ya espera DOMContentLoaded, pero verificamos por si acaso
                if (document.readyState === 'loading') {
                    console.warn('⚠️ DOM aún cargando, esperando DOMContentLoaded...');
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('✅ DOM completamente cargado, continuando inicialización...');
                        this._initializeComponents();
                        this.initialized = true;
                        console.log('✅ UI inicializado correctamente');
                    }, { once: true });
                    return;
                }

                // ✅ PASO 2: Inicializar componentes (DOM ya está listo)
                this._initializeComponents();

                // MARCAR COMO INICIALIZADO SIEMPRE, incluso si algunos métodos opcionales fallaron
                this.initialized = true;
                console.log('✅ UI inicializado correctamente');
            } catch (error) {
                console.error('❌ Error crítico inicializando UI:', error);
                console.error(error.stack);
                // IMPORTANTE: Marcar como inicializado de todos modos para que las pestañas funcionen
                this.initialized = true;
                console.warn('⚠️ UI marcado como inicializado a pesar del error para permitir funcionalidad básica');
            }
        },
        
        /**
         * Inicializar componentes de UI (método interno)
         * Separado para poder llamarlo después de DOMContentLoaded si es necesario
         * ✅ ORDEN CRÍTICO: TabManager -> DomCache -> EventBinder -> switchTab
         */
        _initializeComponents() {
            try {
                console.log('🔧 Inicializando componentes de UI...');
                console.log('📋 Orden de inicialización: TabManager → DomCache → EventBinder → switchTab');
                
                // ✅ PASO 1: Inicializar TabManager y generar sidebar PRIMERO
                // Esto debe hacerse ANTES de vincular eventos para que los botones estén cacheados
                if (TabManager) {
                    console.log('📋 [1/5] Generando sidebar dinámicamente...');

                    // Generar sidebar desde SECTIONS si existe el elemento #sidebar
                    if (typeof TabManager.generateSidebar === 'function') {
                        const sidebarGenerated = TabManager.generateSidebar();
                        if (sidebarGenerated) {
                            console.log('✅ Sidebar generado correctamente');
                        } else {
                            console.warn('⚠️ No se pudo generar sidebar (puede estar usando sistema antiguo)');
                            // Intentar cachear tabs del sistema antiguo
                            TabManager.cacheTabs();
                        }
                    } else {
                        console.warn('⚠️ TabManager.generateSidebar no disponible, usando sistema antiguo');
                        TabManager.cacheTabs();
                    }

                    // Validar que se encontraron todas las pestañas
                    if (TabManager.tabButtons && TabManager.tabButtons.length === 9) {
                        console.log('✅ TabManager: Todas las 9 pestañas cacheadas correctamente');
                    } else {
                        console.warn(`⚠️ TabManager: Solo se encontraron ${TabManager.tabButtons?.length || 0}/9 pestañas`);
                        // Intentar re-cacheo forzado
                        console.log('🔄 Intentando re-cacheo forzado...');
                        TabManager.cacheTabs();

                        // Si aún no hay 9, hay un problema serio
                        if (TabManager.tabButtons && TabManager.tabButtons.length !== 9) {
                            console.error(`❌ CRÍTICO: Después de re-cacheo, solo ${TabManager.tabButtons.length}/9 pestañas encontradas`);
                            console.error('❌ Verifica que el HTML tiene los 9 botones con clase .tab-btn/.sidebar-btn y data-tab/data-go');
                        }
                    }
                } else {
                    console.error('❌ TabManager no disponible');
                }

                // ✅ PASO 2: Inicializar DomCache
                // Esto debe hacerse DESPUÉS de cachear pestañas pero ANTES de vincular eventos
                if (DomCache) {
                    console.log('📋 [2/5] Refrescando DomCache...');
                    DomCache.refresh();
                    console.log('✅ DomCache inicializado');
                } else {
                    console.error('❌ DomCache no disponible');
                }

                // ✅ PASO 3: Vincular eventos via EventBinder
                // Esto debe hacerse DESPUÉS de que TabManager y DomCache estén listos
                // para que los botones estén cacheados y disponibles
                if (EventBinder) {
                    console.log('📋 [3/5] Vinculando eventos...');

                    // Verificar que TabManager tiene botones antes de vincular
                    if (!TabManager.tabButtons || TabManager.tabButtons.length === 0) {
                        console.error('❌ CRÍTICO: No hay botones cacheados antes de vincular eventos');
                        console.error('❌ Re-cacheando pestañas...');
                        TabManager.cacheTabs();
                    }

                    const bindResult = EventBinder.bindAll();
                    if (bindResult) {
                        console.log('✅ EventBinder: Todos los eventos vinculados correctamente');
                    } else {
                        console.warn('⚠️ EventBinder: Algunos eventos no se vincularon correctamente');
                        console.warn('⚠️ Esto puede causar que algunas pestañas no funcionen');
                    }
                } else {
                    console.error('❌ EventBinder no disponible');
                }

                // ✅ PASO 4: Activar pestaña inicial
                // Esto debe hacerse AL FINAL, después de que todo esté vinculado
                if (TabManager) {
                    console.log('📋 [4/5] Activando pestaña inicial...');
                    const initialTab = this.activeTab || 'config';
                    TabManager.switchTab(initialTab);
                    console.log(`✅ Pestaña inicial activada: ${initialTab}`);
                }
                
                // ✅ PASO 5: Métodos opcionales
                console.log('📋 Paso 5: Inicializando métodos opcionales...');
                
                // Métodos opcionales - solo si existen
                if (typeof this.renderCustomProfilePanel === 'function') {
                    try { this.renderCustomProfilePanel(); } catch (e) { console.warn('renderCustomProfilePanel falló:', e); }
                }
                if (typeof this.ensureToastContainer === 'function') {
                    try { this.ensureToastContainer(); } catch (e) { console.warn('ensureToastContainer falló:', e); }
                }
                if (typeof this.updateChunkMethodHelp === 'function') {
                    const chunkMethodSelect = this.getElement('chunkMethod', 'selects');
                    if (chunkMethodSelect) {
                        try { this.updateChunkMethodHelp(chunkMethodSelect.value); } catch (e) { console.warn('updateChunkMethodHelp falló:', e); }
                    }
                }
                if (typeof this.updateChunkControls === 'function') {
                    try { this.updateChunkControls(); } catch (e) { console.warn('updateChunkControls falló:', e); }
                }
                if (typeof this.populateApiConfig === 'function') {
                    try { this.populateApiConfig(); } catch (e) { console.warn('populateApiConfig falló:', e); }
                }
                if (typeof this.syncChunkInputs === 'function') {
                    try { this.syncChunkInputs(); } catch (e) { console.warn('syncChunkInputs falló:', e); }
                }
                if (typeof this.syncCustomProfilePanel === 'function') {
                    try { this.syncCustomProfilePanel(); } catch (e) { console.warn('syncCustomProfilePanel falló:', e); }
                }
                if (typeof this.syncFeatureToggles === 'function') {
                    try { this.syncFeatureToggles(); } catch (e) { console.warn('syncFeatureToggles falló:', e); }
                }
                if (typeof this.updateChunkPreview === 'function') {
                    try { this.updateChunkPreview(); } catch (e) { console.warn('updateChunkPreview falló:', e); }
                }
                
                if (typeof FewShotManager !== 'undefined' && FewShotManager.init) {
                    try { FewShotManager.init(); } catch (e) { console.warn('FewShotManager.init falló:', e); }
                }
                if (typeof ParserManager !== 'undefined' && ParserManager.init) {
                    try { ParserManager.init(); } catch (e) { console.warn('ParserManager.init falló:', e); }
                }
                
                console.log('✅ Componentes de UI inicializados');
            } catch (error) {
                console.error('❌ Error en _initializeComponents:', error);
                throw error;
            }
        },      
        // ✅ HELPER: Obtener elemento DOM desde cache o DOM directo
        getElement(id, category = null) {
            // Intentar desde DomCache primero si se especifica categoría
            if (category && DomCache && DomCache.get) {
                const cached = DomCache.get(id, category);
                if (cached) return cached;
            }
            // Fallback a getElementById (siempre funciona)
            const element = document.getElementById(id);
            if (!element && category) {
                // Si no se encontró en cache ni en DOM, intentar sin categoría
                if (DomCache && DomCache.get) {
                    const cached = DomCache.get(id, null);
                    if (cached) return cached;
                }
            }
            return element;
        },
        // ✅ DELEGAR a TabManager para compatibilidad
        switchTab(tabId) {
            if (TabManager && TabManager.switchTab) {
                return TabManager.switchTab(tabId);
            }
            console.error('❌ TabManager no disponible');
        },
        updateBatchMetrics() {
            const batchSize = State.pipeline.options.batchSize || 0;
            const batchDelay = State.pipeline.options.batchDelay || 200;
            
            const throughputEl = document.getElementById('batchThroughput');
            const apiCallsEl = document.getElementById('batchApiCalls');
            
            if (!throughputEl || !apiCallsEl) return;
            
            if (batchSize === 0) {
                // Modo secuencial
                throughputEl.textContent = 'Secuencial';
                apiCallsEl.textContent = '0';
            } else {
                // Calcular throughput estimado
                // Asumiendo ~3-5 segundos por llamada API
                const avgApiTime = 4000; // 4 segundos promedio
                const timePerBatch = avgApiTime + batchDelay;
                const cardsPerMinute = Math.round((batchSize * 60000) / timePerBatch);
                
                throughputEl.textContent = `~${cardsPerMinute}`;
                apiCallsEl.textContent = batchSize.toString();
            }
        },
       
        validateTabs() {
            // ✅ DELEGAR a TabManager
            if (TabManager && TabManager.validateTabs) {
                return TabManager.validateTabs();
            }
            console.error('❌ TabManager no disponible');
            return false;
        },

        toast(message, type = 'info') {
            if (!message) return;
            this.ensureToastContainer();

            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;

            this.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        },

        updateProgress(current, total) {
            const progressFill = this.getElement('progressFill', 'containers');
            if (!progressFill) return;
            if (total <= 0) total = 1;
            const percentage = Math.min(100, Math.round((current / total) * 100));
            progressFill.style.width = `${percentage}%`;
            progressFill.textContent = `${percentage}%`;
        },

        updateElement(id, html) {
            if (!id) return;
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = html;
        },

        download(filename, data, mimeType = 'text/plain') {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        },

        showImportStatus(message, type = 'info') {
            const importStatus = this.getElement('importStatus', 'containers');
            const importStatusText = this.getElement('importStatusText', 'containers');
            if (!importStatus || !importStatusText) return;
            importStatus.className = `import-status status-${type}`;
            importStatus.style.display = 'flex';
            importStatusText.textContent = message;
        },

        updateChunkMethodHelp(method = 'paragraph') {
            const methodHelpContent = this.getElement('methodHelpContent', 'containers');
            const methodHelpText = this.getElement('methodHelpText', 'containers');
            if (!methodHelpContent || !methodHelpText) return;
            const info = ChunkStrategies.getMethodInfo(method);
            if (!info) return;
            methodHelpContent.style.display = 'flex';
            methodHelpText.textContent = info.description;
        },

        updateChunkControls() {
            const chunkMethodSelect = this.getElement('chunkMethod', 'selects');
            const method = chunkMethodSelect?.value || 'paragraph';
            const hideSizeControls = ['semantic', 'chapter'];
            const showSemantic = ['semantic'];
            const showManualContext = ['manual'];
            const chunkSizeGroup = this.getElement('chunkSizeGroup', 'containers');
            const overlapGroup = this.getElement('overlapGroup', 'containers');
            const minChunkSizeGroup = this.getElement('minChunkSizeGroup', 'containers');
            const semanticOptions = this.getElement('semanticOptions', 'containers');
            const manualContextGroup = this.getElement('manualContextGroup', 'containers');
            this.toggleGroup(chunkSizeGroup, !hideSizeControls.includes(method));
            this.toggleGroup(overlapGroup, !hideSizeControls.includes(method));
            this.toggleGroup(minChunkSizeGroup, showSemantic.includes(method));
            this.toggleGroup(semanticOptions, showSemantic.includes(method));
            this.toggleGroup(manualContextGroup, showManualContext.includes(method));
        },
        
        showChunkMethodInfoModal() {
            const html = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
                    <div style="background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; max-width: 800px; max-height: 80vh; overflow-y: auto; box-shadow: var(--shadow-lg);" onclick="event.stopPropagation()">
                        <h2 style="margin-top: 0;">📚 Metodos de Segmentacion</h2>
                        <p style="color: var(--color-text-secondary); margin-bottom: 20px;">Descripcion detallada de cada metodo disponible</p>
                        ${ChunkStrategies.getMethods().map(m => `
                            <div style="margin-bottom: 16px; padding: 12px; background: var(--color-bg-1); border-left: 3px solid var(--color-primary); border-radius: var(--radius-base);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <strong style="font-size: 16px;">${m.name}</strong>
                                    <code style="background: var(--color-bg-2); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${m.func}</code>
                                </div>
                                <p style="margin: 8px 0; font-size: 14px;">${m.desc}</p>
                                <div style="display: flex; gap: 16px; font-size: 12px; color: var(--color-text-secondary);">
                                    <span><strong>Libreria:</strong> ${m.lib}</span>
                                    <span><strong>Uso ideal:</strong> ${m.use}</span>
                                </div>
                            </div>
                        `).join('')}
                        <button class="btn btn-primary" onclick="this.closest('[style*=fixed]').remove()" style="margin-top: 16px; width: 100%;">Cerrar</button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
        },
        
        handleSegmentationEngineChange(engine) {
            const spacyPanel = document.getElementById('spacyPanel');
            const heuristicPanel = document.getElementById('heuristicPanel');
            const chunkPreview = document.getElementById('chunkPreview');
            
            if (engine === 'spacy') {
                spacyPanel.style.display = 'block';
                heuristicPanel.style.display = 'none';
                
                // Limpiar chunks de heuristicas previas - VISUAL
                if (chunkPreview) {
                    chunkPreview.innerHTML = '<p class="empty-state">Presiona "🚀 Generar con spaCy Neuronal" para procesar el texto</p>';
                }
                
                // Limpiar estadisticas de chunks estimados - VISUAL
                const estimatedChunksNode = document.getElementById('estimatedChunks');
                if (estimatedChunksNode) {
                    estimatedChunksNode.textContent = '0';
                }
                
                // Limpiar datos de spaCy previos si existen - ESTADO
                if (State.spacyChunks) {
                    delete State.spacyChunks;
                }
                
                // Limpiar configuraciones de pipeline runtime - ESTADO
                if (State.pipelineRuntime) {
                    // Mantener solo configuraciones no relacionadas con chunks
                    const { entityExtraction, contextInjectConfig, difficultyConfig, clozeConfig, 
                            spacedConfig, ankiConfig, scoreConfig, generateConfig, spacyEnrichment, ...rest } = State.pipelineRuntime;
                    State.pipelineRuntime = { spacyEnrichment }; // Mantener solo enriquecimiento spaCy si existe
                }
                
                DebugLogger.log('🧠 Motor spaCy activado - Segmentacion neuronal', 'info');
                DebugLogger.log('🧹 Chunks de heuristicas limpiados (visual + estado)', 'info');
            } else {
                spacyPanel.style.display = 'none';
                heuristicPanel.style.display = 'block';
                
                // Limpiar chunks de spaCy previos - VISUAL
                if (chunkPreview) {
                    chunkPreview.innerHTML = '<p class="empty-state">Los chunks apareceran aqui cuando ingreses texto en la pestaña Entrada</p>';
                }
                
                // Limpiar estadisticas de chunks estimados - VISUAL
                const estimatedChunksNode = document.getElementById('estimatedChunks');
                if (estimatedChunksNode) {
                    estimatedChunksNode.textContent = '0';
                }
                
                // Limpiar datos de spaCy - ESTADO
                if (State.spacyChunks) {
                    delete State.spacyChunks;
                }
                
                // Limpiar enriquecimiento spaCy del pipeline runtime - ESTADO
                if (State.pipelineRuntime && State.pipelineRuntime.spacyEnrichment) {
                    delete State.pipelineRuntime.spacyEnrichment;
                }
                
                // Regenerar preview con heuristicas si hay texto
                const inputText = document.getElementById('inputText');
                if (inputText && inputText.value.trim()) {
                    // Usar setTimeout para permitir que el DOM se actualice
                    setTimeout(() => {
                        this.updateChunkPreview();
                    }, 50);
                }
                
                DebugLogger.log('🔧 Motor heuristico activado - Segmentacion basada en reglas', 'info');
                DebugLogger.log('🧹 Chunks de spaCy limpiados (visual + estado)', 'info');
            }
        },
        
        async handleSpacyGeneration() {
            const inputText = document.getElementById('inputText')?.value;
            if (!inputText || !inputText.trim()) {
                this.showToast('⚠️ Por favor ingresa texto para procesar', 'error');
                return;
            }
            
            const model = document.getElementById('spacyModel')?.value || 'es_core_news_lg';
            const strategy = document.getElementById('spacyStrategy')?.value || 'sentences';
            const endpoint = document.getElementById('spacyEndpoint')?.value || 'http://localhost:8000';
            const spacyStatus = document.getElementById('spacyStatus');
            const generateBtn = document.getElementById('generateWithSpacy');
            
            // Mapear modelo a idioma
            const langMap = {
                'en_core_web_lg': 'en',
                'es_core_news_lg': 'es',
                'fr_core_news_lg': 'fr'
            };
            const lang = langMap[model] || 'es';
            
            try {
                // Deshabilitar boton
                generateBtn.disabled = true;
                generateBtn.textContent = '⏳ Procesando con spaCy...';
                
                // Mostrar status
                spacyStatus.style.display = 'block';
                spacyStatus.style.background = 'var(--color-info-bg)';
                spacyStatus.style.color = 'var(--color-info)';
                spacyStatus.innerHTML = `
                    <strong>🔄 Procesando texto con modelo neuronal...</strong><br>
                    <small>Modelo: ${model} | Estrategia: ${strategy}</small>
                `;
                
                DebugLogger.log(`🧠 Enviando texto a spaCy: ${endpoint}/process`, 'info');
                DebugLogger.log(`📊 Modelo: ${model} | Idioma: ${lang} | Estrategia: ${strategy}`, 'info');
                
                // Llamar al servidor FastAPI
                const response = await fetch(`${endpoint}/process`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: inputText,
                        lang: lang,
                        strategy: strategy
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                
                if (result.error) {
                    throw new Error(result.error);
                }
                
                // El servidor ya devuelve los chunks procesados segun la estrategia
                const chunks = result.chunks || [];
                const chunksMetadata = result.chunks_metadata || [];
                
                // Guardar chunks y datos adicionales en State para procesamiento
                State.spacyChunks = {
                    chunks: chunks,
                    chunks_metadata: chunksMetadata,
                    entities: result.entities || [],
                    sentences: result.sentences || [],
                    noun_chunks: result.noun_chunks || [],
                    stats: result.stats || {},
                    model: model,
                    strategy: strategy
                };
                
                // Mensaje personalizado segun estrategia
                let strategyInfo = '';
                if (strategy === 'chapter_sents' && chunksMetadata.length > 0) {
                    const chapters = new Set(chunksMetadata.map(m => m.chapter).filter(c => c));
                    strategyInfo = ` | ${chapters.size} capitulos detectados`;
                } else if (strategy === 'entity_context') {
                    strategyInfo = ` | ${result.entities?.length || 0} entidades con contexto`;
                } else if (strategy === 'semantic_blocks') {
                    strategyInfo = ` | Bloques semanticos agrupados`;
                } else if (strategy === 'vocab_extract') {
                    const vocabCount = chunksMetadata.filter(m => m.vocab_type === 'noun_phrase').length;
                    const verbCount = chunksMetadata.filter(m => m.vocab_type === 'verb').length;
                    strategyInfo = ` | ${vocabCount} terminos + ${verbCount} verbos`;
                } else if (strategy === 'clause_segment') {
                    const clauseCount = chunksMetadata.filter(m => m.type === 'clause').length;
                    const subClauseCount = chunksMetadata.filter(m => m.type === 'sub_clause').length;
                    strategyInfo = ` | ${clauseCount} clausulas${subClauseCount > 0 ? ` (${subClauseCount} subdivididas)` : ''}`;
                } else if (strategy === 'verb_phrase_segment') {
                    const verbPhrases = chunksMetadata.filter(m => m.type === 'verb_phrase').length;
                    const uniqueVerbs = new Set(chunksMetadata.map(m => m.verb).filter(v => v)).size;
                    strategyInfo = ` | ${verbPhrases} sintagmas verbales (${uniqueVerbs} verbos unicos)`;
                }
                
                // Mostrar resultado
                spacyStatus.style.background = 'var(--color-success-bg)';
                spacyStatus.style.color = 'var(--color-success)';
                spacyStatus.innerHTML = `
                    <strong>✅ Segmentacion completada con spaCy</strong><br>
                    <small>Chunks generados: ${chunks.length}${strategyInfo}</small>
                `;
                
                DebugLogger.log(`✅ spaCy proceso ${chunks.length} chunks con estrategia ${strategy}${strategyInfo}`, 'success');
                
                // Actualizar preview de chunks
                this.updateChunkPreview(chunks);
                
                this.showToast(`✅ ${chunks.length} chunks generados con spaCy ${model}`, 'success');
                
                // Continuar con generacion de flashcards
                setTimeout(() => {
                    this.showToast('💡 Ahora puedes generar flashcards desde la pestaña Entrada', 'info');
                }, 1500);
                
            } catch (error) {
                console.error('Error en spaCy:', error);
                DebugLogger.log(`❌ Error spaCy: ${error.message}`, 'error');
                
                spacyStatus.style.display = 'block';
                spacyStatus.style.background = 'var(--color-error-bg)';
                spacyStatus.style.color = 'var(--color-error)';
                spacyStatus.innerHTML = `
                    <strong>❌ Error al conectar con servidor spaCy</strong><br>
                    <small>${error.message}</small><br>
                    <small style="margin-top: 8px; display: block;">Asegurate de que el servidor FastAPI este ejecutandose:<br>
                    <code>cd ${endpoint.split('://')[1].split(':')[0] === 'localhost' ? 'tu-directorio' : ''} && uvicorn server:app --reload</code></small>
                `;
                
                this.showToast(`❌ Error spaCy: ${error.message}`, 'error');
            } finally {
                // Rehabilitar boton
                generateBtn.disabled = false;
                generateBtn.textContent = '🚀 Generar con spaCy Neuronal';
            }
        },
        
        updateChunkPreview(chunks) {
            const preview = document.getElementById('chunkPreview');
            if (!preview) return;
            
            if (!chunks || chunks.length === 0) {
                preview.innerHTML = '<p class="empty-state">Los chunks apareceran aqui cuando proceses el texto</p>';
                return;
            }
            
            const html = chunks.map((chunk, i) => `
                <div class="chunk-item" style="margin-bottom: 12px; padding: 12px; background: var(--color-bg-1); border-radius: var(--radius-base); border-left: 3px solid var(--color-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: var(--color-primary);">Chunk ${i + 1}</strong>
                        <span style="font-size: 11px; color: var(--color-text-secondary);">${chunk.length} caracteres</span>
                    </div>
                    <p style="margin: 0; font-size: 14px; line-height: 1.5;">${chunk}</p>
                </div>
            `).join('');
            
            preview.innerHTML = `
                <div style="margin-bottom: 16px; padding: 12px; background: var(--color-info-bg); border-radius: var(--radius-base); color: var(--color-info);">
                    <strong>📊 ${chunks.length} chunks generados</strong>
                </div>
                ${html}
            `;
        },

        showSpacyStrategyInfoModal() {
            const html = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
                    <div style="background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; max-width: 900px; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg);" onclick="event.stopPropagation()">
                        <h2 style="margin-top: 0;">📝 Estrategias de Segmentacion spaCy</h2>
                        <p style="color: var(--color-text-secondary); margin-bottom: 20px;">Analisis detallado de las capacidades de segmentacion neuronal</p>
                        
                        <h3 style="font-size: 16px; margin: 20px 0 12px 0; color: var(--color-primary);">Estrategias Basicas</h3>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid var(--color-primary); border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">📝 Segmentacion Sintactica (doc.sents)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Parser de dependencias Transformer/CNN identifica limites oracionales por estructura gramatical completa.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "La IA es fascinante. Los modelos aprenden." → 2 segmentos independientes.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Corpus general, papers academicos, narrativa estructurada.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid var(--color-success); border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🏷️ Agrupacion por Entidades (NER)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Pipeline NER detecta nucleos semanticos (PERSON, ORG, LOC) y genera ventanas de contexto dinamicas.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "Einstein publico en Berlin en 1915" → identifica entidades y preserva contexto.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Biografias, analisis corporativo, periodismo de datos.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid var(--color-info); border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">📦 Sintagmas Nominales (Noun Chunks)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Aisla unidades conceptuales identificando sustantivo nucleo + determinantes/adjetivos + contexto verbal.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "El complejo algoritmo cuantico procesa datos" → "El complejo algoritmo cuantico".</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Glosarios tecnicos, ontologias, flashcards de definicion (medicina/derecho).</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid var(--color-warning); border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🔍 Coherencia Semantica Vectorial</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Embeddings densos + similitud coseno. Segmenta cuando deriva semantica > 0.7.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> Cambio de biologia molecular a programacion Python → corte exacto en cambio de tema.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Textos densos con multiples topicos entrelazados.</p>
                        </div>
                        
                        <h3 style="font-size: 16px; margin: 24px 0 12px 0; color: var(--color-success);">Estrategias Avanzadas</h3>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid #8b5cf6; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">📚 Capitulos + Oraciones (chapter_sents)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Detecta capitulos (multiidioma) + segmenta internamente por oraciones hasta 500 caracteres.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> Libro con "Capitulo 1: Introduccion" → preserva estructura + divide contenido.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Libros tecnicos, manuales de estudio, documentacion estructurada.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid #ec4899; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🎭 Entidades + Contexto (entity_context)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Detecta entidades (PERSON, ORG, LOC, DATE) + incluye oracion anterior y siguiente como contexto.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "Einstein nacio en Alemania. Trabajo en Princeton." → chunk con contexto completo.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Biografias, historia, noticias, analisis de eventos.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid #3b82f6; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🧠 Bloques Semanticos (semantic_blocks)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Similitud coseno entre oraciones consecutivas. Corta si similitud < 0.3 o longitud > 600 chars.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> Ensayo que cambia de etica kantiana a utilitarismo → corte automatico en transicion.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Filosofia, ensayos densos, textos argumentativos complejos.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid #10b981; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🗣️ Extraccion Vocabulario (vocab_extract)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Extrae noun chunks (2+ palabras) repetidos + verbos importantes (no-stop, >4 chars) con contexto.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "El aprendizaje automatico" aparece 3 veces → chunk con primera aparicion + ejemplos.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Aprendizaje de idiomas, vocabulario tecnico, glosarios.</p>
                        </div>
                        
                        <div style="margin-bottom: 12px; padding: 14px; background: var(--color-bg-1); border-left: 4px solid #f59e0b; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">⚙️ Clausulas Sintacticas (clause_segment)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Usa arbol de dependencias para extraer clausulas completas (cada una con verbo ROOT). Si clausula >15 tokens, subdivide por conjunciones coordinantes.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "Einstein trabajo en Princeton y publico la teoria" → ["Einstein trabajo en Princeton", "publico la teoria"].</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Analisis sintactico profundo, gramatica, lingüistica computacional, comprension estructural.</p>
                        </div>
                        
                        <div style="padding: 14px; background: var(--color-bg-1); border-left: 4px solid #06b6d4; border-radius: var(--radius-base);">
                            <h4 style="margin-top: 0; font-size: 15px;">🎬 Sintagmas Verbales (verb_phrase_segment)</h4>
                            <p style="margin: 6px 0; line-height: 1.4; font-size: 13px;"><strong>Mecanismo:</strong> Extrae verbo + objeto directo/indirecto + complementos (obj, dobj, iobj, obl, advmod, neg). Incluye subarbol completo de cada objeto. Minimo 3 palabras por chunk.</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Ejemplo:</strong> "Reflexione mucho sobre las aventuras de la jungla" → ["Reflexione mucho", "Reflexione sobre las aventuras de la jungla"].</p>
                            <p style="margin: 6px 0; font-size: 12px;"><strong>Uso:</strong> Flashcards de acciones especificas, verbos con complementos, chunks pequeños pero completos, narrativa detallada.</p>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 12px; background: var(--color-info-bg); border-radius: var(--radius-base); color: var(--color-info); font-size: 12px;">
                            <strong>💡 Nota Tecnica:</strong> Estrategias avanzadas requieren modelos <code>_lg</code> (Large) para vectores completos (semantic_blocks). Clause_segment y verb_phrase_segment funcionan con cualquier modelo que incluya parser de dependencias.
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.closest('[style*=fixed]').remove()" style="margin-top: 16px; width: 100%;">Cerrar</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        setupFeatureToggle(id, handler) {
            const checkbox = this.getElement(id);
            if (!checkbox) return;
            checkbox.addEventListener('change', event => {
                const checked = !!event.target?.checked;
                handler(checked);
                this.updateFeaturePanels();
                try {
                    Storage.save();
                } catch (err) {
                    DebugLogger.log(`⚠️ No se pudo guardar estado tras toggle ${id}: ${err.message}`, 'warning');
                }
            });
        },

        updateFeaturePanels() {
            const features = State.config?.features || {};
            const memoryPanel = document.getElementById('memoryPanel');
            if (memoryPanel) {
                memoryPanel.style.display = features.memory ? 'block' : 'none';
            }
            const batchPanel = document.getElementById('batchPanel');
            if (batchPanel) {
                batchPanel.style.display = features.batch ? 'block' : 'none';
            }
            const agentPanel = document.getElementById('agentPanel');
            if (agentPanel) {
                agentPanel.style.display = features.agent ? 'block' : 'none';
            }
        },

        syncFeatureToggles() {
            const features = State.config?.features || {};
            const toggleMap = {
                chainMode: features.chain,
                memoryMode: features.memory,
                agentMode: features.agent,
                preprocessMode: features.preprocess,
                batchMode: features.batch,
                autoQualityMode: features.autoQuality,
                enableFewShot: features.fewShot,
                enableFewShotNegatives: features.fewShotNegatives,
                negativeExamplesInline: features.negativeExamplesInline,
                forceQuickMode: features.forceQuickMode,
                chainOfThought: features.chainOfThoughtPrompt,
                jsonSchema: features.jsonSchemaMode,
                lexicalFilter: features.lexicalFilter
            };

            Object.entries(toggleMap).forEach(([id, value]) => {
                const checkbox = this.getElement(id);
                if (checkbox) {
                    checkbox.checked = !!value;
                }
            });

            this.updateFeaturePanels();
        },

        clearContextMemory() {
            State.memory = [];
            API.updateMemoryUI();
            UI.toast('🧠 Memoria limpiada');
            try {
                Storage.save();
            } catch (err) {
                DebugLogger.log(`⚠️ No se pudo guardar despues de limpiar memoria: ${err.message}`, 'warning');
            }
        },


        handleOutputTypeChange(value) {
            State.config.output = State.config.output || {};
            State.config.output.type = value;
            Storage.save();
            DebugLogger.log(`🎯 Output type seleccionado: ${value}`, 'info');
        },

        syncChunkInputs() {
            const size = State.pipeline?.options?.chunkSize ?? 500;
            const overlap = State.pipeline?.options?.chunkOverlap ?? 10;
            if (this.chunkSizeInput) {
                this.chunkSizeInput.value = size;
            }
            if (this.chunkOverlapInput) {
                this.chunkOverlapInput.value = overlap;
            }
            const overlapValue = document.getElementById('overlapValue');
            if (overlapValue) {
                overlapValue.textContent = `${overlap}%`;
            }
        },

        updateChunkConfig({ size, overlap } = {}) {
            State.pipeline.options = State.pipeline.options || {};
            const chunkStep = State.pipeline.steps?.find(step => step.id === 'chunk');
            if (size !== undefined) {
                State.pipeline.options.chunkSize = size;
                if (chunkStep) {
                    chunkStep.config = chunkStep.config || {};
                    chunkStep.config.size = size;
                }
            }
            if (overlap !== undefined) {
                State.pipeline.options.chunkOverlap = overlap;
                if (chunkStep) {
                    chunkStep.config = chunkStep.config || {};
                    chunkStep.config.overlap = overlap;
                }
            }
            Storage.save();
        },

        renderCustomProfilePanel() {
            const panel = document.getElementById('customProfilePanel');
            if (!panel) return;

            const features = State.config?.features || {};
            const pipelineOptions = State.pipeline?.options || {};
            const getStepEnabled = (id, fallback = false) => {
                const step = State.pipeline?.steps?.find(s => s.id === id);
                if (step && typeof step.enabled === 'boolean') {
                    return step.enabled;
                }
                return fallback;
            };

            const clozeConfig = State.pipelineRuntime?.clozeConfig || { clozeEntities: true, clozeNumbers: true, clozeDates: true, clozeKeywords: false, maxVariantsPerCard: 2 };

            const toggleConfig = [
                { id: 'profile_enableChain', label: '🔗 Usar Chain (evaluacion + refinamiento)', value: features.chain },
                { id: 'profile_enableQuality', label: '✅ Evaluacion de calidad', value: features.autoQuality },
                { id: 'profile_enableRefinement', label: '🔄 Refinamiento iterativo', value: pipelineOptions.enableAutoRefinement ?? true },
                { id: 'profile_enableCloze', label: '🧩 Variantes Cloze', value: getStepEnabled('cloze-generator', pipelineOptions.enableCloze) },
                { id: 'profile_enableContextInjection', label: '🪄 Inyeccion de contexto', value: getStepEnabled('context-inject', pipelineOptions.enableContextInjection) },
                { id: 'profile_enableFewShot', label: '🎯 Few-shot examples', value: features.fewShot },
                { id: 'profile_enableLexicalFilter', label: '🧪 Filtro lexico estricto', value: features.lexicalFilter }
            ];

            const sliderConfig = [
                {
                    id: 'profile_qualityThreshold',
                    label: 'Umbral de calidad',
                    min: 0,
                    max: 100,
                    step: 5,
                    suffix: '%',
                    value: pipelineOptions.qualityThreshold ?? 70
                },
                {
                    id: 'profile_maxRefine',
                    label: 'Max refinamientos',
                    min: 0,
                    max: 3,
                    step: 1,
                    value: pipelineOptions.maxRefinements ?? 2
                },
                {
                    id: 'profile_batchDelay',
                    label: 'Batch delay (ms)',
                    min: 0,
                    max: 1000,
                    step: 50,
                    value: pipelineOptions.batchDelay ?? 300
                }
            ];

            const togglesHtml = toggleConfig.map(({ id, label, value }) => `
                <div class="checkbox-item">
                    <input type="checkbox" id="${id}" name="${id}" ${value ? 'checked' : ''}>
                    <label for="${id}">${label}</label>
                </div>
            `).join('');

            const slidersHtml = sliderConfig.map(({ id, label, min, max, step, value, suffix = '' }) => {
                // ✅ Accesibilidad: Generar ID único para el label del slider
                const labelId = `${id}_label`;
                return `
                <div class="slider-container" style="margin-top: 16px;">
                    <div class="slider-header">
                        <label class="form-label" for="${id}" id="${labelId}">${label}</label>
                        <span id="${id}Value">${value}${suffix}</span>
                    </div>
                    <input type="range" class="slider" id="${id}" name="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
                </div>
            `;
            }).join('');

            panel.innerHTML = `
                <h4 style="font-size: 14px; margin-bottom: 12px;">⚙️ Configuracion personalizada</h4>
                <div class="checkbox-group">${togglesHtml}</div>
                ${slidersHtml}
            `;

            this.bindCustomProfileInputs();
            this.syncCustomProfilePanel();
        },

        bindCustomProfileInputs() {
            const customInputs = document.querySelectorAll('#customProfilePanel input, #customProfilePanel textarea');
            if (!customInputs.length) return;
            customInputs.forEach(input => {
                const handler = () => {
                    if (input.type === 'range') {
                        const displayId = `${input.id}Value`;
                        const displayEl = document.getElementById(displayId);
                        if (displayEl) {
                            const suffix = input.id === 'profile_qualityThreshold' ? '%' : '';
                            displayEl.textContent = `${input.value}${suffix}`;
                        }
                    }
                    ProfileManager.readCustomConfig();
                };
                input.addEventListener('input', handler);
                input.addEventListener('change', handler);
            });
        },

        syncCustomProfilePanel() {
            const setChecked = (id, value) => {
                const el = this.getElement(id);
                if (el) el.checked = !!value;
            };
            const setRange = (id, value, suffix = '') => {
                const el = this.getElement(id);
                const display = this.getElement(`${id}Value`);
                if (el) el.value = value;
                if (display) display.textContent = `${value}${suffix}`;
            };

            setChecked('profile_enableChain', State.config.features.chain);
            setChecked('profile_enableQuality', State.config.features.autoQuality);
            setChecked('profile_enableFewShot', State.config.features.fewShot);
            setChecked('profile_enableLexicalFilter', State.config.features.lexicalFilter);
            setChecked('profile_enableRefinement', State.pipeline.options.enableAutoRefinement);

            const batchDelay = State.pipeline.options.batchDelay ?? 300;
            setRange('profile_batchDelay', batchDelay);

            const qualityThreshold = State.pipeline.options.qualityThreshold ?? 70;
            setRange('profile_qualityThreshold', qualityThreshold, '%');

            const maxRefine = State.pipeline.options.maxRefinements ?? 2;
            setRange('profile_maxRefine', maxRefine);
        },

        bindImportButtons() {
            if (!this.fileInput) return;

            const triggerFileSelect = (accept, handler) => {
                this.fileInput.accept = accept;
                this.fileInput.onchange = async (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;
                    
                    // Validar tamaño de archivo (maximo 10MB)
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                        UI.toast(`❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximo: 10MB`, 'error');
                        this.fileInput.value = '';
                        return;
                    }
                    
                    try {
                        await handler(file);
                    } finally {
                        this.fileInput.value = '';
                    }
                };
                this.fileInput.click();
            };

            const importTextBtn = this.getElement('importTextBtn', 'buttons');
            if (importTextBtn) {
                importTextBtn.addEventListener('click', () => {
                    triggerFileSelect('.txt,.md,.docx', async (file) => {
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        let text = '';
                        if (ext === 'docx') {
                            text = await Processing.extractDocxText(file);
                        } else {
                            text = await file.text();
                        }
                        this.setImportedText(text);
                        UI.showImportStatus(`✅ Archivo cargado (${file.name})`, 'success');
                    });
                });
            }

            const importPdfBtn = this.getElement('importPdfBtn', 'buttons');
            if (importPdfBtn) {
                importPdfBtn.addEventListener('click', () => {
                    triggerFileSelect('.pdf', async (file) => {
                        const text = await Processing.extractPdfText(file);
                        this.setImportedText(text);
                    });
                });
            }

            const importWordListBtn = this.getElement('importWordListBtn', 'buttons');
            if (importWordListBtn) {
                importWordListBtn.addEventListener('click', () => {
                    triggerFileSelect('.txt,.csv', async (file) => {
                        const text = await file.text();
                        const normalized = text
                            .split(/\r?\n/)
                            .map(line => line.trim())
                            .filter(Boolean)
                            .join('\n');
                        this.setImportedText(normalized);
                        UI.showImportStatus(`✅ Lista importada (${file.name})`, 'success');
                    });
                });
            }

            const importJsonBtn = this.getElement('importJsonBtn', 'buttons');
            if (importJsonBtn) {
                importJsonBtn.addEventListener('click', () => {
                    triggerFileSelect('.json', async (file) => {
                        try {
                            const content = await file.text();
                            const parsed = JSON.parse(content);
                            const chunks = Array.isArray(parsed)
                                ? parsed
                                : Array.isArray(parsed.chunks) ? parsed.chunks : [];
                            if (!chunks.length) {
                                throw new Error('JSON sin chunks');
                            }
                            State.pipeline.options.chunkMethod = 'none';
                            State.importedChunks = chunks;
                            this.setImportedText(chunks.map(chunk => chunk.text || chunk).join('\n\n'));
                            UI.showImportStatus(`✅ JSON con ${chunks.length} chunks cargado`, 'success');
                        } catch (err) {
                            UI.showImportStatus(`❌ Error al procesar JSON: ${err.message}`, 'error');
                        }
                    });
                });
            }

            const pasteFromClipboardBtn = this.getElement('pasteFromClipboardBtn', 'buttons');
            if (pasteFromClipboardBtn) {
                pasteFromClipboardBtn.addEventListener('click', async () => {
                    try {
                        if (!navigator.clipboard || !navigator.clipboard.readText) {
                            UI.toast('❌ API de portapapeles no disponible en este navegador', 'error');
                            return;
                        }
                        const text = await navigator.clipboard.readText();
                        if (!text || !text.trim()) {
                            UI.toast('⚠️ Portapapeles vacio', 'warning');
                            return;
                        }
                        this.setImportedText(text);
                        this.updateInputStats();
                        UI.showImportStatus(`✅ Texto pegado desde portapapeles (${text.length} caracteres)`, 'success');
                    } catch (error) {
                        UI.toast(`❌ Error al leer portapapeles: ${error.message}`, 'error');
                    }
                });
            }
        },

        setImportedText(text) {
            const inputText = this.getElement('inputText', 'inputs');
            if (inputText) {
                inputText.value = text;
                this.updateInputStats();
                this.scheduleChunkPreviewUpdate();
                UI.switchTab('input');
            }
        },

        toggleCancelButton(show) {
            const cancelGenerationBtn = this.getElement('cancelGenerationBtn', 'buttons');
            if (!cancelGenerationBtn) return;
            cancelGenerationBtn.style.display = show ? 'inline-flex' : 'none';
        },

        handleAgentToolClick(toolId, label) {
            const timestamp = new Date().toISOString();
            const task = {
                id: `${toolId}-${Date.now()}`,
                tool: toolId,
                label,
                timestamp,
                status: 'queued'
            };
            State.agentTasks = [task, ...(State.agentTasks || [])].slice(0, 10);
            DebugLogger.log(`🧰 Herramienta de agente: ${label} (${toolId})`, 'info');
            this.renderAgentToolLog();
            UI.toast(`Herramienta "${label}" encolada (modo agente)`, 'info');
        },


        renderAgentToolLog() {
            const agentToolLog = this.getElement('agentToolLog', 'containers');
            if (!agentToolLog) return;
            const tasks = State.agentTasks || [];
            if (!tasks.length) {
                agentToolLog.classList.add('empty-state');
                agentToolLog.innerHTML = 'Selecciona una herramienta para ver la actividad aqui.';
                return;
            }
            agentToolLog.classList.remove('empty-state');
            const items = tasks.map(task => `
                <div class="agent-task ${task.status}">
                    <div>
                        <strong>${Results.escape(task.label)}</strong>
                        <span class="agent-log-meta">${new Date(task.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p>Tool ID: ${Results.escape(task.tool)} · Estado: ${Results.escape(task.status)}</p>
                </div>
            `).join('');
            agentToolLog.innerHTML = items.join('');
        },

        setPreprocessOption(key, value) {
            if (!key) return;
            State.pipeline.options[key] = value;

            // Update preprocess step config so drag/drop pipeline stays in sync
            const preprocessStep = (State.pipeline.steps || []).find(step => step.id === 'preprocess');
            if (preprocessStep) {
                preprocessStep.config = preprocessStep.config || {};
                preprocessStep.config[key] = value;
            }
        },

        loadHyperparamPreset() {
            const presetKey = HyperparamPresets[State.config.hyperparamsPreset] ? State.config.hyperparamsPreset : 'custom';
            const hyperparamPresetSelect = this.getElement('hyperparamPreset', 'selects');

            if (presetKey !== 'custom') {
                if (hyperparamPresetSelect) {
                    hyperparamPresetSelect.value = presetKey;
                }
                this.applyHyperparamPreset(presetKey, { skipToast: true });
            } else {
                if (hyperparamPresetSelect) {
                    hyperparamPresetSelect.value = 'custom';
                }
                this.updateHyperparamInputs(State.config.hyperparams, { skipPresetReset: true });
            }
        },

        handleHyperparamPresetChange(presetKey) {
            if (!presetKey) return;

            if (presetKey === 'custom') {
                State.config.hyperparamsPreset = 'custom';
                this.updateHyperparamInputs(State.config.hyperparams, { skipPresetReset: true });
                return;
            }

            if (!HyperparamPresets[presetKey]) {
                DebugLogger.log(`❌ Hyperparam preset desconocido: ${presetKey}`, 'error');
                // Conectar con UI para feedback visual
                UI.toast(`❌ Preset de hiperparametros desconocido: ${presetKey}`, 'error');
                return;
            }

            this.applyHyperparamPreset(presetKey);
        },

        applyHyperparamPreset(presetKey, options = {}) {
            const preset = HyperparamPresets[presetKey];
            if (!preset) return;

            State.config.hyperparamsPreset = presetKey;
            this.updateHyperparamInputs(preset.values, { skipPresetReset: true });
            const hyperparamPresetSelect = this.getElement('hyperparamPreset', 'selects');
            if (hyperparamPresetSelect) {
                hyperparamPresetSelect.value = presetKey;
            }

            if (!options.skipToast) {
                UI.toast(`${preset.label} aplicado`);
            }
            DebugLogger.log(`🎯 Hyperparams preset aplicado: ${preset.label}`, 'info');
        },

        updateHyperparamInputs(values = {}, options = {}) {
            if (typeof values.temperature === 'number') {
                this.setHyperparamValue('temperature', values.temperature, { skipPresetReset: options.skipPresetReset });
            }
            if (typeof values.top_p === 'number') {
                this.setHyperparamValue('top_p', values.top_p, { skipPresetReset: options.skipPresetReset });
            }
            if (typeof values.top_k === 'number') {
                this.setHyperparamValue('top_k', values.top_k, { skipPresetReset: options.skipPresetReset });
            }
        },

        setHyperparamValue(key, value, options = {}) {
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return;
            }

            if (!State.config.hyperparams) {
                State.config.hyperparams = {};
            }

            if (key === 'temperature') {
                const formatted = Number(value);
                const temperatureInput = this.getElement('temperature', 'inputs');
                const temperatureValue = this.getElement('tempValue', 'sliders');
                if (temperatureInput) {
                    temperatureInput.value = formatted;
                }
                if (temperatureValue) {
                    temperatureValue.textContent = formatted.toFixed(1);
                }
                State.config.hyperparams.temperature = formatted;
            } else if (key === 'top_p') {
                const formatted = Number(value);
                const topPInput = this.getElement('topP', 'inputs');
                const topPValue = this.getElement('topPValue', 'sliders');
                if (topPInput) {
                    topPInput.value = formatted;
                }
                if (topPValue) {
                    topPValue.textContent = formatted.toFixed(2);
                }
                State.config.hyperparams.top_p = formatted;
            } else if (key === 'top_k') {
                const formatted = Math.max(0, Math.round(value));
                const topKInput = this.getElement('topK', 'inputs');
                const topKValue = this.getElement('topKValue', 'sliders');
                if (topKInput) {
                    topKInput.value = formatted;
                }
                if (topKValue) {
                    topKValue.textContent = String(formatted);
                }
                State.config.hyperparams.top_k = formatted;
            }

            if (!options.skipPresetReset && State.config.hyperparamsPreset !== 'custom') {
                State.config.hyperparamsPreset = 'custom';
                const hyperparamPresetSelect = this.getElement('hyperparamPreset', 'selects');
                if (hyperparamPresetSelect) {
                    hyperparamPresetSelect.value = 'custom';
                }
            }
        },

        toggleGroup(element, shouldShow) {
            if (!element) return;
            element.style.display = shouldShow ? '' : 'none';
        },

        scheduleChunkPreviewUpdate() {
            clearTimeout(this.chunkPreviewDebounce);
            this.chunkPreviewDebounce = setTimeout(() => this.updateChunkPreview(), 150);
        },

        updateChunkPreview() {
            const chunkPreview = this.getElement('chunkPreview', 'containers');
            const inputText = this.getElement('inputText', 'inputs');
            if (!chunkPreview || !inputText) return;
            const text = inputText.value || '';
            const trimmed = text.trim();

            if (!trimmed) {
                chunkPreview.innerHTML = '<p class="empty-state">Los chunks apareceran aqui cuando ingreses texto</p>';
                this.updateInputStats(0, 0, 0);
                return;
            }

            try {
                const options = this.buildChunkOptions();
                const method = options.chunkMethod;
                const strategy = ChunkStrategies[method] || ChunkStrategies.paragraph;
                const chunks = strategy.call(ChunkStrategies, trimmed, options) || [];
                this.renderChunkPreview(chunks);
                this.updateInputStats(trimmed.length, trimmed.split(/\s+/).filter(Boolean).length, chunks.length);
            } catch (error) {
                DebugLogger.log(`❌ Error al generar vista previa de chunks: ${error.message}`, 'error');
                chunkPreview.innerHTML = '<p class="empty-state">Error al generar la vista previa de chunking</p>';
                // Conectar con UI para feedback consistente
                UI.toast('❌ Error al generar vista previa de chunks', 'error');
            }
        },

        buildChunkOptions() {
            const defaults = {
                ...(State.pipeline?.options || {})
            };
            const chunkMethodSelect = this.getElement('chunkMethod', 'selects');
            const chunkSizeInput = this.getElement('chunkSize', 'inputs');
            const chunkOverlapInput = this.getElement('chunkOverlap', 'inputs');
            const minChunkSizeInput = this.getElement('minChunkSize', 'inputs');
            const semanticThresholdInput = this.getElement('semanticThreshold', 'inputs');
            const method = chunkMethodSelect?.value || defaults.chunkMethod || 'sentence';
            const chunkSize = parseInt(chunkSizeInput?.value, 10) || defaults.chunkSize || 500;
            const chunkOverlap = parseInt(chunkOverlapInput?.value, 10) || defaults.chunkOverlap || 10;
            const minChunkSize = parseInt(minChunkSizeInput?.value, 10) || defaults.minChunkSize || 100;
            const semanticThreshold = parseFloat(semanticThresholdInput?.value) || defaults.semanticThreshold || 0.75;

            return {
                ...defaults,
                chunkMethod: method,
                chunkSize,
                chunkOverlap,
                minChunkSize,
                semanticThreshold
            };
        },

        renderChunkPreview(chunks = []) {
            const chunkPreview = this.getElement('chunkPreview', 'containers');
            if (!chunkPreview) return;
            if (!Array.isArray(chunks) || chunks.length === 0) {
                chunkPreview.innerHTML = '<p class="empty-state">No se generaron chunks con la configuracion actual</p>';
                return;
            }

            // Calcular estadisticas
            const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
            const avgChars = Math.round(totalChars / chunks.length);
            const minChars = Math.min(...chunks.map(c => c.length));
            const maxChars = Math.max(...chunks.map(c => c.length));
            const totalWords = chunks.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0);
            const avgWords = Math.round(totalWords / chunks.length);

            // Header con estadisticas
            const statsHeader = `
                <div style="background: var(--color-bg-1); padding: 12px; border-radius: var(--radius-base); margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-primary);">${chunks.length}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Total Chunks</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-success);">${avgChars}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Promedio chars</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-info);">${avgWords}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Promedio palabras</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: var(--color-text-secondary);">${minChars} - ${maxChars}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Rango chars</div>
                    </div>
                </div>
            `;

            const maxPreview = 5;
            const previewChunks = chunks.slice(0, maxPreview);
            const items = previewChunks.map((chunk, index) => {
                const words = chunk.split(/\s+/).filter(Boolean).length;
                const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
                const preview = chunk.substring(0, 300);
                const hasMore = chunk.length > 300;
                
                // Barra de progreso visual del tamaño
                const sizePercent = Math.min(100, (chunk.length / maxChars) * 100);
                const colorClass = chunk.length < avgChars * 0.7 ? 'var(--color-warning)' : 
                                chunk.length > avgChars * 1.3 ? 'var(--color-error)' : 
                                'var(--color-success)';
                
                return `
                    <div class="chunk-preview-item" style="border-left: 3px solid ${colorClass}; margin-bottom: 12px; padding: 12px; background: var(--color-surface); border-radius: var(--radius-base);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="color: var(--color-primary);">Chunk ${index + 1}</strong>
                            <div style="display: flex; gap: 12px; font-size: 11px; color: var(--color-text-secondary);">
                                <span>📝 ${chunk.length} chars</span>
                                <span>💬 ${words} palabras</span>
                                <span>📄 ${sentences} oraciones</span>
                            </div>
                        </div>
                        <div style="width: 100%; height: 4px; background: var(--color-bg-2); border-radius: 2px; margin-bottom: 8px; overflow: hidden;">
                            <div style="width: ${sizePercent}%; height: 100%; background: ${colorClass}; transition: width 0.3s;"></div>
                        </div>
                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: var(--color-text);">${Results.escape(preview)}${hasMore ? '<span style="color: var(--color-text-secondary);">...</span>' : ''}</p>
                    </div>
                `;
            }).join('');

            const remainder = chunks.length > maxPreview
                ? `<div style="text-align: center; padding: 12px; background: var(--color-bg-1); border-radius: var(--radius-base); color: var(--color-text-secondary);">
                    ➕ ${chunks.length - maxPreview} chunks adicionales no mostrados
                </div>`
                : '';

            chunkPreview.innerHTML = `${statsHeader}${items}${remainder}`;
        },

        updateInputStats(characters, words, chunks) {
            console.log('🔄 updateInputStats: Iniciando...', { characters, words, chunks, argsLength: arguments.length });
            
            const inputText = this.getElement('inputText', 'inputs');
            const charNode = this.getElement('charCount', 'containers');
            const wordNode = this.getElement('wordCount', 'containers');
            const lineNode = this.getElement('lineCount', 'containers');
            const chunkNode = this.getElement('estimatedChunks', 'containers');
            
            // ✅ DIAGNÓSTICO DETALLADO: Verificar que los elementos existen y son accesibles
            console.log('📋 updateInputStats: Estado de elementos DOM:');
            console.log('  - inputText:', inputText ? `✅ (value: "${inputText.value?.substring(0, 50)}...")` : '❌ NO ENCONTRADO');
            console.log('  - charNode:', charNode ? `✅ (actual: "${charNode.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - wordNode:', wordNode ? `✅ (actual: "${wordNode.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - lineNode:', lineNode ? `✅ (actual: "${lineNode.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - chunkNode:', chunkNode ? `✅ (actual: "${chunkNode.textContent}")` : '❌ NO ENCONTRADO');
            
            // Verificar que los elementos existen
            if (!inputText) {
                console.error('❌ updateInputStats: inputText no encontrado - usando getElementById directo');
                const directInput = document.getElementById('inputText');
                console.log('  - getElementById directo:', directInput ? '✅' : '❌');
            }
            if (!charNode) {
                console.error('❌ updateInputStats: charCount no encontrado - usando getElementById directo');
                const directChar = document.getElementById('charCount');
                console.log('  - getElementById directo:', directChar ? `✅ (actual: "${directChar.textContent}")` : '❌');
                if (directChar) {
                    console.log('  - Estilos:', window.getComputedStyle(directChar).display, window.getComputedStyle(directChar).visibility);
                }
            }
            
            // Si se llama sin argumentos, calcular desde inputText
            if (arguments.length === 0 && inputText) {
                const text = inputText.value || '';
                characters = text.length;
                words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
                const lines = text ? text.split('\n').length : 0;
                
                // Estimar chunks basado en metodo actual
                const method = State.pipeline?.options?.chunkMethod || 'paragraph';
                const chunkSize = State.pipeline?.options?.chunkSize || 500;
                chunks = text.trim() ? Math.ceil(text.length / chunkSize) : 0;
                
                console.log(`📊 updateInputStats: Valores calculados - chars: ${characters}, words: ${words}, lines: ${lines}, chunks: ${chunks}`);
                
                if (charNode) {
                    charNode.textContent = characters.toLocaleString();
                    console.log(`✅ charNode actualizado: "${charNode.textContent}"`);
                } else {
                    const directChar = document.getElementById('charCount');
                    if (directChar) {
                        directChar.textContent = characters.toLocaleString();
                        console.log(`✅ charNode actualizado vía getElementById: "${directChar.textContent}"`);
                    }
                }
                
                if (wordNode) {
                    wordNode.textContent = words.toLocaleString();
                    console.log(`✅ wordNode actualizado: "${wordNode.textContent}"`);
                } else {
                    const directWord = document.getElementById('wordCount');
                    if (directWord) {
                        directWord.textContent = words.toLocaleString();
                        console.log(`✅ wordNode actualizado vía getElementById: "${directWord.textContent}"`);
                    }
                }
                
                if (lineNode) {
                    lineNode.textContent = lines.toLocaleString();
                    console.log(`✅ lineNode actualizado: "${lineNode.textContent}"`);
                } else {
                    const directLine = document.getElementById('lineCount');
                    if (directLine) {
                        directLine.textContent = lines.toLocaleString();
                        console.log(`✅ lineNode actualizado vía getElementById: "${directLine.textContent}"`);
                    }
                }
                
                if (chunkNode) {
                    chunkNode.textContent = chunks.toLocaleString();
                    console.log(`✅ chunkNode actualizado: "${chunkNode.textContent}"`);
                } else {
                    const directChunk = document.getElementById('estimatedChunks');
                    if (directChunk) {
                        directChunk.textContent = chunks.toLocaleString();
                        console.log(`✅ chunkNode actualizado vía getElementById: "${directChunk.textContent}"`);
                    }
                }
                
                return;
            }
            
            // Llamada con argumentos (desde updateChunkPreview)
            console.log(`📊 updateInputStats: Actualizando con argumentos - chars: ${characters}, words: ${words}, chunks: ${chunks}`);
            
            if (charNode) {
                charNode.textContent = characters.toLocaleString();
                console.log(`✅ charNode actualizado: "${charNode.textContent}"`);
            } else {
                const directChar = document.getElementById('charCount');
                if (directChar) {
                    directChar.textContent = characters.toLocaleString();
                    console.log(`✅ charNode actualizado vía getElementById: "${directChar.textContent}"`);
                }
            }
            
            if (wordNode) {
                wordNode.textContent = words.toLocaleString();
                console.log(`✅ wordNode actualizado: "${wordNode.textContent}"`);
            } else {
                const directWord = document.getElementById('wordCount');
                if (directWord) {
                    directWord.textContent = words.toLocaleString();
                    console.log(`✅ wordNode actualizado vía getElementById: "${directWord.textContent}"`);
                }
            }
            
            if (chunkNode) {
                chunkNode.textContent = chunks.toLocaleString();
                console.log(`✅ chunkNode actualizado: "${chunkNode.textContent}"`);
            } else {
                const directChunk = document.getElementById('estimatedChunks');
                if (directChunk) {
                    directChunk.textContent = chunks.toLocaleString();
                    console.log(`✅ chunkNode actualizado vía getElementById: "${directChunk.textContent}"`);
                }
            }
            
            if (lineNode && inputText) {
                const text = inputText.value || '';
                const lines = text ? text.split('\n').length : 0;
                lineNode.textContent = lines.toLocaleString();
                console.log(`✅ lineNode actualizado: "${lineNode.textContent}"`);
            } else {
                const directLine = document.getElementById('lineCount');
                if (directLine && inputText) {
                    const text = inputText.value || '';
                    const lines = text ? text.split('\n').length : 0;
                    directLine.textContent = lines.toLocaleString();
                    console.log(`✅ lineNode actualizado vía getElementById: "${directLine.textContent}"`);
                }
            }
            
            console.log('✅ updateInputStats: Completado');
        },

        updateSegmentationStats(chunks = []) {
            console.log('🔄 updateSegmentationStats: Iniciando...', { chunksCount: chunks?.length || 0 });
            
            const totalChunksEl = this.getElement('totalChunksValue', 'containers');
            const avgCharsEl = this.getElement('avgCharsValue', 'containers');
            const avgWordsEl = this.getElement('avgWordsValue', 'containers');
            const rangeEl = this.getElement('rangeValue', 'containers');
            
            // ✅ DIAGNÓSTICO DETALLADO: Verificar que los elementos existen
            console.log('📋 updateSegmentationStats: Estado de elementos DOM:');
            console.log('  - totalChunksEl:', totalChunksEl ? `✅ (actual: "${totalChunksEl.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - avgCharsEl:', avgCharsEl ? `✅ (actual: "${avgCharsEl.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - avgWordsEl:', avgWordsEl ? `✅ (actual: "${avgWordsEl.textContent}")` : '❌ NO ENCONTRADO');
            console.log('  - rangeEl:', rangeEl ? `✅ (actual: "${rangeEl.textContent}")` : '❌ NO ENCONTRADO');
            
            // Verificar que los elementos existen con getElementById directo si fallan
            if (!totalChunksEl) {
                console.error('❌ updateSegmentationStats: totalChunksValue no encontrado - usando getElementById directo');
                const direct = document.getElementById('totalChunksValue');
                console.log('  - getElementById directo:', direct ? `✅ (actual: "${direct.textContent}")` : '❌');
            }
            
            if (!chunks || chunks.length === 0) {
                console.log('📊 updateSegmentationStats: Sin chunks, estableciendo valores en 0');
                if (totalChunksEl) {
                    totalChunksEl.textContent = '0';
                    console.log(`✅ totalChunksEl actualizado: "${totalChunksEl.textContent}"`);
                } else {
                    const direct = document.getElementById('totalChunksValue');
                    if (direct) {
                        direct.textContent = '0';
                        console.log(`✅ totalChunksEl actualizado vía getElementById: "${direct.textContent}"`);
                    }
                }
                
                if (avgCharsEl) {
                    avgCharsEl.textContent = '0';
                    console.log(`✅ avgCharsEl actualizado: "${avgCharsEl.textContent}"`);
                } else {
                    const direct = document.getElementById('avgCharsValue');
                    if (direct) {
                        direct.textContent = '0';
                        console.log(`✅ avgCharsEl actualizado vía getElementById: "${direct.textContent}"`);
                    }
                }
                
                if (avgWordsEl) {
                    avgWordsEl.textContent = '0';
                    console.log(`✅ avgWordsEl actualizado: "${avgWordsEl.textContent}"`);
                } else {
                    const direct = document.getElementById('avgWordsValue');
                    if (direct) {
                        direct.textContent = '0';
                        console.log(`✅ avgWordsEl actualizado vía getElementById: "${direct.textContent}"`);
                    }
                }
                
                if (rangeEl) {
                    rangeEl.textContent = '0 - 0';
                    console.log(`✅ rangeEl actualizado: "${rangeEl.textContent}"`);
                } else {
                    const direct = document.getElementById('rangeValue');
                    if (direct) {
                        direct.textContent = '0 - 0';
                        console.log(`✅ rangeEl actualizado vía getElementById: "${direct.textContent}"`);
                    }
                }
                return;
            }
            
            // Calcular estadísticas
            const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
            const avgChars = Math.round(totalChars / chunks.length);
            const minChars = Math.min(...chunks.map(c => c.length));
            const maxChars = Math.max(...chunks.map(c => c.length));
            const totalWords = chunks.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0);
            const avgWords = Math.round(totalWords / chunks.length);
            
            console.log(`📊 updateSegmentationStats: Valores calculados - total: ${chunks.length}, avgChars: ${avgChars}, avgWords: ${avgWords}, range: ${minChars}-${maxChars}`);
            
            // Actualizar elementos
            if (totalChunksEl) {
                totalChunksEl.textContent = chunks.length.toLocaleString();
                console.log(`✅ totalChunksEl actualizado: "${totalChunksEl.textContent}"`);
            } else {
                const direct = document.getElementById('totalChunksValue');
                if (direct) {
                    direct.textContent = chunks.length.toLocaleString();
                    console.log(`✅ totalChunksEl actualizado vía getElementById: "${direct.textContent}"`);
                }
            }
            
            if (avgCharsEl) {
                avgCharsEl.textContent = avgChars.toLocaleString();
                console.log(`✅ avgCharsEl actualizado: "${avgCharsEl.textContent}"`);
            } else {
                const direct = document.getElementById('avgCharsValue');
                if (direct) {
                    direct.textContent = avgChars.toLocaleString();
                    console.log(`✅ avgCharsEl actualizado vía getElementById: "${direct.textContent}"`);
                }
            }
            
            if (avgWordsEl) {
                avgWordsEl.textContent = avgWords.toLocaleString();
                console.log(`✅ avgWordsEl actualizado: "${avgWordsEl.textContent}"`);
            } else {
                const direct = document.getElementById('avgWordsValue');
                if (direct) {
                    direct.textContent = avgWords.toLocaleString();
                    console.log(`✅ avgWordsEl actualizado vía getElementById: "${direct.textContent}"`);
                }
            }
            
            if (rangeEl) {
                rangeEl.textContent = `${minChars} - ${maxChars}`;
                console.log(`✅ rangeEl actualizado: "${rangeEl.textContent}"`);
            } else {
                const direct = document.getElementById('rangeValue');
                if (direct) {
                    direct.textContent = `${minChars} - ${maxChars}`;
                    console.log(`✅ rangeEl actualizado vía getElementById: "${direct.textContent}"`);
                }
            }
            
            console.log('✅ updateSegmentationStats: Completado');
        },

        scheduleChunkPreviewUpdate() {
            clearTimeout(this.chunkPreviewDebounce);
            this.chunkPreviewDebounce = setTimeout(() => this.updateChunkPreview(), 150);
        },

        updateChunkPreview() {
            console.log('🔄 updateChunkPreview: Iniciando...');
            const chunkPreview = this.getElement('chunkPreview', 'containers');
            const inputText = this.getElement('inputText', 'inputs');
            
            if (!chunkPreview) {
                console.error('❌ updateChunkPreview: chunkPreview no encontrado');
                return;
            }
            
            if (!inputText) {
                console.warn('⚠️ updateChunkPreview: inputText no encontrado');
            }
            
            const text = inputText?.value || '';
            const trimmed = text.trim();

            if (!trimmed) {
                console.log('📝 updateChunkPreview: Texto vacío, mostrando estado vacío');
                chunkPreview.innerHTML = '<p class="empty-state">Los chunks aparecerán aquí cuando ingreses texto</p>';
                this.updateInputStats(0, 0, 0);
                this.updateSegmentationStats([]);
                return;
            }

            // Verificar que ChunkStrategies está disponible
            if (!window.ChunkStrategies) {
                console.error('❌ updateChunkPreview: ChunkStrategies no disponible en window');
                chunkPreview.innerHTML = '<p class="empty-state">Error: ChunkStrategies no está disponible</p>';
                return;
            }

            try {
                console.log('🔧 updateChunkPreview: Construyendo opciones...');
                const options = this.buildChunkOptions();
                const method = options.chunkMethod;
                console.log(`📊 updateChunkPreview: Método seleccionado: ${method}`);
                
                const strategy = window.ChunkStrategies[method] || window.ChunkStrategies.paragraph;
                if (!strategy) {
                    console.error(`❌ updateChunkPreview: Estrategia ${method} no encontrada en ChunkStrategies`);
                    chunkPreview.innerHTML = '<p class="empty-state">Error: Estrategia de chunking no encontrada</p>';
                    return;
                }
                
                console.log('⚙️ updateChunkPreview: Ejecutando estrategia de chunking...');
                const chunks = strategy.call(window.ChunkStrategies, trimmed, options) || [];
                console.log(`✅ updateChunkPreview: ${chunks.length} chunks generados`);
                
                this.renderChunkPreview(chunks);
                this.updateInputStats(trimmed.length, trimmed.split(/\s+/).filter(Boolean).length, chunks.length);
                this.updateSegmentationStats(chunks);
                console.log('✅ updateChunkPreview: Completado exitosamente');
            } catch (error) {
                console.error('❌ updateChunkPreview: Error completo:', error);
                console.error('Stack trace:', error.stack);
                window.DebugLogger?.log(`❌ Error al generar vista previa de chunks: ${error.message}`, 'error');
                chunkPreview.innerHTML = '<p class="empty-state">Error al generar la vista previa de chunking</p>';
                UI.toast('❌ Error al generar vista previa de chunks', 'error');
            }
        },

        buildChunkOptions() {
            const defaults = {
                ...(window.State?.pipeline?.options || {})
            };
            const chunkMethodSelect = this.getElement('chunkMethod', 'selects');
            const chunkSizeInput = this.getElement('chunkSize', 'inputs');
            const chunkOverlapInput = this.getElement('chunkOverlap', 'inputs');
            const minChunkSizeInput = this.getElement('minChunkSize', 'inputs');
            const semanticThresholdInput = this.getElement('semanticThreshold', 'inputs');
            
            const method = chunkMethodSelect?.value || defaults.chunkMethod || 'sentence';
            const chunkSize = parseInt(chunkSizeInput?.value, 10) || defaults.chunkSize || 500;
            const chunkOverlap = parseInt(chunkOverlapInput?.value, 10) || defaults.chunkOverlap || 10;
            const minChunkSize = parseInt(minChunkSizeInput?.value, 10) || defaults.minChunkSize || 100;
            const semanticThreshold = parseFloat(semanticThresholdInput?.value) || defaults.semanticThreshold || 0.75;

            return {
                ...defaults,
                chunkMethod: method,
                chunkSize,
                chunkOverlap,
                minChunkSize,
                semanticThreshold
            };
        },

        renderChunkPreview(chunks = []) {
            const chunkPreview = this.getElement('chunkPreview', 'containers');
            if (!chunkPreview) return;
            if (!Array.isArray(chunks) || chunks.length === 0) {
                chunkPreview.innerHTML = '<p class="empty-state">No se generaron chunks con la configuración actual</p>';
                return;
            }

            // Calcular estadísticas
            const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
            const avgChars = Math.round(totalChars / chunks.length);
            const minChars = Math.min(...chunks.map(c => c.length));
            const maxChars = Math.max(...chunks.map(c => c.length));
            const totalWords = chunks.reduce((sum, c) => sum + c.split(/\s+/).filter(Boolean).length, 0);
            const avgWords = Math.round(totalWords / chunks.length);

            // Header con estadísticas
            const statsHeader = `
                <div style="background: var(--color-bg-1); padding: 12px; border-radius: var(--radius-base); margin-bottom: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-primary);">${chunks.length}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Total Chunks</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-success);">${avgChars}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Promedio Chars</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: var(--color-info);">${avgWords}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Promedio Palabras</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 16px; font-weight: bold; color: var(--color-text-secondary);">${minChars}-${maxChars}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Rango</div>
                    </div>
                </div>
            `;

            // Mostrar solo los primeros 5 chunks
            const displayLimit = 5;
            const items = chunks.slice(0, displayLimit).map((chunk, i) => {
                const preview = chunk.length > 150 ? chunk.substring(0, 150) + '...' : chunk;
                const words = chunk.split(/\s+/).filter(Boolean).length;
                return `
                    <div style="margin-bottom: 12px; padding: 12px; background: var(--color-bg-2); border-left: 3px solid var(--color-primary); border-radius: var(--radius-base);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <strong style="font-size: 12px; color: var(--color-primary);">Chunk ${i + 1}</strong>
                            <span style="font-size: 11px; color: var(--color-text-secondary);">${chunk.length} chars · ${words} palabras</span>
                        </div>
                        <p style="margin: 0; font-size: 13px; line-height: 1.4; color: var(--color-text-secondary);">${this.escapeHtml(preview)}</p>
                    </div>
                `;
            }).join('');

            const remainder = chunks.length > displayLimit
                ? `<p style="text-align: center; color: var(--color-text-secondary); font-size: 12px; margin-top: 12px;">... y ${chunks.length - displayLimit} chunks más</p>`
                : '';

            chunkPreview.innerHTML = `${statsHeader}${items}${remainder}`;
            
            // Actualizar estadísticas de segmentación después de renderizar
            this.updateSegmentationStats(chunks);
        },

        updateChunkMethodHelp(method = 'paragraph') {
            const methodHelpContent = this.getElement('methodHelpContent', 'containers');
            const methodHelpText = this.getElement('methodHelpText', 'containers');
            if (!methodHelpContent || !methodHelpText) return;
            const helpTexts = {
                langchain: '⭐ RecursiveCharacterTextSplitter de LangChain. Segmentación recursiva con separadores priorizados. RECOMENDADO para uso general.',
                chapter: '📖 Detecta capítulos con patrones multiidioma (Capítulo, Chapter, etc.). Usa detectChapters() con regex avanzados.',
                scene: '🎬 Identifica cambios de escena por pausas largas (3+ líneas vacías). Método scene() para narrativa.',
                dialogue: '💬 Segmenta por diálogos y cambios de speaker. Detecta patrones "Nombre:" y comillas. Ideal para conversaciones y libros con diálogos.',
                paragraph: '📄 División por párrafos (doble salto de línea). Método paragraph() simple y efectivo.',
                sentence: '✏️ Divide por oraciones usando puntuación (.!?). Método sentence() para Q/A cortas.',
                headers: '📑 Usa encabezados Markdown (#, ##) para estructurar. Método headers() para documentación.',
                semantic: '🔍 Similitud Jaccard (intersección/unión de palabras). Método semantic() con threshold configurable.',
                tfidf: '🧮 TF-IDF + Cosine Similarity para detectar cambios semánticos reales. Método tfidf() con vectores y threshold adaptativo.',
                topic: '🎯 Agrupa por keywords compartidas (overlap). Método topic() para contenido temático.',
                nlp: '🧠 Usa compromise.js para análisis lingüístico. Método chunkWithSpacy() con entidades y contexto.',
                fixed: '📏 Tamaño fijo en caracteres. Método fixed() con overlap configurable.',
                wordlist: '📝 Una línea = un término. Método wordlist() para vocabulario.',
                none: '📋 JSON pre-segmentado con estructura {chunks: [...]}. Método none() sin procesamiento.'
            };
            methodHelpContent.textContent = helpTexts[method] || 'Selecciona el método de segmentación ideal para tu contenido.';
            methodHelpText.style.display = 'block';
        },

        updateChunkControls() {
            const chunkMethodSelect = this.getElement('chunkMethod', 'selects');
            const chunkSizeGroup = this.getElement('chunkSizeGroup', 'containers');
            const overlapGroup = this.getElement('overlapGroup', 'containers');
            const minChunkSizeGroup = this.getElement('minChunkSizeGroup', 'containers');
            const semanticOptions = this.getElement('semanticOptions', 'containers');
            const manualContextGroup = this.getElement('manualContextGroup', 'containers');
            
            const method = chunkMethodSelect?.value || 'paragraph';
            const hideSizeControls = ['wordlist', 'none'];
            const showSemantic = ['semantic', 'topic', 'nlp', 'tfidf'];
            const showManualContext = ['wordlist', 'none'];

            this.toggleGroup(chunkSizeGroup, !hideSizeControls.includes(method));
            this.toggleGroup(overlapGroup, !hideSizeControls.includes(method));
            this.toggleGroup(minChunkSizeGroup, showSemantic.includes(method));
            this.toggleGroup(semanticOptions, showSemantic.includes(method));
            this.toggleGroup(manualContextGroup, showManualContext.includes(method));
        },

        toggleGroup(element, shouldShow) {
            if (!element) return;
            element.style.display = shouldShow ? '' : 'none';
        },

        populateApiConfig() {
            if (!State?.config?.api) return;
            const apiProfile = this.getElement('apiProfile', 'selects');
            const apiEndpoint = this.getElement('apiEndpoint', 'inputs');
            const apiKey = this.getElement('apiKey', 'inputs');
            const modelName = this.getElement('modelName', 'inputs');
            if (apiProfile) apiProfile.value = State.config.api.profile || 'local';
            if (apiEndpoint) apiEndpoint.value = State.config.api.endpoint || '';
            if (apiKey) apiKey.value = State.config.api.key || '';
            if (modelName) modelName.value = State.config.api.model || '';
        },

        collectApiConfig() {
            const apiProfile = this.getElement('apiProfile', 'selects');
            const apiEndpoint = this.getElement('apiEndpoint', 'inputs');
            const apiKey = this.getElement('apiKey', 'inputs');
            const modelName = this.getElement('modelName', 'inputs');
            return {
                profile: apiProfile?.value || State.config.api.profile,
                endpoint: apiEndpoint?.value?.trim() || State.config.api.endpoint,
                key: apiKey?.value?.trim() || '',
                model: modelName?.value?.trim() || State.config.api.model
            };
        },

        applyApiConfig(newConfig) {
            if (!newConfig) return;
            State.config.api.profile = newConfig.profile || State.config.api.profile;
            State.config.api.endpoint = newConfig.endpoint || State.config.api.endpoint;
            State.config.api.key = newConfig.key || '';
            State.config.api.model = newConfig.model || State.config.api.model;
            DebugLogger.log(`⚙️ API config aplicada (${State.config.api.profile})`, 'info');
        },

        async handleApiTest() {
            // ✅ FIX: Delegar en API.test() para evitar duplicación
            const button = this.getElement('testApiBtn', 'buttons');
            const originalText = button?.innerText;
            if (button) {
                button.disabled = true;
                button.innerText = '⏳ Probando...';
            }
            
            // Recoger y aplicar configuracion
            const config = this.collectApiConfig();
            this.applyApiConfig(config);
            
            DebugLogger.log('🔍 Iniciando prueba de conexion API (delegando a API.test)…', 'info');
            
            try {
                // ✅ Delegar la lógica completa de prueba al módulo API
                await API.test();
            } finally {
                if (button) {
                    button.disabled = false;
                    button.innerText = originalText || 'Probar API LLM';
                }
            }
        },

        async handleSpacyTest() {
            const button = this.getElement('testSpacyBtn', 'buttons');
            const originalText = button?.innerText;
            if (button) {
                button.disabled = true;
                button.innerText = '⏳ Probando...';
            }
            const startTime = performance.now();
            DebugLogger.log('🧠 Iniciando prueba de conexion spaCy…', 'info');
            
            try {
                const response = await fetch('http://localhost:8000/test-connection');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                const duration = Math.round(performance.now() - startTime);
                
                if (data.success) {
                    UI.updateElement('spacyStatus', `
                        <div class="stat-item">
                            <span class="stat-label">Estado spaCy</span>
                            <span class="stat-value" style="font-size: 14px; color: var(--color-success);">✅ Conectado</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Latencia</span>
                            <span class="stat-value" style="font-size: 14px;">${duration}ms</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Modelos</span>
                            <span class="stat-value" style="font-size: 14px;">${data.models_loaded.join(', ')}</span>
                        </div>
                    `);
                    UI.toast(`✅ ${data.message}`);
                    DebugLogger.log(`🌐 Servidor spaCy conectado (latencia ${duration}ms)`, 'success');
                    DebugLogger.log(`📦 Modelos cargados: ${data.models_loaded.join(', ')}`, 'info');
                } else {
                    throw new Error(data.message || 'Error desconocido');
                }
            } catch (error) {
                const duration = Math.round(performance.now() - startTime);
                UI.updateElement('spacyStatus', `
                    <div class="stat-item">
                        <span class="stat-label">Estado spaCy</span>
                        <span class="stat-value" style="font-size: 14px; color: var(--color-error);">❌ Error</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Latencia</span>
                        <span class="stat-value" style="font-size: 14px;">${duration}ms</span>
                    </div>
                `);
                UI.toast('❌ Error de conexion con servidor spaCy', 'error');
                DebugLogger.log(`❌ Error al conectar con spaCy: ${error.message}`, 'error');
                DebugLogger.log('💡 Asegurate de que el servidor este corriendo: uvicorn server:app --reload', 'warning');
            } finally {
                if (button) {
                    button.disabled = false;
                    button.innerText = originalText || 'Probar spaCy';
                }
            }
        },

        handleApiSave() {
            try {
                const config = this.collectApiConfig();
                this.applyApiConfig(config);
                
                // Sincronizar con pasos del pipeline que usan la API
                this.syncConfigToPipeline();
                
                Storage.save();
                UI.toast('✅ Configuracion guardada');
                DebugLogger.log('✅ Configuracion guardada y sincronizada con pipeline', 'success');
            } catch (error) {
                DebugLogger.log(`❌ Error guardando configuracion API: ${error.message}`, 'error');
                UI.toast('❌ No se pudo guardar la configuracion', 'error');
            }
        },
        
        syncConfigToPipeline() {
            // Sincronizar configuracion de API con pasos del pipeline
            if (!State.pipeline.steps) return;
            
            State.pipeline.steps.forEach(step => {
                if (step.id === 'generate' && step.config) {
                    // Actualizar configuracion del paso de generacion
                    step.config.apiEndpoint = State.config.api.endpoint;
                    step.config.apiModel = State.config.api.model;
                    step.config.apiKey = State.config.api.key;
                }
            });
            
            DebugLogger.log('🔄 Configuracion sincronizada con pipeline', 'info');
        },

        ensureToastContainer() {
            if (this.toastContainer) return;
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '8px';
            container.style.zIndex = '2000';
            document.body.appendChild(container);
            this.toastContainer = container;
        }
    };

    if (typeof window !== 'undefined') {
        window.__flashgenUI = UI;
    }

    UI.openTemplateImportDialog = function () {
        // ✅ Crear input de archivo para importar plantillas
        const input = document.createElement('input');
        input.type = 'file';
        input.id = `templateImportInput_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        input.name = input.id;
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) {
                Templates.importAll(file);
            }
        };
        input.click();
    };

    UI.download = function (filename, content, mimeType = 'text/plain') {
        // ✅ FIX: Método helper para descargar archivos con validación
        try {
            // Asegurar que content sea string
            const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            
            const blob = new Blob([contentStr], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // Limpiar después de un breve delay
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            DebugLogger.log(`✅ Descarga iniciada: ${filename}`, 'success');
        } catch (error) {
            DebugLogger.log(`❌ Error en download: ${error.message}`, 'error');
            UI.toast(`❌ Error al descargar: ${error.message}`, 'error');
        }
    };

// Exports
export { UI };
export default UI;
